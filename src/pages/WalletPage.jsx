import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Coins, ArrowUpRight, ArrowDownRight, Clock, Loader2, Sparkles, TrendingUp } from "lucide-react";
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
        const [wallets, txns] = await Promise.all([
          base44.entities.Wallet.filter({ student_id: user.id }),
          base44.entities.Transaction.filter({ student_id: user.id }, "-created_date", 50),
        ]);
        setWallet(wallets[0] || { balance: 0 });
        setTransactions(txns);
      } catch (err) {
        console.error("Error loading wallet details:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="w-10 h-10 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-500 animate-pulse">Opening your coin vault...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 max-w-3xl mx-auto px-1">
      
      {/* 1. HERO COIN VAULT CARD */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-orange-500 to-yellow-500 rounded-3xl p-8 text-center text-white shadow-md border border-amber-400/20"
      >
        {/* Dynamic Background Textures */}
        <div className="absolute -right-10 -top-10 w-44 h-44 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -left-12 -bottom-12 w-36 h-36 bg-yellow-300/20 rounded-full blur-xl" />
        <div className="absolute right-4 bottom-2 text-[140px] select-none opacity-10 font-black pointer-events-none">🪙</div>
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="flex items-center gap-1.5 mb-2 bg-black/10 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-yellow-100 backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 fill-yellow-200 text-yellow-200" />
            Student Account Balance
          </div>
          
          <p className="text-orange-50/80 text-xs font-bold uppercase tracking-widest mt-2">Available Balance</p>
          
          <div className="flex items-center justify-center gap-3 mt-1 group">
            <h1 className="text-6xl font-black font-heading tracking-tight drop-shadow-xs selection:bg-amber-700">
              {wallet?.balance || 0}
            </h1>
            <Coins className="w-10 h-10 text-yellow-200 fill-yellow-300/20 drop-shadow-xs animate-pulse" />
          </div>

          <p className="text-sm font-semibold text-yellow-100/90 mt-2 bg-white/10 px-4 py-1 rounded-xl backdrop-blur-xs border border-white/10">
            Keep crushing goals to stack up more gold!
          </p>
        </div>
      </motion.div>

      {/* 2. TRANSACTION HISTORY LEDGER */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-slate-800 font-heading flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-500" /> Ledger Activities
          </h2>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Showing last {transactions.length} items
          </span>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 shadow-2xs max-w-md mx-auto">
            <Coins className="w-12 h-12 text-slate-300 mx-auto mb-3 stroke-[1.5]" />
            <h3 className="font-bold text-slate-700">No transactions recorded</h3>
            <p className="text-slate-400 text-xs px-8 mt-1 max-w-xs mx-auto">
              Your wallet statement is blank. Go tackle some homework sets or finish a learning streak to claim rewards!
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {transactions.map((tx, i) => {
              const isEarn = tx.type === "earn";
              
              return (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.4) }}
                  className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-2xs hover:border-slate-200/80 transition-colors group"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Icon indicator wrapper boxes */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 shadow-3xs transition-transform group-hover:scale-105 ${
                      isEarn 
                        ? "bg-emerald-50 border-emerald-100 text-emerald-600" 
                        : "bg-rose-50 border-rose-100 text-rose-500"
                    }`}>
                      {isEarn ? (
                        <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
                      ) : (
                        <ArrowDownRight className="w-5 h-5 stroke-[2.5]" />
                      )}
                    </div>

                    {/* Metadata text descriptors block */}
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-700 truncate tracking-tight group-hover:text-slate-900 transition-colors">
                        {tx.reason || (isEarn ? "Points Credited" : "Points Debited")}
                      </p>
                      <p className="text-xs text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-300" />
                        {moment(tx.created_date).fromNow()}
                      </p>
                    </div>
                  </div>

                  {/* Quantitative point badge tracking parameters */}
                  <div className={`flex items-center gap-1 px-3 py-1 rounded-xl font-black text-sm border shadow-3xs shrink-0 ${
                    isEarn 
                      ? "bg-emerald-50/50 text-emerald-600 border-emerald-100/50" 
                      : "bg-rose-50/50 text-rose-600 border-rose-100/50"
                  }`}>
                    <span>{isEarn ? "+" : "-"}{tx.amount}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wide opacity-80">Coins</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}