import React from 'react';
import { Card, Col, Row, Typography } from 'antd';
import { ShoppingCartOutlined, AppstoreOutlined, WalletOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useList } from '@refinedev/core';

const { Title } = Typography;

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const { data: lowStockData } = useList({
    resource: 'items/low-stock',
    pagination: { current: 1, pageSize: 5 },
  });

  const lowStockCount = lowStockData?.total ?? 0;

  const shortcuts = [
    {
      title: 'Novo Pedido',
      icon: <ShoppingCartOutlined style={{ fontSize: 32, color: '#722ED1' }} />,
      onClick: () => navigate('/orders/create'),
    },
    {
      title: 'Catálogo',
      icon: <AppstoreOutlined style={{ fontSize: 32, color: '#722ED1' }} />,
      onClick: () => navigate('/items'),
    },
    {
      title: 'Abrir Caixa',
      icon: <WalletOutlined style={{ fontSize: 32, color: '#722ED1' }} />,
      onClick: () => navigate('/cash-register/open'),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={3}>Bem-vinda ao Miau Store</Title>
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {shortcuts.map((shortcut) => (
          <Col xs={24} sm={12} md={8} key={shortcut.title}>
            <Card
              hoverable
              onClick={shortcut.onClick}
              style={{ textAlign: 'center' }}
            >
              <div style={{ marginBottom: 8 }}>{shortcut.icon}</div>
              <Title level={5}>{shortcut.title}</Title>
            </Card>
          </Col>
        ))}
      </Row>
      {lowStockCount > 0 && (
        <Card
          style={{ marginTop: 24 }}
          title="Itens com estoque baixo"
          size="small"
        >
          <p style={{ color: '#faad14' }}>
            {lowStockCount} item(ns) com estoque abaixo do mínimo.
          </p>
        </Card>
      )}
    </div>
  );
};
