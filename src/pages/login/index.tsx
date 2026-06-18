import { AuthPage } from '@refinedev/antd';

export const LoginPage = () => {
  return (
    <AuthPage
      type="login"
      formProps={{
        initialValues: { email: '', password: '' },
      }}
    />
  );
};
