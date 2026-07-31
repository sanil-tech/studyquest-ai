// src/components/games/MatchingGame.jsx
// Tap-to-match game: students match pairs from two columns.
import React, { useState, useEffect, useMemo } from "react";
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

export default function MatchingGame({ gameData, onComplete }) {
  const data = useMemo(() => safeJsonParse(gameData, {}), [gameData]);
  const pairs = data.pairs || [];

  const [leftCol, setLeftCol] = useState([]);
  const [rightCol, setRightCol] = useState([]);
  const [selectedLeft, setSelectedLeft] = useState(null);
  const [matchedKeys, setMatchedKeys] = useState([]);
  const [wrongFlash, setWrongFlash] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [correct, setCorrect] = useState(0);

  useEffect(() => {
    if (pairs.length > 0) {
      setLeftCol(shuffleArray(pairs.map((p, i) => ({ text: p.left, key: i }))));
      setRightCol(shuffleArray(pairs.map((p, i) => ({ text: p.right, key: i }))));
      setMatchedKeys([]);
      setSelectedLeft(null);
      setAttempts(0);
      setCorrect(0);
    }
  }, [gameData]);

  const handleLeftClick = (key) => {
    if (matchedKeys.includes(key)) return;
    setSelectedLeft(key);
  };

  const handleRightClick = (key) => {
    if (matchedKeys.includes(key) || selectedLeft === null) return;
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (selectedLeft === key) {
      // Correct match!
      const newMatched = [...matchedKeys, key];
      setMatchedKeys(newMatched);
      setCorrect(correct + 1);
      setSelectedLeft(null);

      if (newMatched.length === pairs.length) {
        const score = Math.round((correct + 1) / newAttempts * 100);
        setTimeout(() => onComplete(Math.min(100, Math.max(0, score))), 600);
      }
    } else {
      // Wrong match
      setWrongFlash({ left: selectedLeft, right: key });
      setTimeout(() => {
        setWrongFlash(null);
        setSelectedLeft(null);
      }, 800);
    }
  };

  if (pairs.length === 0) {
    return (
      <div className="text-center py-8 text-stone-500 text-sm">
        Data permainan tidak dijumpai.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-3 bg-stone-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${(matchedKeys.length / pairs.length) * 100}%` }}
          />
        </div>
        <span className="text-xs font-black text-emerald-700">
          {matchedKeys.length}/{pairs.length} ✨
        </span>
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-2 gap-3">
        {/* Left column */}
        <div className="space-y-2.5">
          {leftCol.map((item) => {
            const isMatched = matchedKeys.includes(item.key);
            const isSelected = selectedLeft === item.key;
            const isWrong = wrongFlash?.left === item.key;
            return (
              <button
                key={`L-${item.key}`}
                onClick={() => handleLeftClick(item.key)}
                disabled={isMatched}
                className={`w-full p-4 rounded-2xl border-2 text-sm font-black transition-all active:scale-95 min-h-[60px] flex items-center justify-center ${
                  isMatched
                    ? "bg-emerald-100 border-emerald-300 text-emerald-400 opacity-50"
                    : isWrong
                    ? "bg-rose-100 border-rose-400 text-rose-700 animate-pulse"
                    : isSelected
                    ? "bg-amber-400 border-amber-500 text-stone-900 scale-105 shadow-lg"
                    : "bg-white border-stone-200 text-stone-700 hover:border-amber-300"
                }`}
              >
                {isMatched && <CheckCircle2 className="w-4 h-4 mr-1" />}
                {item.text}
              </button>
            );
          })}
        </div>

        {/* Right column */}
        <div className="space-y-2.5">
          {rightCol.map((item) => {
            const isMatched = matchedKeys.includes(item.key);
            const isWrong = wrongFlash?.right === item.key;
            return (
              <button
                key={`R-${item.key}`}
                onClick={() => handleRightClick(item.key)}
                disabled={isMatched || selectedLeft === null}
                className={`w-full p-4 rounded-2xl border-2 text-sm font-black transition-all active:scale-95 min-h-[60px] flex items-center justify-center ${
                  isMatched
                    ? "bg-emerald-100 border-emerald-300 text-emerald-400 opacity-50"
                    : isWrong
                    ? "bg-rose-100 border-rose-400 text-rose-700 animate-pulse"
                    : selectedLeft !== null
                    ? "bg-white border-amber-300 text-stone-700 hover:bg-amber-50 cursor-pointer"
                    : "bg-stone-100 border-stone-200 text-stone-400 cursor-not-allowed"
                }`}
              >
                {isMatched && <CheckCircle2 className="w-4 h-4 mr-1" />}
                {item.text}
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-center text-xs text-stone-500 font-medium">
        {selectedLeft === null
          ? "👆 Ketik kad di sebelah kiri untuk mula!"
          : "Sekarang ketik kad yang sepadan di sebelah kanan!"}
      </p>
    </div>
  );
}