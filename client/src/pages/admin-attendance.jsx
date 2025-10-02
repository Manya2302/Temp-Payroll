import React, { useState } from "react";
import Layout from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function AdminAttendancePage() {
  const [period, setPeriod] = useState("2025-08");
  const [status, setStatus] = useState("Locked");
  const [search, setSearch] = useState("");

  const { data = [], isLoading, refetch } = useQuery({
    queryKey: ["attendance-summary", period],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/attendance/summary?period=${period}`);
      return res;
    }
  });

  const filtered = data.filter(row =>
    row.name.toLowerCase().includes(search.toLowerCase()) ||
    String(row.id).includes(search)
  );

  return (
    <Layout>
      <div className="p-4 rounded shadow mb-4">
        <div className="flex gap-4 items-center border-b pb-2 mb-2">
          <div className="flex gap-2">
            <Button variant="outline" className="px-3 py-1 text-xs font-semibold text-blue-700 border-blue-700">Attendance Summary</Button>
            <Button variant="ghost" className="px-3 py-1 text-xs">Arrear</Button>
            <Button variant="ghost" className="px-3 py-1 text-xs">Payroll</Button>
            <Button variant="ghost" className="px-3 py-1 text-xs">Salary Register</Button>
            <Button variant="ghost" className="px-3 py-1 text-xs">Process Log</Button>
          </div>
        </div>
        <div className="flex gap-4 items-center mb-4">
          <div>
            <label className="block text-xs font-semibold mb-1">Select period:</label>
            <Input type="month" value={period} onChange={e => setPeriod(e.target.value)} className="w-40" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Status:</label>
            <span className={`px-2 py-1 rounded text-xs font-bold ${status === "Locked" ? "bg-gray-200 text-gray-700" : "bg-green-100 text-green-700"}`}>{status}</span>
            <Button size="sm" className="ml-2" onClick={() => setStatus(status === "Locked" ? "Unlocked" : "Locked")}>{status === "Locked" ? "Unlock" : "Lock"}</Button>
          </div>
          <Button className="ml-4 bg-blue-600 text-white px-4 py-2 rounded">Process Attendance</Button>
          <Button className="ml-2 bg-green-600 text-white px-4 py-2 rounded">Add missing employees</Button>
          <div className="ml-auto flex items-center gap-2">
            <Input placeholder="Search" value={search} onChange={e => setSearch(e.target.value)} className="w-40" />
          </div>
        </div>
        <div className="flex items-center mb-2">
          <span className="font-semibold text-xs text-blue-700">Manually updated.</span>
          <Button variant="ghost" size="sm" className="ml-2"><span className="material-icons">print</span> Print</Button>
        </div>
        <div className="overflow-x-auto border rounded">
          <table className="min-w-full text-xs border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-2 py-1">Name</th>
                <th className="border px-2 py-1">Pay Group</th>
                <th className="border px-2 py-1">Total Days</th>
                <th className="border px-2 py-1">Working Days</th>
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
                <th className="border px-2 py-1">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={16} className="text-center py-4">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={16} className="text-center py-4">No data</td></tr>
              ) : (
                filtered.map(row => (
                  <tr key={row.id}>
                    <td className="border px-2 py-1">{row.name}</td>
                    <td className="border px-2 py-1">{row.group}</td>
                    <td className="border px-2 py-1">{row.totalDays}</td>
                    <td className="border px-2 py-1">{row.workingDays}</td>
                    <td className="border px-2 py-1">{row.present}</td>
                    <td className="border px-2 py-1">{row.leave}</td>
                    <td className="border px-2 py-1">{row.travel}</td>
                    <td className="border px-2 py-1">{row.holidays}</td>
                    <td className="border px-2 py-1">{row.weeklyOff}</td>
                    <td className="border px-2 py-1">{row.earlyGoing}</td>
                    <td className="border px-2 py-1">{row.lateComing}</td>
                    <td className="border px-2 py-1">{row.overtime}</td>
                    <td className="border px-2 py-1">{row.absent}</td>
                    <td className="border px-2 py-1">{row.payable}</td>
                    <td className="border px-2 py-1">{row.status}</td>
                    <td className="border px-2 py-1"><Button size="sm" variant="outline">Save</Button></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-4">
          <Button onClick={() => refetch()}>Refresh</Button>
        </div>
      </div>
    </Layout>
  );
}
