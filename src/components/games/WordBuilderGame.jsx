// src/components/games/WordBuilderGame.jsx
// Arrange syllables/letters to build words.
import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw } from "lucide-react";

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

export default function WordBuilderGame({ gameData, onComplete }) {
  const data = useMemo(() => safeJsonParse(gameData, {}), [gameData]);
  const words = data.words || [];

  const [currentWordIdx, setCurrentWordIdx] = useState(0);
  const [shuffledSyllables, setShuffledSyllables] = useState([]);
  const [arranged, setArranged] = useState([]);
  const [showResult, setShowResult] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);

  const currentWord = words[currentWordIdx];

  useEffect(() => {
    if (currentWord) {
      setShuffledSyllables(shuffleArray(currentWord.syllables.map((s, i) => ({ syllable: s, originalIdx: i }))));
      setArranged([]);
      setShowResult(null);
    }
  }, [currentWordIdx]);

  const handleSyllableClick = (item) => {
    setArranged([...arranged, item]);
  };

  const handleRemoveSyllable = (idx) => {
    setArranged(arranged.filter((_, i) => i !== idx));
  };

  const handleCheck = () => {
    const arrangedWord = arranged.map((a) => a.syllable).join("");
    const isCorrect = arrangedWord === currentWord.word;
    const newAttempts = totalAttempts + 1;
    setTotalAttempts(newAttempts);

    if (isCorrect) {
      setShowResult("correct");
      const newCorrect = correctCount + 1;
      setCorrectCount(newCorrect);

      setTimeout(() => {
        if (currentWordIdx + 1 < words.length) {
          setCurrentWordIdx(currentWordIdx + 1);
        } else {
          const score = Math.round((newCorrect / newAttempts) * 100);
          onComplete(Math.min(100, Math.max(0, score)));
        }
      }, 1500);
    } else {
      setShowResult("wrong");
      setTimeout(() => {
        setShowResult(null);
        setArranged([]);
        setShuffledSyllables(shuffleArray(currentWord.syllables.map((s, i) => ({ syllable: s, originalIdx: i }))));
      }, 1200);
    }
  };

  const handleReset = () => {
    setArranged([]);
    setShowResult(null);
  };

  if (words.length === 0) {
    return (
      <div className="text-center py-8 text-stone-500 text-sm">
        Data permainan tidak dijumpai.
      </div>
    );
  }

  const remainingSyllables = shuffledSyllables.filter(
    (s) => !arranged.find((a) => a.originalIdx === s.originalIdx)
  );

  return (
    <div className="space-y-5">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-black text-emerald-700">
          Perkataan {currentWordIdx + 1}/{words.length}
        </span>
        <div className="flex-1 h-2.5 bg-stone-200 rounded-full overflow-hidden mx-3">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all"
            style={{ width: `${((currentWordIdx) / words.length) * 100}%` }}
          />
        </div>
        <span className="text-xs font-bold text-stone-500">✅ {correctCount}</span>
      </div>

      {/* Build area */}
      <div
        className={`min-h-[70px] rounded-2xl border-2 border-dashed p-4 flex items-center justify-center gap-2 flex-wrap transition-colors ${
          showResult === "correct"
            ? "bg-emerald-50 border-emerald-400"
            : showResult === "wrong"
            ? "bg-rose-50 border-rose-400"
            : "bg-amber-50 border-amber-300"
        }`}
      >
        {arranged.length === 0 ? (
          <span className="text-xs text-stone-400 font-medium">
            Ketik suku kata di bawah untuk membina perkataan...
          </span>
        ) : (
          arranged.map((item, idx) => (
            <motion.span
              key={`${item.originalIdx}-${idx}`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="px-3 py-2 bg-white rounded-xl border-2 border-stone-300 text-sm font-black text-stone-800 cursor-pointer"
              onClick={() => handleRemoveSyllable(idx)}
            >
              {item.syllable}
            </motion.span>
          ))
        )}
        {showResult === "correct" && (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-2xl ml-1">✅</motion.span>
        )}
        {showResult === "wrong" && (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-2xl ml-1">❌</motion.span>
        )}
      </div>

      {/* Available syllables */}
      <div className="flex flex-wrap gap-2 justify-center min-h-[50px]">
        <AnimatePresence>
          {remainingSyllables.map((item) => (
            <motion.button
              key={`avail-${item.originalIdx}`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              onClick={() => handleSyllableClick(item)}
              disabled={showResult !== null}
              className="px-4 py-2.5 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-xl border-2 border-emerald-400 text-sm font-black shadow-md active:scale-95 transition-all hover:scale-105"
            >
              {item.syllable}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        {arranged.length > 0 && showResult === null && (
          <button
            onClick={handleReset}
            className="px-4 py-2 rounded-xl bg-stone-100 text-stone-600 text-xs font-bold flex items-center gap-1 active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
        )}
        <button
          onClick={handleCheck}
          disabled={arranged.length === 0 || showResult !== null}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all active:scale-95 ${
            arranged.length === 0 || showResult !== null
              ? "bg-stone-200 text-stone-400 cursor-not-allowed"
              : "bg-emerald-600 text-white shadow-md hover:bg-emerald-700"
          }`}
        >
          Semak Jawapan 🔍
        </button>
      </div>

      {/* Feedback */}
      <AnimatePresence>
        {showResult === "correct" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-3 text-center"
          >
            <p className="text-sm font-black text-emerald-700">Hebat Pengembara! 🎉</p>
            <p className="text-xs text-emerald-600">Perkataan yang betul: {currentWord.word}</p>
          </motion.div>
        )}
        {showResult === "wrong" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-3 text-center"
          >
            <p className="text-sm font-black text-amber-700">Cuba lagi! 🌟</p>
            <p className="text-xs text-amber-600">Mari lihat petunjuk Suku dan cuba sekali lagi.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}