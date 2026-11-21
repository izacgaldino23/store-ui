import { useState, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, ChevronDown, Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import { paymentLabel, paymentMethods, statusLabel } from './constants'
import type { OrderStatus, PaymentMethod } from './types'

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  const variants = {
    entregue: 'default',
    pronto: 'default',
    em_producao: 'secondary',
    pendente: 'secondary',
    rascunho: 'outline',
    cancelado: 'destructive',
  } as const
  return <Badge variant={variants[status]}>{statusLabel[status]}</Badge>
}

export function LinkButton({
  to,
  children,
  variant = 'default',
  size = 'lg',
}: {
  to: string
  children: ReactNode
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'lg'
}) {
  return (
    <Link to={to} className={cn(buttonVariants({ variant, size }))}>
      {children}
    </Link>
  )
}

export function StatePanel({
  loading,
  error,
  empty,
  children,
}: {
  loading?: boolean
  error?: string
  empty?: boolean
  children?: ReactNode
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="animate-spin" />
        Carregando...
      </div>
    )
  }
  if (error) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }
  if (empty) {
    return <p className="py-12 text-center text-muted-foreground">Nenhum registro encontrado.</p>
  }
  return <>{children}</>
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium">
      {label}
      {children}
    </label>
  )
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        'flex min-h-28 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
        props.className,
      )}
    />
  )
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={cn('relative', className)}>
      <select
        {...props}
        className="flex h-11 w-full appearance-none rounded-md border border-input bg-background pl-3 pr-9 text-base shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
      />
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
}

export function MoneyCard({
  label,
  value,
  description,
}: {
  label: string
  value: string
  description?: string
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
      {description && <CardContent className="text-sm text-muted-foreground">{description}</CardContent>}
    </Card>
  )
}

export function Pagination({
  page,
  total,
  limit,
  onPageChange,
}: {
  page: number
  total: number
  limit: number
  onPageChange: (page: number) => void
}) {
  const pages = Math.max(1, Math.ceil(total / limit))
  if (pages <= 1) return null
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">
        Página {page} de {pages} · {total} registros
      </span>
      <div className="flex gap-2">
        <Button variant="outline" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Anterior
        </Button>
        <Button variant="outline" disabled={page >= pages} onClick={() => onPageChange(page + 1)}>
          Próxima
        </Button>
      </div>
    </div>
  )
}

export function PaymentDialog({
  open,
  onOpenChange,
  onConfirm,
  busy,
  error,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (method: PaymentMethod) => void
  busy?: boolean
  error?: string
}) {
  const [method, setMethod] = useState<PaymentMethod>('pix')
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Forma de pagamento</DialogTitle>
          <DialogDescription>
            Escolha como o cliente pagou. O valor é o total do pedido.
          </DialogDescription>
        </DialogHeader>
        <ToggleGroup
          value={[method]}
          onValueChange={(values) => {
            const next = values[0]
            if (next) setMethod(next as PaymentMethod)
          }}
          variant="outline"
          className="grid grid-cols-2 gap-2"
        >
          {paymentMethods.map((option) => (
            <ToggleGroupItem
              key={option.value}
              value={option.value}
              className="h-12 w-full text-base"
            >
              {paymentLabel[option.value]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button disabled={busy} onClick={() => onConfirm(method)}>
            {busy ? 'Finalizando...' : 'Confirmar pagamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Excluir',
  busy,
  error,
  onConfirm,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  busy?: boolean
  error?: string
  onConfirm: () => void
  children?: ReactNode
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {children}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" disabled={busy} onClick={onConfirm}>
            {busy ? 'Aguarde...' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
