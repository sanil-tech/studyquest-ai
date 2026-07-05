import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Gift, Coins, Check, Clock, X, Loader2, Sparkles, Lock } from "lucide-react";
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

        // 1. Fetch the student's unique relationship record to discover their parent_id
        const relationships = await base44.entities.ParentChildRelationship.filter({
          child_id: studentUser.id,
          status: "active",
        });

        const activeParentId = relationships[0]?.parent_id || null;

        // 2. Fetch data pools in parallel
        const [fetchedRewards, wallets, reqs] = await Promise.all([
          activeParentId 
            ? base44.entities.Reward.filter({ parent_id: activeParentId }) 
            : Promise.resolve([]),
          base44.entities.Wallet.filter({ student_id: studentUser.id }),
          base44.entities.RewardRequest.filter({ student_id: studentUser.id }, "-created_date", 20),
        ]);

        setRewards(fetchedRewards);
        setWallet(wallets[0] || { balance: 0 });
        setRequests(reqs);
      } catch (err) {
        console.error("Error running student rewards dashboard load sequence:", err);
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
        title: "Not enough coins! 🪙", 
        description: `You need ${reward.coin_cost} coins for this reward. Keep studying!`, 
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

      // Notify parent
      if (reward.parent_id) {
        await base44.entities.Notification.create({
          user_id: reward.parent_id,
          title: "Reward Request! 🎁",
          message: `${user.nickname || user.full_name || "Your child"} requested "${reward.title}" (${reward.coin_cost} coins)`,
          type: "reward_requested",
          reference_id: req.id,
        });
      }

      // Optimistically update requests history & locally adjust current pending wallet state balances
      setRequests(prev => [req, ...prev]);
      setWallet(prev => prev ? { ...prev, balance: Math.max(0, prev.balance - reward.coin_cost) } : prev);
      
      toast({ 
        title: "Request sent! 🎉", 
        description: "Your parent has been notified to review your request." 
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to send request. Try again.",
        variant: "destructive"
      });
    } finally {
      setRequesting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="w-10 h-10 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-500 animate-pulse">Opening the Treasure Shop...</p>
      </div>
    );
  }

  const statusIcon = {
    pending: <Clock className="w-3.5 h-3.5" />,
    approved: <Check className="w-3.5 h-3.5" />,
    rejected: <X className="w-3.5 h-3.5" />,
  };

  const statusStyle = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    rejected: "bg-rose-50 text-rose-700 border-rose-200",
  };

  return (
    <div className="space-y-8 pb-12 max-w-5xl mx-auto px-1">
      
      {/* HERO COIN VAULT BANNER */}
      <div className="relative overflow-hidden bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 rounded-3xl p-6 sm:p-8 text-white shadow-md">
        <div className="absolute -right-6 -top-6 w-36 h-36 bg-white/10 rounded-full blur-xl" />
        <div className="absolute right-20 -bottom-10 w-28 h-28 bg-yellow-400/30 rounded-full blur-lg" />
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 mb-1 bg-black/10 w-fit px-2.5 py-0.5 rounded-lg text-xs font-bold uppercase tracking-wider text-yellow-100">
              <Sparkles className="w-3.5 h-3.5 fill-yellow-200" />
              Rewards Shop
            </div>
            <h1 className="text-3xl font-black tracking-tight">Turn Gold into Prizes!</h1>
            <p className="text-orange-50 text-sm mt-1 max-w-sm">
              Trade the coins earned from finishing lessons and acing quizzes for real-world rewards.
            </p>
          </div>

          <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 flex items-center gap-4 border border-white/20 shadow-inner shrink-0">
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-md animate-bounce">
              <Coins className="w-7 h-7 text-amber-500 fill-amber-400/30" />
            </div>
            <div>
              <p className="text-xs font-bold text-orange-100 uppercase tracking-wide">Your Balance</p>
              <p className="text-2xl font-black tracking-tight">{wallet?.balance || 0} <span className="text-lg font-medium text-yellow-200">Coins</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* AVAILABLE REWARDS GRID */}
      <div className="space-y-4">
        <h2 className="text-xl font-extrabold text-slate-800">Available Rewards</h2>
        
        {rewards.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <Gift className="w-14 h-14 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-700">Vault is empty!</h3>
            <p className="text-slate-400 text-sm max-w-xs mx-auto mt-1">
              There are no active rewards right now. Ask your parent to create some exciting rewards for you!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rewards.map((reward, i) => {
              const currentBalance = wallet?.balance || 0;
              const canAfford = currentBalance >= reward.coin_cost;
              const hasPending = requests.some(r => r.reward_id === reward.id && r.status === "pending");
              
              return (
                <motion.div
                  key={reward.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className={`bg-white rounded-3xl p-5 border shadow-sm transition-all flex flex-col justify-between group ${
                    canAfford ? "border-slate-100 hover:shadow-md" : "border-slate-100 opacity-90"
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-sm border shrink-0 transition-transform group-hover:scale-105 ${
                        canAfford ? "bg-amber-50 border-amber-100" : "bg-slate-50 border-slate-100"
                      }`}>
                        {reward.icon || "🎁"}
                      </div>
                      
                      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-xl font-black text-sm border shadow-2xs ${
                        canAfford ? "bg-amber-50/50 text-amber-600 border-amber-100" : "bg-slate-50 text-slate-400 border-slate-100"
                      }`}>
                        <Coins className="w-4 h-4 text-amber-500 fill-amber-400/20" />
                        {reward.coin_cost}
                      </div>
                    </div>

                    <h3 className="font-extrabold text-slate-800 text-base leading-snug tracking-tight mb-4">
                      {reward.title}
                    </h3>
                  </div>

                  <Button
                    onClick={() => requestReward(reward)}
                    disabled={!canAfford || hasPending || requesting === reward.id}
                    className={`w-full rounded-xl font-bold py-5 shadow-xs transition-colors border-0 ${
                      hasPending 
                        ? "bg-amber-100 text-amber-700 hover:bg-amber-100" 
                        : !canAfford 
                        ? "bg-slate-100 text-slate-400 hover:bg-slate-100" 
                        : "bg-indigo-600 text-white hover:bg-indigo-700"
                    }`}
                  >
                    {requesting === reward.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : hasPending ? (
                      <span className="flex items-center gap-1.5 justify-center">
                        <Clock className="w-4 h-4" /> Pending Approval
                      </span>
                    ) : !canAfford ? (
                      <span className="flex items-center gap-1.5 justify-center text-xs">
                        <Lock className="w-3.5 h-3.5" /> Locked (Need {reward.coin_cost - currentBalance} more)
                      </span>
                    ) : (
                      "Claim Reward"
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
        <div className="space-y-4 pt-4">
          <h2 className="font-extrabold text-slate-800 text-lg">Your Order History</h2>
          
          <div className="grid gap-2 sm:grid-cols-2">
            {requests.map(req => (
              <div 
                key={req.id} 
                className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-2xs hover:border-slate-200 transition-colors"
              >
                <div className="min-w-0 pr-3">
                  <p className="text-sm font-bold text-slate-700 truncate">{req.reward_title}</p>
                  <div className="flex items-center gap-1 mt-0.5 text-xs text-slate-400 font-medium">
                    <Coins className="w-3.5 h-3.5 text-amber-500/80" />
                    <span>{req.coin_cost} gold coins</span>
                  </div>
                </div>
                
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold border capitalize shrink-0 shadow-2xs ${statusStyle[req.status] || "bg-slate-50 text-slate-700"}`}>
                  {statusIcon[req.status] || <Clock className="w-3.5 h-3.5" />}
                  {req.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}