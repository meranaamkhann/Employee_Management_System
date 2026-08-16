import { Routes, Route } from 'react-router-dom'
import LandingPage from '@/pages/landing/LandingPage'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage'
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage'
import DashboardPage from '@/pages/dashboard/DashboardPage'
import EmployeesPage from '@/pages/employees/EmployeesPage'
import DepartmentsPage from '@/pages/departments/DepartmentsPage'
import ProfilePage from '@/pages/profile/ProfilePage'
import SettingsPage from '@/pages/settings/SettingsPage'
import ActivityPage from '@/pages/activity/ActivityPage'
import AccountsPage from '@/pages/accounts/AccountsPage'
import NotFoundPage from '@/pages/errors/NotFoundPage'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import AttendancePage from '@/pages/attendance/AttendancePage'
import LeavePage from '@/pages/leave/LeavePage'
import PayrollPage from '@/pages/payroll/PayrollPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<AppLayout />}>

          <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'HR', 'MANAGER']} />}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="employees" element={<EmployeesPage />} />
          </Route>

          <Route path="departments" element={<DepartmentsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />

          <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'IT_ADMIN']} />}>
            <Route path="activity" element={<ActivityPage />} />
            <Route path="accounts" element={<AccountsPage />} />
          </Route>

          {/* Attendance / Leave / Payroll — open to every authenticated role;
              each page internally shows self-service UI vs. admin UI based
              on the user's role and whether they have a linked employee. */}
          <Route path="attendance" element={<AttendancePage />} />
          <Route path="leave" element={<LeavePage />} />
          <Route path="payroll" element={<PayrollPage />} />

        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}