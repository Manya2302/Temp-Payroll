import { useQuery } from "@tanstack/react-query";
import { DollarSign, Calendar, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Layout from "@/components/layout/layout";

export default function EmployeeDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/employee-stats"],
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employee Dashboard</h1>
          <p className="text-gray-600 mt-2">Your personal HR overview</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Salary</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats?.currentSalary || 0}</div>
              <p className="text-xs text-muted-foreground">Monthly salary</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Leave Balance</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.leaveBalance || 0}</div>
              <p className="text-xs text-muted-foreground">Days remaining</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.attendanceRate || 0}%</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.pendingRequests || 0}</div>
              <p className="text-xs text-muted-foreground">Leave requests</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common employee tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <a
                href="/leaves/apply"
                className="block p-3 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors"
              >
                <div className="font-medium text-primary">Apply for Leave</div>
                <div className="text-sm text-gray-600">Submit a new leave request</div>
              </a>
              <a
                href="/payroll"
                className="block p-3 rounded-lg bg-green-50 hover:bg-green-100 transition-colors"
              >
                <div className="font-medium text-green-700">View Payslips</div>
                <div className="text-sm text-gray-600">Check your salary history</div>
              </a>
              <a
                href="/profile"
                className="block p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                <div className="font-medium text-blue-700">Update Profile</div>
                <div className="text-sm text-gray-600">Edit your personal information</div>
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Payslips</CardTitle>
              <CardDescription>Your latest salary statements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm text-gray-600 text-center py-8">
                  No recent payslips available
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}