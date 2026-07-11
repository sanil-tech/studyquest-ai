// src/pages/StudentDashboard.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import {
  Trophy, BookOpen, Target, Award, Play, CheckCircle2, 
  UserCheck, UserX, ShieldAlert, Sparkles, Leaf, TreePine, Sprout
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import moment from "moment";

export default function StudentDashboard() {
  const [dashboardState, setDashboardState] = useState({
    user: null,
    progress: { level: 1, total_xp: 0, streak_days: 0 },
    wallet: { balance: 0 },
    sessions: [],
    quizzes: [],
    pendingRequests: [],
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const currentUser = await base44.auth.me();

      // Gunakan Promise.allSettled untuk API yang lebih kebal (resilient)
      const results = await Promise.allSettled([
        base44.entities.Progress.filter({ student_id: currentUser.id }),
        base44.entities.Wallet.filter({ student_id: currentUser.id }),
        base44.entities.StudySession.filter({ student_id: currentUser.id }, "-created_date", 10),
        base44.entities.QuizAttempt.filter({ student_id: currentUser.id }, "-created_date", 10),
        base44.entities.ParentChildRelationship.filter({ child_id: currentUser.id, status: "pending" }),
      ]);

      const progress = results[0].status === "fulfilled" && results[0].value?.[0] 
        ? results[0].value[0] 
        : { level: 1, total_xp: 0, streak_days: 0 };
      const wallet = results[1].status === "fulfilled" && results[1].value?.[0] 
        ? results[1].value[0] 
        : { balance: 0 };
      const sessions = results[2].status === "fulfilled" && results[2].value ? results[2].value : [];
      const quizzes = results[3].status === "fulfilled" && results[3].value ? results[3].value : [];
      const pendingRels = results[4].status === "fulfilled" ? results[4].value : [];

      let pendingRequests = [];
      if (pendingRels && pendingRels.length > 0) {
        const hydratedRequests = await Promise.all(
          pendingRels.map(async (rel) => {
            try {
              const parentUser = await base44.entities.User.get(rel.parent_id);
              return {
                id: rel.id,
                parent_name: parentUser.full_name || parentUser.nickname || parentUser.username,
                parent_email: parentUser.email || "Tiada emel",
              };
            } catch {
              return { id: rel.id, parent_name: "Akaun Penjaga Tidak Diketahui", parent_email: "Pengesahan sistem diperlukan" };
            }
          })
        );
        pendingRequests = hydratedRequests;
      }

      // Batch update to avoid multiple re-renders
      setDashboardState({
        user: currentUser,
        progress,
        wallet,
        sessions,
        quizzes,
        pendingRequests,
      });
    } catch (err) {
      console.error("Ralat memuat turun data pelajar:", err);
      toast({ title: "Alamak!", description: "Gagal memuat turun data pembelajaran anda.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { 
    loadDashboardData(); 
  }, [loadDashboardData]);

  const handleLinkAction = useCallback(async (relationshipId, actionType) => {
    setActionLoading(true);
    try {
      if (actionType === "approve") {
        await base44.entities.ParentChildRelationship.update(relationshipId, { status: "active" });
        toast({ title: "Akaun Berjaya Disambung! 🎉", description: "Papan pemuka anda kini terhubung dengan ibu bapa." });
      } else {
        await base44.entities.ParentChildRelationship.delete(relationshipId);
        toast({ title: "Permintaan Ditolak", description: "Sambungan dengan ibu bapa telah dibatalkan." });
      }
      loadDashboardData();
    } catch (err) {
      toast({ title: "Gagal memproses", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  }, [toast, loadDashboardData]);

  // Memoize computed values
  const { level, xp, nextLevelXp, xpPercentage } = useMemo(() => {
    const lvl = dashboardState.progress?.level || 1;
    const xpVal = dashboardState.progress?.total_xp || 0;
    const nextLvlXp = lvl * 200;
    const pct = Math.min((xpVal / nextLvlXp) * 100, 100);
    return { level: lvl, xp: xpVal, nextLevelXp: nextLvlXp, xpPercentage: pct };
  }, [dashboardState.progress]);

  // Memoize today's minutes calculation
  const today = useMemo(() => moment(), []);
  const todayMinutes = useMemo(() => 
    dashboardState.sessions
      .filter(s => s.created_date && moment(s.created_date).isSame(today, "day"))
      .reduce((sum, s) => sum + (s.duration_minutes || 0), 0),
    [dashboardState.sessions, today]
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 bg-[#FAFAF7]">
        <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
          <Leaf className="w-12 h-12 text-emerald-500" />
        </motion.div>
        <p className="text-sm font-bold text-emerald-700/60 uppercase tracking-widest">Otan sedang meninjau pokok...</p>
      </div>
    );
  }

  const { user, progress, wallet, sessions, quizzes, pendingRequests } = dashboardState;

  return (
    <div className="min-h-screen bg-[#FAFAF7] font-sans pb-24 text-stone-700">
      
      {/* 1. TOP BAR (Frosted Nature Style) */}
      <div className="sticky top-0 z-50 bg-white/70 backdrop-blur-md border-b border-stone-200/50 px-4 py-3 flex justify-between items-center max-w-5xl mx-auto">
        <div className="flex items-center gap-3">
          {/* Level / Dahan Pokok */}
          <div className="flex items-center gap-1.5 font-black text-emerald-600 bg-emerald-50/80 px-3 py-1.5 rounded-2xl border border-emerald-100">
            <TreePine className="w-5 h-5" />
            <span className="text-sm">Dahan {level}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Streak -> Kelip-kelip */}
          <div className="flex items-center gap-1.5 font-black text-amber-500 bg-amber-50/50 px-3 py-1.5 rounded-2xl">
            <Sparkles className="w-5 h-5 fill-amber-400" />
            <span className="text-sm">{progress?.streak_days || 0}</span>
          </div>
          {/* Wallet -> Daun Emas */}
          <div className="flex items-center gap-1.5 font-black text-lime-600 bg-lime-50/50 px-3 py-1.5 rounded-2xl">
            <Leaf className="w-5 h-5 fill-lime-500" />
            <span className="text-sm">{wallet?.balance || 0}</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-6 space-y-8">
        
        {/* 2. HERO BANNER (Canopy Theme) */}
        <div className="relative bg-gradient-to-br from-emerald-600 to-green-700 rounded-[2rem] p-6 sm:p-10 text-white shadow-lg overflow-hidden flex flex-col md:flex-row items-center justify-between">
          {/* Light rays through leaves */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-inner flex items-center justify-center text-5xl shrink-0">
              🦧 {/* Otan Mascot Emoji */}
            </div>

            <div>
              <div className="flex items-center justify-center md:justify-start gap-2 mb-1.5">
                <span className="bg-lime-400 text-green-900 font-extrabold px-3 py-1 rounded-full text-[10px] uppercase tracking-widest shadow-sm">
                  Akademi Rumah Pokok
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white drop-shadow-sm">
                Hai, {user?.nickname || user?.full_name?.split(" ")[0] || "Penjelajah"}!
              </h1>
              <p className="text-emerald-50 font-medium mt-1.5 text-sm sm:text-base max-w-sm leading-relaxed">
                Otan kata awak dah sedia nak panjat dahan seterusnya hari ini. Jom kumpul Daun Emas!
              </p>
            </div>
          </div>

          <Button className="relative z-10 bg-white text-emerald-700 hover:bg-lime-50 font-extrabold text-base px-6 py-6 rounded-2xl shadow-md border border-emerald-100 group w-full md:w-auto">
            <Sprout className="w-5 h-5 mr-2 text-emerald-600 group-hover:scale-110 transition-transform" />
            Mula Memanjat
          </Button>
        </div>

        {/* 3. PENDING PARENT REQUEST (Wooden Signpost Alert) */}
        <AnimatePresence>
          {pendingRequests.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
              className="bg-[#F3EFE6] rounded-[2rem] p-6 border border-[#E3D9C6] shadow-sm relative overflow-hidden"
            >
              {/* Subtle wood grain or warm background feel */}
              <div className="flex items-center gap-2 text-amber-800 font-black text-sm uppercase tracking-wide mb-4">
                <ShieldAlert className="w-5 h-5" /> Jemputan Keluarga
              </div>
              
              <div className="space-y-3">
                {pendingRequests.map(req => (
                  <div key={req.id} className="bg-white rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border border-[#E3D9C6] shadow-sm">
                    <div className="text-center sm:text-left">
                      <p className="text-base font-black text-stone-800">{req.parent_name}</p>
                      <p className="text-xs font-medium text-stone-500 mt-0.5">{req.parent_email} • Ingin pautkan akaun</p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button 
                        onClick={() => handleLinkAction(req.id, "approve")} 
                        disabled={actionLoading} 
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl h-10">
                        <UserCheck className="w-4 h-4 mr-2" /> Terima
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => handleLinkAction(req.id, "reject")} 
                        disabled={actionLoading} 
                        className="flex-1 border-[#E3D9C6] text-stone-500 font-bold rounded-xl h-10">
                        <UserX className="w-4 h-4 mr-2" /> Tolak
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 4. PROGRESS BAR (Vine Growing Concept) */}
        <div className="bg-white rounded-[2rem] p-6 sm:p-8 border border-emerald-100 shadow-sm relative">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h2 className="text-lg font-black text-stone-800 flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-500" /> Ketinggian Pokok Anda
              </h2>
              <p className="text-sm font-medium text-stone-500 mt-1">{xp} / {nextLevelXp} Meter XP dipanjat</p>
            </div>
            <div className="hidden sm:flex items-center text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl">
              <Leaf className="w-3.5 h-3.5 mr-1" /> {Math.round(nextLevelXp - xp)}M lagi ke Dahan {level + 1}
            </div>
          </div>

          <div className="h-4 bg-[#F3EFE6] rounded-full overflow-hidden shadow-inner relative mt-2">
            <motion.div
              initial={{ width: 0 }} animate={{ width: `${xpPercentage}%` }} transition={{ duration: 1.5, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-lime-400 to-emerald-500 rounded-full"
            />
          </div>
        </div>

        {/* 5. CONTENT CARDS (Minimalist with Subtle Green Touches) */}
        <div className="grid md:grid-cols-2 gap-6">
          
          {/* Nota Terkini */}
          <div className="bg-white rounded-[2rem] p-6 border border-emerald-100 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-black text-stone-800 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-500" /> Jurnal Ilmu Otan
              </h3>
            </div>
            
            <div className="space-y-3 flex-1">
              {sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 opacity-60">
                  <Leaf className="w-10 h-10 text-stone-300 mb-2" />
                  <p className="text-center text-stone-400 font-medium text-sm">Belum ada nota dibaca hari ini.</p>
                </div>
              ) : (
                sessions.slice(0, 3).map((s) => (
                  <div key={s.id} className="group p-3 rounded-2xl hover:bg-emerald-50/50 transition-colors flex items-center justify-between">
                    <div className="min-w-0 pr-4">
                      <p className="font-bold text-stone-700 truncate">{s.topic_name || "Meneroka Hutan Ilmu"}</p>
                      <p className="text-xs font-medium text-stone-400 mt-0.5">{moment(s.created_date).fromNow()}</p>
                    </div>
                    <div className="text-xs font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg shrink-0">
                      {s.duration_minutes || 0} min
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Rekod Kuiz */}
          <div className="bg-white rounded-[2rem] p-6 border border-emerald-100 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-black text-stone-800 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" /> Ujian Keberanian
              </h3>
            </div>
            
            <div className="space-y-3 flex-1">
              {quizzes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 opacity-60">
                  <ShieldAlert className="w-10 h-10 text-stone-300 mb-2" />
                  <p className="text-center text-stone-400 font-medium text-sm">Berani uji minda anda?</p>
                </div>
              ) : (
                quizzes.slice(0, 3).map((q) => {
                  const isHigh = q.score >= 80;
                  const scoreTheme = isHigh 
                    ? "text-emerald-600 bg-emerald-50" 
                    : q.score >= 50 
                      ? "text-amber-600 bg-amber-50" 
                      : "text-rose-500 bg-rose-50";

                  return (
                    <div key={q.id} className="group p-3 rounded-2xl hover:bg-stone-50 transition-colors flex items-center justify-between">
                      <div className="min-w-0 pr-4">
                        <p className="font-bold text-stone-700 truncate">{q.topic_name || "Cabaran Minda"}</p>
                        <p className="text-xs font-medium text-stone-400 mt-0.5">{moment(q.created_date).fromNow()}</p>
                      </div>
                      <div className={`${scoreTheme} text-xs font-black px-2.5 py-1 rounded-lg shrink-0`}>
                        {q.score}%
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}