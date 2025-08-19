import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import AdminDashboard from "@/pages/admin-dashboard";
import EmployeeDashboard from "@/pages/employee-dashboard";
import EmployeeList from "@/pages/employees/employee-list";
import AddEmployee from "@/pages/employees/add-employee";
import EditEmployee from "@/pages/employees/edit-employee";
import PayrollList from "@/pages/payroll/payroll-list";
import AddPayroll from "@/pages/payroll/add-payroll";
import EditPayroll from "@/pages/payroll/edit-payroll";
import LeaveRequests from "@/pages/leaves/leave-requests";
import ApplyLeave from "@/pages/leaves/apply-leave";
import Profile from "@/pages/profile";
import Reports from "@/pages/reports";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={HomePage} />
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
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
