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
      const cleanUsername = usernameInput.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");

      if (!cleanUsername) {
        throw new Error("Sila masukkan Username anda.");
      }
      if (pin.length !== 4) {
        throw new Error("PIN mestilah tepat 4 digit angka.");
      }

      // Cari akaun murid berdasarkan username (token ibu bapa digunakan untuk akses RLS)
      const users = await base44.entities.User.filter({ username: cleanUsername });

      if (!users || users.length === 0) {
        throw new Error("Username tidak dijumpai. Sila semak dengan ibu bapa anda.");
      }

      const childUser = users[0];

      // Sahkan akaun adalah murid
      if (childUser.app_role !== "student" || !childUser.is_child_account) {
        throw new Error("Akaun ini bukan akaun murid.");
      }

      // Semak akaun dikunci
      if (childUser.account_locked) {
        throw new Error("Akaun telah dikunci. Sila hubungi ibu bapa anda.");
      }

      // Semak PIN
      if (childUser.pin_hash !== pin) {
        throw new Error("PIN salah. Sila cuba lagi.");
      }

      // Simpan sesi anak dalam localStorage (format yang AuthContext kenali)
      localStorage.setItem("studyquest_session", JSON.stringify({ userId: childUser.id }));
      localStorage.setItem("studyquest_user", JSON.stringify(childUser));
      localStorage.setItem("active_student_id", childUser.id);
      localStorage.setItem("active_student_name", childUser.nickname || childUser.full_name || "Pelajar");

      // Bawa terus ke dashboard anak!
      window.location.href = "/dashboard";

    } catch (err) {
      console.error("Ralat Log Masuk Anak:", err);
      
      // Mengekstrak teks ralat secara selamat
      let safeErrorMessage = "Username atau PIN salah. Sila semak semula.";
      
      if (err) {
        if (typeof err === "string") {
          safeErrorMessage = err;
        } else if (err.message && typeof err.message === "string") {
          safeErrorMessage = err.message;
        } else {
          try {
            safeErrorMessage = err.message ? String(err.message) : JSON.stringify(err);
          } catch (e) {
            safeErrorMessage = "Ralat sistem semasa mendaftar masuk.";
          }
        }
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
            PIN Rahsia (4-Digit)
          </Label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="pin"
              type="password"
              maxLength={4}
              placeholder="••••"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} // Hanya nombor dibenarkan
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