import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Check, X, Coins, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import moment from "moment";

export default function ParentApprovals() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [messages, setMessages] = useState({});
  const { toast } = useToast();

  const loadData = async () => {
    const user = await base44.auth.me();
    const linkReqs = await base44.entities.LinkRequest.filter({ parent_email: user.email, status: "approved" });
    const nameMap = {};
    linkReqs.forEach(r => { nameMap[r.student_id] = r.student_name; });
    const studentIds = linkReqs.map(r => r.student_id);
    if (studentIds.length > 0) {
      const allReqs = [];
      for (const sid of studentIds) {
        const reqs = await base44.entities.RewardRequest.filter({ student_id: sid }, "-created_date", 20);
        reqs.forEach(r => { r._student_name = nameMap[sid] || "Student"; });
        allReqs.push(...reqs);
      }
      allReqs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
      setRequests(allReqs);
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleDecision = async (req, decision) => {
    setProcessing(req.id);

    if (decision === "approved") {
      // Deduct coins from wallet
      const wallets = await base44.entities.Wallet.filter({ student_id: req.student_id });
      if (wallets.length > 0) {
        const newBalance = Math.max(0, wallets[0].balance - req.coin_cost);
        await base44.entities.Wallet.update(wallets[0].id, { balance: newBalance });
      }
      // Log transaction
      await base44.entities.Transaction.create({
        student_id: req.student_id,
        type: "spend",
        amount: req.coin_cost,
        reason: `Reward approved: ${req.reward_title}`,
        reference_id: req.id,
      });
    }

    await base44.entities.RewardRequest.update(req.id, {
      status: decision,
      parent_response_message: messages[req.id] || "",
    });

    // Notify student
    await base44.entities.Notification.create({
      user_id: req.student_id,
      title: decision === "approved" ? "Reward Approved! 🎉" : "Reward Declined",
      message: decision === "approved"
        ? `Your request for "${req.reward_title}" was approved! ${req.coin_cost} coins deducted.`
        : `Your request for "${req.reward_title}" was declined.${messages[req.id] ? ` Message: ${messages[req.id]}` : ""}`,
      type: decision === "approved" ? "reward_approved" : "reward_rejected",
      reference_id: req.id,
    });

    setProcessing(null);
    toast({ title: decision === "approved" ? "Reward approved! 🎉" : "Request declined" });
    loadData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const pending = requests.filter(r => r.status === "pending");
  const resolved = requests.filter(r => r.status !== "pending");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Reward Approvals ✅</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {pending.length} pending request{pending.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Pending */}
      {pending.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-border/50">
          <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No pending requests.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map((req, i) => (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl p-5 border border-amber-200 border-l-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs text-muted-foreground">{req._student_name}</p>
                  <h3 className="font-heading font-semibold text-lg">{req.reward_title}</h3>
                  <div className="flex items-center gap-1 mt-1">
                    <Coins className="w-4 h-4 text-amber-500" />
                    <span className="font-bold text-amber-600 text-sm">{req.coin_cost} coins</span>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{moment(req.created_date).fromNow()}</span>
              </div>

              <Textarea
                placeholder="Optional message to your child..."
                value={messages[req.id] || ""}
                onChange={e => setMessages(m => ({ ...m, [req.id]: e.target.value }))}
                className="mb-3 text-sm"
                rows={2}
              />

              <div className="flex gap-2">
                <Button
                  onClick={() => handleDecision(req, "approved")}
                  disabled={processing === req.id}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 rounded-xl"
                >
                  {processing === req.id ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Check className="w-4 h-4 mr-1" />}
                  Approve
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDecision(req, "rejected")}
                  disabled={processing === req.id}
                  className="flex-1 rounded-xl border-red-200 text-red-600 hover:bg-red-50"
                >
                  <X className="w-4 h-4 mr-1" /> Reject
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Resolved */}
      {resolved.length > 0 && (
        <div>
          <h2 className="font-heading font-semibold text-foreground mb-3">History</h2>
          <div className="space-y-2">
            {resolved.map(req => (
              <div key={req.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-border/50">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  req.status === "approved" ? "bg-emerald-100" : "bg-red-100"
                }`}>
                  {req.status === "approved"
                    ? <Check className="w-4 h-4 text-emerald-600" />
                    : <X className="w-4 h-4 text-red-500" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{req.reward_title}</p>
                  <p className="text-xs text-muted-foreground">{req._student_name} · {moment(req.created_date).fromNow()}</p>
                </div>
                <span className="text-sm font-medium text-amber-600">{req.coin_cost}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}