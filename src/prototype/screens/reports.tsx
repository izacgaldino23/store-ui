import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { itemsApi, reportsApi } from '../api'
import { money, shortDate, statusLabel } from '../constants'
import { useApi } from '../hooks'
import type { OrderStatus } from '../types'
import { MoneyCard, PageHeader, StatePanel } from '../ui'

const today = new Date().toISOString().slice(0, 10)

export function ReportsScreen() {
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const params = {
    start: start ? new Date(`${start}T00:00:00`).toISOString() : undefined,
    end: end ? new Date(`${end}T23:59:59`).toISOString() : undefined,
  }
  const { data, loading, error, reload } = useApi(async () => {
    const [summary, products, statusCounts, lowStock] = await Promise.all([
      reportsApi.summary(params),
      reportsApi.products(params),
      reportsApi.statusCounts(),
      itemsApi.lowStock(),
    ])
    return { summary, products, statusCounts, lowStock }
  }, [start, end])

  return (
    <>
      <PageHeader
        title="Relatórios"
        description={`Visão comercial e de estoque${start || end ? ` · ${start || 'início'} a ${end || today}` : ''}.`}
        action={
          <Button variant="outline" onClick={reload}>
            Atualizar
          </Button>
        }
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <label className="flex flex-col gap-1 text-sm font-medium">
          De
          <Input type="date" value={start} onChange={(event) => setStart(event.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Até
          <Input type="date" value={end} onChange={(event) => setEnd(event.target.value)} />
        </label>
      </div>
      <StatePanel loading={loading} error={error}>
        {data && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MoneyCard label="Faturamento" value={money(data.summary.total_revenue)} />
              <MoneyCard label="Pedidos" value={String(data.summary.orders_count)} />
              <MoneyCard label="Ticket médio" value={money(data.summary.avg_ticket)} />
              <MoneyCard label="Descontos" value={money(data.summary.total_discount)} />
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Vendas por dia</CardTitle>
                  <CardDescription>Faturamento e quantidade de pedidos.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {data.summary.daily.map((day) => (
                    <div key={day.date} className="flex justify-between gap-3 text-sm">
                      <span>{shortDate(day.date)}</span>
                      <span>
                        {day.orders}× · {money(day.revenue)}
                      </span>
                    </div>
                  ))}
                  {!data.summary.daily.length && (
                    <p className="text-sm text-muted-foreground">Sem vendas no período.</p>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Status dos pedidos</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {data.statusCounts.map((item) => (
                    <div key={item.status} className="flex justify-between text-sm">
                      <span>{statusLabel[item.status as OrderStatus] || item.status}</span>
                      <span>{item.count}</span>
                    </div>
                  ))}
                  {!data.statusCounts.length && (
                    <p className="text-sm text-muted-foreground">Sem pedidos.</p>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Mais vendidos</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {data.products.best_sellers.map((item) => (
                    <div key={item.item_id} className="flex justify-between gap-3 text-sm">
                      <span className="truncate">{item.item_name}</span>
                      <span>
                        {item.quantity}× · {money(item.revenue)}
                      </span>
                    </div>
                  ))}
                  {!data.products.best_sellers.length && (
                    <p className="text-sm text-muted-foreground">Sem vendas no período.</p>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Maior margem</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {data.products.highest_margin.map((item) => (
                    <div key={item.item_id} className="flex justify-between gap-3 text-sm">
                      <span className="truncate">{item.item_name}</span>
                      <span>
                        {money(item.margin)} ({item.margin_percent.toFixed(1)}%)
                      </span>
                    </div>
                  ))}
                  {!data.products.highest_margin.length && (
                    <p className="text-sm text-muted-foreground">Sem dados.</p>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Maiores descontos</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {data.products.highest_discount.map((item) => (
                    <div key={item.item_id} className="flex justify-between gap-3 text-sm">
                      <span className="truncate">{item.item_name}</span>
                      <span>{money(item.total_discount)}</span>
                    </div>
                  ))}
                  {!data.products.highest_discount.length && (
                    <p className="text-sm text-muted-foreground">Sem descontos.</p>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Estoque baixo</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {data.lowStock.map((item) => (
                    <div key={item.id} className="flex justify-between gap-3 text-sm">
                      <span className="truncate">{item.name}</span>
                      <span>
                        {item.current_stock ?? 0}/{item.min_stock}
                      </span>
                    </div>
                  ))}
                  {!data.lowStock.length && (
                    <p className="text-sm text-muted-foreground">Tudo em ordem.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </StatePanel>
    </>
  )
}
