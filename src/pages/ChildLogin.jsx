import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, KeyRound, Loader2, ArrowLeft, User } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

export default function ChildLogin() {
  const navigate = useNavigate();
  const [usernameInput, setUsernameInput] = useState("");
  const [pin, setPin] = useState(""); 
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const inputVal = usernameInput.trim().toLowerCase();
      
      // Validation Check
      if (!inputVal) {
        throw new Error("Sila masukkan Username anda.");
      }
      if (pin.length < 4) {
        throw new Error("PIN mestilah sekurang-kurangnya 4 aksara.");
      }

      console.log("🚀 Menghubungi sistem Edge Function auth pelayan...");

      // Construct the virtual email format for backend authentication compatibility
      const fakeEmail = inputVal.includes("@") 
        ? inputVal 
        : `child-${inputVal}@studyquest.local`;

      // Log in using the virtual email and PIN as the password
      await base44.auth.loginViaEmailPassword(fakeEmail, pin);

      // Fetch student profile to verify active session
      const user = await base44.auth.me();

      if (user) {
        // Save student metadata for dashboard use
        localStorage.setItem("active_student_id", user.id);
        localStorage.setItem("active_student_name", user.nickname || "Pelajar");
        
        // 🎯 OPTIMIZATION: SPA navigation instead of full page reload
        navigate("/dashboard");
      } else {
        throw new Error("Gagal memuatkan profil murid dari pelayan.");
      }

    } catch (err) {
      console.error("Ralat Log Masuk Anak:", err);
      
      // Cleaned up safe error message extraction
      let safeErrorMessage = "Username atau PIN salah. Sila semak semula.";
      
      if (err instanceof Error) {
        safeErrorMessage = err.message;
      } else if (typeof err === "string") {
        safeErrorMessage = err;
      } else if (err && typeof err === "object" && "message" in err) {
        safeErrorMessage = String(err.message);
      }
      
      setError(safeErrorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      icon={GraduationCap}
      title="Portal Murid StudyQuest 🚀"
      subtitle="Masukkan Username dan PIN anda untuk mula belajar"
      footer={
        <Link to="/login" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Log Masuk Ibu Bapa
        </Link>
      }
    >
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-destructive/10 text-destructive text-xs font-bold border border-destructive/20">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* INPUT 1: USERNAME */}
        <div className="space-y-2">
          <Label htmlFor="username" className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Username / Nama Pengguna
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="username"
              type="text"
              placeholder="Contoh: ali_4021"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              className="pl-10 h-12 rounded-xl border-slate-200 text-sm font-medium"
              autoFocus
              required
            />
          </div>
        </div>

        {/* INPUT 2: PIN 4-DIGIT */}
        <div className="space-y-2">
          <Label htmlFor="pin" className="text-xs font-bold uppercase tracking-wider text-slate-500">
            PIN atau Kata Laluan
          </Label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="pin"
              type="password"
              inputMode="numeric"
              maxLength={6}
              placeholder="••••"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="pl-10 h-12 rounded-xl border-slate-200 text-lg tracking-widest font-black"
              required
            />
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full h-12 font-bold text-sm bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl shadow-md mt-2" 
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Mengesahkan Kod...
            </>
          ) : (
            "Mula Belajar Sekarang ✨"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
