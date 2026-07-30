import React from "react";
import { BookOpen, Network, Gamepad2, CheckCircle2, Lock, Play, Tv, Trophy, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const STEPS = [
  { key: "video", label: "Video Guru", icon: Tv },
  { key: "lesson", label: "Nota Pintar", icon: BookOpen },
  { key: "mindmap", label: "Peta Minda", icon: Network },
  { key: "games", label: "Permainan", icon: Gamepad2 },
  { key: "quiz", label: "Kuiz Boss", icon: Trophy },
];

export default function LessonProgress({ steps, onStepClick }) {
  const completedCount = STEPS.filter((s) => steps[s.key]).length;
  const percent = Math.round((completedCount / STEPS.length) * 100);
  const isAllComplete = percent === 100;
  const currentStepIndex = STEPS.findIndex(
    (s, i) => !steps[s.key] && (i === 0 || steps[STEPS[i - 1].key])
  );

  return (
    <div className="relative bg-gradient-to-b from-cyan-100 via-sky-50 to-white rounded-3xl border-2 border-sky-200/60 shadow-xl overflow-hidden min-h-[580px] font-sans">
      {/* Soft ambient glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/40 blur-3xl rounded-full pointer-events-none" />

      {/* Tree trunk */}
      <div className="absolute left-6 sm:left-10 top-0 bottom-0 w-12 sm:w-16 z-0">
        <div className="w-full h-full bg-gradient-to-r from-[#5C3A1E] via-[#7B4A26] to-[#5C3A1E] rounded-t-xl shadow-2xl relative overflow-hidden">
          {/* Wood grain lines */}
          <div className="absolute inset-0 opacity-15 flex flex-col justify-around py-2">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="h-px bg-[#3D2010] mx-1" />
            ))}
          </div>
          {/* Left edge highlight */}
          <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-r from-white/15 to-transparent" />
          {/* Branch knots */}
          {STEPS.map((_, i) => (
            <div
              key={i}
              className="absolute left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-[#4A2810] border-2 border-[#8B5A2B] shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] z-20"
              style={{ top: `${20 + i * 16}%` }}
            />
          ))}
        </div>
      </div>

      {/* Orangutan mascot at current step */}
      <AnimatePresence mode="wait">
        {currentStepIndex >= 0 && !isAllComplete && (
          <motion.div
            key={currentStepIndex}
            initial={{ opacity: 0, y: -10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="absolute left-1 sm:left-3 z-30 text-3xl sm:text-4xl drop-shadow-[0_4px_6px_rgba(0,0,0,0.2)]"
            style={{ top: `${14 + currentStepIndex * 16}%` }}
          >
            🦧
          </motion.div>
        )}
      </AnimatePresence>

      {/* All-complete celebration */}
      <AnimatePresence>
        {isAllComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-10 left-1 sm:left-3 z-30 text-4xl sm:text-5xl animate-bounce drop-shadow-lg"
          >
            🦧<span className="text-2xl ml-1">✨</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress indicator */}
      <div className="relative z-20 flex justify-center pt-6 pb-2 pl-12 sm:pl-20">
        <div className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-1.5 shadow-md border border-sky-100 flex items-center gap-2">
          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          <div className="w-20 h-2 bg-sky-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percent}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full"
            />
          </div>
          <span className="text-[11px] font-black text-orange-600">{percent}%</span>
        </div>
      </div>

      {/* Branch buttons — reversed so Dahan 1 is at bottom */}
      <div className="relative z-20 flex flex-col-reverse gap-5 sm:gap-7 pb-8 pt-4 pl-16 sm:pl-24 pr-4 sm:pr-8">
        {STEPS.map((step, index) => {
          const isDone = steps[step.key] || false;
          const isLocked = index > 0 && !steps[STEPS[index - 1].key];
          const isCurrent = !isDone && !isLocked;
          const Icon = step.icon;

          return (
            <motion.div
              key={step.key}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08 }}
              className="relative flex items-center"
            >
              {/* Branch connector from trunk */}
              <div className="absolute -left-4 sm:-left-6 top-1/2 -translate-y-1/2 w-6 sm:w-8 h-2.5 bg-gradient-to-r from-[#7B4A26] to-[#5C3A1E] rounded-r-full z-10 shadow-sm" />

              <button
                disabled={isLocked}
                onClick={() => !isLocked && onStepClick?.(step.key)}
                className={`flex-1 max-w-xs sm:max-w-sm p-3 sm:p-4 rounded-2xl flex items-center justify-between transition-all duration-200 ${
                  isDone
                    ? "bg-gradient-to-r from-emerald-400 to-green-500 text-white shadow-lg shadow-emerald-200 hover:shadow-xl hover:brightness-105 active:scale-[0.98]"
                    : isCurrent
                    ? "bg-gradient-to-r from-[#FF8C00] to-[#E67E22] text-white shadow-lg shadow-orange-200 hover:shadow-xl hover:brightness-105 active:scale-[0.98] ring-2 ring-orange-300/30"
                    : "bg-[#D7D7D7] text-stone-400 cursor-not-allowed shadow-sm"
                }`}
              >
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isLocked ? "bg-stone-300/50" : "bg-white/25 backdrop-blur-sm"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isLocked ? "text-stone-400" : "text-white"}`} />
                  </div>
                  <div className="text-left">
                    <p
                      className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest ${
                        isLocked ? "text-stone-400" : "text-white/80"
                      }`}
                    >
                      Dahan {index + 1}
                    </p>
                    <p
                      className={`text-sm font-black leading-tight ${
                        isLocked ? "text-stone-400" : "text-white"
                      }`}
                    >
                      {step.label}
                    </p>
                  </div>
                </div>

                <div
                  className={`shrink-0 p-1.5 sm:p-2 rounded-full ${
                    isLocked ? "bg-stone-300/40" : "bg-white/20"
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  ) : isLocked ? (
                    <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-stone-400" />
                  ) : (
                    <Play className="w-4 h-4 sm:w-5 sm:h-5 text-white fill-white" />
                  )}
                </div>
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Green leaf at bottom */}
      <div className="absolute bottom-0 left-0 z-0 pointer-events-none">
        <svg width="72" height="72" viewBox="0 0 100 100" className="text-green-500/60 fill-current">
          <path d="M 15,85 Q 5,45 45,15 Q 85,45 75,85 Q 45,75 15,85 Z" />
        </svg>
      </div>
    </div>
  );
}