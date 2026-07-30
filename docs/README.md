# Miau Store UI — Documentação do Projeto

Frontend administrativo para a Gráfica Miau, construído com Refine + Ant Design.

## Stack

- **Bundler:** Vite
- **UI:** Ant Design (`@refinedev/antd`)
- **Router:** React Router v6 (`@refinedev/react-router`)
- **Data Provider:** Custom (`@refinedev/simple-rest` adaptado)
- **Auth:** Custom Auth Provider (JWT + refresh token via cookie)
- **HTTP Client:** Axios com interceptors
- **Package Manager:** bun

## API

Backend Go Fiber. A URL base é configurável via variável de ambiente `VITE_API_URL` (cópia `.env.example` → `.env`).  
Padrão: `http://localhost:8080`.  
Todos os endpoints (exceto auth) são protegidos via JWT Bearer token.

## Fases

| Fase | Descrição | Status |
|------|-----------|--------|
| 01 | Setup, Auth e Layout Base | Pendente |
| 02 | Catálogo de Itens | Pendente |
| 03 | Pedidos (PDV) | Pendente |
| 04 | Precificação | Pendente |
| 05 | Fluxo de Caixa | Pendente |
| 06 | Dashboard e Refinamentos | Pendente |

## Convenções

- **Idioma:** 100% português (UI, mensagens, notificações)
- **Códigos de erro:** Mapeados em `error-mapping.md` para exibir mensagens amigáveis em português
- **Commits:** Convencionais, perguntar antes de commitar
- **Testes:** Verificar lint + build antes de cada commit
