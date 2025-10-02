import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, UserPlus } from 'lucide-react';

export default function RegisterPage() {
  const { registerMutation } = useAuth();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [role] = useState('employee');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  useEffect(() => { setUsername(''); setPassword(''); setEmail(''); setOtp(''); setStep(1); }, []);

  // Step 1: Request OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setIsSendingOtp(true);
    setOtpError('');
    try {
      const res = await fetch('/api/register/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role, email }),
      });
      const data = await res.json();
      if (res.ok) {
        setStep(2);
      } else {
        setOtpError(data.message || 'Failed to send OTP');
      }
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setIsVerifyingOtp(true);
    setOtpError('');
    try {
      const res = await fetch('/api/register/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role, email, otp }),
      });
      const data = await res.json();
      if (res.ok) {
        setLocation('/employee');
      } else {
        setOtpError(data.message || 'Invalid OTP');
      }
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    setOtpError('');
    setIsSendingOtp(true);
    try {
      const res = await fetch('/api/register/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) setOtpError(data.message || 'Failed to resend OTP');
    } finally {
      setIsSendingOtp(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
          <CardDescription>Get started with Loco Payroll Management</CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Username</label>
                <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Choose username" minLength={3} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email address" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create password"
                    minLength={6}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isSendingOtp}>
                {isSendingOtp ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Sending OTP...
                  </div>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" /> Send OTP
                  </>
                )}
              </Button>
              {otpError && <div className="text-red-500 text-sm mt-2">{otpError}</div>}
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Enter OTP sent to {email}</label>
                <Input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter OTP" required />
              </div>
              <Button type="submit" className="w-full" disabled={isVerifyingOtp}>
                {isVerifyingOtp ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Verifying OTP...
                  </div>
                ) : (
                  <>Verify & Create Account</>
                )}
              </Button>
              <Button type="button" variant="link" className="w-full" onClick={handleResendOtp} disabled={isSendingOtp}>
                Resend OTP
              </Button>
              {otpError && <div className="text-red-500 text-sm mt-2">{otpError}</div>}
            </form>
          )}
          <div className="mt-6 text-center text-sm">
            Already have an account?{' '}
            <Button variant="link" className="p-0 h-auto font-semibold" onClick={() => setLocation('/login')}>
              Sign in here
            </Button>
    <Button
      variant="link"
      className="p-0 h-auto font-semibold"
      onClick={() => setLocation("/forgot-password")}
    >
      Forgot Password?
    </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
