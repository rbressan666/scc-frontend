import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['@radix-ui/react-tooltip'],
  },
  build: {
    rollupOptions: {
      external: [], // Garante que não estamos externalizando por engano
    },
  },
  // Adicionando esta configuração para forçar o Vite a pré-compilar o módulo
  // Isso pode resolver problemas de módulos que não são corretamente resolvidos
  // quando importados de um componente local.
  // Fonte: https://vitejs.dev/config/dep-optimization-options.html#optimizedeps-force
  // e discussões sobre problemas de resolução de módulos em componentes locais.
  force: true,
})