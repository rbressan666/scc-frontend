# Copilot - Regras Padrão (Fixe este arquivo no Chat)

Use estas instruções como “prompt pinado” ao trabalhar neste repositório (frontend).

## 0) Idioma e limites de ação
- Idioma: Todas as respostas devem ser em Português brasileiro (pt-BR), de forma clara e objetiva.
- Escopo: Não altere arquivos/código a menos que eu peça explicitamente para alterar. Se algo parecer necessário, proponha primeiro e aguarde confirmação.

## 1) Diário do desenvolvedor (interno)
- Sempre que gerar alterações, atualize o arquivo `diario_ajustes.md` (na raiz do frontend).
- Registre data e hora (ISO com timezone) e um resumo objetivo do que foi feito.
- Este arquivo é para você (IA/dev) saber exatamente onde parou e continuar do mesmo ponto.

## 2) Resumo para usuários (externo)
- Ao entregar novas funcionalidades/correções, mantenha um resumo curto e claro voltado ao usuário final.
- O Dashboard exibe um card “Últimas Atualizações” lendo `public/updates.json` (schema: `[ { date: 'YYYY-MM-DD', time: 'HH:mm', title, summary, link? } ]`).
- Adicione/atualize entradas neste arquivo para refletir as novidades visíveis ao usuário.
- Os itens devem ser ordenáveis por data/hora e conter apenas um RESUMO do impacto.

## 3) Evitar quebras em outros módulos
- Não altere código de forma genérica que cause parada em outras áreas.
- Prefira mudanças pequenas, localizadas e reversíveis.
- Após alterações, rode verificações rápidas (build/lint/test) e reporte PASS/FAIL.

## 4) Boas práticas neste projeto (frontend)
- Vite/React:
  - Componentes puros, hooks simples, sem secrets no client.
  - Utilize componentes de UI padrão do projeto e mantenha consistência visual.
  - Novas páginas/rotas documentadas em `diario_ajustes.md` e refletidas em `public/updates.json` quando houver impacto ao usuário.

## 5) Estilo de colaboração
- Responda de forma direta, com passos concretos e curtos.
- Mantenha um todo list vivo e atualize apenas os deltas entre mensagens.
- Se algo não for possível automatizar, diga o porquê e proponha alternativa simples.
