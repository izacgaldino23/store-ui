import { useState, type FormEvent } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cashApi } from '../api'
import {
  expenseCategories,
  money,
  paymentLabel,
  paymentMethods,
  shortDate,
  toEndOfDay,
  toStartOfDay,
} from '../constants'
import { useAction, useApi } from '../hooks'
import type { ExpenseCategory, PaymentMethod } from '../types'
import { Field, MoneyCard, PageHeader, Pagination, Select, StatePanel, Textarea } from '../ui'

const noRegister = (error: string) => /caixa|register|404|não.*aberto|nao.*aberto/i.test(error)

export function CurrentCashScreen() {
  const [starting, setStarting] = useState(0)
  const [notes, setNotes] = useState('')
  const [closing, setClosing] = useState(0)
  const [closeNotes, setCloseNotes] = useState('')
  const current = useApi(() => cashApi.current(), [])
  const open = useAction(async () => {
    await cashApi.open(starting, notes)
    current.reload()
  })
  const close = useAction(async () => {
    await cashApi.close(closing, closeNotes)
    current.reload()
  })

  const actionError = open.error || close.error
  const closed = current.error && noRegister(current.error)

  return (
    <>
      <PageHeader title="Caixa atual" description="Abra, acompanhe e feche o caixa do dia." />
      {actionError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      )}
      {closed ? (
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>Nenhum caixa aberto</CardTitle>
            <CardDescription>Informe o saldo inicial para começar.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Field label="Saldo inicial (R$)">
              <Input
                type="number"
                min={0}
                step="0.01"
                value={starting}
                onChange={(event) => setStarting(Number(event.target.value))}
              />
            </Field>
            <Field label="Observações">
              <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
            </Field>
            <Button size="lg" disabled={open.busy} onClick={() => void open.run()}>
              Abrir caixa
            </Button>
          </CardContent>
        </Card>
      ) : (
        <StatePanel loading={current.loading} error={current.error}>
          {current.data && (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <MoneyCard label="Saldo inicial" value={money(current.data.starting_balance)} />
                <MoneyCard
                  label="Saldo atual"
                  value={money(current.data.current_balance ?? current.data.starting_balance)}
                />
                <MoneyCard
                  label="Diferença"
                  value={money(current.data.discrepancy ?? 0)}
                  description={
                    current.data.discrepancy == null ? 'Ainda sem fechamento' : 'Conferido no fechamento'
                  }
                />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Aberto em {shortDate(current.data.opened_at)}
                {current.data.notes ? ` · ${current.data.notes}` : ''}
              </p>
              <Card className="mt-6 max-w-xl">
                <CardHeader>
                  <CardTitle>Fechar caixa</CardTitle>
                  <CardDescription>Informe o valor contado em mãos.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3">
                  <Field
                    label="Saldo final (R$)"
                    hint={`Diferença prevista: ${money(closing - (current.data.current_balance ?? current.data.starting_balance))}`}
                  >
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={closing}
                      onChange={(event) => setClosing(Number(event.target.value))}
                    />
                  </Field>
                  <Field label="Observações">
                    <Textarea value={closeNotes} onChange={(event) => setCloseNotes(event.target.value)} />
                  </Field>
                  <Button variant="destructive" disabled={close.busy} onClick={() => void close.run()}>
                    Fechar caixa
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </StatePanel>
      )}
    </>
  )
}

export function DailyReportScreen() {
  const { data, loading, error } = useApi(() => cashApi.dailyReport(), [])
  const closed = error && noRegister(error)
  return (
    <>
      <PageHeader title="Relatório diário" description="Resumo do caixa aberto." />
      {closed ? (
        <Alert>
          <AlertTitle>Sem caixa aberto</AlertTitle>
          <AlertDescription>Abra um caixa para ver o relatório do dia.</AlertDescription>
        </Alert>
      ) : (
        <StatePanel loading={loading} error={error}>
          {data && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Status: <span className="font-medium text-foreground">{data.status}</span> · Aberto em{' '}
                {shortDate(data.opened_at)}
                {data.closed_at ? ` · Fechado em ${shortDate(data.closed_at)}` : ''}
              </p>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <MoneyCard label="Vendas" value={money(data.total_sales)} />
                <MoneyCard label="Despesas" value={money(data.total_expenses)} />
                <MoneyCard label="Saldo inicial" value={money(data.starting_balance)} />
                <MoneyCard label="Saldo esperado" value={money(data.expected_balance)} />
                <MoneyCard label="Saldo final" value={money(data.closing_balance)} />
                <MoneyCard
                  label="Diferença"
                  value={money(data.discrepancy)}
                  description={data.discrepancy == null ? 'Ainda sem fechamento' : 'Conferido no fechamento'}
                />
              </div>
            </div>
          )}
        </StatePanel>
      )}
    </>
  )
}

