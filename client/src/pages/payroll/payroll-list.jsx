/**
 * 🔹 Frontend (React) - Payroll List Component
 * MERN Concepts Used:
 * ✅ Components - Payroll management table component
 * ✅ Props - Passing data to child components and layout
 * ✅ State (useState) - Search term state management
 * ✅ State with Array - Managing payrolls and employees arrays
 * ✅ State with Object - Complex payroll and employee objects
 * ✅ useEffect - Data fetching via useQuery on component mount
 * ✅ Event Handling - Search input, delete confirmation, navigation clicks
 * ✅ Form Handling - Search functionality
 * ✅ Conditional Rendering - Role-based access, loading states, empty states
 * ✅ List Rendering (map) - Rendering payroll table rows from array
 * ✅ React Router (Routes, Dynamic Params) - Navigation to edit/add payroll
 * ✅ Context API (for auth state) - Using authentication for role checking
 * ✅ API Calls (fetch / axios) - Fetching and deleting payroll data
 * ✅ Styling (CSS / Tailwind / Bootstrap) - Table and UI styling
 */

import { useState, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Search, Edit, Trash2, FileDown, DollarSign, Upload, Download } from "lucide-react";
import Layout from "@/components/layout/layout";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import PayrollProcessingModal from "@/components/PayrollProcessingModal";

export default function PayrollList() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  const { data: payslips, isLoading: payslipsLoading } = useQuery({
    queryKey: ["/api/payslips"],
  });

  const { data: employees, isLoading: employeesLoading } = useQuery({
    queryKey: ["/api/employees"],
    enabled: user?.role === 'admin',
  });

  const deletePayrollMutation = useMutation({
    mutationFn: async (id) => {
      await apiRequest("DELETE", `/api/payslips/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payslips"] });
      toast({
        title: "Success",
        description: "Payslip deleted successfully",
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

  const getMonthName = (month) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month - 1] || '';
  };

  const filteredPayslips = payslips?.filter(payslip => {
    const searchLower = searchTerm.toLowerCase();
    const payPeriod = `${getMonthName(payslip.month)} ${payslip.year}`.toLowerCase();
    return (
      payPeriod.includes(searchLower) ||
      payslip.employeeName.toLowerCase().includes(searchLower)
    );
  }) || [];

  const handleDeletePayroll = (id) => {
    if (confirm('Are you sure you want to delete this payroll record?')) {
      deletePayrollMutation.mutate(id);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/payslips/template/download');
      if (!response.ok) throw new Error('Failed to download template');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Payroll_Template_${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: "Template downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/payslips/bulk-upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Upload failed');
      }

      toast({
        title: "Success",
        description: result.message || `Successfully uploaded ${result.count} payslip records`,
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/payslips"] });
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  if (payslipsLoading || (user?.role === 'admin' && employeesLoading)) {
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

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payroll Management</h1>
            <p className="text-gray-600 mt-2">
              {user?.role === 'admin' 
                ? 'Manage employee payroll and salary payments' 
                : 'View your payroll history and pay slips'}
            </p>
          </div>
          {user?.role === 'admin' && (
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={handleDownloadTemplate}
              >
                <Download className="w-4 h-4 mr-2" />
                Download Format
              </Button>
              <Button 
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? 'Uploading...' : 'Upload Bulk Offline Payroll'}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button 
                className="bg-primary hover:bg-primary/90"
                onClick={() => setShowProcessingModal(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Process Payroll
              </Button>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search payroll records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Payroll Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Payroll Records ({filteredPayslips.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredPayslips.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {user?.role === 'admin' && <TableHead>Employee</TableHead>}
                      <TableHead>Pay Period</TableHead>
                      <TableHead>Basic Salary</TableHead>
                      <TableHead>Overtime</TableHead>
                      <TableHead>Deductions</TableHead>
                      <TableHead>Net Pay</TableHead>
                      <TableHead>Payment Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayslips.map((payslip) => (
                      <TableRow key={payslip.id}>
                        {user?.role === 'admin' && (
                          <TableCell className="font-medium">
                            {payslip.employeeName}
                          </TableCell>
                        )}
                        <TableCell>{getMonthName(payslip.month)} {payslip.year}</TableCell>
                        <TableCell>{formatCurrency(payslip.basicSalary)}</TableCell>
                        <TableCell>{formatCurrency(payslip.overtimePay || 0)}</TableCell>
                        <TableCell>{formatCurrency(payslip.deductions || 0)}</TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(payslip.netSalary)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {payslip.paymentMode || 'online'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              payslip.paymentStatus === 'paid'
                                ? 'bg-green-100 text-green-800'
                                : payslip.paymentStatus === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }
                          >
                            {payslip.paymentStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              title="Download Pay Slip"
                              onClick={() => {
                                window.open(`/api/payslips/${payslip.id}/download`, '_blank');
                              }}
                            >
                              <FileDown className="w-4 h-4" />
                            </Button>
                            {user?.role === 'admin' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-600 hover:bg-red-50"
                                onClick={() => handleDeletePayroll(payslip.id)}
                                disabled={deletePayrollMutation.isPending}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">No payroll records</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm ? 'No payroll records match your search.' : 'No payroll records have been processed yet.'}
                </p>
                {!searchTerm && user?.role === 'admin' && (
                  <div className="mt-6">
                    <Button 
                      className="bg-primary hover:bg-primary/90"
                      onClick={() => setShowProcessingModal(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Process First Payroll
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payroll Processing Modal */}
      <PayrollProcessingModal
        isOpen={showProcessingModal}
        onClose={() => setShowProcessingModal(false)}
        employees={employees || []}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["/api/payslips"] });
          setShowProcessingModal(false);
        }}
      />
    </Layout>
  );
}