import { useState, useEffect, useCallback } from 'react';
import { Card, Typography, Space, Table, Button, Modal, Input, InputNumber, Select, message, Tag } from 'antd';
import { ArrowLeft, Plus, TrendingDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../providers/rest-client';

const { Title, Text } = Typography;

interface IExpense {
  id: string;
  description: string;
  amount: number;
  payment_method: string;
  category: string;
  registered_at: string;
  created_at: string;
}

const paymentMethodLabels: Record<string, string> = {
  pix: 'Pix',
  dinheiro: 'Dinheiro',
  credito: 'Crédito',
  debito: 'Débito',
};

const categoryLabels: Record<string, string> = {
  suprimentos: 'Suprimentos',
  transporte: 'Transporte',
  alimentacao: 'Alimentação',
  outros: 'Outros',
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export const ExpensesPage = () => {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<IExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('dinheiro');
  const [category, setCategory] = useState<string>('outros');

  const [categoryFilter, setCategoryFilter] = useState<string>('');

  const fetchExpenses = useCallback(async (cat?: string) => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {};
      if (cat) params.category = cat;
      const res = await apiClient.get('/expenses', { params });
      setExpenses(Array.isArray(res.data) ? res.data : []);
    } catch {
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExpenses(categoryFilter);
  }, [fetchExpenses, categoryFilter]);

  const handleCreate = async () => {
    if (!description.trim()) {
      message.warning('Informe a descrição da despesa.');
      return;
    }
    if (amount <= 0) {
      message.warning('Informe o valor da despesa.');
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post('/expenses', {
        description: description.trim(),
        amount,
        payment_method: paymentMethod,
        category,
      });
      message.success('Despesa registrada com sucesso!');
      setCreateModalOpen(false);
      setDescription('');
      setAmount(0);
      setPaymentMethod('dinheiro');
      setCategory('outros');
      fetchExpenses(categoryFilter);
    } catch (err: unknown) {
      const axiosErr = err as { message?: string };
      message.error(axiosErr?.message || 'Erro ao registrar despesa.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeft size={16} />} onClick={() => navigate('/')}>Voltar</Button>
      </Space>
      <Title level={4}>Despesas</Title>

      <Card
        title={
          <Space>
            <TrendingDown size={16} />
            Despesas
          </Space>
        }
        extra={
          <Button type="primary" icon={<Plus size={16} />} onClick={() => setCreateModalOpen(true)}>
            Nova Despesa
          </Button>
        }
      >
        <div style={{ marginBottom: 16 }}>
          <Select
            allowClear
            placeholder="Filtrar por categoria"
            value={categoryFilter || undefined}
            onChange={(val) => setCategoryFilter(val || '')}
            style={{ width: 200 }}
            options={Object.entries(categoryLabels).map(([value, label]) => ({ value, label }))}
          />
        </div>
        <Table
          dataSource={expenses}
          rowKey="id"
          loading={loading}
          scroll={{ x: 'max-content' }}
          pagination={{ pageSize: 10, showTotal: (total) => `Total: ${total} despesa(s)` }}
        >
          <Table.Column dataIndex="description" title="Descrição" ellipsis />
          <Table.Column
            dataIndex="amount"
            title="Valor"
            width={130}
            align="right"
            render={(val: number) => formatCurrency(val)}
          />
          <Table.Column
            dataIndex="category"
            title="Categoria"
            width={130}
            render={(val: string) => <Tag>{categoryLabels[val] || val}</Tag>}
          />
          <Table.Column
            dataIndex="payment_method"
            title="Pagamento"
            width={100}
            render={(val: string) => paymentMethodLabels[val] || val}
          />
          <Table.Column
            dataIndex="registered_at"
            title="Data"
            width={160}
            render={(val: string) => new Intl.DateTimeFormat('pt-BR', {
              dateStyle: 'short',
              timeStyle: 'short',
            }).format(new Date(val))}
          />
        </Table>
      </Card>

      <Modal
        title="Nova Despesa"
        open={createModalOpen}
        onOk={handleCreate}
        onCancel={() => {
          setCreateModalOpen(false);
          setDescription('');
          setAmount(0);
          setPaymentMethod('dinheiro');
          setCategory('outros');
        }}
        confirmLoading={submitting}
        okText="Salvar"
        cancelText="Cancelar"
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text>Descrição</Text>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Material de escritório"
            />
          </div>
          <div>
            <Text>Valor (R$)</Text>
            <InputNumber
              min={0}
              step={0.01}
              prefix="R$"
              style={{ width: '100%' }}
              value={amount}
              onChange={(val) => setAmount(val || 0)}
            />
          </div>
          <div>
            <Text>Método de Pagamento</Text>
            <Select
              style={{ width: '100%' }}
              value={paymentMethod}
              onChange={(val) => setPaymentMethod(val)}
              options={[
                { value: 'pix', label: 'Pix' },
                { value: 'dinheiro', label: 'Dinheiro' },
                { value: 'credito', label: 'Crédito' },
                { value: 'debito', label: 'Débito' },
              ]}
            />
          </div>
          <div>
            <Text>Categoria</Text>
            <Select
              style={{ width: '100%' }}
              value={category}
              onChange={(val) => setCategory(val)}
              options={[
                { value: 'suprimentos', label: 'Suprimentos' },
                { value: 'transporte', label: 'Transporte' },
                { value: 'alimentacao', label: 'Alimentação' },
                { value: 'outros', label: 'Outros' },
              ]}
            />
          </div>
        </Space>
      </Modal>
    </div>
  );
};
