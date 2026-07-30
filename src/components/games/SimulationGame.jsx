// src/components/games/SimulationGame.jsx
// Virtual shop simulation — buy items, calculate total.
import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";

const safeJsonParse = (str, fallback = {}) => {
  if (!str) return fallback;
  if (typeof str === "object") return str;
  try { return JSON.parse(String(str).trim()); } catch { return fallback; }
};

export default function SimulationGame({ gameData, onComplete }) {
  const data = useMemo(() => safeJsonParse(gameData, {}), [gameData]);
  const title = data.title || "Kedai Suku";
  const items = data.items || [];
  const orders = data.orders || [];

  const [currentOrder, setCurrentOrder] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showResult, setShowResult] = useState(null);
  const [correct, setCorrect] = useState(0);
  const [attempts, setAttempts] = useState(0);

  const order = orders[currentOrder];

  const handleAnswer = (option) => {
    if (showResult !== null) return;
    setSelected(option);
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    const isCorrect = String(option) === String(order.answer);
    setShowResult(isCorrect);
    if (isCorrect) setCorrect(correct + 1);

    setTimeout(() => {
      if (currentOrder < orders.length - 1) {
        setCurrentOrder(currentOrder + 1);
        setSelected(null);
        setShowResult(null);
      } else {
        const score = Math.round((correct + (isCorrect ? 1 : 0)) / newAttempts * 100);
        onComplete(Math.min(100, Math.max(0, score)));
      }
    }, 1200);
  };

  if (orders.length === 0) {
    return <div className="text-center py-8 text-stone-500 text-sm">Data simulasi tidak dijumpai.</div>;
  }

  // Generate options from the answer (add distractors)
  const options = order.options || [order.answer, order.answer + 1, order.answer - 1, order.answer + 2]
    .filter((v, i, arr) => arr.indexOf(v) === i && v >= 0)
    .sort(() => Math.random() - 0.5);

  return (
    <div className="space-y-5">
      {/* Shop header */}
      <div className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl p-4 text-center">
        <p className="text-2xl font-black text-white">🏪 {title}</p>
        <p className="text-xs font-bold text-amber-50 mt-0.5">Selamat datang, Pengembara Muda!</p>
      </div>

      {/* Items for sale */}
      <div className="bg-stone-50 rounded-2xl p-3 border-2 border-stone-200">
        <p className="text-xs font-bold text-stone-500 mb-2 text-center">📦 Barang Jualan:</p>
        <div className="flex flex-wrap gap-2 justify-center">
          {items.map((item, i) => (
            <div key={i} className="bg-white px-3 py-2 rounded-xl border border-stone-200 text-center">
              <div className="text-xl">{item.emoji || "📦"}</div>
              <div className="text-xs font-bold text-stone-700">{item.name}</div>
              <div className="text-xs font-black text-emerald-600">RM{item.price}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Current order */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentOrder}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-blue-50 rounded-2xl p-4 border-2 border-blue-200"
        >
          <p className="text-xs font-black text-blue-600 mb-1">📋 Pesanan {currentOrder + 1}/{orders.length}:</p>
          <p className="text-sm font-bold text-stone-700">{order.prompt}</p>
        </motion.div>
      </AnimatePresence>

      {/* Answer options */}
      <div>
        <p className="text-xs font-bold text-stone-500 mb-2 text-center">Berapa jumlah bayaran?</p>
        <div className="grid grid-cols-2 gap-2.5">
          {options.map((option, i) => {
            const isSelected = selected === option;
            const isCorrect = String(option) === String(order.answer);
            let cls = "bg-white border-stone-200 text-stone-700 hover:border-emerald-300";
            if (showResult !== null) {
              if (isCorrect) cls = "bg-emerald-100 border-emerald-400 text-emerald-800 font-black";
              else if (isSelected) cls = "bg-rose-100 border-rose-400 text-rose-700";
              else cls = "bg-stone-100 border-stone-200 text-stone-400";
            }
            return (
              <button
                key={i}
                onClick={() => handleAnswer(option)}
                disabled={showResult !== null}
                className={`p-3 rounded-xl border-2 text-base font-black transition-all active:scale-95 ${cls}`}
              >
                RM{option}
              </button>
            );
          })}
        </div>
      </div>

      {/* Feedback */}
      {showResult !== null && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl p-3 text-center border-2 ${
            showResult ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"
          }`}
        >
          {showResult ? (
            <p className="text-sm font-black text-emerald-700 flex items-center justify-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Hebat! Jawapan betul!
            </p>
          ) : (
            <p className="text-sm font-black text-amber-700 flex items-center justify-center gap-1">
              <XCircle className="w-4 h-4" /> Cuba lagi! Jawapan: RM{order.answer}
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
}