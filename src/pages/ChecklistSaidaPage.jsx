import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { ArrowLeft, CheckCircle, AlertTriangle, Clock, Save, FileText, Lock } from 'lucide-react';
import { alertasService, produtoService, checklistService, turnosService, userService } from '../services/api';

const ChecklistSaidaPage = () => {
  const navigate = useNavigate();
  const { turnoId } = useParams();
  const [itens, setItens] = useState([]);
  const [progresso, setProgresso] = useState({ total: 0, concluidas: 0, percent: 0 });
  const [alertasAtivos, setAlertasAtivos] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState({ open: false, pergunta: null, resposta: 'SIM', justificativa: '', lockOwned: false });
  const [contagemProg, setContagemProg] = useState({ total: 0, contados: 0, percent: 0 });
  const [turnoInfo, setTurnoInfo] = useState({ inicio: null, opener: null });
  const [instrucaoExpandida, setInstrucaoExpandida] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const tRes = await turnosService.getById(turnoId);
        const turno = tRes?.data || tRes;
        let opener = null;
        if (turno?.usuario_abertura) {
          try {
            const uRes = await userService.getById(turno.usuario_abertura);
            opener = uRes?.data || uRes?.user || null;
          } catch { /* ignore */ }
        }
        setTurnoInfo({ inicio: turno?.horario_inicio || null, opener });
      } catch { /* ignore */ }
    })();
  }, [turnoId]);

  useEffect(() => {
    if (turnoId) {
      verificarStatusTurno();
      carregarChecklist();
      carregarProgressoContagem();
    }
  }, [turnoId, carregarChecklist, carregarProgressoContagem]);

  const verificarStatusTurno = async () => {
    try {
      // Verificar alertas ativos
      // Verificar alertas ativos
      const alertasRes = await alertasService.getAll();
      const alertas = alertasRes.data || [];
      const ativos = alertas.filter(a => a.status === 'ativo');
      setAlertasAtivos(ativos.length);

    } catch (error) {
      console.error('Erro ao verificar status do turno:', error);
    }
  };

  const carregarChecklist = useCallback(async () => {
    setLoading(true);
    try {
      const res = await checklistService.get(turnoId, 'saida');
      const data = res?.data || { items: [], progresso: { total: 0, concluidas: 0, percent: 0 } };
      setItens(data.items || []);
      setProgresso(data.progresso || { total: 0, concluidas: 0, percent: 0 });
    } catch (err) {
      console.error('Erro ao carregar checklist de saída:', err);
    } finally {
      setLoading(false);
    }
  }, [turnoId]);

  const carregarProgressoContagem = useCallback(async () => {
    try {
      const produtosRes = await produtoService.getAll();
      const produtos = produtosRes.data || [];
      const totalProdutos = produtos.length;
      const key = `scc_contagem_done_${turnoId}`;
      let doneSet = new Set();
      try {
        const raw = window.localStorage.getItem(key);
        if (raw) doneSet = new Set(JSON.parse(raw));
      } catch { /* ignore */ }
      const concluidos = doneSet.size;
      const percent = totalProdutos > 0 ? Math.min(100, Math.round((concluidos / totalProdutos) * 100)) : 0;
      setContagemProg({ total: totalProdutos, contados: concluidos, percent });
    } catch (err) {
      console.debug('Não foi possível calcular progresso da contagem agora', err);
    }
  }, [turnoId]);

  const abrirPergunta = async (pergunta) => {
    try {
      const lockRes = await checklistService.lock(turnoId, pergunta.id);
      const owned = !!lockRes?.data?.owned;
      setModal({
        open: true,
        pergunta,
        resposta: pergunta?.resposta?.resposta || 'SIM',
        justificativa: pergunta?.resposta?.justificativa || '',
        lockOwned: owned
      });
    } catch (err) {
      console.error('Falha ao travar pergunta (saída):', err);
      alert('Não foi possível travar esta pergunta agora. Tente novamente.');
    }
  };

  const fecharModal = async () => {
    if (modal.open && modal.pergunta && modal.lockOwned) {
      try { await checklistService.unlock(turnoId, modal.pergunta.id); } catch { /* ignore */ }
    }
    setModal({ open: false, pergunta: null, resposta: 'SIM', justificativa: '', lockOwned: false });
  };

  const salvarResposta = async () => {
    if (!modal.pergunta) return;
    if (modal.resposta !== 'SIM' && (!modal.justificativa || modal.justificativa.trim() === '')) {
      alert('Justificativa é obrigatória quando a resposta não é SIM.');
      return;
    }
    setSaving(true);
    try {
      await checklistService.answer(turnoId, {
        pergunta_id: modal.pergunta.id,
        resposta: modal.resposta,
        justificativa: modal.justificativa || null
      });
      await carregarChecklist();
      await fecharModal();
    } catch (err) {
      alert(err?.message || 'Erro ao salvar resposta.');
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = () => {
    return progresso.percent === 100 ? (
      <Badge className="bg-green-500 text-white">Concluído</Badge>
    ) : (
      <Badge variant="outline">Pendente</Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando checklist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/turnos/${turnoId}`)}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar</span>
              </Button>
              <div className="flex items-center space-x-3">
                <div className="bg-red-600 text-white p-2 rounded-lg">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Checklist de Saída</h1>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>
                      {turnoInfo.inicio ? new Date(turnoInfo.inicio).toLocaleString() : 'Data/Hora N/D'}
                      {turnoInfo.opener ? ` • Aberto por: ${turnoInfo.opener.nome_completo || turnoInfo.opener.email}` : ''}
                    </span>
                    <span>•</span>
                    {getStatusBadge()}
                    <span>•</span>
                    <span>Alertas ativos: {alertasAtivos}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              Progresso: {progresso.concluidas}/{progresso.total} ({progresso.percent}%)
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Itens do Checklist de Saída</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Progresso */}
            <div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: `${progresso.percent}%` }}></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{progresso.concluidas} de {progresso.total} concluídas</span>
                <span>{progresso.percent}%</span>
              </div>
            </div>

            {/* Lista de itens */}
            <div className="space-y-3">
              {itens.map(item => {
                const locked = !!item.lock && item.lock.usuario_id && (!modal.pergunta || modal.pergunta.id !== item.id);
                const answered = !!item.resposta;
                return (
                  <div key={item.id} className={`p-4 border rounded-lg flex items-start justify-between ${locked ? 'opacity-60' : ''}`}>
                    <div className="flex-1 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.pergunta}</span>
                        {answered ? (
                          <Badge className={(item.resposta.resposta === 'SIM' || ((item.resposta.resposta === 'NAO' || item.resposta.resposta === 'NA') && (item.resposta.justificativa || '').trim() !== '')) ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'}>
                            {item.resposta.resposta}
                          </Badge>
                        ) : (
                          <Badge variant="outline">Pendente</Badge>
                        )}
                        {locked && <Lock className="h-4 w-4 text-gray-400" title="Em edição por outro usuário" />}
                      </div>
                      {/* Instrução removida da lista principal */}
                      {item.resposta?.justificativa && (
                        <p className="text-xs text-gray-600 mt-1">Justificativa: {item.resposta.justificativa}</p>
                      )}
                    </div>
                    <div>
                      {(!answered || item.resposta.resposta !== 'SIM') && (
                        <Button size="sm" className="mr-2" variant="secondary" disabled={locked}
                          onClick={async () => {
                            try {
                              await checklistService.answer(turnoId, { pergunta_id: item.id, resposta: 'SIM', justificativa: null });
                              await carregarChecklist();
                            } catch (e) { alert(e?.message || 'Falha ao marcar SIM'); }
                          }}>
                          Marcar SIM
                        </Button>
                      )}
                      <Button size="sm" variant="outline" disabled={locked} onClick={() => abrirPergunta(item)}>
                        Responder
                      </Button>
                    </div>
                  </div>
                );
              })}
              {itens.length === 0 && (
                <div className="text-sm text-gray-500">Nenhum item de check-out disponível para seus setores.</div>
              )}
            </div>

            {/* Sub-etapa: Contagem do Inventário */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Contagem do Inventário (Saída)</div>
                  <div className="w-48 bg-gray-200 rounded-full h-1.5 mt-2">
                    <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${contagemProg.percent}%` }}></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{contagemProg.contados} / {contagemProg.total} itens</div>
                </div>
                <Button size="sm" className="bg-blue-600 text-white" onClick={() => navigate(`/contagem/${turnoId}`)}>
                  Abrir Contagem
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
      {/* Modal de resposta */}
      {modal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 space-y-4">
            <div className="text-lg font-semibold">Responder</div>
            <div className="text-sm text-gray-800">{modal.pergunta?.pergunta}</div>
            {modal.pergunta?.instrucao && (
              <div className="text-xs text-gray-500">
                <div className="line-clamp-3 whitespace-pre-line">{modal.pergunta.instrucao}</div>
                <div className="mt-1 flex gap-2 items-start">
                  <Button size="xs" variant="ghost" onClick={() => setInstrucaoExpandida(v => !v)}>
                    {instrucaoExpandida ? 'Minimizar instruções' : 'Ver instruções completas'}
                  </Button>
                </div>
                {instrucaoExpandida && (
                  <div className="text-xs text-gray-700 whitespace-pre-line border rounded p-2 max-h-48 overflow-auto mt-1">{modal.pergunta.instrucao}</div>
                )}
              </div>
            )}
            <div className="flex gap-2 pt-2">
              {['SIM','NAO','NA'].map(opt => (
                <Button key={opt} variant={modal.resposta === opt ? 'default' : 'outline'} size="sm" onClick={() => setModal(m => ({ ...m, resposta: opt }))}>
                  {opt}
                </Button>
              ))}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Justificativa {modal.resposta !== 'SIM' ? '(obrigatória)' : '(opcional)'}</label>
              <div className="text-[11px] text-gray-500 mb-1">Inclua o nome de um admin responsável/ciência na justificativa.</div>
              <Textarea rows={4} value={modal.justificativa} onChange={(e) => setModal(m => ({ ...m, justificativa: e.target.value }))} placeholder="Descreva observações, ressalvas ou motivos." />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={fecharModal}>Cancelar</Button>
              <Button size="sm" disabled={saving} onClick={salvarResposta}>
                <Save className="h-4 w-4 mr-2" /> {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChecklistSaidaPage;
