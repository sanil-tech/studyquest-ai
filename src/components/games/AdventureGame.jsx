// src/components/games/AdventureGame.jsx
// Multi-step adventure mission — progress through a story with varied challenges.
import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, MapPin } from "lucide-react";

const safeJsonParse = (str, fallback = {}) => {
  if (!str) return fallback;
  if (typeof str === "object") return str;
  try { return JSON.parse(String(str).trim()); } catch { return fallback; }
};

export default function AdventureGame({ gameData, onComplete }) {
  const data = useMemo(() => safeJsonParse(gameData, {}), [gameData]);
  const title = data.title || "Misi Pengembaraan Suku";
  const steps = data.steps || [];

  const [currentStep, setCurrentStep] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(0);

  const step = steps[currentStep];

  const handleAnswer = (option) => {
    if (showResult) return;
    setSelected(option);
    setShowResult(true);
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    const isCorrect = option === step.answer;
    if (isCorrect) {
      setCorrect(correct + 1);
      setCompletedSteps(completedSteps + 1);
    }

    setTimeout(() => {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
        setSelected(null);
        setShowResult(false);
      } else {
        const score = Math.round((correct + (isCorrect ? 1 : 0)) / newAttempts * 100);
        onComplete(Math.min(100, Math.max(0, score)));
      }
    }, 1200);
  };

  if (steps.length === 0) {
    return <div className="text-center py-8 text-stone-500 text-sm">Data misi tidak dijumpai.</div>;
  }

  return (
    <div className="space-y-5">
      {/* Adventure header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-4 text-center">
        <p className="text-2xl font-black text-white">🗺️ {title}</p>
        <p className="text-xs font-bold text-indigo-100 mt-0.5">
          Langkah {currentStep + 1} daripada {steps.length}
        </p>
      </div>

      {/* Journey path */}
      <div className="flex items-center justify-center gap-1.5">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 text-xs font-black transition-all ${
                i < completedSteps
                  ? "bg-emerald-500 border-emerald-400 text-white"
                  : i === currentStep
                  ? "bg-amber-400 border-amber-300 text-stone-900 scale-125 ring-2 ring-amber-200"
                  : "bg-stone-200 border-stone-300 text-stone-400"
              }`}
            >
              {i < completedSteps ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
            </div>
            {i < steps.length - 1 && (
              <div className={`w-4 h-0.5 ${i < completedSteps ? "bg-emerald-400" : "bg-stone-200"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Current challenge */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-stone-50 rounded-2xl p-5 border-2 border-stone-200"
        >
          {/* Step narrative */}
          {step.narrative && (
            <div className="bg-indigo-50 rounded-xl p-3 mb-3 border border-indigo-100 flex items-start gap-2">
              <MapPin className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
              <p className="text-xs font-medium text-indigo-700">{step.narrative}</p>
            </div>
          )}

          {/* Question */}
          <p className="text-sm font-black text-stone-800 text-center mb-4">{step.question || step.prompt}</p>

          {/* Options */}
          <div className="grid grid-cols-1 gap-2.5">
            {(step.options || []).map((option, i) => {
              const isSelected = selected === option;
              const isCorrect = option === step.answer;
              let cls = "bg-white border-stone-200 text-stone-700 hover:border-indigo-300";
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
              {selected === step.answer ? (
                <span className="text-xs font-black text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Hebat! Teruskan misi!
                </span>
              ) : (
                <span className="text-xs font-black text-rose-600 flex items-center gap-1">
                  <XCircle className="w-4 h-4" /> Cuba lagi! Jawapan: {step.answer}
                </span>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <p className="text-center text-xs text-stone-500 font-medium">
        🌟 Selesaikan setiap langkah untuk menamatkan misi!
      </p>
    </div>
  );
}