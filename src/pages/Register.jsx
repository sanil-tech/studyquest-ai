import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, Lock, Loader2, GraduationCap, Users, BookOpen } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { toast } from "@/components/ui/use-toast";

export default function Register() {
  const navigate = useNavigate();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("details");
  const [otpCode, setOtpCode] = useState("");

  const handleSubmitDetails = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await base44.auth.register({ email, password });
      setStep("otp");
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email, otpCode });
      if (result?.access_token) {
        base44.auth.setToken(result.access_token);
      }
      setStep("role");
    } catch (err) {
      setError(err.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError("");
    try {
      await base44.auth.resendOtp(email);
      toast({ title: "Code sent", description: "Check your email for the new code." });
    } catch (err) {
      setError(err.message || "Failed to resend code");
    }
  };

  const handleGoogle = () => {
    base44.auth.loginWithProvider("google", "/");
  };

  const handleRoleSelect = async (role) => {
    setLoading(true);
    setError("");
    try {
      await base44.auth.updateMe({ app_role: role });
      navigate("/complete-profile");
    } catch (err) {
      setError(err.message || "Failed to save role");
      setLoading(false);
    }
  };

  if (step === "role") {
    return <RoleStep onSelect={handleRoleSelect} error={error} />;
  }

  if (step === "otp") {
    return (
      <OtpStep 
        email={email}
        otpCode={otpCode}
        setOtpCode={setOtpCode}
        onVerify={handleVerifyOtp}
        onResend={handleResendOtp}
        loading={loading}
        error={error}
      />
    );
  }

  return (
    <DetailsStep 
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      confirmPassword={confirmPassword}
      setConfirmPassword={setConfirmPassword}
      onSubmit={handleSubmitDetails}
      onGoogle={handleGoogle}
      loading={loading}
      error={error}
    />
  );
}

function DetailsStep({ email, setEmail, password, setPassword, confirmPassword, setConfirmPassword, onSubmit, onGoogle, loading, error }) {
  return (
    <AuthLayout
      icon={UserPlus}
      title="Create your account"
      subtitle="Sign up to get started"
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <Button
        variant="outline"
        className="w-full h-12 text-sm font-medium mb-6"
        onClick={onGoogle}
      >
        <GoogleIcon className="w-5 h-5 mr-2" />
        Continue with Google
      </Button>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-3 text-muted-foreground">or</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="pl-10"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="pl-10"
              required
              minLength={8}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="pl-10"
              required
              minLength={8}
            />
          </div>
        </div>

        <Button type="submit" className="w-full h-12" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating account...
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4 mr-2" />
              Create Account
            </>
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}

function OtpStep({ email, otpCode, setOtpCode, onVerify, onResend, loading, error }) {
  return (
    <AuthLayout
      icon={Lock}
      title="Verify your email"
      subtitle="Enter the 6-digit code we sent to your email"
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex justify-center">
          <InputOTP
            maxLength={6}
            value={otpCode}
            onChange={setOtpCode}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        <Button 
          onClick={onVerify} 
          className="w-full h-12" 
          disabled={otpCode.length !== 6 || loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Verifying...
            </>
          ) : (
            "Verify Code"
          )}
        </Button>

        <div className="text-center text-sm">
          <span className="text-muted-foreground">Didn't receive code? </span>
          <Button variant="link" className="p-0 h-auto" onClick={onResend} disabled={loading}>
            Resend
          </Button>
        </div>
      </div>
    </AuthLayout>
  );
}

function RoleStep({ onSelect, error }) {
  const roles = [
    { 
      id: "student", 
      title: "Student", 
      desc: "I want to learn and earn rewards",
      icon: GraduationCap,
      color: "bg-primary/10 hover:bg-primary/20"
    },
    { 
      id: "parent", 
      title: "Parent", 
      desc: "I want to monitor my child's progress",
      icon: Users,
      color: "bg-accent/10 hover:bg-accent/20"
    },
    { 
      id: "teacher", 
      title: "Teacher", 
      desc: "I want to track my students",
      icon: BookOpen,
      color: "bg-emerald-100 hover:bg-emerald-200"
    },
  ];

  return (
    <AuthLayout
      icon={UserPlus}
      title="Choose your role"
      subtitle="This helps us personalize your experience"
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {roles.map((role) => (
          <button
            key={role.id}
            onClick={() => onSelect(role.id)}
            className={`w-full p-4 rounded-xl border-2 border-border text-left transition-all hover:border-primary ${role.color}`}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/50 flex items-center justify-center">
                <role.icon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">{role.title}</h3>
                <p className="text-sm text-muted-foreground">{role.desc}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </AuthLayout>
  );
}