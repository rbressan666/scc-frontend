# Debug de navegação e redirects inesperados

Este projeto inclui um modo de debug leve para investigar redirecionamentos inesperados (ex.: voltar para o dashboard sozinho).

## Como ativar

No console do navegador, execute:

localStorage.setItem('scc_debug_nav','1')

Depois recarregue a página.

Para desativar:

localStorage.removeItem('scc_debug_nav')

## O que será registrado

- [NAV DEBUG]: eventos de navegação em:
  - ProtectedRoute (motivo e destino)
  - LoginPage (redirecionos pós-autenticação e QR login)
- [HTTP DEBUG]: cada resposta HTTP (status, URL) e erros HTTP.

Os logs incluem timestamp (ISO), rota atual (hash ou pathname), e contexto (ctx/reason/target).

## Interpretação do request /api/admin/db-usage

O chamado `/api/admin/db-usage` acontece SOMENTE quando o componente do Dashboard é montado (efeito `useEffect` lá busca o uso do banco). Portanto:

- Se você vê esse request logo após um "pulo" inesperado, ele é consequência do redirecionamento (porque o Dashboard acabou de montar), não a causa.
- Ele não dispara nenhuma navegação; apenas lê estatísticas e atualiza a barra de progresso.
- O redirecionamento em si deve gerar um log `[NAV DEBUG]` com `ctx: 'route-change'` (ou algum motivo em ProtectedRoute/LoginPage) imediatamente antes ou bem próximo do momento em que o Dashboard aparece.

Use isso para distinguir causa versus efeito: primeiro aparece o log de navegação, em seguida o request `db-usage`. Se você só vê o request mas não vê log de navegação, provavelmente o debug estava desligado ou houve um reload completo sem preservar o hash.

## Como coletar

1) Abra DevTools > Console e aba Network (marque "Preserve log").
2) Faça o fluxo que gera o redirect inesperado.
3) Quando ocorrer, copie as últimas linhas do Console contendo [NAV DEBUG] e [HTTP DEBUG].
4) Opcional: exporte a aba Network como HAR.

## Observações

- O modo de debug não altera o comportamento do app.
- Os logs rodam apenas localmente quando a flag está ativa.
- Lembre-se de desativar após o diagnóstico para reduzir ruído de console.
