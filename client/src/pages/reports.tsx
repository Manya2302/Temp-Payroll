import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Redirect } from "wouter";
import { Sidebar } from "@/components/layout/sidebar";
import { PayrollChart } from "@/components/charts/payroll-chart";
import { AttendanceChart } from "@/components/charts/attendance-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FileDown, Users, DollarSign, Clock, TrendingUp } from "lucide-react";
import type { Employee, Payroll, LeaveRequest, Attendance } from "@shared/schema";

export default function Reports() {
  const { user } = useAuth();
  const [reportType, setReportType] = useState("overview");

  if (user?.role !== 'admin') {
    return <Redirect to="/" />;
  }

  const { data: dashboardStats } = useQuery<{
    totalEmployees: number;
    totalPayroll: number;
    pendingLeaves: number;
  }>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: employees } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: payrolls } = useQuery<Payroll[]>({
    queryKey: ["/api/payrolls"],
  });

  const { data: leaveRequests } = useQuery<LeaveRequest[]>({
    queryKey: ["/api/leave-requests"],
  });

  const { data: attendance } = useQuery<Attendance[]>({
    queryKey: ["/api/attendance"],
  });

  const handleExportReport = (type: string) => {
    // This would generate and download a report
    console.log(`Exporting ${type} report...`);
  };

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(typeof amount === 'string' ? parseFloat(amount) : amount);
  };

  const getDepartmentStats = () => {
    if (!employees) return [];
    
    const deptMap = new Map();
    employees.forEach(emp => {
      const dept = emp.department;
      if (!deptMap.has(dept)) {
        deptMap.set(dept, { name: dept, count: 0, totalSalary: 0 });
      }
      const deptData = deptMap.get(dept);
      deptData.count += 1;
      deptData.totalSalary += parseFloat(emp.salary);
    });
    
    return Array.from(deptMap.values());
  };

  const getRecentPayrolls = () => {
    if (!payrolls || !employees) return [];
    
    return payrolls.slice(0, 10).map(payroll => {
      const employee = employees.find(emp => emp.id === payroll.employeeId);
      return {
        ...payroll,
        employeeName: employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown',
        department: employee?.department || 'Unknown'
      };
    });
  };

  return (
    <div className="flex min-h-screen bg-gray-50" data-testid="reports-page">
      <Sidebar userRole="admin" />
      
      <div className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900" data-testid="text-page-title">
                Reports & Analytics
              </h1>
              <p className="text-gray-600 mt-1" data-testid="text-page-description">
                Generate comprehensive reports and analytics
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Select value={reportType} onValueChange={setReportType} data-testid="select-report-type">
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">Overview</SelectItem>
                  <SelectItem value="payroll">Payroll Report</SelectItem>
                  <SelectItem value="employees">Employee Report</SelectItem>
                  <SelectItem value="attendance">Attendance Report</SelectItem>
                  <SelectItem value="leaves">Leave Report</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => handleExportReport(reportType)} data-testid="button-export-report">
                <FileDown className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6 space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card data-testid="card-metric-employees">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total Employees</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1" data-testid="text-total-employees">
                      {dashboardStats?.totalEmployees || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="text-primary h-6 w-6" />
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                  <span className="text-green-600 text-sm font-medium">12% growth</span>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-metric-payroll">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total Payroll</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1" data-testid="text-total-payroll">
                      {formatCurrency(dashboardStats?.totalPayroll || 0)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="text-green-600 h-6 w-6" />
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                  <span className="text-green-600 text-sm font-medium">5.4% increase</span>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-metric-leaves">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Pending Leaves</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1" data-testid="text-pending-leaves">
                      {dashboardStats?.pendingLeaves || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Clock className="text-yellow-600 h-6 w-6" />
                  </div>
                </div>
                <div className="mt-4 text-sm text-yellow-600">Requires attention</div>
              </CardContent>
            </Card>

            <Card data-testid="card-metric-attendance">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Attendance Rate</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1" data-testid="text-attendance-rate">
                      91.2%
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="text-purple-600 h-6 w-6" />
                  </div>
                </div>
                <div className="mt-4 text-sm text-gray-500">Above target</div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card data-testid="card-payroll-trends">
              <CardHeader>
                <CardTitle>Monthly Payroll Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <PayrollChart />
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-attendance-overview">
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

          {/* Department Statistics */}
          <Card data-testid="card-department-stats">
            <CardHeader>
              <CardTitle>Department Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left py-3 px-6 font-medium text-gray-700">Department</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-700">Employees</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-700">Total Salary</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-700">Avg Salary</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {getDepartmentStats().map((dept, index) => (
                      <tr key={dept.name} className="hover:bg-gray-50" data-testid={`row-department-${index}`}>
                        <td className="py-4 px-6 font-medium text-gray-900" data-testid={`text-dept-name-${index}`}>
                          {dept.name}
                        </td>
                        <td className="py-4 px-6 text-gray-700" data-testid={`text-dept-count-${index}`}>
                          {dept.count}
                        </td>
                        <td className="py-4 px-6 text-gray-700" data-testid={`text-dept-total-${index}`}>
                          {formatCurrency(dept.totalSalary)}
                        </td>
                        <td className="py-4 px-6 text-gray-700" data-testid={`text-dept-avg-${index}`}>
                          {formatCurrency(dept.totalSalary / dept.count)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Recent Payroll Activity */}
          <Card data-testid="card-recent-payrolls">
            <CardHeader>
              <CardTitle>Recent Payroll Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left py-3 px-6 font-medium text-gray-700">Employee</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-700">Department</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-700">Pay Period</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-700">Net Salary</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {getRecentPayrolls().map((payroll, index) => (
                      <tr key={payroll.id} className="hover:bg-gray-50" data-testid={`row-payroll-${index}`}>
                        <td className="py-4 px-6 font-medium text-gray-900" data-testid={`text-employee-${index}`}>
                          {payroll.employeeName}
                        </td>
                        <td className="py-4 px-6 text-gray-700" data-testid={`text-department-${index}`}>
                          {payroll.department}
                        </td>
                        <td className="py-4 px-6 text-gray-700" data-testid={`text-period-${index}`}>
                          {payroll.payPeriod}
                        </td>
                        <td className="py-4 px-6 text-gray-700" data-testid={`text-salary-${index}`}>
                          {formatCurrency(payroll.netSalary)}
                        </td>
                        <td className="py-4 px-6">
                          <Badge 
                            variant={payroll.status === 'paid' ? 'default' : 'secondary'}
                            data-testid={`badge-status-${index}`}
                          >
                            {payroll.status}
                          </Badge>
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
