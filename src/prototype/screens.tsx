import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Package,
  Plus,
  Printer,
  ShoppingCart,
  Wallet,
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import {
  money,
  orders,
  paymentLabel,
  paymentMethods,
  printServices,
  products,
  statusLabel,
  type OrderStatus,
  type PaymentMethod,
} from './data'

function PageHeader({
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

function StatusBadge({ status }: { status: OrderStatus }) {
  const variant =
    status === 'entregue' ? 'default' : status === 'pendente' ? 'secondary' : 'outline'
  return <Badge variant={variant}>{statusLabel[status]}</Badge>
}

function PaymentDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (method: PaymentMethod) => void
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
              {option.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => onConfirm(method)}>Confirmar pagamento</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function DashboardScreen() {
  return (
    <>
      <PageHeader
        title="Visão geral"
        description="Um resumo rápido do dia."
        action={
          <Link to="/orders/create" className={cn(buttonVariants({ size: 'lg' }))}>
            <Plus data-icon="inline-start" />
            Novo pedido
          </Link>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Pedidos hoje', value: '12', icon: ShoppingCart },
          { label: 'Aguardando', value: '3', icon: ClipboardList },
          { label: 'Faturamento', value: 'R$ 1.284,50', icon: Wallet },
          { label: 'Estoque baixo', value: '4 itens', icon: Package },
        ].map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.label} size="sm">
              <CardHeader>
                <CardDescription>{card.label}</CardDescription>
                <CardTitle className="text-2xl">{card.value}</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <Icon />
              </CardContent>
            </Card>
          )
        })}
      </div>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Atalhos</CardTitle>
          <CardDescription>O que você mais usa no dia a dia.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Link
            to="/orders"
            className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'justify-start')}
          >
            <ShoppingCart data-icon="inline-start" />
            Ver pedidos
          </Link>
          <Link
            to="/items"
            className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'justify-start')}
          >
            <Package data-icon="inline-start" />
            Consultar itens
          </Link>
        </CardContent>
      </Card>
    </>
  )
}

