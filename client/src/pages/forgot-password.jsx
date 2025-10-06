import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, KeyRound } from "lucide-react";

export default function ForgotPasswordPage() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resetError, setResetError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Step 1: Request OTP for email
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setIsSendingOtp(true);
    setOtpError("");
    setResetError("");
    try {
      const res = await fetch("/api/forgot-password/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setStep(2);
      } else {
        setResetError(data.message || "Email not found");
      }
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setIsVerifyingOtp(true);
    setOtpError("");
    setResetError("");
    try {
      const res = await fetch("/api/forgot-password/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (res.ok) {
        setStep(3);
      } else {
        setOtpError(data.message || "Invalid OTP");
      }
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Step 3: Reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetError("");
    setSuccessMsg("");
    if (newPassword.length < 6) {
      setResetError("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError("Passwords do not match");
      return;
    }
    try {
      const res = await fetch("/api/forgot-password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg("Password reset successful! Redirecting to login...");
        setTimeout(() => setLocation("/login"), 2000);
      } else {
        setResetError(data.message || "Failed to reset password");
      }
    } catch {
      setResetError("Failed to reset password");
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    setOtpError("");
    setIsSendingOtp(true);
    try {
      const res = await fetch("/api/forgot-password/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) setOtpError(data.message || "Failed to resend OTP");
    } finally {
      setIsSendingOtp(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Forgot Password</CardTitle>
          <CardDescription>Reset your password securely</CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your registered email"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSendingOtp}>
                {isSendingOtp ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Sending OTP...
                  </div>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4 mr-2" /> Send OTP
                  </>
                )}
              </Button>
              {resetError && <div className="text-red-500 text-sm mt-2">{resetError}</div>}
            </form>
          )}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Enter OTP sent to {email}</label>
                <Input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter OTP"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isVerifyingOtp}>
                {isVerifyingOtp ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Verifying OTP...
                  </div>
                ) : (
                  <>Verify OTP</>
                )}
              </Button>
              <Button type="button" variant="link" className="w-full" onClick={handleResendOtp} disabled={isSendingOtp}>
                Resend OTP
              </Button>
              {otpError && <div className="text-red-500 text-sm mt-2">{otpError}</div>}
            </form>
          )}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">New Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
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
              <div>
                <label className="block text-sm font-medium mb-1">Confirm New Password</label>
                <Input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  minLength={6}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                <KeyRound className="w-4 h-4 mr-2" /> Reset Password
              </Button>
              {resetError && <div className="text-red-500 text-sm mt-2">{resetError}</div>}
              {successMsg && <div className="text-green-600 text-sm mt-2">{successMsg}</div>}
            </form>
          )}
          <div className="mt-6 text-center text-sm">
            Didn't get password?{" "}
            <Button variant="link" className="p-0 h-auto font-semibold" onClick={() => setLocation("/login")}>
              Back to Login
            </Button>
            {" | "}
            <Button variant="link" className="p-0 h-auto font-semibold" onClick={() => setLocation("/register")}>
              Register
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}