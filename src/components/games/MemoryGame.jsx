// src/components/games/MemoryGame.jsx
// Flip-and-match memory card game.
import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";

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

export default function MemoryGame({ gameData, onComplete }) {
  const data = useMemo(() => safeJsonParse(gameData, {}), [gameData]);
  const pairs = data.pairs || [];

  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (pairs.length > 0) {
      const cardList = shuffleArray(
        pairs.flatMap((p, i) => [
          { id: `${i}-a`, pairId: i, text: p.front, type: "front" },
          { id: `${i}-b`, pairId: i, text: p.back, type: "back" },
        ])
      );
      setCards(cardList);
      setFlipped([]);
      setMatched([]);
      setMoves(0);
    }
  }, [gameData]);

  const handleClick = (card) => {
    if (busy || flipped.find((f) => f.id === card.id) || matched.includes(card.pairId)) return;

    const newFlipped = [...flipped, card];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setBusy(true);
      const newMoves = moves + 1;
      setMoves(newMoves);

      if (newFlipped[0].pairId === newFlipped[1].pairId) {
        // Match!
        setTimeout(() => {
          const newMatched = [...matched, newFlipped[0].pairId];
          setMatched(newMatched);
          setFlipped([]);
          setBusy(false);

          if (newMatched.length === pairs.length) {
            // Score: fewer moves = higher score
            const perfectMoves = pairs.length;
            const efficiency = perfectMoves / newMoves;
            const score = Math.round(Math.min(100, efficiency * 100));
            setTimeout(() => onComplete(score), 600);
          }
        }, 600);
      } else {
        // No match — flip back
        setTimeout(() => {
          setFlipped([]);
          setBusy(false);
        }, 1000);
      }
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
      {/* Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-3 bg-stone-200 rounded-full overflow-hidden min-w-[120px]">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${(matched.length / pairs.length) * 100}%` }}
            />
          </div>
          <span className="text-xs font-black text-emerald-700">
            {matched.length}/{pairs.length}
          </span>
        </div>
        <span className="text-xs font-bold text-stone-500">Langkah: {moves}</span>
      </div>

      {/* Card grid */}
      <div
        className="grid gap-2.5"
        style={{ gridTemplateColumns: `repeat(${pairs.length <= 4 ? 4 : pairs.length <= 6 ? 4 : 5}, 1fr)` }}
      >
        {cards.map((card) => {
          const isFlipped = flipped.find((f) => f.id === card.id);
          const isMatched = matched.includes(card.pairId);
          return (
            <button
              key={card.id}
              onClick={() => handleClick(card)}
              disabled={isMatched || busy}
              className="aspect-square rounded-2xl border-2 transition-all active:scale-95"
              style={{ perspective: "600px" }}
            >
              <motion.div
                animate={{ rotateY: isFlipped || isMatched ? 180 : 0 }}
                transition={{ duration: 0.3 }}
                className="relative w-full h-full"
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* Back (face down) */}
                <div
                  className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center border-2 border-emerald-400 shadow-md"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <span className="text-2xl">🐢</span>
                </div>
                {/* Front (face up) */}
                <div
                  className={`absolute inset-0 rounded-2xl flex items-center justify-center border-2 shadow-md text-center p-1 ${
                    isMatched
                      ? "bg-emerald-100 border-emerald-400"
                      : "bg-white border-amber-300"
                  }`}
                  style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                >
                  <span className="text-xs font-black text-stone-800 leading-tight">
                    {card.text}
                  </span>
                </div>
              </motion.div>
            </button>
          );
        })}
      </div>

      <p className="text-center text-xs text-stone-500 font-medium">
        🔍 Cari pasangan yang sepadan!
      </p>
    </div>
  );
}