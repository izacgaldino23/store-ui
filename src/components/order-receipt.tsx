import type { CSSProperties } from 'react';
import type { IOrder } from '../pages/orders/types';
import { formatCurrency, formatDate } from '../pages/orders/constants';

const containerStyle: CSSProperties = {
  width: 320,
  margin: '0 auto',
  background: '#fff',
  color: '#000',
  fontFamily: "'Courier New', Courier, monospace",
  fontSize: 13,
  lineHeight: 1.5,
  padding: 16,
  boxSizing: 'border-box',
};

const storeNameStyle: CSSProperties = {
  textAlign: 'center',
  fontWeight: 700,
  fontSize: 16,
  textTransform: 'uppercase',
  letterSpacing: 1,
};

const centeredStyle: CSSProperties = {
  textAlign: 'center',
};

const dividerStyle: CSSProperties = {
  border: 0,
  borderTop: '1px dashed #000',
  margin: '10px 0',
};

interface OrderReceiptProps {
  order: IOrder;
}

export const OrderReceipt = ({ order }: OrderReceiptProps) => {
  return (
    <div className="order-receipt-print-area" style={containerStyle}>
      <div style={storeNameStyle}>Miau Gráfica e Papelaria</div>
      <div style={{ ...centeredStyle, marginTop: 6 }}>{formatDate(order.created_at)}</div>
      {order.customer_name && (
        <div style={{ ...centeredStyle, marginTop: 2 }}>{order.customer_name}</div>
      )}
      <hr style={dividerStyle} />
      {order.items.map((item) => (
        <div key={item.id} style={{ marginBottom: 6, breakInside: 'avoid' }}>
          <div>{item.item_name}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>
              {item.quantity} x {formatCurrency(item.unit_price)}
            </span>
            <span>{formatCurrency(item.total_price)}</span>
          </div>
        </div>
      ))}
      {(order.prints?.length || 0) > 0 && <hr style={dividerStyle} />}
      {(order.prints || []).map((print) => (
        <div key={print.id} style={{ marginBottom: 6, breakInside: 'avoid' }}>
          <div>Impressão: {print.paper_name}</div>
          {print.addons.length > 0 && (
            <div style={{ fontSize: 11 }}>{print.addons.map((a) => a.name).join(', ')}</div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>
              {print.quantity} x {formatCurrency(print.unit_price)}
            </span>
            <span>{formatCurrency(print.total_price)}</span>
          </div>
        </div>
      ))}
      <hr style={dividerStyle} />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontWeight: 700,
          fontSize: 15,
        }}
      >
        <span>TOTAL</span>
        <span>{formatCurrency(order.total_amount)}</span>
      </div>
    </div>
  );
};
