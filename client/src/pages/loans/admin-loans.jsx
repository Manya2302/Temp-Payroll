import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/layout/layout";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AdminLoans() {
  const { toast } = useToast();
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [remarks, setRemarks] = useState("");

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

  const handleApprove = async () => {
    if (!selectedLoan) return;
    setLoading(true);

    try {
      const response = await fetch(`/api/loans/${selectedLoan._id || selectedLoan.id}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ remarks })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Loan approved successfully"
        });
        setShowApproveDialog(false);
        setRemarks("");
        setSelectedLoan(null);
        fetchLoans();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to approve loan",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve loan",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedLoan) return;
    setLoading(true);

    try {
      const response = await fetch(`/api/loans/${selectedLoan._id || selectedLoan.id}/reject`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ remarks })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Loan rejected"
        });
        setShowRejectDialog(false);
        setRemarks("");
        setSelectedLoan(null);
        fetchLoans();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to reject loan",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject loan",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const pendingLoans = loans.filter(loan => loan.status === "pending");
  const approvedLoans = loans.filter(loan => loan.status === "approved");
  const rejectedLoans = loans.filter(loan => loan.status === "rejected");
  const allLoans = loans;

  const getEmployeeName = (loan) => {
    if (loan.employeeId && typeof loan.employeeId === 'object') {
      return `${loan.employeeId.firstName || ''} ${loan.employeeId.lastName || ''}`.trim();
    }
    return 'N/A';
  };

  const getEmployeeEmail = (loan) => {
    if (loan.employeeId && typeof loan.employeeId === 'object') {
      return loan.employeeId.email || 'N/A';
    }
    return 'N/A';
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <h1 className="text-3xl font-bold">Loan Management</h1>

        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Loans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{allLoans.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{pendingLoans.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{approvedLoans.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{rejectedLoans.length}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending">Pending Requests</TabsTrigger>
            <TabsTrigger value="all">All Loans</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Pending Loan Requests</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingLoans.length === 0 ? (
                  <p className="text-muted-foreground">No pending loan requests</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Loan Amount</TableHead>
                        <TableHead>Repayment Period</TableHead>
                        <TableHead>Monthly EMI</TableHead>
                        <TableHead>Requested Date</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingLoans.map((loan) => (
                        <TableRow key={loan._id || loan.id}>
                          <TableCell className="font-medium">{getEmployeeName(loan)}</TableCell>
                          <TableCell>{getEmployeeEmail(loan)}</TableCell>
                          <TableCell>₹{loan.loanAmount.toFixed(2)}</TableCell>
                          <TableCell>{loan.repaymentPeriod} months</TableCell>
                          <TableCell>₹{loan.monthlyEmi.toFixed(2)}</TableCell>
                          <TableCell>{new Date(loan.requestedDate).toLocaleDateString()}</TableCell>
                          <TableCell className="max-w-xs truncate">{loan.reason}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedLoan(loan);
                                  setShowApproveDialog(true);
                                }}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setSelectedLoan(loan);
                                  setShowRejectDialog(true);
                                }}
                              >
                                Reject
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle>All Loans</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee Name</TableHead>
                      <TableHead>Loan Amount</TableHead>
                      <TableHead>Pending Amount</TableHead>
                      <TableHead>Next Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allLoans.map((loan) => (
                      <TableRow key={loan._id || loan.id}>
                        <TableCell className="font-medium">{getEmployeeName(loan)}</TableCell>
                        <TableCell>₹{loan.loanAmount.toFixed(2)}</TableCell>
                        <TableCell>₹{loan.pendingAmount.toFixed(2)}</TableCell>
                        <TableCell>
                          {loan.nextDueDate ? new Date(loan.nextDueDate).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              loan.status === "approved" ? "default" :
                              loan.status === "pending" ? "outline" :
                              "destructive"
                            }
                          >
                            {loan.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{loan.remarks || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="approved">
            <Card>
              <CardHeader>
                <CardTitle>Approved Loans</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee Name</TableHead>
                      <TableHead>Loan Amount</TableHead>
                      <TableHead>Pending Amount</TableHead>
                      <TableHead>Monthly EMI</TableHead>
                      <TableHead>Next Due Date</TableHead>
                      <TableHead>Approved Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {approvedLoans.map((loan) => (
                      <TableRow key={loan._id || loan.id}>
                        <TableCell className="font-medium">{getEmployeeName(loan)}</TableCell>
                        <TableCell>₹{loan.loanAmount.toFixed(2)}</TableCell>
                        <TableCell>₹{loan.pendingAmount.toFixed(2)}</TableCell>
                        <TableCell>₹{loan.monthlyEmi.toFixed(2)}</TableCell>
                        <TableCell>
                          {loan.nextDueDate ? new Date(loan.nextDueDate).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {loan.approvedDate ? new Date(loan.approvedDate).toLocaleDateString() : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rejected">
            <Card>
              <CardHeader>
                <CardTitle>Rejected Loans</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee Name</TableHead>
                      <TableHead>Loan Amount</TableHead>
                      <TableHead>Requested Date</TableHead>
                      <TableHead>Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rejectedLoans.map((loan) => (
                      <TableRow key={loan._id || loan.id}>
                        <TableCell className="font-medium">{getEmployeeName(loan)}</TableCell>
                        <TableCell>₹{loan.loanAmount.toFixed(2)}</TableCell>
                        <TableCell>{new Date(loan.requestedDate).toLocaleDateString()}</TableCell>
                        <TableCell>{loan.remarks || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Approve Loan</DialogTitle>
              <DialogDescription>
                Approve loan request for {selectedLoan && getEmployeeName(selectedLoan)}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Remarks (Optional)</label>
                <Textarea
                  placeholder="Add any remarks..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleApprove} disabled={loading}>
                {loading ? "Approving..." : "Approve"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Loan</DialogTitle>
              <DialogDescription>
                Reject loan request for {selectedLoan && getEmployeeName(selectedLoan)}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Reason for Rejection</label>
                <Textarea
                  placeholder="Enter reason for rejection..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={3}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleReject} disabled={loading || !remarks}>
                {loading ? "Rejecting..." : "Reject"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
