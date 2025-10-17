
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar, CheckCircle } from "lucide-react";
import Layout from "@/components/layout/layout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const applyLeaveSchema = z.object({
  leaveType: z.enum(["vacation", "sick", "personal", "maternity", "paternity"]),
  startDate: z.date(),
  endDate: z.date(),
  days: z.number().min(1),
  reason: z.string().optional(),
}).refine(
  (data) => data.endDate >= data.startDate,
  {
    message: "End date must be after start date",
    path: ["endDate"],
  }
);

export default function ApplyLeave() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm({
    resolver: zodResolver(applyLeaveSchema),
    defaultValues: {
      leaveType: "vacation",
      startDate: new Date(),
      endDate: new Date(),
      days: 1,
      reason: "",
    },
  });

  const applyLeaveMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiRequest("POST", "/api/leave-requests", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave-requests"] });
      setIsSubmitted(true);
      toast({
        title: "Success",
        description: "Leave request submitted successfully",
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

  const handleSubmit = async (data) => {
    try {
      // Check leave limit for the month
      const response = await fetch('/api/leave-requests', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const allLeaves = await response.json();
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        // Count leaves in current month
        const leavesThisMonth = allLeaves.filter(leave => {
          const leaveDate = new Date(leave.startDate);
          return leaveDate.getMonth() === currentMonth && 
                 leaveDate.getFullYear() === currentYear;
        });
        
        if (leavesThisMonth.length >= 2) {
          const confirmed = window.confirm(
            'You have already applied for 2 leaves this month. ' +
            'To apply for additional leave, please contact your administrator or manager. ' +
            '\n\nDo you want to proceed anyway?'
          );
          
          if (!confirmed) {
            return;
          }
        }
      }
      
      applyLeaveMutation.mutate(data);
    } catch (error) {
      console.error('Error checking leave limit:', error);
      applyLeaveMutation.mutate(data);
    }
  };

  // Calculate days between dates
  const calculateDays = (startDate, endDate) => {
    if (!startDate || !endDate) return 1;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  // Watch for date changes to calculate days
  const startDate = form.watch("startDate");
  const endDate = form.watch("endDate");
  
  if (startDate && endDate) {
    const days = calculateDays(startDate, endDate);
    form.setValue("days", days);
  }

  if (isSubmitted) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                <h2 className="text-2xl font-bold text-gray-900">Leave Request Submitted!</h2>
                <p className="text-gray-600">
                  Your leave request has been submitted successfully and is pending approval.
                </p>
                <Button onClick={() => setIsSubmitted(false)}>
                  Submit Another Request
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Apply for Leave</h1>
          <p className="text-gray-600 mt-2">Submit a new leave request for approval</p>
        </div>

        <div className="max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Leave Request Form
              </CardTitle>
              <CardDescription>
                Fill out the form below to request time off
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="leaveType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Leave Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select leave type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="vacation">Vacation</SelectItem>
                            <SelectItem value="sick">Sick Leave</SelectItem>
                            <SelectItem value="personal">Personal</SelectItem>
                            <SelectItem value="maternity">Maternity</SelectItem>
                            <SelectItem value="paternity">Paternity</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
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
                          <FormLabel>End Date</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
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
                        <FormLabel>Number of Days</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Calculated automatically"
                            readOnly
                            className="bg-gray-50"
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
                        <FormLabel>Reason (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter reason for leave request"
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
                      className="bg-primary hover:bg-primary/90"
                    >
                      {applyLeaveMutation.isPending ? "Submitting..." : "Submit Request"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => form.reset()}
                    >
                      Reset Form
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