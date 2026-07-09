// src/pages/StudentDashboard.jsx
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  Coins, Trophy, Clock, BookOpen, Flame, 
  Target, Sparkles, Award, ArrowRight, Play, CheckCircle2, UserCheck, UserX, ShieldAlert, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import moment from "moment";

export default function StudentDashboard() {
  const [user, setUser] = useState(null);
  const [progress, setProgress] = useState({ level: 1, total_xp: 0, streak_days: 0 });
  const [wallet, setWallet] = useState({ balance: 0 });
  const [sessions, setSessions] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const [progressData, walletData, sessionData, quizData, pendingRels] = await Promise.all([
        base44.entities.Progress.filter({ student_id: currentUser.id }),
        base44.entities.Wallet.filter({ student_id: currentUser.id }),
        base44.entities.StudySession.filter({ student_id: currentUser.id }, "-created_date", 10),
        base44.entities.QuizAttempt.filter({ student_id: currentUser.id }, "-created_date", 10),
        base44.entities.ParentChildRelationship.filter({ child_id: currentUser.id, status: "pending" }),
      ]);

      if (progressData?.[0]) setProgress(progressData[0]);
      if (walletData?.[0]) setWallet(walletData[0]);
      if (sessionData) setSessions(sessionData);
      if (quizData) setQuizzes(quizData);

      if (pendingRels && pendingRels.length > 0) {
        const hydratedRequests = await Promise.all(
          pendingRels.map(async (rel) => {
            try {
              const parentUser = await base44.entities.User.get(rel.parent_id);
              return {
                id: rel.id,
                parent_name: parentUser.full_name || parentUser.nickname || parentUser.username,
                parent_email: parentUser.email || "No contact email linked",
              };
            } catch {
              return {
                id: rel.id,
                parent_name: "Unknown Parent Account",
                parent_email: "System verification required",
              };
            }
          })
        );
        setPendingRequests(hydratedRequests);
      } else {
        setPendingRequests([]);
      }
    } catch (err) {
      console.error("Error loading student dashboard:", err);
      toast({ title: "Oops!", description: "Failed to load your learning data.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleLinkAction = async (relationshipId, actionType) => {
    setActionLoading(true);
    try {
      if (actionType === "approve") {
        await base44.entities.ParentChildRelationship.update(relationshipId, { status: "active" });
        toast({ title: "Family Link Approved! 🎉", description: "Your dashboard is now successfully connected to your parent." });
      } else {
        await base44.entities.ParentChildRelationship.delete(relationshipId);
        toast({ title: "Request Declined", description: "Dismissed dashboard connection map successfully." });
      }
      loadDashboardData();
    } catch (err) {
      console.error(err);
      toast({ title: "Action Failed", description: err.message || "Network error processing link", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const level = progress?.level || 1;
  const xp = progress?.total_xp || 0;
  const nextLevelXp = level * 200;
  const xpPercentage = Math.min((xp / nextLevelXp) * 100, 100);

  const today = moment();
  const todayMinutes = sessions
    .filter(s => s.created_date && moment(s.created_date).isSame(today, "day"))
    .reduce((sum, s) => sum + (s.duration_minutes || 0), 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 bg-[#F4F8FA]">
        <div className="w-16 h-16 rounded-[2rem] bg-sky-400 animate-bounce shadow-[0_8px_0_#0284c7]" />
        <p className="text-sm font-black text-slate-400 tracking-widest uppercase mt-4">Memuatkan Dunia...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F8FA] font-sans pb-24 text-slate-700">
      
      {/* 1. DUOLINGO-STYLE STICKY TOP BAR */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b-2 border-slate-200 px-4 py-3 flex justify-between items-center max-w-5xl mx-auto shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 font-black text-amber-500 bg-amber-50 px-3 py-1.5 rounded-2xl border-b-4 border-amber-200">
            <Trophy className="w-5 h-5 fill-amber-500" />
            <span className="text-lg">{level}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-black text-orange-500">
            <Flame className="w-6 h-6 fill-orange-500 drop-shadow-sm" />
            <span className="text-lg">{progress?.streak_days || 0}</span>
          </div>
          <div className="flex items-center gap-1.5 font-black text-sky-500">
            <Coins className="w-6 h-6 fill-sky-500 drop-shadow-sm" />
            <span className="text-lg">{wallet?.balance || 0}</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-6 space-y-8">
        
        {/* 2. PIXAR 3D HERO PODIUM */}
        <div className="relative bg-gradient-to-b from-sky-400 to-blue-500 rounded-[2.5rem] p-8 sm:p-10 text-white border-[3px] border-sky-300 border-b-[12px] border-b-blue-700 shadow-2xl overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Volumetric Light overlays */}
          <div className="absolute top-[-50%] left-[-20%] w-[150%] h-[150%] bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-white/30 via-transparent to-transparent pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            {/* 3D Avatar Platform */}
            <div className="relative">
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 h-6 bg-black/20 blur-md rounded-[100%]" />
              <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-white to-slate-100 shadow-[inset_0_-8px_12px_rgba(0,0,0,0.1),_0_8px_16px_rgba(0,0,0,0.2)] flex items-center justify-center text-5xl transform rotate-3 hover:rotate-[-3deg] hover:scale-105 transition-all duration-300 relative z-10 border-2 border-white/50">
                {user?.avatar_emoji || "🚀"}
              </div>
            </div>

            <div>
              <h1 className="text-3xl sm:text-4xl font-black drop-shadow-md tracking-tight">
                Hai, {user?.nickname || user?.full_name?.split(" ")[0] || "Juara"}!
              </h1>
              <p className="text-sky-100 font-bold mt-2 text-sm sm:text-base drop-shadow-sm">
                Sedia untuk sambung pengembaraan hari ini?
              </p>
            </div>
          </div>

          {/* Chunky 3D Action Button */}
          <button className="relative z-10 bg-gradient-to-b from-green-400 to-green-500 text-white font-black text-lg px-8 py-5 rounded-[2rem] border-2 border-green-300 border-b-[8px] border-b-green-700 shadow-[0_10px_20px_rgba(34,197,94,0.4)] active:border-b-0 active:translate-y-[8px] transition-all duration-150 flex items-center gap-3 group whitespace-nowrap">
            <Play className="w-6 h-6 fill-white drop-shadow-sm group-hover:scale-110 transition-transform" />
            TERUSKAN
          </button>
        </div>

        {/* 3. PENDING PARENT REQUEST (Stylized as a 3D Envelope/Alert) */}
        <AnimatePresence>
          {pendingRequests.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: -20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, height: 0 }}
              className="bg-gradient-to-b from-amber-300 to-orange-400 rounded-[2rem] p-6 border-4 border-amber-200 border-b-[8px] border-b-orange-600 shadow-xl"
            >
              <div className="flex items-center gap-3 text-white font-black text-lg mb-4 drop-shadow-md">
                <ShieldAlert className="w-6 h-6" /> Permintaan Sambungan Keluarga
              </div>
              
              <div className="space-y-3">
                {pendingRequests.map(req => (
                  <div key={req.id} className="bg-white rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-b-4 border-slate-200 shadow-sm">
                    <div className="text-center sm:text-left">
                      <p className="text-base font-black text-slate-800">{req.parent_name}</p>
                      <p className="text-xs font-bold text-slate-400 mt-1">{req.parent_email}</p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button onClick={() => handleLinkAction(req.id, "approve")} disabled={actionLoading} className="flex-1 sm:flex-none bg-sky-500 text-white font-black px-5 py-3 rounded-xl border-b-4 border-sky-700 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-2">
                        <UserCheck className="w-4 h-4" /> Terima
                      </button>
                      <button onClick={() => handleLinkAction(req.id, "reject")} disabled={actionLoading} className="flex-1 sm:flex-none bg-slate-200 text-slate-500 font-black px-5 py-3 rounded-xl border-b-4 border-slate-300 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-2">
                        <UserX className="w-4 h-4" /> Tolak
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 4. PROGRESS BAR (Khan Academy Mastery Concept + 3D styling) */}
        <div className="bg-white rounded-[2rem] p-6 sm:p-8 border-2 border-slate-100 border-b-[8px] border-b-slate-200 shadow-lg">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <Target className="w-6 h-6 text-sky-500" /> Tahap Penguasaan
              </h2>
              <p className="text-sm font-bold text-slate-400 mt-1">{xp} / {nextLevelXp} XP terkumpul</p>
            </div>
            <div className="hidden sm:block text-xs font-black text-amber-600 bg-amber-100 px-3 py-1.5 rounded-xl border-b-2 border-amber-200">
              {Math.round(nextLevelXp - xp)} XP lagi ke Tahap {level + 1}!
            </div>
          </div>

          <div className="h-8 bg-slate-100 rounded-full overflow-hidden p-1.5 shadow-[inset_0_4px_6px_rgba(0,0,0,0.1)] relative">
            {/* The 3D fill bar */}
            <motion.div
              initial={{ width: 0 }} animate={{ width: `${xpPercentage}%` }} transition={{ duration: 1.5, ease: "easeOut" }}
              className="h-full bg-gradient-to-b from-sky-300 to-sky-500 rounded-full relative overflow-hidden"
            >
              {/* Glossy top highlight */}
              <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/30 rounded-t-full" />
            </motion.div>
          </div>
        </div>

        {/* 5. SPLIT SECTIONS (Lessons & Quizzes in chunky blocks) */}
        <div className="grid md:grid-cols-2 gap-6">
          
          {/* Recent Lessons Box */}
          <div className="bg-white rounded-[2rem] p-6 border-2 border-slate-100 border-b-[8px] border-b-slate-200 shadow-lg flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-emerald-500 fill-emerald-100" /> Nota Terkini
              </h3>
            </div>
            
            <div className="space-y-4 flex-1">
              {sessions.length === 0 ? (
                <p className="text-center text-slate-400 font-bold py-10">Belum ada kelas hari ini!</p>
              ) : (
                sessions.slice(0, 3).map((s) => (
                  <div key={s.id} className="group relative bg-slate-50 p-4 rounded-2xl border-2 border-slate-100 hover:border-sky-300 transition-colors flex items-center justify-between">
                    <div className="min-w-0 pr-4">
                      <p className="font-black text-slate-700 truncate">{s.topic_name || "Bilik Darjah"}</p>
                      <p className="text-xs font-bold text-slate-400 mt-1">{moment(s.created_date).fromNow()}</p>
                    </div>
                    <div className="bg-emerald-100 text-emerald-600 font-black text-xs px-3 py-1.5 rounded-xl border-b-2 border-emerald-200 shrink-0">
                      {s.duration_minutes || 0} min
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Quizzes Box */}
          <div className="bg-white rounded-[2rem] p-6 border-2 border-slate-100 border-b-[8px] border-b-slate-200 shadow-lg flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Star className="w-6 h-6 text-amber-400 fill-amber-100" /> Rekod Kuiz
              </h3>
            </div>
            
            <div className="space-y-4 flex-1">
              {quizzes.length === 0 ? (
                <p className="text-center text-slate-400 font-bold py-10">Jom uji minda sekarang!</p>
              ) : (
                quizzes.slice(0, 3).map((q) => {
                  const isHigh = q.score >= 80;
                  const colorTheme = isHigh 
                    ? "bg-green-100 text-green-600 border-green-200" 
                    : q.score >= 50 
                      ? "bg-amber-100 text-amber-600 border-amber-200" 
                      : "bg-red-100 text-red-500 border-red-200";

                  return (
                    <div key={q.id} className="group relative bg-slate-50 p-4 rounded-2xl border-2 border-slate-100 hover:border-amber-300 transition-colors flex items-center justify-between">
                      <div className="min-w-0 pr-4">
                        <p className="font-black text-slate-700 truncate">{q.topic_name || "Ujian Penilaian"}</p>
                        <p className="text-xs font-bold text-slate-400 mt-1">{moment(q.created_date).fromNow()}</p>
                      </div>
                      <div className={`${colorTheme} font-black text-sm px-3 py-2 rounded-xl border-b-2 shrink-0 flex items-center gap-1`}>
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