// src/components/quiz/QuizModeHeader.jsx
import React from "react";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";

export default function QuizModeHeader({ quizType, currentQ, totalQ }) {
  const isMastery = quizType === "mastery";

  if (isMastery) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl p-4 text-white shadow-md flex items-center gap-4"
      >
        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
          <Trophy className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-black uppercase tracking-wider text-amber-100">
            🏆 Misi Ujian Kemahiran
          </p>
          <p className="text-sm font-bold text-white mt-0.5">
            Jawab sendiri untuk menguji kuasa kamu.
          </p>
        </div>
        <span className="text-xs font-black bg-white/20 px-3 py-1 rounded-full shrink-0">
          {currentQ + 1}/{totalQ}
        </span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-4 text-white shadow-md flex items-center gap-4"
    >
      <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0 text-2xl">
        🐢
      </div>
      <div className="flex-1">
        <p className="text-xs font-black uppercase tracking-wider text-emerald-100">
          🐢 Suku Membantu Kamu!
        </p>
        <p className="text-sm font-bold text-white mt-0.5">
          Petunjuk dan penjelasan tersedia. Jangan takut buat salah!
        </p>
      </div>
      <span className="text-xs font-black bg-white/20 px-3 py-1 rounded-full shrink-0">
        {currentQ + 1}/{totalQ}
      </span>
    </motion.div>
  );
}