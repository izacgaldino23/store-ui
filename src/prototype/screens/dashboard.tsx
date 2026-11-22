import { Link } from 'react-router-dom'
import { ClipboardList, Package, Plus, ShoppingCart, Wallet } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { itemsApi, reportsApi } from '../api'
import { money } from '../constants'
import { useApi } from '../hooks'
import { MoneyCard, PageHeader, StatePanel } from '../ui'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const statusLabels: Record<string, string> = {
  rascunho: 'Rascunhos',
  pendente: 'Pendentes',
  em_producao: 'Em produção',
  pronto: 'Prontos',
  entregue: 'Entregues',
  cancelado: 'Cancelados',
}

const todayKey = () => new Date().toLocaleDateString('sv-SE')

export function DashboardScreen() {
  const { data, loading, error, reload } = useApi(async () => {
    const [summary, lowStock] = await Promise.all([reportsApi.summary(), itemsApi.lowStock()])
    const todayOrders = summary.daily.find((day) => day.date === todayKey())?.orders ?? 0
    return { summary, lowStock, todayOrders }
  }, [])

  return (
    <>
      <PageHeader title="Visão geral" description="Resumo do negócio em tempo real." />
      <StatePanel loading={loading} error={error}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MoneyCard
            label="Faturamento"
            value={money(data?.summary.total_revenue)}
            description={`${data?.summary.orders_count ?? 0} pedidos`}
          />
          <MoneyCard
            label="Pedidos hoje"
            value={String(data?.todayOrders ?? 0)}
            description="registrados no dia"
          />
          <MoneyCard
            label="Ticket médio"
            value={money(data?.summary.avg_ticket)}
            description={`${money(data?.summary.total_discount)} em descontos`}
          />
          <MoneyCard
            label="Estoque baixo"
            value={String(data?.lowStock.length ?? 0)}
            description="itens de revenda"
          />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          {['rascunho', 'pendente', 'em_producao', 'pronto', 'entregue'].map((status) => {
            const count =
              data?.summary.status_counts.find((item) => item.status === status)?.count ?? 0
            return (
              <Link
                key={status}
                to={`/orders?status=${status}`}
                className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <MoneyCard label={statusLabels[status]} value={String(count)} description="pedidos" />
              </Link>
            )
          })}
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card className="hidden lg:block">
            <CardHeader>
              <CardTitle>Atalhos</CardTitle>
              <CardDescription>O que você mais usa no dia a dia.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <Link to="/orders/create" className={cn(buttonVariants({ variant: 'default', size: 'lg' }), 'justify-start')}>
                <Plus data-icon="inline-start" />
                Novo pedido
              </Link>
              <Link to="/orders" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'justify-start')}>
                <ShoppingCart data-icon="inline-start" />
                Ver pedidos
              </Link>
              <Link to="/items" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'justify-start')}>
                <Package data-icon="inline-start" />
                Consultar itens
              </Link>
              <Link to="/cash-flow/current" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'justify-start')}>
                <Wallet data-icon="inline-start" />
                Abrir caixa
              </Link>
              <Link to="/reports" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'justify-start')}>
                <ClipboardList data-icon="inline-start" />
                Relatórios
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Estoque baixo</CardTitle>
              <CardDescription>Itens abaixo do mínimo cadastrado.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {data?.lowStock.slice(0, 5).map((item) => (
                <div key={item.id} className="flex justify-between gap-3 text-sm">
                  <span className="truncate">{item.name}</span>
                  <span className="shrink-0 text-muted-foreground">
                    {item.current_stock ?? 0}/{item.min_stock}
                  </span>
                </div>
              ))}
              {!data?.lowStock.length && (
                <p className="text-sm text-muted-foreground">Nenhum item com estoque baixo.</p>
              )}
              <Link to="/items/low-stock" className="mt-2 text-sm text-primary underline underline-offset-4">
                Ver todos
              </Link>
            </CardContent>
          </Card>
        </div>
        <button className="sr-only" onClick={reload} type="button">
          Recarregar
        </button>
      </StatePanel>
    </>
  )
}
