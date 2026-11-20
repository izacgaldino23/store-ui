import { useEffect, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { itemsApi, printingApi } from '../api'
import { addonPriceTypes, money } from '../constants'
import { useAction, useApi } from '../hooks'
import type { PrintAddon, PrintPaper } from '../types'
import { ConfirmDialog, Field, PageHeader, Select, StatePanel } from '../ui'

export function PrintingScreen() {
  const [paperOpen, setPaperOpen] = useState(false)
  const [addonOpen, setAddonOpen] = useState(false)
  const [editingPaper, setEditingPaper] = useState<PrintPaper | null>(null)
  const [editingAddon, setEditingAddon] = useState<PrintAddon | null>(null)
  const [deleting, setDeleting] = useState<{ kind: 'paper' | 'addon'; id: string } | null>(null)

  const papers = useApi(() => printingApi.papers({ limit: 100 }), [])
  const addons = useApi(() => printingApi.addons({ limit: 100 }), [])
  const insumos = useApi(() => itemsApi.list({ type: 'insumo', limit: 100 }), [])

  const savePaper = useAction(async (payload: Parameters<typeof printingApi.savePaper>[0]) => {
    await printingApi.savePaper(payload, editingPaper?.id)
    setPaperOpen(false)
    setEditingPaper(null)
    papers.reload()
  })
  const saveAddon = useAction(async (payload: Parameters<typeof printingApi.saveAddon>[0]) => {
    await printingApi.saveAddon(payload, editingAddon?.id)
    setAddonOpen(false)
    setEditingAddon(null)
    addons.reload()
  })
  const remove = useAction(async () => {
    if (!deleting) return
    if (deleting.kind === 'paper') await printingApi.removePaper(deleting.id)
    else await printingApi.removeAddon(deleting.id)
    setDeleting(null)
    papers.reload()
    addons.reload()
  })

  const error = savePaper.error || saveAddon.error || remove.error

  return (
    <>
      <PageHeader
        title="Impressão"
        description="Papéis, insumos e adicionais de impressão."
      />
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Tabs defaultValue="papers">
        <TabsList className="h-12 w-full sm:w-auto">
          <TabsTrigger value="papers" className="h-10 text-base">
            Papéis
          </TabsTrigger>
          <TabsTrigger value="addons" className="h-10 text-base">
            Adicionais
          </TabsTrigger>
        </TabsList>
        <TabsContent value="papers" className="pt-4">
          <div className="mb-3 flex justify-end">
            <Button
              onClick={() => {
                setEditingPaper(null)
                setPaperOpen(true)
              }}
            >
              <Plus data-icon="inline-start" />
              Novo papel
            </Button>
          </div>
          <StatePanel loading={papers.loading} error={papers.error} empty={!papers.data?.length}>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {papers.data?.map((paper) => (
                <Card key={paper.id} size="sm">
                  <CardHeader>
                    <CardTitle className="text-base">{paper.display_name}</CardTitle>
                    <CardDescription>{money(paper.price_per_sheet)} por folha</CardDescription>
                  </CardHeader>
                  {paper.sheets_remaining != null && (
                    <CardContent className="text-sm text-muted-foreground">
                      {paper.sheets_remaining} folhas disponíveis
                    </CardContent>
                  )}
                  <CardContent className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingPaper(paper)
                        setPaperOpen(true)
                      }}
                    >
                      <Pencil data-icon="inline-start" />
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleting({ kind: 'paper', id: paper.id })}
                    >
                      <Trash2 />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </StatePanel>
        </TabsContent>
        <TabsContent value="addons" className="pt-4">
          <div className="mb-3 flex justify-end">
            <Button
              onClick={() => {
                setEditingAddon(null)
                setAddonOpen(true)
              }}
            >
              <Plus data-icon="inline-start" />
              Novo adicional
            </Button>
          </div>
          <StatePanel loading={addons.loading} error={addons.error} empty={!addons.data?.length}>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {addons.data?.map((addon) => (
                <Card key={addon.id} size="sm">
                  <CardHeader>
                    <CardTitle className="text-base">{addon.name}</CardTitle>
                    <CardDescription>
                      {addonPriceTypes.find((option) => option.value === addon.price_type)?.label}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-lg font-semibold">
                    {addon.price_type === 'percentage' ? `${addon.price_value}%` : money(addon.price_value)}
                  </CardContent>
                  <CardContent className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingAddon(addon)
                        setAddonOpen(true)
                      }}
                    >
                      <Pencil data-icon="inline-start" />
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleting({ kind: 'addon', id: addon.id })}
                    >
                      <Trash2 />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </StatePanel>
        </TabsContent>
      </Tabs>

      <PaperDialog
        open={paperOpen}
        onOpenChange={setPaperOpen}
        paper={editingPaper}
        insumos={insumos.data?.items || []}
        busy={savePaper.busy}
        onSave={(payload) => void savePaper.run(payload)}
      />
      <AddonDialog
        open={addonOpen}
        onOpenChange={setAddonOpen}
        addon={editingAddon}
        busy={saveAddon.busy}
        onSave={(payload) => void saveAddon.run(payload)}
      />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Excluir registro?"
        description="O registro será desativado."
        confirmLabel="Excluir"
        busy={remove.busy}
        onConfirm={() => void remove.run()}
      />
    </>
  )
}

function PaperDialog({
  open,
  onOpenChange,
  paper,
  insumos,
  busy,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  paper: PrintPaper | null
  insumos: { id: string; name: string }[]
  busy: boolean
  onSave: (payload: Parameters<typeof printingApi.savePaper>[0]) => void
}) {
  const [itemId, setItemId] = useState('')
  const [customName, setCustomName] = useState('')
  const [price, setPrice] = useState(0)
  const [sheets, setSheets] = useState('')

  useEffect(() => {
    setItemId(paper?.item_id || '')
    setCustomName(paper?.custom_name || '')
    setPrice(paper?.price_per_sheet || 0)
    setSheets(paper?.sheets_remaining != null ? String(paper.sheets_remaining) : '')
  }, [paper])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{paper ? 'Editar papel' : 'Novo papel'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <Field label="Insumo vinculado">
            <Select value={itemId} onChange={(event) => setItemId(event.target.value)}>
              <option value="">Nome personalizado</option>
              {insumos.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </Field>
          {!itemId && (
            <Field label="Nome personalizado">
              <Input value={customName} onChange={(event) => setCustomName(event.target.value)} required />
            </Field>
          )}
          <Field label="Preço por folha (R$)">
            <Input
              type="number"
              min={0}
              step="0.01"
              value={price}
              onChange={(event) => setPrice(Number(event.target.value))}
            />
          </Field>
          <Field label="Folhas disponíveis">
            <Input
              type="number"
              min={0}
              value={sheets}
              onChange={(event) => setSheets(event.target.value)}
              placeholder="Opcional"
            />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            disabled={busy || (!itemId && !customName)}
            onClick={() =>
              onSave({
                item_id: itemId || undefined,
                custom_name: itemId ? undefined : customName,
                price_per_sheet: price,
                sheets_remaining: sheets ? Number(sheets) : undefined,
              })
            }
          >
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function AddonDialog({
  open,
  onOpenChange,
  addon,
  busy,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  addon: PrintAddon | null
  busy: boolean
  onSave: (payload: Parameters<typeof printingApi.saveAddon>[0]) => void
}) {
  const [name, setName] = useState('')
  const [priceType, setPriceType] = useState('fixed')
  const [priceValue, setPriceValue] = useState(0)
  useEffect(() => {
    setName(addon?.name || '')
    setPriceType(addon?.price_type || 'fixed')
    setPriceValue(addon?.price_value || 0)
  }, [addon])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{addon ? 'Editar adicional' : 'Novo adicional'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <Field label="Nome">
            <Input value={name} onChange={(event) => setName(event.target.value)} required />
          </Field>
          <Field label="Tipo">
            <Select value={priceType} onChange={(event) => setPriceType(event.target.value)}>
              {addonPriceTypes.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={priceType === 'percentage' ? 'Percentual (%)' : 'Valor (R$)'}>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={priceValue}
              onChange={(event) => setPriceValue(Number(event.target.value))}
            />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            disabled={busy || !name}
            onClick={() => onSave({ name, price_type: priceType, price_value: priceValue })}
          >
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
