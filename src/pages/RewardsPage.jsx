// src/pages/RewardStore.jsx
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Gift, Sparkles, Loader2, ShoppingBag, CheckCircle, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

// Senarai Harta Karun Tempatan Borneo & Baucer Game Yang Digemari Kanak-kanak
const REWARD_ITEMS = [
  { id: "item-1", title: "Patung Boneka Otan Cilik 🦧", cost: 100, icon: "🧸", desc: "Patung maskot Otan berbulu lembut edisi terhad StudyQuest." },
  { id: "item-2", title: "Baucer 100 Robux / Mobile Legends 🎮", cost: 250, icon: "💎", desc: "Kod tebusan rasmi untuk top-up game kegemaran anda." },
  { id: "item-3", title: "Makan KFC Combo Ahad Bersama Keluarga 🍗", cost: 500, icon: "🍟", desc: "Ibu bapa akan menerima e-mel baucer makan malam KFC." },
  { id: "item-4", title: "Lencana Sayap Kenyalang Neon (Profil) 🦅", cost: 50, icon: "✨", desc: "Kosmetik premium untuk menyerlahkan nama anda di papan pendahulu." }
];

export default function RewardStore() {
  const [wallet, setWallet] = useState({ balance: 0 });
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const { toast } = useToast();

  const loadWalletData = async () => {
    try {
      setLoading(true);
      const me = await base44.auth.me();
      if (!me) return;
      setStudent(me);

      // ✅ SAH DILULUSKAN: RLS membenarkan pembacaan baki terus dari frontend!
      const walletData = await base44.entities.Wallet.filter({ student_id: me.id });
      if (walletData && walletData.length > 0) {
        setWallet(walletData[0]);
      }
    } catch (err) {
      console.error("Gagal memuat baki dompet:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWalletData();
  }, []);

  // ✅ KUNCI UTAMA: Memanggil Edge Function untuk memotong baki Wallet yang dikunci oleh RLS Super Admin
  const handlePurchase = async (item) => {
    if (wallet.balance < item.cost) {
      toast({
        title: "Syiling Tidak Cukup! 🛑",
        description: `Alamak, anda perlukan ${item.cost - wallet.balance} syiling lagi. Jom sambung belajar!`,
        variant: "destructive"
      });
      return;
    }

    setPurchasingId(item.id);
    try {
      const response = await base44.functions.invoke("purchase-reward", {
        body: { itemId: item.id, cost: item.cost }
      });

      if (response.error) throw new Error(response.error);

      setShowSuccess(true);
      try { new Audio("https://assets.mixkit.co/active_storage/sfx/2019/2019-2017.wav").play(); } catch(e){}
      
      setTimeout(() => {
        setShowSuccess(false);
        loadWalletData(); // Muat semula baki baharu yang telah dipotong pelayan
      }, 2500);

    } catch (err) {
      toast({
        title: "Transaksi Gagal",
        description: err.message || "Ralat pelayan semasa memproses pembelian.",
        variant: "destructive"
      });
    } finally {
      setPurchasingId(null);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#FFFDE7] flex flex-col items-center justify-center p-4">
      <Loader2 className="w-8 h-8 animate-spin text-amber-600 mb-2" />
      <p className="text-xs font-black text-amber-800 uppercase tracking-widest animate-pulse">Membuka Peti Harta Kedai... 🪙</p>
    </div>
  );

  const isKid = student?.age_group !== "teen";

  return (
    <div className={`min-h-screen font-sans pb-16 pt-6 transition-colors duration-500 ${
      isKid ? "bg-gradient-to-b from-[#FFFDE7] via-[#FFFDF0] to-[#F4FBF7]" : "bg-slate-950 text-slate-100"
    }`}>
      <div className="max-w-4xl mx-auto px-4 space-y-8">
        
        {/* HEADER KEDAI: DUOLINGO BANNER INTERACTIVE STYLE */}
        <div className={`relative rounded-[2.5rem] p-6 sm:p-8 border-b-[6px] shadow-lg overflow-hidden ${
          isKid ? "bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 border-orange-700 text-white" : "bg-slate-900 border-slate-800 text-white"
        }`}>
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between gap-4">
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest bg-black/10 px-3 py-1 rounded-full inline-block">Pasar Tamu Ganjaran</span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">Tukar Syiling Harta Karun! 🪙</h1>
              <p className="text-xs opacity-90 mt-0.5 font-medium">Belanjakan emas hasil usaha gigih anda mendaki dahan ilmu.</p>
            </div>
            {/* PAPARAN BAKI SYILING BESAR ELEGAN */}
            <div className="bg-white/20 backdrop-blur-md border border-white/20 px-5 py-3 rounded-2xl text-center shadow-inner shrink-0">
              <span className="block text-[9px] font-black text-amber-200 uppercase tracking-wider">Baki Anda</span>
              <span className="text-xl sm:text-2xl font-mono font-black text-white block mt-0.5">🪙 {wallet.balance}</span>
            </div>
          </div>
        </div>

        {/* GRID KAD ITEM GANJARAN */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {REWARD_ITEMS.map((item) => {
            const canAfford = wallet.balance >= item.cost;
            return (
              <Card key={item.id} className={`p-5 rounded-[2.2rem] border-2 flex flex-col justify-between gap-4 relative overflow-hidden transition-all shadow-xs ${
                isKid ? "bg-white border-slate-100" : "bg-slate-900 border-slate-800"
              }`}>
                <div className="flex gap-4 items-start">
                  <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-slate-950 border flex items-center justify-center text-3xl shadow-inner shrink-0">
                    {item.icon}
                  </div>
                  <div className="space-y-1">
                    <h3 className={`text-sm sm:text-base font-black tracking-tight ${!isKid && "text-white"}`}>{item.title}</h3>
                    <p className="text-[11px] text-slate-400 font-medium leading-relaxed">{item.desc}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-dashed border-slate-100 dark:border-slate-800">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wide">Harga Tebusan</span>
                    <span className="text-sm font-mono font-black text-amber-600 dark:text-amber-400">🪙 {item.cost} Syiling</span>
                  </div>

                  <Button
                    onClick={() => handlePurchase(item)}
                    disabled={purchasingId !== null}
                    className={`text-xs font-black px-5 h-10 rounded-xl transition-all border-b-4 ${
                      canAfford
                        ? "bg-gradient-to-r from-emerald-500 to-teal-500 border-emerald-800 text-white hover:brightness-105 active:border-b-0 active:translate-y-1"
                        : "bg-slate-100 border-slate-300 text-slate-400 cursor-not-allowed border-b-0 shadow-none dark:bg-slate-800 dark:border-slate-700"
                    }`}
                  >
                    {purchasingId === item.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : canAfford ? (
                      "Tebus Harta 🎁"
                    ) : (
                      "Syiling Tak Cukup"
                    )}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* OVERLAY TAHNIAH PASCA TEBUSAN RASMI (DUOLINGO ANIMATION STYLE) */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.85, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.85, y: 30 }} className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2.5rem] text-center max-w-sm w-full shadow-2xl border-b-[8px] border-emerald-700">
              <div className="text-5xl animate-bounce mb-2">🦧🎉</div>
              <h2 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">Tebusan Berjaya! Bossku!</h2>
              <p className="text-xs text-slate-400 font-medium mt-1">
                Sistem telah merekodkan tuntutan anda. Sila maklumkan kepada ibu bapa untuk kod kelulusan hadiah fizikal!
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
