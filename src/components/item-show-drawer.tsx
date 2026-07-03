import { useOne } from '@refinedev/core';
import { Drawer, Typography, Tag, Descriptions, Spin } from 'antd';
import type { BaseKey } from '@refinedev/core';

const { Text } = Typography;

interface IItem {
  id: string;
  item_type: 'revenda' | 'insumo' | 'servico';
  code: string;
  bar_code?: string;
  name: string;
  description?: string;
  cost_price: number;
  sale_price?: number;
  min_stock: number;
  unit: string;
  supplier?: string;
  active: boolean;
  current_stock?: number;
  created_at: string;
  updated_at: string;
}

const typeLabels: Record<string, string> = {
  revenda: 'Revenda',
  insumo: 'Insumo',
  servico: 'Serviço',
};

function formatCurrency(value?: number | null): string {
  if (value == null) return '-';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(value?: string): string {
  if (!value) return '-';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date(value));
}

interface ItemShowDrawerProps {
  recordId: BaseKey | null;
  open: boolean;
  onClose: () => void;
}

export const ItemShowDrawer = ({ recordId, open, onClose }: ItemShowDrawerProps) => {
  const { data, isLoading } = useOne<IItem>({
    resource: 'items',
    id: recordId ?? '',
    queryOptions: { enabled: open && !!recordId },
  });

  const record = data?.data;

  return (
    <Drawer
      title="Detalhes do Item"
      open={open}
      onClose={onClose}
      width={640}
      destroyOnClose
    >
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <Spin />
        </div>
      ) : record ? (
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="Código">{record.code}</Descriptions.Item>
          <Descriptions.Item label="Nome">{record.name}</Descriptions.Item>
          <Descriptions.Item label="Tipo">
            <Tag>{typeLabels[record.item_type] || record.item_type}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Unidade">{record.unit || '-'}</Descriptions.Item>
          <Descriptions.Item label="Preço de Custo">{formatCurrency(record.cost_price)}</Descriptions.Item>
          <Descriptions.Item label="Preço de Venda">{formatCurrency(record.sale_price)}</Descriptions.Item>
          <Descriptions.Item label="Estoque Atual">
            <Text
              strong
              type={
                record.current_stock != null &&
                record.min_stock != null &&
                record.current_stock <= record.min_stock
                  ? 'danger'
                  : undefined
              }
            >
              {record.current_stock ?? 0}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Estoque Mínimo">{record.min_stock}</Descriptions.Item>
          <Descriptions.Item label="Código de Barras">{record.bar_code || '-'}</Descriptions.Item>
          <Descriptions.Item label="Fornecedor">{record.supplier || '-'}</Descriptions.Item>
          <Descriptions.Item label="Ativo">
            {record.active ? (
              <Tag color="green">Sim</Tag>
            ) : (
              <Tag color="red">Não</Tag>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Criado em">{formatDate(record.created_at)}</Descriptions.Item>
          <Descriptions.Item label="Atualizado em">{formatDate(record.updated_at)}</Descriptions.Item>
          <Descriptions.Item label="Descrição" span={2}>
            {record.description || '-'}
          </Descriptions.Item>
        </Descriptions>
      ) : null}
    </Drawer>
  );
};
