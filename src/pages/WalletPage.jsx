import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Coins, ArrowUpRight, ArrowDownRight, Clock } from "lucide-react";
import { motion } from "framer-motion";
import moment from "moment";

export default function WalletPage() {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const user = await base44.auth.me();
      const [wallets, txns] = await Promise.all([
        base44.entities.Wallet.filter({ student_id: user.id }),
        base44.entities.Transaction.filter({ student_id: user.id }, "-created_date", 50),
      ]);
      setWallet(wallets[0] || { balance: 0 });
      setTransactions(txns);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl p-8 text-center text-white relative overflow-hidden"
      >
        <Coins className="w-10 h-10 mx-auto mb-2 opacity-80" />
        <p className="text-sm font-medium text-white/80">Your Balance</p>
        <h1 className="text-5xl font-heading font-bold mt-1">{wallet?.balance || 0}</h1>
        <p className="text-sm text-white/80 mt-1">Study Coins</p>
        <div className="absolute -right-6 -bottom-6 text-[120px] opacity-10">🪙</div>
      </motion.div>

      {/* Transactions */}
      <div>
        <h2 className="font-heading font-semibold text-foreground mb-3">Transaction History</h2>
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm">No transactions yet. Start quizzing to earn coins!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx, i) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-3 p-3 bg-white rounded-xl border border-border/50"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  tx.type === "earn" ? "bg-emerald-100" : "bg-red-100"
                }`}>
                  {tx.type === "earn" 
                    ? <ArrowUpRight className="w-5 h-5 text-emerald-600" />
                    : <ArrowDownRight className="w-5 h-5 text-red-500" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{tx.reason}</p>
                  <p className="text-xs text-muted-foreground">
                    {moment(tx.created_date).fromNow()}
                  </p>
                </div>
                <span className={`font-bold text-sm ${
                  tx.type === "earn" ? "text-emerald-600" : "text-red-500"
                }`}>
                  {tx.type === "earn" ? "+" : "-"}{tx.amount}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}