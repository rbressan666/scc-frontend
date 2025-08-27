# SCC Frontend - Sistema Contagem Cadoz

Frontend do MVP1 do Sistema Contagem Cadoz (SCC) desenvolvido em React.js como Progressive Web App (PWA).

## 🚀 Funcionalidades

- ✅ Progressive Web App (PWA) completo
- ✅ Autenticação JWT com contexto global
- ✅ Login tradicional e via QR Code
- ✅ Dashboard responsivo e intuitivo
- ✅ CRUD completo de usuários (admin)
- ✅ Rotas protegidas por permissão
- ✅ Design responsivo (mobile-first)
- ✅ Componentes reutilizáveis (shadcn/ui)
- ✅ WebSocket para login QR Code
- ✅ Tratamento de erros robusto

## 📋 Pré-requisitos

- Node.js 18+
- pnpm (recomendado) ou npm
- Backend SCC rodando

## 🛠️ Instalação

1. **Navegue para o diretório do frontend:**
   ```bash
   cd frontend
   ```

2. **Instale as dependências:**
   ```bash
   pnpm install
   ```

3. **Configure as variáveis de ambiente:**
   ```bash
   cp .env.example .env
   ```
   
   Edite o arquivo `.env`:
   ```env
   VITE_API_URL=http://localhost:3000
   ```

4. **Inicie o servidor de desenvolvimento:**
   ```bash
   pnpm run dev --host
   ```

5. **Acesse a aplicação:**
   - Local: http://localhost:5173
   - Rede: http://[seu-ip]:5173

## 🔧 Scripts Disponíveis

- `pnpm run dev` - Inicia servidor de desenvolvimento
- `pnpm run dev --host` - Inicia servidor acessível na rede
- `pnpm run build` - Gera build de produção
- `pnpm run preview` - Visualiza build de produção
- `pnpm run lint` - Executa linting do código

## 📱 Funcionalidades PWA

### Manifest.json
- Nome: Sistema Contagem Cadoz
- Nome curto: SCC
- Modo: standalone
- Orientação: portrait-primary
- Ícones: 192x192, 512x512, 180x180

### Service Worker
- Cache de recursos estáticos
- Funcionamento offline básico
- Atualizações automáticas

### Instalação
- Pode ser instalado como app nativo
- Funciona offline (recursos em cache)
- Ícone na tela inicial do dispositivo

## 🎨 Design System

### Tecnologias
- **React 19** - Biblioteca principal
- **Tailwind CSS** - Framework de estilos
- **shadcn/ui** - Componentes de interface
- **Lucide React** - Ícones
- **Framer Motion** - Animações

### Componentes Principais
- **Button** - Botões com variantes
- **Input** - Campos de entrada
- **Card** - Cartões de conteúdo
- **Table** - Tabelas de dados
- **Dialog** - Modais e confirmações
- **Alert** - Alertas e notificações
- **Badge** - Etiquetas e status

### Paleta de Cores
- **Primary:** Preto (#000000)
- **Secondary:** Cinza claro
- **Success:** Verde
- **Destructive:** Vermelho
- **Background:** Branco/Cinza claro

## 📄 Estrutura de Páginas

### 1. Login Page (`/login`)
- **Layout:** Centralizado e responsivo
- **Funcionalidades:**
  - Login com email/senha
  - Geração de QR Code (desktop)
  - Escaneamento de QR Code (mobile)
  - Validação de formulário
  - Tratamento de erros

### 2. Dashboard (`/dashboard`)
- **Layout:** Header fixo + conteúdo
- **Funcionalidades:**
  - Cards de navegação
  - Informações do usuário
  - Ações rápidas (admin)
  - Menu responsivo

### 3. Lista de Usuários (`/usuarios`)
- **Layout:** Tabela responsiva
- **Funcionalidades:**
  - Listagem paginada
  - Busca por nome/email
  - CRUD completo (admin)
  - Ativação/desativação
  - Confirmações de ação

## 🔐 Autenticação

### AuthContext
- Estado global do usuário
- Verificação automática de token
- Funções de login/logout
- Verificação de permissões

### Proteção de Rotas
- **ProtectedRoute** - Requer autenticação
- **requireAdmin** - Requer perfil admin
- Redirecionamento automático
- Mensagens de acesso negado

### Gerenciamento de Token
- Armazenamento em cookies
- Renovação automática
- Limpeza em logout/expiração
- Interceptors de API

## 🌐 WebSocket (QR Code)

### Funcionalidades
- Geração de QR Code dinâmico
- Validação em tempo real
- Confirmação de login
- Tratamento de expiração
- Cancelamento de sessão

### Eventos
- `generate-qr` - Gerar QR Code
- `validate-qr` - Validar código
- `confirm-login` - Confirmar login
- `qr-scanned` - QR escaneado
- `login-success` - Login confirmado

## 📱 Responsividade

### Breakpoints
- **Mobile:** < 768px
- **Tablet:** 768px - 1024px
- **Desktop:** > 1024px

### Adaptações Mobile
- Menu hambúrguer
- Cards empilhados
- Tabelas com scroll horizontal
- Botões de toque otimizados
- QR Code adaptativo

## 🔧 Configuração de Deploy

### Build de Produção
```bash
pnpm run build
```

### Variáveis de Ambiente
```env
VITE_API_URL=https://sua-api.com
VITE_NODE_ENV=production
```

### Hospedagem Recomendada
- **Vercel** (recomendado)
- **Netlify**
- **Render**
- **GitHub Pages**

## 🧪 Testes

### Checklist de Testes
- [ ] Login com credenciais válidas
- [ ] Login com credenciais inválidas
- [ ] Geração e escaneamento de QR Code
- [ ] Navegação entre páginas
- [ ] CRUD de usuários (admin)
- [ ] Proteção de rotas
- [ ] Responsividade mobile
- [ ] Funcionalidade PWA

### Usuário de Teste
- **Email:** roberto.fujiy@gmail.com
- **Senha:** Cadoz@001
- **Perfil:** admin

## 🚀 Deploy

### Render.com (Recomendado)
1. Conecte seu repositório
2. Configure build command: `pnpm run build`
3. Configure publish directory: `dist`
4. Defina variáveis de ambiente

### Vercel
1. Importe projeto do GitHub
2. Configure variáveis de ambiente
3. Deploy automático

## 📝 Notas de Desenvolvimento

- Utiliza Vite como bundler para desenvolvimento rápido
- Componentes seguem padrão de composição
- Estado global gerenciado via Context API
- Estilos com Tailwind CSS (utility-first)
- Ícones da biblioteca Lucide React
- Animações com Framer Motion
- Formulários com validação client-side

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença ISC.

