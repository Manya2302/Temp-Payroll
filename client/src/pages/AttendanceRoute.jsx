/**
 * 🔹 Frontend (React) - Attendance Route Component
 * MERN Concepts Used:
 * ✅ Components - Role-based routing wrapper component
 * ✅ Props - Route configuration and user role props
 * ✅ Conditional Rendering - Different components based on user role
 * ✅ React Router (Routes) - Role-based route rendering
 * ✅ Context API (for auth state) - User authentication and role checking
 * ✅ Authorization (Role-based) - Admin vs Employee page access control
 */

import React from "react";
import { useAuth } from "@/hooks/use-auth";
import AdminAttendancePage from "@/pages/admin-attendance.jsx";
import AttendancePage from "@/pages/attendance.jsx";

export default function AttendanceRoute() {
  const { user } = useAuth();
  if (user?.role === "admin") return <AdminAttendancePage />;
  return <AttendancePage />;
}
