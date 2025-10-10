# SCC Frontend - Qualidade e Checks

Este projeto está configurado com verificações automáticas para evitar problemas comuns antes de chegar em produção.

## O que está habilitado

- ESLint com regras de React Hooks
  - Bloqueia hooks fora do topo do componente ou dentro de loops/ifs/maps
  - Regras principais:
    - `react-hooks/rules-of-hooks: error`
    - `react-hooks/exhaustive-deps: warn`

- Pre-commit automático (Husky + lint-staged)
  - Ao fazer commit, roda o ESLint apenas nos arquivos alterados e aplica correções quando possível
  - Se houver erro grave, o commit é bloqueado com uma mensagem explicando o problema

- CI no GitHub (Actions)
  - Job de Lint: roda `pnpm lint` em cada push/PR
  - Job de Build: compila o projeto com `pnpm build` em cada push/PR
  - Se algum job falhar, o PR fica vermelho e mostra onde está o erro

## Como usar no dia a dia

- No editor (VS Code)
  - O ESLint aponta problemas enquanto você digita
  - Ao salvar, correções automáticas são aplicadas quando seguras

- Antes de subir mudanças
  - O pre-commit já roda o ESLint nos arquivos alterados
  - No PR, verifique os jobs "Lint" e "Build"; se estiverem verdes, você está seguro

## Dicas

- Erros de Hooks (ex.: `useState` dentro de um `map`) serão marcados como erro pelo ESLint
- Se aparecer uma dica sobre `exhaustive-deps`, avalie se precisa mesmo adicionar a dependência no `useEffect`
- Se o Build falhar no CI, veja o log do job "Build" para identificar a linha e arquivo

## Scripts úteis

- `pnpm dev`: roda a aplicação em modo desenvolvimento
- `pnpm lint`: roda o ESLint em todo o projeto
- `pnpm build`: faz o build de produção
- `pnpm preview`: pré-visualiza o build

---

Se precisar, abra uma issue descrevendo o problema e copie o trecho do log do CI; isso ajuda a resolver mais rápido.
