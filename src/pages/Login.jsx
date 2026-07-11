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
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "Sila isi semua medan", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // 1. Jalankan proses log masuk pengesahan kredensi
      await base44.auth.login({ email, password });
      
      // 2. 💡 SELESAI: Ambil profil rasmi terus dari pelayan untuk membaca 'app_role' yang tepat
      const userProfile = await base44.auth.me();
      
      if (userProfile?.app_role === "parent") {
        navigate("/parent/dashboard");
      } else if (userProfile?.app_role === "student") {
        navigate("/student/dashboard");
      } else {
        // Jika akaun admin atau peranan tersuai lain
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50/50 p-4">
      <Card className="w-full max-w-md rounded-3xl border-slate-100 shadow-md bg-white">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-black text-slate-800 tracking-tight">Selamat Kembali! 👋</CardTitle>
          <CardDescription className="text-xs text-slate-400 font-medium">Log masuk ke akaun StudyQuest Penjaga</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Alamat E-mel</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 focus:border-indigo-500 rounded-xl text-sm focus:outline-none transition-colors text-slate-700 font-medium"
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 focus:border-indigo-500 rounded-xl text-sm focus:outline-none transition-colors text-slate-700 font-medium"
                />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-sm transition-all mt-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ArrowRight className="w-4 h-4 mr-2" />}
              Log Masuk Akaun
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400 font-medium">
            Belum mempunyai akaun?{" "}
            <Link to="/register" className="font-bold text-indigo-600 hover:underline">Daftar Penjaga</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
