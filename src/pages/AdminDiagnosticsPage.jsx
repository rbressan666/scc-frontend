import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import MainLayout from '../components/MainLayout';

export default function AdminDiagnosticsPage() {
  const [stats, setStats] = useState([]);
  const [pending, setPending] = useState({ totalQueued: 0, dueNow: 0, sample: [] });
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [statsRes, pendingRes, recentRes] = await Promise.all([
        api.get('/api/notifications/admin/stats'),
        api.get('/api/notifications/admin/pending?onlyDue=true&limit=10'),
        api.get('/api/notifications/admin/recent?limit=10'),
      ]);
      setStats(statsRes.byStatus || []);
      setPending({
        totalQueued: pendingRes.totalQueued || 0,
        dueNow: pendingRes.dueNow || 0,
        sample: pendingRes.sample || [],
      });
      setRecent(recentRes.rows || []);
    } catch (e) {
      setError(e?.message || 'Falha ao carregar diagnósticos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <MainLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Diagnósticos de Notificações</h1>
          <button onClick={load} className="px-3 py-1 rounded bg-blue-600 text-white">Atualizar</button>
        </div>
        {error && <div className="text-red-600">{error}</div>}
        {loading ? <div>Carregando...</div> : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded shadow">
              <h2 className="font-medium mb-2">Por status</h2>
              <ul className="text-sm space-y-1">
                {stats.map(s => (
                  <li key={s.status} className="flex justify-between">
                    <span>{s.status}</span>
                    <span className="font-mono">{s.count}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-4 bg-white rounded shadow">
              <h2 className="font-medium mb-2">Fila</h2>
              <div className="text-sm">Total na fila: <b>{pending.totalQueued}</b></div>
              <div className="text-sm">Vencendo agora: <b>{pending.dueNow}</b></div>
              <div className="mt-2">
                <h3 className="text-sm font-medium mb-1">Amostra</h3>
                <ul className="text-xs space-y-1 max-h-40 overflow-auto">
                  {pending.sample.map(row => (
                    <li key={row.id} className="flex justify-between">
                      <span>#{row.id} {row.type}</span>
                      <span>{new Date(row.scheduled_at_utc).toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="p-4 bg-white rounded shadow md:col-span-1">
              <h2 className="font-medium mb-2">Recentes</h2>
              <ul className="text-xs space-y-1 max-h-64 overflow-auto">
                {recent.map(row => (
                  <li key={row.id} className="flex justify-between">
                    <span>#{row.id} {row.type} [{row.status}]</span>
                    <span>{new Date(row.created_at).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
