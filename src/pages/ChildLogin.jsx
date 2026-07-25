import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, KeyRound, Loader2, ArrowLeft, User } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { useAuth } from "@/lib/AuthContext";

export default function ChildLogin() {
  const navigate = useNavigate();
  const { checkUserAuth } = useAuth();
  const [usernameInput, setUsernameInput] = useState("");
  const [pin, setPin] = useState(""); 
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const inputVal = usernameInput.trim();
      
      if (!inputVal) {
        throw new Error("Sila masukkan Username atau ID Murid anda.");
      }
      if (!pin || pin.length < 4) {
        throw new Error("PIN mestilah sekurang-kurangnya 4 digit.");
      }

      // 1. Memanggil Edge Function backend childLogin
      const response = await base44.functions.invoke("childLogin", {
        username: inputVal,
        pin: pin,
      });

      if (!response.data?.success || !response.data?.user) {
        throw new Error(response.data?.error || "Username atau PIN salah. Sila semak semula.");
      }

      const loggedStudent = response.data.user;

      // 2. Menyimpan sesi pembelajaran murid ke localStorage
      const sessionData = {
        userId: loggedStudent.id,
        username: loggedStudent.username,
        student_id: loggedStudent.student_id,
        token: `child_session_${loggedStudent.id}_${Date.now()}`
      };

      localStorage.setItem("studyquest_session", JSON.stringify(sessionData));
      localStorage.setItem("studyquest_user", JSON.stringify(loggedStudent));
      localStorage.setItem("active_student_id", loggedStudent.id);
      localStorage.setItem("active_student_name", loggedStudent.nickname || loggedStudent.full_name || "Pelajar");

      // 3. Kemaskini AuthContext dan terus navigasi ke Dashboard Murid
      if (typeof checkUserAuth === "function") {
        await checkUserAuth();
      }

      navigate("/dashboard");

    } catch (err) {
      console.error("Ralat Log Masuk Anak:", err);
      let safeErrorMessage = "Username atau PIN salah. Sila semak semula.";
      if (err instanceof Error) {
        safeErrorMessage = err.message;
      } else if (typeof err === "string") {
        safeErrorMessage = err;
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
      subtitle="Masukkan Username/ID Murid dan PIN anda untuk mula belajar"
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
        {/* INPUT 1: USERNAME / ID MURID */}
        <div className="space-y-2">
          <Label htmlFor="username" className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Username / ID Murid
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="username"
              type="text"
              placeholder="Contoh: adam_4021 atau SQ-8F3K92"
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
            PIN 4-Digit
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
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
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
              Mengesahkan PIN...
            </>
          ) : (
            "Mula Belajar Sekarang ✨"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
