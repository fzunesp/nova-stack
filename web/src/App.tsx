import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { AppProviders } from '@/components/AppProviders'
import { ProtectedRoute, PublicRoute } from '@/components/ProtectedRoute'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { DashboardLayout } from '@/components/DashboardLayout'
import { CrmPage } from '@/pages/CrmPage'
import { TasksPage } from '@/pages/TasksPage'
import { InvoicesPage } from '@/pages/InvoicesPage'
import { IntakePage } from '@/pages/IntakePage'
import { SettingsPage } from '@/pages/SettingsPage'
import { DashboardPage } from '@/pages/DashboardPage'

export function AppRouter() {
  return (
    <AppProviders>
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Navigate to="/dashboard" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="crm" element={<CrmPage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="invoices" element={<InvoicesPage />} />
            <Route path="intake" element={<IntakePage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProviders>
  )
}
