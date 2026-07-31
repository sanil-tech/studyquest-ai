// src/components/games/SortingGame.jsx
// Sort items into categories by tapping.
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

export default function SortingGame({ gameData, onComplete }) {
  const data = useMemo(() => safeJsonParse(gameData, {}), [gameData]);
  const categories = data.categories || [];
  const items = data.items || [];

  const [pool, setPool] = useState([]);
  const [placed, setPlaced] = useState({});
  const [selectedItem, setSelectedItem] = useState(null);
  const [wrongItem, setWrongItem] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [correct, setCorrect] = useState(0);

  useEffect(() => {
    if (items.length > 0) {
      setPool(shuffleArray(items.map((it, i) => ({ ...it, idx: i }))));
      setPlaced({});
      setAttempts(0);
      setCorrect(0);
      setSelectedItem(null);
    }
  }, [gameData]);

  const handleCategoryClick = (category) => {
    if (!selectedItem) return;
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (selectedItem.category === category) {
      // Correct!
      const newPlaced = { ...placed, [selectedItem.idx]: category };
      setPlaced(newPlaced);
      setCorrect(correct + 1);
      setSelectedItem(null);

      if (Object.keys(newPlaced).length === items.length) {
        const score = Math.round((correct + 1) / newAttempts * 100);
        setTimeout(() => onComplete(Math.min(100, Math.max(0, score))), 500);
      }
    } else {
      // Wrong
      setWrongItem(selectedItem.idx);
      setTimeout(() => {
        setWrongItem(null);
        setSelectedItem(null);
      }, 800);
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-stone-500 text-sm">
        Data permainan tidak dijumpai.
      </div>
    );
  }

  const remainingItems = pool.filter((it) => !placed[it.idx]);

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-3 bg-stone-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${(Object.keys(placed).length / items.length) * 100}%` }}
          />
        </div>
        <span className="text-xs font-black text-emerald-700">
          {Object.keys(placed).length}/{items.length}
        </span>
      </div>

      {/* Item pool */}
      <div className="bg-stone-50 rounded-2xl p-4 border-2 border-dashed border-stone-300">
        <p className="text-xs font-bold text-stone-500 mb-2 text-center">📦 Item untuk disusun:</p>
        {remainingItems.length === 0 ? (
          <p className="text-center text-xs text-emerald-600 font-bold py-2">Semua item telah disusun! ✨</p>
        ) : (
          <div className="flex flex-wrap gap-2 justify-center">
            {remainingItems.map((it) => {
              const isSelected = selectedItem?.idx === it.idx;
              const isWrong = wrongItem === it.idx;
              return (
                <button
                  key={it.idx}
                  onClick={() => setSelectedItem(it)}
                  className={`px-4 py-2.5 rounded-xl border-2 text-sm font-black transition-all active:scale-95 ${
                    isWrong
                      ? "bg-rose-100 border-rose-400 text-rose-700 animate-pulse"
                      : isSelected
                      ? "bg-amber-400 border-amber-500 text-stone-900 scale-110 shadow-lg"
                      : "bg-white border-stone-200 text-stone-700 hover:border-amber-300"
                  }`}
                >
                  {it.value}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Category buckets */}
      <div className={`grid gap-3 ${categories.length === 2 ? "grid-cols-2" : categories.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
        {categories.map((cat) => {
          const itemsInCat = pool.filter((it) => placed[it.idx] === cat);
          return (
            <button
              key={cat}
              onClick={() => handleCategoryClick(cat)}
              disabled={!selectedItem}
              className={`p-4 rounded-2xl border-2 min-h-[100px] flex flex-col items-center justify-center gap-2 transition-all ${
                selectedItem
                  ? "bg-amber-50 border-amber-300 hover:bg-amber-100 cursor-pointer active:scale-95"
                  : "bg-stone-100 border-stone-200 cursor-not-allowed"
              }`}
            >
              <span className="text-xs font-black text-stone-700 text-center">{cat}</span>
              {itemsInCat.length > 0 && (
                <div className="flex flex-wrap gap-1 justify-center mt-1">
                  {itemsInCat.map((it) => (
                    <span key={it.idx} className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md font-bold flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3" /> {it.value}
                    </span>
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <p className="text-center text-xs text-stone-500 font-medium">
        {selectedItem
          ? `👆 Ketik kategori yang betul untuk "${selectedItem.value}"`
          : "👆 Ketik item untuk dipilih, kemudian pilih kategori!"}
      </p>
    </div>
  );
}