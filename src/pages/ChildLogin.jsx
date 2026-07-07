import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { GraduationCap, Key, Lock, AlertCircle, Loader2, ArrowLeft, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { motion } from "framer-motion";
import { toast } from "@/components/ui/use-toast";

export default function ChildLogin() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState(""); // Memegang nilai username atau student_id
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [loginMethod, setLoginMethod] = useState("password");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      const cleanInput = identifier.trim();

      if (!cleanInput) {
        setError("Sila masukkan Username atau ID Pelajar anda.");
        setLoading(false);
        return;
      }

      if (loginMethod === "password" && !password) {
        setError("Sila masukkan kata laluan anda.");
        setLoading(false);
        return;
      }

      if (loginMethod === "pin" && (!pin || pin.length < 4)) {
        setError("Sila masukkan 4-6 digit PIN anda.");
        setLoading(false);
        return;
      }

      // 💡 PEMBETULAN UTAMA: Mengesan jenis input secara automatik
      // Jika input bermula dengan 'SQ', ia akan dihantar sebagai student_id ke backend.
      const isStudentId = cleanInput.toUpperCase().startsWith("SQ");
      
      const payload = {
        student_id: isStudentId ? cleanInput.toUpperCase() : null,
        username: !isStudentId ? cleanInput.toLowerCase() : null,
        password: loginMethod === "password" ? password : null,
        pin: loginMethod === "pin" ? pin : null,
      };

      const response = await base44.functions.invoke("childLogin", payload);

      if (response.data.success) {
        const userData = response.data.user;

        localStorage.setItem('studyquest_session', JSON.stringify({
          type: 'child',
          userId: userData.id,
          loginTime: new Date().toISOString()
        }));
        localStorage.setItem('studyquest_user', JSON.stringify(userData));

        toast({
          title: "Selamat kembali! 🎉",
          description: `Hai ${userData.nickname || "Wira StudyQuest"}!`,
          duration: 2000
        });

        if (userData.profile_completed) {
          navigate("/dashboard");
        } else {
          navigate("/complete-profile");
        }
      } else {
        setError(response.data.error || "Log masuk gagal. Sila semak semula maklumat anda.");
      }
    } catch (err) {
      console.error("Child login error:", err);
      setError(err.response?.data?.error || "Gagal menyambung ke pelayan. Sila cuba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <Card className="w-full border-2 border-primary/20 shadow-xl bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <GraduationCap className="w-8 h-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-primary">
              Selamat Datang ke StudyQuest! 🚀
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Log masuk dengan Username atau ID Pelajar anda
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-4">
            {/* Tukar Kaedah Log Masuk */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
              <Button
                variant={loginMethod === "password" ? "default" : "ghost"}
                size="sm"
                onClick={() => {
                  setLoginMethod("password");
                  setPin("");
                  setError("");
                }}
                className={loginMethod === "password" ? "shadow-sm bg-white text-slate-900" : "text-slate-600"}
              >
                <Key className="w-4 h-4 mr-2" />
                Kata Laluan
              </Button>
              <Button
                variant={loginMethod === "pin" ? "default" : "ghost"}
                size="sm"
                onClick={() => {
                  setLoginMethod("pin");
                  setPassword("");
                  setError("");
                }}
                className={loginMethod === "pin" ? "shadow-sm bg-white text-slate-900" : "text-slate-600"}
              >
                <Lock className="w-4 h-4 mr-2" />
                PIN Akaun
              </Button>
            </div>

            {/* Input Identiti (Username / ID Pelajar) */}
            <div className="space-y-2">
              <Label htmlFor="identifier" className="text-sm font-semibold flex items-center gap-2">
                <User className="w-4 h-4" />
                Username / ID Pelajar
              </Label>
              <Input
                id="identifier"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Contoh: ahmad_abu atau SQ-123456"
                className="text-lg h-12 bg-white"
                autoFocus
              />
            </div>

            {/* Input Kata Laluan Dinamik */}
            {loginMethod === "password" ? (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold">
                  Kata Laluan
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Masukkan kata laluan anda"
                  className="text-lg h-12 bg-white"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="pin" className="text-sm font-semibold">
                  PIN (4-6 digit)
                </Label>
                <Input
                  id="pin"
                  type="password"
                  inputMode="numeric"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  onKeyPress={handleKeyPress}
                  placeholder="••••"
                  className="text-lg h-12 font-mono tracking-widest text-center bg-white"
                  maxLength={6}
                />
              </div>
            )}

            {/* Paparan Ralat */}
            {error && (
              <Alert variant="destructive" className="border-red-300 bg-red-50 text-red-900">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <AlertDescription className="text-sm font-medium ml-2 break-words">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Butang Log Masuk */}
            <Button
              onClick={handleLogin}
              disabled={loading}
              className="w-full h-12 text-lg font-bold rounded-xl mt-2 transition-all active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Memproses masuk...
                </>
              ) : (
                "Masuk Sekarang 🎯"
              )}
            </Button>

            {/* Butang Kembali */}
            <div className="pt-4 pb-2 border-t mt-6">
              <Button
                variant="ghost"
                className="w-full text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-2"
                onClick={() => navigate("/login")}
              >
                <ArrowLeft className="w-4 h-4" />
                Kembali ke Log Masuk Utama
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}