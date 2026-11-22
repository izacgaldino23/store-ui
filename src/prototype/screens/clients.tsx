import { useState } from 'react'
import { Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { clientsApi } from '../api'
import { ClientDialog, type ClientPayload } from '../client-dialog'
import { formatPhone } from '../constants'
import { useAction, useApi, useDebouncedValue } from '../hooks'
import type { Client } from '../types'
import { ConfirmDialog, PageHeader, Pagination, Select, StatePanel } from '../ui'

function clientAddress(client: Client): string {
  return [client.street, client.number && `nº ${client.number}`, client.neighborhood]
    .filter(Boolean)
    .join(', ') || '-'
}

export function ClientsScreen() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebouncedValue(search)
  const [active, setActive] = useState('true')
  const [editing, setEditing] = useState<Client | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [deleting, setDeleting] = useState<Client | null>(null)
  const { data, loading, error, reload } = useApi(
    () =>
      clientsApi.list({
        search: debouncedSearch || undefined,
        active: active === '' ? undefined : active === 'true',
        page,
        limit: 20,
      }),
    [debouncedSearch, active, page],
  )
  const save = useAction(async (payload: ClientPayload) => {
    await clientsApi.save(payload, editing?.id)
    setFormOpen(false)
    setEditing(null)
    reload()
  })
  const reactivate = useAction(async (client: Client) => {
    await clientsApi.save(
      {
        name: client.name,
        phone: client.phone,
        city: client.city,
        street: client.street,
        neighborhood: client.neighborhood,
        number: client.number,
        complement: client.complement,
        notes: client.notes,
        active: true,
      },
      client.id,
    )
    reload()
  })
  const remove = useAction(async () => {
    if (!deleting) return
    await clientsApi.remove(deleting.id)
    setDeleting(null)
    reload()
  })
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
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
            setPage(1)
          }}
          placeholder="Buscar por nome ou telefone"
          className="sm:max-w-sm"
        />
        <Select
          value={active}
          onChange={(event) => {
            setActive(event.target.value)
            setPage(1)
          }}
          className="sm:max-w-xs"
        >
          <option value="true">Ativos</option>
          <option value="false">Inativos</option>
          <option value="">Todos</option>
        </Select>
      </div>
      <StatePanel loading={loading} error={error} empty={!data?.clients.length}>
        <div className="hidden overflow-x-auto rounded-lg border md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Endereço</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>{formatPhone(client.phone) || '-'}</TableCell>
                  <TableCell>{clientAddress(client)}</TableCell>
                  <TableCell>{client.city || 'Juazeiro do Norte'}</TableCell>
                  <TableCell>
                    <span
                      className={
                        client.active
                          ? 'rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary'
                          : 'rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground'
                      }
                    >
                      {client.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      {!client.active && (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Reativar ${client.name}`}
                          disabled={reactivate.busy}
                          onClick={() => void reactivate.run(client)}
                        >
                          <RotateCcw />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Editar ${client.name}`}
                        onClick={() => {
                          setEditing(client)
                          setFormOpen(true)
                        }}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Excluir ${client.name}`}
                        onClick={() => setDeleting(client)}
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
          {data?.clients.map((client) => (
            <Card key={client.id} size="sm">
              <CardHeader>
                <CardTitle className="text-base">{client.name}</CardTitle>
                <CardDescription>{formatPhone(client.phone) || 'Sem telefone'}</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {clientAddress(client)}
                {' · '}
                {client.city || 'Juazeiro do Norte'}
                {' · '}
                {client.active ? 'Ativo' : 'Inativo'}
              </CardContent>
              <CardContent className="flex gap-2">
                {!client.active && (
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label={`Reativar ${client.name}`}
                    disabled={reactivate.busy}
                    onClick={() => void reactivate.run(client)}
                  >
                    <RotateCcw />
                  </Button>
                )}
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
      <Pagination page={page} total={data?.total ?? 0} limit={20} onPageChange={setPage} />

      <ClientDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        client={editing}
        busy={save.busy}
        error={save.error}
        onSave={(payload) => void save.run(payload)}
      />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Excluir cliente?"
        description="O cliente será desativado. Pedidos anteriores mantêm o nome."
        busy={remove.busy}
        error={remove.error}
        onConfirm={() => void remove.run()}
      />
    </>
  )
}
