import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Calculator, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  
  const [loginData, setLoginData] = useState({
    username: "",
    password: "",
  });
  
  const [registerData, setRegisterData] = useState({
    username: "",
    password: "",
    role: "employee" as "admin" | "employee",
  });

  // Redirect if already logged in
  if (user) {
    if (user.role === 'admin') {
      setLocation("/admin");
    } else {
      setLocation("/employee");
    }
    return null;
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(loginData);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate(registerData);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex" data-testid="auth-page">
      {/* Left Column - Forms */}
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-6">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Calculator className="text-white h-5 w-5" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900" data-testid="text-app-title">Loco</h1>
            </div>
          </div>

          <Tabs defaultValue="login" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2" data-testid="tabs-auth">
              <TabsTrigger value="login" data-testid="tab-login">Sign In</TabsTrigger>
              <TabsTrigger value="register" data-testid="tab-register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login" data-testid="form-login">
              <Card>
                <CardHeader>
                  <CardTitle data-testid="text-login-title">Welcome back</CardTitle>
                  <CardDescription data-testid="text-login-description">
                    Please sign in to your account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <Label htmlFor="login-username" data-testid="label-username">Username</Label>
                      <Input
                        id="login-username"
                        type="text"
                        placeholder="Enter your username"
                        value={loginData.username}
                        onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                        required
                        data-testid="input-login-username"
                      />
                    </div>
                    <div>
                      <Label htmlFor="login-password" data-testid="label-password">Password</Label>
                      <div className="relative">
                        <Input
                          id="login-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={loginData.password}
                          onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                          required
                          data-testid="input-login-password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowPassword(!showPassword)}
                          data-testid="button-toggle-password"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loginMutation.isPending}
                      data-testid="button-login-submit"
                    >
                      {loginMutation.isPending ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>

                  <div className="mt-6 text-center text-sm text-gray-600" data-testid="demo-credentials">
                    <p className="mb-2 font-medium">Demo Credentials:</p>
                    <p><strong>Admin:</strong> admin / admin@123</p>
                    <p><strong>Employee:</strong> emp / emp@123</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register" data-testid="form-register">
              <Card>
                <CardHeader>
                  <CardTitle data-testid="text-register-title">Create Account</CardTitle>
                  <CardDescription data-testid="text-register-description">
                    Sign up for a new account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                      <Label htmlFor="register-username" data-testid="label-register-username">Username</Label>
                      <Input
                        id="register-username"
                        type="text"
                        placeholder="Enter your username"
                        value={registerData.username}
                        onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                        required
                        data-testid="input-register-username"
                      />
                    </div>
                    <div>
                      <Label htmlFor="register-password" data-testid="label-register-password">Password</Label>
                      <div className="relative">
                        <Input
                          id="register-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={registerData.password}
                          onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                          required
                          data-testid="input-register-password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowPassword(!showPassword)}
                          data-testid="button-toggle-register-password"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="register-role" data-testid="label-register-role">Role</Label>
                      <Select
                        value={registerData.role}
                        onValueChange={(value: "admin" | "employee") => 
                          setRegisterData({ ...registerData, role: value })}
                        data-testid="select-register-role"
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="employee">Employee</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={registerMutation.isPending}
                      data-testid="button-register-submit"
                    >
                      {registerMutation.isPending ? "Creating account..." : "Create Account"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right Column - Hero */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-primary to-blue-700 text-white items-center justify-center p-12">
        <div className="max-w-md text-center">
          <Calculator className="h-16 w-16 mx-auto mb-6 text-white/90" />
          <h2 className="text-3xl font-bold mb-4" data-testid="text-hero-title">
            Welcome to Loco
          </h2>
          <p className="text-lg text-blue-100 mb-6" data-testid="text-hero-description">
            Your comprehensive payroll management solution. Streamline employee management, 
            process payments, track attendance, and generate insightful reports.
          </p>
          <div className="space-y-2 text-sm text-blue-200">
            <p>✓ Employee Management</p>
            <p>✓ Payroll Processing</p>
            <p>✓ Leave Management</p>
            <p>✓ Attendance Tracking</p>
          </div>
        </div>
      </div>
    </div>
  );
}
