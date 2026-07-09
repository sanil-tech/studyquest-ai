import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Leaf, ArrowUpRight, ArrowDownRight, Clock, Sparkles, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import moment from "moment";

export default function WalletPage() {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const user = await base44.auth.me();
        
        // PEMERKASAAN: Gunakan Promise.allSettled untuk API yang lebih kebal
        const results = await Promise.allSettled([
          base44.entities.Wallet.filter({ student_id: user.id }),
          base44.entities.Transaction.filter({ student_id: user.id }, "-created_date", 50),
        ]);
        
        setWallet(results[0].status === "fulfilled" && results[0].value.length > 0 ? results[0].value[0] : { balance: 0 });
        setTransactions(results[1].status === "fulfilled" ? results[1].value : []);
      } catch (err) {
        console.error("Ralat memuat turun butiran kantung:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 bg-[#FAFAF7]">
        <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
          <Leaf className="w-12 h-12 text-lime-500" />
        </motion.div>
        <p className="text-sm font-bold text-lime-700/60 uppercase tracking-widest">Membuka kantung Otan...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF7] font-sans pb-12 pt-6">
      <div className="space-y-8 max-w-3xl mx-auto px-4">
        
        {/* 1. HERO LEAF VAULT CARD (Theme: Canopy Green) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden bg-gradient-to-br from-lime-500 via-emerald-500 to-green-600 rounded-[2rem] p-8 sm:p-10 text-center text-white shadow-lg border border-emerald-400/20"
        >
          {/* Dynamic Background Textures */}
          <div className="absolute -right-10 -top-10 w-44 h-44 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -left-12 -bottom-12 w-36 h-36 bg-lime-300/20 rounded-full blur-xl" />
          <div className="absolute right-4 bottom-[-20px] text-[140px] select-none opacity-10 font-black pointer-events-none transform -rotate-12">🍃</div>
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="flex items-center gap-1.5 mb-3 bg-black/15 px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest text-lime-100 backdrop-blur-sm shadow-sm border border-white/10">
              <Sparkles className="w-3.5 h-3.5 fill-lime-200 text-lime-200" />
              Kantung Daun Emas
            </div>
            
            <p className="text-emerald-50/90 text-xs font-bold uppercase tracking-widest mt-2">Baki Terkini</p>
            
            <div className="flex items-center justify-center gap-3 mt-1 group">
              <h1 className="text-6xl sm:text-7xl font-black tracking-tight drop-shadow-md">
                {wallet?.balance || 0}
              </h1>
              <Leaf className="w-10 h-10 sm:w-12 sm:h-12 text-lime-200 fill-lime-300/30 drop-shadow-sm animate-pulse transform rotate-12" />
            </div>

            <p className="text-sm font-semibold text-lime-50 mt-4 bg-white/10 px-5 py-2 rounded-xl backdrop-blur-sm border border-white/20 shadow-sm max-w-sm">
              Teruskan kumpul daun untuk tebus pelbagai hadiah menarik!
            </p>
          </div>
        </motion.div>

        {/* 2. TRANSACTION HISTORY LEDGER */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-black text-stone-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" /> Sejarah Daun
            </h2>
            <span className="text-[10px] sm:text-xs font-bold text-stone-400 uppercase tracking-wider bg-white px-2.5 py-1 rounded-lg border border-stone-100 shadow-sm">
              {transactions.length} Rekod Terakhir
            </span>
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-[2rem] border border-stone-100 shadow-sm max-w-md mx-auto">
              <Leaf className="w-14 h-14 text-stone-300 mx-auto mb-3" />
              <h3 className="font-black text-stone-700 text-lg">Kantung masih kosong!</h3>
              <p className="text-stone-400 text-sm font-medium px-8 mt-1 max-w-xs mx-auto">
                Belum ada daun dikutip. Jom siapkan misi membaca dan kuiz untuk mula mengumpul Daun Emas!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx, i) => {
                const isEarn = tx.type === "earn";
                
                return (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(i * 0.02, 0.4) }}
                    className="flex items-center justify-between p-4 bg-white rounded-[1.5rem] border border-stone-100 shadow-sm hover:border-emerald-200 transition-colors group"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      {/* Icon indicator wrapper boxes */}
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 transition-transform group-hover:scale-105 group-hover:-rotate-3 ${
                        isEarn 
                          ? "bg-lime-50 border-lime-100 text-lime-600 shadow-inner" 
                          : "bg-rose-50 border-rose-100 text-rose-500 shadow-inner"
                      }`}>
                        {isEarn ? (
                          <ArrowUpRight className="w-5 h-5 stroke-[3]" />
                        ) : (
                          <ArrowDownRight className="w-5 h-5 stroke-[3]" />
                        )}
                      </div>

                      {/* Metadata text descriptors block */}
                      <div className="min-w-0">
                        <p className="text-sm font-black text-stone-700 truncate tracking-tight group-hover:text-emerald-800 transition-colors">
                          {tx.reason || (isEarn ? "Daun Dikutip" : "Daun Ditebus")}
                        </p>
                        <p className="text-xs text-stone-400 font-medium flex items-center gap-1 mt-0.5">
                          <Clock className="w-3.5 h-3.5 text-stone-300" />
                          {moment(tx.created_date).fromNow()}
                        </p>
                      </div>
                    </div>

                    {/* Quantitative point badge tracking parameters */}
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-sm border shadow-sm shrink-0 ${
                      isEarn 
                        ? "bg-lime-100/50 text-lime-700 border-lime-200" 
                        : "bg-rose-50/50 text-rose-600 border-rose-100/50"
                    }`}>
                      <span>{isEarn ? "+" : "-"}{tx.amount}</span>
                      <Leaf className={`w-3.5 h-3.5 ${isEarn ? "text-lime-500" : "text-rose-400"}`} />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}