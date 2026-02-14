import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, Plus, Upload, X, Image as ImageIcon, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '../context/useAuth';
import api from '../services/api';

const AdminPedidosPropagandaPage = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('parametros');

  // Estados da Tab 1: Parâmetros
  const [parametros, setParametros] = useState({
    autostart: true,
    modo_exibicao: 'pedidos-propaganda',
    intervalo_exibicao_seg: 10,
    exibir_numero_pedido: true,
    exibir_observacao_pedido: true,
    cor_fundo_principal: '#000000',
    cor_texto_principal: '#FFFFFF',
    cor_destaque_numero: '#FFD700',
    imagem_fundo_id: null,
    video_propaganda_id: null,
    som_notificacao_novos_pedidos_id: null,
    ativa: true
  });
  const [uploadPreview, setUploadPreview] = useState({ image: null, video: null, audio: null });

  // Estados da Tab 2: Histórico de Pedidos
  const [pedidos, setPedidos] = useState([]);
  const [modalNovoPedido, setModalNovoPedido] = useState({ open: false, numero: '', observacao: '' });

  // Redirect se não for admin
  useEffect(() => {
    if (!isAdmin()) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

  // Carregar parâmetros ao abrir a tab
  useEffect(() => {
    if (activeTab === 'parametros') {
      fetchParametros();
      // fetchMediaLists(); // TODO: implementar quando houver endpoints
    }
  }, [activeTab]);

  // Carregar pedidos ao abrir a tab de histórico
  useEffect(() => {
    if (activeTab === 'historico') {
      fetchPedidos();
    }
  }, [activeTab]);

  const fetchParametros = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/parametros-propaganda');
      if (res.data?.success) {
        setParametros(res.data.data);
      }
    } catch (err) {
      console.error('Erro ao carregar parâmetros:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPedidos = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/pedidos');
      const data = res.data?.data || res.data || [];
      setPedidos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erro ao carregar pedidos:', err);
      setPedidos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveParametros = async () => {
    setLoading(true);
    try {
      const res = await api.put('/api/parametros-propaganda', parametros);
      if (res.data?.success || res.success) {
        alert('Parâmetros salvos com sucesso!');
        fetchParametros(); // Recarregar para pegar valores atualizados
      } else {
        alert('Erro: ' + (res.data?.message || 'Resposta inesperada do servidor'));
      }
    } catch (err) {
      console.error('Erro ao salvar parâmetros:', err);
      const msg = err.response?.data?.message || err.message || 'Erro ao salvar parâmetros';
      alert('Erro ao salvar: ' + msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePedido = async () => {
    if (!modalNovoPedido.numero) {
      alert('Número do pedido é obrigatório');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/api/pedidos', {
        numero_pedido: modalNovoPedido.numero,
        observacao: modalNovoPedido.observacao || null
      });
      if (res.data?.success) {
        alert('Pedido criado com sucesso!');
        setModalNovoPedido({ open: false, numero: '', observacao: '' });
        fetchPedidos();
      }
    } catch (err) {
      console.error('Erro ao criar pedido:', err);
      const msg = err.response?.data?.message || 'Erro ao criar pedido';
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePedido = async (id) => {
    if (!confirm('Deseja realmente excluir este pedido?')) return;
    setLoading(true);
    try {
      const res = await api.delete(`/api/pedidos/${id}`);
      if (res.data?.success) {
        alert('Pedido excluído com sucesso!');
        fetchPedidos();
      }
    } catch (err) {
      console.error('Erro ao excluir pedido:', err);
      alert('Erro ao excluir pedido');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (type, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validação básica
    if (type === 'image') {
      if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
        alert('Apenas PNG, JPG ou JPEG são permitidos');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('Imagem muito grande (máximo 5MB)');
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        setUploadPreview({ ...uploadPreview, image: ev.target.result });
      };
      reader.readAsDataURL(file);
    } else if (type === 'audio') {
      if (!['audio/mpeg', 'audio/wav', 'audio/ogg'].includes(file.type)) {
        alert('Apenas MP3, WAV ou OGG são permitidos');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert('Áudio muito grande (máximo 10MB)');
        return;
      }
      setUploadPreview({ ...uploadPreview, audio: file.name });
    }

    // TODO: Implementar upload real para o backend/storage
    console.log('Upload simulado:', type, file);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Controle de Pedidos/Propaganda</h1>
              <p className="text-sm text-gray-600">Gerenciar configurações e histórico</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="parametros">Parâmetros do App TV</TabsTrigger>
            <TabsTrigger value="historico">Histórico de Pedidos</TabsTrigger>
          </TabsList>

          {/* Tab 1: Parâmetros */}
          <TabsContent value="parametros">
            <Card>
              <CardHeader>
                <CardTitle>Configuração do App de Visualização TV</CardTitle>
                <CardDescription>
                  Ajuste o comportamento do aplicativo Android que exibe pedidos e propaganda nas TVs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {loading && <div className="text-center text-gray-500">Carregando...</div>}
                {!loading && (
                  <>
                    {/* Autostart */}
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="autostart"
                        checked={parametros.autostart}
                        onChange={(e) => setParametros({ ...parametros, autostart: e.target.checked })}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="autostart">Autostart (iniciar automaticamente ao ligar o Android TV)</Label>
                    </div>

                    {/* Modo de Exibição */}
                    <div>
                      <Label htmlFor="modo_exibicao">Modo de Exibição</Label>
                      <Select
                        value={parametros.modo_exibicao}
                        onValueChange={(val) => setParametros({ ...parametros, modo_exibicao: val })}
                      >
                        <SelectTrigger id="modo_exibicao">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pedidos-propaganda">Pedidos e Propaganda</SelectItem>
                          <SelectItem value="pedidos-only">Apenas Pedidos</SelectItem>
                          <SelectItem value="propaganda-only">Apenas Propaganda</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Intervalo de Exibição */}
                    <div>
                      <Label htmlFor="intervalo">Intervalo de Exibição (segundos)</Label>
                      <Input
                        id="intervalo"
                        type="number"
                        min="1"
                        value={parametros.intervalo_exibicao_seg}
                        onChange={(e) => setParametros({ ...parametros, intervalo_exibicao_seg: parseInt(e.target.value) || 10 })}
                      />
                    </div>

                    {/* Exibir Número do Pedido */}
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="exibir_numero"
                        checked={parametros.exibir_numero_pedido}
                        onChange={(e) => setParametros({ ...parametros, exibir_numero_pedido: e.target.checked })}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="exibir_numero">Exibir número do pedido na tela</Label>
                    </div>

                    {/* Exibir Observação */}
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="exibir_obs"
                        checked={parametros.exibir_observacao_pedido}
                        onChange={(e) => setParametros({ ...parametros, exibir_observacao_pedido: e.target.checked })}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="exibir_obs">Exibir observação do pedido na tela</Label>
                    </div>

                    {/* Cores */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="cor_fundo">Cor de Fundo Principal</Label>
                        <div className="flex gap-2 items-center">
                          <Input
                            id="cor_fundo"
                            type="color"
                            value={parametros.cor_fundo_principal}
                            onChange={(e) => setParametros({ ...parametros, cor_fundo_principal: e.target.value })}
                            className="w-16 h-10"
                          />
                          <Input
                            type="text"
                            value={parametros.cor_fundo_principal}
                            onChange={(e) => setParametros({ ...parametros, cor_fundo_principal: e.target.value })}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="cor_texto">Cor do Texto Principal</Label>
                        <div className="flex gap-2 items-center">
                          <Input
                            id="cor_texto"
                            type="color"
                            value={parametros.cor_texto_principal}
                            onChange={(e) => setParametros({ ...parametros, cor_texto_principal: e.target.value })}
                            className="w-16 h-10"
                          />
                          <Input
                            type="text"
                            value={parametros.cor_texto_principal}
                            onChange={(e) => setParametros({ ...parametros, cor_texto_principal: e.target.value })}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="cor_destaque">Cor de Destaque (Número)</Label>
                        <div className="flex gap-2 items-center">
                          <Input
                            id="cor_destaque"
                            type="color"
                            value={parametros.cor_destaque_numero}
                            onChange={(e) => setParametros({ ...parametros, cor_destaque_numero: e.target.value })}
                            className="w-16 h-10"
                          />
                          <Input
                            type="text"
                            value={parametros.cor_destaque_numero}
                            onChange={(e) => setParametros({ ...parametros, cor_destaque_numero: e.target.value })}
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Seção de Propaganda - Apenas quando modo inclui propaganda */}
                    {(parametros.modo_exibicao === 'propaganda-only' || parametros.modo_exibicao === 'pedidos-propaganda') && (
                      <div className="border-t pt-6 mt-6">
                        <h3 className="text-lg font-semibold mb-4">Configurações de Propaganda</h3>
                        
                        {/* Upload de Imagem de Fundo */}
                        <div className="mb-4">
                          <Label htmlFor="upload_image">Imagem de Fundo (PNG/JPG/JPEG, máx 5MB)</Label>
                          <div className="flex gap-2 items-center">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => document.getElementById('upload_image').click()}
                            >
                              <ImageIcon className="h-4 w-4 mr-2" />
                              Escolher Imagem
                            </Button>
                            <input
                              id="upload_image"
                              type="file"
                              accept="image/png,image/jpeg,image/jpg"
                              className="hidden"
                              onChange={(e) => handleFileUpload('image', e)}
                            />
                            {uploadPreview.image && (
                              <div className="relative">
                                <img src={uploadPreview.image} alt="Preview" className="h-20 w-20 object-cover rounded border" />
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="absolute -top-2 -right-2 h-6 w-6 p-0 bg-red-500 text-white rounded-full"
                                  onClick={() => setUploadPreview({ ...uploadPreview, image: null })}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Esta imagem será exibida como fundo nas telas de propaganda</p>
                        </div>

                        {/* TODO: Adicionar múltiplas imagens de propaganda aqui */}
                        <div className="bg-gray-50 border border-dashed rounded p-4 text-center text-gray-500 text-sm">
                          <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>Gestão de múltiplas imagens de propaganda será implementada em breve</p>
                        </div>
                      </div>
                    )}

                    {/* Upload de Áudio (Som de Notificação) */}
                    <div>
                      <Label htmlFor="upload_audio">Som de Notificação para Novos Pedidos (MP3/WAV/OGG, máx 10MB)</Label>
                      <div className="flex gap-2 items-center">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('upload_audio').click()}
                        >
                          <Volume2 className="h-4 w-4 mr-2" />
                          Escolher Áudio
                        </Button>
                        <input
                          id="upload_audio"
                          type="file"
                          accept="audio/mpeg,audio/wav,audio/ogg"
                          className="hidden"
                          onChange={(e) => handleFileUpload('audio', e)}
                        />
                        {uploadPreview.audio && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-700">{uploadPreview.audio}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setUploadPreview({ ...uploadPreview, audio: null })}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Este som será reproduzido quando um novo pedido for criado</p>
                    </div>

                    {/* Ativa */}
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="ativa"
                        checked={parametros.ativa}
                        onChange={(e) => setParametros({ ...parametros, ativa: e.target.checked })}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="ativa">Configuração Ativa (desmarque para desabilitar o app temporariamente)</Label>
                    </div>

                    {/* Botão Salvar */}
                    <div className="flex justify-end pt-4">
                      <Button onClick={handleSaveParametros} disabled={loading}>
                        <Save className="h-4 w-4 mr-2" />
                        {loading ? 'Salvando...' : 'Salvar Parâmetros'}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Histórico de Pedidos */}
          <TabsContent value="historico">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Histórico de Pedidos (Últimas 24h)</CardTitle>
                    <CardDescription>Pedidos criados e exibidos no app TV</CardDescription>
                  </div>
                  <Button onClick={() => setModalNovoPedido({ open: true, numero: '', observacao: '' })}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Pedido
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading && <div className="text-center text-gray-500">Carregando...</div>}
                {!loading && pedidos.length === 0 && (
                  <div className="text-center text-gray-500 py-8">Nenhum pedido registrado nas últimas 24 horas</div>
                )}
                {!loading && pedidos.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-3">Número</th>
                          <th className="text-left py-2 px-3">Data/Hora</th>
                          <th className="text-left py-2 px-3">Observação</th>
                          <th className="text-left py-2 px-3">Usuário</th>
                          <th className="text-center py-2 px-3">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pedidos.map((pedido) => (
                          <tr key={pedido.id} className="border-b hover:bg-gray-50">
                            <td className="py-2 px-3 font-semibold">{pedido.numero_pedido}</td>
                            <td className="py-2 px-3">{new Date(pedido.data_hora).toLocaleString()}</td>
                            <td className="py-2 px-3">{pedido.observacao || '-'}</td>
                            <td className="py-2 px-3">{pedido.usuario_id || '-'}</td>
                            <td className="py-2 px-3 text-center">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeletePedido(pedido.id)}
                                disabled={loading}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modal Novo Pedido */}
        {modalNovoPedido.open && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 space-y-4">
              <h2 className="text-lg font-semibold">Criar Novo Pedido</h2>
              <div>
                <Label htmlFor="numero_pedido">Número do Pedido *</Label>
                <Input
                  id="numero_pedido"
                  type="text"
                  value={modalNovoPedido.numero}
                  onChange={(e) => setModalNovoPedido({ ...modalNovoPedido, numero: e.target.value })}
                  placeholder="Ex: 001"
                />
                <p className="text-xs text-gray-500 mt-1">Números podem se repetir diariamente (reset 24h)</p>
              </div>
              <div>
                <Label htmlFor="observacao_pedido">Observação (opcional)</Label>
                <Textarea
                  id="observacao_pedido"
                  value={modalNovoPedido.observacao}
                  onChange={(e) => setModalNovoPedido({ ...modalNovoPedido, observacao: e.target.value })}
                  placeholder="Detalhes adicionais do pedido..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setModalNovoPedido({ open: false, numero: '', observacao: '' })}
                >
                  Cancelar
                </Button>
                <Button size="sm" onClick={handleCreatePedido} disabled={loading}>
                  {loading ? 'Criando...' : 'Criar Pedido'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPedidosPropagandaPage;
