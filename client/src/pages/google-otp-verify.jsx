import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Mail, UserPlus } from 'lucide-react';

export default function GoogleOtpVerifyPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [step, setStep] = useState(1); // 1: OTP verify, 2: Username input
  const [otp, setOtp] = useState('');
  const [username, setUsername] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    // Get email from URL params
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email');
    if (emailParam) {
      setEmail(emailParam);
    } else {
      toast({
        title: "Error",
        description: "No email found. Please sign in with Google again.",
        variant: "destructive",
      });
      setLocation('/login');
    }
  }, [setLocation, toast]);

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setIsVerifying(true);

    try {
      const res = await fetch('/api/auth/google/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();

      if (res.ok) {
        toast({
          title: "OTP Verified",
          description: "Please choose a username to complete your registration.",
        });
        setStep(2);
      } else {
        toast({
          title: "Verification Failed",
          description: data.message || "Invalid or expired OTP",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to verify OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      const res = await fetch('/api/auth/google/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        toast({
          title: "OTP Resent",
          description: "A new OTP has been sent to your email.",
        });
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to resend OTP",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resend OTP. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCompleteRegistration = async (e) => {
    e.preventDefault();
    setIsCompleting(true);

    try {
      const res = await fetch('/api/auth/google/complete-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username }),
      });

      const data = await res.json();

      if (res.ok) {
        toast({
          title: "Registration Successful",
          description: `Welcome, ${username}!`,
        });
        // Redirect to employee dashboard
        setLocation('/employee');
      } else {
        toast({
          title: "Registration Failed",
          description: data.message || "Failed to complete registration",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete registration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Mail className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {step === 1 ? 'Verify Your Email' : 'Choose Username'}
          </CardTitle>
          <CardDescription>
            {step === 1 
              ? `We've sent a verification code to ${email}`
              : 'Please choose a username for your account'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 ? (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Verification Code</label>
                <Input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  required
                  className="text-center text-lg tracking-widest"
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isVerifying || otp.length !== 6}
              >
                {isVerifying ? 'Verifying...' : 'Verify OTP'}
              </Button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Didn't receive code? Resend
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleCompleteRegistration} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Username</label>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username"
                  required
                  minLength={3}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Username must be at least 3 characters long
                </p>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isCompleting || username.length < 3}
              >
                {isCompleting ? 'Creating Account...' : 'Complete Registration'}
                {!isCompleting && <UserPlus className="ml-2 h-4 w-4" />}
              </Button>
            </form>
          )}
          <div className="mt-4 text-center">
            <button
              onClick={() => setLocation('/login')}
              className="text-sm text-gray-600 hover:underline"
            >
              Back to Login
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
