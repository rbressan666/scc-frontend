import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Checkbox } from '../components/ui/checkbox';
import { Textarea } from '../components/ui/textarea';
import { ArrowLeft, CheckCircle, AlertTriangle, Clock, Save, FileText } from 'lucide-react';
import { contagensService, alertasService } from '../services/api';

const ChecklistSaidaPage = () => {
  const navigate = useNavigate();
  const { turnoId } = useParams();
  const [checklist, setChecklist] = useState({
    contagem_realizada: false,
    alertas_resolvidos: false,
    relatorios_gerados: false,
    equipamentos_desligados: false,
    observacoes: ''
  });
  const [contagensFinalizadas, setContagensFinalizadas] = useState(false);
  const [alertasAtivos, setAlertasAtivos] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (turnoId) {
      verificarStatusTurno();
      carregarChecklist();
    }
  }, [turnoId]);

  const verificarStatusTurno = async () => {
    try {
      // Verificar contagens finalizadas
      const contagensRes = await contagensService.getByTurno(turnoId);
      const contagens = contagensRes.data || [];
      const finalizadas = contagens.filter(c => c.status === 'fechada');
      setContagensFinalizadas(finalizadas.length > 0);

      // Se há contagens finalizadas, marcar automaticamente
      if (finalizadas.length > 0) {
        setChecklist(prev => ({
          ...prev,
          contagem_realizada: true
        }));
      }

      // Verificar alertas ativos
      const alertasRes = await alertasService.getAll();
      const alertas = alertasRes.data || [];
      const ativos = alertas.filter(a => a.status === 'ativo');
      setAlertasAtivos(ativos.length);

      // Se não há alertas ativos, marcar automaticamente
      if (ativos.length === 0) {
        setChecklist(prev => ({
          ...prev,
          alertas_resolvidos: true
        }));
      }

    } catch (error) {
      console.error('Erro ao verificar status do turno:', error);
    }
  };

  const carregarChecklist = () => {
    // Carregar checklist do localStorage (simulando persistência)
    const checklistSalvo = localStorage.getItem(`checklist_saida_${turnoId}`);
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
      localStorage.setItem(`checklist_saida_${turnoId}`, JSON.stringify(checklist));
      
      // Simular delay de salvamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Checklist de saída salvo com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar checklist:', error);
      alert('Erro ao salvar checklist.');
    } finally {
      setSaving(false);
    }
  };

  const isChecklistCompleto = () => {
    return checklist.contagem_realizada && 
           checklist.alertas_resolvidos && 
           checklist.relatorios_gerados && 
           checklist.equipamentos_desligados;
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
                <div className="bg-red-600 text-white p-2 rounded-lg">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Checklist de Saída</h1>
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
              <span>Itens do Checklist de Saída</span>
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
                  A contagem de saída foi realizada?
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  Confirme se a contagem final dos produtos foi executada e finalizada.
                </p>
                {contagensFinalizadas && (
                  <div className="flex items-center space-x-2 mt-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600">
                      Contagens finalizadas detectadas automaticamente
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Alertas Resolvidos */}
            <div className="flex items-start space-x-3 p-4 border rounded-lg">
              <Checkbox
                id="alertas_resolvidos"
                checked={checklist.alertas_resolvidos}
                onCheckedChange={(checked) => handleCheckboxChange('alertas_resolvidos', checked)}
                className="mt-1"
              />
              <div className="flex-1">
                <label htmlFor="alertas_resolvidos" className="font-medium cursor-pointer">
                  Todos os alertas foram resolvidos?
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  Verifique se todos os alertas do sistema foram tratados adequadamente.
                </p>
                {alertasAtivos === 0 ? (
                  <div className="flex items-center space-x-2 mt-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600">
                      Nenhum alerta ativo encontrado
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 mt-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm text-yellow-600">
                      {alertasAtivos} alerta(s) ativo(s) pendente(s)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Relatórios Gerados */}
            <div className="flex items-start space-x-3 p-4 border rounded-lg">
              <Checkbox
                id="relatorios_gerados"
                checked={checklist.relatorios_gerados}
                onCheckedChange={(checked) => handleCheckboxChange('relatorios_gerados', checked)}
                className="mt-1"
              />
              <div className="flex-1">
                <label htmlFor="relatorios_gerados" className="font-medium cursor-pointer">
                  Relatórios foram gerados?
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  Confirme se todos os relatórios necessários foram gerados e salvos.
                </p>
              </div>
            </div>

            {/* Equipamentos Desligados */}
            <div className="flex items-start space-x-3 p-4 border rounded-lg">
              <Checkbox
                id="equipamentos_desligados"
                checked={checklist.equipamentos_desligados}
                onCheckedChange={(checked) => handleCheckboxChange('equipamentos_desligados', checked)}
                className="mt-1"
              />
              <div className="flex-1">
                <label htmlFor="equipamentos_desligados" className="font-medium cursor-pointer">
                  Equipamentos foram desligados?
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  Verifique se todos os equipamentos foram desligados adequadamente.
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
                placeholder="Adicione observações sobre o checklist de saída..."
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
                        Checklist de saída concluído
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      <span className="font-medium text-yellow-600">
                        Checklist de saída pendente
                      </span>
                    </>
                  )}
                </div>
                
                <div className="text-sm text-gray-500">
                  {Object.values(checklist).filter(v => v === true).length} de 4 itens concluídos
                </div>
              </div>

              {isChecklistCompleto() && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-600">
                      Turno pronto para fechamento
                    </span>
                  </div>
                  <p className="text-sm text-green-600 mt-1">
                    Todos os itens do checklist de saída foram concluídos. O turno pode ser fechado com segurança.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ChecklistSaidaPage;
