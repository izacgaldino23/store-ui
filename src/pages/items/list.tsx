import { useTable, List } from '@refinedev/antd';
import { useDelete, useInvalidate, useList, type CrudFilter } from '@refinedev/core';
import { Table, Space, Tag, Button, Modal, Typography, Select, Input, InputNumber, Form, message } from 'antd';
import apiClient from '../../providers/rest-client';
import { useState } from 'react';
import { Pencil, Eye, Trash2, Boxes } from 'lucide-react';
import { CsvImportModal } from '../../components/csv-import-modal';
import { ItemFormDrawer } from '../../components/item-form-drawer';
import { ItemShowDrawer } from '../../components/item-show-drawer';

const { Text } = Typography;

interface IItem {
  id: string;
  item_type: 'revenda' | 'insumo' | 'servico';
  code: string;
  name: string;
  display_name?: string;
  sale_price?: number;
  current_stock?: number;
  min_stock: number;
  active: boolean;
}

const typeColors: Record<string, string> = {
  revenda: 'blue',
  insumo: 'orange',
  servico: 'green',
};

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

export const ItemsListPage = () => {
  const [tabKey, setTabKey] = useState<string>('all');
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showId, setShowId] = useState<string | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [batchDeleteModalOpen, setBatchDeleteModalOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustStockId, setAdjustStockId] = useState<string | null>(null);
  const [adjustCurrentStock, setAdjustCurrentStock] = useState(0);
  const [adjustQuantity, setAdjustQuantity] = useState<number | null>(null);
  const [adjustReason, setAdjustReason] = useState('');
  const [adjusting, setAdjusting] = useState(false);
  const { mutate: deleteMutate } = useDelete();
  const invalidate = useInvalidate();

  const { tableProps, setFilters, setCurrent } = useTable<IItem>({
    resource: 'items',
    pagination: { current: 1, pageSize: 10, mode: 'server' },
  });

  const { data: lowStockData, isLoading: lowStockLoading } = useList<IItem>({
    resource: 'items/low-stock',
    pagination: { current: 1, pageSize: 999 },
    queryOptions: { enabled: tabKey === 'low-stock' },
  });

  const applyFilters = (search?: string, type?: string) => {
    setCurrent(1);
    const f: CrudFilter[] = [];
    if (search) f.push({ field: 'search', operator: 'contains', value: search });
    if (type) f.push({ field: 'type', operator: 'eq', value: type });
    setFilters(f, 'replace');
  };

  const handleDelete = (record: IItem) => {
    Modal.confirm({
      title: 'Confirmar exclusão',
      content: `Tem certeza que deseja excluir "${record.name}"?`,
      okText: 'Excluir',
      cancelText: 'Cancelar',
      okButtonProps: { danger: true },
      onOk: () => {
        deleteMutate({ resource: 'items', id: record.id });
      },
    });
  };

  const openAdjustModal = (record: IItem) => {
    setAdjustStockId(record.id);
    setAdjustCurrentStock(record.current_stock ?? 0);
    setAdjustQuantity(null);
    setAdjustReason('');
    setAdjustModalOpen(true);
  };

  const handleAdjustStock = async () => {
    if (!adjustStockId || adjustQuantity == null || adjustQuantity === 0) return;
    setAdjusting(true);
    try {
      await apiClient.post(`/catalog/items/${adjustStockId}/adjust-stock`, {
        quantity: adjustQuantity,
        reason: adjustReason || undefined,
      });
      setAdjustModalOpen(false);
      invalidate({ resource: 'items', invalidates: ['list'] });
      message.success('Estoque ajustado com sucesso');
    } catch (err: unknown) {
      const axiosErr = err as { message?: string };
      message.error(axiosErr?.message || 'Erro ao ajustar estoque');
    } finally {
      setAdjusting(false);
    }
  };

  const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) return;
    setBatchDeleteModalOpen(true);
  };

  const confirmBatchDelete = async () => {
    try {
      const count = selectedRowKeys.length;
      await apiClient.delete('/catalog/items/batch', {
        data: { ids: selectedRowKeys },
      });
      setSelectedRowKeys([]);
      setBatchDeleteModalOpen(false);
      invalidate({ resource: 'items', invalidates: ['list'] });
      message.success(`${count} item(ns) excluído(s) com sucesso.`);
    } catch (err: unknown) {
      const axiosErr = err as { message?: string };
      message.error(axiosErr?.message || 'Erro ao excluir um ou mais itens.');
      setBatchDeleteModalOpen(false);
    }
  };

  const [searchText, setSearchText] = useState('');

  const isLowStock = tabKey === 'low-stock';
  const lowStockItems = lowStockData?.data ?? [];

  return (
    <>
      <List
        headerProps={{
          extra: (
            <Space>
              {tabKey === 'all' && selectedRowKeys.length > 0 && (
                <Button danger onClick={handleBatchDelete}>
                  Excluir selecionados ({selectedRowKeys.length})
                </Button>
              )}
              {tabKey === 'all' && (
                <>
                  <Button type="primary" onClick={() => setCreateDrawerOpen(true)}>
                    Criar
                  </Button>
                  <Button onClick={() => setCsvModalOpen(true)}>Importar CSV</Button>
                </>
              )}
            </Space>
          ),
        }}
        title={
          <Space size={0}>
            <Button
              type={tabKey === 'all' ? 'primary' : 'text'}
              size="small"
              onClick={() => setTabKey('all')}
              style={{ borderRadius: '6px 0 0 6px' }}
            >
              Todos
            </Button>
            <Button
              type={tabKey === 'low-stock' ? 'primary' : 'text'}
              size="small"
              onClick={() => setTabKey('low-stock')}
              style={{ borderRadius: '0 6px 6px 0' }}
            >
              Estoque Baixo
            </Button>
          </Space>
        }
      >
        {isLowStock ? (
          <Table
            dataSource={lowStockItems}
            rowKey="id"
            loading={lowStockLoading}
            pagination={false}
            scroll={{ x: 'max-content' }}
          >
            <Table.Column dataIndex="code" title="Código" width={110} />
            <Table.Column
              title="Nome"
              ellipsis
              render={(_, record: IItem) => record.display_name || record.name}
            />
            <Table.Column
              dataIndex="item_type"
              title="Tipo"
              width={110}
              render={(type: string) => (
                <Tag color={typeColors[type] || 'default'}>
                  {typeLabels[type] || type}
                </Tag>
              )}
            />
            <Table.Column
              dataIndex="current_stock"
              title="Estoque Atual"
              width={120}
              align="right"
              render={(value: number | undefined) => (
                <Text type="danger" strong>
                  {value ?? 0}
                </Text>
              )}
            />
            <Table.Column dataIndex="min_stock" title="Est. Mínimo" width={100} align="right" />
            <Table.Column
              dataIndex="sale_price"
              title="Preço de Venda"
              width={130}
              align="right"
              render={(value: number | null) => formatCurrency(value)}
            />
            <Table.Column
              title="Ações"
              key="actions"
              width={180}
              render={(_, record: IItem) => (
                <Space>
                  <Button
                    size="small"
                    type="link"
                    title="Visualizar"
                    onClick={() => setShowId(record.id)}
                  >
                    <Eye size={16} />
                  </Button>
                  {record.item_type !== 'servico' && (
                    <Button
                      size="small"
                      type="link"
                      title="Ajustar Estoque"
                      onClick={() => openAdjustModal(record)}
                    >
                      <Boxes size={16} />
                    </Button>
                  )}
                </Space>
              )}
            />
          </Table>
        ) : (
          <>
            <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
              <Input.Search
                placeholder="Buscar por nome..."
                allowClear
                value={searchText}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchText(val);
                  if (!val) applyFilters(undefined, typeFilter);
                }}
                onSearch={(value) => applyFilters(value || undefined, typeFilter)}
                style={{ width: 250 }}
              />
              <Select
                allowClear
                placeholder="Filtrar por tipo"
                value={typeFilter}
                onChange={(value) => {
                  setTypeFilter(value);
                  applyFilters(searchText, value);
                }}
                style={{ width: 180 }}
                options={[
                  { label: 'Revenda', value: 'revenda' },
                  { label: 'Insumo', value: 'insumo' },
                  { label: 'Serviço', value: 'servico' },
                ]}
              />
            </div>
            <Table
              {...tableProps}
              rowKey="id"
              scroll={{ x: 'max-content' }}
              rowSelection={{
                selectedRowKeys,
                onChange: (keys) => setSelectedRowKeys(keys),
              }}
              pagination={{
                ...tableProps.pagination,
                showSizeChanger: true,
                showTotal: (total) => `Total: ${total} itens`,
              }}
            >
              <Table.Column dataIndex="code" title="Código" width={110} />
              <Table.Column
                title="Nome"
                ellipsis
                render={(_, record: IItem) => record.display_name || record.name}
              />
              <Table.Column
                dataIndex="item_type"
                title="Tipo"
                width={110}
                render={(type: string) => (
                  <Tag color={typeColors[type] || 'default'}>
                    {typeLabels[type] || type}
                  </Tag>
                )}
              />
              <Table.Column
                dataIndex="sale_price"
                title="Preço de Venda"
                width={130}
                align="right"
                render={(value: number | null) => formatCurrency(value)}
              />
              <Table.Column
                dataIndex="current_stock"
                title="Estoque Atual"
                width={120}
                align="right"
                render={(value: number | undefined, record: IItem) => (
                  <Text
                    type={
                      value != null && record.min_stock != null && value <= record.min_stock
                        ? 'danger'
                        : undefined
                    }
                    strong={
                      value != null && record.min_stock != null && value <= record.min_stock
                    }
                  >
                    {value ?? 0}
                  </Text>
                )}
              />
              <Table.Column dataIndex="min_stock" title="Est. Mínimo" width={105} align="right" />
              <Table.Column
                dataIndex="active"
                title="Ativo"
                width={80}
                align="center"
                render={(active: boolean) =>
                  active ? (
                    <Tag color="green">Sim</Tag>
                  ) : (
                    <Tag color="red">Não</Tag>
                  )
                }
              />
              <Table.Column
                title="Ações"
                key="actions"
                width={180}
                render={(_, record: IItem) => (
                  <Space>
                    <Button
                      size="small"
                      type="link"
                      title="Editar"
                      onClick={() => setEditingId(record.id)}
                    >
                      <Pencil size={16} />
                    </Button>
                    <Button
                      size="small"
                      type="link"
                      title="Visualizar"
                      onClick={() => setShowId(record.id)}
                    >
                      <Eye size={16} />
                    </Button>
                    {record.item_type !== 'servico' && (
                      <Button
                        size="small"
                        type="link"
                        title="Ajustar Estoque"
                        onClick={() => openAdjustModal(record)}
                      >
                        <Boxes size={16} />
                      </Button>
                    )}
                    <Button
                      size="small"
                      type="link"
                      danger
                      title="Excluir"
                      onClick={() => handleDelete(record)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </Space>
                )}
              />
            </Table>
          </>
        )}
      </List>
      <ItemFormDrawer
        mode="create"
        open={createDrawerOpen}
        onClose={() => setCreateDrawerOpen(false)}
        onSuccess={() => invalidate({ resource: 'items', invalidates: ['list'] })}
      />
      <ItemFormDrawer
        mode="edit"
        recordId={editingId}
        open={editingId !== null}
        onClose={() => setEditingId(null)}
        onSuccess={() => invalidate({ resource: 'items', invalidates: ['list'] })}
      />
      <ItemShowDrawer
        recordId={showId}
        open={showId !== null}
        onClose={() => setShowId(null)}
      />
      <CsvImportModal
        open={csvModalOpen}
        onClose={() => setCsvModalOpen(false)}
        onSuccess={() => invalidate({ resource: 'items', invalidates: ['list'] })}
      />
      <Modal
        title="Excluir itens selecionados"
        open={batchDeleteModalOpen}
        onOk={confirmBatchDelete}
        onCancel={() => setBatchDeleteModalOpen(false)}
        okText="Excluir"
        cancelText="Cancelar"
        okButtonProps={{ danger: true }}
      >
        <p>Tem certeza que deseja excluir {selectedRowKeys.length} item(ns)?</p>
      </Modal>
      <Modal
        title="Ajustar Estoque"
        open={adjustModalOpen}
        onOk={handleAdjustStock}
        onCancel={() => setAdjustModalOpen(false)}
        okText="Aplicar"
        cancelText="Voltar"
        confirmLoading={adjusting}
        okButtonProps={{ disabled: adjustQuantity == null || adjustQuantity === 0 }}
      >
        <Typography.Paragraph type="secondary">
          Estoque atual: <Text strong>{adjustCurrentStock}</Text>
        </Typography.Paragraph>
        <Form layout="vertical">
          <Form.Item
            label="Quantidade (delta)"
            tooltip="Valor positivo soma ao estoque; negativo subtrai."
            required
          >
            <InputNumber
              autoFocus
              style={{ width: '100%' }}
              placeholder="Ex: -3 ou 10"
              value={adjustQuantity}
              onChange={(value) => setAdjustQuantity(value)}
            />
          </Form.Item>
          <Form.Item label="Motivo (opcional)">
            <Input
              placeholder="Ex: conferência de inventário"
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};
