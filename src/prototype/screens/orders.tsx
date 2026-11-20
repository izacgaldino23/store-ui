import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Pencil, Plus, Trash2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { clientsApi, itemsApi, ordersApi, printingApi } from '../api'
import {
  computeDiscountAmount,
  computePrintTotal,
  discountTypeOptions,
  money,
  paymentLabel,
  shortDate,
  statusOptions,
} from '../constants'
import { useAction, useApi } from '../hooks'
import type {
  CatalogItem,
  DiscountType,
  OrderPayload,
  PaymentMethod,
  PrintAddon,
} from '../types'
import {
  ConfirmDialog,
  Field,
  LinkButton,
  PageHeader,
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
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const { data, loading, error, reload } = useApi(
    () => ordersApi.list({ status: status || undefined, client_search: search || undefined, limit: 100 }),
    [status, search],
  )

  return (
    <>
      <PageHeader
        title="Pedidos"
        description="Acompanhe e finalize as vendas."
        action={
          <LinkButton to="/orders/create">
            <Plus data-icon="inline-start" />
            Novo pedido
          </LinkButton>
        }
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por cliente"
          className="sm:max-w-xs"
        />
        <Select value={status} onChange={(event) => setStatus(event.target.value)} className="sm:max-w-xs">
          <option value="">Todos os status</option>
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <Button variant="outline" onClick={reload}>
          Atualizar
        </Button>
      </div>
      <StatePanel loading={loading} error={error} empty={!data?.orders.length}>
        <div className="flex flex-col gap-3">
          {data?.orders.map((order) => (
            <Link key={order.id} to={`/orders/${order.id}`}>
              <Card size="sm" className="transition-colors hover:bg-muted/50">
                <CardContent className="flex items-center gap-3 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-medium">
                      {order.client_name || 'Balcão'}
                    </p>
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
    </>
  )
}

export function OrderDetailScreen() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const { data: order, loading, error, reload } = useApi(() => ordersApi.get(id), [id])
  const finalize = useAction((method: string) => ordersApi.finalize(id, method))
  const cancel = useAction(() => ordersApi.cancel(id, 'Cancelado pelo PDV'))

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
  const actionError = finalize.error || cancel.error

  return (
    <>
      <Button variant="ghost" onClick={() => navigate('/orders')} className="mb-3">
        <ArrowLeft data-icon="inline-start" />
        Pedidos
      </Button>
      <PageHeader
        title={`Pedido ${order.id.slice(0, 8)}`}
        description={`${order.client_name || 'Balcão'} · ${shortDate(order.created_at)}`}
        action={<StatusBadge status={order.status} />}
      />
      {actionError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      )}
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
          <AlertDescription>{order.cancel_reason || 'Pedido cancelado.'}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Itens</CardTitle>
            <CardDescription>Produtos e serviços do pedido.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between gap-3 text-sm">
                <span>
                  {item.quantity}× {item.item_name}
                </span>
                <span>{money(item.total_price)}</span>
              </div>
            ))}
            {order.prints.map((print) => (
              <div key={print.id} className="flex justify-between gap-3 text-sm">
                <span>
                  {print.quantity}× {print.paper_name}
                </span>
                <span>{money(print.total_price)}</span>
              </div>
            ))}
            {!order.items.length && !order.prints.length && (
              <p className="text-sm text-muted-foreground">Sem itens.</p>
            )}
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
                className="h-12 w-full text-base"
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

      <PaymentDialog
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        busy={finalize.busy}
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
        onConfirm={async () => {
          if (await cancel.run()) {
            setCancelOpen(false)
            reload()
          }
        }}
      />
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
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [cart, setCart] = useState<CartLine[]>([])
  const [prints, setPrints] = useState<PrintLine[]>([])
  const [clientId, setClientId] = useState('')
  const [notes, setNotes] = useState('')
  const [discountType, setDiscountType] = useState<DiscountType>('valor')
  const [discountValue, setDiscountValue] = useState(0)
  const [paymentOpen, setPaymentOpen] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const catalog = useApi(
    () => itemsApi.list({ search: debouncedSearch || undefined, limit: 20 }),
    [debouncedSearch],
  )
  const papers = useApi(() => printingApi.papers({ active: true, limit: 100 }), [])
  const addons = useApi(() => printingApi.addons({ active: true, limit: 100 }), [])
  const clients = useApi(() => clientsApi.list({ active: true, limit: 100 }), [])
  const existing = useApi(() => (orderId ? ordersApi.get(orderId) : Promise.resolve(null)), [orderId])

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
    const paper = papers.data?.find((item) => item.id === line.print_paper_id)
    const selected = addons.data?.filter((addon) => line.addon_ids.includes(addon.id)) || []
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
    const firstPaper = papers.data?.[0]?.id
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

  const actionError = save.error || finalize.error
  const invalid =
    (!cart.length && !prints.every((line) => !line.print_paper_id) && !prints.length) ||
    discount > subtotal ||
    subtotal <= 0

  return (
    <>
      <Button variant="ghost" onClick={() => navigate('/orders')} className="mb-3">
        <ArrowLeft data-icon="inline-start" />
        Pedidos
      </Button>
      <PageHeader
        title={orderId ? 'Editar pedido' : 'Novo pedido'}
        description="Monte a venda por produtos ou impressões."
      />
      {actionError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      )}

      <div className="pb-40 md:pb-4">
        <Tabs defaultValue="produtos">
          <TabsList className="h-12 w-full">
            <TabsTrigger value="produtos" className="h-10 text-base">
              Produtos <Badge variant="secondary">{cart.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="impressoes" className="h-10 text-base">
              Impressões <Badge variant="secondary">{prints.filter((line) => line.print_paper_id).length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="detalhes" className="h-10 text-base">
              Detalhes
            </TabsTrigger>
          </TabsList>
          <TabsContent value="produtos" className="space-y-3 pt-4">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar item por nome ou código"
            />
            <StatePanel loading={catalog.loading} error={catalog.error}>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {catalog.data?.items.map((item) => (
                  <Card key={item.id} size="sm">
                    <CardHeader>
                      <CardTitle className="text-base">{item.name}</CardTitle>
                      <CardDescription>{item.code}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-lg font-semibold">
                      {item.sale_price ? money(item.sale_price) : 'Sem preço'}
                    </CardContent>
                    <CardFooter>
                      <Button
                        className="h-11 w-full text-base"
                        disabled={!item.sale_price}
                        onClick={() => addProduct(item)}
                      >
                        <Plus data-icon="inline-start" />
                        Adicionar
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </StatePanel>
            <div className="flex flex-col gap-2">
              {cart.map((line) => (
                <Card key={line.item_id} size="sm">
                  <CardContent className="flex items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{line.name}</p>
                      <p className="text-sm text-muted-foreground">{money(line.unit_price)} / un.</p>
                    </div>
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
                    <span className="w-24 text-right font-semibold">
                      {money(line.unit_price * line.quantity)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setCart((current) => current.filter((item) => item.item_id !== line.item_id))}
                    >
                      <Trash2 />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="impressoes" className="space-y-3 pt-4">
            <Button variant="outline" onClick={addPrint} disabled={!papers.data?.length}>
              <Plus data-icon="inline-start" />
              Nova impressão
            </Button>
            {prints.map((line) => {
              const paper = papers.data?.find((item) => item.id === line.print_paper_id)
              const lineTotal = computePrintTotal(
                paper,
                addons.data?.filter((addon) => line.addon_ids.includes(addon.id)) || [],
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
                        {papers.data?.map((paperOption) => (
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
                        {addons.data?.map((addon: PrintAddon) => (
                          <label key={addon.id} className="flex items-center gap-1 text-sm">
                            <input
                              type="checkbox"
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
          </TabsContent>

          <TabsContent value="detalhes" className="space-y-4 pt-4">
            <Field label="Cliente">
              <Select value={clientId} onChange={(event) => setClientId(event.target.value)}>
                <option value="">Balcão (sem cliente)</option>
                {clients.data?.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </Select>
            </Field>
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
          </TabsContent>
        </Tabs>
      </div>

      <div className="fixed inset-x-0 bottom-14 z-30 flex items-center justify-between gap-3 border-t bg-background px-4 py-3 shadow-lg md:bottom-0 md:left-60">
        <div>
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-2xl font-semibold">{money(total)}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" disabled={save.busy || invalid} onClick={() => void save.run()}>
            Salvar rascunho
          </Button>
          <Button
            size="lg"
            className="h-12 px-5 text-base"
            disabled={finalize.busy || invalid}
            onClick={() => setPaymentOpen(true)}
          >
            Finalizar
          </Button>
        </div>
      </div>

      <PaymentDialog
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        busy={finalize.busy}
        onConfirm={async (method) => {
          if (await finalize.run(method)) setPaymentOpen(false)
        }}
      />
    </>
  )
}
