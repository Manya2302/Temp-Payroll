import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Calculator, Users, DollarSign, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();

  const handleGetStarted = () => {
    if (user?.role === 'admin') {
      setLocation("/admin");
    } else if (user?.role === 'employee') {
      setLocation("/employee");
    } else {
      setLocation("/auth");
    }
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gray-50" data-testid="home-page">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Calculator className="text-white h-4 w-4" />
                </div>
                <h1 className="text-xl font-bold text-gray-900" data-testid="text-app-title">Loco</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <span className="text-gray-700" data-testid="text-user-greeting">
                    Welcome, {user.username}
                  </span>
                  <Button
                    variant="outline"
                    onClick={handleGetStarted}
                    data-testid="button-dashboard"
                  >
                    Dashboard
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleLogout}
                    data-testid="button-logout"
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setLocation("/auth")}
                  data-testid="button-signin"
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6" data-testid="text-hero-title">
            Streamline Your
            <span className="text-primary"> Payroll Management</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto" data-testid="text-hero-description">
            Comprehensive payroll solution inspired by industry leaders. Manage employees, process payments, track attendance, and generate reports with ease.
          </p>
          <Button
            size="lg"
            onClick={handleGetStarted}
            className="text-lg px-8 py-4"
            data-testid="button-get-started"
          >
            Get Started Today
          </Button>
        </div>

        {/* Feature Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6 bg-white rounded-xl shadow-sm border" data-testid="card-feature-employees">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Users className="text-primary h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2" data-testid="text-feature-title-employees">
              Employee Management
            </h3>
            <p className="text-gray-600" data-testid="text-feature-description-employees">
              Complete CRUD operations for employee data, roles, and permissions
            </p>
          </div>
          
          <div className="text-center p-6 bg-white rounded-xl shadow-sm border" data-testid="card-feature-payroll">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <DollarSign className="text-accent h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2" data-testid="text-feature-title-payroll">
              Payroll Processing
            </h3>
            <p className="text-gray-600" data-testid="text-feature-description-payroll">
              Automated salary calculations, payslip generation, and payment tracking
            </p>
          </div>
          
          <div className="text-center p-6 bg-white rounded-xl shadow-sm border" data-testid="card-feature-analytics">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="text-purple-600 h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2" data-testid="text-feature-title-analytics">
              Analytics & Reports
            </h3>
            <p className="text-gray-600" data-testid="text-feature-description-analytics">
              Comprehensive reporting with charts and exportable data formats
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
