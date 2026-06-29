import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Check, X, Coins, Clock, Loader2, Sparkles, MessageCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import moment from "moment";

export default function ParentApprovals() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [messages, setMessages] = useState({});
  const { toast } = useToast();

  const loadData = async () => {
    try {
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
    } catch (err) {
      console.error("Error loading approvals:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleDecision = async (req, decision) => {
    setProcessing(req.id);
    try {
      if (decision === "approved") {
        // Deduct coins from child's wallet
        const wallets = await base44.entities.Wallet.filter({ student_id: req.student_id });
        if (wallets.length > 0) {
          const newBalance = Math.max(0, wallets[0].balance - req.coin_cost);
          await base44.entities.Wallet.update(wallets[0].id, { balance: newBalance });
        }
        
        // Log auditing transaction ledger
        await base44.entities.Transaction.create({
          student_id: req.student_id,
          type: "spend",
          amount: req.coin_cost,
          reason: `Reward approved: ${req.reward_title}`,
          reference_id: req.id,
        });
      }

      // Update approval status request record
      await base44.entities.RewardRequest.update(req.id, {
        status: decision,
        parent_response_message: messages[req.id] || "",
      });

      // Transmit contextual notification alerts back to child profile
      await base44.entities.Notification.create({
        user_id: req.student_id,
        title: decision === "approved" ? "Reward Approved! 🎉" : "Reward Declined 📋",
        message: decision === "approved"
          ? `Your request for "${req.reward_title}" was approved! ${req.coin_cost} coins deducted.`
          : `Your request for "${req.reward_title}" was declined.${messages[req.id] ? ` Notes: ${messages[req.id]}` : ""}`,
        type: decision === "approved" ? "reward_approved" : "reward_rejected",
        reference_id: req.id,
      });

      toast({ 
        title: decision === "approved" ? "Reward granted successfully! 🎁" : "Request declined.",
        variant: decision === "approved" ? "default" : "destructive"
      });
      
      // Clean target comment box and sync remote states
      setMessages(prev => { const copy = { ...prev }; delete copy[req.id]; return copy; });
      loadData();
    } catch (err) {
      console.error(err);
      toast({ title: "Transaction Error", description: "Failed to save request decision details.", variant: "destructive" });
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-500 animate-pulse">Checking approval logs...</p>
      </div>
    );
  }

  const pending = requests.filter(r => r.status === "pending");
  const resolved = requests.filter(r => r.status !== "pending");

  return (
    <div className="space-y-8 pb-12 max-w-5xl mx-auto px-1">
      
      {/* 1. VIEW ACTION BANNER HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 border border-slate-100 p-6 rounded-3xl shadow-2xs">
        <div>
          <div className="flex items-center gap-1.5 mb-1 text-xs font-bold uppercase tracking-wider text-indigo-600">
            <Sparkles className="w-3.5 h-3.5 fill-indigo-100" />
            Decision Center
          </div>
          <h1 className="text-2xl font-black font-heading tracking-tight text-slate-800">Reward Approvals ✅</h1>
          <p className="text-slate-500 text-sm mt-0.5">Review, sign off, or comment on prizes claimed by your connected child profiles.</p>
        </div>
        
        {/* Status Tracker Badge count */}
        <div className={`px-4 py-2.5 rounded-2xl border font-bold text-sm shrink-0 shadow-3xs ${
          pending.length > 0 ? "bg-amber-50 text-amber-700 border-amber-200/70" : "bg-slate-100 text-slate-500 border-transparent"
        }`}>
          {pending.length} Action Item{pending.length !== 1 ? "s" : ""} Remaining
        </div>
      </div>

      {/* 2. PENDING REQUESTS DISPLAY LOGS */}
      <div className="space-y-4">
        <h2 className="text-lg font-extrabold text-slate-800 font-heading flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-500" /> Pending Review
        </h2>

        {pending.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-100 shadow-sm max-w-md mx-auto">
            <Check className="w-10 h-10 text-emerald-500 bg-emerald-50 p-2 rounded-full mx-auto mb-3" />
            <h3 className="font-bold text-slate-700">Inbox Completely Clear!</h3>
            <p className="text-slate-400 text-xs px-6 mt-1">
              No pending orders are awaiting your signature. You are completely up to date.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <AnimatePresence>
              {pending.map((req, i) => (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between hover:border-slate-200 transition-colors relative group"
                >
                  {/* Card Main Metadata Container */}
                  <div>
                    <div className="flex justify-between items-start mb-3 gap-2">
                      <div className="min-w-0">
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 bg-slate-50 px-2.5 py-0.5 rounded-md border border-slate-100">
                          👤 {req._student_name}
                        </span>
                        <h3 className="font-extrabold text-slate-800 text-base leading-tight mt-2 tracking-tight group-hover:text-indigo-600 transition-colors">
                          {req.reward_title}
                        </h3>
                      </div>
                      <span className="text-[11px] font-medium text-slate-400 shrink-0 bg-slate-50 px-2 py-1 rounded-lg">
                        {moment(req.created_date).fromNow()}
                      </span>
                    </div>

                    {/* Cost pricing box layout values */}
                    <div className="flex items-center gap-1.5 bg-amber-50/60 border border-amber-100/60 w-fit px-3 py-1 rounded-xl mb-4 shadow-3xs">
                      <Coins className="w-4 h-4 text-amber-500 fill-amber-400/20" />
                      <span className="font-black text-amber-700 text-xs">{req.coin_cost} Gold Coins Requested</span>
                    </div>

                    {/* Context Message input feedback module box */}
                    <div className="space-y-1 mb-4 relative">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <MessageCircle className="w-3 h-3 text-slate-400" /> Attached Memo (Optional)
                      </label>
                      <Textarea
                        placeholder="Great work study champ! / Let's talk about saving up first..."
                        value={messages[req.id] || ""}
                        onChange={e => setMessages(m => ({ ...m, [req.id]: e.target.value }))}
                        className="rounded-xl border-slate-200 focus-visible:ring-indigo-500 text-xs py-2 bg-slate-50/40 resize-none font-medium min-h-[60px]"
                        rows={2}
                      />
                    </div>
                  </div>

                  {/* Dual Control Command Buttons Segment Footer */}
                  <div className="flex gap-2.5 border-t border-slate-50 pt-3 mt-1">
                    <Button
                      onClick={() => handleDecision(req, "approved")}
                      disabled={processing === req.id}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 font-bold rounded-xl py-4 border-0 shadow-xs text-xs transition-colors"
                    >
                      {processing === req.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5 mr-1 stroke-[3]" />
                      )}
                      Approve Release
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => handleDecision(req, "rejected")}
                      disabled={processing === req.id}
                      className="flex-1 rounded-xl font-bold py-4 border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50/50 text-xs shadow-3xs transition-colors"
                    >
                      <X className="w-3.5 h-3.5 mr-1 stroke-[2.5]" /> Reject Orders
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* 3. COMPLETED RECENT HISTORY LOGS SEGMENT */}
      {resolved.length > 0 && (
        <div className="space-y-4 pt-2">
          <h2 className="text-md font-extrabold text-slate-700 font-heading">Archived History Log</h2>
          
          <div className="bg-white border border-slate-100 rounded-3xl shadow-2xs divide-y divide-slate-100/70 overflow-hidden">
            {resolved.map(req => {
              const isApproved = req.status === "approved";
              return (
                <div key={req.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 hover:bg-slate-50/40 transition-colors">
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Status Circle Frame box styling details indicators */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 shadow-3xs ${
                      isApproved ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-rose-50 border-rose-100 text-rose-500"
                    }`}>
                      {isApproved ? <Check className="w-4 h-4 stroke-[3]" /> : <X className="w-4 h-4 stroke-[3]" />}
                    </div>
                    
                    {/* Log textual context parameters updates summaries */}
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate tracking-tight">{req.reward_title}</p>
                      <p className="text-xs text-slate-400 font-medium flex items-center flex-wrap gap-1 mt-0.5">
                        <span className="font-bold text-slate-500">{req._student_name}</span> 
                        <span>•</span>
                        <span>{moment(req.created_date).format("MMM Do YYYY, h:mm a")}</span>
                        {req.parent_response_message && (
                          <>
                            <span>•</span>
                            <span className="italic text-slate-400 truncate max-w-[200px]">💬 "{req.parent_response_message}"</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Right side numeric wallet balancing tracking display details */}
                  <div className="flex items-center gap-2 self-end sm:self-center bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-100/60 shrink-0">
                    <span className={`text-xs font-black tracking-tight ${isApproved ? "text-emerald-600" : "text-slate-400 line-through"}`}>
                      {isApproved ? "-" : ""}{req.coin_cost}
                    </span>
                    <Coins className="w-3.5 h-3.5 text-amber-500/80" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}