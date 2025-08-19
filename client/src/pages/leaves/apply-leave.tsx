import { useEffect } from 'react';
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { useLocation, Redirect } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sidebar } from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertLeaveRequestSchema, type InsertLeaveRequest } from "@shared/schema";
import { ArrowLeft } from "lucide-react";

export default function ApplyLeave() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  if (user?.role !== 'employee') {
    return <Redirect to="/" />;
  }

  const form = useForm<Omit<InsertLeaveRequest, 'employeeId'>>({
    resolver: zodResolver(insertLeaveRequestSchema.omit({ employeeId: true })),
    defaultValues: {
      leaveType: "vacation",
      startDate: new Date(),
      endDate: new Date(),
      days: 1,
      reason: "",
    },
  });

  const startDate = form.watch("startDate");
  const endDate = form.watch("endDate");

  // Calculate days automatically
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const timeDiff = end.getTime() - start.getTime();
      const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
      
      if (dayDiff > 0) {
        form.setValue("days", dayDiff);
      }
    }
  }, [startDate, endDate, form]);

  const applyLeaveMutation = useMutation({
    mutationFn: async (data: Omit<InsertLeaveRequest, 'employeeId'>) => {
      const response = await apiRequest("POST", "/api/leave-requests", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave-requests"] });
      setLocation("/leaves");
    },
  });

  const onSubmit = (data: Omit<InsertLeaveRequest, 'employeeId'>) => {
    applyLeaveMutation.mutate(data);
  };

  return (
    <div className="flex min-h-screen bg-gray-50" data-testid="apply-leave-page">
      <Sidebar userRole="employee" />
      
      <div className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b p-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => setLocation("/leaves")}
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900" data-testid="text-page-title">
                Apply for Leave
              </h1>
              <p className="text-gray-600 mt-1" data-testid="text-page-description">
                Submit a new leave request
              </p>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          <div className="max-w-2xl">
            <Card data-testid="card-apply-leave-form">
              <CardHeader>
                <CardTitle data-testid="text-form-title">Leave Request Details</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-testid="form-apply-leave">
                    <FormField
                      control={form.control}
                      name="leaveType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel data-testid="label-leave-type">Leave Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} data-testid="select-leave-type">
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select leave type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="sick">Sick Leave</SelectItem>
                              <SelectItem value="vacation">Vacation</SelectItem>
                              <SelectItem value="personal">Personal</SelectItem>
                              <SelectItem value="maternity">Maternity</SelectItem>
                              <SelectItem value="paternity">Paternity</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel data-testid="label-start-date">Start Date</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                data-testid="input-start-date"
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
                        name="endDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel data-testid="label-end-date">End Date</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                data-testid="input-end-date"
                                value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                                onChange={(e) => field.onChange(new Date(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="days"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel data-testid="label-days">Number of Days</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Calculated automatically"
                              data-testid="input-days"
                              readOnly
                              className="bg-gray-50"
                              {...field}
                              value={field.value || ''}
                              value={field.value || ''}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="reason"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel data-testid="label-reason">Reason (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter reason for leave request"
                              data-testid="input-reason"
                              rows={4}
                              {...field}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex items-center space-x-4 pt-4">
                      <Button
                        type="submit"
                        disabled={applyLeaveMutation.isPending}
                        data-testid="button-submit-leave"
                      >
                        {applyLeaveMutation.isPending ? "Submitting..." : "Submit Leave Request"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setLocation("/leaves")}
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
