import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Mail, Lock, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false); // Mengawal loading butang Google
  const navigate = useNavigate();
  const { toast } = useToast();

  // 1. Pengendali Log Masuk Menggunakan E-mel & Kata Laluan
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "Sila isi semua medan", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      await base44.auth.signIn({ email, password });
      
      const userProfile = await base44.auth.me();
      if (userProfile?.app_role === "parent") {
        navigate("/parent/dashboard");
      } else if (userProfile?.app_role === "student") {
        navigate("/student/dashboard");
      } else {
        navigate("/parent/dashboard");
      }
    } catch (err) {
      toast({
        title: "Log Masuk Gagal",
        description: err.message || "E-mel atau kata laluan salah.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // 2. 🌐 FUNGSI BARU: Pengendali Log Masuk Menggunakan Google OAuth
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      // Memanggil fungsi pengesahan pihak ketiga (OAuth) melalui pembekal Google
      await base44.auth.signInWithOAuth({
        provider: "google",
        options: {
          // Menghantar semula ibu bapa ke dashboard sebaik sahaja selesai pengesahan Google
          redirectTo: `${globalThis.location.origin}/parent/dashboard`
        }
      });
    } catch (err) {
      toast({
        title: "Log Masuk Google Gagal",
        description: err.message || "Gagal menghubungkan sesi ke akaun Google anda.",
        variant: "destructive",
      });
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50/50 p-4">
      <Card className="w-full max-w-md rounded-3xl border-slate-100 shadow-md bg-white">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-black text-slate-800 tracking-tight">Selamat Kembali! 👋</CardTitle>
          <CardDescription className="text-xs text-slate-400 font-medium">Log masuk ke akaun StudyQuest Penjaga</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* 🌐 BUTANG LOG MASUK GOOGLE */}
          <Button 
            type="button"
            disabled={googleLoading || loading}
            onClick={handleGoogleLogin}
            className="w-full h-11 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-bold text-sm shadow-xs flex items-center justify-center gap-2 transition-all"
          >
            {googleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
            ) : (
              /* SVG Ikon Google Standard Rasmi */
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.866-3.577-7.866-8s3.536-8 7.866-8c2.46 0 4.105 1.025 5.047 1.926l3.227-3.11C18.416 1.872 15.606 1 12.24 1c-6.075 0-11 4.925-11 11s4.925 11 11 11c6.34 0 10.556-4.444 10.556-10.74 0-.726-.077-1.282-.176-1.714H12.24z"
                />
              </svg>
            )}
            Log Masuk dengan Google
          </Button>

          {/* Garis Pembahagi Visual (Divider) */}
          <div className="relative flex items-center py-1.5">
            <div className="flex-grow border-t border-slate-100"></div>
            <span className="flex-shrink mx-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Atau guna e-mel</span>
            <div className="flex-grow border-t border-slate-100"></div>
          </div>

          {/* Borang Kredensi Standard */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Alamat E-mel</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  disabled={googleLoading || loading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 focus:border-indigo-500 rounded-xl text-sm focus:outline-none transition-colors text-slate-700 font-medium disabled:opacity-60"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Kata Laluan</label>
                <Link to="/forgot-password" className="text-xs font-bold text-indigo-600 hover:underline">Lupa?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  disabled={googleLoading || loading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 focus:border-indigo-500 rounded-xl text-sm focus:outline-none transition-colors text-slate-700 font-medium disabled:opacity-60"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={loading || googleLoading} 
              className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-sm transition-all mt-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ArrowRight className="w-4 h-4 mr-2" />}
              Log Masuk Akaun
            </Button>
          </form>

          <div className="text-center text-xs text-slate-400 font-medium pt-2">
            Belum mempunyai akaun?{" "}
            <Link to="/register" className="font-bold text-indigo-600 hover:underline">Daftar Penjaga</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
