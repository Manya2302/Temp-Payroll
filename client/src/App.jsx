import { ProtectedRoute } from './lib/protected-route';
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "@/components/layout/error-boundary";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found.jsx";
import HomePage from "@/pages/home-page";
import LoginPage from "@/pages/login.jsx";
import ForgotPasswordPage from "@/pages/forgot-password";
import RegisterPage from "@/pages/register.jsx";
import GoogleOtpVerifyPage from "@/pages/google-otp-verify.jsx";
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
import AdminQueries from "./pages/admin-queries";
import QueryAnswer from "./pages/query-answer";
import HelpUs from "@/pages/help-us.jsx";
import EmployeeLoans from "@/pages/loans/employee-loans.jsx";
import AdminLoans from "@/pages/loans/admin-loans.jsx";
import AdminEMIs from "@/pages/admin-emis.jsx";
import AdminCalendar from "@/pages/admin-calendar.jsx";
import EmployeeCalendar from "@/pages/employee-calendar.jsx";
import AdminMeetings from "@/pages/meetings/admin-meetings.jsx";
import EmployeeMeetings from "@/pages/meetings/employee-meetings.jsx";
import MeetingRoom from "@/pages/meetings/meeting-room.jsx";
import MeetingNotifications from "@/components/MeetingNotifications.jsx";
import ProjectNotifications from "@/components/ProjectNotifications.jsx";
import AdminProjects from "@/pages/projects/admin-projects.jsx";
import ProjectDetail from "@/pages/projects/project-detail.jsx";
import EmployeeTasks from "@/pages/projects/employee-tasks.jsx";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/google-otp-verify" component={GoogleOtpVerifyPage} />
      <ProtectedRoute path="/admin" component={AdminDashboard} />
      <ProtectedRoute path="/admin/queries" component={AdminQueries} />
      <ProtectedRoute path="/admin/query/:id/answer" component={QueryAnswer} />
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
      <ProtectedRoute path="/loans" component={EmployeeLoans} />
      <ProtectedRoute path="/admin/loans" component={AdminLoans} />
      <ProtectedRoute path="/admin/emis" component={AdminEMIs} />
      <ProtectedRoute path="/admin/calendar" component={AdminCalendar} />
      <ProtectedRoute path="/employee/calendar" component={EmployeeCalendar} />
      <ProtectedRoute path="/admin/meetings" component={AdminMeetings} />
      <ProtectedRoute path="/meetings" component={EmployeeMeetings} />
      <ProtectedRoute path="/meetings/room/:roomName" component={MeetingRoom} />
      <ProtectedRoute path="/admin/projects" component={AdminProjects} />
      <ProtectedRoute path="/admin/projects/:id" component={ProjectDetail} />
      <ProtectedRoute path="/tasks" component={EmployeeTasks} />
      <Route path="/help-us" component={HelpUs} />
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
            <MeetingNotifications />
            <ProjectNotifications />
            <Router />
          </ErrorBoundary>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;