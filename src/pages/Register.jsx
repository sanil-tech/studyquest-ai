import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, Lock, Loader2, Users, GraduationCap, BookOpen, CheckCircle2 } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { toast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";

export default function Register() {
  const navigate = useNavigate();
  
  // Shared State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("details"); // details → otp → role
  const [otpCode, setOtpCode] = useState("");

  // Handlers
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
      
      // IMPORTANT: Wallet and Progress initialization logic for students 
      // should be moved to a backend hook/trigger to prevent tampering!
      
      navigate("/complete-profile");
    } catch (err) {
      setError(err.message || "Failed to save role");
      setLoading(false);
    }
  };

  // Render Steps
  if (step === "role") {
    return (
      <RoleStep 
        onSelect={handleRoleSelect} 
        error={error} 
      />
    );
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

// --- Step Components ---

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
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden