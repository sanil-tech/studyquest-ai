// src/components/games/TimeChallengeGame.jsx
// Answer questions against a timer — accuracy > speed.
import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";

const safeJsonParse = (str, fallback = {}) => {
  if (!str) return fallback;
  if (typeof str === "object") return str;
  try { return JSON.parse(String(str).trim()); } catch { return fallback; }
};

export default function TimeChallengeGame({ gameData, onComplete }) {
  const data = useMemo(() => safeJsonParse(gameData, {}), [gameData]);
  const questions = data.questions || [];
  const timeLimit = data.time_limit || 60;

  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [finished, setFinished] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (questions.length === 0 || finished) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [currentQ, finished]);

  const handleAnswer = (option) => {
    if (showResult) return;
    setSelected(option);
    setShowResult(true);
    const isCorrect = option === questions[currentQ].answer;
    if (isCorrect) setCorrect(correct + 1);

    setTimeout(() => {
      if (currentQ < questions.length - 1) {
        setCurrentQ(currentQ + 1);
        setSelected(null);
        setShowResult(false);
      } else {
        handleFinish();
      }
    }, 1000);
  };

  const handleFinish = () => {
    if (finished) return;
    setFinished(true);
    clearInterval(timerRef.current);
    const accuracy = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
    // Time bonus: if finished early, small bonus (max 100)
    const timeBonus = timeLeft > 0 ? Math.min(10, Math.floor(timeLeft / 10)) : 0;
    const score = Math.min(100, accuracy + timeBonus);
    setTimeout(() => onComplete(score), 500);
  };

  if (questions.length === 0) {
    return <div className="text-center py-8 text-stone-500 text-sm">Data soalan tidak dijumpai.</div>;
  }

  if (finished) {
    return (
      <div className="text-center py-8 space-y-3">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
        <p className="text-sm font-bold text-stone-600">Mengira skor...</p>
      </div>
    );
  }

  const q = questions[currentQ];

  return (
    <div className="space-y-4">
      {/* Timer + Progress */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-black text-stone-600">
          Soalan {currentQ + 1}/{questions.length}
        </span>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-black text-xs ${
          timeLeft <= 10 ? "bg-rose-100 text-rose-700 animate-pulse" : "bg-emerald-100 text-emerald-700"
        }`}>
          <Clock className="w-3.5 h-3.5" /> {timeLeft}s
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-500 rounded-full transition-all"
          style={{ width: `${((currentQ) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQ}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-stone-50 rounded-2xl p-5 border-2 border-stone-200"
        >
          <p className="text-base font-black text-stone-800 text-center mb-4">{q.question}</p>
          <div className="grid grid-cols-2 gap-2.5">
            {(q.options || []).map((option, i) => {
              const isSelected = selected === option;
              const isCorrect = option === q.answer;
              let cls = "bg-white border-stone-200 text-stone-700 hover:border-emerald-300";
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
                  <CheckCircle2 className="w-4 h-4" /> Betul!
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

      <p className="text-center text-xs text-stone-500 font-medium">
        🎯 Ketepatan lebih penting daripada kelajuan!
      </p>
    </div>
  );
}