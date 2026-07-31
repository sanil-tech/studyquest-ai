// src/pages/StudentDashboard.jsx
// 🎮 STUDENT EXPERIENCE — "Jungle Adventure" Theme (Age 7-12)
// Design language: warm colors, chunky borders, big shadows, playful animations,
// game-UI elements (badges, meters, quests), large touch targets, encouraging Malay.

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  BookOpen, Award,
  UserCheck, UserX, ShieldAlert, Sparkles, Coins,
  Moon, Compass, Flame, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import moment from "moment";
import MissionCard from "@/components/student/MissionCard";
import AvatarEvolutionCard from "@/components/student/AvatarEvolutionCard";
import RecommendationCard from "@/components/student/RecommendationCard";
import KSSRMasteryMap from "@/components/student/KSSRMasteryMap";
import AvatarShop from "@/components/student/AvatarShop";
import { parseOwnedItems, parseEquippedItems } from "@/lib/avatarSystem";
import { useViewMode } from "@/lib/ViewModeContext";
import { useAuth } from "@/lib/AuthContext";

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
    creatureId: "otan",
    ownedItems: [],
    equippedItems: {},
    skillProfiles: [],
    kssrSummary: {},
    activeRecommendation: null,
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showAvatarShop, setShowAvatarShop] = useState(false);

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
      let skillProfiles = [];
      let kssrSummary = {};
      let activeRecommendation = null;

      const targetStudentId = activeChildId || currentUser.id;

      // 1. Fetch Aggregated Package
      let pkgSuccess = false;
      try {
        const pkgRes = await base44.functions.invoke("getStudentDashboardPackage", {
          student_id: targetStudentId,
        });

        if (pkgRes.data?.success) {
          pkgSuccess = true;
          progress = pkgRes.data.progress || progress;
          wallet = pkgRes.data.wallet || wallet;
          skillProfiles = pkgRes.data.skillProfiles || [];
          kssrSummary = pkgRes.data.kssrSummary || {};
          activeRecommendation = pkgRes.data.activeRecommendation || null;
          quizzes = pkgRes.data.quizAttempts || [];
          sessions = pkgRes.data.studySessions || [];
          if (pkgRes.data.user) {
            studentUser = { ...studentUser, ...pkgRes.data.user };
          }
        }
      } catch (err) {
        console.warn("getStudentDashboardPackage fallback:", err);
      }

      // 2. Fetch Parent Child details or Child Dashboard Fallback if needed
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

        if (matchedChild) {
          studentUser = {
            id: matchedChild.id,
            nickname: matchedChild.nickname || matchedChild.full_name || "Penjelajah",
            full_name: matchedChild.full_name || matchedChild.nickname,
            username: matchedChild.username,
            selected_avatar: matchedChild.selected_avatar || "🦧",
            app_role: "student",
          };
        }
      }

      // If pkgSuccess is false or additional child info needed, use fetchChildDashboard
      if (!pkgSuccess) {
        try {
          const childRes = await base44.functions.invoke("fetchChildDashboard", {
            student_id: targetStudentId,
          });
          if (childRes.data?.success) {
            progress = childRes.data.progress || progress;
            wallet = childRes.data.wallet || wallet;
            sessions = childRes.data.sessions || sessions;
            quizzes = childRes.data.quizzes || quizzes;
            pendingRequests = childRes.data.pendingRequests || [];
            diagnosticSession = childRes.data.diagnosticSession || null;
            skillProfiles = childRes.data.skillProfiles || skillProfiles;
            if (childRes.data.user) {
              studentUser = { ...studentUser, ...childRes.data.user };
            }
          }
        } catch (e) {
          console.warn("Error calling fetchChildDashboard:", e);
        }
      }

      const creatureId = studentUser?.selected_creature || "otan";
      const ownedItems = parseOwnedItems(studentUser?.owned_avatar_items);
      const equippedItems = parseEquippedItems(studentUser?.equipped_avatar_items);

      setDashboardState({
        user: studentUser,
        activeChildId,
        progress,
        wallet,
        sessions,
        quizzes,
        pendingRequests,
        diagnosticSession,
        creatureId,
        ownedItems,
        equippedItems,
        skillProfiles,
        kssrSummary,
        activeRecommendation,
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

  const handleBuyItem = async (item) => {
    const currentBalance = dashboardState.wallet?.balance || 0;
    if (currentBalance < item.price) {
      toast({ title: "Syiling Tak Cukup!", description: "Kumpul lebih banyak syiling dulu!", variant: "destructive" });
      return;
    }
    try {
      if (dashboardState.wallet?.id) {
        await base44.entities.Wallet.update(dashboardState.wallet.id, {
          balance: currentBalance - item.price,
        });
      }
      const newOwned = [...dashboardState.ownedItems, item.id];
      const ownedJson = JSON.stringify(newOwned);
      if (activeChildId) {
        await base44.functions.invoke("updateChildProfile", {
          child_id: activeChildId,
          owned_avatar_items: ownedJson,
        });
      } else {
        await base44.auth.updateMe({ owned_avatar_items: ownedJson });
      }
      setDashboardState(prev => ({
        ...prev,
        wallet: { ...prev.wallet, balance: currentBalance - item.price },
        ownedItems: newOwned,
      }));
      toast({ title: "Item Dibeli! 🎉", description: `${item.name} ditambah ke koleksi!` });
    } catch (err) {
      toast({ title: "Gagal membeli", description: "Sila cuba lagi.", variant: "destructive" });
    }
  };

  const handleEquipItem = async (item) => {
    try {
      const current = dashboardState.equippedItems;
      let newEquipped;
      if (current[item.slot] === item.id) {
        const { [item.slot]: _removed, ...rest } = current;
        newEquipped = rest;
      } else {
        newEquipped = { ...current, [item.slot]: item.id };
      }
      const equippedJson = JSON.stringify(newEquipped);
      if (activeChildId) {
        await base44.functions.invoke("updateChildProfile", {
          child_id: activeChildId,
          equipped_avatar_items: equippedJson,
        });
      } else {
        await base44.auth.updateMe({ equipped_avatar_items: equippedJson });
      }
      setDashboardState(prev => ({ ...prev, equippedItems: newEquipped }));
      toast({
        title: current[item.slot] === item.id ? "Item Ditanggalkan" : "Item Dipakai! ✨",
        description: item.name,
      });
    } catch (err) {
      toast({ title: "Gagal menyimpan", description: "Sila cuba lagi.", variant: "destructive" });
    }
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

  const {
    user,
    progress,
    wallet,
    sessions,
    quizzes,
    pendingRequests,
    activeChildId,
    diagnosticSession,
    creatureId,
    ownedItems,
    equippedItems,
    skillProfiles,
    kssrSummary,
    activeRecommendation,
  } = dashboardState;

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

          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 font-black text-orange-700 bg-orange-100 px-3 py-2 rounded-2xl border-2 border-orange-200 text-sm">
              <Flame className="w-5 h-5 text-orange-500 fill-orange-400" />
              <span>{progress?.streak_days || 0} Hari</span>
            </div>
            <div className="flex items-center gap-1.5 font-black text-lime-700 bg-lime-100 px-3 py-2 rounded-2xl border-2 border-lime-200 text-sm">
              <Coins className="w-5 h-5 text-lime-600 fill-lime-500" />
              <span>{wallet?.balance || 0} Syiling</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 mt-6 space-y-6">

        {/* ═══ MISSION CARD — Merged hero + daily quest ═══ */}
        <MissionCard
          user={user}
          level={level}
          xp={xp}
          todayMinutes={todayMinutes}
          creatureId={creatureId}
          equippedItems={equippedItems}
          onStart={() => navigate("/lessons")}
        />

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

        {/* ═══ 6. AVATAR EVOLUTION — Visual growth journey ═══ */}
        <AvatarEvolutionCard xp={xp} userName={user?.nickname || "Penjelajah"} creatureId={creatureId} equippedItems={equippedItems} />

        {/* ═══ 6b. AVATAR ACTIONS — Change creature & Shop ═══ */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate("/profile")}
            className="bg-white rounded-2xl p-4 border-2 border-stone-200 shadow-sm flex flex-col items-center gap-1 active:scale-95 transition-all"
          >
            <span className="text-2xl">🐾</span>
            <span className="text-xs font-black text-stone-700">Tukar Rakan</span>
          </button>
          <button
            onClick={() => setShowAvatarShop(true)}
            className="bg-gradient-to-r from-amber-400 to-orange-400 rounded-2xl p-4 border-2 border-amber-300 shadow-sm flex flex-col items-center gap-1 active:scale-95 transition-all"
          >
            <span className="text-2xl">🛍️</span>
            <span className="text-xs font-black text-stone-800">Kedai Avatar</span>
          </button>
        </div>

        {/* ═══ 7. AI RECOMMENDATION ═══ */}
        <RecommendationCard
          initialRecommendation={activeRecommendation}
          user={user}
          onRefresh={loadDashboardData}
        />

        {/* ═══ 7b. RPG-STYLE KSSR / KSSM MASTERY MAP ═══ */}
        <KSSRMasteryMap
          skillProfiles={skillProfiles}
          summary={kssrSummary}
          onSelectStandard={(standard, subject) => navigate(`/lessons?subject=${encodeURIComponent(subject)}`)}
        />

        {/* ═══ 8. ADVENTURE JOURNAL — Recent activity ═══ */}
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

        {/* ═══ 10. END JOURNEY — Prominent kid-friendly exit ═══ */}
        {activeChildId && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExitChildMode}
            className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 rounded-3xl p-6 text-white shadow-lg border-b-4 border-indigo-800 flex items-center justify-center gap-3"
          >
            <Moon className="w-7 h-7" />
            <div className="text-center">
              <p className="text-lg font-black">Tamat Pengembaraan Hari Ini</p>
              <p className="text-xs font-bold text-indigo-100 mt-0.5">Klik untuk kembali kepada Ibu Bapa 🌙</p>
            </div>
          </motion.button>
        )}

      </div>

      {/* Avatar Shop Modal */}
      {showAvatarShop && (
        <AvatarShop
          walletBalance={wallet?.balance || 0}
          ownedItems={ownedItems}
          equippedItems={equippedItems}
          onBuy={handleBuyItem}
          onEquip={handleEquipItem}
          onClose={() => setShowAvatarShop(false)}
        />
      )}
    </div>
  );
}