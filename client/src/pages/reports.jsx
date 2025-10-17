import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Download, DollarSign, Calendar, Users } from "lucide-react";
import Layout from "@/components/layout/layout";
import { PayrollChart } from "@/components/charts/payroll-chart";
import { AttendanceChart } from "@/components/charts/attendance-chart";
import { EmployeeChart } from "@/components/charts/employee-chart";
import { format } from "date-fns";

export default function Reports() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState("current-month");

  const { data: summaryStats } = useQuery({
    queryKey: ["/api/reports/summary", dateRange],
    queryFn: async () => {
      const res = await fetch(`/api/reports/summary?dateRange=${dateRange}`);
      if (!res.ok) throw new Error('Failed to fetch summary');
      return res.json();
    },
  });

  const { data: payrollReport } = useQuery({
    queryKey: ["/api/reports/payroll", dateRange],
    queryFn: async () => {
      const res = await fetch(`/api/reports/payroll?dateRange=${dateRange}`);
      if (!res.ok) throw new Error('Failed to fetch payroll report');
      return res.json();
    },
  });

  const { data: attendanceReport } = useQuery({
    queryKey: ["/api/reports/attendance", dateRange],
    queryFn: async () => {
      const res = await fetch(`/api/reports/attendance?dateRange=${dateRange}`);
      if (!res.ok) throw new Error('Failed to fetch attendance report');
      return res.json();
    },
  });

  const { data: employeeReport } = useQuery({
    queryKey: ["/api/reports/employees", dateRange],
    queryFn: async () => {
      const res = await fetch(`/api/reports/employees?dateRange=${dateRange}`);
      if (!res.ok) throw new Error('Failed to fetch employee report');
      return res.json();
    },
  });

  if (user?.role !== 'admin') {
    return (
      <Layout>
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h2 className="text-2xl font-bold text-gray-900 mt-4">Access Denied</h2>
          <p className="mt-2 text-gray-600">Reports are only available to administrators.</p>
        </div>
      </Layout>
    );
  }

  const handleExportReport = async () => {
    try {
      const response = await fetch(`/api/reports/export?dateRange=${dateRange}`);
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Loco_Report_${dateRange}_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export report');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-600 mt-2">Comprehensive business insights and data analysis</p>
          </div>
          <div className="flex space-x-2">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current-month">Current Month</SelectItem>
                <SelectItem value="last-month">Last Month</SelectItem>
                <SelectItem value="current-quarter">Current Quarter</SelectItem>
                <SelectItem value="current-year">Current Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleExportReport}>
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryStats?.totalEmployees || 0}</div>
              <p className="text-xs text-muted-foreground">Active employees</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Payroll</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(summaryStats?.totalPayroll)}
              </div>
              <p className="text-xs text-muted-foreground">
                {dateRange.replace('-', ' ')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Attendance</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summaryStats?.avgAttendance || 0}%
              </div>
              <p className="text-xs text-muted-foreground">This period</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Leaves</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryStats?.pendingLeaves || 0}</div>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="payroll" className="space-y-6">
          <TabsList>
            <TabsTrigger value="payroll">
              <DollarSign className="w-4 h-4 mr-2" />
              Payroll Report
            </TabsTrigger>
            <TabsTrigger value="attendance">
              <Calendar className="w-4 h-4 mr-2" />
              Attendance Report
            </TabsTrigger>
            <TabsTrigger value="employees">
              <Users className="w-4 h-4 mr-2" />
              Employee Report
            </TabsTrigger>
          </TabsList>

          <TabsContent value="payroll" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payroll Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <PayrollChart data={payrollReport?.chartData || []} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payroll Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {payrollReport?.tableData && payrollReport.tableData.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Basic Salary</TableHead>
                          <TableHead>Overtime</TableHead>
                          <TableHead>Deductions</TableHead>
                          <TableHead>Net Pay</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payrollReport.tableData.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell className="font-medium">
                              {record.employeeName}
                            </TableCell>
                            <TableCell>{record.department}</TableCell>
                            <TableCell>{formatCurrency(record.basicSalary)}</TableCell>
                            <TableCell>{formatCurrency(record.overtime)}</TableCell>
                            <TableCell>{formatCurrency(record.deductions)}</TableCell>
                            <TableCell className="font-medium">
                              {formatCurrency(record.netPay)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  record.status === 'paid'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }
                              >
                                {record.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-gray-500">No payroll data for selected period</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <AttendanceChart data={attendanceReport?.chartData || []} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Attendance Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {attendanceReport?.tableData && attendanceReport.tableData.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Present Days</TableHead>
                          <TableHead>Absent Days</TableHead>
                          <TableHead>Late Days</TableHead>
                          <TableHead>Attendance %</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {attendanceReport.tableData.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell className="font-medium">
                              {record.employeeName}
                            </TableCell>
                            <TableCell>{record.department}</TableCell>
                            <TableCell>{record.presentDays}</TableCell>
                            <TableCell>{record.absentDays}</TableCell>
                            <TableCell>{record.lateDays}</TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  record.attendancePercentage >= 90
                                    ? 'bg-green-100 text-green-800'
                                    : record.attendancePercentage >= 75
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }
                              >
                                {record.attendancePercentage}%
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-gray-500">No attendance data for selected period</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="employees" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Employees by Department</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <EmployeeChart 
                      data={employeeReport?.departmentChartData || []} 
                      type="bar" 
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Salary Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <EmployeeChart 
                      data={employeeReport?.salaryChartData || []} 
                      type="doughnut" 
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Employee Overview</CardTitle>
              </CardHeader>
              <CardContent>
                {employeeReport?.tableData && employeeReport.tableData.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Position</TableHead>
                          <TableHead>Hire Date</TableHead>
                          <TableHead>Salary</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {employeeReport.tableData.map((employee) => (
                          <TableRow key={employee.id}>
                            <TableCell className="font-medium">
                              {employee.firstName} {employee.lastName}
                            </TableCell>
                            <TableCell>{employee.department}</TableCell>
                            <TableCell>{employee.position}</TableCell>
                            <TableCell>
                              {employee.hireDate ? format(new Date(employee.hireDate), 'MMM dd, yyyy') : 'N/A'}
                            </TableCell>
                            <TableCell>{formatCurrency(employee.salary)}</TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  employee.status === 'active'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }
                              >
                                {employee.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-gray-500">No employee data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
