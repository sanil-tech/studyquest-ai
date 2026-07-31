// src/pages/WalletPage.jsx
import React, { useState, useEffect } from "react";
import { 
  Coins, 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock, 
  Sparkles, 
  TrendingUp
} from "lucide-react";
import { motion } from "framer-motion";
import moment from "moment";
import { useStudentData } from "@/hooks/useStudentData";

export default function WalletPage() {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [studentName, setStudentName] = useState("Penjelajah");
  const [currentPage, setCurrentPage] = useState(1);
  const { data, loading, studentUser } = useStudentData();

  useEffect(() => {
    if (data) {
      setWallet(data.wallet || { balance: 0 });
      setTransactions(data.transactions || []);
      setStudentName(studentUser?.nickname || studentUser?.full_name || "Penjelajah");
    } else if (!loading) {
      setWallet({ balance: 0 });
      setTransactions([]);
    }
  }, [data, loading, studentUser]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh] space-y-4 bg-[#F4F9F4]">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
          <Sparkles className="w-12 h-12 text-emerald-500" />
        </motion.div>
        <p className="text-sm font-black text-emerald-800 tracking-wide">
          Otan sedang mengira Syiling Emas...
        </p>
      </div>
    );
  }

  const currentBalance = wallet?.balance || 0;
  const pageSize = 5;
  const totalPages = Math.ceil(transactions.length / pageSize);
  const paginatedTransactions = transactions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="min-h-screen bg-[#F4F9F4] font-sans pb-24 pt-6 text-stone-800 selection:bg-lime-200">
      <div className="space-y-8 max-w-3xl mx-auto px-4">
        
        {/* 1. HERO LEAF VAULT CARD */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 120 }}
          className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 rounded-[2.5rem] p-8 sm:p-10 text-center text-white shadow-xl border-b-8 border-green-800"
        >
          {/* Background Textures */}
          <div className="absolute -right-10 -top-10 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -left-12 -bottom-12 w-36 h-36 bg-lime-300/20 rounded-full blur-xl pointer-events-none" />
          <div className="absolute right-4 bottom-[-20px] text-[140px] select-none opacity-10 font-black pointer-events-none transform -rotate-12">
          🪙
          </div>
          
          <div className="relative z-10 flex flex-col items-center">
            {/* Header Badge */}
            <div className="flex items-center gap-1.5 mb-3 bg-lime-400 text-green-950 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-sm">
              <Sparkles className="w-4 h-4 fill-current" />
              Kantung Syiling Emas
            </div>
            
            <p className="text-emerald-100 text-xs font-black uppercase tracking-widest mt-1">
              Milik {studentName}
            </p>
            
            {/* Main Balance Display */}
            <div className="flex items-center justify-center gap-3 mt-2 group">
              <h1 className="text-6xl sm:text-7xl font-black tracking-tight drop-shadow-md">
                {currentBalance}
              </h1>
              <motion.div
                animate={{ rotate: [0, 15, -10, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              >
                <Coins className="w-12 h-12 sm:w-14 sm:h-14 text-lime-300 fill-lime-400 drop-shadow-md" />
              </motion.div>
            </div>

            <p className="text-xs sm:text-sm font-bold text-emerald-100 mt-4 bg-white/15 px-5 py-2.5 rounded-2xl backdrop-blur-md border border-white/20 shadow-sm max-w-md">
              Kumpul Syiling Emas daripada Misi & Kuiz untuk menebus ganjaran hebat! 🎁
            </p>
          </div>
        </motion.div>

        {/* 2. TRANSACTION HISTORY LEDGER */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xl font-black text-stone-800 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
              <span>Sejarah Kutipan Syiling</span>
            </h2>
            <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300 shadow-xs">
              {transactions.length} Rekod
            </span>
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border-4 border-stone-200 shadow-sm max-w-md mx-auto p-6">
              <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-stone-200">
                <Coins className="w-8 h-8 text-stone-400" />
              </div>
              <h3 className="font-black text-stone-800 text-lg">Kantung Masih Kosong!</h3>
              <p className="text-stone-500 text-xs sm:text-sm font-bold mt-1 max-w-xs mx-auto">
                Belum ada syiling dikutip. Jom selesaikan cabaran kuiz dan bacaan nota untuk mula mengisi kantung anda! 🚀
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {paginatedTransactions.map((tx, i) => {
                const isEarn = tx.type === "earn" || (tx.amount && tx.amount > 0);
                
                return (
                  <motion.div
                    key={tx.id || i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.03, 0.3) }}
                    className="flex items-center justify-between p-4 bg-white rounded-3xl border-4 border-stone-200 shadow-sm hover:border-emerald-300 transition-all group"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      {/* Icon Indicator */}
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-b-4 shrink-0 transition-transform group-hover:scale-105 ${
                        isEarn 
                          ? "bg-lime-100 border-lime-500 text-lime-800" 
                          : "bg-rose-100 border-rose-500 text-rose-800"
                      }`}>
                        {isEarn ? (
                          <ArrowUpRight className="w-6 h-6 stroke-[3]" />
                        ) : (
                          <ArrowDownRight className="w-6 h-6 stroke-[3]" />
                        )}
                      </div>

                      {/* Transaction Info */}
                      <div className="min-w-0">
                        <p className="text-sm sm:text-base font-black text-stone-800 truncate tracking-tight group-hover:text-emerald-700 transition-colors">
                          {tx.reason || (isEarn ? "Misi Diselesaikan" : "Ganjaran Ditebus")}
                        </p>
                        <p className="text-xs text-stone-400 font-extrabold flex items-center gap-1 mt-0.5">
                          <Clock className="w-3.5 h-3.5 text-stone-400" />
                          {tx.created_date ? moment(tx.created_date).fromNow() : "Baru sahaja"}
                        </p>
                      </div>
                    </div>

                    {/* Amount Badge */}
                    <div className={`flex items-center gap-1 px-3.5 py-1.5 rounded-2xl font-black text-sm sm:text-base border-b-2 shadow-xs shrink-0 ${
                      isEarn 
                        ? "bg-lime-100 text-lime-900 border-lime-400" 
                        : "bg-rose-100 text-rose-900 border-rose-300"
                    }`}>
                      <span>{isEarn ? "+" : "-"}{Math.abs(tx.amount || 0)}</span>
                      <Coins className={`w-4 h-4 ${isEarn ? "text-lime-600 fill-lime-500" : "text-rose-500 fill-rose-400"}`} />
                    </div>
                  </motion.div>
                );
              })}

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-xl font-bold text-sm bg-white border-2 border-stone-200 text-stone-600 disabled:opacity-40 disabled:cursor-not-allowed hover:border-emerald-300 hover:text-emerald-700 transition-all active:scale-95"
                  >
                    ← Sebelum
                  </button>
                  <span className="text-xs font-black text-stone-500 bg-stone-100 px-3 py-2 rounded-xl">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-xl font-bold text-sm bg-white border-2 border-stone-200 text-stone-600 disabled:opacity-40 disabled:cursor-not-allowed hover:border-emerald-300 hover:text-emerald-700 transition-all active:scale-95"
                  >
                    Seterus →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}