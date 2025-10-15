import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { ArrowLeft, Calendar as CalendarIcon } from 'lucide-react';
import api from '../services/api';
import MainLayout from '../components/MainLayout';

const dayLabels = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

function timeToMinutes(t){ const [h,m] = t.split(':').map(Number); return h*60+m; }
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
  const [dayTimes, setDayTimes] = useState({}); // { 0: {start:'19:00', end:'02:00'}, ... }

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

  useEffect(()=>{ loadUsers(); },[loadUsers]);
  useEffect(()=>{ loadWeek(); },[loadWeek]);

  const onTimeChange = (dow, field, value)=>{
    setDayTimes(prev => ({ ...prev, [dow]: { ...(prev[dow]||{}), [field]: value } }));
  };

  const saveRule = async (dow)=>{
    try{
      setError('');
      if(!selectedUser) throw new Error('Selecione um usuário');
      const start = dayTimes[dow]?.start || null;
      const end = dayTimes[dow]?.end || null;
      if(start && end){
        const startM = timeToMinutes(start), endM = timeToMinutes(end);
        const spanHrs = endM > startM ? (endM-startM)/60 : ((24*60 - startM + endM)/60);
        if(spanHrs > 9){ alert(`Atenção: duração longa (${spanHrs.toFixed(1)}h).`); }
      }
      await api.post('/api/planning/rules', { userId: selectedUser, dayOfWeek: dow, startTime: start, endTime: end, continuous });
      alert('Regra salva');
    }catch(e){ setError(e?.message||'Falha ao salvar regra'); }
  };

  const addShift = async (date, dow)=>{
    try{
      setError('');
      if(!selectedUser) throw new Error('Selecione um usuário');
      const t = dayTimes[dow]||{}; if(!t.start || !t.end) throw new Error('Defina horários para este dia');
      await api.post('/api/planning/shifts', { userId: selectedUser, date, startTime: t.start, endTime: t.end });
      await loadWeek(week.weekStart);
    }catch(e){ setError(e?.message||'Falha ao adicionar planejamento'); }
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
  const hours = useMemo(()=> Array.from({length:25}, (_,i)=> (12+i)%24 ),[]);

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

  return (
    <MainLayout>
      <div className="space-y-4">
        {/* Header no estilo Gestão de Turnos */}
        <header className="bg-white shadow-sm border-b">
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
        </header>

  {error && <div className="text-red-600">{error}</div>}
  {loading && <div>Carregando...</div>}

        {/* Calendário semanal (primeiro bloco) */}
        <div className="overflow-auto">
          <div className="min-w-[900px]">
            <div className="grid" style={{ gridTemplateColumns: `100px repeat(7, 1fr)` }}>
              <div></div>
              {week.days.map((d,i)=> {
                const dt = new Date(d+'T00:00:00Z');
                const header = dt.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', timeZone: 'UTC' });
                return <div key={i} className="text-center font-medium capitalize">{header}</div>;
              })}
              {hours.map((h,ri)=> (
                <React.Fragment key={ri}>
                  <div className="text-xs text-right pr-2 border-b">{String(h).padStart(2,'0')}:00</div>
                  {week.days.map((d,ci)=> (
                    <div key={ci} className="relative h-8 border-b border-l">
                      {/* render shifts that overlap this day/hour */}
                      {week.shifts.filter(s=> s.date===d).map(s=>{
                        const startM = timeToMinutes(fmtTime(s.start_time));
                        const endM = timeToMinutes(fmtTime(s.end_time));
                        const spans = s.spans_next_day;
                        // we render as positioned block once per day
                        if(ri===0){
                          const top = ((startM - 12*60 + (startM<12*60? 24*60:0)) / (24*60)) * (hours.length*32);
                          const durMin = spans
                            ? (24*60 - startM + endM)
                            : (endM - startM);
                          const height = Math.max(8, (durMin/(24*60)) * (hours.length*32));
                          const color = userColorMap.get(s.user_id) || '#3b82f6';
                          return (
                            <div key={s.id} className="absolute left-1 right-1 rounded" style={{ top, height, backgroundColor: color, opacity: 0.8 }} title={`${s.user_name} ${fmtTime(s.start_time)}-${fmtTime(s.end_time)}`}>
                              <span className="text-[10px] text-white pl-1">{s.user_name}</span>
                              <button onClick={()=>removeShift(s.id)} className="absolute right-1 top-1 text-[10px] text-white">x</button>
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Legenda por usuário próxima do calendário */}
        <div className="flex items-center gap-3 flex-wrap">
          {users.map(u=> (
            <div key={u.id} className="flex items-center gap-1 text-sm">
              <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: userColorMap.get(u.id) }}></span>
              <span>{u.name}</span>
            </div>
          ))}
        </div>

        {/* Controles: seleção de usuário e horários por dia */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3">
            <label className="text-sm">Usuário (para salvar):</label>
            <select value={selectedUser} onChange={e=>setSelectedUser(e.target.value)} className="border p-1 rounded">
              {users.map(u=> <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <label className="ml-4 text-sm">Contínuo:</label>
            <input type="checkbox" checked={continuous} onChange={e=>setContinuous(e.target.checked)} />
          </div>
        </div>

        {/* Seções de horários por dia, ordenadas conforme a semana (Qua→Ter) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {(week.days.length ? week.days : Array(7).fill('')).map((dayIso, dow)=> {
            const lab = week.days.length
              ? new Date(dayIso+'T00:00:00Z').toLocaleDateString('pt-BR', { weekday: 'short', timeZone: 'UTC' })
              : dayLabels[dow];
            return (
            <div key={dow} className="p-3 bg-white rounded shadow">
              <div className="font-medium mb-2">{lab}</div>
              <div className="flex items-center gap-2 text-sm">
                <label>Entrada</label>
                <input type="time" value={dayTimes[dow]?.start||''} onChange={e=>onTimeChange(dow,'start', e.target.value)} className="border p-1 rounded" />
                <label>Saída</label>
                <input type="time" value={dayTimes[dow]?.end||''} onChange={e=>onTimeChange(dow,'end', e.target.value)} className="border p-1 rounded" />
              </div>
              {/* salvar regra recorrente para este dia */}
              <div className="mt-2 flex gap-2">
                <button onClick={()=>saveRule(dow)} className="px-2 py-1 border rounded">Salvar regra</button>
                {/* adicionar shift pontual na semana atual para este dia */}
                {week.days[dow] && <button onClick={()=>addShift(week.days[dow], dow)} className="px-2 py-1 border rounded">Adicionar nesta semana</button>}
              </div>
            </div>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
}
