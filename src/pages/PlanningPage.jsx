import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import MainLayout from '../components/MainLayout';

export default function PlanningPage() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [form, setForm] = useState({ userId: '', dayOfWeek: 5, shiftType: 'diurno', startDate: '' });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/api/schedule/rules');
      setRules(res.rows || []);
    } catch (e) {
      setError(e?.message || 'Erro ao carregar regras');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await api.post('/api/schedule/rules', form);
      setForm({ userId: '', dayOfWeek: 5, shiftType: 'diurno', startDate: '' });
      load();
    } catch (e) {
      setError(e?.message || 'Falha ao criar regra');
    }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/api/schedule/rules/${id}`);
      load();
    } catch (e) {
      setError(e?.message || 'Falha ao remover regra');
    }
  };

  return (
    <MainLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Planejamento de Escalas</h1>
        {error && <div className="text-red-600">{error}</div>}
        <form onSubmit={create} className="p-4 bg-white rounded shadow space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input className="border p-2 rounded" placeholder="User ID (UUID)" value={form.userId} onChange={e => setForm(f => ({...f, userId: e.target.value}))} required />
            <select className="border p-2 rounded" value={form.dayOfWeek} onChange={e => setForm(f => ({...f, dayOfWeek: Number(e.target.value)}))}>
              <option value={0}>Domingo</option>
              <option value={1}>Segunda</option>
              <option value={2}>Terça</option>
              <option value={3}>Quarta</option>
              <option value={4}>Quinta</option>
              <option value={5}>Sexta</option>
              <option value={6}>Sábado</option>
            </select>
            <select className="border p-2 rounded" value={form.shiftType} onChange={e => setForm(f => ({...f, shiftType: e.target.value}))}>
              <option value="diurno">Diurno</option>
              <option value="noturno">Noturno</option>
            </select>
            <input type="date" className="border p-2 rounded" value={form.startDate} onChange={e => setForm(f => ({...f, startDate: e.target.value}))} required />
          </div>
          <button className="px-3 py-1 rounded bg-green-600 text-white">Adicionar Regra</button>
        </form>

        {loading ? <div>Carregando...</div> : (
          <div className="p-4 bg-white rounded shadow">
            <h2 className="font-medium mb-2">Regras Cadastradas</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th>ID</th>
                  <th>Usuário</th>
                  <th>Dia</th>
                  <th>Turno</th>
                  <th>Início</th>
                  <th>Fim</th>
                  <th>Ativo</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rules.map(r => (
                  <tr key={r.id} className="border-t">
                    <td>{r.id}</td>
                    <td className="font-mono text-xs">{r.user_id}</td>
                    <td>{['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'][r.day_of_week]}</td>
                    <td>{r.shift_type}</td>
                    <td>{r.start_date}</td>
                    <td>{r.end_date || '-'}</td>
                    <td>{r.active ? 'Sim' : 'Não'}</td>
                    <td>
                      <button onClick={() => remove(r.id)} className="text-red-600">Remover</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
