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
  const [selectedUser, setSelectedUser] = useState('');
  const [week, setWeek] = useState({ weekStart: '', days: [], shifts: [] });
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  // Utilitário: converte hex #RRGGBB em rgba com alpha
  const hexToRgba = (hex, alpha=0.15)=>{
    try{
      const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      if(!m) return `rgba(59,130,246,${alpha})`;
      const r = parseInt(m[1],16), g = parseInt(m[2],16), b = parseInt(m[3],16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }catch{ return `rgba(59,130,246,${alpha})`; }
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
            slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
            headerToolbar={false}
            events={[
              // turnos pontuais
              ...week.shifts.flatMap(s=>{
                const startISO = `${s.date}T${fmtTime(s.start_time)}:00`;
                const endISO = `${s.spans_next_day ? new Date(new Date(s.date+'T00:00:00Z').getTime()+86400000).toISOString().slice(0,10) : s.date}T${fmtTime(s.end_time)}:00`;
                const base = [{ id: String(s.id), title: s.user_name, start: startISO, end: endISO, backgroundColor: finalColor(s.user_id), borderColor: finalColor(s.user_id) }];
                if(s.spans_next_day){
                  const nextDay = new Date(new Date(s.date+'T00:00:00Z').getTime()+86400000).toISOString().slice(0,10);
                  return [
                    { ...base[0] },
                    { id: `${s.id}-b`, title: s.user_name, start: `${nextDay}T00:00:00`, end: `${nextDay}T${fmtTime(s.end_time)}:00`, backgroundColor: finalColor(s.user_id), borderColor: finalColor(s.user_id), editable: false }
                  ];
                }
                return base;
              }),
              // overlay de regras semanais (ghost, translúcido)
              ...(() => {
                if(!week?.days?.length || !rules?.length) return [];
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
              if(!selectedUser){ alert('Selecione um usuário'); return; }
              const start = new Date(info.start);
              const end = new Date(info.end);
              const dayIso = start.toISOString().slice(0,10);
              const startTime = start.toISOString().slice(11,16);
              const endTime = end.toISOString().slice(11,16);
              try{
                if(continuous){
                  const dow = start.getUTCDay();
                  await api.post('/api/planning/rules', { userId: selectedUser, dayOfWeek: dow, startTime, endTime, continuous: true });
                }else{
                  await api.post('/api/planning/shifts', { userId: selectedUser, date: dayIso, startTime, endTime });
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
