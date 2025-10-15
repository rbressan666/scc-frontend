import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { ArrowLeft, Calendar as CalendarIcon } from 'lucide-react';
import api from '../services/api';
import MainLayout from '../components/MainLayout';

// labels auxiliares


function fmtTime(t){ return t?.slice(0,5) || ''; }

export default function PlanningPageV2(){
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [week, setWeek] = useState({ weekStart: '', days: [], shifts: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // form state: per-day start/end and continuous flag
  const [continuous, setContinuous] = useState(false);
  // interação de seleção por arraste
  const [sel, setSel] = useState({ active:false, dayIndex:null, startMin:0, endMin:0 });

  const loadUsers = useCallback(async()=>{
    try{
      const res = await api.get('/api/users?includeInactive=false');
      const list = (res.data || res || []).map(u => ({ id: u.id, name: u.nome_completo }));
      setUsers(list);
      if(list.length && !selectedUser){ setSelectedUser(list[0].id); }
    }catch(e){ setError(e?.message||'Erro ao carregar usuários'); }
  },[selectedUser]);

  const loadWeek = useCallback(async(start)=>{
    try{
      setLoading(true); setError('');
      // Sempre carregar todos os usuários da semana; o usuário selecionado é apenas para salvar/lançar
      const q = new URLSearchParams(); if(start) q.set('start', start);
      const qs = q.toString();
      const url = `/api/planning/week${qs ? `?${qs}` : ''}`;
      const res = await api.get(url);
      setWeek(res);
    }catch(e){ setError(e?.message||'Erro ao carregar semana'); }
    finally{ setLoading(false); }
  },[]);

  // Tentar bootstrap se houve erro 500 ao carregar a semana
  useEffect(()=>{
    if(error && error.includes('500')){
      (async()=>{
        try{
          await api.post('/api/planning/_bootstrap', {});
          await loadWeek();
          setError('');
  }catch{ /* se falhar, mantém o erro exibido */ }
      })();
    }
  },[error, loadWeek]);

  useEffect(()=>{ loadUsers(); },[loadUsers]);
  useEffect(()=>{ loadWeek(); },[loadWeek]);

  // salvar conforme modo (contínuo -> regra semanal; pontual -> shift da data)
  const saveByMode = async (dayIso, startMin, endMin)=>{
    try{
      setError('');
      if(!selectedUser) throw new Error('Selecione um usuário');
      const startTime = minutesToHHMM(startMin);
      const endTime = minutesToHHMM(endMin);
      // alerta >9h
      const spanHrs = endMin > startMin ? (endMin-startMin)/60 : ((1440 - startMin + endMin)/60);
      if(spanHrs > 9) alert(`Atenção: duração longa (${spanHrs.toFixed(1)}h).`);
      if(continuous){
        const dow = new Date(dayIso+'T00:00:00Z').getUTCDay();
        await api.post('/api/planning/rules', { userId: selectedUser, dayOfWeek: dow, startTime, endTime, continuous: true });
      } else {
        await api.post('/api/planning/shifts', { userId: selectedUser, date: dayIso, startTime, endTime });
      }
      await loadWeek(week.weekStart);
    }catch(e){ setError(e?.message||'Falha ao salvar planejamento'); }
  };

  const removeShift = async (id)=>{
    try{ await api.delete(`/api/planning/shifts/${id}`); await loadWeek(week.weekStart); }
    catch(e){ setError(e?.message||'Falha ao remover'); }
  };

  const navigateWeek = async (delta)=>{
    // delta in days: -7 previous, +7 next
    if(!week.weekStart) return;
    const d = new Date(week.weekStart); d.setDate(d.getDate()+delta);
    await loadWeek(d.toISOString().slice(0,10));
  };

  // Build hourly grid from 12:00 to next-day 12:00 (24h window)
  const ROW_H = 32; // px per hour
  const hours = useMemo(()=> Array.from({length:25}, (_,i)=> (12+i)%24 ),[]);
  const totalHeight = useMemo(()=> 24 * ROW_H, [ROW_H]);

  const dayHeaderLabels = ['Quarta','Quinta','Sexta','Sábado','Domingo','Segunda','Terça'];

  const toMinutes = (t)=>{ const [h,m] = t.split(':').map(Number); return h*60+m; };
  const minutesFromNoon = (m)=>{ // map minutes-of-day (0..1439) to offset from 12:00 within 0..1440
    const ref = 12*60;
    const diff = m - ref;
    return (diff < 0 ? diff + 1440 : diff);
  };
  const prevIso = (iso)=>{
    const d = new Date(iso+'T00:00:00Z'); d.setUTCDate(d.getUTCDate()-1); return d.toISOString().slice(0,10);
  };

  // Mapa de cores por usuário (legenda e barras)
  const colorPalette = useMemo(()=>['#3b82f6','#ef4444','#10b981','#f59e0b','#8b5cf6','#ec4899','#06b6d4','#84cc16','#a855f7','#fb7185'],[]);
  const userColorMap = useMemo(()=>{
    const map = new Map();
    users.forEach((u, idx)=> map.set(u.id, colorPalette[idx % colorPalette.length]));
    return map;
  },[users, colorPalette]);

  const fmtDayHeader = (iso)=>{
    try{
      const d = new Date(iso+'T00:00:00Z');
      const label = d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
      return label;
    }catch{ return iso; }
  };

  // Cores: atribuir cor não usada ao selecionar usuário
  const [overrideColors, setOverrideColors] = useState({});
  useEffect(()=>{
    if(!selectedUser) return;
    const used = new Set();
    week.shifts.forEach(s=>{ used.add(userColorMap.get(s.user_id)); });
    // se o selecionado já tem cor não usada, mantém; senão define a primeira não utilizada
    const current = userColorMap.get(selectedUser);
    if(!used.has(current)) return; // já é não usada
    const candidate = colorPalette.find(c=> !used.has(c));
    if(candidate){ setOverrideColors(prev=> ({...prev, [selectedUser]: candidate})); }
  },[selectedUser, week.shifts, colorPalette, userColorMap]);

  const finalColor = (userId)=> overrideColors[userId] || userColorMap.get(userId) || '#3b82f6';

  // Helpers conversão
  const minutesToHHMM = (m)=> `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
  const yToMinutesOfDay = (y, colHeight)=> {
    let offset = Math.max(0, Math.min(colHeight, y)) / colHeight * 1440; // 0..1440 a partir das 12:00
    let m = Math.round(offset);
    return (m + 12*60) % 1440; // volta para 00..1439 minutos do dia
  };
  const minutesToY = (m, colHeight)=> (minutesFromNoon(m)/1440) * colHeight;

  // Handlers de interação por arraste
  const onDayMouseDown = (ci, e)=>{
    try{
      if(!selectedUser) return alert('Selecione um usuário');
      const rect = e.currentTarget.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const m = yToMinutesOfDay(y, rect.height);
      setSel({ active:true, dayIndex:ci, startMin:m, endMin:m });
  }catch{ /* noop */ }
  };
  const onDayMouseMove = (ci, e)=>{
    if(!sel.active || sel.dayIndex !== ci) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const m = yToMinutesOfDay(y, rect.height);
    setSel(prev=> ({ ...prev, endMin:m }));
  };
  const finishSelection = async ()=>{
    const { active, dayIndex, startMin, endMin } = sel;
    if(!active) return;
    const dayIso = week.days[dayIndex];
    if(!dayIso){ setSel({active:false, dayIndex:null, startMin:0, endMin:0}); return; }
    // normaliza
    const s = startMin;
    const e = endMin;
    await saveByMode(dayIso, s, e);
    setSel({active:false, dayIndex:null, startMin:0, endMin:0});
  };
  const onDayMouseUp = (ci)=>{ if(sel.active && sel.dayIndex===ci) finishSelection(); };

  // Edição de turnos (drag/resize)
  const [drag, setDrag] = useState({ id:null, mode:null, startMin:0, endMin:0, dayIndex:null, startY:0 });
  const startDrag = (e, s, ci, mode)=>{
    e.stopPropagation();
    const rect = e.currentTarget.parentElement.getBoundingClientRect();
    const y = e.clientY - rect.top;
    setDrag({ id: s.id, mode, startMin: toMinutes(fmtTime(s.start_time)), endMin: toMinutes(fmtTime(s.end_time)), dayIndex: ci, startY: y });
  };
  const onDragMove = (ci, e)=>{
    if(!drag.id || drag.dayIndex!==ci) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const delta = y - drag.startY;
    const deltaMin = Math.round(delta / rect.height * 1440);
    setDrag(prev=>{
      if(prev.mode==='move'){
        let s = (prev.startMin + deltaMin + 1440) % 1440;
        let ee = (prev.endMin + deltaMin + 1440) % 1440;
        return { ...prev, curStart:s, curEnd:ee };
      }
      if(prev.mode==='resize-start'){
        let s = (prev.startMin + deltaMin + 1440) % 1440;
        return { ...prev, curStart:s };
      }
      if(prev.mode==='resize-end'){
        let ee = (prev.endMin + deltaMin + 1440) % 1440;
        return { ...prev, curEnd:ee };
      }
      return prev;
    });
  };
  const endDrag = async ()=>{
    if(!drag.id) return;
    const s = drag.curStart ?? drag.startMin;
    const e = drag.curEnd ?? drag.endMin;
    try{
      await api.put(`/api/planning/shifts/${drag.id}`, { startTime: minutesToHHMM(s), endTime: minutesToHHMM(e) });
      await loadWeek(week.weekStart);
    }catch(err){ setError(err?.message||'Falha ao atualizar'); }
    finally{ setDrag({ id:null, mode:null, startMin:0, endMin:0, dayIndex:null, startY:0 }); }
  };

  const headerEl = (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Voltar</span>
                </Button>
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-600 text-white p-2 rounded-lg">
                    <CalendarIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Planejamento Semanal</h1>
                    <p className="text-sm text-gray-500">Defina regras e turnos pontuais</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button onClick={()=>navigateWeek(-7)} variant="outline" size="sm">◀ Semana anterior</Button>
                <div className="text-sm text-gray-700">
                  {week.days?.length ? `Semana de ${fmtDayHeader(week.days[0])} a ${fmtDayHeader(week.days[6])}` : ''}
                </div>
                <Button onClick={()=>navigateWeek(+7)} variant="outline" size="sm">Próxima semana ▶</Button>
              </div>
        </div>
      </div>
    </div>
  );

  return (
    <MainLayout customHeader={headerEl}>
      <div className="space-y-4">

          {/* Controles principais: Usuário e Contínuo */}
          <div className="flex items-center gap-4 bg-white p-3 rounded border">
            <div className="flex items-center gap-2">
              <label className="text-sm">Usuário</label>
              <select value={selectedUser} onChange={e=>setSelectedUser(e.target.value)} className="border p-1 rounded">
                <option value="" disabled>Selecione…</option>
                {users.map(u=> <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm">Contínuo</label>
              <input type="checkbox" checked={continuous} onChange={e=>setContinuous(e.target.checked)} />
            </div>
            {selectedUser && (
              <div className="flex items-center gap-2 text-sm">
                <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: finalColor(selectedUser) }}></span>
                <span>Cor de {users.find(u=>u.id===selectedUser)?.name || ''}</span>
              </div>
            )}
          </div>
  {error && <div className="text-red-600">{error}</div>}
  {loading && <div>Carregando...</div>}

        {/* Calendário semanal (primeiro bloco) */}
        <div className="overflow-auto">
          <div className="min-w-[900px]">
            <div className="grid" style={{ gridTemplateColumns: `100px repeat(7, 1fr)` }}>
              {/* cabeçalhos */}
              <div></div>
              {week.days.map((_,i)=> (
                <div key={i} className="text-center font-medium border-l py-2">{dayHeaderLabels[i] || ''}</div>
              ))}
              {/* coluna de horários (12:00 -> 12:00) */}
              <div className="relative border-t" style={{ height: totalHeight }}>
                {hours.slice(0,24).map((h,idx)=> (
                  <div key={idx} className="text-xs text-right pr-2 border-b" style={{ height: ROW_H }}>
                    {String(h).padStart(2,'0')}:00
                  </div>
                ))}
              </div>
              {/* colunas dos dias */}
              {week.days.map((d,ci)=> (
                <div key={ci}
                  className="relative border-l border-t select-none"
                  style={{ height: totalHeight, backgroundImage: `repeating-linear-gradient(to bottom, #e5e7eb 0, #e5e7eb 1px, transparent 1px, transparent ${ROW_H}px)` }}
                  onMouseDown={(e)=>onDayMouseDown(ci, e)}
                  onMouseMove={(e)=>onDayMouseMove(ci, e)}
                  onMouseUp={(e)=>onDayMouseUp(ci, e)}
                >
                  {/* Blocos do próprio dia */}
                  {week.shifts.filter(s=> s.date===d).map(s=>{
                    const startM = toMinutes(fmtTime(s.start_time));
                    const endM = toMinutes(fmtTime(s.end_time));
                    const spans = s.spans_next_day;
                    const top = (minutesFromNoon(startM)/1440) * totalHeight;
                    const durMin = spans ? (1440 - startM) : Math.max(0, endM - startM);
                    const height = Math.max(8, (durMin/1440) * totalHeight);
                    const color = finalColor(s.user_id);
                    return (
                      <div key={`${s.id}-a`} className="absolute left-1 right-1 rounded group" style={{ top, height, backgroundColor: color, opacity: 0.9 }} title={`${s.user_name} ${fmtTime(s.start_time)}-${fmtTime(s.end_time)}`} onMouseDown={(e)=>startDrag(e,s,ci,'move')} onMouseMove={(e)=>onDragMove(ci,e)} onMouseUp={endDrag}>
                        <span className="text-[10px] text-white pl-1">{s.user_name}</span>
                        <button onClick={(e)=>{e.stopPropagation(); removeShift(s.id);}} className="absolute right-1 top-1 text-[10px] text-white">x</button>
                        {/* handles */}
                        <div onMouseDown={(e)=>startDrag(e,s,ci,'resize-start')} className="absolute left-0 top-0 w-full h-2 cursor-n-resize opacity-0 group-hover:opacity-100"></div>
                        <div onMouseDown={(e)=>startDrag(e,s,ci,'resize-end')} className="absolute left-0 bottom-0 w-full h-2 cursor-s-resize opacity-0 group-hover:opacity-100"></div>
                      </div>
                    );
                  })}
                  {/* Blocos que vêm do dia anterior e atravessam a meia-noite */}
                  {week.shifts.filter(s=> s.spans_next_day && s.date===prevIso(d)).map(s=>{
                    const endM = toMinutes(fmtTime(s.end_time));
                    const top = (minutesFromNoon(0)/1440) * totalHeight; // início às 00:00
                    const durMin = endM; // até end
                    const height = Math.max(8, (durMin/1440) * totalHeight);
                    const color = finalColor(s.user_id);
                    return (
                      <div key={`${s.id}-b`} className="absolute left-1 right-1 rounded group" style={{ top, height, backgroundColor: color, opacity: 0.9 }} title={`${s.user_name} 00:00-${fmtTime(s.end_time)}`} onMouseDown={(e)=>startDrag(e,s,ci,'move')} onMouseMove={(e)=>onDragMove(ci,e)} onMouseUp={endDrag}>
                        <span className="text-[10px] text-white pl-1">{s.user_name}</span>
                        <button onClick={(e)=>{e.stopPropagation(); removeShift(s.id);}} className="absolute right-1 top-1 text-[10px] text-white">x</button>
                        {/* handles */}
                        <div onMouseDown={(e)=>startDrag(e,s,ci,'resize-start')} className="absolute left-0 top-0 w-full h-2 cursor-n-resize opacity-0 group-hover:opacity-100"></div>
                        <div onMouseDown={(e)=>startDrag(e,s,ci,'resize-end')} className="absolute left-0 bottom-0 w-full h-2 cursor-s-resize opacity-0 group-hover:opacity-100"></div>
                      </div>
                    );
                  })}
                  {/* seleção por arraste */}
                  {sel.active && sel.dayIndex===ci && (
                    (()=>{
                      const sY = minutesToY(sel.startMin, totalHeight);
                      const eY = minutesToY(sel.endMin, totalHeight);
                      const top = Math.min(sY, eY);
                      const height = Math.max(2, Math.abs(eY - sY));
                      const color = selectedUser ? finalColor(selectedUser) : '#3b82f6';
                      return <div className="absolute left-1 right-1 rounded border" style={{ top, height, backgroundColor: color+'33', borderColor: color }}></div>;
                    })()
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

  {/* Legenda por usuário próxima do calendário */}
        <div className="flex items-center gap-3 flex-wrap">
          {users.map(u=> (
            <div key={u.id} className="flex items-center gap-1 text-sm">
              <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: finalColor(u.id) }}></span>
              <span>{u.name}</span>
            </div>
          ))}
        </div>

      </div>
    </MainLayout>
  );
}
