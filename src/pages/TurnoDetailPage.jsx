import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, LogIn, LogOut } from 'lucide-react';
import { turnosService } from '../services/api';

const TurnoDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  console.log('TurnoDetailPage renderizado com ID:', id);
  
  const [turno, setTurno] = useState(null);
  const [comparacao, setComparacao] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    fetchTurnoDetail();
  }, [id]);

  const fetchTurnoDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Buscando detalhe do turno:', id);
      const response = await turnosService.getDetail(id);
      console.log('Resposta da API:', response);
      
      if (response.success) {
        console.log('Dados do turno:', response.data.turno);
        console.log('Dados de comparação:', response.data.comparacao);
        setTurno(response.data.turno);
        setComparacao(response.data.comparacao || []);
      } else {
        setError(response.message || 'Erro ao carregar turno');
      }
    } catch (err) {
      console.error('Erro ao carregar detalhe do turno:', err);
      setError('Erro ao carregar detalhe do turno. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      setCheckinLoading(true);
      const response = await turnosService.checkIn(id);
      
      if (response.success) {
        alert('Check-in registrado com sucesso');
        await fetchTurnoDetail();
      } else {
        alert(response.message || 'Erro ao registrar check-in');
      }
    } catch (err) {
      console.error('Erro ao registrar check-in:', err);
      alert('Erro ao registrar check-in. Tente novamente.');
    } finally {
      setCheckinLoading(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setCheckoutLoading(true);
      const response = await turnosService.checkOut(id);
      
      if (response.success) {
        alert('Check-out registrado com sucesso');
        await fetchTurnoDetail();
      } else {
        alert(response.message || 'Erro ao registrar check-out');
      }
    } catch (err) {
      console.error('Erro ao registrar check-out:', err);
      alert('Erro ao registrar check-out. Tente novamente.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Carregando dados do turno...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 p-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>
        <div className="bg-red-50 border border-red-200 rounded p-4 text-red-800">
          {error}
        </div>
      </div>
    );
  }

  if (!turno) {
    return (
      <div className="space-y-4 p-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>
        <div className="text-lg text-gray-600">Turno não encontrado</div>
      </div>
    );
  }

  const dataAnterior = comparacao[0]?.data_anterior 
    ? new Date(comparacao[0].data_anterior).toLocaleDateString('pt-BR') 
    : 'N/A';
  
  const dataAtual = comparacao[0]?.data_atual 
    ? new Date(comparacao[0].data_atual).toLocaleDateString('pt-BR') 
    : new Date().toLocaleDateString('pt-BR');

  const hasCheckin = comparacao.some(item => item.tem_anterior || item.contagem_atual > 0);

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold">Detalhe do Turno</h1>
      </div>

      {/* Turno Info */}
      <Card>
        <CardHeader>
          <CardTitle>
            {turno.tipo_turno?.toUpperCase() || 'TURNO'} - {new Date(turno.data_turno).toLocaleDateString('pt-BR')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Início</p>
              <p className="font-semibold">
                {new Date(turno.horario_inicio).toLocaleTimeString('pt-BR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <Badge variant={turno.status === 'aberto' ? 'default' : 'secondary'}>
                {turno.status?.toUpperCase() || 'DESCONHECIDO'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Checks */}
      <div className="grid grid-cols-2 gap-4">
        <Button 
          onClick={handleCheckIn}
          disabled={checkinLoading}
          className="bg-green-500 hover:bg-green-600 text-white"
        >
          <LogIn className="w-4 h-4 mr-2" />
          {checkinLoading ? 'Processando...' : 'Check-in'}
        </Button>
        <Button 
          onClick={handleCheckOut}
          disabled={checkoutLoading}
          className="bg-red-500 hover:bg-red-600 text-white"
        >
          <LogOut className="w-4 h-4 mr-2" />
          {checkoutLoading ? 'Processando...' : 'Check-out'}
        </Button>
      </div>

      {/* Tabela de Contagens */}
      <Card>
        <CardHeader>
          <CardTitle>Comparação de Contagens</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-300 bg-gray-50">
                  <th className="text-left py-3 px-2 font-semibold">Produto</th>
                  <th className="text-center py-3 px-2 font-semibold text-xs">{dataAnterior}</th>
                  <th className="text-center py-3 px-2 font-semibold text-xs">{dataAtual}</th>
                  <th className="text-center py-3 px-2 font-semibold text-xs">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {comparacao.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-4 text-gray-500">
                      Nenhum produto contado ainda
                    </td>
                  </tr>
                ) : (
                  comparacao.map((item, idx) => (
                    <tr key={`${item.produto_id}-${idx}`} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-2 font-medium text-gray-900">
                        {item.produto_nome || 'Produto sem nome'}
                      </td>
                      <td className="text-center py-3 px-2 text-gray-600">
                        {item.tem_anterior ? `${item.contagem_anterior || 0} un` : '—'}
                      </td>
                      <td className="text-center py-3 px-2">
                        <Badge variant="default" className="justify-center">
                          {item.contagem_atual || 0} un
                        </Badge>
                      </td>
                      <td className="text-center py-3 px-2 font-bold">
                        <span className={item.saldo < 0 ? 'text-red-600' : item.saldo > 0 ? 'text-green-600' : 'text-gray-600'}>
                          {item.saldo > 0 ? '+' : ''}{item.saldo} un
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Botão para ir à contagem */}
      {hasCheckin && (
        <Button 
          onClick={() => navigate(`/contagem/${id}`)}
          className="w-full"
          size="lg"
        >
          Editar Contagem
        </Button>
      )}
    </div>
  );
};

export default TurnoDetailPage;
