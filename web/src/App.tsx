import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { AppProviders } from '@/components/AppProviders'
import { ProtectedRoute, PublicRoute } from '@/components/ProtectedRoute'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardLayout } from '@/components/DashboardLayout'
import { CrmPage } from '@/pages/CrmPage'
import { CompaniesPage } from '@/pages/CompaniesPage'
import { TasksPage } from '@/pages/TasksPage'
import { InvoicesPage } from '@/pages/InvoicesPage'
import { ProductsPage } from '@/pages/ProductsPage'
import { IntakePage } from '@/pages/IntakePage'
import { HrPage } from '@/pages/HrPage'
import { HrSubmissionPage } from '@/pages/HrSubmissionPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { HelpPage } from '@/pages/HelpPage'

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
            element={<Navigate to="/login" replace />}
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
            <Route path="crm/contacts" element={<CrmPage />} />
            <Route path="crm/contacts/:id" element={<CrmPage />} />
            <Route path="crm/deals" element={<CrmPage />} />
            <Route path="crm/deals/:id" element={<CrmPage />} />
            <Route path="companies" element={<CompaniesPage />} />
            <Route path="companies/:id" element={<CompaniesPage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="invoices" element={<InvoicesPage />} />
            <Route path="invoices/:id" element={<InvoicesPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="intake" element={<IntakePage />} />
            <Route path="hr" element={<HrPage />} />
            <Route path="hr/:id" element={<HrSubmissionPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="help" element={<HelpPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProviders>
  )
}
