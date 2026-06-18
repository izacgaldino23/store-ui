import { useForm, Edit } from '@refinedev/antd';
import { Form, Input, Select, InputNumber } from 'antd';

interface IItemEdit {
  name: string;
  item_type: 'revenda' | 'insumo' | 'servico';
  unit: string;
  cost_price: number;
  sale_price?: number;
  min_stock: number;
  bar_code?: string;
  supplier?: string;
  description?: string;
}

export const ItemsEditPage = () => {
  const { formProps, saveButtonProps, formLoading } = useForm<IItemEdit>({
    resource: 'items',
    redirect: 'list',
    action: 'edit',
  });

  return (
    <Edit saveButtonProps={saveButtonProps} isLoading={formLoading}>
      <Form {...formProps} layout="vertical">
        <Form.Item
          name="name"
          label="Nome"
          rules={[{ required: true, message: 'Nome é obrigatório' }]}
        >
          <Input maxLength={255} />
        </Form.Item>

        <Form.Item
          name="item_type"
          label="Tipo"
          rules={[{ required: true, message: 'Tipo é obrigatório' }]}
        >
          <Select
            disabled
            options={[
              { label: 'Revenda', value: 'revenda' },
              { label: 'Insumo', value: 'insumo' },
              { label: 'Serviço', value: 'servico' },
            ]}
          />
        </Form.Item>

        <Form.Item
          name="unit"
          label="Unidade"
          rules={[{ required: true, message: 'Unidade é obrigatória' }]}
        >
          <Input placeholder="ex: un, metros, kg" maxLength={20} />
        </Form.Item>

        <Form.Item name="cost_price" label="Preço de Custo">
          <InputNumber min={0} step={0.01} prefix="R$" style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item name="sale_price" label="Preço de Venda">
          <InputNumber min={0} step={0.01} prefix="R$" style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item name="min_stock" label="Estoque Mínimo">
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item name="bar_code" label="Código de Barras">
          <Input />
        </Form.Item>

        <Form.Item name="supplier" label="Fornecedor">
          <Input />
        </Form.Item>

        <Form.Item name="description" label="Descrição">
          <Input.TextArea rows={4} />
        </Form.Item>
      </Form>
    </Edit>
  );
};
