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
  const [pin, setPin] = useState(""); // 🎯 Ditukar daripada password kepada pin
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
      if (pin.length !== 4) {
        throw new Error("PIN mestilah tepat 4 digit angka.");
      }

      console.log(`🔎 Menyemak kredensial murid bagi username: ${inputVal}...`);

      // 1. Tapis pangkalan data terus untuk mencari User dengan username tersebut
      const matchingUsers = await base44.entities.User.filter({
        username: inputVal,
        app_role: "student"
      });

      // 2. Semak jika pengguna wujud
      if (!matchingUsers || matchingUsers.length === 0) {
        throw new Error("Username tidak ditemui. Sila semak ejaan nama pengguna pada portal Ibu Bapa.");
      }

      const childAccount = matchingUsers[0];

      // 3. Sahkan padanan PIN menggunakan medan pin_hash daripada Skema JSON
      if (childAccount.pin_hash !== pin) {
        throw new Error("PIN Rahsia salah. Sila masukkan kod PIN yang betul.");
      }

      // 4. Set Sesi Aktif Murid ke dalam memori aplikasi
      localStorage.setItem("active_student_id", childAccount.id);
      localStorage.setItem("active_student_name", childAccount.nickname || childAccount.full_name || "Murid");

      // Log masuk berjaya, bawa ke dashboard utama pelajar
      window.location.href = "/dashboard";

    } catch (err) {
      console.error("Ralat Log Masuk Anak:", err);
      
      let safeErrorMessage = "Username atau PIN salah. Sila semak semula.";
      if (typeof err === "string") {
        safeErrorMessage = err;
      } else if (err.message && typeof err.message === "string") {
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
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} // Hanya terima angka
              className="pl-10 h-12 rounded-xl border-slate-200 text-sm tracking-widest"
              required
            />
          </div>
        </div>

        {/* BUTANG HANTAR */}
        <Button 
          type="submit" 
          className="w-full h-12 font-bold text-sm bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl shadow-md mt-2" 
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Mengesahkan Kod Portal Murid...
            </>
          ) : (
            "Mula Belajar Sekarang ✨"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