export function CashHistoryScreen() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [page, setPage] = useState(1)
  const { data, loading, error } = useApi(
    () =>
      cashApi.history({
        start_date: toStartOfDay(startDate),
        end_date: toEndOfDay(endDate),
        page,
        limit: 20,
      }),
    [startDate, endDate, page],
  )
  return (
    <>
      <PageHeader title="Histórico de caixa" description="Todos os caixas já abertos." />
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <Field label="De">
          <Input
            type="date"
            value={startDate}
            onChange={(event) => {
              setStartDate(event.target.value)
              setPage(1)
            }}
          />
        </Field>
        <Field label="Até">
          <Input
            type="date"
            value={endDate}
            onChange={(event) => {
              setEndDate(event.target.value)
              setPage(1)
            }}
          />
        </Field>
      </div>
      <StatePanel loading={loading} error={error} empty={!data?.registers.length}>
        <div className="hidden overflow-x-auto rounded-lg border md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Abertura</TableHead>
                <TableHead>Fechamento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Inicial</TableHead>
                <TableHead>Final</TableHead>
                <TableHead>Diferença</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.registers.map((register) => (
                <TableRow key={register.id}>
                  <TableCell>{shortDate(register.opened_at)}</TableCell>
                  <TableCell>{register.closed_at ? shortDate(register.closed_at) : '-'}</TableCell>
                  <TableCell>{register.status}</TableCell>
                  <TableCell>{money(register.starting_balance)}</TableCell>
                  <TableCell>
                    {register.closing_balance != null
                      ? money(register.closing_balance)
                      : money(register.current_balance ?? 0)}
                  </TableCell>
                  <TableCell>{money(register.discrepancy)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex flex-col gap-2 md:hidden">
          {data?.registers.map((register) => (
            <Card key={register.id} size="sm">
              <CardContent className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium">{shortDate(register.opened_at)}</p>
                  <p className="text-sm text-muted-foreground">
                    {register.status} · Diferença {money(register.discrepancy)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    {register.closing_balance != null
                      ? money(register.closing_balance)
                      : money(register.current_balance ?? 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Inicial {money(register.starting_balance)}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </StatePanel>
      <Pagination page={page} total={data?.total ?? 0} limit={20} onPageChange={setPage} />
    </>
  )
}

export function ExpensesScreen() {
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState(0)
  const [method, setMethod] = useState<PaymentMethod>('dinheiro')
  const [category, setCategory] = useState<ExpenseCategory>('suprimentos')
  const [filterCategory, setFilterCategory] = useState('')
  const [page, setPage] = useState(1)
  const limit = 20
  const { data, loading, error, reload } = useApi(
    () => cashApi.expenses({ category: filterCategory || undefined }),
    [filterCategory],
  )
  const add = useAction(async () => {
    await cashApi.addExpense({ description, amount, payment_method: method, category })
    setDescription('')
    setAmount(0)
    reload()
  })
  const pageItems = data?.slice((page - 1) * limit, page * limit) ?? []

  return (
    <>
      <PageHeader title="Despesas" description="Gastos registrados no caixa aberto." />
      {add.error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{add.error}</AlertDescription>
        </Alert>
      )}
      <div className="mb-4 sm:max-w-xs">
        <Select
          value={filterCategory}
          onChange={(event) => {
            setFilterCategory(event.target.value)
            setPage(1)
          }}
        >
          <option value="">Todas as categorias</option>
          {expenseCategories.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>
      <Card className="mb-5">
        <CardHeader>
          <CardTitle>Nova despesa</CardTitle>
        </CardHeader>
        <form
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault()
            void add.run()
          }}
        >
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Field label="Descrição">
              <Input value={description} required onChange={(event) => setDescription(event.target.value)} />
            </Field>
            <Field label="Valor (R$)">
              <Input
                type="number"
                min={0.01}
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(Number(event.target.value))}
                required
              />
            </Field>
            <Field label="Pagamento">
              <Select value={method} onChange={(event) => setMethod(event.target.value as PaymentMethod)}>
                {paymentMethods.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Categoria">
              <Select value={category} onChange={(event) => setCategory(event.target.value as ExpenseCategory)}>
                {expenseCategories.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>
          </CardContent>
          <CardContent>
            <Button type="submit" disabled={add.busy}>
              Registrar despesa
            </Button>
          </CardContent>
        </form>
      </Card>
      <StatePanel loading={loading} error={error} empty={!pageItems.length}>
        <div className="hidden overflow-x-auto rounded-lg border md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Forma de pagamento</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>{shortDate(expense.registered_at)}</TableCell>
                  <TableCell className="font-medium">{expense.description}</TableCell>
                  <TableCell>{expense.category}</TableCell>
                  <TableCell>{paymentLabel[expense.payment_method]}</TableCell>
                  <TableCell className="text-right font-semibold">{money(expense.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex flex-col gap-2 md:hidden">
          {pageItems.map((expense) => (
            <Card key={expense.id} size="sm">
              <CardContent className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium">{expense.description}</p>
                  <p className="text-sm text-muted-foreground">
                    {shortDate(expense.registered_at)} · {expense.category} ·{' '}
                    {paymentLabel[expense.payment_method]}
                  </p>
                </div>
                <span className="font-semibold">{money(expense.amount)}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </StatePanel>
      <Pagination page={page} total={data?.length ?? 0} limit={limit} onPageChange={setPage} />
    </>
  )
}
