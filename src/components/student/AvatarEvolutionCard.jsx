import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Lock } from "lucide-react";
import AvatarDisplay from "@/components/avatar/AvatarDisplay";
import { AVATAR_STAGES, getAvatarStage, getStageProgress } from "@/lib/avatarSystem";

export default function AvatarEvolutionCard({ xp = 0, userName = "Penjelajah" }) {
  const { currentStage, nextStage, percent, xpToNext, isMaxStage } = getStageProgress(xp);

  return (
    <div className="bg-white rounded-3xl p-6 border-4 border-emerald-100 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <Sparkles className="w-6 h-6 text-emerald-500" />
        <h2 className="text-lg font-black text-stone-800">Evolusi Avatar Kamu</h2>
      </div>

      {/* Current Stage Spotlight */}
      <div className={`bg-gradient-to-br ${currentStage.bgGradient} rounded-2xl p-5 mb-5 border-2 ${currentStage.borderColor} flex flex-col items-center text-center`}>
        <AvatarDisplay xp={xp} size="xl" variant="plain" />
        <h3 className={`text-xl font-black mt-3 ${currentStage.textColor}`}>
          {currentStage.name}
        </h3>
        <p className="text-sm font-bold text-stone-600 mt-0.5">
          {currentStage.description}
        </p>
      </div>

      {/* Progress to Next Stage */}
      {!isMaxStage && nextStage ? (
        <div className="mb-5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-black text-stone-500">
              {xpToNext} XP lagi untuk evolve!
            </span>
            <span className="text-xs font-bold text-stone-400">
              → {nextStage.name} {nextStage.emoji}
            </span>
          </div>
          <div className="h-5 bg-stone-100 rounded-full overflow-hidden border-2 border-stone-200 p-0.5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percent}%` }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-lime-400 via-emerald-500 to-green-600 rounded-full"
            />
          </div>
        </div>
      ) : (
        <div className="mb-5 text-center bg-amber-50 rounded-2xl p-3 border-2 border-amber-200">
          <p className="text-sm font-black text-amber-700">
            ✨ Tahap Maksimum Tercapai! ✨
          </p>
          <p className="text-xs font-bold text-amber-600 mt-0.5">
            {userName} adalah Legenda Rimba!
          </p>
        </div>
      )}

      {/* Evolution Stages Row */}
      <div className="flex justify-between items-end gap-1 overflow-x-auto pb-2">
        {AVATAR_STAGES.map((stage, index) => {
          const isUnlocked = xp >= stage.xpRequired;
          const isCurrent = stage.stage === currentStage.stage;

          return (
            <div
              key={stage.stage}
              className={`flex flex-col items-center gap-1 shrink-0 transition-all ${
                isCurrent ? "scale-110" : "opacity-60"
              }`}
            >
              <div
                className={`relative w-10 h-10 rounded-xl flex items-center justify-center text-xl border-2 ${
                  isUnlocked
                    ? `bg-gradient-to-br ${stage.bgGradient} ${stage.borderColor}`
                    : "bg-stone-100 border-stone-200"
                } ${isCurrent ? "ring-4 ring-emerald-300 ring-offset-1" : ""}`}
              >
                {isUnlocked ? (
                  <span>{stage.emoji}</span>
                ) : (
                  <Lock className="w-3.5 h-3.5 text-stone-400" />
                )}
                {isCurrent && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[8px] font-black border-2 border-white"
                  >
                    ★
                  </motion.span>
                )}
              </div>
              <span
                className={`text-[7px] font-black text-center leading-tight w-12 truncate ${
                  isCurrent ? "text-emerald-700" : "text-stone-400"
                }`}
              >
                {stage.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}