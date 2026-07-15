// src/pages/WalletPage.jsx
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { 
  Leaf, ArrowUpRight, ArrowDownRight, Clock, Sparkles, 
  TrendingUp, Loader2, Trophy, ShieldAlert, Award, Compass 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import moment from "moment";
import { Card } from "@/components/ui/card";

export default function WalletPage() {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWalletData = async () => {
      try {
        const user = await base44.auth.me();
        setStudent(user);
        
        // Memanggil data dompet dan sejarah transaksi secara serentak
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
    loadWalletData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4 bg-[#F4FBF7]">
        <motion.div animate={{ y: [0, -12, 0] }} transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}>
          <Leaf className="w-12 h-12 text-emerald-500 fill-emerald-200/20" />
        </motion.div>
        <p className="text-xs font-black text-emerald-800/60 uppercase tracking-widest animate-pulse">
          Mengira harta karun Otan... 🪙
        </p>
      </div>
    );
  }

  // Suis Dwi-Tema Pintar (7-12: Kid theme, 13-17: Teen Stealth theme)
  const isKid = student?.age_group !== "teen";

  return (
    <div className={`min-h-screen font-sans pb-16 pt-6 transition-colors duration-500 ${
      isKid ? "bg-gradient-to-b from-[#F4FBF7] via-[#FFFDF0] to-[#E8F5E9]" : "bg-slate-950 text-slate-100"
    }`}>
      <div className="space-y-6 max-w-3xl mx-auto px-4">
        
        {/* ========================================================== */}
        {/* 1. HERO VAULT CARD: KANTUNG DAUN EMAS IMERSIF              */}
        {/* ========================================================== */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`relative overflow-hidden rounded-[2.8rem] p-8 text-center border shadow-xl border-b-[8px] ${
            isKid 
              ? "bg-gradient-to-br from-lime-500 via-emerald-500 to-green-600 border-green-800 text-white" 
              : "bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border-indigo-950 text-slate-100"
          }`}
        >
          {/* Efek Latar Hutan Visual */}
          <div className="absolute -right-8 -top-8 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-lime-400/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute right-4 bottom-[-30px] text-[160px] select-none opacity-10 font-black pointer-events-none transform -rotate-12">🍃</div>
          
          <div className="relative z-10 flex flex-col items-center">
            <div className={`flex items-center gap-1.5 mb-4 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md shadow-inner border ${
              isKid ? "bg-black/15 border-white/10 text-lime-100" : "bg-slate-950 border-slate-800 text-emerald-400"
            }`}>
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              {isKid ? "Kantung Harta Karun Borneo" : "Sistem Ledger Komposit"}
            </div>
            
            <p className="text-xs font-black uppercase tracking-widest opacity-80 mt-1">
              {isKid ? "Jumlah Daun Emas Dituntut" : "Baki Kredit Sedia Ada"}
            </p>
            
            {/* PAPARAN BALANS BOUNCY */}
            <motion.div 
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="flex items-center justify-center gap-3 mt-2"
            >
              <h1 className="text-6xl sm:text-7xl font-mono font-black tracking-tight drop-shadow-md">
                {wallet?.balance || 0}
              </h1>
              <span className="text-4xl sm:text-5xl drop-shadow-sm filter img-glow">🪙</span>
            </motion.div>

            <div className={`mt-6 px-5 py-2.5 rounded-2xl text-xs font-bold max-w-sm border shadow-inner ${
              isKid ? "bg-white/10 border-white/25 text-lime-50" : "bg-slate-950/60 border-slate-800 text-slate-300"
            }`}>
              {isKid 
                ? "Bah! Teruskan kumpul daun untuk tebus patung Otan atau baucer Roblox di kedai! 🦧" 
                : "Aktiviti mutasi direkodkan secara langsung di bawah pemantauan RLS super_admin."}
            </div>
          </div>
        </motion.div>

        {/* ========================================================== */}
        {/* 2. PETUNJUK MATLAMAT (MINI MILESTONES ALA DUOLINGO)       */}
        {/* ========================================================== */}
        {isKid && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            <Card className="p-4 rounded-[2rem] bg-white border-slate-100 shadow-xs flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-xl shrink-0">🎯</div>
                <div>
                  <h4 className="text-xs font-black text-slate-700 tracking-tight">Sasaran Petualang Cilik</h4>
                  <p className="text-[10px] text-slate-400 font-medium">Kumpul 500 syiling untuk Tebus KFC Combo!</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs font-mono font-black text-emerald-600 block">
                  {Math.min(Math.round(((wallet?.balance || 0) / 500) * 100), 100)}%
                </span>
                <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden mt-1 p-0.5 border shadow-inner">
                  <div 
                    className="h-full bg-emerald-500 rounded-full" 
                    style={{ width: `${Math.min(((wallet?.balance || 0) / 500) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* ========================================================== */}
        {/* 3. TRANSACTION HISTORY LEDGER                              */}
        {/* ========================================================== */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" /> Jurnal Aliran Misi
            </h2>
            <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-xl border shadow-xs ${
              isKid ? "bg-white border-slate-100 text-slate-400" : "bg-slate-900 border-slate-800 text-slate-500"
            }`}>
              {transactions.length} Mutasi Terakhir
            </span>
          </div>

          {transactions.length === 0 ? (
            <Card className={`text-center py-16 rounded-[2.5rem] border max-w-sm mx-auto shadow-inner ${
              isKid ? "bg-white border-slate-100" : "bg-slate-900 border-slate-800"
            }`}>
              <div className="text-5xl animate-bounce mb-3">📭</div>
              <h3 className={`font-black text-base ${!isKid && "text-white"}`}>Kantung Belum Berisi!</h3>
              <p className="text-slate-400 text-xs font-medium px-8 mt-1 leading-relaxed">
                Belum ada rekod kutipan daun. Jom selesaikan dahan video atau kuiz untuk mulakan ganjaran emas pertama!
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx, i) => {
                const isEarn = tx.type === "earn" || tx.type === "deposit";
                
                return (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.03, 0.4) }}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all group shadow-xs ${
                      isKid 
                        ? "bg-white border-slate-100 hover:border-emerald-300" 
                        : "bg-slate-900 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      {/* Petunjuk Arah Panah Ganjaran (Duolingo Bouncy Box) */}
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 transition-transform group-hover:scale-105 group-hover:-rotate-3 shadow-inner ${
                        isEarn 
                          ? isKid 
                            ? "bg-emerald-50 border-emerald-100 text-emerald-600" 
                            : "bg-emerald-950/30 border-emerald-900/50 text-emerald-400"
                          : "bg-rose-50 border-rose-100 text-rose-500 dark:bg-rose-950/20 dark:border-rose-900/40"
                      }`}>
                        {isEarn ? (
                          <ArrowUpRight className="w-5 h-5 stroke-[3]" />
                        ) : (
                          <ArrowDownRight className="w-5 h-5 stroke-[3]" />
                        )}
                      </div>

                      {/* Teks Perincian Misi */}
                      <div className="min-w-0 space-y-0.5">
                        <p className={`text-xs font-black truncate tracking-tight group-hover:text-emerald-500 transition-colors ${
                          !isKid && "text-slate-200"
                        }`}>
                          {tx.reason || (isEarn ? "Misi Kandungan Selesai" : "Hadiah Tamu Ditebus")}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 opacity-60" />
                          {moment(tx.created_date).fromNow()}
                        </p>
                      </div>
                    </div>

                    {/* Lencana Nilai Skor Kuantitatif */}
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono font-black text-xs border shadow-xs shrink-0 ${
                      isEarn 
                        ? "bg-emerald-50/50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30" 
                        : "bg-rose-50/40 text-rose-600 border-rose-100/50 dark:bg-rose-950/10 dark:text-rose-400 dark:border-rose-900/20"
                    }`}>
                      <span>{isEarn ? "+" : "-"}{tx.amount}</span>
                      <span className="text-xs">🪙</span>
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
