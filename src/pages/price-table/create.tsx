import { useForm } from '@refinedev/antd';
import { Form, Input, InputNumber, Button, Card, Typography, Space } from 'antd';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

const paperTypeOptions = [
  { value: 'A4', label: 'A4' },
  { value: 'A3', label: 'A3' },
  { value: 'fotografico', label: 'Fotográfico' },
  { value: 'cartao', label: 'Cartão' },
  { value: 'adesivo', label: 'Adesivo' },
  { value: 'outro', label: 'Outro' },
];

export const PriceTableCreatePage = () => {
  const navigate = useNavigate();
  const { formProps, saveButtonProps } = useForm({
    resource: 'price-table',
    redirect: false,
    onMutationSuccess: () => navigate('/pricing/table'),
  });

  return (
    <div style={{ padding: 24 }}>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeft size={16} />} onClick={() => navigate('/pricing/table')}>
          Voltar
        </Button>
      </Space>
      <Title level={4}>Nova Entrada na Tabela de Preços</Title>
      <Card style={{ maxWidth: 600 }}>
        <Form {...formProps} layout="vertical">
          <Form.Item
            label="Tipo de Papel"
            name="paper_type"
            rules={[{ required: true, message: 'Selecione o tipo de papel' }]}
          >
            <Input placeholder="Ex: A4, A3, fotografico" />
          </Form.Item>
          <Space style={{ width: '100%' }} size={16}>
            <Form.Item label="Quantidade Mínima" name="min_quantity" initialValue={0} style={{ width: 200 }}>
              <InputNumber min={0} style={{ width: '100%' }} placeholder="0 = qualquer" />
            </Form.Item>
            <Form.Item label="Quantidade Máxima" name="max_quantity" initialValue={0} style={{ width: 200 }}>
              <InputNumber min={0} style={{ width: '100%' }} placeholder="0 = ilimitado" />
            </Form.Item>
          </Space>
          <Form.Item
            label="Preço Unitário (R$)"
            name="unit_price"
            rules={[{ required: true, message: 'Informe o preço unitário' }]}
          >
            <InputNumber min={0} step={0.01} prefix="R$" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Descrição" name="description">
            <Input.TextArea rows={3} placeholder="Descrição opcional" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" {...saveButtonProps}>
              Salvar
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};
