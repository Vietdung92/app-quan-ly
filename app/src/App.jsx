/**
 * Main App Component
 * Path: src/App.jsx
 *
 * Root component with routing
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Pages - Auth
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';

// Pages - Dashboard
import DashboardPage from './pages/DashboardPage';

// Pages - Projects
import ProjectsPage from './pages/projects/ProjectsPage';
import ProjectDetailPage from './pages/projects/ProjectDetailPage';
import ProjectCreatePage from './pages/projects/ProjectCreatePage';
import ProjectEditPage from './pages/projects/ProjectEditPage';

// Pages - Expenses
import ExpensesPage from './pages/expenses/ExpensesPage';
import ExpenseDetailPage from './pages/expenses/ExpenseDetailPage';
import ExpenseCreatePage from './pages/expenses/ExpenseCreatePage';
import ExpenseEditPage from './pages/expenses/ExpenseEditPage';

// Pages - Employees
import EmployeesPage from './pages/employees/EmployeesPage';
import EmployeeDetailPage from './pages/employees/EmployeeDetailPage';
import EmployeeCreatePage from './pages/employees/EmployeeCreatePage';
import EmployeeEditPage from './pages/employees/EmployeeEditPage';

// Pages - Attendance
import AttendancePage from './pages/attendance/AttendancePage';

// Pages - Tasks
import TasksPage from './pages/tasks/TasksPage';
import TaskDetailPage from './pages/tasks/TaskDetailPage';
import TaskCreatePage from './pages/tasks/TaskCreatePage';
import TaskEditPage from './pages/tasks/TaskEditPage';

// Pages - Leaves
import LeavesPage from './pages/leaves/LeavesPage';
import LeaveRequestPage from './pages/leaves/LeaveRequestPage';
import LeaveDetailPage from './pages/leaves/LeaveDetailPage';

// Pages - Advances
import AdvancesPage from './pages/advances/AdvancesPage';
import AdvanceRequestPage from './pages/advances/AdvanceRequestPage';
import AdvanceDetailPage from './pages/advances/AdvanceDetailPage';

// Pages - Payroll
import PayrollPage from './pages/payroll/PayrollPage';
import PayrollDetailPage from './pages/payroll/PayrollDetailPage';
import EmployeePayrollPage from './pages/payroll/EmployeePayrollPage';

// Pages - Funds (Thu Chi Quỹ)
import FundsPage from './pages/funds/FundsPage';
import FundCreatePage from './pages/funds/FundCreatePage';
import FundReportPage from './pages/funds/FundReportPage';

// Pages - Apartments (Quản Lý Căn Hộ)
import ApartmentsPage from './pages/apartments/ApartmentsPage';
import ApartmentDetailPage from './pages/apartments/ApartmentDetailPage';

// Pages - Notifications
import NotificationsPage from './pages/NotificationsPage';

// Pages - Settings
import SettingsPage from './pages/settings/SettingsPage';
import ProfilePage from './pages/settings/ProfilePage';

// Context & Auth
import { useAuthStore } from './stores/authStore';
import ProtectedRoute from './components/auth/ProtectedRoute';

export default function App() {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <Router>
      <Toaster position="top-right" reverseOrder={false} />

      <Routes>
        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Route>

        {/* Main Routes */}
        <Route element={<MainLayout />}>
          {/* Dashboard */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Projects */}
          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <ProjectsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/new"
            element={
              <ProtectedRoute>
                <ProjectCreatePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:id"
            element={
              <ProtectedRoute>
                <ProjectDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:id/edit"
            element={
              <ProtectedRoute requiredRole={['QL', 'VP']}>
                <ProjectEditPage />
              </ProtectedRoute>
            }
          />

          {/* Expenses */}
          <Route
            path="/expenses"
            element={
              <ProtectedRoute>
                <ExpensesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/expenses/new"
            element={
              <ProtectedRoute>
                <ExpenseCreatePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/expenses/:id"
            element={
              <ProtectedRoute>
                <ExpenseDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/expenses/:id/edit"
            element={
              <ProtectedRoute>
                <ExpenseEditPage />
              </ProtectedRoute>
            }
          />

          {/* Employees */}
          <Route
            path="/employees"
            element={
              <ProtectedRoute requiredRole={['QL', 'VP']}>
                <EmployeesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employees/new"
            element={
              <ProtectedRoute requiredRole={['QL']}>
                <EmployeeCreatePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employees/:id"
            element={
              <ProtectedRoute requiredRole={['QL', 'VP']}>
                <EmployeeDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employees/:id/edit"
            element={
              <ProtectedRoute requiredRole={['QL']}>
                <EmployeeEditPage />
              </ProtectedRoute>
            }
          />

          {/* Attendance */}
          <Route
            path="/attendance"
            element={
              <ProtectedRoute requiredRole={['QL', 'VP']}>
                <AttendancePage />
              </ProtectedRoute>
            }
          />

          {/* Tasks */}
          <Route
            path="/tasks"
            element={
              <ProtectedRoute>
                <TasksPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tasks/new"
            element={
              <ProtectedRoute requiredRole={['QL', 'VP']}>
                <TaskCreatePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tasks/:id"
            element={
              <ProtectedRoute>
                <TaskDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tasks/:id/edit"
            element={
              <ProtectedRoute requiredRole={['QL', 'VP']}>
                <TaskEditPage />
              </ProtectedRoute>
            }
          />

          {/* Leaves */}
          <Route
            path="/leaves"
            element={
              <ProtectedRoute>
                <LeavesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leaves/request"
            element={
              <ProtectedRoute>
                <LeaveRequestPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leaves/:id"
            element={
              <ProtectedRoute>
                <LeaveDetailPage />
              </ProtectedRoute>
            }
          />

          {/* Advances */}
          <Route
            path="/advances"
            element={
              <ProtectedRoute>
                <AdvancesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/advances/request"
            element={
              <ProtectedRoute>
                <AdvanceRequestPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/advances/:id"
            element={
              <ProtectedRoute>
                <AdvanceDetailPage />
              </ProtectedRoute>
            }
          />

          {/* Payroll */}
          <Route
            path="/payroll"
            element={
              <ProtectedRoute>
                <PayrollPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payroll/employee/:id"
            element={
              <ProtectedRoute requiredRole={['QL', 'VP']}>
                <EmployeePayrollPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payroll/:id"
            element={
              <ProtectedRoute>
                <PayrollDetailPage />
              </ProtectedRoute>
            }
          />

          {/* Apartments - Quản Lý Căn Hộ */}
          <Route
            path="/apartments"
            element={
              <ProtectedRoute>
                <ApartmentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/apartments/:id"
            element={
              <ProtectedRoute>
                <ApartmentDetailPage />
              </ProtectedRoute>
            }
          />

          {/* Funds - Thu Chi Quỹ */}
          <Route
            path="/funds"
            element={
              <ProtectedRoute>
                <FundsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/funds/new"
            element={
              <ProtectedRoute>
                <FundCreatePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/funds/report"
            element={
              <ProtectedRoute requiredRole={['QL', 'VP']}>
                <FundReportPage />
              </ProtectedRoute>
            }
          />

          {/* Notifications */}
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />

          {/* Settings */}
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
