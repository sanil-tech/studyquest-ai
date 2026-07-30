import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { getActiveStudentId } from "@/lib/rewardSystem";
import { Loader2, Lock, CheckCircle2, Circle, Star, Coins, Zap, MapPin, Trophy, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

const STATUS_STYLES = {
  completed: {
    border: "border-emerald-400 bg-emerald-50",
    icon: <CheckCircle2 className="w-6 h-6 text-emerald-500" />,
    badge: "bg-emerald-500 text-white",
    badgeText: "Selesai!",
    ring: "ring-2 ring-emerald-300",
  },
  mastered: {
    border: "border-amber-400 bg-amber-50",
    icon: <Trophy className="w-6 h-6 text-amber-500" />,
    badge: "bg-amber-500 text-white",
    badgeText: "Mahir!",
    ring: "ring-2 ring-amber-300",
  },
  in_progress: {
    border: "border-blue-400 bg-blue-50",
    icon: <Circle className="w-6 h-6 text-blue-400 fill-blue-200" />,
    badge: "bg-blue-500 text-white",
    badgeText: "Sedang Berjalan",
    ring: "",
  },
  available: {
    border: "border-violet-300 bg-white",
    icon: <Star className="w-6 h-6 text-violet-500" />,
    badge: "bg-violet-500 text-white",
    badgeText: "Tersedia",
    ring: "",
  },
  locked: {
    border: "border-stone-200 bg-stone-50",
    icon: <Lock className="w-6 h-6 text-stone-400" />,
    badge: "bg-stone-300 text-stone-600",
    badgeText: "Terkunci",
    ring: "",
  },
};

const STEP_ICONS = {
  lesson: "📘",
  quiz: "❓",
  game: "🎮",
  assessment: "⚔️",
  activity: "🎯",
};

export default function Missions() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [missions, setMissions] = useState([]);
  const [expandedMissionId, setExpandedMissionId] = useState(null);
  const [error, setError] = useState(null);

  const loadMissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const studentId = await getActiveStudentId();
      const res = await base44.functions.invoke("getStudentMissions", {
        student_id: studentId,
      });
      if (res.data?.success) {
        setMissions(res.data.missions || []);
      } else {
        setError(res.data?.error || "Gagal memuatkan misi.");
      }
    } catch (err) {
      setError(err.message || "Ralat sistem.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMissions();
  }, [loadMissions]);

  const handleStepClick = (mission, step) => {
    if (step.reference_route) {
      navigate(step.reference_route);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-violet-50 to-white">
        <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 p-6 text-center">
        <p className="text-stone-500 text-sm mb-4">{error}</p>
        <Button onClick={loadMissions} variant="outline">Cuba Semula</Button>
      </div>
    );
  }

  const completedCount = missions.filter((m) => m.progress.status === "completed" || m.progress.status === "mastered").length;
  const inProgressCount = missions.filter((m) => m.progress.status === "in_progress").length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 via-white to-emerald-50 pb-20">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-violet-600 to-purple-700 text-white px-4 pt-8 pb-10 rounded-b-3xl shadow-lg">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-5 h-5 text-violet-200" />
            <span className="text-xs font-bold uppercase tracking-widest text-violet-200">Peta Pengembaraan</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black mb-2">Misi Pembelajaran 🗺️</h1>
          <p className="text-sm text-violet-100 mb-4">Lalui setiap misi untuk menjadi Juara Ilmu!</p>
          <div className="flex gap-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2 flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-300" />
              <span className="text-xs font-bold">{completedCount} Selesai</span>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2 flex items-center gap-1.5">
              <Circle className="w-4 h-4 text-blue-200 fill-blue-200" />
              <span className="text-xs font-bold">{inProgressCount} Berjalan</span>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-yellow-300" />
              <span className="text-xs font-bold">{missions.length} Jumlah</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mission Path */}
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {missions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">🗺️</div>
            <p className="text-sm font-bold text-stone-500">Misi pembelajaran akan datang tidak lama lagi!</p>
            <p className="text-xs text-stone-400 mt-1">Nantikan pengembaraan pembelajaran yang menarik.</p>
          </div>
        ) : (
          missions.map((mission, idx) => {
            const style = STATUS_STYLES[mission.progress.status] || STATUS_STYLES.available;
            const isExpanded = expandedMissionId === mission.id;
            const isLocked = mission.is_locked;

            return (
              <motion.div
                key={mission.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`relative ${style.ring}`}
              >
                {/* Connector line to previous mission */}
                {idx > 0 && (
                  <div className="absolute -top-4 left-8 w-1 h-4 bg-violet-200 rounded-full" />
                )}

                <div className={`rounded-2xl border-2 ${style.border} shadow-sm overflow-hidden transition-all`}>
                  {/* Mission Card Header */}
                  <button
                    onClick={() => !isLocked && setExpandedMissionId(isExpanded ? null : mission.id)}
                    disabled={isLocked}
                    className={`w-full text-left p-4 flex items-center gap-3 ${isLocked ? "cursor-not-allowed" : "hover:bg-black/[0.02]"}`}
                  >
                    <div className="text-3xl shrink-0 w-14 h-14 rounded-xl bg-white shadow-inner flex items-center justify-center border border-black/5">
                      {isLocked ? "🔒" : mission.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-stone-400">
                          Misi {idx + 1}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${style.badge}`}>
                          {style.badgeText}
                        </span>
                      </div>
                      <h3 className="text-sm font-black text-stone-800 truncate">{mission.name}</h3>
                      {mission.completion_percentage > 0 && mission.progress.status !== "completed" && (
                        <div className="mt-1.5 flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-stone-200 rounded-full overflow-hidden">
                            <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${mission.completion_percentage}%` }} />
                          </div>
                          <span className="text-[10px] font-bold text-stone-500">{mission.completion_percentage}%</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <div className="flex items-center gap-1 text-amber-500">
                        <Zap className="w-3.5 h-3.5" />
                        <span className="text-xs font-black">{mission.reward_xp}</span>
                      </div>
                      <div className="flex items-center gap-1 text-orange-500">
                        <Coins className="w-3.5 h-3.5" />
                        <span className="text-xs font-black">{mission.reward_coin}</span>
                      </div>
                    </div>
                  </button>

                  {/* Expanded Steps */}
                  <AnimatePresence>
                    {isExpanded && !isLocked && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-stone-200 bg-stone-50/50"
                      >
                        {mission.description && (
                          <p className="px-4 pt-3 text-xs text-stone-500 leading-relaxed">{mission.description}</p>
                        )}
                        <div className="p-4 space-y-2">
                          {mission.steps.length === 0 ? (
                            <p className="text-xs text-stone-400 text-center py-2">Langkah misi akan datang tidak lama lagi.</p>
                          ) : (
                            mission.steps.map((step, sIdx) => {
                              const isStepComplete = mission.progress.steps_completed.includes(step.order);
                              const isCurrentStep = mission.progress.current_step_order === step.order && !isStepComplete;
                              return (
                                <button
                                  key={sIdx}
                                  onClick={() => step.reference_route && handleStepClick(mission, step)}
                                  className={`w-full text-left flex items-center gap-3 p-3 rounded-xl border transition-all ${
                                    isStepComplete
                                      ? "bg-emerald-50 border-emerald-200"
                                      : isCurrentStep
                                      ? "bg-blue-50 border-blue-300 ring-1 ring-blue-200"
                                      : "bg-white border-stone-200 hover:border-violet-300"
                                  } ${step.reference_route ? "cursor-pointer" : "cursor-default"}`}
                                >
                                  <div className="text-xl shrink-0 w-9 h-9 rounded-lg bg-white shadow-sm flex items-center justify-center border border-stone-200">
                                    {STEP_ICONS[step.step_type] || "📌"}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-xs font-bold ${isStepComplete ? "text-emerald-700 line-through opacity-60" : "text-stone-700"}`}>
                                      {step.reference_name || `Langkah ${step.order + 1}`}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-[10px] text-stone-400 capitalize">{step.step_type}</span>
                                      {step.is_bonus && <span className="text-[10px] text-amber-500 font-bold">BONUS</span>}
                                      {step.xp_reward > 0 && (
                                        <span className="text-[10px] text-amber-500 font-bold flex items-center gap-0.5">
                                          <Zap className="w-2.5 h-2.5" /> {step.xp_reward}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  {isStepComplete ? (
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                                  ) : step.reference_route ? (
                                    <ArrowRight className="w-4 h-4 text-stone-300 shrink-0" />
                                  ) : (
                                    <Circle className="w-4 h-4 text-stone-200 shrink-0" />
                                  )}
                                </button>
                              );
                            })
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}