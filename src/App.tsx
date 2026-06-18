import { Refine, Authenticated } from '@refinedev/core';
import { ThemedLayoutV2, useNotificationProvider } from '@refinedev/antd';
import routerBindings from '@refinedev/react-router-v6';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { dataProvider } from './providers/data-provider';
import { authProvider } from './providers/auth-provider';
import { i18nProvider } from './i18n';
import { Logo } from './components/logo';
import { DashboardPage } from './pages/dashboard';
import { LoginPage } from './pages/login';

function App() {
  return (
    <BrowserRouter>
      <Refine
        dataProvider={dataProvider}
        authProvider={authProvider}
        routerProvider={routerBindings}
        notificationProvider={useNotificationProvider}
        i18nProvider={i18nProvider}
        resources={[
          { name: 'dashboard', list: '/' },
          { name: 'items', list: '/items' },
          { name: 'orders', list: '/orders' },
          { name: 'price-table', list: '/price-table' },
          { name: 'cash-register', list: '/cash-register' },
          { name: 'expenses', list: '/expenses' },
        ]}
      >
        <Routes>
          <Route
            element={
              <Authenticated key="authenticated" redirectOnFail="/login">
                <ThemedLayoutV2 Title={Logo}>
                  <Outlet />
                </ThemedLayoutV2>
              </Authenticated>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="*" element={<DashboardPage />} />
          </Route>
          <Route
            path="/login"
            element={
              <Authenticated key="auth" fallback={<LoginPage />}>
                <Navigate to="/" />
              </Authenticated>
            }
          />
        </Routes>
      </Refine>
    </BrowserRouter>
  );
}

export default App;
