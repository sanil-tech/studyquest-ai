import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCw } from "lucide-react";
import { useDiagnosticAudio } from "@/hooks/useDiagnosticAudio";

export default function DiagnosticMCQ({ question, questionNumber, totalQuestions, onAnswerNext }) {
  const [selected, setSelected] = useState(null);
  const [showResult, setShowResult] = useState(false);

  // Auto-play so non-readers hear the question immediately
  const { audioUrl, loading: loadingAudio, playAudio } = useDiagnosticAudio(question.id, question.question, true);

  const handleSelect = (option) => {
    if (showResult) return;
    setSelected(option);
    setShowResult(true);
  };

  const handleNext = () => {
    const isCorrect = selected === question.correct;
    onAnswerNext(isCorrect);
    setSelected(null);
    setShowResult(false);
  };

  const getOptionStyle = (option) => {
    if (!showResult) {
      return selected === option
        ? "bg-emerald-500 text-stone-950 border-emerald-400 scale-105 shadow-lg shadow-emerald-500/30"
        : "bg-stone-800 text-stone-200 border-stone-700 hover:bg-stone-700 hover:border-stone-600";
    }
    if (option === question.correct) {
      return "bg-emerald-500 text-stone-950 border-emerald-400 shadow-lg shadow-emerald-500/30";
    }
    if (option === selected && option !== question.correct) {
      return "bg-rose-500 text-white border-rose-400";
    }
    return "bg-stone-800 text-stone-500 border-stone-700 opacity-50";
  };

  return (
    <motion.div
      key={question.id}
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-1.5">
        {Array.from({ length: totalQuestions }).map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all duration-300 ${
              i < questionNumber ? "bg-emerald-500 w-8" : i === questionNumber - 1 ? "bg-amber-400 w-8" : "bg-stone-700 w-4"
            }`}
          />
        ))}
      </div>

      <p className="text-center text-xs font-black text-stone-400 uppercase tracking-widest">
        Soalan {questionNumber} / {totalQuestions}
      </p>

      {/* Question text + display */}
      <div className="text-center space-y-3 py-2">
        <p className="text-lg sm:text-xl font-black text-white">{question.question}</p>
        {question.display && (
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="text-6xl sm:text-7xl font-black text-amber-300 py-4 min-h-[100px] flex items-center justify-center"
          >
            {question.display}
          </motion.div>
        )}
      </div>

      {/* Replay button — audio auto-plays on load; this lets children hear it again */}
      <div className="flex items-center justify-center">
        {loadingAudio ? (
          <div className="flex items-center gap-2 text-xs font-bold text-stone-400">
            <div className="w-4 h-4 border-2 border-stone-500 border-t-stone-300 rounded-full animate-spin" />
            Sediakan suara...
          </div>
        ) : audioUrl ? (
          <button
            onClick={playAudio}
            className="flex items-center gap-2 bg-blue-500/20 border-2 border-blue-400/40 text-blue-300 font-black px-4 py-2.5 rounded-2xl text-sm active:scale-95 transition-all"
          >
            <RotateCw className="w-4 h-4" /> Dengar Lagi
          </button>
        ) : null}
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-3">
        {question.options.map((option, i) => (
          <motion.button
            key={i}
            onClick={() => handleSelect(option)}
            disabled={showResult}
            whileTap={{ scale: 0.95 }}
            className={`p-4 sm:p-5 rounded-2xl border-2 font-black text-lg sm:text-xl transition-all duration-200 ${getOptionStyle(option)}`}
          >
            {option}
          </motion.button>
        ))}
      </div>

      {/* Feedback + Next */}
      <AnimatePresence>
        {showResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div className={`p-3 rounded-2xl text-center font-black text-sm ${
              selected === question.correct
                ? "bg-emerald-900/60 text-emerald-300 border-2 border-emerald-500/40"
                : "bg-amber-900/60 text-amber-300 border-2 border-amber-500/40"
            }`}>
              {selected === question.correct ? "🎉 Hebat! Tepat sekali!" : "💪 Cuba lagi, kamu semakin baik!"}
            </div>
            <button
              onClick={handleNext}
              className="w-full h-13 py-3.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-base rounded-2xl border-b-4 border-amber-700 active:translate-y-1 transition-all"
            >
              Seterusnya →
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}