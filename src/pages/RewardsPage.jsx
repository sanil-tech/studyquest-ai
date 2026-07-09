import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Gift, Check, Clock, X, Loader2, Sparkles, Lock, Leaf, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";

export default function RewardsPage() {
  const [user, setUser] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadStudentData = async () => {
      try {
        const studentUser = await base44.auth.me();
        setUser(studentUser);

        // Cari ID ibu bapa yang aktif
        const relationships = await base44.entities.ParentChildRelationship.filter({
          child_id: studentUser.id,
          status: "active",
        });

        const activeParentId = relationships[0]?.parent_id || null;

        // Gunakan Promise.allSettled untuk API yang kebal
        const results = await Promise.allSettled([
          activeParentId 
            ? base44.entities.Reward.filter({ parent_id: activeParentId, student_id: studentUser.id }) 
            : Promise.resolve([]),
          base44.entities.Wallet.filter({ student_id: studentUser.id }),
          base44.entities.RewardRequest.filter({ student_id: studentUser.id }, "-created_date", 20),
        ]);

        setRewards(results[0].status === "fulfilled" ? results[0].value : []);
        setWallet(results[1].status === "fulfilled" && results[1].value.length > 0 ? results[1].value[0] : { balance: 0 });
        setRequests(results[2].status === "fulfilled" ? results[2].value : []);
      } catch (err) {
        console.error("Ralat memuat turun data ganjaran:", err);
      } finally {
        setLoading(false);
      }
    };
    loadStudentData();
  }, []);

  const requestReward = async (reward) => {
    const currentBalance = wallet?.balance || 0;
    if (currentBalance < reward.coin_cost) {
      toast({ 
        title: "Daun Emas tidak mencukupi! 🍃", 
        description: `Awak perlukan ${reward.coin_cost} daun untuk hadiah ini. Jom kumpul lagi!`, 
        variant: "destructive" 
      });
      return;
    }
    
    if (!user) return;
    setRequesting(reward.id);
    
    try {
      const req = await base44.entities.RewardRequest.create({
        student_id: user.id,
        student_email: user.email, 
        reward_id: reward.id,
        reward_title: reward.title,
        coin_cost: reward.coin_cost,
        status: "pending"
      });

      // Notis kepada ibu bapa
      if (reward.parent_id) {
        await base44.entities.Notification.create({
          user_id: reward.parent_id,
          title: "Permintaan Ganjaran Baru! 🎁",
          message: `${user.nickname || user.full_name || "Anak anda"} telah meminta "${reward.title}" (Kos: ${reward.coin_cost} Daun Emas)`,
          type: "reward_requested",
          reference_id: req.id,
        });
      }

      setRequests(prev => [req, ...prev]);
      setWallet(prev => prev ? { ...prev, balance: Math.max(0, prev.balance - reward.coin_cost) } : prev);
      
      toast({ 
        title: "Permintaan dihantar! 🎉", 
        description: "Otan dah maklumkan pada ibu bapa awak untuk sahkan ganjaran ini." 
      });
    } catch (err) {
      toast({
        title: "Ralat",
        description: "Gagal menghantar permintaan. Sila cuba lagi.",
        variant: "destructive"
      });
    } finally {
      setRequesting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 bg-[#FAFAF7]">
        <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
          <Leaf className="w-12 h-12 text-lime-500" />
        </motion.div>
        <p className="text-sm font-bold text-lime-700/60 uppercase tracking-widest">Membuka Kedai Otan...</p>
      </div>
    );
  }

  const statusIcon = {
    pending: <Clock className="w-4 h-4" />,
    approved: <Check className="w-4 h-4" />,
    rejected: <X className="w-4 h-4" />,
  };

  const statusStyle = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    rejected: "bg-rose-50 text-rose-700 border-rose-200",
  };

  return (
    <div className="min-h-screen bg-[#FAFAF7] font-sans pb-12 pt-6">
      <div className="space-y-8 max-w-5xl mx-auto px-4">
        
        {/* HERO VAULT BANNER (Nature Theme) */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-green-700 rounded-[2rem] p-6 sm:p-10 text-white shadow-lg border border-emerald-800/20">
          <div className="absolute -right-6 -top-6 w-36 h-36 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute right-20 -bottom-10 w-28 h-28 bg-lime-400/30 rounded-full blur-xl" />
          
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-1.5 mb-2 bg-lime-400 w-fit px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest text-green-900 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                Kedai Ganjaran
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight drop-shadow-sm">Tebus Daun Emas!</h1>
              <p className="text-emerald-50 font-medium text-sm sm:text-base mt-1.5 max-w-sm">
                Tukar daun emas yang dikumpul dari hasil titik peluh belajar kepada hadiah dunia sebenar.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-[1.5rem] p-4 flex items-center gap-4 border border-white/20 shadow-inner shrink-0 self-start sm:self-auto">
              <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-md transform rotate-3">
                <Leaf className="w-8 h-8 text-lime-500 fill-lime-400/30" />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-100 uppercase tracking-wide">Baki Akaun</p>
                <p className="text-2xl font-black tracking-tight">{wallet?.balance || 0} <span className="text-lg font-medium text-lime-200">Daun</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* AVAILABLE REWARDS GRID */}
        <div className="space-y-4">
          <h2 className="text-xl font-black text-stone-800 flex items-center gap-2">
            <Gift className="w-6 h-6 text-emerald-500" /> Senarai Ganjaran
          </h2>
          
          {rewards.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-[2rem] border border-emerald-100 shadow-sm">
              <Sprout className="w-14 h-14 text-stone-300 mx-auto mb-3" />
              <h3 className="text-lg font-black text-stone-800">Pokok masih kosong!</h3>
              <p className="text-stone-500 text-sm max-w-xs mx-auto mt-1 font-medium">
                Belum ada ganjaran diletakkan. Cuba pujuk ibu bapa untuk tambah hadiah di sini!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {rewards.map((reward, i) => {
                const currentBalance = wallet?.balance || 0;
                const canAfford = currentBalance >= reward.coin_cost;
                const hasPending = requests.some(r => r.reward_id === reward.id && r.status === "pending");
                
                return (
                  <motion.div
                    key={reward.id}
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className={`bg-white rounded-[1.5rem] p-5 border transition-all flex flex-col justify-between group relative overflow-hidden ${
                      canAfford ? "border-emerald-200 shadow-sm hover:shadow-md hover:border-emerald-400" : "border-stone-100 opacity-90"
                    }`}
                  >
                    {/* Hiasan background corak jika mampu beli */}
                    {canAfford && (
                      <div className="absolute -right-4 -top-4 text-emerald-50/50 group-hover:text-emerald-50 transition-colors z-0">
                        <Gift className="w-32 h-32" />
                      </div>
                    )}

                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-inner border shrink-0 transition-transform group-hover:scale-105 group-hover:-rotate-6 ${
                          canAfford ? "bg-lime-50 border-lime-100" : "bg-stone-50 border-stone-100"
                        }`}>
                          {reward.icon || "🎁"}
                        </div>
                        
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-sm border shadow-sm ${
                          canAfford ? "bg-lime-100/50 text-lime-700 border-lime-200" : "bg-stone-50 text-stone-400 border-stone-100"
                        }`}>
                          <Leaf className="w-4 h-4 text-lime-500 fill-lime-400/30" />
                          {reward.coin_cost}
                        </div>
                      </div>

                      <h3 className="font-black text-stone-800 text-lg leading-snug tracking-tight mb-5">
                        {reward.title}
                      </h3>
                    </div>

                    <Button
                      onClick={() => requestReward(reward)}
                      disabled={!canAfford || hasPending || requesting === reward.id}
                      className={`relative z-10 w-full rounded-xl font-black py-6 shadow-sm transition-all border-0 text-sm ${
                        hasPending 
                          ? "bg-amber-100 text-amber-700 hover:bg-amber-100" 
                          : !canAfford 
                          ? "bg-[#F3EFE6] text-stone-400 hover:bg-[#F3EFE6]" 
                          : "bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98]"
                      }`}
                    >
                      {requesting === reward.id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : hasPending ? (
                        <span className="flex items-center gap-2 justify-center">
                          <Clock className="w-4 h-4" /> Menunggu Pengesahan
                        </span>
                      ) : !canAfford ? (
                        <span className="flex items-center gap-2 justify-center text-xs">
                          <Lock className="w-4 h-4" /> Kunci (Kurang {reward.coin_cost - currentBalance} Daun)
                        </span>
                      ) : (
                        "Tebus Hadiah Ini!"
                      )}
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* REQUEST HISTORY SECTION */}
        {requests.length > 0 && (
          <div className="space-y-4 pt-6">
            <h2 className="font-black text-stone-800 text-lg">Sejarah Penebusan</h2>
            
            <div className="grid gap-3 sm:grid-cols-2">
              {requests.map(req => (
                <div 
                  key={req.id} 
                  className="flex items-center justify-between p-4 bg-white rounded-2xl border border-stone-200 shadow-sm hover:border-emerald-200 transition-colors"
                >
                  <div className="min-w-0 pr-3">
                    <p className="text-sm font-bold text-stone-800 truncate">{req.reward_title}</p>
                    <div className="flex items-center gap-1 mt-1 text-xs text-stone-500 font-medium">
                      <Leaf className="w-3.5 h-3.5 text-lime-500" />
                      <span>{req.coin_cost} daun</span>
                    </div>
                  </div>
                  
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border capitalize shrink-0 shadow-sm ${statusStyle[req.status] || "bg-stone-50 text-stone-700"}`}>
                    {statusIcon[req.status] || <Clock className="w-3.5 h-3.5" />}
                    {req.status === 'pending' ? 'Menunggu' : req.status === 'approved' ? 'Lulus' : 'Ditolak'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}