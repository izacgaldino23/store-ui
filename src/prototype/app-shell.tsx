import { Link, Outlet, useLocation } from 'react-router-dom'
import {
  BarChart3,
  CircleDollarSign,
  ClipboardList,
  Home,
  LayoutGrid,
  Package,
  Plus,
  ShoppingCart,
  Users,
} from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface NavItem {
  to: string
  label: string
  icon: typeof Home
}

const groups: { title: string; items: NavItem[] }[] = [
  {
    title: 'Geral',
    items: [{ to: '/', label: 'Visão geral', icon: Home }],
  },
  {
    title: 'Vendas',
    items: [
      { to: '/orders', label: 'Pedidos', icon: ShoppingCart },
      { to: '/orders/create', label: 'Novo pedido', icon: Plus },
      { to: '/reports', label: 'Relatórios', icon: BarChart3 },
    ],
  },
  {
    title: 'Cadastros',
    items: [
      { to: '/items', label: 'Itens', icon: Package },
      { to: '/printing', label: 'Impressão', icon: LayoutGrid },
      { to: '/clients', label: 'Clientes', icon: Users },
      { to: '/pricing/table', label: 'Tabela de preços', icon: ClipboardList },
    ],
  },
  {
    title: 'Caixa',
    items: [
      { to: '/cash-flow/current', label: 'Caixa atual', icon: CircleDollarSign },
      { to: '/cash-flow/expenses', label: 'Despesas', icon: CircleDollarSign },
    ],
  },
]

const bottomNav: NavItem[] = [
  { to: '/', label: 'Início', icon: Home },
  { to: '/orders', label: 'Pedidos', icon: ShoppingCart },
  { to: '/orders/create', label: 'Novo', icon: Plus },
  { to: '/items', label: 'Itens', icon: Package },
  { to: '/cash-flow/current', label: 'Caixa', icon: CircleDollarSign },
]

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon
  return (
    <Link
      to={item.to}
      className={cn(
        buttonVariants({ variant: active ? 'default' : 'ghost', size: 'default' }),
        'h-11 justify-start gap-3 px-3 text-base',
      )}
      aria-current={active ? 'page' : undefined}
    >
      <Icon data-icon="inline-start" />
      {item.label}
    </Link>
  )
}

export function AppShell() {
  const { pathname } = useLocation()

  return (
    <div className="min-h-dvh bg-muted/30">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col gap-6 border-r bg-background p-4 md:flex">
        <Link to="/" className="flex items-center gap-3 px-2 py-1">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
            M
          </span>
          <span className="text-lg font-semibold">Miau Store</span>
        </Link>
        <nav className="flex flex-1 flex-col gap-5 overflow-y-auto">
          {groups.map((group) => (
            <div key={group.title} className="flex flex-col gap-1">
              <p className="px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {group.title}
              </p>
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  item={item}
                  active={pathname === item.to}
                />
              ))}
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex min-h-dvh flex-col md:pl-60">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background px-4 md:px-6">
          <Link to="/" className="flex items-center gap-2 md:hidden">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              M
            </span>
            <span className="font-semibold">Miau Store</span>
          </Link>
          <p className="hidden text-sm text-muted-foreground md:block">
            Protótipo M-003 · dados de demonstração
          </p>
          <Link
            to="/orders/create"
            className={cn(buttonVariants({ size: 'lg' }), 'hidden md:inline-flex')}
          >
            <Plus data-icon="inline-start" />
            Novo pedido
          </Link>
        </header>

        <main className="flex-1 px-4 py-5 pb-32 md:px-6 md:pb-8">
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t bg-background/95 px-1 py-1 backdrop-blur md:hidden">
        {bottomNav.map((item) => {
          const Icon = item.icon
          const active = pathname === item.to
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg text-[11px] font-medium',
                active ? 'bg-primary/10 text-primary' : 'text-muted-foreground',
              )}
            >
              <Icon />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
