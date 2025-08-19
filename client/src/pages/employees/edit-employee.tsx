import { useEffect } from 'react';
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Redirect } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sidebar } from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertEmployeeSchema, type InsertEmployee, type Employee } from "@shared/schema";
import { ArrowLeft } from "lucide-react";

interface EditEmployeeProps {
  params: { id: string };
}

export default function EditEmployee({ params }: EditEmployeeProps) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { id } = params;

  if (user?.role !== 'admin') {
    return <Redirect to="/" />;
  }

  const { data: employee, isLoading } = useQuery<Employee>({
    queryKey: ["/api/employees", id],
  });

  const form = useForm<InsertEmployee>({
    resolver: zodResolver(insertEmployeeSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      department: "",
      position: "",
      salary: "",
      hireDate: new Date(),
      status: "active",
    },
  });

  // Update form values when employee data loads
  useEffect(() => {
    if (employee) {
      form.reset({
        userId: employee.userId,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        phone: employee.phone || "",
        department: employee.department,
        position: employee.position,
        salary: employee.salary,
        hireDate: new Date(employee.hireDate),
        status: employee.status,
      });
    }
  }, [employee, form]);

  const updateEmployeeMutation = useMutation({
    mutationFn: async (data: Partial<InsertEmployee>) => {
      const response = await apiRequest("PUT", `/api/employees/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employees", id] });
      setLocation("/employees");
    },
  });

  const onSubmit = (data: InsertEmployee) => {
    updateEmployeeMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Employee not found</h2>
          <Button onClick={() => setLocation("/employees")} className="mt-4">
            Back to Employees
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50" data-testid="edit-employee-page">
      <Sidebar userRole="admin" />
      
      <div className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b p-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => setLocation("/employees")}
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900" data-testid="text-page-title">
                Edit Employee
              </h1>
              <p className="text-gray-600 mt-1" data-testid="text-page-description">
                Update employee information
              </p>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          <div className="max-w-2xl">
            <Card data-testid="card-edit-employee-form">
              <CardHeader>
                <CardTitle data-testid="text-form-title">Employee Information</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-testid="form-edit-employee">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel data-testid="label-first-name">First Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter first name"
                                data-testid="input-first-name"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel data-testid="label-last-name">Last Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter last name"
                                data-testid="input-last-name"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel data-testid="label-email">Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="Enter email address"
                              data-testid="input-email"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel data-testid="label-phone">Phone</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter phone number"
                              data-testid="input-phone"
                              {...field}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="department"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel data-testid="label-department">Department</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter department"
                                data-testid="input-department"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="position"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel data-testid="label-position">Position</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter position"
                                data-testid="input-position"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="salary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel data-testid="label-salary">Salary</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Enter annual salary"
                              data-testid="input-salary"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="hireDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel data-testid="label-hire-date">Hire Date</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              data-testid="input-hire-date"
                              value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                              onChange={(e) => field.onChange(new Date(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel data-testid="label-status">Status</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} data-testid="select-status">
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                              <SelectItem value="terminated">Terminated</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex items-center space-x-4 pt-4">
                      <Button
                        type="submit"
                        disabled={updateEmployeeMutation.isPending}
                        data-testid="button-update-employee"
                      >
                        {updateEmployeeMutation.isPending ? "Updating..." : "Update Employee"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setLocation("/employees")}
                        data-testid="button-cancel"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
