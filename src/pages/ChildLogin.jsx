// src/pages/ChildLogin.jsx
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
      // 1. Bersihkan input username (Selari dengan regex pelayan backend yang membuang ".")
      const cleanUsername = usernameInput.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");

      if (!cleanUsername) {
        throw new Error("Sila masukkan Username anda.");
      }
      if (pin.length < 4) {
        throw new Error("PIN/Password mestilah sekurang-kurangnya 4 digit.");
      }

      // 2. 🚀 UTAMA: Panggil Edge Function log masuk tersuai bagi memintas RLS & Auth Teras
      const response = await base44.functions.invoke("child-login", {
        body: {
          username: cleanUsername,
          password: pin // PIN anak bertindak sebagai kata laluan input
        }
      });

      // 3. Tangani ralat respon daripada pelayan Edge secara selamat
      if (response.error || (response.data && response.data.error)) {
        throw new Error(response.error || response.data.error || "Username atau Kata Laluan salah.");
      }

      const result = response.data;
      if (!result || !result.success) {
        throw new Error("Username atau PIN salah. Sila cuba lagi.");
      }

      const childUser = result.user;

      // 4. Kekalkan state sesi manual dalam localStorage supaya Dashboard mengenali profilenya
      localStorage.setItem("studyquest_user", JSON.stringify(childUser));
      localStorage.setItem("active_student_id", childUser.id);
      localStorage.setItem("active_student_name", childUser.nickname || "Pelajar");

      // 5. Bawa terus masuk ke basecamp pengembaraan
      navigate("/dashboard");

    } catch (err) {
      console.error("Ralat Log Masuk Anak:", err);
      setError(err?.message || "Username atau PIN salah. Sila semak semula.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E8F5E9] via-[#F4FBF7] to-[#FFFDE7] flex items-center justify-center p-4">
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
          <div className="mb-4 p-3 rounded-xl bg-destructive/10 text-destructive text-xs font-bold border border-destructive/20 text-center animate-shake">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* INPUT 1: USERNAME */}
          <div className="space-y-2">
            <Label htmlFor="username" className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Username Watak Pengembara
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="username"
                type="text"
                placeholder="Contoh: alibossku"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                className="pl-10 h-12 rounded-xl border-slate-200 text-sm font-medium focus-visible:ring-emerald-500"
                autoFocus
                required
              />
            </div>
          </div>

          {/* INPUT 2: PIN / PASSWORD */}
          <div className="space-y-2">
            <Label htmlFor="pin" className="text-xs font-bold uppercase tracking-wider text-slate-500">
              PIN Rahsia / Kata Laluan
            </Label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="pin"
                type="password"
                placeholder="••••"
                value={pin}
                onChange={(e) => setPin(e.target.value)} // Dibuang regex \D jika password mengandungi huruf
                className="pl-10 h-12 rounded-xl border-slate-200 text-lg tracking-widest font-black focus-visible:ring-emerald-500"
                required
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl shadow-md mt-2 border-b-4 border-emerald-800 active:border-b-0 active:translate-y-0.5 transition-all" 
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Mengesahkan Watak Anda...
              </>
            ) : (
              "Mula Belajar Sekarang ✨"
            )}
          </Button>
        </form>
      </AuthLayout>
    </div>
  );
}
