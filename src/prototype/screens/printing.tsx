import { useEffect, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { itemsApi, printingApi } from '../api'
import { addonPriceTypes, money } from '../constants'
import { useAction, useApi } from '../hooks'
import type { PrintAddon, PrintPaper } from '../types'
import { ConfirmDialog, Field, PageHeader, Pagination, Select, StatePanel } from '../ui'
import { SidePanel } from '../side-panel'

export function PrintingScreen() {
  const [paperOpen, setPaperOpen] = useState(false)
  const [addonOpen, setAddonOpen] = useState(false)
  const [editingPaper, setEditingPaper] = useState<PrintPaper | null>(null)
  const [editingAddon, setEditingAddon] = useState<PrintAddon | null>(null)
  const [deleting, setDeleting] = useState<{ kind: 'paper' | 'addon'; id: string } | null>(null)
  const [paperPage, setPaperPage] = useState(1)
  const [addonPage, setAddonPage] = useState(1)

  const papers = useApi(() => printingApi.papers({ active: true, page: paperPage, limit: 20 }), [paperPage])
  const addons = useApi(() => printingApi.addons({ active: true, page: addonPage, limit: 20 }), [addonPage])
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

  return (
    <>
      <PageHeader title="Impressão" description="Papéis, insumos e adicionais de impressão." />

      <section className="mb-8">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <div>
            <h2 className="text-lg font-semibold">Papéis</h2>
            <p className="text-sm text-muted-foreground">Tipos de papel e valores por folha.</p>
          </div>
          <Button
            className="w-full sm:w-auto"
            onClick={() => {
              setEditingPaper(null)
              setPaperOpen(true)
            }}
          >
            <Plus data-icon="inline-start" />
            Novo papel
          </Button>
        </div>
        <StatePanel loading={papers.loading} error={papers.error} empty={!papers.data?.papers.length}>
          <div className="hidden overflow-x-auto rounded-lg border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Preço por folha</TableHead>
                  <TableHead>Folhas restantes</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {papers.data?.papers.map((paper) => (
                  <TableRow key={paper.id}>
                    <TableCell className="font-medium">{paper.display_name}</TableCell>
                    <TableCell>{money(paper.price_per_sheet)}</TableCell>
                    <TableCell>{paper.sheets_remaining ?? '-'}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Editar ${paper.display_name}`}
                          onClick={() => {
                            setEditingPaper(paper)
                            setPaperOpen(true)
                          }}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Excluir ${paper.display_name}`}
                          onClick={() => setDeleting({ kind: 'paper', id: paper.id })}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 md:hidden">
            {papers.data?.papers.map((paper) => (
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
                  <Button variant="ghost" size="icon" onClick={() => setDeleting({ kind: 'paper', id: paper.id })}>
                    <Trash2 />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </StatePanel>
        <Pagination
          page={paperPage}
          total={papers.data?.total ?? 0}
          limit={20}
          onPageChange={setPaperPage}
        />
      </section>

      <section>
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <div>
            <h2 className="text-lg font-semibold">Adicionais</h2>
            <p className="text-sm text-muted-foreground">Taxas por folha, por impressão ou percentuais.</p>
          </div>
          <Button
            className="w-full sm:w-auto"
            onClick={() => {
              setEditingAddon(null)
              setAddonOpen(true)
            }}
          >
            <Plus data-icon="inline-start" />
            Novo adicional
          </Button>
        </div>
        <StatePanel loading={addons.loading} error={addons.error} empty={!addons.data?.addons.length}>
          <div className="hidden overflow-x-auto rounded-lg border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {addons.data?.addons.map((addon) => (
                  <TableRow key={addon.id}>
                    <TableCell className="font-medium">{addon.name}</TableCell>
                    <TableCell>{addonPriceTypes.find((option) => option.value === addon.price_type)?.label}</TableCell>
                    <TableCell>
                      {addon.price_type === 'percentage' ? `${addon.price_value}%` : money(addon.price_value)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Editar ${addon.name}`}
                          onClick={() => {
                            setEditingAddon(addon)
                            setAddonOpen(true)
                          }}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Excluir ${addon.name}`}
                          onClick={() => setDeleting({ kind: 'addon', id: addon.id })}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 md:hidden">
            {addons.data?.addons.map((addon) => (
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
                  <Button variant="ghost" size="icon" onClick={() => setDeleting({ kind: 'addon', id: addon.id })}>
                    <Trash2 />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </StatePanel>
        <Pagination
          page={addonPage}
          total={addons.data?.total ?? 0}
          limit={20}
          onPageChange={setAddonPage}
        />
      </section>

      <PaperPanel
        open={paperOpen}
        onOpenChange={setPaperOpen}
        paper={editingPaper}
        insumos={insumos.data?.items || []}
        busy={savePaper.busy}
        error={savePaper.error}
        onSave={(payload) => void savePaper.run(payload)}
      />
      <AddonPanel
        open={addonOpen}
        onOpenChange={setAddonOpen}
        addon={editingAddon}
        busy={saveAddon.busy}
        error={saveAddon.error}
        onSave={(payload) => void saveAddon.run(payload)}
      />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Excluir registro?"
        description="O registro será desativado."
        confirmLabel="Excluir"
        busy={remove.busy}
        error={remove.error}
        onConfirm={() => void remove.run()}
      />
    </>
  )
}

function PaperPanel({
  open,
  onOpenChange,
  paper,
  insumos,
  busy,
  error,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  paper: PrintPaper | null
  insumos: { id: string; name: string }[]
  busy: boolean
  error?: string
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
    <SidePanel
      open={open}
      onOpenChange={onOpenChange}
      title={paper ? 'Editar papel' : 'Novo papel'}
      error={error}
      footer={
        <div className="flex justify-end gap-2">
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
            {busy ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      }
    >
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
    </SidePanel>
  )
}

function AddonPanel({
  open,
  onOpenChange,
  addon,
  busy,
  error,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  addon: PrintAddon | null
  busy: boolean
  error?: string
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
    <SidePanel
      open={open}
      onOpenChange={onOpenChange}
      title={addon ? 'Editar adicional' : 'Novo adicional'}
      error={error}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            disabled={busy || !name}
            onClick={() => onSave({ name, price_type: priceType, price_value: priceValue })}
          >
            {busy ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      }
    >
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
    </SidePanel>
  )
}
