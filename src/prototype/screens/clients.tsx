import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { clientsApi } from '../api'
import { ClientDialog, type ClientPayload } from '../client-dialog'
import { useAction, useApi, useDebouncedValue } from '../hooks'
import type { Client } from '../types'
import { ConfirmDialog, PageHeader, Pagination, StatePanel } from '../ui'

export function ClientsScreen() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebouncedValue(search)
  const [editing, setEditing] = useState<Client | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [deleting, setDeleting] = useState<Client | null>(null)
  const { data, loading, error, reload } = useApi(
    () =>
      clientsApi.list({
        search: debouncedSearch || undefined,
        active: true,
        page,
        limit: 20,
      }),
    [debouncedSearch, page],
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
      <Input
        value={search}
        onChange={(event) => {
          setSearch(event.target.value)
          setPage(1)
        }}
        placeholder="Buscar por nome ou telefone"
        className="mb-4 sm:max-w-sm"
      />
      <StatePanel loading={loading} error={error} empty={!data?.clients.length}>
        <div className="hidden overflow-x-auto rounded-lg border md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>{client.phone || '-'}</TableCell>
                  <TableCell>{client.city || 'Juazeiro do Norte'}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
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
