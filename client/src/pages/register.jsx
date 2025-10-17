// import { useState, useEffect } from 'react';
// import { useLocation } from 'wouter';
// import { useAuth } from '@/hooks/use-auth';
// import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
// import { Input } from '@/components/ui/input';
// import { Button } from '@/components/ui/button';
// import { Eye, EyeOff, UserPlus } from 'lucide-react';

// export default function RegisterPage() {
//   const { registerMutation } = useAuth();
//   const [, setLocation] = useLocation();
//   const [step, setStep] = useState(1);
//   const [username, setUsername] = useState('');
//   const [password, setPassword] = useState('');
//   const [email, setEmail] = useState('');
//   const [role] = useState('employee');
//   const [showPassword, setShowPassword] = useState(false);
//   const [otp, setOtp] = useState('');
//   const [otpError, setOtpError] = useState('');
//   const [isSendingOtp, setIsSendingOtp] = useState(false);
//   const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

//   useEffect(() => { setUsername(''); setPassword(''); setEmail(''); setOtp(''); setStep(1); }, []);

//   // Step 1: Request OTP
//   const handleRequestOtp = async (e) => {
//     e.preventDefault();
//     setIsSendingOtp(true);
//     setOtpError('');
//     try {
//       const res = await fetch('/api/register/request-otp', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ username, password, role, email }),
//       });
//       const data = await res.json();
//       if (res.ok) {
//         setStep(2);
//       } else {
//         setOtpError(data.message || 'Failed to send OTP');
//       }
//     } finally {
//       setIsSendingOtp(false);
//     }
//   };

//   // Step 2: Verify OTP
//   const handleVerifyOtp = async (e) => {
//     e.preventDefault();
//     setIsVerifyingOtp(true);
//     setOtpError('');
//     try {
//       const res = await fetch('/api/register/verify-otp', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ username, password, role, email, otp }),
//       });
//       const data = await res.json();
//       if (res.ok) {
//         setLocation('/employee');
//       } else {
//         setOtpError(data.message || 'Invalid OTP');
//       }
//     } finally {
//       setIsVerifyingOtp(false);
//     }
//   };

//   // Resend OTP
//   const handleResendOtp = async () => {
//     setOtpError('');
//     setIsSendingOtp(true);
//     try {
//       const res = await fetch('/api/register/resend-otp', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ email }),
//       });
//       const data = await res.json();
//       if (!res.ok) setOtpError(data.message || 'Failed to resend OTP');
//     } finally {
//       setIsSendingOtp(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
//       <Card className="w-full max-w-md">
//         <CardHeader className="text-center">
//           <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
//           <CardDescription>Get started with Loco Payroll Management</CardDescription>
//         </CardHeader>
//         <CardContent>
//           {step === 1 ? (
//             <form onSubmit={handleRequestOtp} className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium mb-1">Username</label>
//                 <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Choose username" minLength={3} required />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium mb-1">Email</label>
//                 <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email address" required />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium mb-1">Password</label>
//                 <div className="relative">
//                   <Input
//                     type={showPassword ? 'text' : 'password'}
//                     value={password}
//                     onChange={(e) => setPassword(e.target.value)}
//                     placeholder="Create password"
//                     minLength={6}
//                     required
//                   />
//                   <Button
//                     type="button"
//                     variant="ghost"
//                     size="sm"
//                     className="absolute right-0 top-0 h-full px-3"
//                     onClick={() => setShowPassword(!showPassword)}
//                   >
//                     {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
//                   </Button>
//                 </div>
//               </div>
//               <Button type="submit" className="w-full" disabled={isSendingOtp}>
//                 {isSendingOtp ? (
//                   <div className="flex items-center">
//                     <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
//                     Sending OTP...
//                   </div>
//                 ) : (
//                   <>
//                     <UserPlus className="w-4 h-4 mr-2" /> Send OTP
//                   </>
//                 )}
//               </Button>
//               {otpError && <div className="text-red-500 text-sm mt-2">{otpError}</div>}
//             </form>
//           ) : (
//             <form onSubmit={handleVerifyOtp} className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium mb-1">Enter OTP sent to {email}</label>
//                 <Input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter OTP" required />
//               </div>
//               <Button type="submit" className="w-full" disabled={isVerifyingOtp}>
//                 {isVerifyingOtp ? (
//                   <div className="flex items-center">
//                     <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
//                     Verifying OTP...
//                   </div>
//                 ) : (
//                   <>Verify & Create Account</>
//                 )}
//               </Button>
//               <Button type="button" variant="link" className="w-full" onClick={handleResendOtp} disabled={isSendingOtp}>
//                 Resend OTP
//               </Button>
//               {otpError && <div className="text-red-500 text-sm mt-2">{otpError}</div>}
//             </form>
//           )}
//           <div className="mt-6 text-center text-sm">
//             Already have an account?{' '}
//             <Button variant="link" className="p-0 h-auto font-semibold" onClick={() => setLocation('/login')}>
//               Sign in here
//             </Button>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }
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
              
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or sign up with</span>
                  </div>
                </div>
                
                <div className="mt-6">
                  <a
                    href="/api/auth/google"
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Sign up with Google
                  </a>
                </div>
              </div>
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
             <br/>
            <br/>
            Don't remember Password?&nbsp;&nbsp;
    <Button
      variant="link"
      className="p-0 h-auto font-semibold"
      onClick={() => setLocation("/forgot-password")}
    >
      Forgot Password
    </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}