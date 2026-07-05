import React, { useState, useEffect, useRef } from "react";
import { BookOpen, Layers, Network, Gamepad2, CheckCircle2, Circle } from "lucide-react";
import { motion } from "framer-motion";

const STEPS = [
  { key: "lesson", label: "Lesson Read", icon: BookOpen },
  { key: "flashcards", label: "Flashcards", icon: Layers },
  { key: "mindmap", label: "Mind Map", icon: Network },
  { key: "activity", label: "Activity", icon: Gamepad2 },
];

export default function LessonProgress({ steps, onStepClick }) {
  // 🔥 TAMBAHAN: State untuk menjejak masa belajar (dalam saat)
  const [secondsSpent, setSecondsSpent] = useState(0);
  const timerRef = useRef(null);

  // Mula mengira masa sebaik sahaja halaman dimuatkan
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSecondsSpent((prev) => prev + 1);
    }, 1000);

    // Bersihkan timer apabila anak keluar dari halaman
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const completed = STEPS.filter((s) => steps[s.key]).length;
  const percent = Math.round((completed / STEPS.length) * 100);

  // 🔥 TAMBAHAN: Fungsi pengendali klik yang menyertakan data masa
  const handleStepClick = (stepKey) => {
    // Tukarkan saat kepada minit (minima 1 minit jika anak belajar kurang seminit)
    const minutesEarned = Math.max(Math.round(secondsSpent / 60), 1);
    
    // Hantar key langkah bersama dengan jumlah minit belajar yang terkumpul ke fungsi asal
    onStepClick?.(stepKey, minutesEarned);
  };

  return (
    <div className="bg-white rounded-2xl p-4 border border-border/50">
      {/* Progress bar */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-foreground">Learning Progress</span>
        <span className="text-xs font-bold text-primary">{percent}%</span>
      </div>
      <div className="h-2.5 bg-muted rounded-full overflow-hidden mb-4">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.5 }}
          className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
        />
      </div>

      {/* Step list */}
      <div className="grid grid-cols-2 gap-2">
        {STEPS.map((step) => {
          const done = steps[step.key];
          const Icon = step.icon;
          return (
            <button
              key={step.key}
              onClick={() => handleStepClick(step.key)} // 🔥 Ditukar ke fungsi handle baharu
              className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                done
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-border/50 bg-muted/30 hover:bg-muted/60"
              }`}
            >
              {done ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
              )}
              <Icon className={`w-4 h-4 shrink-0 ${done ? "text-emerald-600" : "text-muted-foreground"}`} />
              <span className={`text-xs font-medium truncate ${done ? "text-emerald-700" : "text-muted-foreground"}`}>
                {step.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}