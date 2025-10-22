import React, { useEffect, useMemo, useState } from 'react';
import { notificationsService, authService } from '../services/api';

export default function NotificationsAdminPage() {
  const me = useMemo(() => authService.getCurrentUser(), []);
  const [stats, setStats] = useState(null);
  const [pending, setPending] = useState(null);
  const [recent, setRecent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [cronKey, setCronKey] = useState(localStorage.getItem('cronKey') || '');
  const [testSubject, setTestSubject] = useState('SCC - Teste');
  const [testMessage, setTestMessage] = useState('Notificação de teste');

  async function refreshAll() {
    setLoading(true); setError('');
    try {
      const [s, p, r] = await Promise.all([
        notificationsService.adminStats(),
        notificationsService.adminPending({ onlyDue: true, limit: 20 }),
        notificationsService.adminRecent(20),
      ]);
      setStats(s);
      setPending(p);
      setRecent(r);
    } catch (e) {
      setError(e?.message || 'Falha ao buscar dados');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refreshAll(); }, []);

  const runDispatch = async () => {
    setLoading(true); setError('');
    try {
      if (!cronKey) throw new Error('Defina a CRON KEY');
      localStorage.setItem('cronKey', cronKey);
      await notificationsService.dispatchNow(cronKey);
      await refreshAll();
    } catch (e) {
      setError(e?.message || 'Falha ao despachar');
    } finally { setLoading(false); }
  };

  const enqueueTest = async () => {
    setLoading(true); setError('');
    try {
      const userId = me?.id;
      if (!userId) throw new Error('Usuário atual não identificado');
      await notificationsService.enqueueTest({ userId, subject: testSubject, message: testMessage, scheduleInSeconds: 0 });
      await refreshAll();
    } catch (e) {
      setError(e?.message || 'Falha ao enfileirar teste');
    } finally { setLoading(false); }
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-4">Admin - Notificações</h1>

      {error && (
        <div className="bg-red-100 text-red-800 border border-red-300 p-2 rounded mb-3">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="border rounded p-3">
          <h2 className="font-medium mb-2">Dispatcher</h2>
          <label className="block text-sm text-gray-600">x-cron-key</label>
          <input className="border rounded px-2 py-1 w-full mb-2" value={cronKey} onChange={(e)=>setCronKey(e.target.value)} placeholder="CRON_DISPATCH_KEY" />
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded disabled:opacity-50" onClick={runDispatch} disabled={loading || !cronKey}>
            {loading ? 'Processando...' : 'Despachar agora'}
          </button>
        </div>

        <div className="border rounded p-3">
          <h2 className="font-medium mb-2">Teste rápido</h2>
          <div className="text-sm text-gray-600 mb-2">Envia para você ({me?.email})</div>
          <input className="border rounded px-2 py-1 w-full mb-2" value={testSubject} onChange={(e)=>setTestSubject(e.target.value)} placeholder="Assunto" />
          <input className="border rounded px-2 py-1 w-full mb-2" value={testMessage} onChange={(e)=>setTestMessage(e.target.value)} placeholder="Mensagem" />
          <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded disabled:opacity-50" onClick={enqueueTest} disabled={loading || !me?.id}>
            {loading ? 'Enfileirando...' : 'Enfileirar notificação de teste'}
          </button>
        </div>

        <div className="border rounded p-3">
          <h2 className="font-medium mb-2">Ações</h2>
          <button className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded disabled:opacity-50" onClick={refreshAll} disabled={loading}>
            {loading ? 'Atualizando...' : 'Atualizar dados'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded p-3">
          <h3 className="font-medium mb-2">Stats</h3>
          {!stats ? <div className="text-sm text-gray-500">Carregando…</div> : (
            <ul className="text-sm">
              {(stats?.byStatus || []).map((s) => (
                <li key={s.status} className="flex justify-between border-b py-1"><span>{s.status}</span><span>{s.count}</span></li>
              ))}
            </ul>
          )}
        </div>

        <div className="border rounded p-3">
          <h3 className="font-medium mb-2">Pendentes (amostra)</h3>
          {!pending ? <div className="text-sm text-gray-500">Carregando…</div> : (
            <ul className="text-xs space-y-1 max-h-64 overflow-auto pr-1">
              {(pending?.sample || []).map((p) => (
                <li key={p.id} className="border rounded p-2">
                  <div><b>ID:</b> {p.id}</div>
                  <div><b>User:</b> {p.user_id}</div>
                  <div><b>Tipo:</b> {p.type}</div>
                  <div><b>Agendado:</b> {p.scheduled_at_utc}</div>
                  <div><b>Status:</b> {p.status}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border rounded p-3">
          <h3 className="font-medium mb-2">Recentes</h3>
          {!recent ? <div className="text-sm text-gray-500">Carregando…</div> : (
            <ul className="text-xs space-y-1 max-h-64 overflow-auto pr-1">
              {(recent?.rows || []).map((r) => (
                <li key={r.id} className="border rounded p-2">
                  <div><b>ID:</b> {r.id}</div>
                  <div><b>User:</b> {r.user_id}</div>
                  <div><b>Tipo:</b> {r.type}</div>
                  <div><b>Status:</b> {r.status}</div>
                  <div><b>Agendado:</b> {r.scheduled_at_utc}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
