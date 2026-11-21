import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  BarChart3,
  CircleDollarSign,
  History,
  Home,
  LayoutGrid,
  LogOut,
  Moon,
  Package,
  Plus,
  ReceiptText,
  ShoppingCart,
  Sun,
  Users,
} from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { authApi } from './api'
import { useTheme } from './hooks'

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
      { to: '/reports', label: 'Relatórios', icon: BarChart3 },
    ],
  },
  {
    title: 'Cadastros',
    items: [
      { to: '/items', label: 'Itens', icon: Package },
      { to: '/printing', label: 'Impressão', icon: LayoutGrid },
      { to: '/clients', label: 'Clientes', icon: Users },
    ],
  },
  {
    title: 'Caixa',
    items: [
      { to: '/cash-flow/current', label: 'Caixa atual', icon: CircleDollarSign },
      { to: '/cash-flow/daily-report', label: 'Relatório diário', icon: ReceiptText },
      { to: '/cash-flow/history', label: 'Histórico', icon: History },
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
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const userEmail = (() => {
    try {
      return (JSON.parse(localStorage.getItem('user') || '{}') as { email?: string }).email || ''
    } catch {
      return ''
    }
  })()
  const logout = async () => {
    await authApi.logout()
    navigate('/login', { replace: true })
  }

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
        <div className="mt-auto border-t pt-3">
          {userEmail && <p className="truncate px-3 pb-2 text-xs text-muted-foreground">{userEmail}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
              title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
              className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'shrink-0')}
            >
              {theme === 'dark' ? <Sun /> : <Moon />}
            </button>
            <button
              type="button"
              onClick={() => void logout()}
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'default' }),
                'h-11 flex-1 justify-start gap-3 px-3 text-base',
              )}
            >
              <LogOut data-icon="inline-start" />
              Sair
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-h-dvh flex-col md:pl-60">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background px-4 md:px-6">
          <div className="flex items-center gap-2 md:hidden">
            <Link to="/" className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                M
              </span>
              <span className="font-semibold">Miau Store</span>
            </Link>
            <div className="ml-auto flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
                title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
                onClick={toggleTheme}
              >
                {theme === 'dark' ? <Sun /> : <Moon />}
              </Button>
              <Button variant="ghost" size="icon" aria-label="Sair" onClick={() => void logout()}>
                <LogOut />
              </Button>
            </div>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <Link
              to="/orders/create"
              className={cn(buttonVariants({ size: 'lg' }))}
            >
              <Plus data-icon="inline-start" />
              Novo pedido
            </Link>
          </div>
        </header>

        <main className="flex-1 px-4 py-5 pb-[calc(9rem+env(safe-area-inset-bottom))] md:px-6 md:pb-8">
          <div className="mx-auto w-full max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t bg-background/95 px-1 pt-1 pb-[calc(0.25rem+env(safe-area-inset-bottom))] backdrop-blur md:hidden">
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
