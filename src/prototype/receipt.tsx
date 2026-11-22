import { useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import { Download, Printer } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { money, shortDate } from './constants'
import type { Order } from './types'

export function ReceiptDialog({
  order,
  open,
  onOpenChange,
}: {
  order: Order
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const receiptRef = useRef<HTMLDivElement>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const download = async () => {
    if (!receiptRef.current) return
    setSaving(true)
    setError('')
    try {
      const dataUrl = await toPng(receiptRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: '#ffffff',
      })
      const link = document.createElement('a')
      link.download = `recibo-${order.id.slice(0, 8)}.png`
      link.href = dataUrl
      link.click()
    } catch {
      setError('Não foi possível gerar a imagem do recibo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Recibo</DialogTitle>
          <DialogDescription>Pedido {order.id.slice(0, 8)}</DialogDescription>
        </DialogHeader>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div ref={receiptRef}>
          <ReceiptDocument order={order} />
        </div>
        <DialogFooter className="grid grid-cols-1 sm:flex sm:justify-end">
          <Button variant="outline" className="w-full sm:w-auto" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => window.print()}
          >
            <Printer data-icon="inline-start" />
            Imprimir
          </Button>
          <Button className="w-full sm:w-auto" disabled={saving} onClick={() => void download()}>
            <Download data-icon="inline-start" />
            {saving ? 'Gerando...' : 'Baixar imagem'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ReceiptDocument({ order }: { order: Order }) {
  return (
    <div className="receipt-print-area mx-auto w-[302px] bg-white p-4 font-mono text-[13px] leading-[1.5] text-black">
      <div className="text-center text-base font-bold uppercase tracking-wider">
        Miau Gráfica e Papelaria
      </div>
      <div className="mt-1 text-center">{shortDate(order.created_at)}</div>
      {order.client_name && <div className="text-center">{order.client_name}</div>}
      <hr className="my-2 border-0 border-t border-dashed border-black" />
      {order.items.map((item) => (
        <div key={item.id} className="mb-1.5 break-inside-avoid">
          <div>{item.item_name}</div>
          <div className="flex justify-between gap-2">
            <span>
              {item.quantity} x {money(item.unit_price)}
            </span>
            <span>{money(item.total_price)}</span>
          </div>
        </div>
      ))}
      {order.prints.length > 0 && <hr className="my-2 border-0 border-t border-dashed border-black" />}
      {order.prints.map((print) => {
        const flatFees = print.addons
          .filter((addon) => addon.price_type === 'per_print')
          .reduce((sum, addon) => sum + addon.price_value, 0)
        return (
          <div key={print.id} className="mb-1.5 break-inside-avoid">
            <div>Impressão: {print.paper_name}</div>
            {print.description && <div className="text-[11px]">{print.description}</div>}
            {print.addons.length > 0 && (
              <div className="text-[11px]">{print.addons.map((addon) => addon.name).join(', ')}</div>
            )}
            <div className="flex justify-between gap-2">
              <span>
                {print.quantity} x {money(print.unit_price)}
                {flatFees > 0 && ` + ${money(flatFees)} por impressão`}
              </span>
              <span>{money(print.total_price)}</span>
            </div>
          </div>
        )
      })}
      <hr className="my-2 border-0 border-t border-dashed border-black" />
      {order.discount_amount > 0 && (
        <>
          <div className="flex justify-between gap-2">
            <span>Subtotal</span>
            <span>{money(order.subtotal_amount)}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span>Desconto</span>
            <span>- {money(order.discount_amount)}</span>
          </div>
        </>
      )}
      <div className="flex justify-between gap-2 text-[15px] font-bold">
        <span>TOTAL</span>
        <span>{money(order.total_amount)}</span>
      </div>
    </div>
  )
}
