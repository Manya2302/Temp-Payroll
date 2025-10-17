import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import PayPalPayrollButton from "./PayPalPayrollButton";
import { Loader2 } from "lucide-react";

export default function PayrollProcessingModal({ isOpen, onClose, employees, onSuccess }) {
  const { toast } = useToast();
  const [processingMode, setProcessingMode] = useState(null); // 'individual' or 'bulk'
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [pendingMonths, setPendingMonths] = useState([]);
  const [selectedMonths, setSelectedMonths] = useState({});
  const [calculatedPayroll, setCalculatedPayroll] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [pendingEmployees, setPendingEmployees] = useState([]);
  const [payrollConstants, setPayrollConstants] = useState({
    hraPercentage: 0.20,
    travelAllowance: 2000,
    overtimeRatePerHour: 200
  });

  useEffect(() => {
    if (!isOpen) {
      resetState();
    } else {
      // Fetch pending employees when modal opens
      fetchPendingEmployees();
    }
  }, [isOpen]);

  const resetState = () => {
    setProcessingMode(null);
    setSelectedEmployee(null);
    setSelectedEmployees([]);
    setPendingMonths([]);
    setSelectedMonths({});
    setCalculatedPayroll([]);
    setLoading(false);
    setShowPayment(false);
    setPendingEmployees([]);
    setPayrollConstants({
      hraPercentage: 0.20,
      travelAllowance: 2000,
      overtimeRatePerHour: 200
    });
  };

  const fetchPendingEmployees = async () => {
    try {
      const response = await fetch('/api/payroll/pending-employees', { credentials: 'include' });
      const data = await response.json();
      setPendingEmployees(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch pending employees",
        variant: "destructive"
      });
    }
  };

  const fetchPendingMonths = async (employeeId = null) => {
    setLoading(true);
    try {
      const url = employeeId 
        ? `/api/payroll/pending-months/${employeeId}`
        : `/api/payroll/pending-months`;
      const response = await fetch(url, { credentials: 'include' });
      const data = await response.json();
      setPendingMonths(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch pending months",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleModeSelection = async (mode) => {
    setProcessingMode(mode);
    if (mode === 'individual') {
      // Wait for employee selection
    } else {
      // Fetch pending months for all employees
      await fetchPendingMonths();
    }
  };

  const handleEmployeeSelection = async (empId) => {
    setSelectedEmployee(empId);
    await fetchPendingMonths(empId);
  };

  const toggleEmployeeSelection = (empId) => {
    setSelectedEmployees(prev => 
      prev.includes(empId) 
        ? prev.filter(id => id !== empId)
        : [...prev, empId]
    );
  };

  const toggleMonthSelection = (employeeId, month) => {
    setSelectedMonths(prev => {
      const key = `${employeeId}_${month.month}_${month.year}`;
      return {
        ...prev,
        [key]: !prev[key]
      };
    });
  };

  const selectAllEmployees = () => {
    setSelectedEmployees(pendingEmployees.map(e => e._id));
  };

  const calculatePayroll = async () => {
    setLoading(true);
    try {
      const employeeIds = processingMode === 'individual' 
        ? [selectedEmployee]
        : selectedEmployees;

      // Filter selected months based on mode
      const months = [];
      if (processingMode === 'individual') {
        // For individual mode, get months selected for this employee
        pendingMonths.forEach(month => {
          const key = `${selectedEmployee}_${month.month}_${month.year}`;
          if (selectedMonths[key]) {
            months.push({ month: month.month, year: month.year });
          }
        });
      } else {
        // For bulk mode, get all unique months that are selected
        const uniqueMonths = new Set();
        Object.keys(selectedMonths).forEach(key => {
          if (selectedMonths[key]) {
            const [, m, y] = key.split('_');
            uniqueMonths.add(`${m}_${y}`);
          }
        });
        uniqueMonths.forEach(monthKey => {
          const [m, y] = monthKey.split('_');
          months.push({ month: parseInt(m), year: parseInt(y) });
        });
      }

      if (months.length === 0) {
        toast({
          title: "Error",
          description: "Please select at least one month to process",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      if (employeeIds.length === 0) {
        toast({
          title: "Error",
          description: "Please select at least one employee",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      // Validate and sanitize payroll constants to prevent NaN
      // Check for null/undefined before conversion, then check if finite
      const hraVal = payrollConstants.hraPercentage != null ? Number(payrollConstants.hraPercentage) : NaN;
      const travelVal = payrollConstants.travelAllowance != null ? Number(payrollConstants.travelAllowance) : NaN;
      const overtimeVal = payrollConstants.overtimeRatePerHour != null ? Number(payrollConstants.overtimeRatePerHour) : NaN;
      
      const sanitizedConstants = {
        hraPercentage: Number.isFinite(hraVal) ? hraVal : 0.20,
        travelAllowance: Number.isFinite(travelVal) ? travelVal : 2000,
        overtimeRatePerHour: Number.isFinite(overtimeVal) ? overtimeVal : 200
      };

      // Additional validation to ensure valid values
      if (sanitizedConstants.hraPercentage < 0 || sanitizedConstants.hraPercentage > 1) {
        toast({
          title: "Error",
          description: "HRA Percentage must be between 0 and 1",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      if (sanitizedConstants.travelAllowance < 0 || sanitizedConstants.overtimeRatePerHour < 0) {
        toast({
          title: "Error",
          description: "Allowances and rates cannot be negative",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      const response = await fetch('/api/payroll/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          employeeIds, 
          months,
          constants: sanitizedConstants
        })
      });

      if (!response.ok) {
        throw new Error('Failed to calculate payroll');
      }

      const calculations = await response.json();
      
      if (calculations.length === 0) {
        toast({
          title: "Warning",
          description: "No payroll data could be calculated. Please check attendance records.",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      setCalculatedPayroll(calculations);
      setShowPayment(true);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to calculate payroll",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (data) => {
    toast({
      title: "Success",
      description: `Payroll processed successfully for ${calculatedPayroll.length} record(s)`,
    });
    onSuccess();
    onClose();
  };

  const handlePaymentError = (error) => {
    toast({
      title: "Error",
      description: "Payment failed. Please try again.",
      variant: "destructive"
    });
    console.error("Payment error:", error);
  };

  const handlePaymentCancel = () => {
    toast({
      title: "Payment Cancelled",
      description: "You cancelled the payment.",
    });
  };

  const totalNetPay = calculatedPayroll.reduce((sum, p) => sum + p.netSalary, 0);
  const selectedMonthsCount = Object.values(selectedMonths).filter(Boolean).length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Process Payroll</DialogTitle>
          <DialogDescription>
            Pay employees individually or in bulk with automatic payslip generation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Mode Selection */}
          {!processingMode && (
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => handleModeSelection('individual')}
                variant="outline"
                className="h-24 flex flex-col items-center justify-center space-y-2"
              >
                <span className="text-lg font-semibold">Pay Employee Individually</span>
                <span className="text-sm text-gray-500">Select one employee at a time</span>
              </Button>
              <Button
                onClick={() => handleModeSelection('bulk')}
                variant="outline"
                className="h-24 flex flex-col items-center justify-center space-y-2"
              >
                <span className="text-lg font-semibold">Pay All Employees</span>
                <span className="text-sm text-gray-500">Process multiple employees at once</span>
              </Button>
            </div>
          )}

          {/* Individual Employee Selection */}
          {processingMode === 'individual' && !selectedEmployee && (
            <div className="space-y-3">
              <Label>Select Employee (Unpaid Only)</Label>
              <div className="grid gap-2 max-h-60 overflow-y-auto">
                {pendingEmployees.length > 0 ? (
                  pendingEmployees.map(emp => (
                    <Button
                      key={emp._id}
                      variant="outline"
                      onClick={() => handleEmployeeSelection(emp._id)}
                      className="justify-start"
                    >
                      {emp.firstName} {emp.lastName} - {emp.department}
                    </Button>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    All employees have been paid for this month
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Bulk Employee Selection */}
          {processingMode === 'bulk' && !showPayment && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label>Select Employees (Unpaid Only)</Label>
                <Button size="sm" variant="outline" onClick={selectAllEmployees} disabled={pendingEmployees.length === 0}>
                  Add All Employees
                </Button>
              </div>
              <div className="grid gap-2 max-h-40 overflow-y-auto border rounded-md p-3">
                {pendingEmployees.length > 0 ? (
                  pendingEmployees.map(emp => (
                    <div key={emp._id} className="flex items-center space-x-2">
                      <Checkbox
                        checked={selectedEmployees.includes(emp._id)}
                        onCheckedChange={() => toggleEmployeeSelection(emp._id)}
                      />
                      <label className="text-sm">{emp.firstName} {emp.lastName} - {emp.department}</label>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    All employees have been paid for this month
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Pending Months Selection */}
          {pendingMonths.length > 0 && !showPayment && (
            <div className="space-y-3">
              <Label>Select Months to Process</Label>
              <div className="grid gap-2 max-h-40 overflow-y-auto border rounded-md p-3">
                {pendingMonths.map(month => {
                  const key = processingMode === 'individual'
                    ? `${selectedEmployee}_${month.month}_${month.year}`
                    : `all_${month.month}_${month.year}`;
                  return (
                    <div key={key} className="flex items-center space-x-2">
                      <Checkbox
                        checked={selectedMonths[key] || false}
                        onCheckedChange={() => toggleMonthSelection(
                          processingMode === 'individual' ? selectedEmployee : 'all',
                          month
                        )}
                      />
                      <label className="text-sm font-medium">{month.label}</label>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Payroll Constants */}
          {pendingMonths.length > 0 && !showPayment && (
            <div className="space-y-3 border-t pt-4">
              <Label>Payroll Constants</Label>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs">HRA Percentage (0-1)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={payrollConstants.hraPercentage}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                      setPayrollConstants({...payrollConstants, hraPercentage: val});
                    }}
                  />
                </div>
                <div>
                  <Label className="text-xs">Travel Allowance (₹)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={payrollConstants.travelAllowance}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : parseInt(e.target.value);
                      setPayrollConstants({...payrollConstants, travelAllowance: val});
                    }}
                  />
                </div>
                <div>
                  <Label className="text-xs">Overtime Rate/Hour (₹)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={payrollConstants.overtimeRatePerHour}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : parseInt(e.target.value);
                      setPayrollConstants({...payrollConstants, overtimeRatePerHour: val});
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Calculate Button */}
          {selectedMonthsCount > 0 && !showPayment && (
            <div className="border-t pt-4">
              <Button
                onClick={calculatePayroll}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Calculating...
                  </>
                ) : (
                  `Calculate Payroll for ${selectedMonthsCount} Month(s)`
                )}
              </Button>
            </div>
          )}

          {/* Calculated Payroll Display */}
          {showPayment && calculatedPayroll.length > 0 && (
            <div className="space-y-4">
              <div className="border rounded-md p-4 max-h-60 overflow-y-auto">
                <h3 className="font-semibold mb-3">Payroll Summary</h3>
                {calculatedPayroll.map((payroll, index) => (
                  <div key={index} className="border-b pb-2 mb-2 last:border-b-0">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{payroll.employeeName}</p>
                        <p className="text-sm text-gray-600">{payroll.email} - {getMonthName(payroll.month)} {payroll.year}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">${payroll.netSalary.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">{payroll.payableDays} payable days</p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1 grid grid-cols-3 gap-2">
                      <span>Present: {payroll.presentDays}</span>
                      <span>Leave: {payroll.leaveDays}</span>
                      <span>Absent: {payroll.absentDays}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 p-4 rounded-md">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-lg">Total Net Pay:</span>
                  <span className="font-bold text-2xl text-blue-600">${totalNetPay.toFixed(2)}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {calculatedPayroll.length} payroll record(s) will be processed
                </p>
              </div>

              <div className="flex justify-center border-t pt-4">
                <PayPalPayrollButton
                  payrollData={calculatedPayroll}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  onCancel={handlePaymentCancel}
                />
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function getMonthName(month) {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                 'July', 'August', 'September', 'October', 'November', 'December'];
  return months[month - 1];
}
