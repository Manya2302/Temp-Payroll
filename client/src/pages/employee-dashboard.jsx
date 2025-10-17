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

  // ✅ Fetch function
  const fetcher = async (url) => {
    const res = await fetch(url, { credentials: "include" }); // include cookies/session
    if (!res.ok) throw new Error("Failed to fetch " + url);
    return res.json();
  };

  // ✅ Queries
  const {
    data: profileData,
    isLoading: profileLoading,
    error: profileError,
  } = useQuery({
    queryKey: ["profile"],
    queryFn: () => fetcher("/api/profile"),
  });

  const { data: recentPayslips } = useQuery({
    queryKey: ["payslips"],
    queryFn: () => fetcher("/api/payslips"),
  });

  const { data: leaveBalance } = useQuery({
    queryKey: ["leave-balance"],
    queryFn: () => fetcher("/api/employee/leave-balance"),
  });

  const { data: recentAttendance } = useQuery({
    queryKey: ["attendance"],
    queryFn: () => fetcher("/api/employee/attendance"),
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
          <p className="text-gray-600 mt-2">
            Welcome back, {user?.username || "Employee"}. Here's your personal overview.
          </p>
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
                {profileLoading ? (
                  <p className="text-gray-500">Loading profile...</p>
                ) : profileError ? (
                  <p className="text-red-500">Error loading profile.</p>
                ) : !profileData ? (
                  <p className="text-gray-500">No profile data available.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoItem label="Name" value={`${profileData.firstName || "N/A"} ${profileData.lastName || ""}`} />
                    <InfoItem label="Employee ID" value={profileData.employeeId} />
                    <InfoItem label="Department" value={profileData.department} />
                    <InfoItem
                      label="Date of Birth"
                      value={
                        profileData.dob ? format(new Date(profileData.dob), "MMM dd, yyyy") : "N/A"
                      }
                    />
                    <InfoItem label="Gender" value={profileData.gender} />
                    <InfoItem label="Contact Number" value={profileData.phone} />
                    <InfoItem label="Email Address" value={profileData.email} />
                    <InfoItem label="Address" value={profileData.address} />
                    <InfoItem
                      label="Basic Salary"
                      value={profileData.salary ? `₹${profileData.salary}` : "N/A"}
                    />
                    <InfoItem label="Bank Account Number" value={profileData.bankAccount} />
                    <InfoItem label="Tax ID / PAN / SSN" value={profileData.taxId} />
                    <InfoItem label="Employment Type" value={profileData.employmentType} />
                    <InfoItem label="Bank Name" value={profileData.bankName} />
                    <InfoItem label="Bank Branch" value={profileData.bankBranch} />
                    <div>
                      <label className="text-sm font-medium text-gray-700">Status</label>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Leave Balance */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Leave Balance</CardTitle>
                <CardDescription>Your available time off</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <LeaveItem label="Vacation Days" value={leaveBalance?.vacation} />
                  <LeaveItem label="Sick Leave" value={leaveBalance?.sick} />
                  <LeaveItem label="Personal Days" value={leaveBalance?.personal} />
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
                    <div
                      className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center mb-2`}
                    >
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
          <PayslipCard recentPayslips={recentPayslips} />
          <AttendanceCard recentAttendance={recentAttendance} />
        </div>
      </div>
    </Layout>
  );
}

// ✅ Reusable small components
function InfoItem({ label, value }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <p className="text-gray-900">{value || "N/A"}</p>
    </div>
  );
}

function LeaveItem({ label, value }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="font-medium">{value || 0} days</span>
    </div>
  );
}

function PayslipCard({ recentPayslips }) {
  const getMonthName = (month) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month - 1] || '';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Payslips</CardTitle>
        <CardDescription>Your latest salary payments</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentPayslips?.length ? (
            recentPayslips.slice(0, 3).map((payslip) => (
              <div
                key={payslip.id}
                className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-sm">
                    {getMonthName(payslip.month)} {payslip.year}
                  </p>
                  <p className="text-xs text-gray-600">
                    Processed on {format(new Date(payslip.paidDate), "MMM dd, yyyy")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-sm">
                    ₹{payslip.netSalary.toLocaleString()}
                  </p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-xs mt-1"
                    onClick={() => window.open(`/api/payslips/${payslip.id}/download`, '_blank')}
                  >
                    <FileText className="w-3 h-3 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4">
              <FileText className="mx-auto h-8 w-8 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">No payslips available</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function AttendanceCard({ recentAttendance }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Attendance</CardTitle>
        <CardDescription>Your latest check-ins</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentAttendance?.length ? (
            recentAttendance.slice(0, 5).map((record) => (
              <div key={record.id} className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-sm">
                    {format(new Date(record.date), "MMM dd, yyyy")}
                  </p>
                  <p className="text-xs text-gray-600">
                    {record.checkIn} - {record.checkOut || "Not checked out"}
                  </p>
                </div>
                <Badge
                  className={
                    record.status === "present"
                      ? "bg-green-100 text-green-800"
                      : record.status === "late"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }
                >
                  {record.status}
                </Badge>
              </div>
            ))
          ) : (
            <div className="text-center py-4">
              <Clock className="mx-auto h-8 w-8 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">No attendance records</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

