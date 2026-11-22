# Miau Store UI — Project Context

## Branch state

- `main` (current): M-003 touch-first UI. All routed screens call the Go API directly — no mocks, no Refine, no Ant Design.
- `develop`: kept alive for future prototyping; currently mirrors `main`.
- Round A ported the remaining legacy gaps (dashboard counters, order filters/details/cancel reason/dirty guard, item stock/CSV filters, client phone/status, cash-flow filters, report presets/tables, print status), then was promoted to `main` via PR #3. See git history for the legacy Refine/AntD stack.

## Stack

- **Bundler:** Vite 6
- **UI:** React 19 + Tailwind CSS 4 + shadcn/base-ui primitives (`src/components/ui/`)
- **Router:** React Router v6 (`BrowserRouter` in `App.tsx`)
- **HTTP:** Axios instance in `src/providers/rest-client.ts` (Bearer token, refresh-on-401 with one retry, `X-Timezone`, PT-BR error translation)
- **Language:** TypeScript
- **Package manager:** bun
- **Deploy/preview:** Cloudflare Workers. Production at `https://store-ui.izacgaldino.workers.dev` via `npx wrangler deploy`; branch previews via `npx wrangler preview` (`https://develop-store-ui.izacgaldino.workers.dev`). `wrangler.json` has `previews: {}` and SPA fallback to `dist`.

## Architecture

```
store-ui/
├── src/
│   ├── App.tsx                     # all routes + RequireAuth
│   ├── index.tsx                   # entry (Geist font + index.css)
│   ├── index.css                   # Tailwind theme
│   ├── config.ts                   # API_URL (VITE_API_URL, default localhost:8080)
│   ├── providers/
│   │   ├── rest-client.ts          # axios + interceptors
│   │   └── error-mapping.ts        # API error code → PT-BR
│   ├── components/ui/              # button, card, tabs, dialog, etc.
│   └── prototype/
│       ├── app-shell.tsx           # touch nav (sidebar on desktop, bottom bar on mobile)
│       ├── api.ts                  # every API call, grouped by domain
│       ├── types.ts                # API payload/response types
│       ├── constants.ts            # labels + money/print/discount helpers
│       ├── hooks.ts                # useApi/useAction/useDebouncedValue
│       ├── ui.tsx                  # PageHeader, Field, StatePanel, dialogs
│       ├── side-panel.tsx          # right-side edit panel
│       ├── client-dialog.tsx       # shared client form
│       ├── receipt.tsx             # 80 mm receipt dialog: print + PNG download
│       └── screens/                # auth, dashboard, orders, items, printing,
│                                   # clients, cashflow, reports
├── wrangler.json
└── package.json
```

## API

Backend Go Fiber at `http://localhost:8080`. All endpoints except `/auth/*` are JWT-protected.

List responses are unwrapped in `prototype/api.ts` (`items`, `orders`, `papers`, `addons`, `clients`, `registers`, `expenses`).

## Auth flow

1. `POST /api/auth/login` → `{ access_token, email, username }` saved in localStorage.
2. Every request carries `Authorization: Bearer <token>`.
3. On 401, interceptor calls `POST /api/auth/refresh` (httpOnly cookie) once and retries.
4. Refresh failure clears localStorage and redirects to `/login`.
5. `POST /api/auth/register` for new users.

## Orders (PDV)

- New order is a 2-step wizard: **Produtos e impressões** → **Detalhes**, with a sticky footer carrying total, `Salvar rascunho` and `Continuar`/`Finalizar`. Product search waits 500 ms after typing ends and needs at least 2 characters.
- Discount uses `discount_type` (`valor`|`percentual`) + `discount_value`; total = subtotal − discount.
- Print pricing: `computePrintTotal` uses paper base + addons and charges `per_print` once per print line, independent of sheets.
- Save draft sends `status: 'rascunho'`.
- Finalize sends `POST /api/orders/:id/finalize` with one payment method (`pix|dinheiro|credito|debito`); API replaces payments, sets status `entregue` and deducts resale stock atomically.
- Only drafts can be finalized (`pendente → entregue` is not a valid transition).
- Delivered orders are read-only.
- `Recibo` on the order detail opens an 80 mm receipt with print and PNG download; discount breakdown appears only when a discount exists.

## Conventions

- Files: kebab-case; components: PascalCase; helpers: camelCase.
- Types are plain TS types (no `I` prefix requirement in the new UI).
- All UI text and errors in Portuguese.
- Error mapping prefers the known `code` translation, falling back to the API message.
- Env var: `VITE_API_URL` — origin only, no `/api` and no trailing slash (`https://store-api-c8m8.onrender.com`); the client appends `/api`.

## Pre-commit validation

Before any commit, run:

```bash
bun run lint        # ESLint
bun run build       # TypeScript check + Vite build
```

Fix all lint errors and ensure build succeeds before committing.

## Commit rules

- Ask user before staging or committing.
- Prefix store-ui commits with `store-ui:`.
- Keep commits small and focused.
- Never push without explicit user approval.
