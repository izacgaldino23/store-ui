import { useRegister } from '@refinedev/core';
import { Card, Form, Input, Button, Typography, Layout, Space, theme } from 'antd';
import { Link } from 'react-router-dom';

const { Text, Title } = Typography;
const { Content } = Layout;

interface RegisterFormValues {
  username: string;
  email: string;
  password: string;
}

export const RegisterPage = () => {
  const { mutate: register, isLoading } = useRegister<RegisterFormValues>();
  const { token } = theme.useToken();

  const onFinish = (values: RegisterFormValues) => {
    register(values);
  };

  return (
    <Layout
      style={{
        minHeight: '100vh',
        background: token.colorBgContainer,
      }}
    >
      <Content
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 16,
        }}
      >
        <Card
          title={
            <Title level={3} style={{ textAlign: 'center', margin: 0 }}>
              Criar conta
            </Title>
          }
          headStyle={{ borderBottom: 0, paddingTop: 24 }}
          style={{
            width: 400,
            maxWidth: '100%',
            border: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <Form<RegisterFormValues>
            layout="vertical"
            onFinish={onFinish}
            requiredMark={false}
            initialValues={{ username: '', email: '', password: '' }}
          >
            <Form.Item
              name="username"
              label="Usuário"
              rules={[
                { required: true, message: 'Usuário é obrigatório' },
                { min: 3, message: 'Usuário deve ter no mínimo 3 caracteres' },
              ]}
            >
              <Input size="large" placeholder="Usuário" />
            </Form.Item>

            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Email é obrigatório' },
                { type: 'email', message: 'Email inválido' },
              ]}
            >
              <Input size="large" placeholder="Email" />
            </Form.Item>

            <Form.Item
              name="password"
              label="Senha"
              rules={[
                { required: true, message: 'Senha é obrigatória' },
                { min: 6, message: 'Senha deve ter no mínimo 6 caracteres' },
              ]}
            >
              <Input.Password size="large" placeholder="●●●●●●●●" />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                size="large"
                htmlType="submit"
                loading={isLoading}
                block
              >
                Cadastrar
              </Button>
            </Form.Item>
          </Form>

          <Space
            direction="vertical"
            style={{ width: '100%', marginTop: 24, textAlign: 'center' }}
          >
            <Text style={{ fontSize: 12 }}>
              Já tem conta?{' '}
              <Link to="/login" style={{ fontWeight: 'bold' }}>
                Entrar
              </Link>
            </Text>
          </Space>
        </Card>
      </Content>
    </Layout>
  );
};
