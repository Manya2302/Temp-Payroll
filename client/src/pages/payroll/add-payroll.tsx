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
import { insertPayrollSchema, type InsertPayroll, type Employee } from "@shared/schema";
import { ArrowLeft } from "lucide-react";

export default function AddPayroll() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  if (user?.role !== 'admin') {
    return <Redirect to="/" />;
  }

  const { data: employees, isLoading: employeesLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const form = useForm<InsertPayroll>({
    resolver: zodResolver(insertPayrollSchema),
    defaultValues: {
      employeeId: "",
      payPeriod: "",
      baseSalary: "",
      allowances: "0",
      deductions: "0",
      netSalary: "",
      status: "pending",
    },
  });

  const baseSalary = form.watch("baseSalary");
  const allowances = form.watch("allowances");
  const deductions = form.watch("deductions");

  // Calculate net salary automatically
  useEffect(() => {
    const base = parseFloat(baseSalary || "0");
    const allow = parseFloat(allowances || "0");
    const deduct = parseFloat(deductions || "0");
    const net = base + allow - deduct;
    
    if (!isNaN(net) && net >= 0) {
      form.setValue("netSalary", net.toString());
    }
  }, [baseSalary, allowances, deductions, form]);

  const addPayrollMutation = useMutation({
    mutationFn: async (data: InsertPayroll) => {
      const response = await apiRequest("POST", "/api/payrolls", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payrolls"] });
      setLocation("/payroll");
    },
  });

  const onSubmit = (data: InsertPayroll) => {
    addPayrollMutation.mutate(data);
  };

  if (employeesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50" data-testid="add-payroll-page">
      <Sidebar userRole="admin" />
      
      <div className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b p-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => setLocation("/payroll")}
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900" data-testid="text-page-title">
                Add New Payroll
              </h1>
              <p className="text-gray-600 mt-1" data-testid="text-page-description">
                Create a new payroll record
              </p>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          <div className="max-w-2xl">
            <Card data-testid="card-add-payroll-form">
              <CardHeader>
                <CardTitle data-testid="text-form-title">Payroll Information</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-testid="form-add-payroll">
                    <FormField
                      control={form.control}
                      name="employeeId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel data-testid="label-employee">Employee</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} data-testid="select-employee">
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select employee" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {employees?.map((employee) => (
                                <SelectItem key={employee.id} value={employee.id}>
                                  {employee.firstName} {employee.lastName} - {employee.department}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="payPeriod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel data-testid="label-pay-period">Pay Period</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., March 2024, 2024-03"
                              data-testid="input-pay-period"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="baseSalary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel data-testid="label-base-salary">Base Salary</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Enter base salary"
                              data-testid="input-base-salary"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="allowances"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel data-testid="label-allowances">Allowances</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="Enter allowances"
                                data-testid="input-allowances"
                                {...field}
                                value={field.value || ''}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="deductions"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel data-testid="label-deductions">Deductions</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="Enter deductions"
                                data-testid="input-deductions"
                                {...field}
                                value={field.value || ''}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="netSalary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel data-testid="label-net-salary">Net Salary</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Net salary (calculated automatically)"
                              data-testid="input-net-salary"
                              readOnly
                              className="bg-gray-50"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="payDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel data-testid="label-pay-date">Pay Date (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              data-testid="input-pay-date"
                              value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                              onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
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
                          <Select onValueChange={field.onChange} defaultValue={field.value} data-testid="select-status">
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="paid">Paid</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex items-center space-x-4 pt-4">
                      <Button
                        type="submit"
                        disabled={addPayrollMutation.isPending}
                        data-testid="button-save-payroll"
                      >
                        {addPayrollMutation.isPending ? "Saving..." : "Save Payroll"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setLocation("/payroll")}
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
