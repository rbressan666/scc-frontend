import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { ArrowLeft, Calendar as CalendarIcon, Trash2, GripVertical, ChevronsDownUp } from 'lucide-react';
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
  const [selectedUser, setSelectedUser] = useState('');
  const [week, setWeek] = useState({ weekStart: '', days: [], shifts: [] });
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // modo de criação: regra semanal contínua ou turno pontual
  const [continuous, setContinuous] = useState(false);

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
      const data = res?.data || res;
      console.info('[Planning] GET /api/planning/week ->', {
        weekStart: data?.weekStart,
        days: data?.days,
        shiftsCount: Array.isArray(data?.shifts) ? data.shifts.length : 0,
      });
      setWeek(data);
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

  // Mantém o calendário alinhado à semana carregada
  const calendarRef = useRef(null);
  useEffect(()=>{
    if(calendarRef.current && week?.weekStart){
      try{
        const api = calendarRef.current.getApi();
        api.gotoDate(week.weekStart);
      }catch{/* ignore */}
    }
  },[week?.weekStart]);

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
    const nextStart = d.toISOString().slice(0,10);
    await loadWeek(nextStart);
    if(calendarRef.current){
      try{ calendarRef.current.getApi().gotoDate(nextStart); }catch{/* ignore */}
    }
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
      const base = typeof iso === 'string' ? iso.split('T')[0] : iso;
      const d = new Date(`${base}T00:00:00Z`);
      if(isNaN(d.getTime())) return iso;
      d.setUTCDate(d.getUTCDate()+days);
      return d.toISOString().slice(0,10);
    }catch{ return iso; }
  };

  // Validadores/formatadores seguros
  const isHHMM = (t)=> typeof t === 'string' && /^\d{2}:\d{2}$/.test(t);
  const safeDateTime = (isoDate, hhmm)=>{
    if(!isoDate || !isHHMM(hhmm)) return null;
    const base = typeof isoDate === 'string' ? isoDate.split('T')[0] : isoDate;
    return `${base}T${hhmm}:00`;
  };

  // Datas/horas locais (evita conversão para UTC ao salvar)
  const pad2 = (n)=> String(n).padStart(2,'0');
  const toLocalDayISO = (d)=> `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
  const toLocalHHMM = (d)=> `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  const DOW = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  const todayIso = toLocalDayISO(new Date());
  const isPastIso = (iso)=>{
    if(!iso) return false;
    const base = typeof iso === 'string' ? iso.split('T')[0] : iso;
    return base < todayIso;
  };
  
  // Normaliza ISO e calcula início da semana (quarta) para uma data
  const weekStartFromIso = (iso)=>{
    try{
      const base = typeof iso === 'string' ? iso.split('T')[0] : iso;
      const d = new Date(`${base}T00:00:00`);
      const dow = d.getDay(); // 0..6 (0=Dom, 3=Qua)
      const delta = (dow - 3 + 7) % 7;
      d.setDate(d.getDate() - delta);
      return toLocalDayISO(d);
    }catch{ return typeof iso === 'string' ? iso.split('T')[0] : iso; }
  };

  // Conversores úteis (nenhum necessário no momento)

  const headerEl = (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3">
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
                    <CalendarIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold text-gray-900 leading-tight">Planejamento Semanal</h1>
                    <p className="text-xs text-gray-500">Regras contínuas e turnos pontuais</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button onClick={()=>navigateWeek(-7)} variant="outline" size="sm">◀ Semana anterior</Button>
                <div className="text-xs sm:text-sm text-gray-700">
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
      <div className="space-y-3">

          {/* Área fixa para mensagens - evita deslocamento do calendário */}
          <div className="min-h-6 text-sm">
            {error && <div className="text-red-600">{error}</div>}
            {loading && <div className="text-gray-500">Carregando...</div>}
            {saving && !loading && <div className="text-gray-500">Salvando...</div>}
          </div>

          {/* Controles principais: Usuário e Contínuo */}
          <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded border text-sm">
            <div className="flex items-center gap-2">
              <label className="text-sm">Usuário</label>
              <select value={selectedUser} onChange={e=> setSelectedUser(e.target.value)} className="border p-1 rounded min-w-52">
                {users.map(u=> <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm">Contínuo</label>
              <input type="checkbox" checked={continuous} onChange={e=>setContinuous(e.target.checked)} />
              <span className="text-xs text-gray-500">(trabalha sempre neste dia/horário até parar)</span>
            </div>
            {/* Botão 'Aplicar regras nesta semana' removido por simplificação */}
          </div>

        {/* FullCalendar - timeGridWeek */}
        <div className="bg-white rounded border p-2" style={{ '--fc-highlight': hexToRgba(finalColor(selectedUser||users[0]?.id||''), 0.25) }}>
          <style>{`
            .fc .is-past-day .fc-timegrid-col-frame { background-color: #f5f5f5; }
            /* reduzir altura das linhas para caber na tela */
            .fc .fc-timegrid-slot { height: 1.0em; }
            .fc .fc-timegrid-slot-label { font-size: 0.68rem; }
            .fc .fc-event { font-size: 0.8rem; }
            .fc .fc-timegrid-axis-cushion { font-size: 0.7rem; }
            /* cor do highlight da seleção na cor final do usuário */
            .fc .fc-highlight { background: var(--fc-highlight, rgba(59,130,246,0.2)); }
            /* layout dos eventos: título centralizado e ações no rodapé */
            .fc-event-main-frame { position: relative; display: flex; flex-direction: column; height: 100%; }
            .fc-event-main { flex: 1; display: flex; align-items: center; justify-content: center; padding: 2px 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .fc-event-actions { position: absolute; bottom: 2px; right: 4px; display: flex; gap: 6px; align-items: center; pointer-events: auto; z-index: 2; }
            .fc-event-actions button { background: rgba(255,255,255,0.9); border: 1px solid rgba(0,0,0,0.08); border-radius: 4px; padding: 2px; line-height: 0; cursor: pointer; }
            .fc-event-actions svg { display: block; }
            /* regras translúcidas com texto sempre preto e z-index menor para não cobrir turnos */
            .fc .fc-event.fc-rule { z-index: 1 !important; }
            .fc-rule .fc-event-main { color: #111111 !important; }
            /* garantir que os botões sejam clicáveis sobre overlays */
            .fc .fc-event, .fc .fc-event * { pointer-events: auto; }
          `}</style>
          <FullCalendar
            ref={calendarRef}
            plugins={[timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            initialDate={week?.weekStart || undefined}
            locale={ptLocale}
            firstDay={3}
            slotMinTime="00:00:00"
            slotMaxTime="23:00:00"
            height="78vh"
            allDaySlot={false}
            selectable={!saving}
            selectMirror
            slotDuration="01:00:00"
            expandRows={false}
            dayHeaderFormat={{ weekday: 'short', month: '2-digit', day: '2-digit' }}
            slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
            headerToolbar={false}
            eventTextColor="#111111"
            eventContent={(arg)=>{
              const kind = arg.event.extendedProps?.kind;
              const isShift = kind === 'shift';
              const isPast = toLocalDayISO(arg.event.start) < todayIso;
              const isOvernightPart = String(arg.event.id||'').endsWith('-b');
              return (
                <div className="fc-event-main-frame">
                  <div className="fc-event-main">{arg.event.title}</div>
                  <div className="fc-event-actions">
                    {isShift && !isPast && !isOvernightPart && (
                      <button title="Excluir turno" onClick={async(e)=>{
                        e.preventDefault(); e.stopPropagation();
                        const ok = window.confirm('Excluir este turno?'); if(!ok) return;
                        try{
                          setSaving(true);
                          await api.delete(`/api/planning/shifts/${arg.event.id}`);
                          const dayIso = toLocalDayISO(arg.event.start);
                          await loadWeek(weekStartFromIso(dayIso));
                        }catch(err){ setError(err?.message||'Falha ao excluir'); }
                        finally{ setSaving(false); }
                      }}><Trash2 size={14} /></button>
                    )}
                    {isShift && <span title="Arraste para mover"><GripVertical size={14} /></span>}
                    {isShift && <span title="Ajuste a alça inferior/superior para mudar horários"><ChevronsDownUp size={14} /></span>}
                    {kind === 'rule' && !isPast && (
                      <button title="Parar regra" onClick={async(e)=>{
                        e.preventDefault(); e.stopPropagation();
                        const ruleId = arg.event.extendedProps?.ruleId; if(!ruleId) return;
                        const ok = window.confirm('Parar esta regra contínua?'); if(!ok) return;
                        try{
                          setSaving(true);
                          await api.delete(`/api/planning/rules/${ruleId}`);
                          await loadRules();
                          await loadWeek(week.weekStart);
                        }catch(err){ setError(err?.message||'Falha ao parar regra'); }
                        finally{ setSaving(false); }
                      }}><Trash2 size={14} /></button>
                    )}
                  </div>
                </div>
              );
            }}
            dayCellClassNames={(arg)=> (arg.date && toLocalDayISO(arg.date) < todayIso) ? ['is-past-day'] : []}
            selectAllow={(info)=> {
              const d = toLocalDayISO(info.start);
              return d >= todayIso && !saving;
            }}
            events={[
              // turnos pontuais
              ...((Array.isArray(week?.shifts) ? week.shifts : [])).flatMap(s=>{
                const startStr = fmtTime(s.start_time);
                const endStr = fmtTime(s.end_time);
                const startISO = safeDateTime(s.date, startStr);
                const endISO = safeDateTime(s.spans_next_day ? addDaysIso(s.date, 1) : s.date, endStr);
                if(!startISO || !endISO) return [];
                const editable = !isPastIso(s.date);
                const base = [{ id: String(s.id), title: s.user_name, start: startISO, end: endISO, backgroundColor: finalColor(s.user_id), borderColor: finalColor(s.user_id), editable, extendedProps: { kind: 'shift' } }];
                if(s.spans_next_day){
                  const nextDay = addDaysIso(s.date, 1);
                  if(!nextDay) return base;
                  const endPart = safeDateTime(nextDay, endStr);
                  return [
                    { ...base[0] },
                    endPart ? { id: `${s.id}-b`, title: s.user_name, start: `${nextDay}T00:00:00`, end: endPart, backgroundColor: finalColor(s.user_id), borderColor: finalColor(s.user_id), editable: false, extendedProps: { kind: 'shift' } } : null
                  ];
                }
                return base;
              }),
              // regras semanais como eventos clicáveis (translúcidos)
              ...(() => {
                if(!Array.isArray(week?.days) || week.days.length===0 || !Array.isArray(rules) || rules.length===0) return [];
                const mapDowToIso = new Map();
                week.days.forEach(iso=>{ const d=new Date(iso+'T00:00:00Z'); mapDowToIso.set(d.getUTCDay(), iso); });
                const evs = [];
                for(const r of rules){
                  const iso = mapDowToIso.get(Number(r.day_of_week));
                  if(!iso || !r.start_time || !r.end_time) continue;
                  if(isPastIso(iso)) continue;
                  const color = finalColor(r.user_id);
                  evs.push({
                    id: `rule-${r.id}-${iso}`,
                    title: `${r.user_name} (regra)`,
                    start: `${iso}T${fmtTime(r.start_time)}:00`,
                    end: `${iso}T${fmtTime(r.end_time)}:00`,
                    backgroundColor: hexToRgba(color, 0.18),
                    borderColor: color,
                    editable: false,
                    overlap: true,
                    classNames: ['fc-rule'],
                    extendedProps: { kind: 'rule', ruleId: r.id }
                  });
                }
                return evs;
              })()
            ]}
            editable={!saving}
            eventOverlap="block"
            select={async(info)=>{
              if(!selectedUser){ alert('Selecione um usuário'); return; }
              const start = new Date(info.start);
              const end = new Date(info.end);
              const dayIso = toLocalDayISO(start);
              const startTime = toLocalHHMM(start);
              const endTime = toLocalHHMM(end);
              try{
                if(dayIso < todayIso){ info.view.calendar.unselect(); return; }
                setSaving(true);
                info.view.calendar.unselect();
                if(continuous){
                  const dow = start.getDay();
                  const payload = { userId: selectedUser, dayOfWeek: dow, startTime, endTime, continuous: true };
                  console.info('[Planning] SELECT(rule) -> POST /rules', payload, `( ${DOW[dow]} ${startTime}-${endTime} )`);
                  const res = await api.post('/api/planning/rules', payload);
                  console.info('[Planning] SELECT(rule) <-', res);
                  await loadRules();
                }else{
                  const payload = { userId: selectedUser, date: dayIso, startTime, endTime };
                  console.info('[Planning] SELECT(shift) -> POST /shifts', payload);
                  const res = await api.post('/api/planning/shifts', payload);
                  console.info('[Planning] SELECT(shift) <-', res);
                }
                const newWeekStart = weekStartFromIso(dayIso);
                await loadWeek(newWeekStart);
              }catch(err){ setError(err?.message||'Falha ao salvar'); }
              finally { setSaving(false); }
            }}
            eventDrop={async(info)=>{
              const id = info.event.id;
              const startTime = toLocalHHMM(info.event.start);
              const endTime = info.event.end ? toLocalHHMM(info.event.end) : startTime;
              try{
                if(toLocalDayISO(info.event.start) < todayIso){ info.revert(); return; }
                setSaving(true);
                const payload = { startTime, endTime };
                console.info('[Planning] DROP -> PUT /shifts/', id, payload);
                const res = await api.put(`/api/planning/shifts/${id}`, payload);
                console.info('[Planning] DROP <-', res);
                const dayIso = toLocalDayISO(info.event.start);
                await loadWeek(weekStartFromIso(dayIso));
              }catch(err){ setError(err?.message||'Falha ao mover'); info.revert(); }
              finally { setSaving(false); }
            }}
            eventResize={async(info)=>{
              const id = info.event.id;
              const startTime = toLocalHHMM(info.event.start);
              const endTime = info.event.end ? toLocalHHMM(info.event.end) : startTime;
              try{
                if(toLocalDayISO(info.event.start) < todayIso){ info.revert(); return; }
                setSaving(true);
                const payload = { startTime, endTime };
                console.info('[Planning] RESIZE -> PUT /shifts/', id, payload);
                const res = await api.put(`/api/planning/shifts/${id}`, payload);
                console.info('[Planning] RESIZE <-', res);
                const dayIso = toLocalDayISO(info.event.start);
                await loadWeek(weekStartFromIso(dayIso));
              }catch(err){ setError(err?.message||'Falha ao redimensionar'); info.revert(); }
              finally { setSaving(false); }
            }}
          />
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
