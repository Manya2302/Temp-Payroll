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
import { Plus, Search, Edit, Trash2, FileDown } from "lucide-react";
import type { Payroll, Employee } from "@shared/schema";

export default function PayrollList() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: payrolls, isLoading: payrollsLoading } = useQuery<Payroll[]>({
    queryKey: ["/api/payrolls"],
  });

  const { data: employees, isLoading: employeesLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
    enabled: user?.role === 'admin',
  });

  const deletePayrollMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/payrolls/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payrolls"] });
    },
  });

  const getEmployeeName = (employeeId: string) => {
    const employee = employees?.find(emp => emp.id === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown Employee';
  };

  const filteredPayrolls = payrolls?.filter(payroll =>
    payroll.payPeriod.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getEmployeeName(payroll.employeeId).toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleDeletePayroll = (id: string) => {
    if (confirm('Are you sure you want to delete this payroll record?')) {
      deletePayrollMutation.mutate(id);
    }
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(parseFloat(amount));
  };

  if (payrollsLoading || (user?.role === 'admin' && employeesLoading)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50" data-testid="payroll-list-page">
      <Sidebar userRole={user?.role || 'employee'} />
      
      <div className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900" data-testid="text-page-title">
                {user?.role === 'admin' ? 'Payroll Management' : 'My Payslips'}
              </h1>
              <p className="text-gray-600 mt-1" data-testid="text-page-description">
                {user?.role === 'admin' 
                  ? 'Manage employee payroll records' 
                  : 'View and download your payslips'
                }
              </p>
            </div>
            {user?.role === 'admin' && (
              <Button
                onClick={() => setLocation("/payroll/add")}
                data-testid="button-add-payroll"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Payroll
              </Button>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          <Card data-testid="card-payroll-list">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle data-testid="text-payrolls-title">
                  {user?.role === 'admin' ? 'All Payroll Records' : 'Your Payslips'}
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search payrolls..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                      data-testid="input-search-payrolls"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full" data-testid="table-payrolls">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      {user?.role === 'admin' && (
                        <th className="text-left py-3 px-6 font-medium text-gray-700">Employee</th>
                      )}
                      <th className="text-left py-3 px-6 font-medium text-gray-700">Pay Period</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-700">Base Salary</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-700">Allowances</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-700">Deductions</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-700">Net Salary</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-700">Status</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredPayrolls.map((payroll) => (
                      <tr key={payroll.id} className="hover:bg-gray-50" data-testid={`row-payroll-${payroll.id}`}>
                        {user?.role === 'admin' && (
                          <td className="py-4 px-6" data-testid={`text-employee-${payroll.id}`}>
                            {getEmployeeName(payroll.employeeId)}
                          </td>
                        )}
                        <td className="py-4 px-6 text-gray-700" data-testid={`text-pay-period-${payroll.id}`}>
                          {payroll.payPeriod}
                        </td>
                        <td className="py-4 px-6 text-gray-700" data-testid={`text-base-salary-${payroll.id}`}>
                          {formatCurrency(payroll.baseSalary)}
                        </td>
                        <td className="py-4 px-6 text-gray-700" data-testid={`text-allowances-${payroll.id}`}>
                          {formatCurrency(payroll.allowances || '0')}
                        </td>
                        <td className="py-4 px-6 text-gray-700" data-testid={`text-deductions-${payroll.id}`}>
                          {formatCurrency(payroll.deductions || '0')}
                        </td>
                        <td className="py-4 px-6 text-gray-700 font-medium" data-testid={`text-net-salary-${payroll.id}`}>
                          {formatCurrency(payroll.netSalary)}
                        </td>
                        <td className="py-4 px-6">
                          <Badge 
                            variant={payroll.status === 'paid' ? 'default' : 'secondary'}
                            data-testid={`badge-status-${payroll.id}`}
                          >
                            {payroll.status}
                          </Badge>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              data-testid={`button-download-${payroll.id}`}
                              title="Download Payslip"
                            >
                              <FileDown className="h-4 w-4" />
                            </Button>
                            {user?.role === 'admin' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setLocation(`/payroll/edit/${payroll.id}`)}
                                  data-testid={`button-edit-${payroll.id}`}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeletePayroll(payroll.id)}
                                  disabled={deletePayrollMutation.isPending}
                                  data-testid={`button-delete-${payroll.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredPayrolls.length === 0 && (
                  <div className="text-center py-8 text-gray-500" data-testid="text-no-payrolls">
                    {searchTerm ? 'No payrolls found matching your search.' : 'No payroll records found.'}
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
