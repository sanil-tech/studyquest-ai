// src/components/games/FlashcardGame.jsx
// Flashcard review game — flip cards, review all, earn completion reward.
import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

const safeJsonParse = (str, fallback = {}) => {
  if (!str) return fallback;
  if (typeof str === "object") return str;
  try { return JSON.parse(String(str).trim()); } catch { return fallback; }
};

export default function FlashcardGame({ gameData, onComplete }) {
  const data = useMemo(() => safeJsonParse(gameData, {}), [gameData]);
  const flashcards = data.flashcards || (data.pairs || []).map((p) => ({
    front: p.front || p.left || p.question,
    back: p.back || p.right || p.answer,
  }));

  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reviewed, setReviewed] = useState(new Set());

  const card = flashcards[current];
  const allReviewed = reviewed.size >= flashcards.length;

  const handleFlip = () => {
    if (!flipped) {
      const newReviewed = new Set(reviewed);
      newReviewed.add(current);
      setReviewed(newReviewed);
    }
    setFlipped(!flipped);
  };

  const handleNext = () => {
    setFlipped(false);
    if (current < flashcards.length - 1) setCurrent(current + 1);
  };

  const handlePrev = () => {
    setFlipped(false);
    if (current > 0) setCurrent(current - 1);
  };

  if (flashcards.length === 0) {
    return <div className="text-center py-8 text-stone-500 text-sm">Data kad kilat tidak dijumpai.</div>;
  }

  return (
    <div className="space-y-5">
      {/* Progress */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-3 bg-stone-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${(reviewed.size / flashcards.length) * 100}%` }}
          />
        </div>
        <span className="text-xs font-black text-emerald-700">
          {reviewed.size}/{flashcards.length} ✨
        </span>
      </div>

      {/* Flashcard */}
      <div className="flex flex-col items-center gap-4">
        <button
          onClick={handleFlip}
          className="w-full max-w-sm aspect-[3/2] rounded-3xl border-2 shadow-lg transition-all active:scale-95"
          style={{ perspective: "800px" }}
        >
          <motion.div
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ duration: 0.4 }}
            className="relative w-full h-full"
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Front */}
            <div
              className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center p-6 border-2 border-emerald-300"
              style={{ backfaceVisibility: "hidden" }}
            >
              <span className="text-base font-black text-white text-center leading-relaxed">{card.front}</span>
            </div>
            {/* Back */}
            <div
              className="absolute inset-0 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center p-6 border-2 border-amber-300"
              style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
            >
              <span className="text-base font-black text-white text-center leading-relaxed">{card.back}</span>
            </div>
          </motion.div>
        </button>
        <p className="text-xs text-stone-500 font-medium">
          {flipped ? "👆 Ketik untuk sembunyi jawapan" : "👆 Ketik kad untuk lihat jawapan!"}
        </p>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={handlePrev}
          disabled={current === 0}
          className="p-2.5 rounded-xl bg-stone-100 text-stone-600 disabled:opacity-30 active:scale-95"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-xs font-bold text-stone-500">
          Kad {current + 1} / {flashcards.length}
        </span>
        <button
          onClick={handleNext}
          disabled={current === flashcards.length - 1}
          className="p-2.5 rounded-xl bg-stone-100 text-stone-600 disabled:opacity-30 active:scale-95"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Complete button */}
      <button
        onClick={() => onComplete(100)}
        disabled={!allReviewed}
        className={`w-full h-12 rounded-xl text-sm font-black transition-all active:scale-95 ${
          allReviewed
            ? "bg-emerald-600 text-white shadow-md hover:bg-emerald-700"
            : "bg-stone-200 text-stone-400 cursor-not-allowed"
        }`}
      >
        {allReviewed ? "Selesai! Semua kad disemak ✨" : `Semak semua kad dahulu (${reviewed.size}/${flashcards.length})`}
      </button>
    </div>
  );
}