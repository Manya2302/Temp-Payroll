import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { 
  Calculator, 
  LayoutDashboard, 
  Users, 
  Calendar, 
  CalendarDays,
  FileText, 
  User, 
  LogOut,
  Menu,
  X,
  Clock,
  IndianRupee,
  Mail,
  Moon,
  Sun,
  Wallet,
  Video,
  FolderKanban,
  ListTodo
} from "lucide-react";
import { useState, useEffect } from "react";

export default function Layout({ children }) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Read initial theme from localStorage (default: false)
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem("theme");
    return stored === "dark";
  });

  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const isAdmin = user?.role === 'admin';

  const navigation = [
    {
      name: 'Dashboard',
      href: isAdmin ? '/admin' : '/employee',
      icon: LayoutDashboard,
      current: location === (isAdmin ? '/admin' : '/employee'),
    },
    ...(isAdmin ? [
      {
        name: 'Employees',
        href: '/employees',
        icon: Users,
        current: location.startsWith('/employees'),
      },
    ] : []),
    {
      name: '  Payroll',
      href: '/payroll',
      icon: IndianRupee,
      current: location.startsWith('/payroll'),
    },
    {
      name: 'Meetings',
      href: isAdmin ? '/admin/meetings' : '/meetings',
      icon: Video,
      current: location.startsWith('/meetings') || location.startsWith('/admin/meetings'),
    },
    ...(isAdmin ? [
      {
        name: 'Projects',
        href: '/admin/projects',
        icon: FolderKanban,
        current: location.startsWith('/admin/projects'),
      },
    ] : [
      {
        name: 'My Tasks',
        href: '/tasks',
        icon: ListTodo,
        current: location.startsWith('/tasks'),
      },
    ]),
    {
      name: 'Leave Requests',
      href: '/leaves',
      icon: Calendar,
      current: location.startsWith('/leaves'),
    },
    {
      name: 'Holiday Calendar',
      href: isAdmin ? '/admin/calendar' : '/employee/calendar',
      icon: CalendarDays,
      current: location.startsWith('/admin/calendar') || location.startsWith('/employee/calendar'),
    },
    {
      name: 'Attendance',
      href: '/attendance',
      icon: Clock,
      current: location.startsWith('/attendance'),
    },
    {
      name: 'Loans',
      href: isAdmin ? '/admin/loans' : '/loans',
      icon: Wallet,
      current: location.startsWith('/loans') || location.startsWith('/admin/loans'),
    },
    ...(isAdmin ? [
      {
        name: 'EMI Tracking',
        href: '/admin/emis',
        icon: FileText,
        current: location === '/admin/emis',
      },
      {
        name: 'Reports',
        href: '/reports',
        icon: FileText,
        current: location === '/reports',
      },
      {
        name: 'Queries',
        href: '/admin/queries',
        icon: Mail,
        current: location === '/admin/queries',
      },
    ] : []),
    {
      name: 'Profile',
      href: '/profile',
      icon: User,
      current: location === '/profile',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 shadow-lg transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Calculator className="text-white h-4 w-4" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-gray-100">Loco</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <nav className="mt-8 px-4 space-y-2">
          {navigation.map((item) => {
            const IconComponent = item.icon;
            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                    item.current
                      ? 'bg-primary text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <IconComponent className="mr-3 h-4 w-4" />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </nav>
        
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <User className="text-white h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user?.username}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
          {/* Theme toggle button */}
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-2"
            onClick={() => setDarkMode((prev) => !prev)}
          >
            {darkMode ? (
              <>
                <Sun className="w-4 h-4 mr-2 text-yellow-400" />
                Switch to Light Theme
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 mr-2 text-gray-700" />
                Switch to Dark Theme
              </>
            )}
          </Button>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 lg:pl-0">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
              <Calculator className="text-white h-3 w-3" />
            </div>
            <span className="font-bold text-gray-900">Loco</span>
          </div>
          <div></div>
        </div>
        
        {/* Page content */}
        <main className="flex-1">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
      
      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}