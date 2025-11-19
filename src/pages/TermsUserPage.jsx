import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { statutesService } from '../services/api';
import { useAuth } from '../context/useAuth';

// Página para usuário visualizar termos já reconhecidos (ciência)
// Como backend ainda não fornece endpoint de ciência, exibimos pendências ou mensagem.
const TermsUserPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [acks, setAcks] = useState([]); // futura lista de ciência
  const [pending, setPending] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        // Tentar ciência do usuário (endpoint futuro)
        const resAcks = await statutesService.userAcknowledgements(user?.id);
        if (resAcks?.success) {
          setAcks(resAcks.data || resAcks.acks || []);
        }
        // Carregar pendências atuais para mostrar diferença
        const resPending = await statutesService.getPending();
        if (resPending?.success) {
          setPending(resPending.data || []);
        }
      } catch (e) {
        setError(e.message || 'Erro ao carregar termos');
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) load();
  }, [user?.id]);

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-2xl font-bold mb-4 text-gray-900">Termos e Ciência</h1>
        <p className="text-sm text-gray-600 mb-6">Aqui você consulta os termos já reconhecidos e os que ainda pendem de ciência.</p>

        {loading && (
          <div className="text-gray-500">Carregando...</div>
        )}
        {error && (
          <div className="text-red-600 text-sm mb-4">{error}</div>
        )}

        {!loading && !error && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Termos já reconhecidos</CardTitle>
              </CardHeader>
              <CardContent>
                {acks.length === 0 ? (
                  <p className="text-sm text-gray-500">Nenhum termo reconhecido listado (endpoint de ciência ainda não disponível).</p>
                ) : (
                  <div className="space-y-4">
                    {acks.map((item) => (
                      <div key={item.id} className="flex items-start justify-between border-b pb-2">
                        <div>
                          <p className="font-medium text-gray-800">{item.title || item.text}</p>
                          {item.code && <p className="text-xs text-gray-500">Código: {item.code}</p>}
                        </div>
                        <Badge className="bg-green-600 text-white">Reconhecido</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pendências Atuais</CardTitle>
              </CardHeader>
              <CardContent>
                {pending.length === 0 ? (
                  <p className="text-sm text-gray-500">Você não possui termos pendentes.</p>
                ) : (
                  <div className="space-y-4">
                    {pending.map(group => (
                      <div key={group.statute.id} className="border rounded-md p-3">
                        <p className="font-semibold text-gray-800 mb-2">{group.statute.title}</p>
                        <ul className="space-y-1 ml-4 list-disc text-sm">
                          {group.items.map(it => (
                            <li key={it.id}>{it.text}</li>
                          ))}
                        </ul>
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

export default TermsUserPage;
