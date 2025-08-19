import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Search, Check, X } from "lucide-react";
import type { LeaveRequest, Employee } from "@shared/schema";

export default function LeaveRequests() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: leaveRequests, isLoading: requestsLoading } = useQuery<LeaveRequest[]>({
    queryKey: ["/api/leave-requests"],
  });

  const { data: employees, isLoading: employeesLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
    enabled: user?.role === 'admin',
  });

  const updateLeaveRequestMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'approved' | 'rejected' }) => {
      const response = await apiRequest("PUT", `/api/leave-requests/${id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave-requests"] });
    },
  });

  const getEmployeeName = (employeeId: string) => {
    const employee = employees?.find(emp => emp.id === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown Employee';
  };

  const filteredRequests = leaveRequests?.filter(request => {
    const searchLower = searchTerm.toLowerCase();
    const employeeName = getEmployeeName(request.employeeId).toLowerCase();
    return (
      employeeName.includes(searchLower) ||
      request.leaveType.toLowerCase().includes(searchLower) ||
      request.reason?.toLowerCase().includes(searchLower)
    );
  }) || [];

  const handleApproveRequest = (id: string) => {
    updateLeaveRequestMutation.mutate({ id, status: 'approved' });
  };

  const handleRejectRequest = (id: string) => {
    updateLeaveRequestMutation.mutate({ id, status: 'rejected' });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (requestsLoading || (user?.role === 'admin' && employeesLoading)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50" data-testid="leave-requests-page">
      <Sidebar userRole={user?.role || 'employee'} />
      
      <div className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900" data-testid="text-page-title">
                {user?.role === 'admin' ? 'Leave Requests Management' : 'My Leave Requests'}
              </h1>
              <p className="text-gray-600 mt-1" data-testid="text-page-description">
                {user?.role === 'admin' 
                  ? 'Review and manage employee leave requests' 
                  : 'View your leave request history'
                }
              </p>
            </div>
            {user?.role === 'employee' && (
              <Button
                onClick={() => setLocation("/leaves/apply")}
                data-testid="button-apply-leave"
              >
                <Plus className="h-4 w-4 mr-2" />
                Apply for Leave
              </Button>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          <Card data-testid="card-leave-requests">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle data-testid="text-requests-title">
                  {user?.role === 'admin' ? 'All Leave Requests' : 'Your Leave Requests'}
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search requests..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                      data-testid="input-search-requests"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full" data-testid="table-leave-requests">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      {user?.role === 'admin' && (
                        <th className="text-left py-3 px-6 font-medium text-gray-700">Employee</th>
                      )}
                      <th className="text-left py-3 px-6 font-medium text-gray-700">Leave Type</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-700">Start Date</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-700">End Date</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-700">Days</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-700">Reason</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-700">Status</th>
                      {user?.role === 'admin' && (
                        <th className="text-left py-3 px-6 font-medium text-gray-700">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredRequests.map((request) => (
                      <tr key={request.id} className="hover:bg-gray-50" data-testid={`row-request-${request.id}`}>
                        {user?.role === 'admin' && (
                          <td className="py-4 px-6" data-testid={`text-employee-${request.id}`}>
                            {getEmployeeName(request.employeeId)}
                          </td>
                        )}
                        <td className="py-4 px-6" data-testid={`text-leave-type-${request.id}`}>
                          <span className="capitalize">{request.leaveType}</span>
                        </td>
                        <td className="py-4 px-6 text-gray-700" data-testid={`text-start-date-${request.id}`}>
                          {formatDate(request.startDate.toString())}
                        </td>
                        <td className="py-4 px-6 text-gray-700" data-testid={`text-end-date-${request.id}`}>
                          {formatDate(request.endDate.toString())}
                        </td>
                        <td className="py-4 px-6 text-gray-700" data-testid={`text-days-${request.id}`}>
                          {request.days}
                        </td>
                        <td className="py-4 px-6 text-gray-700 max-w-xs truncate" data-testid={`text-reason-${request.id}`}>
                          {request.reason || 'No reason provided'}
                        </td>
                        <td className="py-4 px-6">
                          <Badge 
                            variant={
                              request.status === 'approved' ? 'default' : 
                              request.status === 'rejected' ? 'destructive' : 'secondary'
                            }
                            data-testid={`badge-status-${request.id}`}
                          >
                            {request.status}
                          </Badge>
                        </td>
                        {user?.role === 'admin' && (
                          <td className="py-4 px-6">
                            {request.status === 'pending' && (
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleApproveRequest(request.id)}
                                  disabled={updateLeaveRequestMutation.isPending}
                                  data-testid={`button-approve-${request.id}`}
                                  className="text-green-600 border-green-600 hover:bg-green-50"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRejectRequest(request.id)}
                                  disabled={updateLeaveRequestMutation.isPending}
                                  data-testid={`button-reject-${request.id}`}
                                  className="text-red-600 border-red-600 hover:bg-red-50"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                            {request.status !== 'pending' && (
                              <span className="text-sm text-gray-500">
                                {request.status === 'approved' ? 'Approved' : 'Rejected'}
                              </span>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredRequests.length === 0 && (
                  <div className="text-center py-8 text-gray-500" data-testid="text-no-requests">
                    {searchTerm ? 'No leave requests found matching your search.' : 'No leave requests found.'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
