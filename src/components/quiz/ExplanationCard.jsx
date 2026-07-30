// src/components/quiz/ExplanationCard.jsx
import React from "react";
import { Sparkles, Lightbulb, BookOpen } from "lucide-react";
import { motion } from "framer-motion";

export default function ExplanationCard({ explanationDetails, isCorrect }) {
  if (!explanationDetails) return null;

  const { concept, explanation_markdown, analogy, example } = explanationDetails;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-5 rounded-3xl border-2 shadow-2xl space-y-3.5 backdrop-blur-md ${
        isCorrect
          ? "bg-emerald-950/80 border-emerald-500/50 text-emerald-100"
          : "bg-amber-950/80 border-amber-500/50 text-amber-100"
      }`}
    >
      {/* Concept Header */}
      <div className="flex items-center gap-2 border-b border-stone-800/80 pb-2.5">
        <Sparkles className="w-4 h-4 text-amber-400" />
        <span className="text-[11px] font-black uppercase tracking-wider text-amber-300">
          Penjelasan Konsep: {concept || "Utama"}
        </span>
      </div>

      {/* Main Explanation Markdown */}
      {explanation_markdown && (
        <p className="text-xs sm:text-sm font-bold leading-relaxed text-stone-200">
          {explanation_markdown}
        </p>
      )}

      {/* Analogy Box */}
      {analogy && (
        <div className="p-3.5 bg-black/40 rounded-2xl border border-stone-800 flex items-start gap-2.5">
          <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="text-[10px] font-black text-amber-300 uppercase tracking-wider block">Analogi Mudah:</span>
            <p className="text-xs font-semibold text-stone-300 leading-normal">{analogy}</p>
          </div>
        </div>
      )}

      {/* Concrete Example */}
      {example && (
        <div className="p-3 bg-stone-900/60 rounded-2xl border border-stone-800 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-lime-400 flex-shrink-0" />
          <p className="text-xs font-bold text-lime-200">Contoh: {example}</p>
        </div>
      )}
    </motion.div>
  );
}
