
import React, { useState, useEffect } from "react";
import Layout from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function AdminAttendancePage() {
  const [period, setPeriod] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [status, setStatus] = useState("Locked");
  const [search, setSearch] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Calculate maximum allowed month (current month)
  const maxPeriod = (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  })();

  useEffect(() => {
    fetchAttendanceSummary();
  }, [period]);

  const fetchAttendanceSummary = async () => {
    try {
      setLoading(true);
      const [year, month] = period.split('-');
      
      // Validate that selected period is not in the future
      const selectedDate = new Date(parseInt(year), parseInt(month) - 1);
      const currentDate = new Date();
      currentDate.setDate(1); // Set to first day of current month for comparison
      
      if (selectedDate > currentDate) {
        toast({
          title: "Invalid Period",
          description: "Cannot view attendance for future months",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }
      
      const response = await fetch(`/api/attendance/summary?month=${month}&year=${year}`, {
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Failed to fetch attendance data');
      
      const summaryData = await response.json();
      setData(summaryData);
    } catch (error) {
      console.error('Error fetching attendance summary:', error);
      toast({
        title: "Error",
        description: "Failed to load attendance data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const [year, month] = period.split('-');
    const monthName = new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    const printWindow = window.open('', '_blank');
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Attendance Summary - ${monthName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { text-align: center; color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
            th, td { border: 1px solid #ddd; padding: 6px; text-align: center; }
            th { background-color: #f3f4f6; font-weight: 600; }
            tr:nth-child(even) { background-color: #f9fafb; }
            .header { text-align: center; margin-bottom: 20px; }
            @media print { button { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Attendance Summary</h1>
            <p>${monthName}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Department</th>
                <th>Total Days</th>
                <th>Working Days</th>
                <th>Non-Working Days</th>
                <th>Present Days</th>
                <th>Leave Days</th>
                <th>Travel Days</th>
                <th>Holidays</th>
                <th>Weekly Off Days</th>
                <th>Early Going Days</th>
                <th>Late Coming Days</th>
                <th>Overtime Hours</th>
                <th>Absent Days</th>
                <th>Payable Days</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map(row => `
                <tr>
                  <td>${row.name}</td>
                  <td>${row.department}</td>
                  <td>${row.totalDays}</td>
                  <td>${row.workingDays}</td>
                  <td>${row.nonWorkingDays}</td>
                  <td>${row.presentDays}</td>
                  <td>${row.leaveDays}</td>
                  <td>${row.travelDays}</td>
                  <td>${row.holidays}</td>
                  <td>${row.weeklyOffDays}</td>
                  <td>${row.earlyGoingDays}</td>
                  <td>${row.lateComingDays}</td>
                  <td>${row.overtimeHours}</td>
                  <td>${row.absentDays}</td>
                  <td>${row.payableDays}</td>
                  <td>${row.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const filtered = data.filter(row => 
    row.name.toLowerCase().includes(search.toLowerCase()) || 
    row.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div className="bg-white p-4 rounded shadow mb-4">
        <div className="flex gap-4 items-center border-b pb-2 mb-2">
          <div className="flex gap-2">
            <Button variant="outline" className="px-3 py-1 text-xs font-semibold text-blue-700 border-blue-700">Attendance Summary</Button>
          </div>
        </div>
        <div className="flex gap-4 items-center mb-4">
          <div>
            <label className="block text-xs font-semibold mb-1">Select period:</label>
            <Input 
              type="month" 
              value={period} 
              max={maxPeriod}
              onChange={e => setPeriod(e.target.value)} 
              className="w-40" 
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Status:</label>
            <span className={`px-2 py-1 rounded text-xs font-bold ${status === "Locked" ? "bg-gray-200 text-gray-700" : "bg-green-100 text-green-700"}`}>{status}</span>
            <Button size="sm" className="ml-2" onClick={() => setStatus(status === "Locked" ? "Unlocked" : "Locked")}>{status === "Locked" ? "Unlock" : "Lock"}</Button>
          </div>
          <Button className="ml-4 bg-blue-600 text-white px-4 py-2 rounded" onClick={fetchAttendanceSummary}>
            Refresh Data
          </Button>
          <div className="ml-auto flex items-center gap-2">
            <Input 
              placeholder="Search by name or department" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="w-60" 
            />
          </div>
        </div>
        <div className="flex items-center mb-2">
          <span className="font-semibold text-xs text-blue-700">
            {loading ? "Loading..." : `Showing ${filtered.length} employee(s)`}
          </span>
          <Button variant="ghost" size="sm" className="ml-2" onClick={handlePrint}>
            <span className="material-icons mr-1">print</span> Print
          </Button>
        </div>
        <div className="overflow-x-auto border rounded">
          <table className="min-w-full text-xs border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-2 py-1">Name</th>
                <th className="border px-2 py-1">Department</th>
                <th className="border px-2 py-1">Total Days</th>
                <th className="border px-2 py-1">Working Days</th>
                <th className="border px-2 py-1">Non-Working Days</th>
                <th className="border px-2 py-1">Present Days</th>
                <th className="border px-2 py-1">Leave Days</th>
                <th className="border px-2 py-1">Travel Days</th>
                <th className="border px-2 py-1">Holidays</th>
                <th className="border px-2 py-1">Weekly Off Days</th>
                <th className="border px-2 py-1">Early Going Days</th>
                <th className="border px-2 py-1">Late Coming Days</th>
                <th className="border px-2 py-1">Overtime Hours</th>
                <th className="border px-2 py-1">Absent Days</th>
                <th className="border px-2 py-1">Payable Days</th>
                <th className="border px-2 py-1">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="16" className="text-center py-4">Loading attendance data...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="16" className="text-center py-4">No data available</td>
                </tr>
              ) : (
                filtered.map(row => (
                  <tr key={row.id}>
                    <td className="border px-2 py-1">{row.name}</td>
                    <td className="border px-2 py-1">{row.department}</td>
                    <td className="border px-2 py-1">{row.totalDays}</td>
                    <td className="border px-2 py-1">{row.workingDays}</td>
                    <td className="border px-2 py-1">{row.nonWorkingDays}</td>
                    <td className="border px-2 py-1">{row.presentDays}</td>
                    <td className="border px-2 py-1">{row.leaveDays}</td>
                    <td className="border px-2 py-1">{row.travelDays}</td>
                    <td className="border px-2 py-1">{row.holidays}</td>
                    <td className="border px-2 py-1">{row.weeklyOffDays}</td>
                    <td className="border px-2 py-1">{row.earlyGoingDays}</td>
                    <td className="border px-2 py-1">{row.lateComingDays}</td>
                    <td className="border px-2 py-1">{row.overtimeHours}</td>
                    <td className="border px-2 py-1">{row.absentDays}</td>
                    <td className="border px-2 py-1">{row.payableDays}</td>
                    <td className="border px-2 py-1">{row.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
