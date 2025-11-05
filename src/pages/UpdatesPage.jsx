import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Info } from 'lucide-react';

function formatDateTime(isoDate, time) {
  // isoDate: YYYY-MM-DD, time: HH:mm (optional)
  try {
    const [y, m, d] = isoDate.split('-').map(Number);
    // Não precisamos do objeto Date aqui; apenas formatação DD/MM/YYYY
    const dd = String(d).padStart(2, '0');
    const mm = String(m).padStart(2, '0');
    const yyyy = String(y);
    return `${dd}/${mm}/${yyyy}${time ? ` ${time}` : ''}`;
  } catch {
    return `${isoDate}${time ? ` ${time}` : ''}`;
  }
}

const UpdatesPage = () => {
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch('/updates.json', { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!alive) return;
        // sort desc by date+time if time exists
        const norm = (data || []).map((x) => ({ ...x, _key: `${x.date} ${x.time || '00:00'}` }));
        norm.sort((a, b) => (a._key < b._key ? 1 : a._key > b._key ? -1 : 0));
        setItems(norm);
      } catch (e) {
        setError(e?.message || 'Falha ao carregar atualizações');
      }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Últimas Atualizações</h1>
          <p className="text-sm text-gray-600">Resumo das novidades e correções para os usuários do sistema.</p>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-red-800 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-3">
          {items.length === 0 && !error && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Info className="w-4 h-4 text-gray-500" />
                  Nenhuma atualização recente
                </CardTitle>
                <CardDescription className="text-xs">Em breve você verá as novidades por aqui.</CardDescription>
              </CardHeader>
            </Card>
          )}

          {items.map((it, idx) => (
            <Card key={idx}>
              <CardHeader className="pb-1">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base line-clamp-1">{it.title || 'Atualização'}</CardTitle>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatDateTime(it.date, it.time)}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 pb-3">
                <p className="text-sm text-gray-700 whitespace-pre-line">{it.summary}</p>
                {it.link && (
                  <div className="pt-2">
                    <a href={it.link} target="_blank" rel="noreferrer">
                      <Button variant="link" className="px-0">Saiba mais</Button>
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UpdatesPage;
