import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Layout from "@/components/layout/layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, DollarSign } from "lucide-react";

const payrollSchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  payPeriod: z.string().min(1, "Pay period is required"),
  basicSalary: z.number().min(0, "Basic salary required"),
  overtime: z.number().optional(),
  bonus: z.number().optional(),
  deductions: z.number().optional(),
  status: z.enum(["draft", "processing", "paid"]),
});

export default function AddPayroll() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/employees");
      return res.json();
    },
  });

  const form = useForm({
    resolver: zodResolver(payrollSchema),
    defaultValues: {
      employeeId: "",
      payPeriod: "",
      basicSalary: 0,
      overtime: 0,
      bonus: 0,
      deductions: 0,
      status: "draft",
    },
  });

  const addPayrollMutation = useMutation({
    mutationFn: async (data) => {
      // Convert all numeric fields to numbers
      const basicSalary = Number(data.basicSalary) || 0;
      const overtime = Number(data.overtime) || 0;
      const bonus = Number(data.bonus) || 0;
      const deductions = Number(data.deductions) || 0;

      const netPay = basicSalary + overtime + bonus - deductions;

      const payrollData = {
        ...data,
        basicSalary,
        overtime,
        bonus,
        deductions,
        netPay,
      };

      const res = await apiRequest("POST", "/api/payrolls", payrollData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["payrolls"]);
      toast({ title: "Success", description: "Payroll created successfully" });
      setLocation("/payroll");
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  if (user?.role !== "admin") {
    setLocation("/");
    return null;
  }

  if (isLoading) return <p>Loading employees...</p>;

  const netPay =
    Number(form.watch("basicSalary")) +
    Number(form.watch("overtime")) +
    Number(form.watch("bonus")) -
    Number(form.watch("deductions"));

  return (
    <Layout>
      <div className="space-y-6">
        <Button variant="outline" onClick={() => setLocation("/payroll")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" /> Payroll Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={form.handleSubmit((data) => addPayrollMutation.mutate(data))}
              className="space-y-4"
            >
              {/* Employee Select */}
              <div>
                <label className="block mb-1 font-medium">Employee</label>
                <select {...form.register("employeeId")} className="w-full border p-2 rounded">
                  <option value="" disabled>Select employee</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName}
                    </option>
                  ))}
                </select>
                {form.formState.errors.employeeId && (
                  <p className="text-red-500">{form.formState.errors.employeeId.message}</p>
                )}
              </div>

              {/* Pay Period */}
              <div>
                <Input
                  placeholder="Pay Period e.g., January 2025"
                  {...form.register("payPeriod")}
                />
                {form.formState.errors.payPeriod && (
                  <p className="text-red-500">{form.formState.errors.payPeriod.message}</p>
                )}
              </div>

              {/* Salary Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input type="number" step="0.01" {...form.register("basicSalary")} placeholder="Basic Salary" />
                <Input type="number" step="0.01" {...form.register("overtime")} placeholder="Overtime" />
                <Input type="number" step="0.01" {...form.register("bonus")} placeholder="Bonus" />
                <Input type="number" step="0.01" {...form.register("deductions")} placeholder="Deductions" />
              </div>

              {/* Net Pay */}
              <div className="p-4 bg-gray-50 rounded">
                <p className="font-bold text-green-600">Net Pay: ${netPay}</p>
              </div>

              {/* Status */}
              <div>
                <label className="block mb-1 font-medium">Status</label>
                <select {...form.register("status")} className="w-full border p-2 rounded">
                  <option value="draft">Draft</option>
                  <option value="processing">Processing</option>
                  <option value="paid">Paid</option>
                </select>
                {form.formState.errors.status && (
                  <p className="text-red-500">{form.formState.errors.status.message}</p>
                )}
              </div>

              <div className="flex space-x-4 mt-4">
                <Button type="submit">Create Payroll</Button>
                <Button type="button" variant="outline" onClick={() => setLocation("/payroll")}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
