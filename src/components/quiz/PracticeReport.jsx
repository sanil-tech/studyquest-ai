// src/components/quiz/PracticeReport.jsx
import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  AlertCircle,
  BookOpen,
  ArrowRight,
  Zap,
  Home,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const safeParseAnalysis = (str) => {
  if (!str) return null;
  try {
    return typeof str === "string" ? JSON.parse(str) : str;
  } catch {
    return null;
  }
};

export default function PracticeReport({ attempt }) {
  const analysis = safeParseAnalysis(attempt?.analysis_json);
  const concepts = analysis?.concepts_understood || [];
  const mistakes = analysis?.mistakes_made || [];
  const revision = analysis?.recommended_revision || [];
  const summary = analysis?.summary || attempt?.feedback_text || "";
  const score = attempt?.score || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-3xl p-8 text-center bg-gradient-to-br from-emerald-400 to-teal-500 relative overflow-hidden"
      >
        <div className="relative z-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="text-6xl mb-3"
          >
            🌟
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
            className="text-4xl font-heading font-bold text-white mb-2"
          >
            Latihan Selesai!
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-white/90 font-medium text-lg"
          >
            {score}% Betul
          </motion.p>
        </div>
      </motion.div>

      {/* XP Reward */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-purple-50 rounded-2xl p-4 text-center border border-purple-100 flex items-center justify-center gap-3"
      >
        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
          <Zap className="w-6 h-6 text-purple-500" />
        </div>
        <div className="text-left">
          <p className="text-2xl font-bold text-purple-700">+{attempt?.xp_earned || 50} XP</p>
          <p className="text-xs text-purple-500 font-medium">Ganjaran Latihan</p>
        </div>
      </motion.div>

      {/* Summary */}
      {summary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl p-5 border border-border/50"
        >
          <h3 className="font-heading font-semibold mb-2 flex items-center gap-2">
            <span className="text-lg">🤖</span> Ringkasan Suku
          </h3>
          <p className="text-sm text-muted-foreground font-medium leading-relaxed">
            {summary}
          </p>
        </motion.div>
      )}

      {/* Concepts Understood */}
      {concepts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100"
        >
          <h3 className="font-bold text-emerald-800 mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" /> Konsep Difahami
          </h3>
          <ul className="space-y-2">
            {concepts.map((c, i) => (
              <li key={i} className="text-sm text-stone-700 flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5 font-bold">✓</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Mistakes Made */}
      {mistakes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-amber-50 rounded-2xl p-5 border border-amber-100"
        >
          <h3 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" /> Kesilapan Dibuat
          </h3>
          <ul className="space-y-2">
            {mistakes.map((m, i) => (
              <li key={i} className="text-sm text-stone-700 flex items-start gap-2">
                <span className="text-amber-500 mt-0.5 font-bold">⚠</span>
                <span>{m}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Recommended Revision */}
      {revision.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-blue-50 rounded-2xl p-5 border border-blue-100"
        >
          <h3 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
            <BookOpen className="w-5 h-5" /> Cadangan Ulang Kaji
          </h3>
          <ul className="space-y-2">
            {revision.map((r, i) => (
              <li key={i} className="text-sm text-stone-700 flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">📖</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="space-y-3"
      >
        <Link to="/study" className="block">
          <Button className="w-full h-12 rounded-xl text-base">
            <Sparkles className="w-4 h-4 mr-2" /> Teruskan Misi{" "}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
        <Link to="/dashboard" className="block">
          <Button variant="outline" className="w-full h-12 rounded-xl">
            <Home className="w-4 h-4 mr-2" /> Kembali ke Dashboard
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}