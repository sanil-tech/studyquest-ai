import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, UserPlus, Loader2, KeyRound, CheckCircle2, Copy, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

export default function AddChildModal({ open, onOpenChange, onChildAdded }) {
  // Data borang input
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [pin, setPin] = useState(""); // 💡 Ditambah untuk kawalan PIN rahsia anak
  
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false); // Mengawal skrin kejayaan paparan PIN
  const { toast } = useToast();

  const handleRegisterChild = async (e) => {
    e.preventDefault();
    if (!fullName || !email || !pin) {
      toast({ title: "Medan Wajib", description: "Sila isi Nama Penuh, E-mel, dan PIN 4-Digit anak.", variant: "destructive" });
      return;
    }
    if (pin.length !== 4) {
      toast({ title: "Format PIN Salah", description: "PIN mestilah tepat 4 digit nombor.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const me = await base44.auth.me();

      // 1. Cipta akaun pengguna baharu untuk anak di dalam pangkalan data User
      const newStudent = await base44.entities.User.create({
        full_name: fullName,
        email: email,
        nickname: nickname || fullName.split(" ")[0], // Fallback nama panggilan
        app_role: "student",
        child_login_pin: pin, // 🔐 Menyimpan PIN log masuk ke dalam pangkalan data
        status: "active"
      });

      // 2. Cipta hubungan pautan rasmi antara Ibu Bapa (aktif log masuk) dengan Anak baharu ini
      await base44.entities.ParentChildRelationship.create({
        parent_id: me.id,
        child_id: newStudent.id,
        status: "active"
      });

      // Trigger fungsi refresh data pada parent dashboard secara automatik
      onChildAdded();
      
      // Tukar modal kepada mod paparan kejayaan PIN
      setIsSuccess(true);
    } catch (err) {
      toast({
        title: "Pendaftaran Gagal",
        description: err.message || "E-mel anak mungkin sudah didaftarkan dalam sistem.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Set semula borang ke keadaan asal apabila modal ditutup sepenuhnya
  const handleCloseModal = () => {
    setFullName("");
    setEmail("");
    setNickname("");
    setPin("");
    setIsSuccess(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!loading) { if (!v) handleCloseModal(); else onOpenChange(v); } }}>
      <DialogContent className="sm:max-w-md rounded-3xl bg-white p-6 border-slate-100 shadow-xl overflow-hidden">
        
        <AnimateAndContent isSuccess={isSuccess}>
          {!isSuccess ? (
            /* ==========================================
               PAPARAN 1: BORANG PENDAFTARAN ANAK
               ========================================== */
            <>
              <DialogHeader className="text-center sm:text-left">
                <DialogTitle className="text-lg font-black text-slate-800 flex items-center gap-2 justify-center sm:justify-start">
                  <UserPlus className="w-5 h-5 text-indigo-600" /> Daftarkan Akaun Anak Baru
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400 font-medium">
                  Cipta profil pembelajaran digital khusus untuk anak anda di bawah kawalan penuh penjaga.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleRegisterChild} className="space-y-4 mt-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Nama Penuh Anak *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Contoh: Muhammad Ali"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs focus:outline-none focus:border-indigo-500 font-medium text-slate-700"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Nama Panggilan</label>
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="Contoh: Ali"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs focus:outline-none focus:border-indigo-500 font-medium text-slate-700"
                    />
                  </div>

                  <div className="space-y-1">
                    {/* 🔐 BAHAGIAN INPUT PIN BARU */}
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-0.5 text-orange-600">
                      <KeyRound className="w-3 h-3" /> Set PIN 4-Digit *
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      required
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} // Hanya terima nombor sahaja
                      placeholder="0000"
                      className="w-full px-3 py-2 bg-orange-50/30 border border-orange-100 rounded-xl text-xs focus:outline-none focus:border-orange-500 text-center font-black tracking-widest text-slate-700"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Alamat E-mel Anak *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ali@studyquest.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs focus:outline-none focus:border-indigo-500 font-medium text-slate-700"
                  />
                </div>

                <div className="flex gap-2 pt-2 justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={loading}
                    onClick={handleCloseModal}
                    className="rounded-xl text-xs font-bold text-slate-500 h-9 px-4 hover:bg-slate-50"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs h-9 px-5 shadow-sm"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
                    Sahkan & Cipta Akaun
                  </Button>
                </div>
              </form>
            </>
          ) : (
            /* ==========================================
               PAPARAN 2: SKRIN KEJAYAAN KREDENSI PIN ANAK
               ========================================== */
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-500">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              
              <div>
                <h3 className="text-base font-black text-slate-800 tracking-tight">Akaun Anak Berjaya Dicipta! 🎉</h3>
                <p className="text-xs text-slate-400 font-medium mt-1">Sila berikan maklumat rahsia ini kepada anak anda untuk log masuk.</p>
              </div>

              {/* Kad Sijil Tiket Akses Pelajar */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50/60 border border-orange-100 p-4 rounded-2xl text-left space-y-3 relative overflow-hidden">
                <div className="absolute -right-6 -bottom-6 text-orange-200/40 font-black text-6xl select-none">🦖</div>
                
                <div className="text-xs">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Petualang Cilik</p>
                  <p className="font-black text-slate-700 text-sm mt-0.5 uppercase">{nickname || fullName}</p>
                </div>

                <div className="text-xs">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">E-mel Masuk</p>
                  <p className="font-semibold text-slate-600 truncate mt-0.5">{email}</p>
                </div>

                <div className="border-t border-orange-100/60 my-1" />

                <div className="flex justify-between items-center bg-white px-3 py-2 rounded-xl border border-orange-100/80">
                  <div>
                    <p className="text-[9px] font-bold text-orange-500 uppercase tracking-wider flex items-center gap-0.5">
                      <Sparkles className="w-3 h-3 text-amber-500" /> PIN Portal Rahsia
                    </p>
                    <p className="text-xl font-black tracking-[0.4em] text-slate-800 mt-0.5">{pin}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      navigator.clipboard.writeText(`Nama: ${fullName}\nEmail: ${email}\nPIN: ${pin}`);
                      toast({ title: "Berjaya Disalin!", description: "Kredensi akaun anak telah disimpan dalam clipboard anda." });
                    }}
                    className="h-8 w-8 p-0 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 shrink-0"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  onClick={handleCloseModal}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs h-10"
                >
                  Selesai & Tutup Borang
                </Button>
              </div>
            </div>
          )}
        </AnimateAndContent>

      </DialogContent>
    </Dialog>
  );
}

// Komponen Pembantu Mini untuk mematuhi peraturan render bersih
function AnimateAndContent({ children }) {
  return <div className="space-y-4 transition-all duration-300">{children}</div>;
}
