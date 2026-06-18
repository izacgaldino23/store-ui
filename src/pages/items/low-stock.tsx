import { useList } from '@refinedev/core';
import { Table, Tag, Typography } from 'antd';

const { Title } = Typography;

interface IItem {
  id: string;
  item_type: string;
  code: string;
  name: string;
  sale_price?: number;
  current_stock?: number;
  min_stock: number;
  unit: string;
}

const typeColors: Record<string, string> = {
  revenda: 'blue',
  insumo: 'orange',
  servico: 'green',
};

function formatCurrency(value?: number | null): string {
  if (value == null) return '-';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export const ItemsLowStockPage = () => {
  const { data, isLoading } = useList<IItem>({
    resource: 'items/low-stock',
    pagination: { current: 1, pageSize: 999 },
  });

  const items = data?.data ?? [];

  return (
    <div style={{ padding: 24 }}>
      <Title level={3}>Itens com Estoque Baixo</Title>
      <Table
        dataSource={items}
        rowKey="id"
        loading={isLoading}
        pagination={false}
      >
        <Table.Column dataIndex="code" title="Código" width={110} />
        <Table.Column dataIndex="name" title="Nome" ellipsis />
        <Table.Column
          dataIndex="item_type"
          title="Tipo"
          width={100}
          render={(type: string) => (
            <Tag color={typeColors[type]}>{type}</Tag>
          )}
        />
        <Table.Column
          dataIndex="current_stock"
          title="Estoque Atual"
          width={120}
          align="right"
          render={(value: number) => (
            <Typography.Text type="danger" strong>
              {value ?? 0}
            </Typography.Text>
          )}
        />
        <Table.Column dataIndex="min_stock" title="Est. Mínimo" width={100} align="right" />
        <Table.Column
          dataIndex="unit"
          title="Unidade"
          width={90}
        />
        <Table.Column
          dataIndex="sale_price"
          title="Preço de Venda"
          width={130}
          align="right"
          render={(value: number | null) => formatCurrency(value)}
        />
      </Table>
    </div>
  );
};
