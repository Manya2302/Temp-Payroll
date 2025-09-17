/**
 * 🔹 Frontend (React) - Sidebar Navigation Component
 * MERN Concepts Used:
 * ✅ Components - Navigation sidebar with responsive design
 * ✅ Props - Passing navigation data and user info
 * ✅ State (useState) - Mobile menu open/close state
 * ✅ State with Array - Navigation items array rendering
 * ✅ Event Handling - Menu toggles, logout, navigation clicks
 * ✅ Conditional Rendering - Mobile menu visibility, user role navigation
 * ✅ List Rendering (map) - Rendering navigation items from arrays
 * ✅ React Router (Routes) - Active route detection and navigation
 * ✅ Context API (for auth state) - User authentication and logout
 * ✅ Styling (CSS / Tailwind / Bootstrap) - Responsive sidebar with animations
 */

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  Users, 
  DollarSign, 
  Calendar, 
  Clock, 
  FileText, 
  User, 
  LogOut, 
  Menu,
  X 
} from "lucide-react";
import { Link } from "wouter";

const navigation = {
  admin: [
    { name: 'Dashboard', href: '/admin', icon: Home },
    { name: 'Employees', href: '/employees', icon: Users },
    { name: 'Payroll', href: '/payroll', icon: DollarSign },
    { name: 'Leave Requests', href: '/leaves', icon: Calendar },
    { name: 'Attendance', href: '/attendance', icon: Clock },
    { name: 'Reports', href: '/reports', icon: FileText },
    { name: 'Profile', href: '/profile', icon: User },
  ],
  employee: [
    { name: 'Dashboard', href: '/employee', icon: Home },
    { name: 'Attendance', href: '/attendance', icon: Clock },
    { name: 'Leave Requests', href: '/leaves', icon: Calendar },
    { name: 'Payroll', href: '/payroll', icon: DollarSign },
    { name: 'Profile', href: '/profile', icon: User },
  ],
};

export function Sidebar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!user) return null;

  const userNavigation = navigation[user.role] || [];

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">Loco Payroll</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {userNavigation.map((item) => {
              const isActive = location === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}>
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* User info and logout */}
          <div className="px-4 py-4 border-t border-gray-200">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {user.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{user.username}</p>
                <p className="text-xs text-gray-500 capitalize">{user.role}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}