import { useState, useEffect, useCallback } from 'react';
import { Card, Button, Typography, Space, Descriptions, Tag, message, Modal, Input, InputNumber, Spin } from 'antd';
import { ArrowLeft, Banknote } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../providers/rest-client';

const { Title, Text } = Typography;

interface ICashRegister {
  id: string;
  opened_at: string;
  closed_at?: string;
  starting_balance: number;
  closing_balance?: number;
  status: string;
  notes?: string;
  current_balance?: number;
  discrepancy?: number;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDatetime(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

export const CashFlowCurrentPage = () => {
  const navigate = useNavigate();
  const [register, setRegister] = useState<ICashRegister | null>(null);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [closeModal, setCloseModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [openBalance, setOpenBalance] = useState(0);
  const [openNotes, setOpenNotes] = useState('');
  const [closeBalance, setCloseBalance] = useState(0);
  const [closeNotes, setCloseNotes] = useState('');

  const fetchCurrent = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/cash-register/current');
      setRegister(res.data as ICashRegister);
      setCloseBalance((res.data as ICashRegister).current_balance ?? 0);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number } };
      if (axiosErr?.response?.status === 404) {
        setRegister(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrent();
  }, [fetchCurrent]);

  const handleOpen = async () => {
    if (openBalance < 0) {
      message.warning('Saldo inicial não pode ser negativo.');
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post('/cash-register/open', {
        starting_balance: openBalance,
        notes: openNotes || undefined,
      });
      message.success('Caixa aberto com sucesso!');
      setOpenModal(false);
      setOpenBalance(0);
      setOpenNotes('');
      fetchCurrent();
    } catch (err: unknown) {
      const axiosErr = err as { message?: string };
      message.error(axiosErr?.message || 'Erro ao abrir caixa.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (closeBalance < 0) {
      message.warning('Informe o saldo de fechamento.');
      return;
    }
    Modal.confirm({
      title: 'Confirmar fechamento de caixa',
      content: `Tem certeza que deseja fechar o caixa com saldo final de ${formatCurrency(closeBalance)}?`,
      okText: 'Fechar',
      cancelText: 'Cancelar',
      okButtonProps: { danger: true },
      onOk: async () => {
        setSubmitting(true);
        try {
          await apiClient.post('/cash-register/close', {
            closing_balance: closeBalance,
            notes: closeNotes || undefined,
          });
          message.success('Caixa fechado com sucesso!');
          setCloseModal(false);
          setCloseNotes('');
          fetchCurrent();
        } catch (err: unknown) {
          const axiosErr = err as { message?: string };
          message.error(axiosErr?.message || 'Erro ao fechar caixa.');
        } finally {
          setSubmitting(false);
        }
      },
    });
  };

  return (
    <div style={{ padding: 24 }}>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeft size={16} />} onClick={() => navigate('/')}>
          Voltar
        </Button>
      </Space>
      <Title level={4}>Fluxo de Caixa</Title>

      {loading ? (
        <Spin />
      ) : register ? (
        <Card
          title={
            <Space>
              <Banknote size={18} />
              Caixa Aberto
              <Tag color="green">Aberto</Tag>
            </Space>
          }
          extra={
            <Button type="primary" danger onClick={() => setCloseModal(true)}>
              Fechar Caixa
            </Button>
          }
          style={{ maxWidth: 600 }}
        >
          <Descriptions column={2} size="small">
            <Descriptions.Item label="Aberto em">{formatDatetime(register.opened_at)}</Descriptions.Item>
            <Descriptions.Item label="Saldo Inicial">{formatCurrency(register.starting_balance)}</Descriptions.Item>
            <Descriptions.Item label="Saldo Atual" span={2}>
              <Text strong style={{ fontSize: 20, color: '#52c41a' }}>
                {formatCurrency(register.current_balance ?? register.starting_balance)}
              </Text>
            </Descriptions.Item>
            {register.notes && <Descriptions.Item label="Observações" span={2}>{register.notes}</Descriptions.Item>}
          </Descriptions>
        </Card>
      ) : (
        <Card style={{ maxWidth: 600, textAlign: 'center' }}>
          <Banknote size={48} style={{ color: '#d9d9d9', marginBottom: 16 }} />
          <Title level={5}>Nenhum caixa aberto</Title>
          <Text type="secondary">Abra um caixa para começar a registrar vendas e despesas.</Text>
          <br /><br />
          <Button type="primary" size="large" onClick={() => setOpenModal(true)}>
            Abrir Caixa
          </Button>
        </Card>
      )}

      <Modal
        title="Abrir Caixa"
        open={openModal}
        onOk={handleOpen}
        onCancel={() => { setOpenModal(false); setOpenBalance(0); setOpenNotes(''); }}
        confirmLoading={submitting}
        okText="Abrir"
        cancelText="Cancelar"
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text>Saldo Inicial (R$)</Text>
            <InputNumber
              min={0}
              step={0.01}
              prefix="R$"
              style={{ width: '100%' }}
              value={openBalance}
              onChange={(val) => setOpenBalance(val || 0)}
            />
          </div>
          <div>
            <Text>Observações (opcional)</Text>
            <Input.TextArea
              rows={2}
              value={openNotes}
              onChange={(e) => setOpenNotes(e.target.value)}
            />
          </div>
        </Space>
      </Modal>

      <Modal
        title="Fechar Caixa"
        open={closeModal}
        onOk={handleClose}
        onCancel={() => { setCloseModal(false); setCloseNotes(''); }}
        confirmLoading={submitting}
        okText="Fechar"
        cancelText="Cancelar"
        width={500}
      >
        {register && (
          <>
            <Descriptions column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Saldo Inicial">{formatCurrency(register.starting_balance)}</Descriptions.Item>
              <Descriptions.Item label="Saldo Atual">
                <Text strong>{formatCurrency(register.current_balance ?? 0)}</Text>
              </Descriptions.Item>
            </Descriptions>
            <div style={{ marginBottom: 12 }}>
              <Text>Saldo de Fechamento (R$)</Text>
              <InputNumber
                min={0}
                step={0.01}
                prefix="R$"
                style={{ width: '100%' }}
                value={closeBalance}
                onChange={(val) => setCloseBalance(val ?? 0)}
              />
            </div>
            {register.current_balance != null && Math.abs(closeBalance - register.current_balance) > 0.01 && (
              <div style={{ marginBottom: 12 }}>
                <Text type="danger">
                  Discrepância: {formatCurrency(closeBalance - register.current_balance)}
                </Text>
              </div>
            )}
            <div>
              <Text>Observações (opcional)</Text>
              <Input.TextArea
                rows={2}
                value={closeNotes}
                onChange={(e) => setCloseNotes(e.target.value)}
              />
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};
