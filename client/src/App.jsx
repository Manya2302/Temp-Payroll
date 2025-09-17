/**
 * 🔹 Frontend (React) - Main App Component
 * MERN Concepts Used:
 * ✅ Components - Main App component structure
 * ✅ React Router (Routes, Dynamic Params) - Navigation between pages
 * ✅ Context API (for auth state) - AuthProvider for authentication
 * ✅ Conditional Rendering - Protected routes based on auth state
 * ✅ Styling (CSS / Tailwind / Bootstrap) - UI styling with components
 */
import { ProtectedRoute } from './lib/protected-route';
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "@/components/layout/error-boundary";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
// Removed duplicate and incorrect import
import NotFound from "@/pages/not-found.jsx";
import HomePage from "@/pages/home-page";
import LoginPage from "@/pages/login.jsx";
import RegisterPage from "@/pages/register.jsx";
import AdminDashboard from "@/pages/admin-dashboard.jsx";
import EmployeeDashboard from "@/pages/employee-dashboard.jsx";
import EmployeeList from "@/pages/employees/employee-list.jsx";
import AddEmployee from "@/pages/employees/add-employee.jsx";
import EditEmployee from "@/pages/employees/edit-employee.jsx";
import PayrollList from "@/pages/payroll/payroll-list.jsx";
import AddPayroll from "@/pages/payroll/add-payroll.jsx";
import EditPayroll from "@/pages/payroll/edit-payroll.jsx";
import LeaveRequests from "@/pages/leaves/leave-requests.jsx";
import ApplyLeave from "@/pages/leaves/apply-leave.jsx";
import AttendanceRoute from "@/pages/AttendanceRoute.jsx";
import Profile from "@/pages/profile.jsx";
import Reports from "@/pages/reports.jsx";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
  <Route path="/login" component={LoginPage} />
  <Route path="/register" component={RegisterPage} />
      <ProtectedRoute path="/admin" component={AdminDashboard} />
      <ProtectedRoute path="/employee" component={EmployeeDashboard} />
      <ProtectedRoute path="/employees" component={EmployeeList} />
      <ProtectedRoute path="/employees/add" component={AddEmployee} />
      <ProtectedRoute path="/employees/edit/:id" component={() => {
        const params = new URLSearchParams(window.location.search);
        const id = window.location.pathname.split('/').pop() || '';
        return <EditEmployee params={{ id }} />;
      }} />
      <ProtectedRoute path="/payroll" component={PayrollList} />
      <ProtectedRoute path="/payroll/add" component={AddPayroll} />
      <ProtectedRoute path="/payroll/edit/:id" component={() => {
        const id = window.location.pathname.split('/').pop() || '';
        return <EditPayroll params={{ id }} />;
      }} />
      <ProtectedRoute path="/leaves" component={LeaveRequests} />
      <ProtectedRoute path="/leaves/apply" component={ApplyLeave} />
  <ProtectedRoute path="/attendance" component={AttendanceRoute} />
      <ProtectedRoute path="/profile" component={Profile} />
      <ProtectedRoute path="/reports" component={Reports} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <ErrorBoundary>
            <Toaster />
            <Router />
          </ErrorBoundary>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;