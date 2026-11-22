import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Pencil, Plus, ReceiptText, Trash2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { clientsApi, itemsApi, ordersApi, printingApi } from '../api'
import { ClientDialog, type ClientPayload } from '../client-dialog'
import { ReceiptDialog } from '../receipt'
import {
  computeDiscountAmount,
  computePrintTotal,
  discountTypeOptions,
  formatPhone,
  itemTypes,
  money,
  paymentLabel,
  shortDate,
  statusOptions,
  toEndOfDay,
  toStartOfDay,
} from '../constants'
import { useAction, useApi, useDebouncedValue } from '../hooks'
import type {
  CatalogItem,
  DiscountType,
  OrderPayload,
  PaymentMethod,
} from '../types'
import {
  ConfirmDialog,
  Field,
  LinkButton,
  PageHeader,
  Pagination,
  PaymentDialog,
  Select,
  StatePanel,
  StatusBadge,
  Textarea,
} from '../ui'

interface CartLine {
  item_id: string
  name: string
  unit_price: number
  quantity: number
}

interface PrintLine {
  key: string
  print_paper_id: string
  quantity: number
  addon_ids: string[]
  description: string
}

export function OrdersScreen() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [status, setStatus] = useState(searchParams.get('status') ?? '')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [hasPrint, setHasPrint] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebouncedValue(search)
  useEffect(() => {
    setStatus(searchParams.get('status') ?? '')
  }, [searchParams])
  const { data, loading, error, reload } = useApi(
    () =>
      ordersApi.list({
        status: status || undefined,
        start_date: toStartOfDay(startDate),
        end_date: toEndOfDay(endDate),
        has_print: hasPrint || undefined,
        client_search: debouncedSearch || undefined,
        page,
        limit: 20,
      }),
    [status, startDate, endDate, hasPrint, debouncedSearch, page],
  )

  const updateStatus = (value: string) => {
    setStatus(value)
    setPage(1)
    const next = new URLSearchParams(searchParams)
    if (value) next.set('status', value)
    else next.delete('status')
    setSearchParams(next, { replace: true })
  }

  return (
    <>
      <PageHeader title="Pedidos" description="Acompanhe e finalize as vendas." />
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
            setPage(1)
          }}
          placeholder="Buscar por cliente"
        />
        <Select value={status} onChange={(event) => updateStatus(event.target.value)}>
          <option value="">Todos os status</option>
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <Select
          value={hasPrint}
          onChange={(event) => {
            setHasPrint(event.target.value)
            setPage(1)
          }}
        >
          <option value="">Com ou sem impressão</option>
          <option value="true">Com impressão</option>
          <option value="false">Sem impressão</option>
        </Select>
        <Input
          type="date"
          value={startDate}
          onChange={(event) => {
            setStartDate(event.target.value)
            setPage(1)
          }}
          aria-label="Data inicial"
        />
        <Input
          type="date"
          value={endDate}
          onChange={(event) => {
            setEndDate(event.target.value)
            setPage(1)
          }}
          aria-label="Data final"
        />
      </div>
      <div className="mb-4 flex">
        <Button variant="outline" className="w-full sm:ml-auto sm:w-auto" onClick={reload}>
          Atualizar
        </Button>
      </div>
      <StatePanel loading={loading} error={error} empty={!data?.orders.length}>
        <div className="hidden overflow-x-auto rounded-lg border md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <Link to={`/orders/${order.id}`} className="font-medium underline underline-offset-4">
                      #{order.id.slice(0, 8)}
                    </Link>
                  </TableCell>
                  <TableCell>{order.client_name || 'Balcão'}</TableCell>
                  <TableCell>{shortDate(order.created_at)}</TableCell>
                  <TableCell>
                    {order.items.length} itens · {order.prints.length} impressões
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={order.status} />
                  </TableCell>
                  <TableCell className="text-right font-semibold">{money(order.total_amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex flex-col gap-3 md:hidden">
          {data?.orders.map((order) => (
            <Link key={order.id} to={`/orders/${order.id}`}>
              <Card size="sm" className="transition-colors hover:bg-muted/50">
                <CardContent className="flex items-center gap-3 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-medium">{order.client_name || 'Balcão'}</p>
                    <p className="text-sm text-muted-foreground">
                      {shortDate(order.created_at)} · {order.items.length} itens · {order.prints.length} impressões
                    </p>
                  </div>
                  <StatusBadge status={order.status} />
                  <span className="w-24 text-right font-semibold">{money(order.total_amount)}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </StatePanel>
      <Pagination page={page} total={data?.total ?? 0} limit={20} onPageChange={setPage} />
    </>
  )
}

export function OrderDetailScreen() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const { data: order, loading, error, reload } = useApi(() => ordersApi.get(id), [id])
  const finalize = useAction((method: string) => ordersApi.finalize(id, method))
  const cancel = useAction((reason: string) => ordersApi.cancel(id, reason))

  if (loading || error || !order) {
    return (
      <>
        <Button variant="ghost" onClick={() => navigate('/orders')} className="mb-3">
          <ArrowLeft data-icon="inline-start" />
          Pedidos
        </Button>
        <StatePanel loading={loading} error={error} empty={!order} />
      </>
    )
  }

  const editable = ['rascunho', 'pendente', 'em_producao', 'pronto'].includes(order.status)

  return (
    <>
      <Button variant="ghost" onClick={() => navigate('/orders')} className="mb-3">
        <ArrowLeft data-icon="inline-start" />
        Pedidos
      </Button>
      <PageHeader
        title={`Pedido ${order.id.slice(0, 8)}`}
        description={`${order.client_name || 'Balcão'} · ${shortDate(order.created_at)}`}
        action={
          <div className="flex items-center gap-2">
            {order.status !== 'cancelado' && (
              <Button variant="outline" onClick={() => setReceiptOpen(true)}>
                <ReceiptText data-icon="inline-start" />
                Recibo
              </Button>
            )}
            <StatusBadge status={order.status} />
          </div>
        }
      />
      {order.status === 'entregue' && (
        <Alert className="mb-4">
          <CheckCircle2 />
          <AlertTitle>Pedido finalizado</AlertTitle>
          <AlertDescription>
            Pagamento registrado em{' '}
            {order.payments.map((payment) => paymentLabel[payment.method]).join(', ') || 'Pix'}.
          </AlertDescription>
        </Alert>
      )}
      {order.status === 'cancelado' && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>
            {order.cancel_reason || 'Pedido cancelado.'}
            {order.canceled_at && ` em ${shortDate(order.canceled_at)}`}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Itens</CardTitle>
            <CardDescription>Produtos e serviços do pedido.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Qtd.</TableHead>
                    <TableHead className="text-right">Unit.</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.item_name}</TableCell>
                      <TableCell>
                        {itemTypes.find((type) => type.value === item.item_type)?.label ?? item.item_type}
                      </TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">{money(item.unit_price)}</TableCell>
                      <TableCell className="text-right font-semibold">{money(item.total_price)}</TableCell>
                    </TableRow>
                  ))}
                  {!order.items.length && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        Sem itens.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 overflow-x-auto border-t pt-4">
              <h4 className="mb-2 font-semibold">Impressões</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Papel</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Adicionais</TableHead>
                    <TableHead className="text-right">Qtd.</TableHead>
                    <TableHead className="text-right">Unit.</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.prints.map((print) => (
                    <TableRow key={print.id}>
                      <TableCell className="font-medium">{print.paper_name}</TableCell>
                      <TableCell>{print.description || '-'}</TableCell>
                      <TableCell>
                        {print.addons.map((addon) => addon.name).join(', ') || '-'}
                      </TableCell>
                      <TableCell className="text-right">{print.quantity}</TableCell>
                      <TableCell className="text-right">{money(print.unit_price)}</TableCell>
                      <TableCell className="text-right font-semibold">{money(print.total_price)}</TableCell>
                    </TableRow>
                  ))}
                  {!order.prints.length && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        Sem impressões.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Resumo</CardTitle>
            <CardDescription>Valores e pagamentos.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>{money(order.subtotal_amount)}</span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Desconto</span>
                <span>- {money(order.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-semibold">
              <span>Total</span>
              <span>{money(order.total_amount)}</span>
            </div>
            <div className="mt-2 border-t pt-2">
              {order.payments.map((payment) => (
                <div key={payment.id} className="flex justify-between text-sm">
                  <span>{paymentLabel[payment.method]}</span>
                  <span>{money(payment.amount)}</span>
                </div>
              ))}
              {!order.payments.length && (
                <p className="text-sm text-muted-foreground">Nenhum pagamento registrado.</p>
              )}
            </div>
            {order.notes && <p className="mt-2 text-sm text-muted-foreground">Obs.: {order.notes}</p>}
          </CardContent>
          <CardFooter className="flex-col gap-2">
            {order.status === 'rascunho' && (
              <Button
                size="lg"
                className="h-12 text-base"
                disabled={finalize.busy}
                onClick={() => setPaymentOpen(true)}
              >
                Finalizar pedido
              </Button>
            )}
            {editable && (
              <LinkButton to={`/orders/${order.id}/edit`} variant="outline">
                <Pencil data-icon="inline-start" />
                Editar pedido
              </LinkButton>
            )}
            {!['entregue', 'cancelado'].includes(order.status) && (
              <Button variant="ghost" onClick={() => setCancelOpen(true)} disabled={cancel.busy}>
                Cancelar pedido
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>

      <ReceiptDialog order={order} open={receiptOpen} onOpenChange={setReceiptOpen} />
      <PaymentDialog
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        busy={finalize.busy}
        error={finalize.error}
        onConfirm={async (method) => {
          if (await finalize.run(method)) {
            setPaymentOpen(false)
            reload()
          }
        }}
      />
      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancelar pedido?"
        description="O pedido será marcado como cancelado."
        confirmLabel="Cancelar pedido"
        busy={cancel.busy}
        error={cancel.error}
        onConfirm={async () => {
          if (await cancel.run(cancelReason.trim() || 'Cancelado pelo PDV')) {
            setCancelOpen(false)
            setCancelReason('')
            reload()
          }
        }}
      >
        <Field label="Motivo (opcional)">
          <Textarea
            value={cancelReason}
            maxLength={255}
            onChange={(event) => setCancelReason(event.target.value)}
            placeholder="Ex.: cliente desistiu"
          />
        </Field>
      </ConfirmDialog>
    </>
  )
}

export function NewOrderScreen() {
  return <OrderForm />
}

export function EditOrderScreen() {
  const { id = '' } = useParams()
  return <OrderForm orderId={id} />
}

function OrderForm({ orderId }: { orderId?: string }) {
  const navigate = useNavigate()
  const [step, setStep] = useState<'itens' | 'detalhes'>('itens')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const catalogSearch = debouncedSearch.trim().length >= 2 ? debouncedSearch : undefined
  const [cart, setCart] = useState<CartLine[]>([])
  const [prints, setPrints] = useState<PrintLine[]>([])
  const [clientId, setClientId] = useState('')
  const [clientOpen, setClientOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const [discountType, setDiscountType] = useState<DiscountType>('valor')
  const [discountValue, setDiscountValue] = useState(0)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [guardOpen, setGuardOpen] = useState(false)
  const [pendingPath, setPendingPath] = useState('/orders')

  const catalog = useApi(
    () =>
      catalogSearch
        ? itemsApi.list({ search: catalogSearch, limit: 20 })
        : Promise.resolve({ items: [], total: 0 }),
    [catalogSearch],
  )
  const papers = useApi(() => printingApi.papers({ active: true, limit: 100 }), [])
  const addons = useApi(() => printingApi.addons({ active: true, limit: 100 }), [])
  const clients = useApi(() => clientsApi.list({ active: true, limit: 100 }), [])
  const paperOptions = papers.data?.papers ?? []
  const addonOptions = addons.data?.addons ?? []
  const existing = useApi(() => (orderId ? ordersApi.get(orderId) : Promise.resolve(null)), [orderId])
  const clientSave = useAction(async (payload: ClientPayload) => {
    const created = await clientsApi.save(payload)
    setClientId(created.id)
    setClientOpen(false)
    clients.reload()
  })

  useEffect(() => {
    const order = existing.data
    if (!order) return
    setCart(
      order.items.map((item) => ({
        item_id: item.item_id,
        name: item.item_name,
        unit_price: item.unit_price,
        quantity: item.quantity,
      })),
    )
    setPrints(
      order.prints.map((print) => ({
        key: print.id,
        print_paper_id: print.print_paper_id,
        quantity: print.quantity,
        addon_ids: print.addons.map((addon) => addon.addon_id),
        description: print.description || '',
      })),
    )
    setClientId(order.client_id || '')
    setNotes(order.notes || '')
    setDiscountType(order.discount_type || 'valor')
    setDiscountValue(order.discount_value || 0)
  }, [existing.data])

  const productTotal = cart.reduce((sum, line) => sum + line.unit_price * line.quantity, 0)
  const printTotal = prints.reduce((sum, line) => {
    const paper = paperOptions.find((item) => item.id === line.print_paper_id)
    const selected = addonOptions.filter((addon) => line.addon_ids.includes(addon.id))
    return sum + computePrintTotal(paper, selected, line.quantity)
  }, 0)
  const subtotal = Math.round((productTotal + printTotal) * 100) / 100
  const discount = computeDiscountAmount(subtotal, discountType, discountValue)
  const total = Math.round((subtotal - discount) * 100) / 100

  const save = useAction(async () => {
    const payload = buildPayload()
    if (orderId) await ordersApi.update(orderId, payload)
    else await ordersApi.create({ ...payload, status: 'rascunho' })
    navigate('/orders')
  })

  const finalize = useAction(async (method: string) => {
    const payload = buildPayload()
    const order = orderId
      ? await ordersApi.update(orderId, payload)
      : await ordersApi.create({ ...payload, status: 'rascunho' })
    await ordersApi.finalize(order.id, method)
    navigate(`/orders/${order.id}`)
  })

  const buildPayload = (): OrderPayload => ({
    items: cart.map((line) => ({ item_id: line.item_id, quantity: line.quantity })),
    prints: prints
      .filter((line) => line.print_paper_id)
      .map((line) => ({
        print_paper_id: line.print_paper_id,
        quantity: line.quantity,
        addon_ids: line.addon_ids,
        description: line.description || undefined,
      })),
    payments: (existing.data?.payments || []).map((payment) => ({
      method: payment.method as PaymentMethod,
      amount: payment.amount,
    })),
    notes: notes || undefined,
    client_id: clientId || undefined,
    discount_type: discountValue > 0 ? discountType : undefined,
    discount_value: discountValue,
  })

  useEffect(() => {
    if (!cart.length && !prints.length) return
    const handler = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [cart.length, prints.length])

  const addProduct = (item: CatalogItem) => {
    if (!item.sale_price) return
    setCart((current) => {
      const found = current.find((line) => line.item_id === item.id)
      if (found) {
        return current.map((line) =>
          line.item_id === item.id
            ? { ...line, quantity: line.quantity + 1 }
            : line,
        )
      }
      return [
        ...current,
        { item_id: item.id, name: item.name, unit_price: item.sale_price!, quantity: 1 },
      ]
    })
    setSearch('')
  }

  const addPrint = () => {
    const firstPaper = paperOptions[0]?.id
    if (!firstPaper) return
    setPrints((current) => [
      ...current,
      {
        key: crypto.randomUUID(),
        print_paper_id: firstPaper,
        quantity: 1,
        addon_ids: [],
        description: '',
      },
    ])
  }

  const invalid = subtotal <= 0 || discount > subtotal
  const dirty = Boolean(cart.length || prints.length || notes || clientId || discountValue)
  const requestLeave = (path: string) => {
    if (!dirty) {
      navigate(path)
      return
    }
    setPendingPath(path)
    setGuardOpen(true)
  }

  return (
    <>
      <Button variant="ghost" onClick={() => requestLeave('/orders')} className="mb-3">
        <ArrowLeft data-icon="inline-start" />
        Pedidos
      </Button>
      <PageHeader
        title={orderId ? 'Editar pedido' : 'Novo pedido'}
        description="Monte a venda por produtos ou impressões."
      />
      <div className="pb-40 md:pb-4">
        <div className="mb-4 flex items-center gap-3 text-sm">
          <span className={step === 'itens' ? 'font-semibold text-primary' : 'text-muted-foreground'}>
            1. Produtos e impressões
          </span>
          <span className="h-px flex-1 bg-border" />
          <span className={step === 'detalhes' ? 'font-semibold text-primary' : 'text-muted-foreground'}>
            2. Detalhes
          </span>
        </div>
        {step === 'itens' && (
          <div className="space-y-6">
            <section className="space-y-3 rounded-lg border bg-card/40 p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Produtos</h3>
                <span className="text-xs text-muted-foreground">{cart.length} no pedido</span>
              </div>
              <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar item por nome ou código"
            />
            {!catalogSearch && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Digite ao menos 2 caracteres para buscar produtos.
              </p>
            )}
            {catalogSearch && (
              <StatePanel loading={catalog.loading} error={catalog.error}>
                <div className="grid gap-2 sm:grid-cols-2">
                  {catalog.data?.items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => addProduct(item)}
                      disabled={!item.sale_price}
                      className="flex items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50 disabled:opacity-50"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{item.name}</span>
                        <span className="block text-xs text-muted-foreground">
                          {item.bar_code || item.code}
                        </span>
                      </span>
                      <span className="shrink-0 font-semibold">
                        {item.sale_price ? money(item.sale_price) : 'Sem preço'}
                      </span>
                    </button>
                  ))}
                </div>
              </StatePanel>
            )}
            <div className="flex flex-col gap-2">
              {cart.map((line) => (
                <Card key={line.item_id} size="sm">
                  <CardContent className="flex flex-wrap items-center gap-2 py-3 sm:flex-nowrap sm:gap-3">
                    <div className="min-w-0 flex-1 basis-full sm:basis-auto">
                      <p className="truncate font-medium">{line.name}</p>
                      <p className="text-sm text-muted-foreground">{money(line.unit_price)} / un.</p>
                    </div>
                    <div className="flex flex-1 items-center gap-2 sm:flex-none">
                      <Input
                        type="number"
                        min={1}
                        value={line.quantity}
                        onChange={(event) => {
                          const quantity = Math.max(1, Number(event.target.value))
                          setCart((current) =>
                            current.map((item) =>
                              item.item_id === line.item_id ? { ...item, quantity } : item,
                            ),
                          )
                        }}
                        className="w-20 text-center"
                      />
                      <span className="min-w-24 flex-1 text-right font-semibold sm:flex-none">
                        {money(line.unit_price * line.quantity)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setCart((current) => current.filter((item) => item.item_id !== line.item_id))
                        }
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            </section>

            <section className="space-y-3 border-t pt-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Impressões</h3>
                <span className="text-xs text-muted-foreground">{prints.length} adicionadas</span>
              </div>
              <Button variant="outline" onClick={addPrint} disabled={!paperOptions.length}>
              <Plus data-icon="inline-start" />
              Nova impressão
            </Button>
            {prints.map((line) => {
              const paper = paperOptions.find((item) => item.id === line.print_paper_id)
              const lineTotal = computePrintTotal(
                paper,
                addonOptions.filter((addon) => line.addon_ids.includes(addon.id)),
                line.quantity,
              )
              return (
                <Card key={line.key} size="sm">
                  <CardHeader>
                    <CardTitle className="text-base">{paper?.display_name || 'Impressão'}</CardTitle>
                    <CardDescription>{money(lineTotal)}</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-3 sm:grid-cols-2">
                    <Field label="Papel">
                      <Select
                        value={line.print_paper_id}
                        onChange={(event) =>
                          setPrints((current) =>
                            current.map((item) =>
                              item.key === line.key ? { ...item, print_paper_id: event.target.value } : item,
                            ),
                          )
                        }
                      >
                        {paperOptions.map((paperOption) => (
                          <option key={paperOption.id} value={paperOption.id}>
                            {paperOption.display_name}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Quantidade de folhas">
                      <Input
                        type="number"
                        min={1}
                        value={line.quantity}
                        onChange={(event) =>
                          setPrints((current) =>
                            current.map((item) =>
                              item.key === line.key
                                ? { ...item, quantity: Math.max(1, Number(event.target.value)) }
                                : item,
                            ),
                          )
                        }
                      />
                    </Field>
                    <Field label="Descrição">
                      <Input
                        value={line.description}
                        maxLength={255}
                        onChange={(event) =>
                          setPrints((current) =>
                            current.map((item) =>
                              item.key === line.key ? { ...item, description: event.target.value } : item,
                            ),
                          )
                        }
                      />
                    </Field>
                    <div className="flex flex-col gap-1 text-sm">
                      <span className="font-medium">Adicionais</span>
                      <div className="flex flex-wrap gap-2">
                        {addonOptions.map((addon) => (
                          <label key={addon.id} className="flex min-h-11 items-center gap-2 pr-2 text-sm">
                            <input
                              type="checkbox"
                              className="size-5 accent-primary"
                              checked={line.addon_ids.includes(addon.id)}
                              onChange={(event) =>
                                setPrints((current) =>
                                  current.map((item) =>
                                    item.key === line.key
                                      ? {
                                          ...item,
                                          addon_ids: event.target.checked
                                            ? [...item.addon_ids, addon.id]
                                            : item.addon_ids.filter((id) => id !== addon.id),
                                        }
                                      : item,
                                  ),
                                )
                              }
                            />
                            {addon.name}
                          </label>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant="ghost"
                      onClick={() => setPrints((current) => current.filter((item) => item.key !== line.key))}
                    >
                      <Trash2 data-icon="inline-start" />
                      Remover
                    </Button>
                  </CardFooter>
                </Card>
              )
            })}
            {!prints.length && (
              <p className="py-6 text-center text-muted-foreground">Nenhuma impressão adicionada.</p>
            )}
            </section>
          </div>
        )}

        {step === 'detalhes' && (
          <section className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1">
                <span className="mb-1.5 block text-sm font-medium">Cliente</span>
                <Select value={clientId} onChange={(event) => setClientId(event.target.value)}>
                  <option value="">Balcão (sem cliente)</option>
                  {clients.data?.clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                      {client.phone ? ` · ${formatPhone(client.phone)}` : ''}
                    </option>
                  ))}
                </Select>
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full sm:w-auto"
                onClick={() => setClientOpen(true)}
              >
                Novo cliente
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Tipo de desconto">
                <Select
                  value={discountType}
                  onChange={(event) => setDiscountType(event.target.value as DiscountType)}
                >
                  {discountTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Valor do desconto">
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={discountValue}
                  onChange={(event) => setDiscountValue(Math.max(0, Number(event.target.value)))}
                />
              </Field>
            </div>
            <Field label="Observações">
              <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={1000} />
            </Field>
            <Card size="sm">
              <CardContent className="flex flex-col gap-1 py-3">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{money(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Desconto</span>
                    <span>- {money(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>{money(total)}</span>
                </div>
              </CardContent>
            </Card>
          </section>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-[calc(3.75rem+env(safe-area-inset-bottom))] z-30 border-t bg-background shadow-lg md:bottom-0 md:left-60">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-2 px-4 py-3 sm:flex-nowrap sm:justify-between sm:gap-3">
          <div className="min-w-24 flex-1 sm:flex-none">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-semibold">{money(total)}</p>
            {save.error && <p className="text-xs text-destructive">{save.error}</p>}
          </div>
          <div className="flex w-full gap-2 sm:w-auto">
            {step === 'detalhes' && (
              <Button
                type="button"
                variant="ghost"
                size="lg"
                className="h-11 flex-1 sm:flex-none"
                onClick={() => setStep('itens')}
              >
                Voltar
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="h-11 flex-1 sm:flex-none"
              disabled={save.busy || invalid}
              onClick={() => void save.run()}
            >
              <span className="sm:hidden">Rascunho</span>
              <span className="hidden sm:inline">Salvar rascunho</span>
            </Button>
            {step === 'itens' ? (
              <Button
                type="button"
                size="lg"
                className="h-11 flex-[1.5] px-3 sm:flex-none sm:px-5"
                disabled={subtotal <= 0}
                onClick={() => setStep('detalhes')}
              >
                Continuar
              </Button>
            ) : (
              <Button
                type="button"
                size="lg"
                className="h-11 flex-[1.5] px-3 sm:flex-none sm:px-5"
                disabled={finalize.busy || invalid}
                onClick={() => setPaymentOpen(true)}
              >
                Finalizar
              </Button>
            )}
          </div>
        </div>
      </div>

      <ClientDialog
        open={clientOpen}
        onOpenChange={setClientOpen}
        client={null}
        busy={clientSave.busy}
        error={clientSave.error}
        onSave={(payload) => void clientSave.run(payload)}
        title="Novo cliente"
      />

      <PaymentDialog
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        busy={finalize.busy}
        error={finalize.error}
        onConfirm={async (method) => {
          if (await finalize.run(method)) setPaymentOpen(false)
        }}
      />

      <ConfirmDialog
        open={guardOpen}
        onOpenChange={setGuardOpen}
        title="Descartar alterações?"
        description="O pedido ainda não foi salvo. As alterações serão perdidas."
        confirmLabel="Descartar"
        onConfirm={() => {
          setGuardOpen(false)
          navigate(pendingPath)
        }}
      />
    </>
  )
}
