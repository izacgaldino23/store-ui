import { useForm } from '@refinedev/antd';
import { Drawer, Form, Input, Select, InputNumber, Button, Space, Row, Col, Spin } from 'antd';
import type { BaseKey } from '@refinedev/core';

interface IItemForm {
  name: string;
  display_name?: string;
  item_type: 'revenda' | 'insumo' | 'servico';
  unit: string;
  cost_price: number;
  sale_price?: number;
  min_stock: number;
  bar_code?: string;
  supplier?: string;
  description?: string;
  units_per_pack?: number;
}

interface ItemFormDrawerProps {
  mode: 'create' | 'edit';
  recordId?: BaseKey | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ItemFormDrawer = ({ mode, recordId, open, onClose, onSuccess }: ItemFormDrawerProps) => {
  const isEdit = mode === 'edit';
  const { formProps, saveButtonProps, formLoading, queryResult } = useForm<IItemForm>({
    resource: 'items',
    action: isEdit ? 'edit' : 'create',
    id: isEdit ? (recordId ?? undefined) : undefined,
    redirect: false,
    onMutationSuccess: () => {
      onClose();
      onSuccess();
    },
  });

  const isLoading = isEdit && (formLoading || queryResult?.isLoading);

  return (
    <Drawer
      title={isEdit ? 'Editar Item' : 'Criar Item'}
      open={open}
      onClose={onClose}
      width={520}
      destroyOnClose
      footer={
        <Space style={{ float: 'right' }}>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="primary" {...saveButtonProps}>
            {isEdit ? 'Salvar' : 'Criar'}
          </Button>
        </Space>
      }
    >
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <Spin />
        </div>
      ) : (
        <Form {...formProps} layout="vertical">
          <Form.Item
            name="name"
            label="Nome"
            rules={[{ required: true, message: 'Nome é obrigatório' }]}
          >
            <Input maxLength={255} />
          </Form.Item>

          <Form.Item name="display_name" label="Nome (normalizado)">
            <Input maxLength={255} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="item_type"
                label="Tipo"
                rules={[{ required: true, message: 'Tipo é obrigatório' }]}
              >
                <Select
                  disabled={isEdit}
                  placeholder={isEdit ? undefined : 'Selecione o tipo'}
                  options={[
                    { label: 'Revenda', value: 'revenda' },
                    { label: 'Insumo', value: 'insumo' },
                    { label: 'Serviço', value: 'servico' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="unit"
                label="Unidade"
                rules={[{ required: true, message: 'Unidade é obrigatória' }]}
              >
                <Input placeholder="ex: un, metros, kg" maxLength={20} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="cost_price" label="Preço de Custo">
                <InputNumber min={0} step={0.01} prefix="R$" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="sale_price" label="Preço de Venda">
                <InputNumber min={0} step={0.01} prefix="R$" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="min_stock" label="Estoque Mínimo">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="units_per_pack" label="Un por Embalagem">
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="bar_code" label="Código de Barras">
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="supplier" label="Fornecedor">
            <Input />
          </Form.Item>

          <Form.Item name="description" label="Descrição">
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      )}
    </Drawer>
  );
};
