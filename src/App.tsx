import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './prototype/app-shell'
import { useTheme } from './prototype/hooks'
import { LoginScreen, RegisterScreen } from './prototype/screens/auth'
import { DashboardScreen } from './prototype/screens/dashboard'
import {
  EditOrderScreen,
  NewOrderScreen,
  OrderDetailScreen,
  OrdersScreen,
} from './prototype/screens/orders'
import {
  EditItemScreen,
  ItemDetailScreen,
  ItemsScreen,
  LowStockScreen,
  NewItemScreen,
} from './prototype/screens/items'
import { PrintingScreen } from './prototype/screens/printing'
import { ClientsScreen } from './prototype/screens/clients'
import {
  CashHistoryScreen,
  CurrentCashScreen,
  DailyReportScreen,
  ExpensesScreen,
} from './prototype/screens/cashflow'
import { ReportsScreen } from './prototype/screens/reports'

function RequireAuth({ children }: { children: ReactNode }) {
  if (!localStorage.getItem('access_token')) return <Navigate to="/login" replace />
  return <>{children}</>
}

function App() {
  useTheme()
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/register" element={<RegisterScreen />} />
        <Route
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        >
          <Route index element={<DashboardScreen />} />
          <Route path="orders" element={<OrdersScreen />} />
          <Route path="orders/create" element={<NewOrderScreen />} />
          <Route path="orders/:id/edit" element={<EditOrderScreen />} />
          <Route path="orders/:id" element={<OrderDetailScreen />} />
          <Route path="items" element={<ItemsScreen />} />
          <Route path="items/create" element={<NewItemScreen />} />
          <Route path="items/low-stock" element={<LowStockScreen />} />
          <Route path="items/:id/edit" element={<EditItemScreen />} />
          <Route path="items/:id" element={<ItemDetailScreen />} />
          <Route path="printing" element={<PrintingScreen />} />
          <Route path="clients" element={<ClientsScreen />} />
          <Route path="cash-flow/current" element={<CurrentCashScreen />} />
          <Route path="cash-flow/daily-report" element={<DailyReportScreen />} />
          <Route path="cash-flow/history" element={<CashHistoryScreen />} />
          <Route path="cash-flow/expenses" element={<ExpensesScreen />} />
          <Route path="reports" element={<ReportsScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
