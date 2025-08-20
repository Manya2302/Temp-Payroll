import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Plus, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import Layout from "@/components/layout/layout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AttendancePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAttendance, setNewAttendance] = useState({
    employeeId: "",
    date: new Date().toISOString().split('T')[0],
    checkIn: "",
    checkOut: "",
    status: "present",
    notes: "",
  });

  const { data: attendanceRecords, isLoading } = useQuery({
    queryKey: ["/api/attendance"],
  });

  const { data: employees } = useQuery({
    queryKey: ["/api/employees"],
    enabled: user?.role === 'admin',
  });

  const addAttendanceMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiRequest("POST", "/api/attendance", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      setShowAddForm(false);
      setNewAttendance({
        employeeId: "",
        date: new Date().toISOString().split('T')[0],
        checkIn: "",
        checkOut: "",
        status: "present",
        notes: "",
      });
      toast({
        title: "Success",
        description: "Attendance record added successfully",
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

  const handleSubmit = (e) => {
    e.preventDefault();
    addAttendanceMutation.mutate(newAttendance);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      present: { variant: "default", icon: CheckCircle, className: "bg-green-100 text-green-800" },
      absent: { variant: "secondary", icon: XCircle, className: "bg-red-100 text-red-800" },
      late: { variant: "warning", icon: AlertCircle, className: "bg-yellow-100 text-yellow-800" },
      "half-day": { variant: "outline", icon: Clock, className: "bg-blue-100 text-blue-800" },
    };
    
    const config = statusConfig[status] || statusConfig.present;
    const IconComponent = config.icon;
    
    return (
      <Badge className={config.className}>
        <IconComponent className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading attendance...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Attendance Management</h1>
            <p className="text-gray-600 mt-2">
              {user?.role === 'admin' 
                ? 'Track and manage employee attendance records' 
                : 'View your attendance history'}
            </p>
          </div>
          {user?.role === 'admin' && (
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Attendance
            </Button>
          )}
        </div>

        {/* Add Attendance Form */}
        {showAddForm && user?.role === 'admin' && (
          <Card>
            <CardHeader>
              <CardTitle>Add Attendance Record</CardTitle>
              <CardDescription>Create a new attendance entry for an employee</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="employee">Employee</Label>
                  <Select
                    value={newAttendance.employeeId}
                    onValueChange={(value) => setNewAttendance({ ...newAttendance, employeeId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees?.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.firstName} {employee.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    type="date"
                    value={newAttendance.date}
                    onChange={(e) => setNewAttendance({ ...newAttendance, date: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="checkIn">Check In Time</Label>
                  <Input
                    type="time"
                    value={newAttendance.checkIn}
                    onChange={(e) => setNewAttendance({ ...newAttendance, checkIn: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="checkOut">Check Out Time</Label>
                  <Input
                    type="time"
                    value={newAttendance.checkOut}
                    onChange={(e) => setNewAttendance({ ...newAttendance, checkOut: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={newAttendance.status}
                    onValueChange={(value) => setNewAttendance({ ...newAttendance, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="present">Present</SelectItem>
                      <SelectItem value="absent">Absent</SelectItem>
                      <SelectItem value="late">Late</SelectItem>
                      <SelectItem value="half-day">Half Day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Input
                    placeholder="Additional notes..."
                    value={newAttendance.notes}
                    onChange={(e) => setNewAttendance({ ...newAttendance, notes: e.target.value })}
                  />
                </div>

                <div className="md:col-span-2 flex gap-2">
                  <Button
                    type="submit"
                    disabled={addAttendanceMutation.isPending}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {addAttendanceMutation.isPending ? "Adding..." : "Add Record"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Attendance Records */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Attendance Records
            </CardTitle>
            <CardDescription>
              {attendanceRecords?.length || 0} records found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {attendanceRecords && attendanceRecords.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {user?.role === 'admin' && <TableHead>Employee</TableHead>}
                      <TableHead>Date</TableHead>
                      <TableHead>Check In</TableHead>
                      <TableHead>Check Out</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Hours Worked</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceRecords.map((record) => {
                      const checkInTime = record.checkIn ? new Date(`1970-01-01T${record.checkIn}`) : null;
                      const checkOutTime = record.checkOut ? new Date(`1970-01-01T${record.checkOut}`) : null;
                      
                      let hoursWorked = 0;
                      if (checkInTime && checkOutTime) {
                        hoursWorked = (checkOutTime - checkInTime) / (1000 * 60 * 60);
                      }

                      return (
                        <TableRow key={record.id}>
                          {user?.role === 'admin' && (
                            <TableCell className="font-medium">
                              {record.employee ? `${record.employee.firstName} ${record.employee.lastName}` : 'N/A'}
                            </TableCell>
                          )}
                          <TableCell>
                            {format(new Date(record.date), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell>
                            {record.checkIn || '-'}
                          </TableCell>
                          <TableCell>
                            {record.checkOut || '-'}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(record.status)}
                          </TableCell>
                          <TableCell>
                            {hoursWorked > 0 ? `${hoursWorked.toFixed(1)}h` : '-'}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-600">
                              {record.notes || '-'}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">No attendance records</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {user?.role === 'admin' 
                    ? 'Start by adding attendance records for your employees.' 
                    : 'Your attendance records will appear here once they are logged.'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}