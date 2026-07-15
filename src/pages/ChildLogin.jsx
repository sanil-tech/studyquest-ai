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
      // 1. Bersihkan input username (Dibenarkan ada titik "." kerana format baru mempunyainya)
      const cleanUsername = usernameInput.trim().toLowerCase().replace(/[^a-z0-9_.]/g, "");

      if (!cleanUsername) {
        throw new Error("Sila masukkan Username anda.");
      }
      if (pin.length !== 4) {
        throw new Error("PIN mestilah tepat 4 digit angka.");
      }

      // 2. 🌟 KUNCI UTAMA: Bina semula e-mel maya mengikut domain sistem backend (.internal)
      const virtualEmail = `${cleanUsername}@studyquest.internal`;

      // 3. 🌟 PANGGIL AUTH RASMI: Cetus log masuk rasmi ke dalam pelayan keselamatan SDK
      // Ini akan menyimpan JWT token dan sesi secara automatik ke dalam memori SDK
      const { data, error: authError } = await base44.auth.signInWithPassword({
        email: virtualEmail,
        password: pin, // PIN bertindak sebagai password rasmi
      });

      if (authError) {
        throw new Error("Username atau PIN rahsia salah. Sila semak semula.");
      }

      // 4. Ambil maklumat profil penuh murid yang sah selepas token berjaya dijana
      const childUser = await base44.auth.me();

      if (!childUser) {
        throw new Error("Gagal memuatkan profil murid dari pelayan.");
      }

      // Sahkan peranan akaun untuk keselamatan portal murid
      if (childUser.app_role !== "student") {
        await base44.auth.signOut(); // Tendang keluar jika tersalah masuk
        throw new Error("Akaun ini bukan akaun murid.");
      }

      // 5. Kekalkan state tambahan untuk kegunaan context UI frontend anda
      localStorage.setItem("active_student_id", childUser.id);
      localStorage.setItem("active_student_name", childUser.nickname || childUser.full_name || "Pelajar");

      // 6. Alihkan ke Dashboard secara 'Smooth' tanpa perlu hard reload halaman web
      navigate("/dashboard");

    } catch (err) {
      console.error("Ralat Log Masuk Anak:", err);
      setError(err?.message || "Username atau PIN salah. Sila semak semula.");
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
              placeholder="Contoh: ali.a1b2c3"
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
              Meninggalkan Gerbang Portal...
            </>
          ) : (
            "Mula Belajar Sekarang ✨"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
