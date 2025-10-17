
import React from "react";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Layout from "@/components/layout/layout";
import { useAuth } from "@/hooks/use-auth";

// Mock data for demonstration
const mockAttendance = {
  present: 20,
  leave: 2,
  travel: 1,
  holidays: 0,
  weeklyOff: 8,
  earlyGoing: 0,
  lateComing: 0.5,
  overtime: 0.5,
  absent: 19,
  payable: 8.5,
  totalDays: 26,
  period: "Aug 2025"
};

export default function EmployeeAttendancePage() {
  const { user } = useAuth();
  const data = mockAttendance;

  return (
    <Layout>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>My Attendance</CardTitle>
          <CardDescription>Summary for {data.period}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Present</TableHead>
                <TableHead>Leave</TableHead>
                <TableHead>Travel</TableHead>
                <TableHead>Holidays</TableHead>
                <TableHead>Weekly Off</TableHead>
                <TableHead>Early Going</TableHead>
                <TableHead>Late Coming</TableHead>
                <TableHead>Overtime</TableHead>
                <TableHead>Absent</TableHead>
                <TableHead>Payable</TableHead>
                <TableHead>Total Days</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>{data.present}</TableCell>
                <TableCell>{data.leave}</TableCell>
                <TableCell>{data.travel}</TableCell>
                <TableCell>{data.holidays}</TableCell>
                <TableCell>{data.weeklyOff}</TableCell>
                <TableCell>{data.earlyGoing}</TableCell>
                <TableCell>{data.lateComing}</TableCell>
                <TableCell>{data.overtime}</TableCell>
                <TableCell>{data.absent}</TableCell>
                <TableCell>{data.payable}</TableCell>
                <TableCell>{data.totalDays}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Layout>
  );
}
