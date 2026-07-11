import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Lock, Loader2, ArrowLeft, User } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

export default function ChildLogin() {
  const navigate = useNavigate();
  const [usernameInput, setUsernameInput] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const inputVal = usernameInput.trim().toLowerCase();
      
      if (!inputVal) {
        throw new Error("Sila masukkan Username anda.");
      }

      if (!password) {
        throw new Error("Sila masukkan Kata Laluan anda.");
      }

      // 🔄 Panggil custom Edge Function backend yang memproses pengesahan kata laluan secara manual
      const response = await fetch('/api/childLogin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: inputVal,
          password: password
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Username atau kata laluan salah. Sila semak semula.");
      }

      // 💾 Simpan virtual session keys ke dalam localStorage mengikut keperluan AuthContext.jsx
      localStorage.setItem('studyquest_session', JSON.stringify({ 
        userId: result.user.id,
        id: result.user.id 
      }));
      localStorage.setItem('studyquest_user', JSON.stringify(result.user));

      // 🚀 Hala ke dashboard aplikasi setelah berjaya mendaftar masuk
      window.location.href = "/dashboard";
    } catch (err) {
      console.error("Ralat Log Masuk Anak:", err);
      
      let safeErrorMessage = "Username atau kata laluan salah. Sila semak semula.";
      if (err.message && typeof err.message === "string") {
        safeErrorMessage = err.message;
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
      subtitle="Masukkan Username dan Kata Laluan anda untuk mula belajar"
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
        <div className="space-y-2">
          <Label htmlFor="username" className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Username / Nama Pengguna
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="username"
              type="text"
              placeholder="Contoh: morry2"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              className="pl-10 h-12 rounded-xl border-slate-200 text-sm font-medium"
              autoFocus
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Kata Laluan
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12 rounded-xl border-slate-200 text-sm"
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
              Memproses Masuk...
            </>
          ) : (
            "Mula Belajar Sekarang ✨"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
