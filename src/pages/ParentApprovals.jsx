import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Check, X, Coins, Clock, Loader2, Sparkles, MessageCircle, AlertCircle } from "lucide-react";
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
      
      const relationships = await base44.entities.ParentChildRelationship.filter({
        parent_id: user.id,
        status: "active",
      });

      if (relationships.length > 0) {
        const requestsArrays = await Promise.all(
          relationships.map(async (rel) => {
            try {
              const studentProfile = await base44.entities.User.get(rel.child_id);
              
              // PRIORITIZE FRIENDLY NAMES: Checks nickname first, then falls back progressively down to "Pelajar"
              const friendlyName = 
                studentProfile.nickname || 
                studentProfile.display_name || 
                studentProfile.full_name || 
                "Pelajar";
              
              const reqs = await base44.entities.RewardRequest.filter({ student_id: rel.child_id }, "-created_date", 20);
              
              return reqs.map(r => ({
                ...r,
                _student_name: friendlyName
              }));
            } catch (err) {
              console.error(`Skipping request load block for student ID ${rel.child_id}:`, err);
              return [];
            }
          })
        );
        
        const allReqs = requestsArrays.flat();
        allReqs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
        setRequests(allReqs);
      } else {
        setRequests([]);
      }
    } catch (err) {
      console.error("Error loading approvals dashboard framework:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // FIXED: Membuang base44.auth.getToken() untuk mengelakkan ralat fungsi
  const handleDecision = async (req, decision) => {
    setProcessing(req.id);
    try {
      // Panggil API backend standard, pelayar akan menyertakan kuki sesi/kredensial secara automatik
      const response = await fetch("/api/approve-reward-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          requestId: req.id,
          decision: decision, // "approved" atau "rejected"
          responseMessage: messages[req.id] || ""
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Gagal menyimpan keputusan.");
      }

      toast({ 
        title: decision === "approved" ? "Ganjaran berjaya diluluskan! 🎁" : "Permintaan ditolak.",
        variant: decision === "approved" ? "default" : "destructive"
      });
      
      // Bersihkan memo teks bagi id ini
      setMessages(prev => { const copy = { ...prev }; delete copy[req.id]; return copy; });
      
      // Muat semula pangkalan data
      setTimeout(() => { loadData(); }, 300);
    } catch (err) {
      console.error(err);
      toast({ 
        title: "Transaction Error", 
        description: err.message || "Failed to save request decision details.", 
        variant: "destructive" 
      });
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-500 animate-pulse">Memeriksa log kelulusan...</p>
      </div>
    );
  }

  const pending = requests.filter(r => r.status === "pending");
  const approved = requests.filter(r => r.status === "approved");
  const rejected = requests.filter(r => r.status === "rejected" || r.status === "declined");

  return (
    <div className="space-y-8 pb-12 max-w-5xl mx-auto px-1">
      
      {/* 1. VIEW ACTION BANNER HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 border border-slate-100 p-6 rounded-3xl shadow-2xs">
        <div>
          <div className="flex items-center gap-1.5 mb-1 text-xs font-bold uppercase tracking-wider text-indigo-600">
            <Sparkles className="w-3.5 h-3.5 fill-indigo-100" />
            Pusat Keputusan
          </div>
          <h1 className="text-2xl font-black font-heading tracking-tight text-slate-800">Kelulusan Ganjaran ✅</h1>
          <p className="text-slate-500 text-sm mt-0.5">Semak, sahkan, atau beri ulasan pada hadiah yang dituntut oleh profil anak anda.</p>
        </div>
        
        <div className={`px-4 py-2.5 rounded-2xl border font-bold text-sm shrink-0 shadow-3xs ${
          pending.length > 0 ? "bg-amber-50 text-amber-700 border-amber-200/70" : "bg-slate-100 text-slate-500 border-transparent"
        }`}>
          {pending.length} Tugasan Perlu Semakan
        </div>
      </div>

      {/* 2. PENDING REQUESTS SECTION */}
      <div className="space-y-4">
        <h2 className="text-lg font-extrabold text-slate-800 font-heading flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-500" /> Menunggu Semakan
        </h2>

        {pending.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-100 shadow-sm max-w-md mx-auto">
            <Check className="w-10 h-10 text-emerald-500 bg-emerald-50 p-2 rounded-full mx-auto mb-3" />
            <h3 className="font-bold text-slate-700">Peti Masuk Kosong!</h3>
            <p className="text-slate-400 text-xs px-6 mt-1">
              Tiada tuntutan hadiah baharu yang memerlukan tanda tangan anda buat masa ini.
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
                        {moment(req.created_date).utcOffset("+08:00").fromNow()}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 bg-amber-50/60 border border-amber-100/60 w-fit px-3 py-1 rounded-xl mb-4 shadow-3xs">
                      <Coins className="w-4 h-4 text-amber-500 fill-amber-400/20" />
                      <span className="font-black text-amber-700 text-xs">{req.coin_cost} Syiling Emas Diminta</span>
                    </div>

                    <div className="space-y-1 mb-4 relative">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <MessageCircle className="w-3 h-3 text-slate-400" /> Nota Memo Ibu Bapa (Opsional)
                      </label>
                      <Textarea
                        placeholder="Syabas anak bijak! / Mari kita bincang tentang cara menyimpan dahulu..."
                        value={messages[req.id] || ""}
                        onChange={e => setMessages(m => ({ ...m, [req.id]: e.target.value }))}
                        className="rounded-xl border-slate-200 focus-visible:ring-indigo-500 text-xs py-2 bg-slate-50/40 resize-none font-medium min-h-[60px]"
                        rows={2}
                      />
                    </div>
                  </div>

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

      {/* 3. APPROVED REWARDS SECTION */}
      {approved.length > 0 && (
        <div className="space-y-4 pt-2">
          <h2 className="text-md font-extrabold text-emerald-700 font-heading flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 bg-emerald-50 rounded-full p-0.5" /> Sejarah Ganjaran Diluluskan
          </h2>
          
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {approved.map(req => (
              <div key={req.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-3xs flex flex-col justify-between hover:border-slate-200/80 transition-colors">
                <div>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                      👤 {req._student_name}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400 shrink-0">
                      {moment(req.created_date).utcOffset("+08:00").format("MMM Do, h:mm a")}
                    </span>
                  </div>
                  
                  <h3 className="font-bold text-slate-800 text-sm leading-tight tracking-tight mb-3">
                    {req.reward_title}
                  </h3>

                  {req.parent_response_message && (
                    <div className="bg-slate-50 rounded-xl p-2 border border-slate-100/60 mb-3">
                      <p className="text-[11px] text-slate-400 font-medium italic leading-normal">
                        💬 "{req.parent_response_message}"
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-slate-50/60 pt-2.5 mt-1">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide flex items-center gap-1 bg-emerald-50/50 px-2 py-0.5 rounded-md border border-emerald-100/30">
                    <Check className="w-3 h-3 stroke-[3]" /> Ditebus
                  </span>
                  <div className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100/60 text-emerald-600">
                    <span className="text-xs font-black">-{req.coin_cost}</span>
                    <Coins className="w-3 h-3 text-amber-500/80" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. REJECTED REQUESTS SECTION */}
      {rejected.length > 0 && (
        <div className="space-y-4 pt-2">
          <h2 className="text-md font-extrabold text-rose-700 font-heading flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500" /> Rekod Tuntutan Ditolak
          </h2>
          
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rejected.map(req => (
              <div key={req.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-3xs flex flex-col justify-between bg-slate-50/20 hover:border-slate-200/80 transition-colors">
                <div>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                      👤 {req._student_name}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400 shrink-0">
                      {moment(req.created_date).utcOffset("+08:00").format("MMM Do, h:mm a")}
                    </span>
                  </div>
                  
                  <h3 className="font-bold text-slate-500 text-sm leading-tight tracking-tight mb-3 line-through decoration-slate-300">
                    {req.reward_title}
                  </h3>

                  {req.parent_response_message && (
                    <div className="bg-rose-50/30 rounded-xl p-2 border border-rose-100/40 mb-3">
                      <p className="text-[11px] text-rose-600/80 font-medium italic leading-normal">
                        Sebab: "{req.parent_response_message}"
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-slate-50/60 pt-2.5 mt-1">
                  <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wide flex items-center gap-1 bg-rose-50/50 px-2 py-0.5 rounded-md border border-rose-100/30">
                    <X className="w-3 h-3 stroke-[3]" /> Ditolak
                  </span>
                  <div className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100/60 text-slate-400 line-through">
                    <span className="text-xs font-bold">{req.coin_cost}</span>
                    <Coins className="w-3 h-3 text-slate-300" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
