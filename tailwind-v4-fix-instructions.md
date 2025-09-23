# Correção para TailwindCSS v4 - Instruções Específicas

## Problema Identificado

O TailwindCSS v4 mudou a arquitetura e não funciona mais com a configuração PostCSS tradicional quando usado com Vite.

**Erro:**
```
It looks like you're trying to use `tailwindcss` directly as a PostCSS plugin. The PostCSS plugin has moved to a separate package...
```

## Solução Implementada

### Opção 1: Configuração Vite Pura (Recomendada)

1. **Substitua o `vite.config.js`** pelo arquivo fornecido que inclui:
   ```javascript
   import tailwindcss from '@tailwindcss/vite'
   
   export default defineConfig({
     plugins: [
       react(),
       tailwindcss(), // Plugin TailwindCSS v4 para Vite
     ],
   })
   ```

2. **REMOVA o arquivo `postcss.config.js`** completamente:
   ```bash
   rm postcss.config.js
   ```

3. **Use o `package-v4.json`** (renomeie para `package.json`):
   - Remove `autoprefixer` das devDependencies
   - Mantém apenas `@tailwindcss/vite` e `tailwindcss`

### Opção 2: Manter PostCSS (Alternativa)

Se preferir manter PostCSS:

1. **Instale o plugin PostCSS correto:**
   ```bash
   pnpm add -D @tailwindcss/postcss
   ```

2. **Atualize `postcss.config.js`:**
   ```javascript
   export default {
     plugins: {
       '@tailwindcss/postcss': {},
     },
   }
   ```

## Passos para Aplicar a Correção

### Para Opção 1 (Recomendada):

1. Substitua `vite.config.js` pelo arquivo fornecido
2. Delete `postcss.config.js`
3. Substitua `package.json` pelo `package-v4.json` (renomeado)
4. Execute: `pnpm install`
5. Execute: `pnpm run build`

### Configuração no Render:

- **Build Command**: `pnpm install --no-frozen-lockfile && pnpm run build`
- **Publish Directory**: `dist`

## Verificação

Após aplicar a correção, o build deve funcionar sem erros relacionados ao PostCSS/TailwindCSS.

## Troubleshooting

- Se ainda houver erros, verifique se não existe `postcss.config.js` no projeto
- Confirme que `@tailwindcss/vite` está nas devDependencies
- Verifique se o `vite.config.js` importa corretamente o plugin TailwindCSS
