import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { statutesService } from '../services/api';
import MainLayout from '../components/MainLayout';
import { Button } from '../components/ui/button';
import { CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react';

export default function StatuteWizardPage(){
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState([]);
  const [error, setError] = useState('');
  const [checks, setChecks] = useState(new Map());
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(()=>{
    (async()=>{
      try{
        setLoading(true); setError('');
        const resp = await statutesService.getPending();
        setData(resp.data || []);
        const m = new Map();
        (resp.data || []).forEach(group => {
          group.items.forEach(it => m.set(String(it.id), false));
        });
        setChecks(m);
      }catch(e){ setError(e?.message||'Falha ao carregar termos'); }
      finally{ setLoading(false); }
    })();
  },[]);

  const total = useMemo(()=> Array.from(checks.values()).length, [checks]);
  const done = useMemo(()=> Array.from(checks.values()).filter(Boolean).length, [checks]);
  const allChecked = total>0 && done===total;

  const toggle = (id)=>{
    setChecks(prev => new Map(prev).set(String(id), !prev.get(String(id))));
  };

  const submit = async ()=>{
    try{
      setSaving(true);
      const acks = [];
      data.forEach(group => group.items.forEach(it => { if (checks.get(String(it.id))) acks.push({ statuteId: group.statute.id, itemId: it.id }); }));
      if(!acks.length){ setSaving(false); return; }
      await statutesService.acknowledge(acks);
      // Recarregar pendências
      const resp = await statutesService.getPending();
      const pending = resp.data || [];
      if (!pending.length){
        const backTo = location.state?.from?.pathname || '/dashboard';
        navigate(backTo, { replace: true });
      } else {
        setData(pending);
        const m = new Map();
        pending.forEach(group => group.items.forEach(it => m.set(String(it.id), false)));
        setChecks(m);
      }
    }catch(e){ setError(e?.message||'Falha ao registrar ciência'); }
    finally{ setSaving(false); }
  };

  const headerEl = (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={()=>navigate(-1)}><ArrowLeft className="h-4 w-4"/> Voltar</Button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Termos de Conduta e Operação</h1>
              <p className="text-xs text-gray-500">Leia e confirme os itens para continuar usando o sistema</p>
            </div>
          </div>
          <div className="text-sm text-gray-700">{done}/{total} itens</div>
        </div>
      </div>
    </div>
  );

  return (
    <MainLayout customHeader={headerEl}>
      <div className="max-w-5xl mx-auto p-3">
        {loading && <div className="text-gray-600">Carregando termos...</div>}
        {error && <div className="text-red-600 mb-2">{error}</div>}
        {!loading && !data.length && (
          <div className="p-4 bg-green-50 border border-green-200 rounded text-green-800 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4"/> Você não possui termos pendentes.
          </div>
        )}
        {data.map(group => (
          <div key={group.statute.id} className="mb-4 border rounded bg-white">
            <div className="px-3 py-2 border-b font-medium">{group.statute.title}</div>
            <div className="p-3 space-y-2">
              {group.items.map(it => (
                <label key={it.id} className="flex items-start gap-2 text-sm">
                  <input type="checkbox" className="mt-1" checked={!!checks.get(String(it.id))} onChange={()=>toggle(it.id)} />
                  <span>{it.text}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
        {data.length>0 && (
          <div className="flex items-center justify-end gap-3">
            {!allChecked && (
              <div className="text-xs text-amber-700 flex items-center gap-1"><AlertTriangle className="h-3 w-3"/> Marque todos os itens para continuar.</div>
            )}
            <Button disabled={!allChecked || saving} onClick={submit}>{saving? 'Salvando...' : 'Estou ciente de todos os itens'}</Button>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
