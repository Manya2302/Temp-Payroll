
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, DollarSign, Calendar, TrendingUp, FileText } from "lucide-react";
import Layout from "@/components/layout/layout";
import React from 'react';
import { AttendanceChart } from '@/components/charts/attendance-chart';
import { PayrollChart } from '@/components/charts/payroll-chart';
import { Link } from "wouter";

export default function AdminDashboard() {
  const { user } = useAuth();
  // Log after user resolved
  console.log('[admin-dashboard] render start', { hasUser: !!user });
  if (!user) {
    return <div className="p-6 text-sm text-gray-500">No user context.</div>;
  }

  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: payrollReport } = useQuery({
    queryKey: ["/api/reports/payroll", "current-month"],
    queryFn: async () => {
      const res = await fetch(`/api/reports/payroll?dateRange=current-month`);
      if (!res.ok) throw new Error('Failed to fetch payroll report');
      return res.json();
    },
  });

  const { data: attendanceReport } = useQuery({
    queryKey: ["/api/reports/attendance", "current-month"],
    queryFn: async () => {
      const res = await fetch(`/api/reports/attendance?dateRange=current-month`);
      if (!res.ok) throw new Error('Failed to fetch attendance report');
      return res.json();
    },
  });

  const quickActions = [
    // {
    //   title: "Add Employee",
    //   description: "Add a new employee to your organization",
    //   icon: Users,
    //   href: "/employees/add",
    //   color: "bg-blue-500",
    // },
    {
      title: "Process Payroll",
      description: "Create payroll for current period",
      icon: DollarSign,
      href: "/payroll/add",
      color: "bg-green-500",
    },
    {
      title: "Review Leaves",
      description: "Review pending leave requests",
      icon: Calendar,
      href: "/leaves",
      color: "bg-purple-500",
    },
    {
      title: "View Reports",
      description: "Generate comprehensive reports",
      icon: FileText,
      href: "/reports",
      color: "bg-orange-500",
    },
  ];

  return (
    <Layout>
      <div className="space-y-6" data-debug="admin-dashboard-root">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, {user?.username}. Here's your organization overview.</p>
        </div>

        {/* Stats Cards */}
        {(statsLoading || statsError) && (
          <div className="text-sm flex gap-4 flex-wrap">
            {statsLoading && <span className="text-gray-500">Loading stats…</span>}
            {statsError && <span className="text-red-500">Stats error</span>}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalEmployees || 0}</div>
              <p className="text-xs text-muted-foreground">
                +2 from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Payroll</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(stats?.totalPayroll || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                +5.2% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Leaves</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.pendingLeaves || 0}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting approval
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats ? `${stats.presentToday || 0} present` : '—'}</div>
              <p className="text-xs text-muted-foreground">
                +1.2% from last week
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Overview</CardTitle>
              <CardDescription>Current month attendance distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <AttendanceChart data={attendanceReport?.chartData || []} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payroll Trends</CardTitle>
              <CardDescription>Monthly payroll expenditure</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <PayrollChart data={payrollReport?.chartData || []} />
              </div>
            </CardContent>
          </Card>
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
  </div>
    </Layout>
  );
}