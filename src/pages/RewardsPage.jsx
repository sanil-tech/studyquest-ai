import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Gift, Coins, Check, Clock, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";

export default function RewardsPage() {
  const [rewards, setRewards] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      const user = await base44.auth.me();
      const [rws, wallets, reqs] = await Promise.all([
        base44.entities.Reward.filter({ student_id: user.id, status: "active" }),
        base44.entities.Wallet.filter({ student_id: user.id }),
        base44.entities.RewardRequest.filter({ student_id: user.id }, "-created_date", 20),
      ]);
      setRewards(rws);
      setWallet(wallets[0] || { balance: 0 });
      setRequests(reqs);
      setLoading(false);
    };
    load();
  }, []);

  const requestReward = async (reward) => {
    if ((wallet?.balance || 0) < reward.coin_cost) {
      toast({ title: "Not enough coins!", description: `You need ${reward.coin_cost} coins for this reward.`, variant: "destructive" });
      return;
    }
    setRequesting(reward.id);
    const user = await base44.auth.me();
    const req = await base44.entities.RewardRequest.create({
      student_id: user.id,
      reward_id: reward.id,
      reward_title: reward.title,
      coin_cost: reward.coin_cost,
    });

    // Notify parent
    if (reward.parent_id) {
      await base44.entities.Notification.create({
        user_id: reward.parent_id,
        title: "Reward Request! 🎁",
        message: `${user.full_name || "Your child"} requested "${reward.title}" (${reward.coin_cost} coins)`,
        type: "reward_requested",
        reference_id: req.id,
      });
    }

    setRequests(prev => [req, ...prev]);
    setRequesting(null);
    toast({ title: "Request sent! 🎉", description: "Your parent will review your request." });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const statusIcon = {
    pending: <Clock className="w-4 h-4 text-amber-500" />,
    approved: <Check className="w-4 h-4 text-emerald-500" />,
    rejected: <X className="w-4 h-4 text-red-500" />,
  };

  const statusStyle = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    rejected: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Rewards Shop 🎁</h1>
        <p className="text-muted-foreground text-sm mt-1">
          You have <span className="font-bold text-amber-600">{wallet?.balance || 0} coins</span>
        </p>
      </div>

      {/* Available rewards */}
      {rewards.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-border/50">
          <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No rewards available yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Ask your parent to set up rewards!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {rewards.map((reward, i) => {
            const canAfford = (wallet?.balance || 0) >= reward.coin_cost;
            const hasPending = requests.some(r => r.reward_id === reward.id && r.status === "pending");
            return (
              <motion.div
                key={reward.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl p-5 border border-border/50"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl shrink-0">
                    {reward.icon || "🎁"}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-heading font-semibold">{reward.title}</h3>
                    <div className="flex items-center gap-1 mt-1">
                      <Coins className="w-4 h-4 text-amber-500" />
                      <span className="font-bold text-amber-600">{reward.coin_cost}</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => requestReward(reward)}
                    disabled={!canAfford || hasPending || requesting === reward.id}
                    className="rounded-xl shrink-0"
                  >
                    {requesting === reward.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : hasPending ? (
                      "Pending"
                    ) : (
                      "Request"
                    )}
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Request history */}
      {requests.length > 0 && (
        <div>
          <h2 className="font-heading font-semibold text-foreground mb-3">Your Requests</h2>
          <div className="space-y-2">
            {requests.map(req => (
              <div key={req.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-border/50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{req.reward_title}</p>
                  <p className="text-xs text-muted-foreground">{req.coin_cost} coins</p>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${statusStyle[req.status]}`}>
                  {statusIcon[req.status]}
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