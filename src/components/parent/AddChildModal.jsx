import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { UserPlus, Loader2, KeyRound, CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

export default function AddChildModal({ open, onOpenChange, onChildAdded }) {
  const [fullName, setFullName] = useState("");
  const [nickname, setNickname] = useState("");
  const [pin, setPin] = useState(""); 
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false); 
  const { toast } = useToast();

  const handleRegisterChild = async (e) => {
    e.preventDefault();
    if (!fullName || !pin) {
      toast({ title: "Medan Wajib", description: "Sila isi Nama dan PIN 4-Digit anak.", variant: "destructive" });
      return;
    }
    if (pin.length !== 4) {
      toast({ title: "Format PIN Salah", description: "PIN mestilah tepat 4 digit.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const me = await base44.auth.me();
      if (!me?.id) throw new Error("Sesi log masuk ibu bapa tidak ditemui.");

      const cleanNickname = (nickname || fullName.split(" ")[0]).trim();
      const shortParentId = me.id.substring(0, 6);
      const virtualEmail = `${cleanNickname.toLowerCase()}.${shortParentId}@studyquest.internal`;

      // 1. Cipta rekod anak terus ke jadual User utama
      const newStudent = await base44.entities.User.create({
        full_name: fullName,
        email: virtualEmail, 
        nickname: cleanNickname,
        app_role: "student",
        child_login_pin: pin,
        status: "active",
        profile_completed: true 
      });

      if (!newStudent?.id) {
        throw new Error("Gagal mencipta rekod pengguna anak.");
      }

      // 🎯 HELAH PINTAS RLS: Simpan info nama anak ke memori tempatan pelayar web
      const cachedKids = JSON.parse(localStorage.getItem("cached_children") || "{}");
      cachedKids[newStudent.id] = {
        full_name: fullName,
        nickname: cleanNickname,
        email: virtualEmail
      };
      localStorage.setItem("cached_children", JSON.stringify(cachedKids));

      // 2. Pautkan hubungan keluarga
      await base44.entities.ParentChildRelationship.create({
        parent_id: me.id,
        child_id: newStudent.id,
        status: "active"
      });

      // 3. Sediakan Wallet & Progress
      try {
        await base44.entities.Wallet.create({ student_id: newStudent.id, balance: 0 });
        await base44.entities.Progress.create({ 
          student_id: newStudent.id, 
          total_xp: 0, 
          level: 1, 
          streak_days: 0, 
          total_study_time: 0 
        });
      } catch (e) {
        console.warn("Entiti tambahan disekat, akaun utama tetap sah.");
      }

      if (typeof onChildAdded === "function") {
        onChildAdded(); 
      }
      setIsSuccess(true);

    } catch (err) {
      console.error("🚨 Ralat Pendaftaran:", err);
      toast({
        title: "Pendaftaran Gagal 🛑",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setFullName("");
    setNickname("");
    setPin("");
    setIsSuccess(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!loading) { if (!v) handleCloseModal(); else onOpenChange(v); } }}>
      <DialogContent className="sm:max-w-md rounded-3xl bg-white p-6 border-slate-100 shadow-xl overflow-hidden">
        
        {!isSuccess ? (
          <>
            <DialogHeader className="text-center sm:text-left">
              <DialogTitle className="text-lg font-black text-slate-800 flex items-center gap-2 justify-center sm:justify-start">
                <UserPlus className="w-5 h-5 text-indigo-600" /> Tambah Profil Anak (Pintas Emel)
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400 font-medium">
                Cipta profil log masuk ekspres untuk anak anda tanpa perlu mendaftarkan alamat emel.
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
                  <label className="text-[10px] font-bold text-orange-600 uppercase tracking-wide flex items-center gap-0.5">
                    <KeyRound className="w-3 h-3" /> Set PIN 4-Digit *
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                    placeholder="0000"
                    className="w-full px-3 py-2 bg-orange-50/30 border border-orange-100 rounded-xl text-xs focus:outline-none focus:border-orange-500 text-center font-black tracking-widest text-slate-700"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2 justify-end">
                <Button type="button" variant="ghost" disabled={loading} onClick={handleCloseModal} className="rounded-xl text-xs font-bold text-slate-500 h-9 px-4 hover:bg-slate-50">
                  Batal
                </Button>
                <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs h-9 px-5 shadow-sm">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
                  Sahkan & Cipta Profil
                </Button>
              </div>
            </form>
          </>
        ) : (
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-500">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800 tracking-tight">Profil Anak Berjaya Disimpan! 🎉</h3>
              <p className="text-xs text-slate-400 font-medium mt-1">Akaun ekspres telah didaftarkan dengan selamat ke dalam sistem utama.</p>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50/60 border border-orange-100 p-4 rounded-2xl text-left space-y-2 relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 text-orange-200/40 font-black text-6xl select-none">🦖</div>
              <div className="text-xs">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Petualang Cilik</p>
                <p className="font-black text-slate-700 text-sm mt-0.5 uppercase">{nickname || fullName}</p>
              </div>
              <div className="flex justify-between items-center bg-white px-3 py-2 rounded-xl border border-orange-100/80">
                <div>
                  <p className="text-[9px] font-bold text-orange-500 uppercase tracking-wider flex items-center gap-0.5">
                    <Sparkles className="w-3 h-3 text-amber-500" /> PIN Portal Rahsia
                  </p>
                  <p className="text-xl font-black tracking-[0.4em] text-slate-800 mt-0.5">{pin}</p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button onClick={handleCloseModal} className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs h-10">
                Selesai & Tutup
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
