import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/layout/layout";

export default function EmployeeLoans() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    loanAmount: "",
    repaymentPeriod: "",
    reason: ""
  });

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      const response = await fetch("/api/loans", {
        credentials: "include"
      });
      if (response.ok) {
        const data = await response.json();
        setLoans(data);
      }
    } catch (error) {
      console.error("Error fetching loans:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Loan request submitted successfully"
        });
        setFormData({ loanAmount: "", repaymentPeriod: "", reason: "" });
        fetchLoans();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to submit loan request",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit loan request",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (loanId, emiAmount) => {
    try {
      const response = await fetch(`/api/loans/${loanId}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ paymentId: "razorpay_payment_id" })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Payment processed successfully"
        });
        fetchLoans();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Payment failed",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Payment processing failed",
        variant: "destructive"
      });
    }
  };

  const pendingLoan = loans.find(loan => loan.status === "pending");
  const approvedLoans = loans.filter(loan => loan.status === "approved" && loan.pendingAmount > 0);
  const rejectedLoans = loans.filter(loan => loan.status === "rejected");

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <h1 className="text-3xl font-bold">Employee Loan Management</h1>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Apply for Loan</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="loanAmount">Loan Amount</Label>
                  <Input
                    id="loanAmount"
                    type="number"
                    placeholder="Enter loan amount"
                    value={formData.loanAmount}
                    onChange={(e) => setFormData({ ...formData, loanAmount: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="repaymentPeriod">Repayment Period (months)</Label>
                  <Input
                    id="repaymentPeriod"
                    type="number"
                    placeholder="Enter repayment period"
                    value={formData.repaymentPeriod}
                    onChange={(e) => setFormData({ ...formData, repaymentPeriod: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="reason">Reason for Loan</Label>
                  <Textarea
                    id="reason"
                    placeholder="Enter reason for loan"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    required
                    rows={4}
                  />
                </div>

                {formData.loanAmount && formData.repaymentPeriod && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium">
                      Monthly EMI: ₹{(Number(formData.loanAmount) / Number(formData.repaymentPeriod)).toFixed(2)}
                    </p>
                  </div>
                )}

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Submitting..." : "Submit Loan Request"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Loan Status</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingLoan ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Status:</span>
                    <Badge variant="outline" className="bg-yellow-100">Pending</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Amount:</span>
                    <span>₹{pendingLoan.loanAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Repayment Period:</span>
                    <span>{pendingLoan.repaymentPeriod} months</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Requested Date:</span>
                    <span>{new Date(pendingLoan.requestedDate).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-3">
                    Your loan request is pending approval from admin.
                  </p>
                </div>
              ) : rejectedLoans.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Status:</span>
                    <Badge variant="destructive">Rejected</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Amount:</span>
                    <span>₹{rejectedLoans[0].loanAmount.toFixed(2)}</span>
                  </div>
                  {rejectedLoans[0].remarks && (
                    <div className="mt-3 p-3 bg-red-50 rounded">
                      <p className="text-sm font-medium">Remarks:</p>
                      <p className="text-sm text-muted-foreground">{rejectedLoans[0].remarks}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">No pending loan requests</p>
              )}
            </CardContent>
          </Card>
        </div>

        {approvedLoans.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Approved Loans</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Loan Amount</TableHead>
                    <TableHead>Monthly EMI</TableHead>
                    <TableHead>Pending Amount</TableHead>
                    <TableHead>Next Due Date</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approvedLoans.map((loan) => (
                    <TableRow key={loan._id || loan.id}>
                      <TableCell>₹{loan.loanAmount.toFixed(2)}</TableCell>
                      <TableCell>₹{loan.monthlyEmi.toFixed(2)}</TableCell>
                      <TableCell className="font-semibold">₹{loan.pendingAmount.toFixed(2)}</TableCell>
                      <TableCell>
                        {loan.nextDueDate ? new Date(loan.nextDueDate).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => handlePayment(loan._id || loan.id, loan.monthlyEmi)}
                          disabled={loan.pendingAmount === 0}
                        >
                          Pay Now
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
