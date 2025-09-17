/**
 * 🔹 Frontend (React) - Protected Route Component
 * MERN Concepts Used:
 * ✅ Components - Route protection wrapper component
 * ✅ Props - Component and path props for route configuration
 * ✅ Conditional Rendering - Show component only if authenticated
 * ✅ React Router (Routes) - Route protection and navigation
 * ✅ Context API (for auth state) - Using authentication context
 * ✅ Authorization (Role-based) - User authentication checking
 */

import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

export function ProtectedRoute({
  path,
  component: Component,
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
  <Redirect to="/login" />
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}