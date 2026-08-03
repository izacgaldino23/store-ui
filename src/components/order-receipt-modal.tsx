import { useRef, useState } from 'react';
import { Modal, Button, message } from 'antd';
import { toPng } from 'html-to-image';
import { Printer, Download } from 'lucide-react';
import { OrderReceipt } from './order-receipt';
import './order-receipt.css';
import type { IOrder } from '../pages/orders/types';

interface OrderReceiptModalProps {
  order: IOrder;
  open: boolean;
  onClose: () => void;
}

export const OrderReceiptModal = ({ order, open, onClose }: OrderReceiptModalProps) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);

  const handleDownload = async () => {
    const node = receiptRef.current;
    if (!node) return;
    setSaving(true);
    try {
      const dataUrl = await toPng(node, { pixelRatio: 2, cacheBust: true });
      const link = document.createElement('a');
      link.download = `recibo-${order.id.slice(0, 8)}.png`;
      link.href = dataUrl;
      link.click();
      message.success('Imagem do recibo baixada com sucesso.');
    } catch {
      message.error('Não foi possível gerar a imagem do recibo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Recibo"
      open={open}
      onCancel={onClose}
      width={360}
      footer={[
        <Button key="close" onClick={onClose}>
          Fechar
        </Button>,
        <Button key="print" icon={<Printer size={16} />} onClick={() => window.print()}>
          Imprimir
        </Button>,
        <Button
          key="download"
          type="primary"
          icon={<Download size={16} />}
          loading={saving}
          onClick={handleDownload}
        >
          Baixar imagem
        </Button>,
      ]}
    >
      <div ref={receiptRef}>
        <OrderReceipt order={order} />
      </div>
    </Modal>
  );
};
