import { AuthPage } from '@refinedev/antd';

export const RegisterPage = () => {
  return (
    <AuthPage
      type="register"
      formProps={{
        initialValues: { email: '', password: '' },
      }}
    />
  );
};
