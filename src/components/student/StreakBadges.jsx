import React from "react";
import { Flame, Lock } from "lucide-react";
import { motion } from "framer-motion";

const MILESTONES = [
  { days: 3, label: "3 Days", emoji: "🔥", gradient: "from-orange-400 to-red-500" },
  { days: 7, label: "1 Week", emoji: "⚡", gradient: "from-violet-500 to-purple-600" },
  { days: 30, label: "1 Month", emoji: "🏆", gradient: "from-amber-400 to-yellow-500" },
];

export default function StreakBadges({ streakDays }) {
  const streak = streakDays || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
    >
      <h2 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
        <Flame className="w-4 h-4 text-orange-500" />
        Streak Milestones
      </h2>
      <div className="grid grid-cols-3 gap-3">
        {MILESTONES.map((m, i) => {
          const unlocked = streak >= m.days;
          return (
            <motion.div
              key={m.days}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className={`relative rounded-2xl p-4 text-center border transition-all ${
                unlocked
                  ? `bg-gradient-to-br ${m.gradient} border-transparent shadow-lg`
                  : "bg-white border-border/50"
              }`}
            >
              <div className="text-3xl mb-1">
                {unlocked ? (
                  <span>{m.emoji}</span>
                ) : (
                  <Lock className="w-6 h-6 text-muted-foreground mx-auto" />
                )}
              </div>
              <p className={`text-xs font-bold ${unlocked ? "text-white" : "text-muted-foreground"}`}>
                {m.label}
              </p>
              {unlocked && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="text-[10px] text-white/80 font-medium mt-0.5"
                >
                  Unlocked!
                </motion.p>
              )}
              {!unlocked && streak > 0 && (
                <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                  {m.days - streak}d to go
                </p>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}