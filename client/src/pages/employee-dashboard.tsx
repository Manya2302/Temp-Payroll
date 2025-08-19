import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Redirect } from "wouter";
import { Sidebar } from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, CalendarPlus, FileDown, DollarSign, Calendar, PieChart, CalendarDays } from "lucide-react";
import type { Payroll } from "@shared/schema";

export default function EmployeeDashboard() {
  const { user } = useAuth();

  if (user?.role !== 'employee') {
    return <Redirect to="/" />;
  }

  const { data: stats, isLoading: statsLoading } = useQuery<{
    currentSalary: number;
    leaveBalance: number;
    attendanceRate: number;
    pendingRequests: number;
  }>({
    queryKey: ["/api/dashboard/employee-stats"],
  });

  const { data: payrolls, isLoading: payrollsLoading } = useQuery<Payroll[]>({
    queryKey: ["/api/payrolls"],
  });

  if (statsLoading || payrollsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="flex min-h-screen bg-gray-50" data-testid="employee-dashboard">
      <Sidebar userRole="employee" />
      
      <div className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900" data-testid="text-dashboard-title">
                My Dashboard
              </h1>
              <p className="text-gray-600 mt-1" data-testid="text-welcome-message">
                Welcome back, {user.username}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Today's Date</p>
                <p className="font-medium text-gray-900" data-testid="text-current-date">
                  {formatDate(new Date().toISOString())}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 text-sm font-medium">
                    {user.username[0].toUpperCase()}
                  </span>
                </div>
                <span className="text-gray-700 font-medium" data-testid="text-employee-name">
                  {user.username}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6 space-y-6">
          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="h-auto p-6 justify-start"
              data-testid="button-check-in-out"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Clock className="text-primary h-6 w-6" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">Check In/Out</h3>
                  <p className="text-sm text-gray-600">Mark your attendance</p>
                </div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto p-6 justify-start"
              data-testid="button-request-leave"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CalendarPlus className="text-green-600 h-6 w-6" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">Request Leave</h3>
                  <p className="text-sm text-gray-600">Submit leave application</p>
                </div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto p-6 justify-start"
              data-testid="button-download-payslip"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FileDown className="text-purple-600 h-6 w-6" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">Download Payslip</h3>
                  <p className="text-sm text-gray-600">Get latest payslip</p>
                </div>
              </div>
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card data-testid="card-stat-salary">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Current Salary</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1" data-testid="text-current-salary">
                      ${stats?.currentSalary || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="text-green-600 h-6 w-6" />
                  </div>
                </div>
                <div className="mt-4 text-sm text-gray-500">Annual package</div>
              </CardContent>
            </Card>

            <Card data-testid="card-stat-leave-balance">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Leave Balance</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1" data-testid="text-leave-balance">
                      {stats?.leaveBalance || 0} days
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="text-primary h-6 w-6" />
                  </div>
                </div>
                <div className="mt-4 text-sm text-gray-500">Available this year</div>
              </CardContent>
            </Card>

            <Card data-testid="card-stat-attendance">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Attendance Rate</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1" data-testid="text-attendance-rate">
                      {stats?.attendanceRate || 0}%
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <PieChart className="text-purple-600 h-6 w-6" />
                  </div>
                </div>
                <div className="mt-4 text-sm text-gray-500">This month</div>
              </CardContent>
            </Card>

            <Card data-testid="card-stat-pending-requests">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Pending Requests</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1" data-testid="text-pending-requests">
                      {stats?.pendingRequests || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Clock className="text-yellow-600 h-6 w-6" />
                  </div>
                </div>
                <div className="mt-4 text-sm text-gray-500">Awaiting approval</div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity and Payslips */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Payslips */}
            <Card data-testid="card-payslips">
              <CardHeader>
                <CardTitle>Recent Payslips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {payrolls?.slice(0, 3).map((payroll) => (
                  <div 
                    key={payroll.id} 
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    data-testid={`payslip-${payroll.id}`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <FileDown className="text-green-600 h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900" data-testid={`text-payroll-period-${payroll.id}`}>
                          {payroll.payPeriod}
                        </p>
                        <p className="text-sm text-gray-500" data-testid={`text-payroll-amount-${payroll.id}`}>
                          ${payroll.netSalary}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      data-testid={`button-download-payslip-${payroll.id}`}
                    >
                      <FileDown className="h-4 w-4" />
                    </Button>
                  </div>
                )) || (
                  <div className="text-center py-8 text-gray-500" data-testid="text-no-payslips">
                    No payslips available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Attendance */}
            <Card data-testid="card-attendance">
              <CardHeader>
                <CardTitle>Recent Attendance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <CalendarDays className="text-primary h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Today</p>
                      <p className="text-sm text-gray-500">9:00 AM - 6:00 PM</p>
                    </div>
                  </div>
                  <Badge variant="default">Present</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <CalendarDays className="text-primary h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Yesterday</p>
                      <p className="text-sm text-gray-500">9:15 AM - 6:10 PM</p>
                    </div>
                  </div>
                  <Badge variant="default">Present</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <CalendarDays className="text-red-600 h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">March 13</p>
                      <p className="text-sm text-gray-500">Personal Leave</p>
                    </div>
                  </div>
                  <Badge variant="destructive">Absent</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
