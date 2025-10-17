import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/layout/layout";
import { Input } from "@/components/ui/input";

export default function AdminEMIs() {
  const { toast } = useToast();
  const [emis, setEmis] = useState([]);
  const [filteredEmis, setFilteredEmis] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEMIs();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = emis.filter(emi => {
        const employeeName = `${emi.employeeId.firstName} ${emi.employeeId.lastName}`.toLowerCase();
        const email = emi.employeeId.email.toLowerCase();
        const transactionId = emi.transactionId.toLowerCase();
        const search = searchTerm.toLowerCase();
        
        return employeeName.includes(search) || 
               email.includes(search) || 
               transactionId.includes(search);
      });
      setFilteredEmis(filtered);
    } else {
      setFilteredEmis(emis);
    }
  }, [searchTerm, emis]);

  const fetchEMIs = async () => {
    try {
      const response = await fetch("/api/emis", {
        credentials: "include"
      });
      if (response.ok) {
        const data = await response.json();
        setEmis(data);
        setFilteredEmis(data);
      }
    } catch (error) {
      console.error("Error fetching EMIs:", error);
      toast({
        title: "Error",
        description: "Failed to fetch EMI records",
        variant: "destructive"
      });
    }
  };

  const downloadInvoice = async (emiId) => {
    try {
      const response = await fetch(`/api/emis/${emiId}/invoice`, {
        credentials: "include"
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `EMI_Invoice_${emiId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        toast({
          title: "Error",
          description: "Failed to download invoice",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download invoice",
        variant: "destructive"
      });
    }
  };

  const totalAmount = filteredEmis.reduce((sum, emi) => sum + emi.amount, 0);
  const completedPayments = filteredEmis.filter(emi => emi.status === 'completed').length;

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <h1 className="text-3xl font-bold">EMI Payment Tracking</h1>

        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredEmis.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Completed Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedPayments}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Amount Collected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalAmount.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>All EMI Payments</CardTitle>
              <Input
                placeholder="Search by employee name, email or transaction ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
            </div>
          </CardHeader>
          <CardContent>
            {filteredEmis.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No EMI payments found</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Payment Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Invoice</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmis.map((emi) => (
                    <TableRow key={emi._id || emi.id}>
                      <TableCell className="font-medium">
                        {emi.employeeId.firstName} {emi.employeeId.lastName}
                      </TableCell>
                      <TableCell>{emi.employeeId.email}</TableCell>
                      <TableCell>{new Date(emi.paymentDate).toLocaleDateString()}</TableCell>
                      <TableCell className="font-semibold">₹{emi.amount.toFixed(2)}</TableCell>
                      <TableCell className="capitalize">{emi.paymentMethod}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {emi.transactionId.substring(0, 20)}...
                      </TableCell>
                      <TableCell>
                        <Badge variant={emi.status === 'completed' ? 'default' : 'secondary'}>
                          {emi.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadInvoice(emi._id || emi.id)}
                        >
                          Download
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
