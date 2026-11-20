import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Download, Pencil, Plus } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { itemsApi } from '../api'
import { itemTypes, money, shortDate } from '../constants'
import { useAction, useApi } from '../hooks'
import type { CatalogItem, ItemPayload, ItemType } from '../types'
import {
  ConfirmDialog,
  Field,
  LinkButton,
  PageHeader,
  Select,
  StatePanel,
  Textarea,
} from '../ui'

export function ItemsScreen() {
  const [search, setSearch] = useState('')
  const [type, setType] = useState('')
  const [importOpen, setImportOpen] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [summary, setSummary] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const { data, loading, error, reload } = useApi(
    () => itemsApi.list({ search: search || undefined, type: type || undefined, limit: 100 }),
    [search, type],
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
            <LinkButton to="/items/create">
              <Plus data-icon="inline-start" />
              Novo item
            </LinkButton>
          </div>
        }
      />
      {(summary || importCsv.error || remove.error) && (
        <Alert className="mb-4" variant={importCsv.error || remove.error ? 'destructive' : 'default'}>
          <AlertDescription>{importCsv.error || remove.error || summary}</AlertDescription>
        </Alert>
      )}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por nome, código ou palavra-chave"
        />
        <Select value={type} onChange={(event) => setType(event.target.value)} className="sm:max-w-xs">
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
        <div className="flex flex-col gap-2">
          {data?.items.map((item) => (
            <Card key={item.id} size="sm">
              <CardContent className="flex items-center gap-3 py-3">
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
                <Link to={`/items/${item.id}`} className="text-sm underline underline-offset-4">
                  Detalhes
                </Link>
                <Link to={`/items/${item.id}/edit`} aria-label={`Editar ${item.name}`}>
                  <Button variant="ghost" size="icon">
                    <Pencil />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </StatePanel>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Excluir itens?"
        description="Os itens serão desativados e não aparecerão mais no catálogo."
        busy={remove.busy}
        onConfirm={() => void remove.run()}
      />
      <ConfirmDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        title="Importar CSV"
        description="Selecione um arquivo CSV de itens. Nada é excluído."
        confirmLabel="Selecionar arquivo"
        busy={importCsv.busy}
        onConfirm={() => fileRef.current?.click()}
      />
      <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={onFile} />
    </>
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
  const { data: item, loading } = useApi(() => (id ? itemsApi.get(id) : Promise.resolve(null)), [id])
  const [form, setForm] = useState<ItemPayload>({
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
  })
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
    navigate('/items')
  })
  const update = (patch: Partial<ItemPayload>) => setForm((current) => ({ ...current, ...patch }))

  return (
    <>
      <Button variant="ghost" onClick={() => navigate('/items')} className="mb-3">
        <ArrowLeft data-icon="inline-start" />
        Itens
      </Button>
      <PageHeader title={id ? 'Editar item' : 'Novo item'} />
      {save.error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{save.error}</AlertDescription>
        </Alert>
      )}
      <form
        onSubmit={(event: FormEvent<HTMLFormElement>) => {
          event.preventDefault()
          void save.run()
        }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Dados do item</CardTitle>
            <CardDescription>Campos obrigatórios marcados com *.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
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
            <Field label="Palavras-chave" >
              <Input
                value={form.keywords || ''}
                maxLength={500}
                onChange={(event) => update({ keywords: event.target.value })}
              />
            </Field>
            <Field label="Descrição">
              <Textarea
                value={form.description || ''}
                onChange={(event) => update({ description: event.target.value })}
              />
            </Field>
          </CardContent>
          <CardContent className="flex gap-2">
            <Button type="submit" size="lg" disabled={save.busy || loading}>
              {save.busy ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/items')}>
              Cancelar
            </Button>
          </CardContent>
        </Card>
      </form>
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
              <Button onClick={() => setAdjustOpen(true)}>
                Ajustar estoque
              </Button>
            )}
          </div>
        }
      />
      {adjust.error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{adjust.error}</AlertDescription>
        </Alert>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Valores</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Custo</span>
              <span>{money(item.cost_price)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Venda</span>
              <span>{item.sale_price ? money(item.sale_price) : '-'}</span>
            </div>
            {item.item_type === 'revenda' && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estoque</span>
                <span>
                  {item.current_stock ?? 0} {item.unit} (mín. {item.min_stock})
                </span>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Informações</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            {item.display_name && <p>{item.display_name}</p>}
            {item.description && <p>{item.description}</p>}
            {item.supplier && <p>Fornecedor: {item.supplier}</p>}
            {item.bar_code && <p>Código de barras: {item.bar_code}</p>}
            <p className="text-muted-foreground">Atualizado em {shortDate(item.updated_at)}</p>
          </CardContent>
        </Card>
      </div>
      <AdjustDialog
        open={adjustOpen}
        onOpenChange={setAdjustOpen}
        quantity={quantity}
        reason={reason}
        busy={adjust.busy}
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
      {adjust.error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{adjust.error}</AlertDescription>
        </Alert>
      )}
      <StatePanel loading={loading} error={error} empty={!data?.length}>
        <div className="flex flex-col gap-2">
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
  onQuantity,
  onReason,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  quantity: number
  reason: string
  busy: boolean
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
