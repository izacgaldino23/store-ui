# Miau Store UI — Project Context

## Stack
- **Bundler:** Vite
- **UI Library:** Ant Design (`@refinedev/antd`)
- **Framework:** Refine v5 (`@refinedev/core`)
- **Router:** React Router v6 (`@refinedev/react-router`)
- **Data Provider:** `@refinedev/simple-rest` (customizado)
- **Auth:** Custom Auth Provider (JWT + refresh token via cookie)
- **HTTP Client:** Axios com interceptors
- **Language:** TypeScript
- **Package Manager:** bun

⚠️ **React 19 + antd v5:** antd v5 supports React 16–18. React 19 requires the compat patch — `@ant-design/v5-patch-for-react-19` MUST stay as the first import in `src/index.tsx`. Without it, static antd methods (`Modal.confirm`, `message.*`, `notification.*`) silently fail to render (no modal/toast, no error), while JSX components keep working. Never remove that import.

## Architecture

```
store-ui/
├── src/
│   ├── providers/
│   │   ├── auth-provider.ts     # login/logout/check/getIdentity/onError
│   │   ├── data-provider.ts     # adapta API REST → formato Refine
│   │   ├── rest-client.ts       # axios instance + interceptors JWT
│   │   └── error-mapping.ts     # códigos de erro → português
│   ├── pages/
│   │   ├── dashboard/
│   │   ├── catalog/             # items (list, create, edit, show)
│   │   ├── orders/              # orders (list, create, show)
│   │   ├── pricing/             # price-table (list, create, edit) + calculadora
│   │   └── cash-flow/           # caixa atual, relatório, histórico, despesas
│   ├── components/
│   │   ├── logo.tsx
│   │   └── sider.tsx             # custom AppSider: replaces ThemedSiderV2; groups always open (controlled openKeys, ME-002); easy revert = use ThemedSiderV2 in App.tsx again
│   ├── config.ts
│   ├── App.tsx
│   └── index.tsx
├── public/
│   └── logo.svg
└── package.json
```

## API

Backend Go Fiber em `http://localhost:8080`. Todos os endpoints (exceto auth) são JWT-protected.

## Auth Flow

1. **Login:** POST `/api/auth/login` → `{ access_token, email, username }`. Salva token no localStorage.
2. **Refresh:** POST `/api/auth/refresh` → cookie automático. Interceptor tenta refresh ao receber 401.
3. **Logout:** POST `/api/auth/logout` + limpa localStorage.
4. **Register:** POST `/api/auth/register` (opcional no frontend).

## Data Provider

A API REST não segue o formato padrão do `@refinedev/simple-rest`:
- List: retorna `{ items: [], total, page, limit }` → adaptar para `{ data: [], total }`
- Orders: retorna `{ orders: [], total }`
- Cash registers: retorna `{ registers: [], total }`

## Resources

| Resource | Endpoint | Métodos |
|----------|----------|---------|
| `items` | `/api/catalog/items` | list, create, edit, show, delete |
| `items/low-stock` | `/api/catalog/items/low-stock` | list |
| `printing/papers` | `/api/printing/papers` | list, create, edit, delete (via página Catálogo → Impressão) |
| `printing/addons` | `/api/printing/addons` | list, create, edit, delete (via página Catálogo → Impressão) |
| `clients` | `/api/clients` | list, create, edit, delete (menu de topo "Clientes"; NF-004) |
| `orders` | `/api/orders` | list, create, show |
| `price-table` | `/api/pricing/table` | list, create, edit, delete (hidden from sider via `meta.hide`, ME-001; pages kept at `/pricing/*`) |
| `cash-register` | `/api/cash-register` | open, close, current, daily-report |
| `expenses` | `/api/expenses` | list, create |

Listas de papers/addons retornam `{ papers: [] }` / `{ addons: [] }` — já tratado no data-provider e nas páginas.

## Idiomas

- 100% do texto da UI em português
- Erros da API mapeados via `error-mapping.ts` para mensagens amigáveis em português

## Orders (create/edit)

- `create.tsx` and `edit.tsx` are ~90% duplicated and do **not** use antd `Form`/Refine `useCreate` — 100% `useState` + `apiClient`. Any change must be made in **both** files.
- Discount (NF-005): `discountType` (`valor`|`percentual`) + `discountValue` state; `computeDiscountAmount(subtotal, type, value)` in `constants.ts`; `remaining` is computed against `totalAfterDiscount` (subtotal − discount). Payloads include `discount_type`/`discount_value`. Client-side guard: warn if `discountAmount > grandTotal`.
- Unsaved-order guard (NF-005): `useUnsavedOrderGuard(isDirty)` in `src/components/use-unsaved-order-guard.ts` registers a native `beforeunload` (reload/close/external nav) and exposes `confirmLeave()` used by the "Voltar" buttons (Modal.confirm). `create.tsx` computes `isDirty` from "any content"; `edit.tsx` computes a diff against the loaded order. App uses classic `<BrowserRouter>` (no data router), so SPA navigation is guarded only via the intercepted Voltar clicks — not the side menu.

## Conventions

- Nomes de arquivos: kebab-case (ex: `auth-provider.ts`)
- Componentes React: PascalCase
- Funções utilitárias: camelCase
- Tipos/Interfaces: PascalCase com prefixo I (ex: `IItemResponse`)
- Mensagens de erro/notificação sempre em português
- Variáveis de ambiente: `VITE_API_URL` (prefixo VITE para expor ao Vite)

## Phases (see docs/)

| Phase | Description | Status |
|-------|-------------|--------|
| 01 | Setup + Auth + Layout | Pending |
| 02 | Catalog (items CRUD, CSV import, low stock) | Pending |
| 03 | Orders (PDV, multi-payment, status) | Pending |
| 04 | Pricing (price table, margin calculator) | Pending |
| 05 | Cash Flow (open/close register, expenses, report) | Pending |
| 06 | Dashboard + refinements | Pending |

## Error codes

All API error codes mapped in `src/providers/error-mapping.ts`. See full list in `docs/error-mapping.md`.

## Pre-commit validation

Before any commit, run:

```bash
bun run lint        # ESLint
bun run build       # TypeScript check + Vite build
```

Fix all lint errors and ensure build succeeds before committing.

## Commit rules

- Ask user before staging or committing
- Prepend `store-ui:` or `docs:` or `chore:` as scope prefix
- Keep commits small and focused per task
- Never push without explicit user approval
