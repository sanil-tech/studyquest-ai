import React from "react";
import { BookOpen, Layers, Network, Gamepad2, CheckCircle2, Circle } from "lucide-react";
import { motion } from "framer-motion";

const STEPS = [
  { key: "lesson", label: "Lesson Read", icon: BookOpen },
  { key: "flashcards", label: "Flashcards", icon: Layers },
  { key: "mindmap", label: "Mind Map", icon: Network },
  { key: "activity", label: "Activity", icon: Gamepad2 },
];

export default function LessonProgress({ steps, onStepClick }) {
  // Memastikan aplikasi tidak crash jika prop 'steps' bernilai undefined atau null
  const safeSteps = steps || {};
  const completed = STEPS.filter((s) => safeSteps[s.key]).length;
  const percent = Math.round((completed / STEPS.length) * 100);

  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-slate-700">Learning Progress</span>
        <span className="text-xs font-bold text-indigo-600">{percent}%</span>
      </div>
      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden mb-4">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.5 }}
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        {STEPS.map((step) => {
          const done = safeSteps[step.key];
          const Icon = step.icon;
          return (
            <button
              key={step.key}
              onClick={() => onStepClick?.(step.key)}
              className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                done
                  ? "border-emerald-200 bg-emerald-50/50"
                  : "border-slate-100 bg-slate-50/50 hover:bg-slate-50"
              }`}
            >
              {done ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-slate-300 shrink-0" />
              )}
              <Icon className={`w-4 h-4 shrink-0 ${done ? "text-emerald-600" : "text-slate-400"}`} />
              <span className={`text-xs font-medium truncate ${done ? "text-emerald-700" : "text-slate-600"}`}>
                {step.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}