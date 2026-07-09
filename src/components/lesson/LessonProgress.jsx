import React from "react";
import { BookOpen, Layers, Network, Gamepad2, CheckCircle2, Circle, Target } from "lucide-react";
import { motion } from "framer-motion";

const STEPS = [
  { key: "lesson", label: "Nota Pintar", icon: BookOpen },
  { key: "flashcards", label: "Kad Memori", icon: Layers },
  { key: "mindmap", label: "Peta Minda", icon: Network },
  { key: "activity", label: "Cabaran Kuiz", icon: Gamepad2 },
];

export default function LessonProgress({ steps, onStepClick }) {
  // Kira peratusan langkah yang telah selesai
  const completed = STEPS.filter((s) => steps[s.key]).length;
  const percent = Math.round((completed / STEPS.length) * 100);

  return (
    <div className="bg-white rounded-[1.5rem] p-5 border border-emerald-100 shadow-sm">
      
      {/* Bar Kemajuan (Progress Bar) */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-black text-stone-700 flex items-center gap-1.5">
          <Target className="w-4 h-4 text-emerald-500" /> Kemajuan Misi
        </span>
        <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
          {percent}% Selesai
        </span>
      </div>
      
      <div className="h-3.5 bg-[#F3EFE6] rounded-full overflow-hidden mb-5 shadow-inner">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full bg-gradient-to-r from-lime-400 to-emerald-500 rounded-full relative"
        >
          {/* Pantulan Cahaya (Glossy effect) */}
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/30 rounded-t-full" />
        </motion.div>
      </div>

      {/* Grid Langkah (Step list) */}
      <div className="grid grid-cols-2 gap-3">
        {STEPS.map((step) => {
          const done = steps[step.key];
          const Icon = step.icon;
          
          return (
            <button
              key={step.key}
              onClick={() => onStepClick?.(step.key)}
              className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all text-left shadow-sm hover:shadow-md ${
                done
                  ? "border-emerald-200 bg-emerald-50 hover:bg-emerald-100/70"
                  : "border-stone-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40"
              }`}
            >
              <div className={`flex items-center justify-center shrink-0 ${done ? "text-emerald-500" : "text-stone-300"}`}>
                {done ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <Circle className="w-5 h-5" />
                )}
              </div>
              
              <div className="flex flex-col min-w-0">
                <span className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 flex items-center gap-1 ${done ? "text-emerald-600" : "text-stone-400"}`}>
                  <Icon className="w-3 h-3" /> Tahap
                </span>
                <span className={`text-xs font-black truncate ${done ? "text-emerald-900" : "text-stone-600"}`}>
                  {step.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
      
    </div>
  );
}