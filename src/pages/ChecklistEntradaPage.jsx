import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Checkbox } from '../components/ui/checkbox';
import { Textarea } from '../components/ui/textarea';
import { ArrowLeft, CheckCircle, AlertTriangle, Clock, Save } from 'lucide-react';
import { contagensService } from '../services/api';

const ChecklistEntradaPage = () => {
  const navigate = useNavigate();
  const { turnoId } = useParams();
  const [checklist, setChecklist] = useState({
    contagem_realizada: false,
    verificacao_equipamentos: false,
    conferencia_produtos: false,
    validacao_sistema: false,
    observacoes: ''
  });
  const [contagensRealizadas, setContagensRealizadas] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (turnoId) {
      verificarContagensRealizadas();
      carregarChecklist();
    }
  }, [turnoId]);

  const verificarContagensRealizadas = async () => {
    try {
      const response = await contagensService.getByTurno(turnoId);
      const contagens = response.data || [];
      
      // Verificar se há contagens finalizadas (pré-fechadas ou fechadas)
      const contagensFinalizadas = contagens.filter(c => 
        c.status === 'pre_fechada' || c.status === 'fechada'
      );
      
      setContagensRealizadas(contagensFinalizadas.length > 0);
      
      // Se há contagens finalizadas, marcar automaticamente como realizada
      if (contagensFinalizadas.length > 0) {
        setChecklist(prev => ({
          ...prev,
          contagem_realizada: true
        }));
      }
    } catch (error) {
      console.error('Erro ao verificar contagens:', error);
    }
  };

  const carregarChecklist = () => {
    // Carregar checklist do localStorage (simulando persistência)
    const checklistSalvo = localStorage.getItem(`checklist_entrada_${turnoId}`);
    if (checklistSalvo) {
      setChecklist(JSON.parse(checklistSalvo));
    }
    setLoading(false);
  };

  const handleCheckboxChange = (field, checked) => {
    setChecklist(prev => ({
      ...prev,
      [field]: checked
    }));
  };

  const handleObservacoesChange = (value) => {
    setChecklist(prev => ({
      ...prev,
      observacoes: value
    }));
  };

  const handleSalvar = async () => {
    setSaving(true);
    try {
      // Salvar no localStorage (simulando persistência)
      localStorage.setItem(`checklist_entrada_${turnoId}`, JSON.stringify(checklist));
      
      // Simular delay de salvamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Checklist de entrada salvo com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar checklist:', error);
      alert('Erro ao salvar checklist.');
    } finally {
      setSaving(false);
    }
  };

  const isChecklistCompleto = () => {
    return checklist.contagem_realizada && 
           checklist.verificacao_equipamentos && 
           checklist.conferencia_produtos && 
           checklist.validacao_sistema;
  };

  const getStatusBadge = () => {
    if (isChecklistCompleto()) {
      return <Badge className="bg-green-500 text-white">Concluído</Badge>;
    }
    return <Badge variant="outline">Pendente</Badge>;
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
                <div className="bg-green-600 text-white p-2 rounded-lg">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Checklist de Entrada</h1>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>Turno: {turnoId}</span>
                    <span>•</span>
                    {getStatusBadge()}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleSalvar}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
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
              <span>Itens do Checklist de Entrada</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Contagem Realizada */}
            <div className="flex items-start space-x-3 p-4 border rounded-lg">
              <Checkbox
                id="contagem_realizada"
                checked={checklist.contagem_realizada}
                onCheckedChange={(checked) => handleCheckboxChange('contagem_realizada', checked)}
                className="mt-1"
              />
              <div className="flex-1">
                <label htmlFor="contagem_realizada" className="font-medium cursor-pointer">
                  A contagem de entrada foi realizada?
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  Confirme se a contagem inicial dos produtos foi executada e finalizada.
                </p>
                {contagensRealizadas && (
                  <div className="flex items-center space-x-2 mt-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600">
                      Contagens finalizadas detectadas automaticamente
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Verificação de Equipamentos */}
            <div className="flex items-start space-x-3 p-4 border rounded-lg">
              <Checkbox
                id="verificacao_equipamentos"
                checked={checklist.verificacao_equipamentos}
                onCheckedChange={(checked) => handleCheckboxChange('verificacao_equipamentos', checked)}
                className="mt-1"
              />
              <div className="flex-1">
                <label htmlFor="verificacao_equipamentos" className="font-medium cursor-pointer">
                  Verificação de equipamentos
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  Confirme se todos os equipamentos necessários estão funcionando corretamente.
                </p>
              </div>
            </div>

            {/* Conferência de Produtos */}
            <div className="flex items-start space-x-3 p-4 border rounded-lg">
              <Checkbox
                id="conferencia_produtos"
                checked={checklist.conferencia_produtos}
                onCheckedChange={(checked) => handleCheckboxChange('conferencia_produtos', checked)}
                className="mt-1"
              />
              <div className="flex-1">
                <label htmlFor="conferencia_produtos" className="font-medium cursor-pointer">
                  Conferência de produtos
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  Verifique se todos os produtos estão organizados e identificados corretamente.
                </p>
              </div>
            </div>

            {/* Validação de Sistema */}
            <div className="flex items-start space-x-3 p-4 border rounded-lg">
              <Checkbox
                id="validacao_sistema"
                checked={checklist.validacao_sistema}
                onCheckedChange={(checked) => handleCheckboxChange('validacao_sistema', checked)}
                className="mt-1"
              />
              <div className="flex-1">
                <label htmlFor="validacao_sistema" className="font-medium cursor-pointer">
                  Validação de sistema
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  Confirme se o sistema está funcionando corretamente e conectado.
                </p>
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Observações (opcional)
              </label>
              <Textarea
                value={checklist.observacoes}
                onChange={(e) => handleObservacoesChange(e.target.value)}
                placeholder="Adicione observações sobre o checklist de entrada..."
                rows={4}
              />
            </div>

            {/* Status do Checklist */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {isChecklistCompleto() ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-600">
                        Checklist de entrada concluído
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      <span className="font-medium text-yellow-600">
                        Checklist de entrada pendente
                      </span>
                    </>
                  )}
                </div>
                
                <div className="text-sm text-gray-500">
                  {Object.values(checklist).filter(v => v === true).length} de 4 itens concluídos
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ChecklistEntradaPage;
