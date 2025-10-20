import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { ArrowLeft, Calendar as CalendarIcon } from 'lucide-react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import ptLocale from '@fullcalendar/core/locales/pt-br';
import api from '../services/api';
import MainLayout from '../components/MainLayout';

// labels auxiliares


function fmtTime(t){ return t?.slice(0,5) || ''; }

export default function PlanningPageV2(){
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [week, setWeek] = useState({ weekStart: '', days: [], shifts: [] });
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applying, setApplying] = useState(false);
  const [showRules, setShowRules] = useState(false);

  // modo de criação: regra semanal contínua ou turno pontual
  const [continuous, setContinuous] = useState(false);

  const loadUsers = useCallback(async()=>{
    try{
      const res = await api.get('/api/users?includeInactive=false');
      const list = (res.data || res || []).map(u => ({ id: u.id, name: u.nome_completo }));
      setUsers(list);
      if(list.length && (!selectedUsers || selectedUsers.length===0)){ setSelectedUsers([list[0].id]); }
    }catch(e){ setError(e?.message||'Erro ao carregar usuários'); }
  },[selectedUsers]);

  const loadWeek = useCallback(async(start)=>{
    try{
      setLoading(true); setError('');
      // Sempre carregar todos os usuários da semana; o usuário selecionado é apenas para salvar/lançar
      const q = new URLSearchParams(); if(start) q.set('start', start);
      const qs = q.toString();
      const url = `/api/planning/week${qs ? `?${qs}` : ''}`;
      const res = await api.get(url);
      setWeek(res?.data || res);
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

  // Carregar regras semanais (para overlay/ghost)
  const loadRules = useCallback(async()=>{
    try{
      const res = await api.get('/api/planning/rules');
      setRules(res.rows || res?.data?.rows || []);
    }catch{ /* overlay é opcional, não bloquear */ }
  },[]);
  useEffect(()=>{ loadRules(); },[loadRules]);

  // remover shift - utilitário futuro (removido para evitar lint enquanto não há botão)

  const navigateWeek = async (delta)=>{
    // delta in days: -7 previous, +7 next
    if(!week.weekStart) return;
    const d = new Date(week.weekStart); d.setDate(d.getDate()+delta);
    await loadWeek(d.toISOString().slice(0,10));
  };

  // Helpers (mantidos mínimos)

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

  const finalColor = (userId)=> userColorMap.get(userId) || '#3b82f6';

  // Utilitário: converte hex #RRGGBB em rgba com alpha
  const hexToRgba = (hex, alpha=0.15)=>{
    try{
      const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      if(!m) return `rgba(59,130,246,${alpha})`;
      const r = parseInt(m[1],16), g = parseInt(m[2],16), b = parseInt(m[3],16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }catch{ return `rgba(59,130,246,${alpha})`; }
  };

  // Helper: adiciona dias a um ISO yyyy-mm-dd com segurança
  const addDaysIso = (iso, days)=>{
    try{
      if(!iso) return iso;
      const d = new Date(iso+'T00:00:00Z');
      if(isNaN(d.getTime())) return iso;
      d.setUTCDate(d.getUTCDate()+days);
      return d.toISOString().slice(0,10);
    }catch{ return iso; }
  };

  // Validadores/formatadores seguros
  const isHHMM = (t)=> typeof t === 'string' && /^\d{2}:\d{2}$/.test(t);
  const safeDateTime = (isoDate, hhmm)=>{
    if(!isoDate || !isHHMM(hhmm)) return null;
    return `${isoDate}T${hhmm}:00`;
  };

  // Conversores úteis (nenhum necessário no momento)

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
              <label className="text-sm">Usuários</label>
              <select multiple value={selectedUsers} onChange={e=> setSelectedUsers(Array.from(e.target.selectedOptions).map(o=>o.value))} className="border p-1 rounded min-w-52" size={Math.min(6, Math.max(3, users.length))}>
                {users.map(u=> <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm">Contínuo</label>
              <input type="checkbox" checked={continuous} onChange={e=>setContinuous(e.target.checked)} />
              <span className="text-xs text-gray-500">(trabalha sempre neste dia/horário até parar)</span>
            </div>
            <Button
              disabled={applying || !rules?.length || !week?.days?.length}
              onClick={async()=>{
                try{
                  setApplying(true); setError('');
                  // Aplica regras a esta semana para todos os usuários envolvidos nas regras
                  const dayByDow = new Map();
                  (week.days||[]).forEach(iso=>{ const d=new Date(iso+'T00:00:00Z'); dayByDow.set(d.getUTCDay(), iso); });
                  const existing = Array.isArray(week?.shifts) ? week.shifts : [];
                  for(const r of (rules||[])){
                    const iso = dayByDow.get(Number(r.day_of_week));
                    if(!iso || !r.start_time || !r.end_time) continue;
                    const start = fmtTime(r.start_time); const end = fmtTime(r.end_time);
                    // evita duplicar se já existe mesmo user/date/start/end
                    const dup = existing.find(s=> s.user_id===r.user_id && s.date===iso && fmtTime(s.start_time)===start && fmtTime(s.end_time)===end);
                    if(dup) continue;
                    await api.post('/api/planning/shifts', { userId: r.user_id, date: iso, startTime: start, endTime: end });
                  }
                  await loadWeek(week.weekStart);
                }catch(err){ setError(err?.message||'Falha ao aplicar regras'); }
                finally{ setApplying(false); }
              }}
              variant="outline" size="sm"
            >Aplicar regras nesta semana</Button>
            <Button variant="ghost" size="sm" onClick={()=>setShowRules(v=>!v)}>
              {showRules ? 'Ocultar regras' : 'Ver/Parar regras'}
            </Button>
          </div>
  {error && <div className="text-red-600">{error}</div>}
  {loading && <div>Carregando...</div>}

        {/* FullCalendar - timeGridWeek */}
        <div className="bg-white rounded border p-2">
          <FullCalendar
            plugins={[timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            locale={ptLocale}
            firstDay={3}
            slotMinTime="12:00:00"
            slotMaxTime="24:00:00"
            height="auto"
            allDaySlot={false}
            selectable
            selectMirror
            slotDuration="01:00:00"
            expandRows={true}
            dayHeaderFormat={{ weekday: 'short', month: '2-digit', day: '2-digit' }}
            slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
            headerToolbar={false}
            events={[
              // turnos pontuais
              ...((Array.isArray(week?.shifts) ? week.shifts : [])).flatMap(s=>{
                const startStr = fmtTime(s.start_time);
                const endStr = fmtTime(s.end_time);
                const startISO = safeDateTime(s.date, startStr);
                const endISO = safeDateTime(s.spans_next_day ? addDaysIso(s.date, 1) : s.date, endStr);
                if(!startISO || !endISO) return [];
                const base = [{ id: String(s.id), title: s.user_name, start: startISO, end: endISO, backgroundColor: finalColor(s.user_id), borderColor: finalColor(s.user_id) }];
                if(s.spans_next_day){
                  const nextDay = addDaysIso(s.date, 1);
                  if(!nextDay) return base;
                  const endPart = safeDateTime(nextDay, endStr);
                  return [
                    { ...base[0] },
                    endPart ? { id: `${s.id}-b`, title: s.user_name, start: `${nextDay}T00:00:00`, end: endPart, backgroundColor: finalColor(s.user_id), borderColor: finalColor(s.user_id), editable: false } : null
                  ];
                }
                return base;
              }),
              // overlay de regras semanais (ghost, translúcido)
              ...(() => {
                if(!Array.isArray(week?.days) || week.days.length===0 || !Array.isArray(rules) || rules.length===0) return [];
                // mapa dow->iso do intervalo atual
                const mapDowToIso = new Map();
                week.days.forEach(iso=>{ const d=new Date(iso+'T00:00:00Z'); mapDowToIso.set(d.getUTCDay(), iso); });
                const evs = [];
                for(const r of rules){
                  const iso = mapDowToIso.get(Number(r.day_of_week));
                  if(!iso || !r.start_time || !r.end_time) continue;
                  const color = finalColor(r.user_id);
                  evs.push({
                    id: `rule-${r.id}-${iso}`,
                    title: `${r.user_name} (regra)`,
                    start: `${iso}T${fmtTime(r.start_time)}:00`,
                    end: `${iso}T${fmtTime(r.end_time)}:00`,
                    display: 'background',
                    backgroundColor: hexToRgba(color, 0.12),
                    overlap: true,
                  });
                }
                return evs;
              })()
            ]}
            editable
            eventOverlap="block"
            select={async(info)=>{
              if(!selectedUsers || selectedUsers.length===0){ alert('Selecione pelo menos um usuário'); return; }
              const start = new Date(info.start);
              const end = new Date(info.end);
              const dayIso = start.toISOString().slice(0,10);
              const startTime = start.toISOString().slice(11,16);
              const endTime = end.toISOString().slice(11,16);
              try{
                if(continuous){
                  // Contínuo: cria/atualiza uma regra permanente para os usuários selecionados
                  const dow = start.getUTCDay();
                  for(const uid of selectedUsers){
                    await api.post('/api/planning/rules', { userId: uid, dayOfWeek: dow, startTime, endTime, continuous: true });
                  }
                  await loadRules();
                }else{
                  for(const uid of selectedUsers){
                    await api.post('/api/planning/shifts', { userId: uid, date: dayIso, startTime, endTime });
                  }
                }
                await loadWeek(week.weekStart);
              }catch(err){ setError(err?.message||'Falha ao salvar'); }
            }}
            eventDrop={async(info)=>{
              const id = info.event.id;
              const startTime = info.event.start.toISOString().slice(11,16);
              const endTime = info.event.end?.toISOString().slice(11,16) || startTime;
              try{
                await api.put(`/api/planning/shifts/${id}`, { startTime, endTime });
                await loadWeek(week.weekStart);
              }catch(err){ setError(err?.message||'Falha ao mover'); info.revert(); }
            }}
            eventResize={async(info)=>{
              const id = info.event.id;
              const startTime = info.event.start.toISOString().slice(11,16);
              const endTime = info.event.end?.toISOString().slice(11,16) || startTime;
              try{
                await api.put(`/api/planning/shifts/${id}`, { startTime, endTime });
                await loadWeek(week.weekStart);
              }catch(err){ setError(err?.message||'Falha ao redimensionar'); info.revert(); }
            }}
          />
        </div>

        {showRules && (
          <div className="bg-white rounded border p-3 space-y-2">
            <div className="text-sm font-medium">Regras ativas</div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {(rules||[]).map(r=> (
                <div key={r.id} className="flex items-center justify-between border rounded p-2">
                  <div className="text-sm">
                    <div className="font-medium">{r.user_name}</div>
                    <div className="text-gray-600">Dia {Number(r.day_of_week)} • {fmtTime(r.start_time)}–{fmtTime(r.end_time)}</div>
                  </div>
                  <Button size="sm" variant="destructive" onClick={async()=>{
                    try{
                      await api.delete(`/api/planning/rules/${r.id}`); // soft stop
                      await loadRules();
                    }catch(err){ setError(err?.message||'Falha ao parar regra'); }
                  }}>Parar</Button>
                </div>
              ))}
              {(!rules || rules.length===0) && (
                <div className="text-sm text-gray-500">Nenhuma regra ativa.</div>
              )}
            </div>
          </div>
        )}

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
