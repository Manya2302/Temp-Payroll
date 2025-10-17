
import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { Calculator, Users, DollarSign, Calendar, BarChart3, Shield, Clock, FileText, ArrowRight, CheckCircle, Play } from "lucide-react";
import professionalTeamImage from "@assets/generated_images/Professional_office_team_7006007c.png";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AIAssistant from "@/components/AIAssistant";
import * as React from "react";
export default function HomePage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect authenticated users to their dashboard
  React.useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        setLocation("/admin");
      } else {
        setLocation("/employee");
      }
    }
  }, [user, setLocation]);

  // Show loading while checking authentication
  if (user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Navigation */}
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Calculator className="text-white h-6 w-6" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Loco</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/help-us">
                <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white">
                  Help Us
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-primary hover:bg-primary/90">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-left">
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                Modern Payroll
                <span className="block text-primary">Management System</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Streamline your HR operations with our comprehensive payroll management solution. 
                Handle employee data, process payments, track attendance, and generate reports all in one place.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link href="/register">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 px-8 py-4 text-lg">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="px-8 py-4 text-lg border-primary text-primary hover:bg-primary hover:text-white">
                  Watch Demo
                </Button>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 pt-8 border-t">
                <div>
                  <div className="text-2xl font-bold text-primary">500+</div>
                  <div className="text-sm text-gray-600">Companies Trust Us</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">99.9%</div>
                  <div className="text-sm text-gray-600">Uptime Guarantee</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">24/7</div>
                  <div className="text-sm text-gray-600">Customer Support</div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              {/* Professional team image with video overlay */}
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img 
                  src={professionalTeamImage} 
                  alt="Professional team working with payroll management system"
                  className="w-full h-auto aspect-video object-cover"
                />
                
                {/* Video overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end">
                  <div className="p-6 text-white w-full">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold mb-1">See Loco in Action</h3>
                        <p className="text-sm text-gray-200">3-minute product demo</p>
                      </div>
                      <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all cursor-pointer group">
                        <Play className="w-5 h-5 text-white ml-0.5" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary rounded-full opacity-10"></div>
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-blue-300 rounded-full opacity-10"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need for Payroll Management
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our platform provides all the tools you need to manage your workforce efficiently
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-l-4 border-l-blue-500 group">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="group-hover:text-blue-600 transition-colors">Employee Management</CardTitle>
                <CardDescription>
                  Add, edit, and organize your staff with comprehensive employee profiles and role management
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-l-4 border-l-green-500 group">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle className="group-hover:text-green-600 transition-colors">Payroll Processing</CardTitle>
                <CardDescription>
                  Automated salary calculations, tax deductions, and seamless payment processing
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-l-4 border-l-purple-500 group">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle className="group-hover:text-purple-600 transition-colors">Leave Management</CardTitle>
                <CardDescription>
                  Track vacation days, sick leaves, and manage approval workflows effortlessly
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-l-4 border-l-red-500 group">
              <CardHeader>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-red-200 transition-colors">
                  <Clock className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle className="group-hover:text-red-600 transition-colors">Attendance Tracking</CardTitle>
                <CardDescription>
                  Monitor employee attendance, working hours, and generate detailed timesheets
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-l-4 border-l-orange-500 group">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-orange-200 transition-colors">
                  <BarChart3 className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle className="group-hover:text-orange-600 transition-colors">Analytics & Reports</CardTitle>
                <CardDescription>
                  Generate comprehensive reports and gain insights with detailed analytics
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-l-4 border-l-indigo-500 group">
              <CardHeader>
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-indigo-200 transition-colors">
                  <Shield className="h-6 w-6 text-indigo-600" />
                </div>
                <CardTitle className="group-hover:text-indigo-600 transition-colors">Security & Compliance</CardTitle>
                <CardDescription>
                  Enterprise-grade security with role-based access control and data protection
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials & Video Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Trusted by Leading Companies
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              See why hundreds of businesses choose Loco for their payroll management needs
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            {/* Video Section with Professional Image */}
            <div className="order-2 lg:order-1">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <div className="relative">
                  <img 
                    src={professionalTeamImage} 
                    alt="Professional team working with Loco payroll system"
                    className="w-full h-auto aspect-video object-cover"
                  />
                  {/* Video overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/80 to-purple-700/80 flex items-center justify-center">
                    <div className="text-center text-white p-8">
                      <h3 className="text-2xl font-bold mb-4">Product Demo</h3>
                      <p className="text-blue-100 mb-6">Watch how Loco simplifies payroll management in just 3 minutes</p>
                      <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto hover:bg-opacity-30 transition-all cursor-pointer group">
                        <Play className="w-8 h-8 text-white ml-1 group-hover:scale-110 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Benefits */}
            <div className="order-1 lg:order-2">
              <h3 className="text-3xl font-bold text-gray-900 mb-6">
                Why Choose Loco?
              </h3>
              <div className="space-y-6">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Automated Processing</h4>
                    <p className="text-gray-600">Reduce manual work with automated payroll calculations and tax deductions</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Real-time Insights</h4>
                    <p className="text-gray-600">Make informed decisions with comprehensive analytics and reporting</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Enterprise Security</h4>
                    <p className="text-gray-600">Bank-level security with role-based access controls</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900">24/7 Support</h4>
                    <p className="text-gray-600">Get help whenever you need it with our dedicated support team</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to Transform Your Payroll?</h3>
            <p className="text-gray-600 mb-6">Join hundreds of companies already using Loco</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <Link href="/register">
                <Button size="lg" className="flex-1 bg-primary hover:bg-primary/90">
                  Get Started Free
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="flex-1 border-primary text-primary hover:bg-primary hover:text-white">
                Schedule Demo
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-4">No credit card required • 14-day free trial</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Calculator className="text-white h-4 w-4" />
              </div>
              <span className="text-xl font-bold">Loco</span>
            </div>
            <div className="text-center md:text-right">
              <p className="text-gray-400">© 2025 Loco. All rights reserved.</p>
              <p className="text-gray-500 text-sm mt-1">Modern Payroll Management System</p>
            </div>
          </div>
        </div>
      </footer>
      
      <AIAssistant />
    </div>
  );
}