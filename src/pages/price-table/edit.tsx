import { useForm } from '@refinedev/antd';
import { Form, Input, InputNumber, Button, Card, Typography, Space } from 'antd';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

const { Title } = Typography;

export const PriceTableEditPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const { formProps, saveButtonProps } = useForm({
    resource: 'price-table',
    id,
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
      <Title level={4}>Editar Entrada na Tabela de Preços</Title>
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
            <Form.Item label="Quantidade Mínima" name="min_quantity" style={{ width: 200 }}>
              <InputNumber min={0} style={{ width: '100%' }} placeholder="0 = qualquer" />
            </Form.Item>
            <Form.Item label="Quantidade Máxima" name="max_quantity" style={{ width: 200 }}>
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
