import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
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
  const [step, setStep] = useState("details"); // details → role

  const handleSubmitDetails = (e) => {
    e.preventDefault();
    setError("");

    const cleanUsername = usernameInput.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (!cleanUsername) {
      setError("Username hanya boleh mengandungi huruf, nombor dan garis bawah (_).");
      return;
    }

    if (password.length < 6) {
      setError("Kata laluan mestilah sekurang-kurangnya 6 aksara.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Kata laluan dan sahkan kata laluan tidak sepadan.");
      return;
    }

    // Terus mara ke langkah pemilihan peranan (Tanpa OTP)
    setStep("role");
  };

  const handleRoleSelect = async (selectedRole) => {
    setLoading(true);
    setError("");
    const cleanUsername = usernameInput.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");

    try {
      // 1. Panggil Edge Function pentadbir untuk mencipta akaun tulen secara senyap
      const response = await fetch('/api/functions/publicRegister', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: cleanUsername,
          password: password,
          role: selectedRole
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Gagal mendaftarkan akaun anda.");
      }

      // 2. Log masuk secara automatik menggunakan kaedah Native SDK dengan e-mel proxy
      const childEmail = `${cleanUsername}@studyquest.local`;
      await base44.auth.loginViaEmailPassword(childEmail, password);

      // 3. Simpan data pengesahan sesi aktif
      const loggedInUser = await base44.auth.me();
      if (loggedInUser) {
        localStorage.setItem('studyquest_session', JSON.stringify({ userId: loggedInUser.id, id: loggedInUser.id }));
        localStorage.setItem('studyquest_user', JSON.stringify(loggedInUser));
        
        // 🚀 Bawa terus ke halaman melengkapkan profil
        window.location.href = "/complete-profile";
      } else {
        throw new Error("Pendaftaran berjaya, tetapi gagal memulihkan sesi log masuk.");
      }
    } catch (err) {
      console.error("Ralat pendaftaran:", err);
      setError(err.message || "Pendaftaran gagal. Sila cuba lagi.");
      setStep("details"); // Bawa balik ke form utama jika gagal
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    base44.auth.loginWithProvider("google", "/");
  };

  // --- Langkah 2: Pemilihan Peranan UI ---
  if (step === "role") {
    return (
      <AuthLayout 
        icon={UserPlus} 
        title="Pilih Peranan Anda" 
        subtitle="Sila pilih jenis akaun yang paling sesuai dengan anda"
      >
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">⚠️ {error}</div>
        )}
        <div className="space-y-4 mb-6">
          <RoleOption
            icon={Users}
            title="Saya Ibu Bapa"
            description="Urus dan pantau perkembangan akaun pembelajaran anak-anak anda"
            color="accent"
            onClick={() => handleRoleSelect("parent")}
            disabled={loading}
          />
          <RoleOption
            icon={GraduationCap}
            title="Saya Murid / Pelajar"
            description="Mula belajar secara berdikari dengan akses penuh ke tugasan dan kuiz"
            color="primary"
            onClick={() => handleRoleSelect("student")}
            disabled={loading}
          />
          <RoleOption
            icon={BookOpen}
            title="Saya Guru / Pendidik"
            description="Urus kelas akademik, bina kuiz dan jejak prestasi kumpulan murid"
            color="emerald"
            onClick={() => handleRoleSelect("teacher")}
            disabled={loading}
          />
        </div>
        {loading && (
          <div className="flex items-center justify-center py-2 text-sm font-medium text-muted-foreground animate-pulse">
            <Loader2 className="w-4 h-4 mr-2 animate-spin text-primary" /> Menyediakan akaun anda...
          </div>
        )}
      </AuthLayout>
    );
  }

  // --- Langkah 1: Pengisian Maklumat Asas UI ---
  return (
    <AuthLayout
      icon={UserPlus}
      title="Daftar Akaun Baharu"
      subtitle="Cipta nama pengguna untuk mulakan kembara ilmu anda"
      footer={
        <>
          Sudah mempunyai akaun?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Log masuk
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
        Daftar dengan Google
      </Button>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-3 text-muted-foreground">atau cipta nama pengguna</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmitDetails} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Username / Nama Pengguna</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="username"
              type="text"
              autoFocus
              placeholder="Contoh: amir_99"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              className="pl-10 h-12 rounded-xl"
              required
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password">Kata Laluan</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              placeholder="Minima 6 aksara"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12 rounded-xl"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm">Sahkan Kata Laluan</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="confirm"
              type="password"
              placeholder="Ulang semula kata laluan"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 h-12 rounded-xl"
              required
            />
          </div>
        </div>

        <Button type="submit" className="w-full h-12 font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm mt-2">
          Teruskan ✨
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
