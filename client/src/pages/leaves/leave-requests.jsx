import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, CheckCircle, XCircle, Clock, Plus } from "lucide-react";
import { format } from "date-fns";
import Layout from "@/components/layout/layout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function LeaveRequests() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [filter, setFilter] = useState("all");

  // Fetch leave requests
  const { data: leaveRequests, isLoading } = useQuery({
    queryKey: ["/api/leave-requests"],
  });

  // Update leave status (admin only)
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const response = await apiRequest("PATCH", `/api/leave-requests/${id}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave-requests"] });
      toast({
        title: "Success",
        description: "Leave request status updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleStatusUpdate = (_id, status) => {
    updateStatusMutation.mutate({ id: _id, status });
  };

  // Badge styling based on status
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { className: "bg-yellow-100 text-yellow-800", icon: Clock },
      approved: { className: "bg-green-100 text-green-800", icon: CheckCircle },
      rejected: { className: "bg-red-100 text-red-800", icon: XCircle },
    };
    const config = statusConfig[status || "pending"];
    const IconComponent = config.icon;
    return (
      <Badge className={config.className}>
        <IconComponent className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getLeaveTypeColor = (type) => {
    const colors = {
      vacation: "bg-blue-100 text-blue-800",
      sick: "bg-red-100 text-red-800",
      personal: "bg-purple-100 text-purple-800",
      maternity: "bg-pink-100 text-pink-800",
      paternity: "bg-indigo-100 text-indigo-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  const filteredRequests = leaveRequests?.filter((request) => {
    if (filter === "all") return true;
    return request.status === filter;
  }) || [];

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading leave requests...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Leave Requests</h1>
            <p className="text-gray-600 mt-2">
              {user?.role === "admin"
                ? "Manage and approve employee leave requests"
                : "View your leave request history"}
            </p>
          </div>
          {user?.role === "employee" && (
            <Link href="/leaves/apply">
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Apply for Leave
              </Button>
            </Link>
          )}
        </div>

        {/* Filter */}
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Filter by status:</label>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Requests</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Leave Requests Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" /> Leave Requests
            </CardTitle>
            <CardDescription>{filteredRequests.length} requests found</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredRequests.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {user?.role === "admin" && <TableHead>Employee</TableHead>}
                      <TableHead>Type</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reason</TableHead>
                      {user?.role === "admin" && <TableHead>Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.map((request) => (
                      <TableRow key={request._id}>
                        {user?.role === "admin" && (
                          <TableCell className="font-medium">
                            {request.employee
                              ? `${request.employee.firstName || ''} ${request.employee.lastName || ''}`
                              : "N/A"}
                          </TableCell>
                        )}
                        <TableCell>
                          <Badge className={getLeaveTypeColor(request.leaveType)}>
                            {request.leaveType.charAt(0).toUpperCase() + request.leaveType.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>{format(new Date(request.startDate), "MMM dd, yyyy")}</TableCell>
                        <TableCell>{format(new Date(request.endDate), "MMM dd, yyyy")}</TableCell>
                        <TableCell>
                          {request.days} day{request.days !== 1 ? "s" : ""}
                        </TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell className="text-sm text-gray-600">{request.reason || "No reason provided"}</TableCell>
                        {user?.role === "admin" && (
                          <TableCell>
                            {request.status === "pending" && (
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 border-green-600 hover:bg-green-50"
                                  onClick={() => handleStatusUpdate(request._id, "approved")}
                                  disabled={updateStatusMutation.isPending}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 border-red-600 hover:bg-red-50"
                                  onClick={() => handleStatusUpdate(request._id, "rejected")}
                                  disabled={updateStatusMutation.isPending}
                                >
                                  Reject
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">No leave requests</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {user?.role === "admin"
                    ? "No leave requests match the current filter."
                    : "You haven't submitted any leave requests yet."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
