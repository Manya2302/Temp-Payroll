import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Calculator, Home, Users, DollarSign, CalendarX, Clock, BarChart3, FileText, User, LogOut, CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarProps {
  userRole: 'admin' | 'employee';
}

export function Sidebar({ userRole }: SidebarProps) {
  const { logoutMutation } = useAuth();
  const [location, setLocation] = useLocation();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const adminNavItems = [
    { icon: Home, label: "Dashboard", path: "/admin" },
    { icon: Users, label: "Employees", path: "/employees" },
    { icon: DollarSign, label: "Payroll", path: "/payroll" },
    { icon: CalendarX, label: "Leave Requests", path: "/leaves" },
    { icon: Clock, label: "Attendance", path: "/attendance" },
    { icon: BarChart3, label: "Reports", path: "/reports" },
  ];

  const employeeNavItems = [
    { icon: Home, label: "Dashboard", path: "/employee" },
    { icon: FileText, label: "Payslips", path: "/payroll" },
    { icon: CalendarPlus, label: "Leave Request", path: "/leaves/apply" },
    { icon: Clock, label: "Attendance", path: "/attendance" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  const navItems = userRole === 'admin' ? adminNavItems : employeeNavItems;

  return (
    <div className="w-64 bg-white shadow-lg h-screen fixed left-0 top-0 overflow-y-auto" data-testid="sidebar">
      <div className="p-6 border-b">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Calculator className="text-white h-4 w-4" />
          </div>
          <h1 className="text-xl font-bold text-gray-900" data-testid="text-app-title">
            Loco {userRole === 'admin' ? 'Admin' : ''}
          </h1>
        </div>
      </div>
      
      <nav className="p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path || 
            (item.path === '/admin' && location === '/') ||
            (item.path === '/employee' && location === '/');
          
          return (
            <button
              key={item.path}
              onClick={() => setLocation(item.path)}
              className={cn(
                "w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors",
                isActive 
                  ? "bg-blue-50 text-primary font-medium" 
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
              data-testid={`nav-item-${item.label.toLowerCase().replace(' ', '-')}`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
      
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-white">
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-600 hover:bg-red-50 hover:text-red-600"
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
          data-testid="button-logout"
        >
          <LogOut className="h-5 w-5 mr-3" />
          <span>Logout</span>
        </Button>
      </div>
    </div>
  );
}
