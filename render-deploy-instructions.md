# Instruções de Deploy - SCC Frontend no Render

## Problema Identificado
O deploy estava falhando devido à dependência `autoprefixer` não estar listada no `package.json`, mas sendo requerida pelo `postcss.config.js`.

## Soluções Implementadas

### Opção 1: Adicionar autoprefixer (Recomendada)
1. Substitua o `package.json` pelo arquivo corrigido que inclui `"autoprefixer": "^10.4.20"` nas devDependencies
2. Execute `pnpm install` para atualizar o lockfile
3. Faça commit e push das alterações

### Opção 2: Remover autoprefixer do PostCSS
1. Substitua o `postcss.config.js` pela versão sem autoprefixer
2. O TailwindCSS v4 já inclui autoprefixer internamente
3. Faça commit e push das alterações

## Configurações do Render

### Build Settings
- **Build Command**: `pnpm install --no-frozen-lockfile && pnpm run build` (temporário)
- **Publish Directory**: `dist`
- **Node Version**: 22.16.0 (ou superior)

### Solução para pnpm-lock.yaml Desatualizado
Se encontrar erro de lockfile desatualizado, use uma das opções:

**Opção A (Solução Rápida):**
- Altere o Build Command para: `pnpm install --no-frozen-lockfile && pnpm run build`

**Opção B (Solução Definitiva):**
1. Execute o script `update-lockfile.sh` localmente
2. Faça commit do novo `pnpm-lock.yaml`
3. Use o Build Command padrão: `pnpm install && pnpm run build`

### Variáveis de Ambiente
Certifique-se de configurar:
- `VITE_API_URL`: URL do backend (ex: `https://seu-backend.onrender.com`)
- Outras variáveis específicas do projeto conforme necessário

## Verificação Pós-Deploy
1. Acesse a URL do frontend
2. Verifique se não há erros no console do navegador
3. Teste a conectividade com o backend
4. Confirme que o CSS está sendo aplicado corretamente

## Troubleshooting
- Se ainda houver erros de PostCSS, verifique se todas as dependências estão listadas
- Para projetos com TailwindCSS v4, considere usar apenas o TailwindCSS sem autoprefixer adicional
- Verifique se o pnpm-lock.yaml está atualizado após mudanças no package.json
