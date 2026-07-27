// src/components/quiz/MasteryReport.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  Coins,
  CheckCircle2,
  AlertTriangle,
  Target,
  ChevronDown,
  RotateCcw,
  ArrowRight,
  Home,
  BookOpen,
  Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Celebration from "@/components/celebration/Celebration";

const safeParseAnalysis = (str) => {
  if (!str) return null;
  try {
    return typeof str === "string" ? JSON.parse(str) : str;
  } catch {
    return null;
  }
};

const MASTERY_CONFIG = {
  Mastered: {
    emoji: "🟢",
    label: "Dikuasai",
    color: "from-emerald-400 to-teal-500",
  },
  Developing: {
    emoji: "🟡",
    label: "Sedang Membangun",
    color: "from-amber-400 to-orange-500",
  },
  "Needs Support": {
    emoji: "🔴",
    label: "Perlu Bantuan",
    color: "from-rose-400 to-red-500",
  },
};

const WrongAnswerCard = ({ review, index }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-2xl border-2 border-stone-200 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-stone-50 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center text-xs font-black shrink-0">
            {index + 1}
          </div>
          <p className="text-sm font-bold text-stone-800 truncate">
            {review.question}
          </p>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-stone-400 shrink-0 transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-rose-50 rounded-lg p-2">
                  <p className="text-[10px] font-bold text-rose-500 uppercase">
                    Jawapan Kamu
                  </p>
                  <p className="text-sm font-bold text-rose-800 truncate">
                    {review.their_answer || "Tiada jawapan"}
                  </p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-2">
                  <p className="text-[10px] font-bold text-emerald-500 uppercase">
                    Jawapan Betul
                  </p>
                  <p className="text-sm font-bold text-emerald-800 truncate">
                    {review.correct_answer}
                  </p>
                </div>
              </div>
              {review.what_went_wrong && (
                <div>
                  <p className="text-[10px] font-bold text-stone-500 uppercase mb-1">
                    Apa yang Salah
                  </p>
                  <p className="text-xs text-stone-700 leading-relaxed">
                    {review.what_went_wrong}
                  </p>
                </div>
              )}
              {review.concept_explanation && (
                <div>
                  <p className="text-[10px] font-bold text-stone-500 uppercase mb-1">
                    Konsep yang Betul
                  </p>
                  <p className="text-xs text-stone-700 leading-relaxed">
                    {review.concept_explanation}
                  </p>
                </div>
              )}
              {review.recommended_activity && (
                <div className="bg-blue-50 rounded-lg p-2">
                  <p className="text-[10px] font-bold text-blue-500 uppercase mb-0.5">
                    Cadangan Aktiviti
                  </p>
                  <p className="text-xs text-blue-800 font-medium">
                    {review.recommended_activity}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function MasteryReport({ attempt, quizId }) {
  const analysis = safeParseAnalysis(attempt?.analysis_json);
  const score = attempt?.score || 0;
  const masteryLevel =
    analysis?.mastery_level ||
    (score >= 80 ? "Mastered" : score >= 50 ? "Developing" : "Needs Support");
  const config = MASTERY_CONFIG[masteryLevel] || MASTERY_CONFIG["Developing"];
  const strengths = analysis?.strengths || [];
  const improvements = analysis?.improvements || [];
  const recommendation =
    analysis?.ai_recommendation || attempt?.feedback_text || "";
  const wrongReviews = analysis?.wrong_answer_review || [];
  const learningPath =
    analysis?.learning_path ||
    (score >= 80 ? "unlock_next" : score >= 50 ? "reinforcement" : "revision");
  const isPerfect = score === 100;

  return (
    <div className="space-y-6">
      <Celebration active={isPerfect} />

      {/* Score Hero */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`rounded-3xl p-8 text-center relative overflow-hidden bg-gradient-to-br ${config.color}`}
      >
        <div className="relative z-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="text-6xl mb-3"
          >
            🏆
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-white/80 text-sm font-medium mb-1"
          >
            {attempt?.topic_name}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-5xl font-heading font-bold text-white mb-2"
          >
            {score}%
          </motion.h1>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="inline-flex items-center gap-2 bg-white/20 px-4 py-1.5 rounded-full"
          >
            <span className="text-lg">{config.emoji}</span>
            <span className="text-white font-bold text-sm">
              Tahap: {config.label}
            </span>
          </motion.div>
        </div>
      </motion.div>

      {/* Rewards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-2 gap-3"
      >
        <div className="bg-amber-50 rounded-2xl p-4 text-center border border-amber-100">
          <Coins className="w-6 h-6 text-amber-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-amber-700">
            +{attempt?.coins_earned || 0}
          </p>
          <p className="text-xs text-amber-500">Daun Emas</p>
        </div>
        <div className="bg-purple-50 rounded-2xl p-4 text-center border border-purple-100">
          <Zap className="w-6 h-6 text-purple-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-purple-700">
            +{attempt?.xp_earned || 0}
          </p>
          <p className="text-xs text-purple-500">XP</p>
        </div>
      </motion.div>

      {/* AI Recommendation */}
      {recommendation && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-2xl p-5 border border-border/50"
        >
          <h3 className="font-heading font-semibold mb-3 flex items-center gap-2">
            <span className="text-lg">🤖</span> Cadangan AI
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {recommendation}
          </p>
        </motion.div>
      )}

      {/* Strengths */}
      {strengths.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100"
        >
          <h3 className="font-bold text-emerald-800 mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" /> Kekuatan
          </h3>
          <ul className="space-y-2">
            {strengths.map((s, i) => (
              <li
                key={i}
                className="text-sm text-stone-700 flex items-start gap-2"
              >
                <span className="text-emerald-500 mt-0.5 font-bold">✓</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Improvements */}
      {improvements.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-amber-50 rounded-2xl p-5 border border-amber-100"
        >
          <h3 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" /> Perlu Improv
          </h3>
          <ul className="space-y-2">
            {improvements.map((imp, i) => (
              <li
                key={i}
                className="text-sm text-stone-700 flex items-start gap-2"
              >
                <span className="text-amber-500 mt-0.5 font-bold">⚠</span>
                <span>{imp}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Wrong Answer Review */}
      {wrongReviews.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="space-y-3"
        >
          <h3 className="font-bold text-stone-800 flex items-center gap-2">
            <Target className="w-5 h-5 text-rose-500" /> Semakan Jawapan Salah (
            {wrongReviews.length})
          </h3>
          {wrongReviews.map((review, i) => (
            <WrongAnswerCard key={i} review={review} index={i} />
          ))}
        </motion.div>
      )}

      {/* Personalized Learning Path Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1 }}
        className="space-y-3"
      >
        {learningPath === "revision" && (
          <Link to="/study" className="block">
            <Button className="w-full h-12 rounded-xl text-base bg-rose-500 hover:bg-rose-600">
              <BookOpen className="w-4 h-4 mr-2" /> Ulang Kaji Topik Ini
            </Button>
          </Link>
        )}
        {learningPath === "reinforcement" && (
          <Link to="/study" className="block">
            <Button className="w-full h-12 rounded-xl text-base bg-amber-500 hover:bg-amber-600">
              <Lightbulb className="w-4 h-4 mr-2" /> Aktiviti Pengukuhan
            </Button>
          </Link>
        )}
        {learningPath === "unlock_next" && (
          <Link to="/study" className="block">
            <Button className="w-full h-12 rounded-xl text-base bg-emerald-500 hover:bg-emerald-600">
              <ArrowRight className="w-4 h-4 mr-2" /> Misi Seterusnya
            </Button>
          </Link>
        )}
        {quizId && (
          <Link to={`/quiz/${quizId}`} className="block">
            <Button variant="outline" className="w-full h-12 rounded-xl">
              <RotateCcw className="w-4 h-4 mr-2" /> Cuba Semula
            </Button>
          </Link>
        )}
        <Link to="/dashboard" className="block">
          <Button variant="ghost" className="w-full h-12 rounded-xl">
            <Home className="w-4 h-4 mr-2" /> Kembali ke Dashboard
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}