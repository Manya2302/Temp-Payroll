import React, { useEffect } from "react";
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
import { ArrowLeft, UserCheck } from "lucide-react";
import Layout from "@/components/layout/layout";
import { useToast } from "@/hooks/use-toast";

const editEmployeeSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  department: z.string().min(1),
  position: z.string().min(1),
  salary: z.number().min(0),
  hireDate: z.date(),
  status: z.enum(["active", "inactive"]),
});

export default function EditEmployee({ params }) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { id } = params;

  const { data: employee, isLoading } = useQuery({
    queryKey: ["/api/employees", id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/employees/${id}`);
      if (!res.ok) throw new Error("Failed to fetch employee");
      return res.json();
    },
  });

  const form = useForm({
    resolver: zodResolver(editEmployeeSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      department: "",
      position: "",
      salary: 0,
      hireDate: new Date(),
      status: "active",
    },
  });

  useEffect(() => {
    if (employee) {
      form.reset({
        firstName: employee.firstName || "",
        lastName: employee.lastName || "",
        email: employee.email || "",
        phone: employee.phone || "",
        department: employee.department || "",
        position: employee.position || "",
        salary: employee.salary ? Number(employee.salary) : 0,
        hireDate: employee.hireDate ? new Date(employee.hireDate) : new Date(),
        status: employee.status || "active",
      });
    }
  }, [employee, form]);

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        ...data,
        salary: Number(data.salary),
        hireDate: data.hireDate.toISOString(),
      };
      const res = await apiRequest("PUT", `/api/employees/${id}`, payload);
      if (!res.ok) throw new Error("Failed to update employee");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({ title: "Success", description: "Employee updated successfully" });
      setLocation("/employees");
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (data) => updateMutation.mutate(data);

  if (user?.role !== "admin") {
    setLocation("/");
    return null;
  }

  if (isLoading) return <Layout><p>Loading...</p></Layout>;
  if (!employee) return <Layout><p>Employee not found</p></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        <Button variant="outline" onClick={() => setLocation("/employees")}>
          <ArrowLeft className="w-4 h-4 mr-2"/> Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5"/> Edit Employee
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                <FormField control={form.control} name="firstName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>

                <FormField control={form.control} name="lastName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>

                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input type="email" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>

                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>

                <FormField control={form.control} name="department" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>

                <FormField control={form.control} name="position" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>

                <FormField control={form.control} name="salary" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Salary</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>

                <FormField control={form.control} name="hireDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hire Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={field.value.toISOString().split("T")[0]}
                        onChange={e => field.onChange(new Date(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>

                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}/>

                <div className="flex space-x-4 pt-4">
                  <Button type="submit" className="bg-primary">{updateMutation.isPending ? "Updating..." : "Update"}</Button>
                  <Button type="button" variant="outline" onClick={() => setLocation("/employees")}>Cancel</Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
