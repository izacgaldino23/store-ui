# Fase 01 — Setup, Auth e Layout Base

## Objetivo

Inicializar o projeto Refine com Vite + Ant Design, configurar providers (auth, data, axios), criar layout base com logo, tela de login funcional, e dashboard placeholder.

## Tasks

- [ ] **1.1** Scaffold do projeto com `bun create refine-app@latest`:
  - Selecionar Vite, React Router, Ant Design, REST API, Custom Auth
  - Remover arquivos boilerplate não utilizados (exemplos, páginas demo)

- [ ] **1.2** Criar estrutura de diretórios:
  ```
  src/
  ├── providers/
  │   ├── auth-provider.ts
  │   ├── data-provider.ts
  │   ├── rest-client.ts (axios instance + interceptors)
  │   └── error-mapping.ts
  ├── pages/
  │   ├── dashboard/
  │   │   └── index.tsx
  │   └── login/
  │       └── index.tsx
  ├── components/
  │   └── logo.tsx
  ├── config.ts
  ├── App.tsx
  └── index.tsx
  public/
  └── logo.svg (placeholder)
  ```

- [ ] **1.3** Criar `src/config.ts` com:
  - `API_URL = "http://localhost:8080"`
  - Constantes de paginação, etc.

- [ ] **1.4** Criar `src/providers/error-mapping.ts`:
  - Objeto `errorMessages` com todos os códigos mapeados para português
  - Função `translateError(code: string): string`
  - Função `getValidationErrors(err: any): string[]`

- [ ] **1.5** Criar `src/providers/rest-client.ts`:
  - Axios instance com `baseURL = API_URL/api`
  - Interceptor de request: anexa `Authorization: Bearer <token>` do localStorage
  - Interceptor de response: em 401, tenta refresh automático
  - Se refresh falhar, redireciona para `/login` e limpa token
  - Converte erros da API para português via `translateError`

- [ ] **1.6** Criar `src/providers/data-provider.ts`:
  - Usar `@refinedev/simple-rest` como base
  - Sobrescrever `list` para adaptar responses da API:
    - `{ items: [], total }` → `{ data: [], total }`
    - `{ orders: [], total }` → `{ data: [], total }`
    - `{ registers: [], total }` → `{ data: [], total }`
  - Sobrescrever `create` se necessário (retorno 201 em vez de 200)
  - Prefixo automático `/api` nos recursos

- [ ] **1.7** Criar `src/providers/auth-provider.ts`:
  - `login`: POST `/auth/login` → salva `access_token` e dados do usuário
  - `logout`: POST `/auth/logout` + limpa storage
  - `check`: verifica se `access_token` existe e não expirou
  - `getIdentity`: retorna `{ email, username }` do storage
  - `onError`: se 401, tenta refresh; se falhar → logout
  - `register`: POST `/auth/register`

- [ ] **1.8** Criar `public/logo.svg`:
  - Placeholder: círculo com fundo roxo (#722ED1) e texto "Miau" em branco
  - 120x120px (quadrado)

- [ ] **1.9** Criar `src/components/logo.tsx`:
  - Renderiza a logo da pasta public
  - Props opcionais: `collapsed` (para sidebar recolhida)
  - Mostra imagem + nome "Miau" quando expandido, só imagem quando recolhido

- [ ] **1.10** Criar tela de login `src/pages/login/index.tsx`:
  - Usar `<AuthPage type="login">` do `@refinedev/antd`
  - Campos: email/usuário + senha
  - Botão "Entrar"
  - Mensagens de erro em português
  - Link para registro (se aplicável)

- [ ] **1.11** Configurar `src/App.tsx`:
  - `<Refine>` com data provider, auth provider, router provider
  - `<ThemedLayout>` com logo customizada no Sider
  - Rotas protegidas via `<Authenticated>`
  - Redirecionar para `/login` quando não autenticado
  - Dashboard em `/` (raiz)

- [ ] **1.12** Criar dashboard placeholder `src/pages/dashboard/index.tsx`:
  - Título "Bem-vinda ao Miau Store"
  - Cards de atalho: "Novo Pedido", "Catálogo", "Abrir Caixa"
  - Placeholder para métricas futuras

- [ ] **1.13** Verificar funcionamento:
  - Rodar `bun run dev` sem erros
  - Tela de login aparece
  - Login funciona contra a API
  - Dashboard aparece após login
  - Logout funciona
  - Sidebar com logo aparece

## Critérios de aceitação

- [ ] Projeto sobe com `bun run dev`
- [ ] Tela de login funcional com a API real
- [ ] Proteção de rotas (redireciona para /login sem token)
- [ ] Layout com sidebar + header + logo Miau
- [ ] Erros da API exibidos em português
- [ ] Refresh token automático funciona
- [ ] Logout limpa sessão e volta ao login
