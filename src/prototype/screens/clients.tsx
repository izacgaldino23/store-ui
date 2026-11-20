import { useEffect, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { clientsApi } from '../api'
import { useAction, useApi } from '../hooks'
import type { Client } from '../types'
import { ConfirmDialog, Field, PageHeader, StatePanel, Textarea } from '../ui'

type ClientPayload = Omit<Client, 'id' | 'active'>

const emptyClient: ClientPayload = {
  name: '',
  phone: '',
  city: 'Juazeiro do Norte',
  street: '',
  neighborhood: '',
  number: '',
  complement: '',
  notes: '',
}

export function ClientsScreen() {
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Client | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [deleting, setDeleting] = useState<Client | null>(null)
  const { data, loading, error, reload } = useApi(
    () => clientsApi.list({ search: search || undefined, active: true, limit: 100 }),
    [search],
  )
  const save = useAction(async (payload: ClientPayload) => {
    await clientsApi.save(payload, editing?.id)
    setFormOpen(false)
    setEditing(null)
    reload()
  })
  const remove = useAction(async () => {
    if (!deleting) return
    await clientsApi.remove(deleting.id)
    setDeleting(null)
    reload()
  })
  const actionError = save.error || remove.error

  return (
    <>
      <PageHeader
        title="Clientes"
        description="Cadastro de clientes para vincular aos pedidos."
        action={
          <Button
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
          >
            <Plus data-icon="inline-start" />
            Novo cliente
          </Button>
        }
      />
      {actionError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      )}
      <Input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Buscar por nome ou telefone"
        className="mb-4 sm:max-w-sm"
      />
      <StatePanel loading={loading} error={error} empty={!data?.length}>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {data?.map((client) => (
            <Card key={client.id} size="sm">
              <CardHeader>
                <CardTitle className="text-base">{client.name}</CardTitle>
                <CardDescription>{client.phone || 'Sem telefone'}</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {client.city || 'Juazeiro do Norte'}
                {client.neighborhood ? ` · ${client.neighborhood}` : ''}
              </CardContent>
              <CardContent className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditing(client)
                    setFormOpen(true)
                  }}
                >
                  <Pencil data-icon="inline-start" />
                  Editar
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setDeleting(client)}>
                  <Trash2 />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </StatePanel>

      <ClientDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        client={editing}
        busy={save.busy}
        onSave={(payload) => void save.run(payload)}
      />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Excluir cliente?"
        description="O cliente será desativado. Pedidos anteriores mantêm o nome."
        busy={remove.busy}
        onConfirm={() => void remove.run()}
      />
    </>
  )
}

function ClientDialog({
  open,
  onOpenChange,
  client,
  busy,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  client: Client | null
  busy: boolean
  onSave: (payload: ClientPayload) => void
}) {
  const [form, setForm] = useState<ClientPayload>(emptyClient)
  useEffect(() => {
    if (client) {
      setForm({
        name: client.name,
        phone: client.phone || '',
        city: client.city || '',
        street: client.street || '',
        neighborhood: client.neighborhood || '',
        number: client.number || '',
        complement: client.complement || '',
        notes: client.notes || '',
      })
    } else {
      setForm(emptyClient)
    }
  }, [client])
  const update = (patch: Partial<ClientPayload>) => setForm((current) => ({ ...current, ...patch }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{client ? 'Editar cliente' : 'Novo cliente'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nome">
            <Input value={form.name} onChange={(event) => update({ name: event.target.value })} required />
          </Field>
          <Field label="Telefone">
            <Input value={form.phone || ''} onChange={(event) => update({ phone: event.target.value })} />
          </Field>
          <Field label="Cidade">
            <Input value={form.city || ''} onChange={(event) => update({ city: event.target.value })} />
          </Field>
          <Field label="Bairro">
            <Input
              value={form.neighborhood || ''}
              onChange={(event) => update({ neighborhood: event.target.value })}
            />
          </Field>
          <Field label="Rua">
            <Input value={form.street || ''} onChange={(event) => update({ street: event.target.value })} />
          </Field>
          <Field label="Número">
            <Input value={form.number || ''} onChange={(event) => update({ number: event.target.value })} />
          </Field>
          <Field label="Complemento">
            <Input
              value={form.complement || ''}
              onChange={(event) => update({ complement: event.target.value })}
            />
          </Field>
          <Field label="Observações">
            <Textarea value={form.notes || ''} onChange={(event) => update({ notes: event.target.value })} />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button disabled={busy || !form.name} onClick={() => onSave(form)}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
