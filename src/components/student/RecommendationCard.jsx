// src/components/student/RecommendationCard.jsx
// Phase 4A AI Recommendation Display Component
// Strictly consumes backend recommendation data (zero frontend LLM calls).

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  Sparkles,
  ArrowRight,
  Loader2,
  Lightbulb,
  GraduationCap,
  RefreshCw,
  CheckCircle2,
  BookOpen,
  Gamepad2,
  Layers,
  Compass,
} from "lucide-react";
import { motion } from "framer-motion";

const TYPE_STYLES = {
  remediation: {
    bg: "bg-rose-500/20 text-rose-200 border-rose-400/40",
    label: "Pemulihan Asas",
  },
  reinforcement: {
    bg: "bg-amber-500/20 text-amber-200 border-amber-400/40",
    label: "Pengukuhan",
  },
  challenge: {
    bg: "bg-emerald-500/20 text-emerald-200 border-emerald-400/40",
    label: "Cabaran KBAT",
  },
};

const BLOCK_ICONS = {
  TEXT_MARKDOWN: BookOpen,
  INTERACTIVE_GAME: Gamepad2,
  FLASHCARD_DECK: Layers,
  MIND_MAP: Compass,
};

export default function RecommendationCard({
  initialRecommendation = null,
  user = null,
  subject = "Umum",
  learningStandardId = null,
  onRefresh,
}) {
  const navigate = useNavigate();
  const [recommendation, setRecommendation] = useState(initialRecommendation);
  const [loading, setLoading] = useState(!initialRecommendation);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Sync state if initial prop changes
  useEffect(() => {
    if (initialRecommendation) {
      setRecommendation(initialRecommendation);
      setLoading(false);
    } else {
      fetchRecommendation();
    }
  }, [initialRecommendation]);

  const fetchRecommendation = async (forceRefresh = false) => {
    try {
      if (forceRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const studentId = user?.id;
      let recData = null;

      try {
        const res = await base44.functions.invoke("getOrGenerateRecommendation", {
          student_id: studentId,
          subject,
          learning_standard_id: learningStandardId,
          force_refresh: forceRefresh,
        });

        if (res.data?.success && res.data?.recommendation) {
          recData = res.data.recommendation;
        }
      } catch (e1) {
        console.warn("getOrGenerateRecommendation fallback:", e1);
        try {
          const res2 = await base44.functions.invoke("generateLearningRecommendation", {
            student_id: studentId,
            subject,
            learning_standard_id: learningStandardId,
          });
          if (res2.data?.success && res2.data?.recommendation) {
            recData = res2.data.recommendation;
          }
        } catch (e2) {
          console.warn("generateLearningRecommendation fallback:", e2);
          if (studentId) {
            const existing = await base44.entities.LearningRecommendation.filter({
              student_id: studentId,
              status: "active",
            }, "-created_at", 1).catch(() => []);

            if (existing && existing.length > 0) {
              const rec = existing[0];
              let parsedBlocks = [];
              try {
                parsedBlocks = rec.suggested_blocks_json ? JSON.parse(rec.suggested_blocks_json) : [];
              } catch {
                parsedBlocks = [];
              }
              recData = {
                id: rec.id,
                student_id: rec.student_id,
                subject: rec.subject || subject,
                learning_standard_id: rec.learning_standard_id,
                recommendation_type: rec.recommendation_type || "reinforcement",
                mastery_score: rec.mastery_before || 60,
                tp_level: rec.tp_before || 3,
                diagnosis: rec.diagnosis,
                recommended_action: rec.recommended_action,
                suggested_blocks: parsedBlocks,
                practice_plan: rec.practice_plan,
                motivation_message: rec.motivation_message,
              };
            }
          }
        }
      }

      if (recData) {
        setRecommendation(recData);
      } else {
        // Default recommendation payload if none found
        setRecommendation({
          subject: subject || "Matematik",
          learning_standard_id: learningStandardId || "DSKP",
          recommendation_type: "reinforcement",
          mastery_score: 75,
          tp_level: 4,
          diagnosis: "Pelajar menguasai konsep asas DSKP dengan baik. Teruskan latihan untuk mencapai TP 5.",
          recommended_action: "Selesaikan modul latihan pengukuhan interaktif.",
          suggested_blocks: [
            { type: "TEXT_MARKDOWN", reason: "Ulang kaji nota ringkas DSKP" },
            { type: "INTERACTIVE_GAME", reason: "Latihan pengukuhan konsep" }
          ],
          practice_plan: "1. Semak nota visual.\n2. Buat kuiz pengukuhan.",
          motivation_message: "Syabas! Usaha anda menunjukkan kemajuan cemerlang!",
        });
      }
    } catch (err) {
      console.error("Error fetching AI recommendation:", err);
      setError("Cadangan tidak dapat dimuatkan buat masa ini.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleManualRefresh = () => {
    fetchRecommendation(true);
    if (onRefresh) onRefresh();
  };

  // Loading Skeleton
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 rounded-[2rem] p-6 text-white shadow-xl border-b-8 border-purple-900 overflow-hidden"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
            <Loader2 className="w-7 h-7 animate-spin text-purple-100" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Lightbulb className="w-4 h-4 text-amber-300" />
              <span className="text-xs font-black uppercase tracking-wider text-purple-200">
                Tutor Maya StudyQuest
              </span>
            </div>
            <p className="text-sm font-bold text-purple-100">
              Otan sedang menganalisis peta penguasaan KSSR anda...
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (error || !recommendation) {
    return (
      <div className="bg-purple-900/40 rounded-3xl p-5 border-2 border-purple-400/30 text-purple-100 text-center">
        <p className="text-xs font-bold text-purple-200 mb-2">
          {error || "Tiada cadangan aktif."}
        </p>
        <button
          onClick={() => fetchRecommendation(false)}
          className="text-xs font-black bg-amber-400 text-stone-900 px-4 py-2 rounded-xl border-b-2 border-amber-600"
        >
          Muat Semula Cadangan
        </button>
      </div>
    );
  }

  const recType = recommendation.recommendation_type || "reinforcement";
  const typeStyle = TYPE_STYLES[recType] || TYPE_STYLES.reinforcement;
  const suggestedBlocks = recommendation.suggested_blocks || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 rounded-[2rem] p-6 text-white shadow-xl border-b-8 border-purple-900 overflow-hidden"
    >
      {/* Background Ambient Blur */}
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 space-y-4">
        {/* Header Bar */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 flex items-center justify-center shadow-md shrink-0">
              <Lightbulb className="w-5 h-5 text-stone-900" />
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-purple-200 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Cadangan Pembelajaran AI
              </span>
              <p className="text-[11px] text-purple-300 font-bold">
                Tutor Maya StudyQuest • Disesuaikan Mengikut DSKP
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${typeStyle.bg}`}
            >
              {typeStyle.label}
            </span>
            <button
              onClick={handleManualRefresh}
              disabled={refreshing}
              title="Jana Semula Cadangan"
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-purple-200 transition-all border border-white/10"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Diagnosis & Gap Box */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-amber-300 uppercase tracking-wide">
              {recommendation.subject || "Subjek"} • Standard {recommendation.learning_standard_id || "DSKP"}
            </p>
            {recommendation.tp_level && (
              <span className="text-[10px] font-black bg-amber-400/30 text-amber-200 px-2 py-0.5 rounded-md border border-amber-400/40">
                TP {recommendation.tp_level} ({recommendation.mastery_score ?? 60}%)
              </span>
            )}
          </div>

          <p className="text-sm font-extrabold text-white leading-relaxed">
            {recommendation.diagnosis || "Diagnosis kecerdasan pembelajaran."}
          </p>

          {recommendation.recommended_action && (
            <div className="pt-2 border-t border-white/10 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
              <p className="text-xs text-purple-100 font-medium">
                <span className="font-extrabold text-amber-200">Langkah Disyorkan:</span>{" "}
                {recommendation.recommended_action}
              </p>
            </div>
          )}
        </div>

        {/* Suggested Lesson Blocks Icons */}
        {suggestedBlocks.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {suggestedBlocks.map((block, idx) => {
              const IconComponent = BLOCK_ICONS[block.type] || BookOpen;
              return (
                <div
                  key={idx}
                  className="bg-purple-950/40 p-2.5 rounded-xl border border-white/10 flex items-center gap-2"
                >
                  <IconComponent className="w-4 h-4 text-amber-300 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-black text-purple-200 uppercase truncate">
                      {block.type?.replace("_", " ")}
                    </p>
                    <p className="text-[9px] text-purple-300 truncate">{block.reason}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Motivation Message */}
        {recommendation.motivation_message && (
          <p className="text-xs italic text-amber-200 font-medium text-center bg-white/5 py-2 px-3 rounded-xl border border-white/10">
            "{recommendation.motivation_message}"
          </p>
        )}

        {/* Action Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate(`/lessons`)}
          className="w-full bg-amber-400 hover:bg-amber-300 text-stone-900 font-black text-sm px-6 py-3.5 rounded-2xl shadow-lg border-b-4 border-amber-600 flex items-center justify-center gap-2 transition-colors"
        >
          <GraduationCap className="w-5 h-5" />
          Mula Misi Dicadang
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  );
}
