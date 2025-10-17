
import React from "react";
import { useAuth } from "@/hooks/use-auth";
import AdminAttendancePage from "@/pages/admin-attendance.jsx";
import AttendancePage from "@/pages/attendance.jsx";

export default function AttendanceRoute() {
  const { user } = useAuth();
  if (user?.role === "admin") return <AdminAttendancePage />;
  return <AttendancePage />;
}
