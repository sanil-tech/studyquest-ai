// src/components/quiz/OptionButton.jsx
import React from "react";
import { CheckCircle2, XCircle } from "lucide-react";

export default function OptionButton({
  option,
  isSelected,
  isSubmitted,
  isCorrect,
  onClick,
  disabled
}) {
  const { label, text } = option;

  // Determine button background and border based on submission state
  let buttonStyle = "bg-stone-900/90 border-stone-700 text-stone-200 hover:border-amber-400 hover:bg-stone-800";

  if (isSelected && !isSubmitted) {
    buttonStyle = "bg-amber-400/20 border-amber-400 text-amber-200 shadow-lg shadow-amber-500/10";
  } else if (isSubmitted) {
    if (isCorrect) {
      buttonStyle = "bg-emerald-500/20 border-emerald-400 text-emerald-200 shadow-lg shadow-emerald-500/10";
    } else if (isSelected && !isCorrect) {
      buttonStyle = "bg-rose-500/20 border-rose-400 text-rose-200 shadow-lg shadow-rose-500/10";
    } else {
      buttonStyle = "bg-stone-900/40 border-stone-800 text-stone-500 opacity-50";
    }
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full p-4 rounded-2xl border-2 text-left flex items-start gap-3 transition-all active:scale-[0.99] ${buttonStyle}`}
    >
      <span className={`flex-shrink-0 w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center border ${
        isSelected ? "bg-amber-400 text-stone-950 border-amber-300" : "bg-stone-800 text-stone-300 border-stone-700"
      }`}>
        {label}
      </span>

      <span className="flex-1 text-xs sm:text-sm font-bold pt-1 leading-snug">
        {text}
      </span>

      {isSubmitted && isCorrect && (
        <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-1" />
      )}
      {isSubmitted && isSelected && !isCorrect && (
        <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-1" />
      )}
    </button>
  );
}
