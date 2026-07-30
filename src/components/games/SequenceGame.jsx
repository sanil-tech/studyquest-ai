// src/components/games/SequenceGame.jsx
// Arrange items in correct order by tapping.
import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

const safeJsonParse = (str, fallback = {}) => {
  if (!str) return fallback;
  if (typeof str === "object") return str;
  try { return JSON.parse(String(str).trim()); } catch { return fallback; }
};

const shuffleArray = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export default function SequenceGame({ gameData, onComplete }) {
  const data = useMemo(() => safeJsonParse(gameData, {}), [gameData]);
  const correctOrder = data.sequence || data.items || [];
  const order = data.order || "ascending";

  const [shuffled, setShuffled] = useState([]);
  const [arranged, setArranged] = useState([]);
  const [wrongIdx, setWrongIdx] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [correct, setCorrect] = useState(0);

  useEffect(() => {
    if (correctOrder.length > 0) {
      setShuffled(shuffleArray(correctOrder.map((v, i) => ({ value: v, originalIdx: i }))));
      setArranged([]);
      setAttempts(0);
      setCorrect(0);
    }
  }, [gameData]);

  const handleClick = (item) => {
    const expectedIdx = arranged.length;
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (item.originalIdx === expectedIdx) {
      // Correct position!
      const newArranged = [...arranged, item];
      setArranged(newArranged);
      setCorrect(correct + 1);

      if (newArranged.length === correctOrder.length) {
        const score = Math.round((correct + 1) / newAttempts * 100);
        setTimeout(() => onComplete(Math.min(100, Math.max(0, score))), 500);
      }
    } else {
      // Wrong
      setWrongIdx(item.originalIdx);
      setTimeout(() => setWrongIdx(null), 800);
    }
  };

  if (correctOrder.length === 0) {
    return <div className="text-center py-8 text-stone-500 text-sm">Data urutan tidak dijumpai.</div>;
  }

  const remaining = shuffled.filter((s) => !arranged.find((a) => a.originalIdx === s.originalIdx));

  return (
    <div className="space-y-5">
      {/* Progress */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-3 bg-stone-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${(arranged.length / correctOrder.length) * 100}%` }}
          />
        </div>
        <span className="text-xs font-black text-emerald-700">{arranged.length}/{correctOrder.length}</span>
      </div>

      {/* Arranged sequence */}
      <div className="bg-stone-50 rounded-2xl p-4 border-2 border-dashed border-stone-300 min-h-[80px]">
        <p className="text-xs font-bold text-stone-500 mb-2 text-center">
          {order === "ascending" ? "📈 Susun dari kecil ke besar" : "📉 Susun dari besar ke kecil"}
        </p>
        <div className="flex flex-wrap gap-2 justify-center items-center min-h-[50px]">
          {arranged.length === 0 ? (
            <span className="text-xs text-stone-400">Ketik item di bawah untuk susun...</span>
          ) : (
            arranged.map((item, idx) => (
              <motion.div
                key={`arr-${item.originalIdx}`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-2"
              >
                <span className="text-xs font-black text-emerald-500">{idx + 1}.</span>
                <span className="px-3 py-2 bg-emerald-100 border-2 border-emerald-300 rounded-xl text-sm font-black text-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {item.value}
                </span>
                {idx < arranged.length - 1 && <span className="text-stone-300">→</span>}
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Available items */}
      <div className="flex flex-wrap gap-2 justify-center min-h-[50px]">
        <AnimatePresence>
          {remaining.map((item) => (
            <motion.button
              key={`rem-${item.originalIdx}`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              onClick={() => handleClick(item)}
              className={`px-4 py-2.5 rounded-xl border-2 text-sm font-black transition-all active:scale-95 ${
                wrongIdx === item.originalIdx
                  ? "bg-rose-100 border-rose-400 text-rose-700 animate-pulse"
                  : "bg-white border-stone-200 text-stone-700 hover:border-emerald-300 hover:scale-105"
              }`}
            >
              {item.value}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      <p className="text-center text-xs text-stone-500 font-medium">
        👆 Ketik item mengikut urutan {order === "ascending" ? "menaik" : "menurun"}!
      </p>
    </div>
  );
}