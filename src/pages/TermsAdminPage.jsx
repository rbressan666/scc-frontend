import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { statutesService, userService } from '../services/api';
import { Badge } from '@/components/ui/badge';

// Tela simplificada conforme requisitos: criar grupos em modal separado e criar termos (itens) exigindo seleção de grupo.
// Termos só podem ser desativados, nunca editados.
// Ciência agregada: cada usuário listado uma vez com todos os termos e status (check ou exclamação).
const TermsAdminPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [groups, setGroups] = useState([]); // statutes
  const [acks, setAcks] = useState([]); // lista de acks crus
  const [users, setUsers] = useState([]);

  const [newTermText, setNewTermText] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');

  const [showGroupModal, setShowGroupModal] = useState(false);
  const [newGroupTitle, setNewGroupTitle] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [creatingTerm, setCreatingTerm] = useState(false);
  const [deactivating, setDeactivating] = useState(null);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statRes, ackRes, userRes] = await Promise.all([
        statutesService.listStatutes(),
        statutesService.listAcknowledgements(),
        userService.getAll(false)
      ]);
      if (statRes?.success) setGroups(statRes.data || []);
      if (ackRes?.success) setAcks(ackRes.data || []);
      // Normalizar resposta de usuários: pode vir {success, data} ou array direto
      const usersData = Array.isArray(userRes)
        ? userRes
        : (Array.isArray(userRes?.data) ? userRes.data : []);
      // Excluir administradores: apenas usuários assinam termos
      setUsers(usersData.filter(u => (u?.perfil || '').toLowerCase() !== 'admin'));
    } catch (e) {
      setError(e.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupTitle.trim()) return;
    setCreatingGroup(true);
    try {
      const res = await statutesService.createStatute({ title: newGroupTitle.trim() });
      if (res?.success) {
        setNewGroupTitle('');
        setShowGroupModal(false);
        loadAll();
      }
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleCreateTerm = async (e) => {
    e.preventDefault();
    if (!newTermText.trim() || !selectedGroupId) return;
    setCreatingTerm(true);
    try {
      const res = await statutesService.createItem(selectedGroupId, { text: newTermText.trim() });
      if (res?.success) {
        setNewTermText('');
        loadAll();
      }
    } finally {
      setCreatingTerm(false);
    }
  };

  const handleDeactivateTerm = async (itemId) => {
    setDeactivating(itemId);
    try {
      const res = await statutesService.updateItem(itemId, { active: false });
      if (res?.success) loadAll();
    } finally {
      setDeactivating(null);
    }
  };

  // Montar mapa de ciência: user -> set de item_ids
  const ackMap = acks.reduce((acc, a) => {
    if (!acc[a.user_id]) acc[a.user_id] = new Set();
    acc[a.user_id].add(a.item_id);
    return acc;
  }, {});

  // Lista plana de todos os termos ativos (para ordenação exibição global) e inativos (still show?)
  const allTerms = groups.flatMap(g => (g.items || []).map(it => ({ ...it, groupTitle: g.title })));
  allTerms.sort((a, b) => a.groupTitle.localeCompare(b.groupTitle) || a.sequence - b.sequence);

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Administração de Termos</h1>
            <p className="text-sm text-gray-600">Criar grupos separados e adicionar termos obrigando a seleção de grupo.</p>
          </div>
          <Button size="sm" onClick={() => setShowGroupModal(true)}>Novo Grupo</Button>
        </div>

        {loading && <div className="text-gray-500">Carregando...</div>}
        {error && <div className="text-red-600 text-sm mb-4">{error}</div>}

        {!loading && !error && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Coluna 1: Criar Termo */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Criar Termo</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateTerm} className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500">Grupo *</label>
                    <select
                      required
                      value={selectedGroupId}
                      onChange={e => setSelectedGroupId(e.target.value)}
                      className="w-full border rounded h-9 text-sm px-2 bg-white"
                    >
                      <option value="">Selecione...</option>
                      {groups.map(g => (
                        <option key={g.id} value={g.id}>{g.title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Texto do Termo *</label>
                    <Input
                      required
                      value={newTermText}
                      onChange={e => setNewTermText(e.target.value)}
                      placeholder="Digite o texto completo do termo"
                    />
                  </div>
                  <Button type="submit" size="sm" disabled={creatingTerm || !selectedGroupId || !newTermText.trim()} className="w-full">
                    {creatingTerm ? 'Criando...' : 'Incluir Termo'}
                  </Button>
                  <p className="text-[11px] text-gray-500">Termos não podem ser editados ou excluídos, apenas desativados.</p>
                </form>
              </CardContent>
            </Card>

            {/* Coluna 2: Grupos & Termos */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Grupos & Termos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[480px] overflow-auto pr-2">
                {groups.length === 0 && <p className="text-xs text-gray-500">Nenhum grupo criado.</p>}
                {groups.map(g => (
                  <div key={g.id} className="border rounded bg-white p-2 text-sm space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">{g.title}</span>
                      {!g.active && <Badge className="bg-gray-400 text-white">Inativo</Badge>}
                    </div>
                    {(g.items || []).length === 0 && <p className="text-[11px] text-gray-500">Sem termos neste grupo.</p>}
                    <ul className="space-y-1">
                      {(g.items || []).map(it => (
                        <li key={it.id} className="flex items-center justify-between border rounded px-2 py-1 text-xs">
                          <span className="whitespace-pre-wrap break-words" title={it.text}>{it.text}</span>
                          <div className="flex items-center gap-2">
                            {it.active ? (
                              <Button
                                size="xs"
                                variant="ghost"
                                disabled={deactivating === it.id}
                                onClick={() => handleDeactivateTerm(it.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                {deactivating === it.id ? '...' : 'Desativar'}
                              </Button>
                            ) : (
                              <Badge className="bg-gray-300 text-gray-700">Desativado</Badge>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Coluna 3: Ciência por Usuário */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Ciência dos Usuários</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 max-h-[480px] overflow-auto pr-2">
                {users.length === 0 && <p className="text-xs text-gray-500">Nenhum usuário listado.</p>}
                {users.map(u => {
                  const ackSet = ackMap[u.id] || new Set();
                  return (
                    <div key={u.id} className="border rounded bg-white p-2">
                      <p className="text-sm font-medium mb-2">{u.nome_completo || u.email}</p>
                      <ul className="space-y-1 text-xs">
                        {allTerms.map(t => {
                          const signed = ackSet.has(t.id);
                          return (
                            <li key={t.id + '-' + u.id} className="flex items-center gap-2">
                              <span className="inline-block w-3 h-3 rounded-full flex-shrink-0 border border-gray-300 overflow-hidden">
                                {signed ? (
                                  <span className="w-full h-full bg-green-600 text-white flex items-center justify-center text-[10px]">✓</span>
                                ) : (
                                  <span className="w-full h-full bg-yellow-400 text-black flex items-center justify-center text-[10px]">!</span>
                                )}
                              </span>
                              <span className="whitespace-pre-wrap break-words" title={t.text}>{t.text}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {showGroupModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-semibold">Novo Grupo</h2>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="text-xs text-gray-500">Nome do Grupo *</label>
                <Input
                  value={newGroupTitle}
                  onChange={e => setNewGroupTitle(e.target.value)}
                  placeholder="Ex: Geral"
                  required
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowGroupModal(false)}>Cancelar</Button>
                <Button type="submit" size="sm" disabled={creatingGroup || !newGroupTitle.trim()}>{creatingGroup ? 'Criando...' : 'Criar Grupo'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TermsAdminPage;
