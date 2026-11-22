import { useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { itemsApi, reportsApi } from '../api'
import { money, shortDate, statusLabel, toEndOfDay, toStartOfDay } from '../constants'
import { useApi } from '../hooks'
import type { OrderStatus } from '../types'
import { Field, MoneyCard, PageHeader, Pagination, Select, StatePanel } from '../ui'

type Preset = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'

const presetOptions: { value: Preset; label: string }[] = [
  { value: 'daily', label: 'Diário' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensal' },
  { value: 'yearly', label: 'Anual' },
  { value: 'custom', label: 'Personalizado' },
]

const dateOnly = (date: Date) => date.toISOString().slice(0, 10)

function presetRange(preset: Preset): { start: string; end: string } {
  const now = new Date()
  const end = dateOnly(now)
  if (preset === 'daily') return { start: end, end }
  if (preset === 'weekly') {
    const start = new Date(now)
    start.setDate(start.getDate() - 6)
    return { start: dateOnly(start), end }
  }
  if (preset === 'monthly') {
    return { start: dateOnly(new Date(now.getFullYear(), now.getMonth(), 1)), end }
  }
  if (preset === 'yearly') {
    return { start: dateOnly(new Date(now.getFullYear(), 0, 1)), end }
  }
  return { start: '', end }
}

export function ReportsScreen() {
  const [searchParams, setSearchParams] = useSearchParams()
  const preset = (searchParams.get('preset') as Preset) || 'monthly'
  const start = searchParams.get('start') || ''
  const end = searchParams.get('end') || ''
  const [tab, setTab] = useState<'pedidos' | 'produtos'>('pedidos')
  const params = {
    start: toStartOfDay(start),
    end: toEndOfDay(end),
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

  const applyPreset = (next: Preset) => {
    const range = presetRange(next)
    setSearchParams({ preset: next, start: range.start, end: range.end })
  }

  const setDate = (field: 'start' | 'end', value: string) => {
    setSearchParams({ preset: 'custom', start: field === 'start' ? value : start, end: field === 'end' ? value : end })
  }

  return (
    <>
      <PageHeader
        title="Relatórios"
        description={`Visão comercial e de estoque${start || end ? ` · ${start || 'início'} a ${end || 'hoje'}` : ''}.`}
        action={
          <Button variant="outline" onClick={reload}>
            Atualizar
          </Button>
        }
      />
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Field label="Período">
          <Select value={preset} onChange={(event) => applyPreset(event.target.value as Preset)}>
            {presetOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="De">
          <Input type="date" value={start} onChange={(event) => setDate('start', event.target.value)} />
        </Field>
        <Field label="Até">
          <Input type="date" value={end} onChange={(event) => setDate('end', event.target.value)} />
        </Field>
      </div>
      <div className="mb-4 flex gap-2">
        <Button variant={tab === 'pedidos' ? 'default' : 'outline'} onClick={() => setTab('pedidos')}>
          Pedidos
        </Button>
        <Button variant={tab === 'produtos' ? 'default' : 'outline'} onClick={() => setTab('produtos')}>
          Produtos
        </Button>
      </div>
      <StatePanel loading={loading} error={error}>
        {data && (
          <>
            <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MoneyCard label="Faturamento" value={money(data.summary.total_revenue)} />
              <MoneyCard label="Pedidos" value={String(data.summary.orders_count)} />
              <MoneyCard label="Ticket médio" value={money(data.summary.avg_ticket)} />
              <MoneyCard label="Descontos" value={money(data.summary.total_discount)} />
            </div>
            {tab === 'pedidos' ? (
              <div className="grid gap-4 lg:grid-cols-2">
                <ReportTable
                  title="Vendas por dia"
                  description="Faturamento e quantidade de pedidos."
                  headers={['Data', 'Pedidos', 'Faturamento']}
                  rows={data.summary.daily.map((day) => [
                    shortDate(day.date),
                    `${day.orders}×`,
                    money(day.revenue),
                  ])}
                />
                <ReportTable
                  title="Status dos pedidos"
                  headers={['Status', 'Quantidade']}
                  rows={data.statusCounts.map((item) => [
                    statusLabel[item.status as OrderStatus] || item.status,
                    String(item.count),
                  ])}
                />
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                <ReportTable
                  title="Mais vendidos"
                  headers={['Produto', 'Quantidade', 'Faturamento']}
                  rows={data.products.best_sellers.map((item) => [
                    item.item_name,
                    `${item.quantity}×`,
                    money(item.revenue),
                  ])}
                />
                <ReportTable
                  title="Maior margem"
                  headers={['Produto', 'Margem', '%']}
                  rows={data.products.highest_margin.map((item) => [
                    item.item_name,
                    money(item.margin),
                    `${item.margin_percent.toFixed(1)}%`,
                  ])}
                />
                <ReportTable
                  title="Maiores descontos"
                  headers={['Produto', 'Desconto']}
                  rows={data.products.highest_discount.map((item) => [
                    item.item_name,
                    money(item.total_discount),
                  ])}
                />
                <ReportTable
                  title="Estoque baixo"
                  headers={['Produto', 'Estoque', 'Mínimo']}
                  rows={data.lowStock.map((item) => [
                    item.name,
                    String(item.current_stock ?? 0),
                    String(item.min_stock),
                  ])}
                />
              </div>
            )}
          </>
        )}
      </StatePanel>
    </>
  )
}

function ReportTable({
  title,
  description,
  headers,
  rows,
}: {
  title: string
  description?: string
  headers: string[]
  rows: ReactNode[][]
}) {
  const [page, setPage] = useState(1)
  const limit = 10
  const pageRows = rows.slice((page - 1) * limit, page * limit)
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {rows.length ? (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  {headers.map((header) => (
                    <TableHead key={header}>{header}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((row, index) => (
                  <TableRow key={index}>
                    {row.map((cell, cellIndex) => (
                      <TableCell key={cellIndex}>{cell}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Sem dados no período.</p>
        )}
        <Pagination page={page} total={rows.length} limit={limit} onPageChange={setPage} />
      </CardContent>
    </Card>
  )
}
