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

## Como coletar

1) Abra DevTools > Console e aba Network (marque "Preserve log").
2) Faça o fluxo que gera o redirect inesperado.
3) Quando ocorrer, copie as últimas linhas do Console contendo [NAV DEBUG] e [HTTP DEBUG].
4) Opcional: exporte a aba Network como HAR.

## Observações

- O modo de debug não altera o comportamento do app.
- Os logs rodam apenas localmente quando a flag está ativa.
- Lembre-se de desativar após o diagnóstico para reduzir ruído de console.
