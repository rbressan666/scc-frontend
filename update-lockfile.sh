#!/bin/bash

# Script para atualizar o pnpm-lock.yaml
# Execute este script na raiz do projeto para sincronizar o lockfile com o package.json

echo "🔄 Atualizando pnpm-lock.yaml..."

# Remover lockfile existente
if [ -f "pnpm-lock.yaml" ]; then
    echo "📁 Removendo pnpm-lock.yaml existente..."
    rm pnpm-lock.yaml
fi

# Remover node_modules se existir
if [ -d "node_modules" ]; then
    echo "🗑️  Removendo node_modules..."
    rm -rf node_modules
fi

# Instalar dependências e gerar novo lockfile
echo "📦 Instalando dependências e gerando novo lockfile..."
pnpm install

echo "✅ pnpm-lock.yaml atualizado com sucesso!"
echo ""
echo "📋 Próximos passos:"
echo "1. Verifique se não há erros na instalação"
echo "2. Teste o build local: pnpm run build"
echo "3. Faça commit do novo pnpm-lock.yaml"
echo "4. Faça push para o repositório"
