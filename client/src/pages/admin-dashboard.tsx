import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Redirect } from "wouter";
import { Sidebar } from "@/components/layout/sidebar";
import { PayrollChart } from "@/components/charts/payroll-chart";
import { AttendanceChart } from "@/components/charts/attendance-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, DollarSign, Clock, UserCheck, Plus, Edit, Trash2 } from "lucide-react";
import type { Employee } from "@shared/schema";

export default function AdminDashboard() {
  const { user } = useAuth();

  if (user?.role !== 'admin') {
    return <Redirect to="/" />;
  }

  const { data: stats, isLoading: statsLoading } = useQuery<{
    totalEmployees: number;
    totalPayroll: number;
    pendingLeaves: number;
    presentToday: number;
  }>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: employees, isLoading: employeesLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  if (statsLoading || employeesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50" data-testid="admin-dashboard">
      <Sidebar userRole="admin" />
      
      <div className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900" data-testid="text-dashboard-title">
                Dashboard Overview
              </h1>
              <p className="text-gray-600 mt-1" data-testid="text-welcome-message">
                Welcome back, Administrator
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 text-sm font-medium">A</span>
                </div>
                <span className="text-gray-700 font-medium" data-testid="text-admin-name">
                  {user.username}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card data-testid="card-stat-employees">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total Employees</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1" data-testid="text-total-employees">
                      {stats?.totalEmployees || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="text-primary h-6 w-6" />
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <span className="text-green-600 text-sm font-medium">+12%</span>
                  <span className="text-gray-500 text-sm ml-2">from last month</span>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-stat-payroll">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Monthly Payroll</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1" data-testid="text-total-payroll">
                      ${stats?.totalPayroll || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="text-green-600 h-6 w-6" />
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <span className="text-green-600 text-sm font-medium">+5.4%</span>
                  <span className="text-gray-500 text-sm ml-2">from last month</span>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-stat-leaves">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Pending Leaves</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1" data-testid="text-pending-leaves">
                      {stats?.pendingLeaves || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Clock className="text-yellow-600 h-6 w-6" />
                  </div>
                </div>
                <div className="mt-4 text-sm text-yellow-600">Requires action</div>
              </CardContent>
            </Card>

            <Card data-testid="card-stat-attendance">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Present Today</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1" data-testid="text-present-today">
                      {stats?.presentToday || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <UserCheck className="text-purple-600 h-6 w-6" />
                  </div>
                </div>
                <div className="mt-4 text-sm text-gray-500">91.2% attendance</div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card data-testid="card-payroll-chart">
              <CardHeader>
                <CardTitle>Monthly Payroll Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <PayrollChart />
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-attendance-chart">
              <CardHeader>
                <CardTitle>Attendance Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <AttendanceChart />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Employees Table */}
          <Card data-testid="card-employees-table">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Employees</CardTitle>
                <Button data-testid="button-add-employee">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Employee
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left py-3 px-6 font-medium text-gray-700">Employee</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-700">Department</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-700">Position</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-700">Salary</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-700">Status</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {employees?.slice(0, 5).map((employee) => (
                      <tr key={employee.id} className="hover:bg-gray-50" data-testid={`row-employee-${employee.id}`}>
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                              <span className="text-gray-600 text-sm font-medium">
                                {employee.firstName[0]}{employee.lastName[0]}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900" data-testid={`text-employee-name-${employee.id}`}>
                                {employee.firstName} {employee.lastName}
                              </p>
                              <p className="text-sm text-gray-500" data-testid={`text-employee-email-${employee.id}`}>
                                {employee.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-gray-700" data-testid={`text-employee-department-${employee.id}`}>
                          {employee.department}
                        </td>
                        <td className="py-4 px-6 text-gray-700" data-testid={`text-employee-position-${employee.id}`}>
                          {employee.position}
                        </td>
                        <td className="py-4 px-6 text-gray-700" data-testid={`text-employee-salary-${employee.id}`}>
                          ${employee.salary}
                        </td>
                        <td className="py-4 px-6">
                          <Badge 
                            variant={employee.status === 'active' ? 'default' : 'secondary'}
                            data-testid={`badge-employee-status-${employee.id}`}
                          >
                            {employee.status}
                          </Badge>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              data-testid={`button-edit-employee-${employee.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              data-testid={`button-delete-employee-${employee.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
