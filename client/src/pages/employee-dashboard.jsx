import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Calendar, Clock, FileText, User, Plus } from "lucide-react";
import Layout from "@/components/layout/layout";
import { Link } from "wouter";
import { format } from "date-fns";

export default function EmployeeDashboard() {
  const { user } = useAuth();

  const { data: employeeData } = useQuery({
    queryKey: ["/api/employee/profile"],
  });

  const { data: recentPayslips } = useQuery({
    queryKey: ["/api/employee/payslips"],
  });

  const { data: leaveBalance } = useQuery({
    queryKey: ["/api/employee/leave-balance"],
  });

  const { data: recentAttendance } = useQuery({
    queryKey: ["/api/employee/attendance"],
  });

  const quickActions = [
    {
      title: "Apply for Leave",
      description: "Submit a new leave request",
      icon: Calendar,
      href: "/leaves/apply",
      color: "bg-purple-500",
    },
    {
      title: "View Payslips",
      description: "Download your payslips",
      icon: DollarSign,
      href: "/payroll",
      color: "bg-green-500",
    },
    {
      title: "Mark Attendance",
      description: "Clock in/out for today",
      icon: Clock,
      href: "/attendance",
      color: "bg-blue-500",
    },
    {
      title: "Update Profile",
      description: "Edit your personal information",
      icon: User,
      href: "/profile",
      color: "bg-orange-500",
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employee Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, {user?.username}. Here's your personal overview.</p>
        </div>

        {/* Profile Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>My Information</CardTitle>
                <CardDescription>Your employment details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Name</label>
                    <p className="text-gray-900">
                      {employeeData?.firstName} {employeeData?.lastName}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Employee ID</label>
                    <p className="text-gray-900">{employeeData?.id || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Department</label>
                    <p className="text-gray-900">{employeeData?.department || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Position</label>
                    <p className="text-gray-900">{employeeData?.position || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Hire Date</label>
                    <p className="text-gray-900">
                      {employeeData?.hireDate ? format(new Date(employeeData.hireDate), 'MMM dd, yyyy') : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    <Badge
                      className={
                        employeeData?.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }
                    >
                      {employeeData?.status || 'Unknown'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Leave Balance</CardTitle>
                <CardDescription>Your available time off</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Vacation Days</span>
                      <span className="font-medium">{leaveBalance?.vacation || 0} days</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Sick Leave</span>
                      <span className="font-medium">{leaveBalance?.sick || 0} days</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Personal Days</span>
                      <span className="font-medium">{leaveBalance?.personal || 0} days</span>
                    </div>
                  </div>
                  <Link href="/leaves/apply">
                    <Button className="w-full mt-4">
                      <Plus className="w-4 h-4 mr-2" />
                      Apply for Leave
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Link key={action.title} href={action.href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center mb-2`}>
                      <action.icon className="w-5 h-5 text-white" />
                    </div>
                    <CardTitle className="text-sm">{action.title}</CardTitle>
                    <CardDescription className="text-xs">
                      {action.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Payslips</CardTitle>
              <CardDescription>Your latest salary payments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentPayslips?.slice(0, 3).map((payslip) => (
                  <div key={payslip.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{payslip.payPeriod}</p>
                      <p className="text-xs text-gray-600">Processed on {format(new Date(payslip.processedDate), 'MMM dd, yyyy')}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">${payslip.netPay.toLocaleString()}</p>
                      <Button size="sm" variant="outline" className="text-xs">
                        <FileText className="w-3 h-3 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-4">
                    <FileText className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">No payslips available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Attendance</CardTitle>
              <CardDescription>Your latest check-ins</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentAttendance?.slice(0, 5).map((record) => (
                  <div key={record.id} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-sm">{format(new Date(record.date), 'MMM dd, yyyy')}</p>
                      <p className="text-xs text-gray-600">
                        {record.checkIn} - {record.checkOut || 'Not checked out'}
                      </p>
                    </div>
                    <Badge
                      className={
                        record.status === 'present'
                          ? 'bg-green-100 text-green-800'
                          : record.status === 'late'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }
                    >
                      {record.status}
                    </Badge>
                  </div>
                )) || (
                  <div className="text-center py-4">
                    <Clock className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">No attendance records</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}