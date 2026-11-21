import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { emptyClient } from './constants'
import type { Client } from './types'
import { Field, Textarea } from './ui'
import { SidePanel } from './side-panel'

export type ClientPayload = Omit<Client, 'id' | 'active'>

export function ClientDialog({
  open,
  onOpenChange,
  client,
  busy,
  error,
  onSave,
  title,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  client: Client | null
  busy: boolean
  error?: string
  onSave: (payload: ClientPayload) => void
  title?: string
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

  const update = (patch: Partial<ClientPayload>) =>
    setForm((current) => ({ ...current, ...patch }))

  return (
    <SidePanel
      open={open}
      onOpenChange={onOpenChange}
      title={title ?? (client ? 'Editar cliente' : 'Novo cliente')}
      description="Os campos com * são obrigatórios."
      error={error}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button disabled={busy || !form.name} onClick={() => onSave(form)}>
            {busy ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nome *">
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
    </SidePanel>
  )
}