export function OrdersScreen() {
  return (
    <>
      <PageHeader
        title="Pedidos"
        description="Acompanhe e finalize os pedidos."
        action={
          <Link to="/orders/create" className={cn(buttonVariants({ size: 'lg' }))}>
            <Plus data-icon="inline-start" />
            Novo pedido
          </Link>
        }
      />
      <div className="flex flex-col gap-3">
        {orders.map((order) => (
          <Link key={order.id} to={`/orders/${order.id}`}>
            <Card size="sm" className="transition-colors hover:bg-muted/50">
              <CardContent className="flex items-center gap-4 py-4">
                <div className="flex-1">
                  <p className="text-base font-medium">{order.number}</p>
                  <p className="text-sm text-muted-foreground">
                    {order.customer} · {order.products} produtos · {order.prints} impressões
                  </p>
                </div>
                <StatusBadge status={order.status} />
                <p className="w-24 text-right font-semibold">{money(order.total)}</p>
                <ChevronRight className="text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </>
  )
}

export function NewOrderScreen() {
  const navigate = useNavigate()
  const [paymentOpen, setPaymentOpen] = useState(false)

  return (
    <>
      <PageHeader title="Novo pedido" description="Monte a venda por produtos ou impressões." />
      <div className="pb-40 md:pb-0">
      <Tabs defaultValue="produtos">
        <TabsList className="h-12 w-full">
          <TabsTrigger value="produtos" className="h-10 text-base">
            Produtos
            <Badge variant="secondary">{products.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="impressoes" className="h-10 text-base">
            Impressões
            <Badge variant="secondary">{printServices.length}</Badge>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="produtos">
          <div className="grid gap-3 pt-4 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <Card key={product.id} size="sm">
                <CardHeader>
                  <CardTitle className="text-base">{product.name}</CardTitle>
                  <CardDescription>
                    {product.code} · {product.stock} em estoque
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-lg font-semibold">{money(product.price)}</CardContent>
                <CardFooter>
                  <Button className="h-11 w-full text-base">
                    <Plus data-icon="inline-start" />
                    Adicionar
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="impressoes">
          <div className="grid gap-3 pt-4 sm:grid-cols-2 xl:grid-cols-3">
            {printServices.map((service) => (
              <Card key={service.id} size="sm">
                <CardHeader>
                  <CardTitle className="text-base">{service.name}</CardTitle>
                  <CardDescription>{service.code}</CardDescription>
                </CardHeader>
                <CardContent className="text-lg font-semibold">
                  {money(service.price)} <span className="text-sm font-normal">/ folha</span>
                </CardContent>
                <CardFooter>
                  <Button className="h-11 w-full text-base">
                    <Printer data-icon="inline-start" />
                    Adicionar
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
      </div>

      <div className="fixed inset-x-0 bottom-14 z-30 flex items-center justify-between gap-4 border-t bg-background px-4 py-3 shadow-lg md:bottom-0 md:left-60">
        <div>
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-2xl font-semibold">{money(87.9)}</p>
        </div>
        <Button size="lg" className="h-12 px-6 text-base" onClick={() => setPaymentOpen(true)}>
          Finalizar
        </Button>
      </div>

      <PaymentDialog
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        onConfirm={(method) => {
          setPaymentOpen(false)
          navigate(`/orders/1?finalizado=1&pagamento=${method}`)
        }}
      />
    </>
  )
}

export function OrderDetailScreen() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [finalized, setFinalized] = useState(searchParams.get('finalizado') === '1')
  const order = orders.find((item) => item.id === id) ?? orders[0]
  const method = searchParams.get('pagamento') as PaymentMethod | null
  const isPaid = finalized || order.status === 'entregue'

  return (
    <>
      <Button variant="ghost" onClick={() => navigate('/orders')} className="mb-3">
        <ArrowLeft data-icon="inline-start" />
        Pedidos
      </Button>
      <PageHeader
        title={order.number}
        description={`${order.customer} · ${order.products} produtos · ${order.prints} impressões`}
        action={<StatusBadge status={isPaid ? 'entregue' : order.status} />}
      />

      {isPaid && (
        <Alert className="mb-4">
          <CheckCircle2 />
          <AlertTitle>Pedido finalizado</AlertTitle>
          <AlertDescription>
            Pagamento registrado em {method ? paymentLabel[method] : 'Pix'} e status alterado para
            Entregue.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Resumo</CardTitle>
          <CardDescription>Itens e serviços deste pedido.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex justify-between">
            <span>Produtos ({order.products})</span>
            <span>{money(order.total * 0.7)}</span>
          </div>
          <div className="flex justify-between">
            <span>Impressões ({order.prints})</span>
            <span>{money(order.total * 0.3)}</span>
          </div>
          <div className="flex justify-between text-lg font-semibold">
            <span>Total</span>
            <span>{money(order.total)}</span>
          </div>
        </CardContent>
        {!isPaid && order.status === 'rascunho' && (
          <CardFooter>
            <Button
              size="lg"
              className="h-12 w-full text-base"
              onClick={() => setPaymentOpen(true)}
            >
              Finalizar pedido
            </Button>
          </CardFooter>
        )}
      </Card>

      <PaymentDialog
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        onConfirm={(paymentMethod) => {
          setPaymentOpen(false)
          setFinalized(true)
          navigate(`/orders/${order.id}?finalizado=1&pagamento=${paymentMethod}`, {
            replace: true,
          })
        }}
      />
    </>
  )
}

export function ItemsScreen() {
  return (
    <>
      <PageHeader title="Itens" description="Produtos e insumos cadastrados." />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => (
          <Card key={product.id} size="sm">
            <CardHeader>
              <CardTitle className="text-base">{product.name}</CardTitle>
              <CardDescription>{product.code}</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-between">
              <span className="font-semibold">{money(product.price)}</span>
              <Badge variant="secondary">{product.stock} em estoque</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  )
}

function AuthScreen({ mode }: { mode: 'login' | 'register' }) {
  const navigate = useNavigate()
  const isLogin = mode === 'login'

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    navigate('/')
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">
            {isLogin ? 'Entrar' : 'Criar conta'}
          </CardTitle>
          <CardDescription>
            {isLogin ? 'Acesse o PDV da Miau Store.' : 'Cadastre-se para usar o PDV.'}
          </CardDescription>
        </CardHeader>
        <form onSubmit={submit}>
          <CardContent>
            <FieldGroup>
              {!isLogin && (
                <Field>
                  <FieldLabel htmlFor="name">Nome</FieldLabel>
                  <Input id="name" autoComplete="name" placeholder="Seu nome" />
                </Field>
              )}
              <Field>
                <FieldLabel htmlFor="email">E-mail</FieldLabel>
                <Input id="email" type="email" autoComplete="email" placeholder="voz@exemplo.com" />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Senha</FieldLabel>
                <Input id="password" type="password" autoComplete="current-password" />
              </Field>
            </FieldGroup>
          </CardContent>
          <CardFooter className="flex-col gap-3">
            <Button type="submit" size="lg" className="h-12 w-full text-base">
              {isLogin ? 'Entrar' : 'Cadastrar'}
            </Button>
            <Link
              to={isLogin ? '/register' : '/login'}
              className="text-sm text-muted-foreground underline underline-offset-4"
            >
              {isLogin ? 'Quero criar uma conta' : 'Já tenho conta'}
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

export function LoginScreen() {
  return <AuthScreen mode="login" />
}

export function RegisterScreen() {
  return <AuthScreen mode="register" />
}

export function PlaceholderScreen({ title }: { title: string }) {
  return (
    <>
      <PageHeader title={title} description="Tela do protótipo M-003." />
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            Esta rota já faz parte da navegação. O conteúdo será migrado na próxima etapa.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          Dados de demonstração · shadcn/ui
        </CardContent>
      </Card>
    </>
  )
}
