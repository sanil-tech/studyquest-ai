// src/components/AddChildModal.jsx
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { UserPlus, Loader2, KeyRound, CheckCircle2, Sparkles, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

export default function AddChildModal({ open, onOpenChange, onChildAdded }) {
  const [fullName, setFullName] = useState("");
  const [nickname, setNickname] = useState("");
  const [pin, setPin] = useState(""); 
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false); 
  const [createdUsername, setCreatedUsername] = useState("");
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopyCredentials = () => {
    const message = `🌟 Maklumat Log Masuk StudyQuest Untuk Anak Anda 🌟\n\nNama: ${nickname || fullName}\nUsername: ${createdUsername}\nPIN: ${pin}\n\nLangkah Log Masuk:\n1. Buka aplikasi StudyQuest\n2. Pilih "Portal Murid"\n3. Masukkan Username & PIN di atas\n\nSimpan maklumat ini dengan selamat! 🔐`;
    navigator.clipboard.writeText(message).then(() => {
      setCopied(true);
      toast({ title: "Disalin! 📋", description: "Maklumat log masuk telah disalin." });
      setTimeout(() => setCopied(false), 3000);
    }).catch(() => {
      toast({ title: "Gagal Menyalin", description: "Sila salin secara manual.", variant: "destructive" });
    });
  };

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
      // ✅ PANGGIL BACKEND: Alihkan proses pendaftaran ke Edge Function yang selamat
      const response = await base44.functions.invoke("create-child-account", {
        body: {
          fullName: fullName.trim(),
          nickname: (nickname || fullName.split(" ")[0]).trim(),
          pin: pin
        }
      });

      if (response.error) throw new Error(response.error);

      setCreatedUsername(response.data.username);
      setIsSuccess(true);

    } catch (err) {
      console.error("Ralat Pendaftaran:", err);
      toast({
        title: "Pendaftaran Gagal 🛑",
        description: err.message || "Gagal menghubungi pelayan untuk mencipta akaun.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    const wasSuccess = isSuccess;
    setFullName("");
    setNickname("");
    setPin("");
    setCreatedUsername("");
    setIsSuccess(false);
    onOpenChange(false);
    if (wasSuccess && typeof onChildAdded === "function") {
      onChildAdded();
    }
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

            <div className="bg-gradient-to-br from-amber-50 to-orange-50/60 border border-orange-100 p-4 rounded-2xl text-left space-y-3 relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 text-orange-200/40 font-black text-6xl select-none">🦖</div>
              <div className="text-xs">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Petualang Cilik</p>
                <p className="font-black text-slate-700 text-sm mt-0.5 uppercase">{nickname || fullName}</p>
              </div>
              <div className="flex justify-between items-center bg-white px-3 py-2 rounded-xl border border-orange-100/80">
                <div>
                  <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-wider">Username Log Masuk</p>
                  <p className="text-base font-black tracking-wide text-slate-800 mt-0.5 font-mono">{createdUsername}</p>
                </div>
              </div>
              <div className="flex justify-between items-center bg-white px-3 py-2 rounded-xl border border-orange-100/80">
                <div>
                  <p className="text-[9px] font-bold text-orange-500 uppercase tracking-wider flex items-center gap-0.5">
                    <Sparkles className="w-3 h-3 text-amber-500" /> PIN Portal Rahsia
                  </p>
                  <p className="text-xl font-black tracking-[0.4em] text-slate-800 mt-0.5">{pin}</p>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-medium text-center">Simpan Username & PIN ini untuk log masuk Portal Murid 🔐</p>
            </div>

            <Button
              onClick={handleCopyCredentials}
              className={`w-full font-black rounded-xl text-xs h-10 border-0 transition-all flex items-center justify-center gap-2 ${copied ? "bg-emerald-500 text-white" : "bg-indigo-600 hover:bg-indigo-700 text-white"}`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Telah Disalin!" : "Salin Maklumat Log Masuk"}
            </Button>

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
