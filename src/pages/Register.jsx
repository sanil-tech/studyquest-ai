import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { appParams } from "@/lib/app-params"; // 💡 DIBAIKI: Diperlukan untuk X-App-Id header
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Lock, Loader2, Users, GraduationCap, BookOpen, CheckCircle2, User } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { motion } from "framer-motion";

export default function Register() {
  const navigate = useNavigate();
  const [usernameInput, setUsernameInput] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("details");

  const handleSubmitDetails = (e) => {
    e.preventDefault();
    setError("");

    const cleanUsername = usernameInput.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (!cleanUsername) {
      setError("Username can only contain letters, numbers, and underscores (_).");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setStep("role");
  };

  const handleRoleSelect = async (selectedRole) => {
    setLoading(true);
    setError("");
    const cleanUsername = usernameInput.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");

    try {
      // 1. 💡 DIBAIKI: Menghantar X-App-Id dan X-App-Token ke Backend Edge Function
      const response = await fetch('/api/functions/publicRegister', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-App-Id': appParams.appId || '', 
          'Authorization': appParams.token ? `Bearer ${appParams.token}` : ''
        },
        body: JSON.stringify({
          username: cleanUsername,
          password: password,
          role: selectedRole
        })
      });

      // Dapatkan teks respons mentah terlebih dahulu untuk mengelakkan ralat JSON parsing jika server crash
      const responseText = await response.text();
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Ralat Pelayan Terus (500): ${responseText.substring(0, 100)}`);
      }

      if (!response.ok || !result.success) {
        throw new Error(result.error || `Gagal mendaftarkan akaun (Status HTTP ${response.status})`);
      }

      // 2. AUTO-LOGIN: Simpan maklumat sesi terus ke peranti pelayar
      if (result.user) {
        localStorage.setItem('studyquest_session', JSON.stringify({ 
          userId: result.user.id, 
          id: result.user.id 
        }));
        localStorage.setItem('studyquest_user', JSON.stringify(result.user));
        
        window.location.href = "/complete-profile";
      } else {
        throw new Error("Pendaftaran berjaya tetapi profil tidak lengkap.");
      }
    } catch (err) {
      console.error("Registration UI caught error:", err);
      setError(err.message || "Registration failed. Please try again.");
      setStep("details"); 
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    base44.auth.loginWithProvider("google", "/");
  };

  if (step === "role") {
    return (
      <AuthLayout 
        icon={UserPlus} 
        title="Choose your role" 
        subtitle="Select the option that best describes you"
      >
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20">
            ⚠️ {error}
          </div>
        )}
        <div className="space-y-4 mb-6">
          <RoleOption
            icon={Users}
            title="I am a Parent"
            description="Create and manage child accounts for learners under 13"
            color="accent"
            onClick={() => handleRoleSelect("parent")}
            disabled={loading}
          />
          <RoleOption
            icon={GraduationCap}
            title="I am a Student"
            description="For students who want to manage their own learning with full account access"
            color="primary"
            onClick={() => handleRoleSelect("student")}
            disabled={loading}
          />
          <RoleOption
            icon={BookOpen}
            title="I am a Teacher"
            description="Manage classes and monitor student progress"
            color="emerald"
            onClick={() => handleRoleSelect("teacher")}
            disabled={loading}
          />
        </div>
        {loading && (
          <div className="flex items-center justify-center py-2 text-sm font-medium text-muted-foreground animate-pulse">
            <Loader2 className="w-4 h-4 mr-2 animate-spin text-primary" /> Setting up your profile workspace...
          </div>
        )}
      </AuthLayout>
    );
  }

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
        onClick={handleGoogle}
      >
        <GoogleIcon className="w-5 h-5 mr-2" />
        Continue with Google
      </Button>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-3 text-muted-foreground">or create a username</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmitDetails} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="username"
              type="text"
              autoFocus
              placeholder="e.g., amir_99"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              className="pl-10 h-12 rounded-xl"
              required
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12 rounded-xl"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="confirm"
              type="password"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 h-12 rounded-xl"
              required
            />
          </div>
        </div>

        <Button type="submit" className="w-full h-12 font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm mt-2">
          Continue ✨
        </Button>
      </form>
    </AuthLayout>
  );
}

function RoleOption({ icon: Icon, title, description, color, onClick, disabled }) {
  const colorClasses = {
    primary: "bg-indigo-50/50 text-indigo-600 border-indigo-100 hover:border-indigo-400",
    accent: "bg-pink-50/50 text-pink-600 border-pink-100 hover:border-pink-400",
    emerald: "bg-emerald-50/50 text-emerald-600 border-emerald-100 hover:border-emerald-400",
  };

  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={`w-full p-4 rounded-2xl border-2 ${colorClasses[color]} transition-all flex items-start gap-4 text-left hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      <div className="w-12 h-12 rounded-xl bg-white border border-inherit flex items-center justify-center shrink-0 shadow-sm">
        <Icon className="w-6 h-6" />
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-slate-800">{title}</h3>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{description}</p>
      </div>
      <CheckCircle2 className="w-5 h-5 text-current opacity-20" />
    </motion.button>
  );
}
