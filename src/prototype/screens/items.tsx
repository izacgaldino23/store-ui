import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Download, Pencil, Plus } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { itemsApi } from '../api'
import { itemTypes, money, shortDate } from '../constants'
import { useAction, useApi, useDebouncedValue } from '../hooks'
import type { CatalogItem, ItemPayload, ItemType } from '../types'
import {
  ConfirmDialog,
  Field,
  LinkButton,
  PageHeader,
  Pagination,
  Select,
  StatePanel,
  Textarea,
} from '../ui'
import { SidePanel } from '../side-panel'

const emptyItem: ItemPayload = {
  item_type: 'revenda',
  name: '',
  display_name: '',
  keywords: '',
  bar_code: '',
  description: '',
  cost_price: 0,
  sale_price: null,
  min_stock: 0,
  unit: 'un',
  supplier: '',
  units_per_pack: 1,
}

export function ItemsScreen() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebouncedValue(search)
  const [type, setType] = useState('')
  const [importOpen, setImportOpen] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [summary, setSummary] = useState('')
  const [editingId, setEditingId] = useState<string | undefined>()
  const [panelOpen, setPanelOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const { data, loading, error, reload } = useApi(
    () =>
      itemsApi.list({
        search: debouncedSearch || undefined,
        type: type || undefined,
        page,
        limit: 20,
      }),
    [debouncedSearch, type, page],
  )
  const remove = useAction(async () => {
    if (selected.length === 1) await itemsApi.remove(selected[0])
    else await itemsApi.removeMany(selected)
    setSelected([])
    setDeleteOpen(false)
    reload()
  })
  const importCsv = useAction(async (file: File) => {
    const result = await itemsApi.importCsv(file)
    setSummary(`${result.created} de ${result.total} linhas importadas.`)
    setImportOpen(false)
    reload()
  })

  const onFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) void importCsv.run(file)
  }

  const openPanel = (id?: string) => {
    setEditingId(id)
    setPanelOpen(true)
  }

  return (
    <>
      <PageHeader
        title="Itens"
        description="Catálogo de produtos, insumos e serviços."
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <Download data-icon="inline-start" />
              Importar CSV
            </Button>
            <Button onClick={() => openPanel()}>
              <Plus data-icon="inline-start" />
              Novo item
            </Button>
          </div>
        }
      />
      {summary && (
        <Alert className="mb-4">
          <AlertDescription>{summary}</AlertDescription>
        </Alert>
      )}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
            setPage(1)
          }}
          placeholder="Buscar por nome, código ou palavra-chave"
        />
        <Select
          value={type}
          onChange={(event) => {
            setType(event.target.value)
            setPage(1)
          }}
          className="sm:max-w-xs"
        >
          <option value="">Todos os tipos</option>
          {itemTypes.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        {selected.length > 0 && (
          <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
            Excluir {selected.length}
          </Button>
        )}
      </div>
      <StatePanel loading={loading} error={error} empty={!data?.items.length}>
        <div className="hidden overflow-x-auto rounded-lg border md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" />
                <TableHead>Código</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Estoque</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      aria-label={`Selecionar ${item.name}`}
                      checked={selected.includes(item.id)}
                      onChange={(event) =>
                        setSelected((current) =>
                          event.target.checked
                            ? [...current, item.id]
                            : current.filter((id) => id !== item.id),
                        )
                      }
                    />
                  </TableCell>
                  <TableCell className="font-mono text-xs">{item.code}</TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{itemTypes.find((option) => option.value === item.item_type)?.label}</TableCell>
                  <TableCell>{item.sale_price ? money(item.sale_price) : '-'}</TableCell>
                  <TableCell>{item.item_type === 'revenda' ? item.current_stock ?? 0 : '-'}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" aria-label={`Editar ${item.name}`} onClick={() => openPanel(item.id)}>
                        <Pencil />
                      </Button>
                      <Link
                        to={`/items/${item.id}`}
                        aria-label={`Detalhes de ${item.name}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <ArrowLeft className="rotate-180" />
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex flex-col gap-2 md:hidden">
          {data?.items.map((item) => (
            <Card key={item.id} size="sm">
              <CardContent className="flex items-center gap-3 py-3">
                <input
                  type="checkbox"
                  aria-label={`Selecionar ${item.name}`}
                  checked={selected.includes(item.id)}
                  onChange={(event) =>
                    setSelected((current) =>
                      event.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id),
                    )
                  }
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.code} · {itemTypes.find((option) => option.value === item.item_type)?.label}
                  </p>
                </div>
                <div className="hidden text-right sm:block">
                  <p className="font-semibold">{item.sale_price ? money(item.sale_price) : '-'}</p>
                  {item.item_type === 'revenda' && (
                    <p className="text-sm text-muted-foreground">Estoque {item.current_stock ?? 0}</p>
                  )}
                </div>
                <Button variant="ghost" size="icon" aria-label={`Editar ${item.name}`} onClick={() => openPanel(item.id)}>
                  <Pencil />
                </Button>
                <Link to={`/items/${item.id}`} className="text-sm underline underline-offset-4">
                  Detalhes
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </StatePanel>
      <Pagination page={page} total={data?.total ?? 0} limit={20} onPageChange={setPage} />

      <ItemPanel
        open={panelOpen}
        onOpenChange={setPanelOpen}
        itemId={editingId}
        onSaved={() => {
          setPanelOpen(false)
          reload()
        }}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Excluir itens?"
        description="Os itens serão desativados e não aparecerão mais no catálogo."
        busy={remove.busy}
        error={remove.error}
        onConfirm={() => void remove.run()}
      />
      <ConfirmDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        title="Importar CSV"
        description="Selecione um arquivo CSV de itens. Nada é excluído."
        confirmLabel="Selecionar arquivo"
        busy={importCsv.busy}
        error={importCsv.error}
        onConfirm={() => fileRef.current?.click()}
      />
      <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={onFile} />
    </>
  )
}

function ItemPanel({
  open,
  onOpenChange,
  itemId,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemId?: string
  onSaved: () => void
}) {
  return (
    <SidePanel
      open={open}
      onOpenChange={onOpenChange}
      title={itemId ? 'Editar item' : 'Novo item'}
      description="Campos obrigatórios marcados com *."
    >
      <ItemFields key={itemId ?? 'new'} id={itemId} onSaved={onSaved} />
    </SidePanel>
  )
}

function ItemFields({ id, onSaved }: { id?: string; onSaved: () => void }) {
  const { data: item, loading } = useApi(() => (id ? itemsApi.get(id) : Promise.resolve(null)), [id])
  const [form, setForm] = useState<ItemPayload>(emptyItem)
  useEffect(() => {
    if (!item) return
    setForm({
      item_type: item.item_type,
      name: item.name,
      display_name: item.display_name || '',
      keywords: item.keywords || '',
      bar_code: item.bar_code || '',
      description: item.description || '',
      cost_price: item.cost_price,
      sale_price: item.sale_price ?? null,
      min_stock: item.min_stock,
      unit: item.unit,
      supplier: item.supplier || '',
      units_per_pack: item.units_per_pack,
    })
  }, [item])
  const save = useAction(async () => {
    if (id) await itemsApi.update(id, form)
    else await itemsApi.create(form)
    onSaved()
  })
  const update = (patch: Partial<ItemPayload>) => setForm((current) => ({ ...current, ...patch }))

  return (
    <form
      onSubmit={(event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        void save.run()
      }}
      className="space-y-4"
    >
      {save.error && (
        <Alert variant="destructive">
          <AlertDescription>{save.error}</AlertDescription>
        </Alert>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Tipo *">
          <Select
            value={form.item_type}
            onChange={(event) => update({ item_type: event.target.value as ItemType })}
          >
            {itemTypes.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Nome *">
          <Input value={form.name} required onChange={(event) => update({ name: event.target.value })} />
        </Field>
        <Field label="Nome de exibição">
          <Input
            value={form.display_name || ''}
            onChange={(event) => update({ display_name: event.target.value })}
          />
        </Field>
        <Field label="Código de barras">
          <Input value={form.bar_code || ''} onChange={(event) => update({ bar_code: event.target.value })} />
        </Field>
        <Field label="Custo (R$)">
          <Input
            type="number"
            min={0}
            step="0.01"
            value={form.cost_price}
            onChange={(event) => update({ cost_price: Number(event.target.value) })}
          />
        </Field>
        <Field label="Preço de venda (R$)">
          <Input
            type="number"
            min={0}
            step="0.01"
            value={form.sale_price ?? ''}
            onChange={(event) =>
              update({ sale_price: event.target.value ? Number(event.target.value) : null })
            }
          />
        </Field>
        <Field label="Estoque mínimo">
          <Input
            type="number"
            min={0}
            value={form.min_stock}
            onChange={(event) => update({ min_stock: Number(event.target.value) })}
          />
        </Field>
        <Field label="Unidade *">
          <Input value={form.unit} required onChange={(event) => update({ unit: event.target.value })} />
        </Field>
        <Field label="Unidades por pacote">
          <Input
            type="number"
            min={1}
            value={form.units_per_pack}
            onChange={(event) => update({ units_per_pack: Number(event.target.value) })}
          />
        </Field>
        <Field label="Fornecedor">
          <Input value={form.supplier || ''} onChange={(event) => update({ supplier: event.target.value })} />
        </Field>
        <Field label="Palavras-chave">
          <Input
            value={form.keywords || ''}
            maxLength={500}
            onChange={(event) => update({ keywords: event.target.value })}
          />
        </Field>
        <Field label="Descrição">
          <Textarea value={form.description || ''} onChange={(event) => update({ description: event.target.value })} />
        </Field>
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="lg" className="h-11" disabled={save.busy || loading}>
          {save.busy ? 'Salvando...' : 'Salvar'}
        </Button>
        <Button type="button" variant="outline" size="lg" className="h-11" onClick={onSaved}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}

export function NewItemScreen() {
  return <ItemForm />
}

export function EditItemScreen() {
  const { id = '' } = useParams()
  return <ItemForm id={id} />
}

function ItemForm({ id }: { id?: string }) {
  const navigate = useNavigate()
  return (
    <>
      <Button variant="ghost" onClick={() => navigate('/items')} className="mb-3">
        <ArrowLeft data-icon="inline-start" />
        Itens
      </Button>
      <PageHeader title={id ? 'Editar item' : 'Novo item'} />
      <div className="max-w-4xl">
        <ItemFields id={id} onSaved={() => navigate('/items')} />
      </div>
    </>
  )
}

export function ItemDetailScreen() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [adjustOpen, setAdjustOpen] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [reason, setReason] = useState('Ajuste manual pelo PDV')
  const { data: item, loading, error, reload } = useApi(() => itemsApi.get(id), [id])
  const adjust = useAction(async () => {
    await itemsApi.adjustStock(id, quantity, reason)
    setAdjustOpen(false)
    reload()
  })

  if (loading || error || !item) {
    return <StatePanel loading={loading} error={error} empty={!item} />
  }

  return (
    <>
      <Button variant="ghost" onClick={() => navigate('/items')} className="mb-3">
        <ArrowLeft data-icon="inline-start" />
        Itens
      </Button>
      <PageHeader
        title={item.name}
        description={`${item.code} · ${itemTypes.find((option) => option.value === item.item_type)?.label}`}
        action={
          <div className="flex gap-2">
            <LinkButton to={`/items/${item.id}/edit`} variant="outline">
              <Pencil data-icon="inline-start" />
              Editar
            </LinkButton>
            {item.item_type === 'revenda' && (
              <Button onClick={() => setAdjustOpen(true)}>Ajustar estoque</Button>
            )}
          </div>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Detalhes do item</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Custo</dt>
              <dd className="font-medium">{money(item.cost_price)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Venda</dt>
              <dd className="font-medium">{item.sale_price ? money(item.sale_price) : '-'}</dd>
            </div>
            {item.item_type === 'revenda' && (
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Estoque</dt>
                <dd className="font-medium">
                  {item.current_stock ?? 0} {item.unit} (mín. {item.min_stock})
                </dd>
              </div>
            )}
          </dl>
          <dl className="space-y-2 text-sm">
            {item.display_name && (
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Exibição</dt>
                <dd className="text-right font-medium">{item.display_name}</dd>
              </div>
            )}
            {item.description && (
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Descrição</dt>
                <dd className="max-w-[70%] text-right font-medium">{item.description}</dd>
              </div>
            )}
            {item.supplier && (
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Fornecedor</dt>
                <dd className="text-right font-medium">{item.supplier}</dd>
              </div>
            )}
            {item.bar_code && (
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Código de barras</dt>
                <dd className="font-mono font-medium">{item.bar_code}</dd>
              </div>
            )}
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Atualizado em</dt>
              <dd className="font-medium">{shortDate(item.updated_at)}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
      <AdjustDialog
        open={adjustOpen}
        onOpenChange={setAdjustOpen}
        quantity={quantity}
        reason={reason}
        busy={adjust.busy}
        error={adjust.error}
        onQuantity={setQuantity}
        onReason={setReason}
        onConfirm={() => void adjust.run()}
      />
    </>
  )
}

export function LowStockScreen() {
  const { data, loading, error, reload } = useApi(() => itemsApi.lowStock(), [])
  const [adjusting, setAdjusting] = useState<CatalogItem | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [reason, setReason] = useState('Reposição de estoque')
  const adjust = useAction(async () => {
    if (!adjusting) return
    await itemsApi.adjustStock(adjusting.id, quantity, reason)
    setAdjusting(null)
    reload()
  })

  return (
    <>
      <PageHeader title="Estoque baixo" description="Itens de revenda abaixo do mínimo." />
      <StatePanel loading={loading} error={error} empty={!data?.length}>
        <div className="hidden overflow-x-auto rounded-lg border md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Estoque</TableHead>
                <TableHead>Mínimo</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-xs">{item.code}</TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.current_stock ?? 0}</TableCell>
                  <TableCell>{item.min_stock}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      onClick={() => {
                        setAdjusting(item)
                        setQuantity(Math.max(1, item.min_stock - (item.current_stock ?? 0)))
                      }}
                    >
                      Repor
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex flex-col gap-2 md:hidden">
          {data?.map((item) => (
            <Card key={item.id} size="sm">
              <CardContent className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.current_stock ?? 0} {item.unit} · mínimo {item.min_stock}
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setAdjusting(item)
                    setQuantity(Math.max(1, item.min_stock - (item.current_stock ?? 0)))
                  }}
                >
                  Repor
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </StatePanel>
      <AdjustDialog
        open={!!adjusting}
        onOpenChange={(open) => !open && setAdjusting(null)}
        quantity={quantity}
        reason={reason}
        busy={adjust.busy}
        error={adjust.error}
        onQuantity={setQuantity}
        onReason={setReason}
        onConfirm={() => void adjust.run()}
      />
    </>
  )
}

function AdjustDialog({
  open,
  onOpenChange,
  quantity,
  reason,
  busy,
  error,
  onQuantity,
  onReason,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  quantity: number
  reason: string
  busy: boolean
  error?: string
  onQuantity: (value: number) => void
  onReason: (value: string) => void
  onConfirm: () => void
}) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Ajustar estoque"
      description="Use um número negativo para baixar a quantidade."
      confirmLabel="Aplicar"
      busy={busy}
      error={error}
      onConfirm={onConfirm}
    >
      <div className="grid gap-3">
        <Field label="Quantidade">
          <Input type="number" value={quantity} onChange={(event) => onQuantity(Number(event.target.value))} />
        </Field>
        <Field label="Motivo">
          <Input value={reason} onChange={(event) => onReason(event.target.value)} />
        </Field>
      </div>
    </ConfirmDialog>
  )
}
