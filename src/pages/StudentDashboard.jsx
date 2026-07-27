// src/pages/StudentDashboard.jsx
// 🎮 STUDENT EXPERIENCE — "Jungle Adventure" Theme (Age 7-12)
// Design language: warm colors, chunky borders, big shadows, playful animations,
// game-UI elements (badges, meters, quests), large touch targets, encouraging Malay.

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  BookOpen, Award, Play,
  UserCheck, UserX, ShieldAlert, Sparkles, Leaf,
  Sprout, LogOut, Compass, Flame, Rocket, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import moment from "moment";
import AvatarDisplay from "@/components/avatar/AvatarDisplay";
import RecommendationCard from "@/components/student/RecommendationCard";
import { useViewMode } from "@/lib/ViewModeContext";
import { useAuth } from "@/lib/AuthContext";

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
  const { returnToParentMode } = useViewMode();
  const { user: authUser } = useAuth();

  const [dashboardState, setDashboardState] = useState({
    user: null,
    activeChildId: null,
    progress: { level: 1, total_xp: 0, streak_days: 0 },
    wallet: { balance: 0 },
    sessions: [],
    quizzes: [],
    pendingRequests: [],
    diagnosticSession: null,
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Load Dashboard Data
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const currentUser = authUser || await base44.auth.me().catch(() => null);

      if (!currentUser) throw new Error("No user");

      const activeChildId = currentUser.app_role === "parent"
        ? localStorage.getItem("active_child_session")
        : null;

      let studentUser = currentUser;
      let progress = { level: 1, total_xp: 0, streak_days: 0 };
      let wallet = { balance: 0 };
      let sessions = [];
      let quizzes = [];
      let pendingRequests = [];
      let diagnosticSession = null;

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
        // Direct child login: use backend function with service role (bypasses RLS)
        const studentId = currentUser.id;
        studentUser = currentUser;

        const res = await base44.functions.invoke("fetchChildDashboard", {
          student_id: studentId,
        });

        if (res.data?.success) {
          progress = res.data.progress || progress;
          wallet = res.data.wallet || wallet;
          sessions = res.data.sessions || sessions;
          quizzes = res.data.quizzes || quizzes;
          pendingRequests = res.data.pendingRequests || [];
          diagnosticSession = res.data.diagnosticSession || null;
          if (res.data.user?.nickname) {
            studentUser = { ...studentUser, ...res.data.user };
          }
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
        diagnosticSession,
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
    returnToParentMode();
  };

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

  const { level, xp, nextLevelXp, xpPercentage } = progressCalculations;

  const todayMinutes = useMemo(() => {
    const todayStart = moment().startOf("day");
    return dashboardState.sessions
      .filter(s => s.created_date && moment(s.created_date).isSame(todayStart, "day"))
      .reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
  }, [dashboardState.sessions]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
          <Sparkles className="w-14 h-14 text-emerald-500" />
        </motion.div>
        <p className="mt-4 text-base font-extrabold text-emerald-800 tracking-wide">
          Membuka Pintu Hutan Maya...
        </p>
      </div>
    );
  }

  const { user, progress, wallet, sessions, quizzes, pendingRequests, activeChildId, diagnosticSession } = dashboardState;

  return (
    <div className="min-h-screen bg-gradient-to-b from-lime-50 via-emerald-50 to-teal-50 font-sans pb-24 text-stone-800 selection:bg-lime-200">

      {/* ═══ 1. STICKY STATS BAR — Game-UI pills ═══ */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b-4 border-emerald-200/60 px-4 py-3 shadow-sm">
        <div className="max-w-5xl mx-auto flex justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-orange-400 text-stone-900 font-black px-4 py-2 rounded-2xl border-2 border-amber-300 shadow-md text-sm">
              <Star className="w-5 h-5 fill-stone-900" />
              <span>Dahan {level}</span>
            </div>
            {activeChildId && (
              <button
                onClick={handleExitChildMode}
                className="flex items-center gap-1 font-bold text-rose-600 bg-rose-50 px-3 py-2 rounded-xl border border-rose-200 text-xs active:scale-95 transition-transform"
              >
                <LogOut className="w-4 h-4" /> Keluar
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 font-black text-orange-700 bg-orange-100 px-3 py-2 rounded-2xl border-2 border-orange-200 text-sm">
              <Flame className="w-5 h-5 text-orange-500 fill-orange-400" />
              <span>{progress?.streak_days || 0} Hari</span>
            </div>
            <div className="flex items-center gap-1.5 font-black text-lime-700 bg-lime-100 px-3 py-2 rounded-2xl border-2 border-lime-200 text-sm">
              <Leaf className="w-5 h-5 text-lime-600 fill-lime-500" />
              <span>{wallet?.balance || 0} Daun</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 mt-6 space-y-6">

        {/* ═══ 2. HERO BANNER — Immersive adventure greeting ═══ */}
        <motion.div
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100 }}
          className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-emerald-500 via-green-600 to-teal-700 p-6 sm:p-8 text-white shadow-2xl border-b-8 border-green-800"
        >
          {/* Floating decorations */}
          <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 3 }} className="absolute top-4 right-8 text-3xl opacity-30 pointer-events-none">🌿</motion.div>
          <motion.div animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 2.5, delay: 0.5 }} className="absolute bottom-6 left-8 text-2xl opacity-30 pointer-events-none">🍃</motion.div>
          <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 4, delay: 1 }} className="absolute top-12 right-24 text-xl opacity-20 pointer-events-none">✨</motion.div>

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
              <div className="relative">
                <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white/20 p-2 border-4 border-white/40 shadow-inner flex items-center justify-center">
                  <AvatarDisplay xp={xp} size="lg" variant="plain" />
                </motion.div>
                <span className="absolute -bottom-1 -right-1 bg-amber-400 text-stone-900 font-black text-xs px-2.5 py-1 rounded-full border-2 border-white shadow-sm">
                  Lv. {level}
                </span>
              </div>

              <div>
                <div className="inline-flex items-center gap-1.5 bg-lime-400 text-green-950 font-black px-3 py-1 rounded-full text-xs uppercase tracking-wider mb-2 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5" /> Wira StudyQuest
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-md">
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
                className="w-full md:w-auto bg-amber-400 hover:bg-amber-300 text-stone-900 font-black text-base px-7 py-6 rounded-2xl shadow-lg border-b-4 border-amber-600 flex items-center justify-center gap-2"
              >
                <Rocket className="w-5 h-5 text-stone-900" />
                Teroka Sekarang
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* ═══ 3. DAILY QUEST — Gamified call-to-action ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={
            todayMinutes === 0
              ? "bg-gradient-to-r from-amber-400 to-orange-400 rounded-3xl p-5 border-4 border-amber-300 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4"
              : "bg-gradient-to-r from-emerald-400 to-green-500 rounded-3xl p-5 border-4 border-emerald-300 shadow-md flex items-center gap-4"
          }
        >
          {todayMinutes === 0 ? (
            <>
              <div className="flex items-center gap-4 text-center sm:text-left">
                <div className="text-4xl shrink-0">🗺️</div>
                <div>
                  <p className="font-black text-stone-900 text-base">Misi Hari Ini!</p>
                  <p className="text-sm font-bold text-stone-700">Mula pengembaraan pertama kamu hari ini!</p>
                </div>
              </div>
              <Button onClick={() => navigate("/lessons")} className="bg-stone-900 text-white font-black px-5 py-3 rounded-2xl shrink-0 hover:bg-stone-800">
                Mula! 🚀
              </Button>
            </>
          ) : (
            <>
              <div className="text-4xl shrink-0">⭐</div>
              <div className="text-center sm:text-left">
                <p className="font-black text-white text-base">Hebat! Kamu dah belajar {todayMinutes} minit hari ini!</p>
                <p className="text-sm font-bold text-emerald-50">Teruskan usaha kamu, wira!</p>
              </div>
            </>
          )}
        </motion.div>

        {/* ═══ 4. DIAGNOSTIC BANNER — Quest card ═══ */}
        <AnimatePresence>
          {!diagnosticSession ? (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-3xl p-5 text-white shadow-lg border-b-4 border-purple-900 flex flex-col sm:flex-row items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4 text-center sm:text-left">
                <div className="text-4xl shrink-0">🐢</div>
                <div>
                  <div className="inline-flex items-center gap-1.5 bg-white/20 text-white font-black px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider mb-1">
                    <Compass className="w-3 h-3" /> Misi Penemuan
                  </div>
                  <p className="font-black text-base">Kenal Kemahiran Asas 3M Kamu!</p>
                  <p className="text-xs text-purple-100 mt-0.5">Membaca · Menulis · Mengira — Suku nak tahu tahap permulaan kamu.</p>
                </div>
              </div>
              <Button
                onClick={() => navigate("/diagnostic")}
                className="shrink-0 bg-amber-400 hover:bg-amber-300 text-stone-900 font-black px-6 py-3 rounded-2xl border-b-4 border-amber-600 flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" /> Mula Misi
              </Button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-4 border-2 border-stone-200 shadow-sm flex flex-wrap items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">✅</span>
                <div>
                  <p className="font-black text-sm text-stone-800">Profil Asas 3M Dah Siap!</p>
                  <div className="flex items-center gap-3 mt-1 text-xs font-bold text-stone-500">
                    <span>📖 L{diagnosticSession.reading_level}</span>
                    <span>✏️ L{diagnosticSession.writing_level}</span>
                    <span>🔢 L{diagnosticSession.numeracy_level}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => navigate(`/diagnostic/result/${diagnosticSession.id}`)}
                className="text-xs font-black text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-200 active:scale-95 transition-all"
              >
                Lihat Keputusan →
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══ 5. PARENT LINK PENDING BANNER ═══ */}
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

        {/* ═══ 6. PROGRESS — "Tree Growing" visualization ═══ */}
        <div className="bg-white rounded-3xl p-6 border-4 border-emerald-100 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <Sprout className="w-6 h-6 text-emerald-500" />
              <h2 className="text-lg font-black text-stone-800">Pokok Kamu Semakin Tinggi!</h2>
            </div>
            <span className="text-xs font-black bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
              {xp} / {nextLevelXp} XP
            </span>
          </div>

          <div className="h-7 bg-stone-100 rounded-full overflow-hidden border-2 border-stone-200 p-0.5 relative">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${xpPercentage}%` }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-lime-400 via-emerald-500 to-green-600 rounded-full flex items-center justify-end pr-2"
            >
              {xpPercentage > 15 && <span className="text-lg">🌳</span>}
            </motion.div>
          </div>
          <p className="text-xs font-bold text-stone-500 mt-2 text-center">
            {nextLevelXp - xp} XP lagi untuk naik ke Dahan {level + 1}! 🎯
          </p>
        </div>

        {/* ═══ 7. AI RECOMMENDATION ═══ */}
        <RecommendationCard
          user={user}
          sessions={sessions}
          quizzes={quizzes}
        />

        {/* ═══ 8. SUBJECT WORLDS — Big, playful adventure cards ═══ */}
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
                whileHover={{ y: -6, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
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

        {/* ═══ 9. ADVENTURE JOURNAL — Recent activity ═══ */}
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
                  Belum ada rekod pembelajaran hari ini. 🌱
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
                  Sedia untuk cabaran minda pertama kamu? 🧠
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