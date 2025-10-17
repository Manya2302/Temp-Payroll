/**
 * 🔹 Frontend (React) - Edit Payroll Component
 * MERN Concepts Used:
 * ✅ Components - Payroll editing form with data loading
 * ✅ Props - Dynamic route params for payroll ID
 * ✅ State (useState) - Form state and real-time calculations
 * ✅ State with Object - Payroll data object and form values
 * ✅ useEffect - Loading payroll data and populating form
 * ✅ Event Handling - Form submission, calculations, navigation
 * ✅ Form Handling - Pre-populated edit form with validation
 * ✅ Form Validation - Client-side validation using Zod schema
 * ✅ Conditional Rendering - Loading states, error states, role-based access
 * ✅ React Router (Routes, Dynamic Params) - Dynamic payroll ID routing
 * ✅ Context API (for auth state) - Role-based access control
 * ✅ API Calls (fetch / axios) - GET payroll data, PUT payroll update
 * ✅ Styling (CSS / Tailwind / Bootstrap) - Form layout and responsive design
 */

import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, DollarSign } from "lucide-react";
import Layout from "@/components/layout/layout";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

const editPayrollSchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  payPeriod: z.string().min(1, "Pay period is required"),
  basicSalary: z.string().min(1, "Basic salary is required"),
  overtime: z.string().optional(),
  bonus: z.string().optional(),
  deductions: z.string().optional(),
  status: z.enum(["draft", "processing", "paid"]),
});

export default function EditPayroll({ params }) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { id } = params;

  const { data: payroll, isLoading: payrollLoading } = useQuery({
    queryKey: ["/api/payrolls", id],
  });

  const { data: employees, isLoading: employeesLoading } = useQuery({
    queryKey: ["/api/employees"],
  });

  const form = useForm({
    resolver: zodResolver(editPayrollSchema),
    defaultValues: {
      employeeId: "",
      payPeriod: "",
      basicSalary: "",
      overtime: "0",
      bonus: "0",
      deductions: "0",
      status: "draft",
    },
  });

  // Update form when payroll data loads
  useEffect(() => {
    if (payroll) {
      form.reset({
        employeeId: payroll.employeeId || "",
        payPeriod: payroll.payPeriod || "",
        basicSalary: payroll.basicSalary?.toString() || "",
        overtime: payroll.overtime?.toString() || "0",
        bonus: payroll.bonus?.toString() || "0",
        deductions: payroll.deductions?.toString() || "0",
        status: payroll.status || "draft",
      });
    }
  }, [payroll, form]);

  const updatePayrollMutation = useMutation({
    mutationFn: async (data) => {
      // Calculate net pay
      const basicSalary = parseFloat(data.basicSalary) || 0;
      const overtime = parseFloat(data.overtime) || 0;
      const bonus = parseFloat(data.bonus) || 0;
      const deductions = parseFloat(data.deductions) || 0;
      const netPay = basicSalary + overtime + bonus - deductions;

      const payrollData = {
        ...data,
        basicSalary,
        overtime,
        bonus,
        deductions,
        netPay,
      };

      const response = await apiRequest("PUT", `/api/payrolls/${id}`, payrollData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payrolls"] });
      toast({
        title: "Success",
        description: "Payroll record updated successfully",
      });
      setLocation("/payroll");
    },
    onError: (error) => {
      toast({
        title: "Error", 
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data) => {
    updatePayrollMutation.mutate(data);
  };

  // Calculate net pay in real-time
  const basicSalary = parseFloat(form.watch("basicSalary")) || 0;
  const overtime = parseFloat(form.watch("overtime")) || 0;
  const bonus = parseFloat(form.watch("bonus")) || 0;
  const deductions = parseFloat(form.watch("deductions")) || 0;
  const netPay = basicSalary + overtime + bonus - deductions;

  if (user?.role !== 'admin') {
    setLocation("/");
    return null;
  }

  if (payrollLoading || employeesLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading payroll data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!payroll) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900">Payroll record not found</h2>
          <p className="mt-2 text-gray-600">The payroll record you're looking for doesn't exist.</p>
          <Button
            className="mt-4"
            onClick={() => setLocation("/payroll")}
          >
            Back to Payroll
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation("/payroll")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Payroll
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Payroll Record</h1>
            <p className="text-gray-600 mt-2">Update payroll information</p>
          </div>
        </div>

        <div className="max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Payroll Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="employeeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employee</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
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
                        <FormLabel>Pay Period</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., January 2024, Week 1-2" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="basicSalary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Basic Salary</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="overtime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Overtime Pay</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="bonus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bonus</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0.00" {...field} />
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
                          <FormLabel>Deductions</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Net Pay Display */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <label className="text-sm font-medium text-gray-700">Net Pay (Calculated)</label>
                    <p className="text-2xl font-bold text-green-600">
                      ${netPay.toFixed(2)}
                    </p>
                  </div>

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="processing">Processing</SelectItem>
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
                      disabled={updatePayrollMutation.isPending}
                      className="bg-primary hover:bg-primary/90"
                    >
                      {updatePayrollMutation.isPending ? "Updating..." : "Update Payroll Record"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setLocation("/payroll")}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}