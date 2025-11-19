import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { statutesService, userService, setorService } from '../services/api';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
  const [userSectors, setUserSectors] = useState({}); // { userId: Set<setor_id> }

  const [newTermText, setNewTermText] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');

  const [showGroupModal, setShowGroupModal] = useState(false);
  const [newGroupTitle, setNewGroupTitle] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [groupSetorId, setGroupSetorId] = useState('');
  const [sectors, setSectors] = useState([]);
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
      const nonAdmins = usersData.filter(u => (u?.perfil || '').toLowerCase() !== 'admin');
      setUsers(nonAdmins);

      // Buscar setores por usuário (para filtrar grupos aplicáveis)
      const sectorResults = await Promise.all(
        nonAdmins.map(u => userService.getById(u.id).catch(() => null))
      );
      const sectorMap = {};
      sectorResults.forEach((res, idx) => {
        const uid = nonAdmins[idx].id;
        const setoresArr = res?.data?.setores || [];
        sectorMap[uid] = new Set(setoresArr.map(s => s.id));
      });
      setUserSectors(sectorMap);

      // Carregar setores para criação de grupos (estatutos)
      const setoresRes = await setorService.getAll(false);
      const setoresData = Array.isArray(setoresRes?.data) ? setoresRes.data : (Array.isArray(setoresRes) ? setoresRes : []);
      setSectors(setoresData.filter(s => s?.active !== false));
    } catch (e) {
      setError(e.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  // Helper slugify local (repete backend)
    const slugifyLocal = (str = '') => {
      return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // remove diacríticos
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // mantém apenas caracteres seguros
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
    };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupTitle.trim()) return;
    const slug = slugifyLocal(newGroupTitle.trim()).slice(0, 60) || 'grupo';
    const isGeneral = slug === 'geral';
    if (!isGeneral && !groupSetorId) return; // exige setor para não geral
    setCreatingGroup(true);
    try {
      const payload = { title: newGroupTitle.trim() };
      if (!isGeneral) payload.setor_id = groupSetorId;
      const res = await statutesService.createStatute(payload);
      if (res?.success) {
        setNewGroupTitle('');
        setGroupSetorId('');
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

  // Função para obter grupos aplicáveis a um usuário (geral + setores do usuário)
  const getApplicableGroupsForUser = (userId) => {
    const set = userSectors[userId];
    return groups
      .filter(g => g && (g.setor_id == null || (set instanceof Set && set.has(g.setor_id))))
      .map(g => ({
        ...g,
        items: (g.items || []).filter(it => it.active !== false)
      }))
      .sort((a, b) => a.title.localeCompare(b.title));
  };

  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header estilo planejamento */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-1"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar</span>
              </Button>
              <div className="flex items-center space-x-3">
                <div className="bg-yellow-600 text-white p-2 rounded-lg">
                  <span className="font-semibold text-xs">T&C</span>
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900 leading-tight">Administração de Termos</h1>
                  <p className="text-xs text-gray-500">Gerenciar grupos e termos; visualizar ciência</p>
                </div>
              </div>
            </div>
            <Button size="sm" onClick={() => setShowGroupModal(true)}>Novo Grupo</Button>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-6">

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

            {/* Coluna 3: Ciência por Usuário (subdividido por grupos aplicáveis) */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Ciência dos Usuários</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 max-h-[480px] overflow-auto pr-2">
                {users.length === 0 && <p className="text-xs text-gray-500">Nenhum usuário listado.</p>}
                {users.map(u => {
                  const ackSet = ackMap[u.id] || new Set();
                  const applicableGroups = getApplicableGroupsForUser(u.id);
                  return (
                    <div key={u.id} className="border rounded bg-white p-2 space-y-2">
                      <p className="text-sm font-medium">{u.nome_completo || u.email}</p>
                      {applicableGroups.length === 0 && (
                        <p className="text-[11px] text-gray-500">Sem grupos aplicáveis para este usuário.</p>
                      )}
                      {applicableGroups.map(g => (
                        <div key={g.id} className="bg-gray-50 border rounded p-2">
                          <p className="text-xs font-semibold mb-1">{g.title}</p>
                          <ul className="space-y-1 text-xs">
                            {(g.items || []).map(t => {
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
                      ))}
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
              {(() => {
                const slug = slugifyLocal(newGroupTitle.trim());
                const isGeneral = slug === 'geral';
                if (isGeneral) {
                  return <p className="text-[11px] text-gray-500">Grupo Geral não exige setor.</p>;
                }
                return (
                  <div>
                    <label className="text-xs text-gray-500">Setor *</label>
                    <select
                      required
                      value={groupSetorId}
                      onChange={e => setGroupSetorId(e.target.value)}
                      className="w-full border rounded h-9 text-sm px-2 bg-white"
                    >
                      <option value="">Selecione...</option>
                      {sectors.map(s => (
                        <option key={s.id} value={s.id}>{s.nome || s.nome_exibicao || s.code || s.id}</option>
                      ))}
                    </select>
                    <p className="text-[11px] text-gray-500 mt-1">Todo grupo (exceto Geral) deve estar associado a um setor.</p>
                  </div>
                );
              })()}
              <div className="flex items-center justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowGroupModal(false)}>Cancelar</Button>
                {(() => {
                  const slug = slugifyLocal(newGroupTitle.trim());
                  const isGeneral = slug === 'geral';
                  const disabled = creatingGroup || !newGroupTitle.trim() || (!isGeneral && !groupSetorId);
                  return <Button type="submit" size="sm" disabled={disabled}>{creatingGroup ? 'Criando...' : 'Criar Grupo'}</Button>;
                })()}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TermsAdminPage;
