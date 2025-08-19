import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Redirect, useLocation } from "wouter";
import { Sidebar } from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import type { Employee } from "@shared/schema";

export default function EmployeeList() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");

  if (user?.role !== 'admin') {
    return <Redirect to="/" />;
  }

  const { data: employees, isLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/employees/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
    },
  });

  const filteredEmployees = employees?.filter(employee =>
    employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.department.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleDeleteEmployee = (id: string) => {
    if (confirm('Are you sure you want to delete this employee?')) {
      deleteEmployeeMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50" data-testid="employee-list-page">
      <Sidebar userRole="admin" />
      
      <div className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900" data-testid="text-page-title">
                Employee Management
              </h1>
              <p className="text-gray-600 mt-1" data-testid="text-page-description">
                Manage your organization's employees
              </p>
            </div>
            <Button
              onClick={() => setLocation("/employees/add")}
              data-testid="button-add-employee"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          <Card data-testid="card-employee-list">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle data-testid="text-employees-title">All Employees</CardTitle>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search employees..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                      data-testid="input-search-employees"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full" data-testid="table-employees">
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
                    {filteredEmployees.map((employee) => (
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
                              onClick={() => setLocation(`/employees/edit/${employee.id}`)}
                              data-testid={`button-edit-employee-${employee.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteEmployee(employee.id)}
                              disabled={deleteEmployeeMutation.isPending}
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

                {filteredEmployees.length === 0 && (
                  <div className="text-center py-8 text-gray-500" data-testid="text-no-employees">
                    {searchTerm ? 'No employees found matching your search.' : 'No employees found.'}
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
