import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { KeyRound, Loader2, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

export default function ChildLogin() {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleChildLogin = async (e) => {
    e.preventDefault();
    if (pin.length < 4) {
      toast({ 
        title: "Ralat PIN", 
        description: "Sila masukkan 4-digit PIN keselamatan anak anda.", 
        variant: "destructive" 
      });
      return;
    }

    setLoading(true);
    try {
      // 🚀 Memanggil Custom Cloud Function untuk log masuk pelajar menggunakan PIN
      const result = await base44.functions.childLogin({ pin });
      
      if (result?.success) {
        toast({ 
          title: "Log Masuk Berjaya! 🦖", 
          description: "Selamat datang ke StudyQuest, petualang kecil!" 
        });
        
        // 🔗 Navigasi terus ke Dashboard Pelajar (Menghapuskan ralat unused 'navigate')
        navigate("/student/dashboard"); 
      } else {
        throw new Error(result?.message || "PIN tidak sah");
      }
    } catch (err) {
      toast({
        title: "Akses Ditolak 🛑",
        description: err.message || "PIN salah. Sila semak dengan ibu bapa anda.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-amber-50/40 p-4">
      <Card className="w-full max-w-sm rounded-3xl border-orange-100 shadow-md bg-white text-center">
        <CardHeader className="space-y-2">
          {/* Maskot Orang Utan StudyQuest */}
          <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-1 text-2xl select-none">
            🦧
          </div>
          <CardTitle className="text-xl font-black text-slate-800 uppercase tracking-tight">Portal Pelajar 🦖</CardTitle>
          <CardDescription className="text-xs text-slate-400 font-medium">
            Masukkan 4-Digit PIN rahsia anda untuk memulakan misi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChildLogin} className="space-y-5">
            <div className="flex justify-center relative max-w-[200px] mx-auto">
              <KeyRound className="absolute left-3 top-3 h-4 w-4 text-orange-400" />
              <input
                type="password"
                maxLength={4}
                value={pin}
                // Memastikan input hanya menerima nombor integer sahaja
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} 
                placeholder="0000"
                className="w-full pl-10 tracking-[1em] text-center font-black text-xl py-2 bg-orange-50/50 border border-orange-100 focus:border-orange-400 rounded-2xl focus:outline-none text-slate-700"
              />
            </div>

            <Button 
              type="submit" 
              disabled={loading || pin.length < 4} 
              className="w-full h-11 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-sm transition-all"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Gamepad2 className="w-4 h-4 mr-2" />
              )}
              Mulakan Quest!
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
