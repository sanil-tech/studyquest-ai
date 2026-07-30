// src/components/games/PuzzleGame.jsx
// Treasure chest puzzle — answer questions to unlock the chest.
import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Key } from "lucide-react";

const safeJsonParse = (str, fallback = {}) => {
  if (!str) return fallback;
  if (typeof str === "object") return str;
  try { return JSON.parse(String(str).trim()); } catch { return fallback; }
};

export default function PuzzleGame({ gameData, onComplete }) {
  const data = useMemo(() => safeJsonParse(gameData, {}), [gameData]);
  const questions = data.questions || [];
  const story = data.story || "Suku perlu membuka peti harta karun! Selesaikan semua soalan untuk membuka kunci.";

  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [keysCollected, setKeysCollected] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [correct, setCorrect] = useState(0);

  const handleAnswer = (option) => {
    if (showResult) return;
    setSelected(option);
    setShowResult(true);
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    const isCorrect = option === questions[currentQ].answer;
    if (isCorrect) {
      setCorrect(correct + 1);
      setKeysCollected(keysCollected + 1);
    }

    setTimeout(() => {
      if (currentQ < questions.length - 1) {
        setCurrentQ(currentQ + 1);
        setSelected(null);
        setShowResult(false);
      } else {
        const score = Math.round((correct + (isCorrect ? 1 : 0)) / newAttempts * 100);
        onComplete(Math.min(100, Math.max(0, score)));
      }
    }, 1200);
  };

  if (questions.length === 0) {
    return <div className="text-center py-8 text-stone-500 text-sm">Data teka-teki tidak dijumpai.</div>;
  }

  const q = questions[currentQ];
  const allKeysCollected = keysCollected >= questions.length;

  return (
    <div className="space-y-5">
      {/* Story banner */}
      <div className="bg-gradient-to-r from-amber-500 to-yellow-500 rounded-2xl p-4 text-center">
        <p className="text-3xl mb-1">🗝️</p>
        <p className="text-xs font-bold text-amber-50">{story}</p>
      </div>

      {/* Keys progress */}
      <div className="flex items-center justify-center gap-2">
        {questions.map((_, i) => (
          <div
            key={i}
            className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all ${
              i < keysCollected
                ? "bg-amber-100 border-amber-400 scale-110"
                : i === currentQ
                ? "bg-blue-50 border-blue-300 ring-2 ring-blue-200"
                : "bg-stone-100 border-stone-200"
            }`}
          >
            {i < keysCollected ? (
              <Key className="w-5 h-5 text-amber-600 fill-amber-300" />
            ) : (
              <span className="text-xs font-black text-stone-400">{i + 1}</span>
            )}
          </div>
        ))}
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQ}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-stone-50 rounded-2xl p-5 border-2 border-stone-200"
        >
          <p className="text-sm font-black text-stone-800 text-center mb-4">{q.question}</p>
          <div className="grid grid-cols-1 gap-2.5">
            {(q.options || []).map((option, i) => {
              const isSelected = selected === option;
              const isCorrect = option === q.answer;
              let cls = "bg-white border-stone-200 text-stone-700 hover:border-amber-300";
              if (showResult) {
                if (isCorrect) cls = "bg-emerald-100 border-emerald-400 text-emerald-800 font-black";
                else if (isSelected) cls = "bg-rose-100 border-rose-400 text-rose-700";
                else cls = "bg-stone-100 border-stone-200 text-stone-400";
              }
              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(option)}
                  disabled={showResult}
                  className={`p-3 rounded-xl border-2 text-sm font-bold transition-all active:scale-95 ${cls}`}
                >
                  {option}
                </button>
              );
            })}
          </div>
          {showResult && (
            <div className="mt-3 flex items-center justify-center gap-1.5">
              {selected === q.answer ? (
                <span className="text-xs font-black text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Kunci diperolehi! 🔑
                </span>
              ) : (
                <span className="text-xs font-black text-rose-600 flex items-center gap-1">
                  <XCircle className="w-4 h-4" /> Cuba lagi!
                </span>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Chest preview */}
      <div className="text-center">
        <motion.div
          animate={allKeysCollected ? { rotate: [0, -10, 10, 0], scale: 1.1 } : {}}
          className="text-5xl"
        >
          {allKeysCollected ? "🔓" : "🔒"}
        </motion.div>
        <p className="text-xs font-bold text-stone-500 mt-1">
          {allKeysCollected ? "Peti terbuka! 🎉" : `Kumpul ${questions.length - keysCollected} lagi kunci!`}
        </p>
      </div>
    </div>
  );
}