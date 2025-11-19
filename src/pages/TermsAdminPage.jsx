import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { statutesService } from '../services/api';
import { Badge } from '@/components/ui/badge';

// Página administrativa para CRUD de grupos/estatutos e ciência de usuários.
// Implementa MVP: listagem + formulários de criação inline com fallback caso endpoints ainda não existam.
const TermsAdminPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [groups, setGroups] = useState([]);
  const [statutes, setStatutes] = useState([]);
  const [acks, setAcks] = useState([]);

  // Form states
  const [newGroup, setNewGroup] = useState({ nome: '' });
  const [newStatute, setNewStatute] = useState({ title: '', code: '', group_id: '' });

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [grpRes, stRes, ackRes] = await Promise.all([
        statutesService.listGroups(),
        statutesService.listStatutes(),
        statutesService.listAcknowledgements()
      ]);

      if (grpRes?.success) setGroups(grpRes.data || grpRes.groups || []);
      if (stRes?.success) setStatutes(stRes.data || stRes.statutes || []);
      if (ackRes?.success) setAcks(ackRes.data || ackRes.acks || []);
    } catch (e) {
      setError(e.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroup.nome.trim()) return;
    const res = await statutesService.createGroup({ nome: newGroup.nome.trim() });
    if (res?.success) {
      setNewGroup({ nome: '' });
      loadAll();
    }
  };

  const handleCreateStatute = async (e) => {
    e.preventDefault();
    if (!newStatute.title.trim()) return;
    const payload = { title: newStatute.title.trim(), code: newStatute.code.trim() || undefined, group_id: newStatute.group_id || undefined };
    const res = await statutesService.createStatute(payload);
    if (res?.success) {
      setNewStatute({ title: '', code: '', group_id: '' });
      loadAll();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-2xl font-bold mb-2 text-gray-900">Administração de Termos</h1>
        <p className="text-sm text-gray-600 mb-6">Gerencie grupos, estatutos e consulte a ciência dos usuários.</p>

        {loading && <div className="text-gray-500">Carregando...</div>}
        {error && <div className="text-red-600 text-sm mb-4">{error}</div>}

        {!loading && !error && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Coluna 1: Grupos */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Grupos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleCreateGroup} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="text-xs text-gray-500">Nome do Grupo</label>
                    <Input value={newGroup.nome} onChange={e => setNewGroup({ nome: e.target.value })} placeholder="Ex: Geral" />
                  </div>
                  <Button type="submit" size="sm">Adicionar</Button>
                </form>
                <div className="space-y-2">
                  {groups.length === 0 && <p className="text-xs text-gray-500">Nenhum grupo (endpoint pode estar ausente).</p>}
                  {groups.map(g => (
                    <div key={g.id || g.nome} className="flex items-center justify-between text-sm border rounded px-2 py-1 bg-white">
                      <span>{g.nome || g.title}</span>
                      <Badge className="bg-gray-200 text-gray-700">{g.id ? 'ID:' + g.id : 'Sem ID'}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Coluna 2: Estatutos */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Estatutos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleCreateStatute} className="space-y-2">
                  <div>
                    <label className="text-xs text-gray-500">Título</label>
                    <Input value={newStatute.title} onChange={e => setNewStatute(s => ({ ...s, title: e.target.value }))} placeholder="Ex: Política de Segurança" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Código (opcional)</label>
                    <Input value={newStatute.code} onChange={e => setNewStatute(s => ({ ...s, code: e.target.value }))} placeholder="POL-SEG-001" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Grupo (opcional)</label>
                    <select className="w-full border rounded h-9 text-sm px-2 bg-white" value={newStatute.group_id} onChange={e => setNewStatute(s => ({ ...s, group_id: e.target.value }))}>
                      <option value="">— Sem grupo —</option>
                      {groups.map(g => (
                        <option key={g.id || g.nome} value={g.id}>{g.nome || g.title}</option>
                      ))}
                    </select>
                  </div>
                  <Button type="submit" size="sm" className="w-full">Criar Estatuto</Button>
                </form>

                <div className="space-y-2">
                  {statutes.length === 0 && <p className="text-xs text-gray-500">Nenhum estatuto listado (endpoint pode estar ausente).</p>}
                  {statutes.map(s => (
                    <div key={s.id || s.title} className="border rounded px-2 py-1 bg-white text-sm space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{s.title}</span>
                        {s.code && <Badge className="bg-blue-600 text-white">{s.code}</Badge>}
                      </div>
                      {Array.isArray(s.items) && s.items.length > 0 && (
                        <ul className="list-disc ml-4 text-xs text-gray-600">
                          {s.items.map(it => <li key={it.id}>{it.text}</li>)}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Coluna 3: Ciência dos Usuários */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Ciência dos Usuários</CardTitle>
              </CardHeader>
              <CardContent>
                {acks.length === 0 ? (
                  <p className="text-xs text-gray-500">Nenhum dado de ciência listado (aguardando endpoint /api/statutes/acks).</p>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-auto pr-2">
                    {acks.map(a => (
                      <div key={a.user_id + '-' + a.item_id} className="flex items-center justify-between text-xs border rounded px-2 py-1 bg-white">
                        <span className="truncate max-w-[140px]" title={a.user_email || a.user_id}>{a.user_email || a.user_id}</span>
                        <Badge className="bg-green-600 text-white">Item {a.item_code || a.item_id}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default TermsAdminPage;
