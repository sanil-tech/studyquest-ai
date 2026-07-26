// src/pages/StudentDashboard.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  Trophy, BookOpen, Target, Award, Play, CheckCircle2, 
  UserCheck, UserX, ShieldAlert, Sparkles, Leaf, TreePine, 
  Sprout, LogOut, Compass, Flame, Rocket
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import moment from "moment";
import AvatarDisplay from "@/components/avatar/AvatarDisplay";

// Subject Worlds Data
const SUBJECT_WORLDS = [
  {
    id: "science",
    name: "Sains",
    world: "Discovery Jungle",
    mascot: "Bimo Orangutan",
    emoji: "🦧",
    color: "from-emerald-400 to-green-600",
    badgeBg: "bg-emerald-100 text-emerald-800",
    path: "/lessons?subject=science",
  },
  {
    id: "math",
    name: "Matematik",
    world: "Number Island",
    mascot: "Suku Penyu",
    emoji: "🐢",
    color: "from-blue-400 to-indigo-600",
    badgeBg: "bg-blue-100 text-blue-800",
    path: "/lessons?subject=math",
  },
  {
    id: "bm",
    name: "Bahasa Melayu",
    world: "Story Village",
    mascot: "Lila Enggang",
    emoji: "🦜",
    color: "from-amber-400 to-orange-600",
    badgeBg: "bg-amber-100 text-amber-800",
    path: "/lessons?subject=bm",
  },
  {
    id: "english",
    name: "Bahasa Inggeris",
    world: "Adventure Bay",
    mascot: "Ollie Memerang",
    emoji: "🦦",
    color: "from-cyan-400 to-teal-600",
    badgeBg: "bg-cyan-100 text-cyan-800",
    path: "/lessons?subject=english",
  },
  {
    id: "history",
    name: "Sejarah",
    world: "Time Valley",
    mascot: "Gajah",
    emoji: "🐘",
    color: "from-stone-400 to-amber-700",
    badgeBg: "bg-amber-100 text-amber-900",
    path: "/lessons?subject=history",
  },
  {
    id: "art",
    name: "Pendidikan Seni",
    world: "Rainbow Garden",
    mascot: "Lumi Rama-Rama",
    emoji: "🦋",
    color: "from-pink-400 to-rose-600",
    badgeBg: "bg-pink-100 text-pink-800",
    path: "/lessons?subject=art",
  },
  {
    id: "ict",
    name: "RBT & TMK",
    world: "Tech City",
    mascot: "Byte Robot",
    emoji: "🤖",
    color: "from-purple-400 to-violet-600",
    badgeBg: "bg-purple-100 text-purple-800",
    path: "/lessons?subject=ict",
  }
];

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [dashboardState, setDashboardState] = useState({
    user: null,
    activeChildId: null,
    progress: { level: 1, total_xp: 0, streak_days: 0 },
    wallet: { balance: 0 },
    sessions: [],
    quizzes: [],
    pendingRequests: [],
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Load Dashboard Data
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const currentUser = await base44.auth.me();

      const activeChildId = currentUser.app_role === "parent" 
        ? localStorage.getItem("active_child_session") 
        : null;
      
      let studentUser = currentUser;
      let progress = { level: 1, total_xp: 0, streak_days: 0 };
      let wallet = { balance: 0 };
      let sessions = [];
      let quizzes = [];
      let pendingRequests = [];

      if (activeChildId) {
        let matchedChild = null;

        try {
          const res = await base44.functions.invoke("fetchParentChildren");
          if (res.data?.success && Array.isArray(res.data?.children)) {
            matchedChild = res.data.children.find((c) => c.id === activeChildId);
          }
        } catch (e) {
          console.warn("Error calling fetchParentChildren:", e);
        }

        if (!matchedChild) {
          const localChildStr = localStorage.getItem("active_child");
          if (localChildStr) {
            try { matchedChild = JSON.parse(localChildStr); } catch (e) {}
          }
        }

        if (matchedChild) {
          studentUser = {
            id: matchedChild.id,
            nickname: matchedChild.nickname || matchedChild.full_name || "Penjelajah",
            full_name: matchedChild.full_name || matchedChild.nickname,
            username: matchedChild.username,
            selected_avatar: matchedChild.selected_avatar || "🦧",
            app_role: "student"
          };
          progress = matchedChild.realProgress || progress;
          wallet = matchedChild.wallet || wallet;
          sessions = matchedChild.allSessions || [];
          quizzes = matchedChild.allAttempts || [];
        } else {
          const storedName = localStorage.getItem("active_student_name") || "Penjelajah";
          studentUser = { id: activeChildId, nickname: storedName, full_name: storedName, app_role: "student" };

          const results = await Promise.allSettled([
            base44.entities.Progress.filter({ student_id: activeChildId }),
            base44.entities.Wallet.filter({ student_id: activeChildId }),
            base44.entities.StudySession.filter({ student_id: activeChildId }, "-created_date", 10),
            base44.entities.QuizAttempt.filter({ student_id: activeChildId }, "-created_date", 10),
          ]);

          if (results[0].status === "fulfilled" && results[0].value?.[0]) progress = results[0].value[0];
          if (results[1].status === "fulfilled" && results[1].value?.[0]) wallet = results[1].value[0];
          if (results[2].status === "fulfilled" && results[2].value) sessions = results[2].value;
          if (results[3].status === "fulfilled" && results[3].value) quizzes = results[3].value;
        }

      } else {
        const studentId = currentUser.id;
        studentUser = currentUser;

        const results = await Promise.allSettled([
          base44.entities.Progress.filter({ student_id: studentId }),
          base44.entities.Wallet.filter({ student_id: studentId }),
          base44.entities.StudySession.filter({ student_id: studentId }, "-created_date", 10),
          base44.entities.QuizAttempt.filter({ student_id: studentId }, "-created_date", 10),
          base44.entities.ParentChildRelationship.filter({ child_id: studentId, status: "pending" }),
        ]);

        if (results[0].status === "fulfilled" && results[0].value?.[0]) progress = results[0].value[0];
        if (results[1].status === "fulfilled" && results[1].value?.[0]) wallet = results[1].value[0];
        if (results[2].status === "fulfilled" && results[2].value) sessions = results[2].value;
        if (results[3].status === "fulfilled" && results[3].value) quizzes = results[3].value;
        
        const pendingRels = results[4].status === "fulfilled" ? results[4].value : [];

        if (pendingRels && pendingRels.length > 0) {
          pendingRequests = await Promise.all(
            pendingRels.map(async (rel) => {
              try {
                const parentUser = await base44.entities.User.get(rel.parent_id);
                return {
                  id: rel.id,
                  parent_name: parentUser.full_name || parentUser.nickname || parentUser.username,
                  parent_email: parentUser.email || "Tiada emel",
                };
              } catch {
                return { id: rel.id, parent_name: "Penjaga", parent_email: "Pengesahan diperlukan" };
              }
            })
          );
        }
      }

      setDashboardState({
        user: studentUser,
        activeChildId,
        progress,
        wallet,
        sessions,
        quizzes,
        pendingRequests,
      });

    } catch (err) {
      console.error("Ralat memuat turun data:", err);
      toast({ 
        title: "Alamak!", 
        description: "Gagal memuat turun data pengembaraan anda.", 
        variant: "destructive" 
      });
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
        toast({ title: "Akaun Berjaya Disambung! 🎉", description: "Akaun anda kini terhubung." });
      } else {
        await base44.entities.ParentChildRelationship.delete(relationshipId);
        toast({ title: "Permintaan Ditolak", description: "Sambungan dibatalkan." });
      }
      await loadDashboardData();
    } catch (err) {
      toast({ title: "Gagal memproses", description: "Ralat sistem.", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  }, [toast, loadDashboardData]);

  const handleExitChildMode = () => {
    localStorage.removeItem("active_child_session");
    localStorage.removeItem("selected_child_id");
    localStorage.removeItem("active_student_id");
    localStorage.removeItem("active_student_name");
    localStorage.removeItem("active_child");
    navigate("/parent");
  };

  // ✅ FIX: Clean, isolated calculation object avoids Temporal Dead Zone (TDZ)
  const progressCalculations = useMemo(() => {
    const currentLevel = dashboardState.progress?.level || 1;
    const currentXp = dashboardState.progress?.total_xp || 0;
    const requiredXp = currentLevel * 200;
    const percentage = Math.min((currentXp / requiredXp) * 100, 100);

    return {
      level: currentLevel,
      xp: currentXp,
      nextLevelXp: requiredXp,
      xpPercentage: percentage,
    };
  }, [dashboardState.progress]);

  // Safely destructure after calculation finishes
  const { level, xp, nextLevelXp, xpPercentage } = progressCalculations;

  const todayMinutes = useMemo(() => {
    const todayStart = moment().startOf("day");
    return dashboardState.sessions
      .filter(s => s.created_date && moment(s.created_date).isSame(todayStart, "day"))
      .reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
  }, [dashboardState.sessions]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F4F9F4]">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
          <Sparkles className="w-14 h-14 text-emerald-500" />
        </motion.div>
        <p className="mt-4 text-base font-extrabold text-emerald-800 tracking-wide">
          Membuka Pintu Hutan Maya...
        </p>
      </div>
    );
  }

  const { user, progress, wallet, sessions, quizzes, pendingRequests, activeChildId } = dashboardState;

  return (
    <div className="min-h-screen bg-[#F4F9F4] font-sans pb-24 text-stone-800 selection:bg-lime-200">
      
      {/* 1. TOP STATS BAR */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b-4 border-stone-200/80 px-4 py-3">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-black px-4 py-1.5 rounded-2xl shadow-md text-sm border-b-2 border-green-700">
              <TreePine className="w-5 h-5" />
              <span>Dahan {level}</span>
            </div>
            {activeChildId && (
              <button
                onClick={handleExitChildMode}
                className="flex items-center gap-1 font-bold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 text-xs active:scale-95 transition-transform"
              >
                <LogOut className="w-4 h-4" /> Keluar
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 font-extrabold text-amber-600 bg-amber-100/80 px-3.5 py-1.5 rounded-2xl border-b-2 border-amber-300 text-sm">
              <Flame className="w-5 h-5 text-amber-500 fill-amber-400 animate-bounce" />
              <span>{progress?.streak_days || 0} Hari</span>
            </div>
            <div className="flex items-center gap-1.5 font-extrabold text-lime-700 bg-lime-100/80 px-3.5 py-1.5 rounded-2xl border-b-2 border-lime-300 text-sm">
              <Leaf className="w-5 h-5 text-lime-600 fill-lime-500" />
              <span>{wallet?.balance || 0} Daun</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 mt-6 space-y-8">
        
        {/* 2. HERO BANNER */}
        <motion.div 
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 120 }}
          className="relative bg-gradient-to-r from-emerald-600 via-green-600 to-teal-700 rounded-[2.5rem] p-6 sm:p-8 text-white shadow-xl border-b-8 border-green-800 overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            <div className="relative">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white/20 p-2 border-4 border-white/40 shadow-inner flex items-center justify-center">
                <AvatarDisplay xp={xp} size="lg" variant="plain" />
              </div>
              <span className="absolute -bottom-1 -right-1 bg-amber-400 text-stone-900 font-black text-xs px-2.5 py-1 rounded-full border-2 border-white shadow-sm">
                Lv. {level}
              </span>
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 bg-lime-400 text-green-950 font-black px-3 py-1 rounded-full text-xs uppercase tracking-wider mb-2 shadow-sm">
                <Sparkles className="w-3.5 h-3.5" /> Wira StudyQuest
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight drop-shadow-md">
                Selamat Datang, {user?.nickname || "Penjelajah"}!
              </h1>
              <p className="text-emerald-100 font-medium mt-1 text-sm sm:text-base max-w-md">
                Suku, Bimo dan kawan-kawan dah sedia untuk pengembaraan hari ini. Jom buka Dunia Pembelajaran!
              </p>
            </div>
          </div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full md:w-auto">
            <Button 
              onClick={() => navigate("/lessons")}
              className="w-full md:w-auto bg-amber-400 hover:bg-amber-300 text-stone-900 font-black text-lg px-8 py-7 rounded-2xl shadow-lg border-b-4 border-amber-600 flex items-center justify-center gap-2"
            >
              <Rocket className="w-6 h-6 text-stone-900" />
              Teroka Sekarang
            </Button>
          </motion.div>
        </motion.div>

        {/* 3. PARENT LINK PENDING BANNER */}
        <AnimatePresence>
          {pendingRequests.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, height: 0 }}
              className="bg-amber-50 rounded-3xl p-5 border-4 border-amber-200 shadow-sm"
            >
              <div className="flex items-center gap-2 text-amber-900 font-black text-sm uppercase mb-3">
                <ShieldAlert className="w-5 h-5 text-amber-600" /> Jemputan Penjaga
              </div>
              <div className="space-y-3">
                {pendingRequests.map(req => (
                  <div key={req.id} className="bg-white rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border border-amber-200">
                    <div>
                      <p className="font-extrabold text-stone-800">{req.parent_name}</p>
                      <p className="text-xs text-stone-500">{req.parent_email} • Ingin memautkan akaun</p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button 
                        onClick={() => handleLinkAction(req.id, "approve")} 
                        disabled={actionLoading} 
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl"
                      >
                        <UserCheck className="w-4 h-4 mr-1" /> Terima
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => handleLinkAction(req.id, "reject")} 
                        disabled={actionLoading} 
                        className="flex-1 border-stone-300 font-bold rounded-xl"
                      >
                        <UserX className="w-4 h-4 mr-1" /> Tolak
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 4. LEVEL PROGRESS BAR */}
        <div className="bg-white rounded-3xl p-6 border-4 border-stone-200 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <Target className="w-6 h-6 text-emerald-500" />
              <h2 className="text-lg font-black text-stone-800">Kemajuan Dahan Pokok</h2>
            </div>
            <span className="text-xs font-black bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
              {xp} / {nextLevelXp} Meter XP
            </span>
          </div>

          <div className="h-5 bg-stone-100 rounded-full overflow-hidden border-2 border-stone-200 p-0.5">
            <motion.div
              initial={{ width: 0 }} 
              animate={{ width: `${xpPercentage}%` }} 
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-lime-400 via-emerald-500 to-green-600 rounded-full"
            />
          </div>
        </div>

        {/* 5. DUNIA SUBJEK (SUBJECT WORLDS GRID) */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-black text-stone-800 flex items-center gap-2">
                <Compass className="w-7 h-7 text-emerald-600" /> Pilih Dunia Subjek
              </h2>
              <p className="text-sm font-bold text-stone-500">Teroka 7 Dunia Pengembaraan KSSR</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {SUBJECT_WORLDS.map((sw, index) => (
              <motion.div
                key={sw.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -6 }}
                className={`bg-gradient-to-br ${sw.color} rounded-3xl p-5 text-white shadow-lg border-b-8 border-black/20 flex flex-col justify-between relative overflow-hidden group cursor-pointer`}
                onClick={() => navigate(sw.path)}
              >
                <div className="flex justify-between items-start">
                  <span className="text-4xl filter drop-shadow-md group-hover:scale-125 transition-transform duration-300">
                    {sw.emoji}
                  </span>
                  <span className={`text-[11px] font-black uppercase px-2.5 py-1 rounded-full ${sw.badgeBg} shadow-sm`}>
                    {sw.world}
                  </span>
                </div>

                <div className="mt-6">
                  <h3 className="text-xl font-black drop-shadow-sm">{sw.name}</h3>
                  <p className="text-xs font-bold text-white/90 mt-0.5 flex items-center gap-1">
                    Maskot: {sw.mascot}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-white/90">Mula Misi</span>
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-stone-900 transition-colors">
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* 6. RECENT ACTIVITY & QUIZZES */}
        <div className="grid md:grid-cols-2 gap-6">
          
          {/* Recent Lessons */}
          <div className="bg-white rounded-3xl p-6 border-4 border-stone-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-stone-800 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-500" /> Jurnal Pembelajaran
              </h3>
              <span className="text-xs font-extrabold text-stone-500 bg-stone-100 px-2.5 py-1 rounded-lg">
                Hari ini: {todayMinutes} Minit
              </span>
            </div>

            <div className="space-y-3">
              {sessions.length === 0 ? (
                <div className="text-center py-8 text-stone-400 font-bold text-sm">
                  Belum ada rekod pembelajaran hari ini.
                </div>
              ) : (
                sessions.slice(0, 3).map((s) => (
                  <div key={s.id} className="p-3 bg-stone-50 rounded-2xl flex items-center justify-between border border-stone-100">
                    <div>
                      <p className="font-extrabold text-stone-700 text-sm">{s.topic_name || "Meneroka Hutan Ilmu"}</p>
                      <p className="text-[11px] font-medium text-stone-400">{moment(s.created_date).fromNow()}</p>
                    </div>
                    <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg">
                      {s.duration_minutes || 0} min
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quiz Attempts */}
          <div className="bg-white rounded-3xl p-6 border-4 border-stone-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-stone-800 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" /> Ujian Keberanian
              </h3>
            </div>

            <div className="space-y-3">
              {quizzes.length === 0 ? (
                <div className="text-center py-8 text-stone-400 font-bold text-sm">
                  Sedia untuk cabaran minda pertama anda?
                </div>
              ) : (
                quizzes.slice(0, 3).map((q) => {
                  const scoreClass = q.score >= 80 
                    ? "text-emerald-700 bg-emerald-100" 
                    : q.score >= 50 
                      ? "text-amber-700 bg-amber-100" 
                      : "text-rose-700 bg-rose-100";

                  return (
                    <div key={q.id} className="p-3 bg-stone-50 rounded-2xl flex items-center justify-between border border-stone-100">
                      <div>
                        <p className="font-extrabold text-stone-700 text-sm">{q.topic_name || "Cabaran Minda"}</p>
                        <p className="text-[11px] font-medium text-stone-400">{moment(q.created_date).fromNow()}</p>
                      </div>
                      <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${scoreClass}`}>
                        {q.score}%
                      </span>
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
