import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Plus, Trash2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { pricingApi } from '../api'
import { money } from '../constants'
import { useAction, useApi } from '../hooks'
import type { PriceEntry } from '../types'
import { ConfirmDialog, Field, LinkButton, PageHeader, StatePanel } from '../ui'

type PricePayload = Omit<PriceEntry, 'id' | 'active'>

export function PriceTableScreen() {
  const [deleting, setDeleting] = useState<PriceEntry | null>(null)
  const { data, loading, error, reload } = useApi(() => pricingApi.list(), [])
  const remove = useAction(async () => {
    if (!deleting) return
    await pricingApi.remove(deleting.id)
    setDeleting(null)
    reload()
  })

  return (
    <>
      <PageHeader
        title="Tabela de preços"
        description="Faixas de preço por tipo de papel e quantidade."
        action={
          <LinkButton to="/pricing/table/create">
            <Plus data-icon="inline-start" />
            Nova faixa
          </LinkButton>
        }
      />
      {remove.error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{remove.error}</AlertDescription>
        </Alert>
      )}
      <StatePanel loading={loading} error={error} empty={!data?.length}>
        <div className="flex flex-col gap-2">
          {data?.map((entry) => (
            <Card key={entry.id} size="sm">
              <CardContent className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{entry.paper_type}</p>
                  <p className="text-sm text-muted-foreground">
                    {entry.min_quantity} a {entry.max_quantity || '∞'} folhas
                    {entry.description ? ` · ${entry.description}` : ''}
                  </p>
                </div>
                <span className="font-semibold">{money(entry.unit_price)}</span>
                <LinkButton to={`/pricing/table/${entry.id}/edit`} variant="ghost" size="default">
                  <Pencil data-icon="inline-start" />
                  Editar
                </LinkButton>
                <Button variant="ghost" size="icon" onClick={() => setDeleting(entry)}>
                  <Trash2 />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </StatePanel>
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Excluir faixa?"
        description="A faixa deixará de ser usada nos cálculos."
        busy={remove.busy}
        onConfirm={() => void remove.run()}
      />
    </>
  )
}

export function NewPriceEntryScreen() {
  return <PriceForm />
}

export function EditPriceEntryScreen() {
  const { id = '' } = useParams()
  return <PriceForm id={id} />
}

function PriceForm({ id }: { id?: string }) {
  const navigate = useNavigate()
  const { data: entries } = useApi(() => pricingApi.list(), [])
  const [form, setForm] = useState<PricePayload>({
    paper_type: '',
    min_quantity: 0,
    max_quantity: 0,
    unit_price: 0,
    description: '',
  })
  useEffect(() => {
    const entry = entries?.find((item) => item.id === id)
    if (!entry) return
    setForm({
      paper_type: entry.paper_type,
      min_quantity: entry.min_quantity,
      max_quantity: entry.max_quantity,
      unit_price: entry.unit_price,
      description: entry.description || '',
    })
  }, [entries, id])
  const save = useAction(async () => {
    await pricingApi.save(form, id)
    navigate('/pricing/table')
  })

  return (
    <>
      <Button variant="ghost" onClick={() => navigate('/pricing/table')} className="mb-3">
        <ArrowLeft data-icon="inline-start" />
        Tabela de preços
      </Button>
      <PageHeader title={id ? 'Editar faixa' : 'Nova faixa'} />
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
            <CardTitle>Faixa de preço</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Tipo de papel">
              <Input
                value={form.paper_type}
                required
                maxLength={50}
                onChange={(event) => setForm({ ...form, paper_type: event.target.value })}
              />
            </Field>
            <Field label="Preço unitário (R$)">
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.unit_price}
                onChange={(event) => setForm({ ...form, unit_price: Number(event.target.value) })}
              />
            </Field>
            <Field label="Quantidade mínima">
              <Input
                type="number"
                min={0}
                value={form.min_quantity}
                onChange={(event) => setForm({ ...form, min_quantity: Number(event.target.value) })}
              />
            </Field>
            <Field label="Quantidade máxima">
              <Input
                type="number"
                min={0}
                value={form.max_quantity}
                onChange={(event) => setForm({ ...form, max_quantity: Number(event.target.value) })}
              />
            </Field>
            <Field label="Descrição">
              <Input
                value={form.description || ''}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
              />
            </Field>
          </CardContent>
          <CardContent className="flex gap-2">
            <Button type="submit" disabled={save.busy}>
              Salvar
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/pricing/table')}>
              Cancelar
            </Button>
          </CardContent>
        </Card>
      </form>
    </>
  )
}

export function CalculatorScreen() {
  const [materialCost, setMaterialCost] = useState(0)
  const [margin, setMargin] = useState(30)
  const [paperType, setPaperType] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [result, setResult] = useState<{ suggested_price: number; unit_price?: number } | null>(null)
  const calculate = useAction(async () => {
    const response = await pricingApi.calculate({
      material_cost: materialCost,
      margin_percent: margin,
      paper_type: paperType || undefined,
      quantity,
    })
    setResult(response)
  })

  return (
    <>
      <PageHeader title="Calculadora" description="Sugestão de preço por custo e margem." />
      {calculate.error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{calculate.error}</AlertDescription>
        </Alert>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Dados</CardTitle>
            <CardDescription>Preencha o custo e a margem desejada.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Custo do material (R$)">
              <Input
                type="number"
                min={0}
                step="0.01"
                value={materialCost}
                onChange={(event) => setMaterialCost(Number(event.target.value))}
              />
            </Field>
            <Field label="Margem (%)">
              <Input
                type="number"
                min={0}
                step="0.01"
                value={margin}
                onChange={(event) => setMargin(Number(event.target.value))}
              />
            </Field>
            <Field label="Tipo de papel">
              <Input value={paperType} onChange={(event) => setPaperType(event.target.value)} />
            </Field>
            <Field label="Quantidade">
              <Input
                type="number"
                min={0}
                value={quantity}
                onChange={(event) => setQuantity(Number(event.target.value))}
              />
            </Field>
          </CardContent>
          <CardContent>
            <Button size="lg" disabled={calculate.busy} onClick={() => void calculate.run()}>
              Calcular
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Resultado</CardTitle>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="flex flex-col gap-2">
                <p className="text-3xl font-semibold">{money(result.suggested_price)}</p>
                {result.unit_price != null && (
                  <p className="text-muted-foreground">Por unidade: {money(result.unit_price)}</p>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">Preencha os dados e clique em calcular.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
