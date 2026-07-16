import React from "react";
import { motion } from "framer-motion";
import { getAvatarStage, getAnimationProps } from "@/lib/avatarSystem";

const SIZE_MAP = {
  sm: { container: "w-12 h-12 rounded-xl", emoji: "text-2xl", accessory: "text-xs", accessoryPos: "-top-1 -right-1" },
  md: { container: "w-16 h-16 rounded-2xl", emoji: "text-3xl", accessory: "text-sm", accessoryPos: "-top-1 -right-1" },
  lg: { container: "w-24 h-24 rounded-3xl", emoji: "text-5xl", accessory: "text-lg", accessoryPos: "-top-2 -right-2" },
  xl: { container: "w-32 h-32 rounded-3xl", emoji: "text-7xl", accessory: "text-2xl", accessoryPos: "-top-3 -right-3" },
};

export default function AvatarDisplay({ xp = 0, size = "md", showStage = false, variant = "card", className = "" }) {
  const stage = getAvatarStage(xp);
  const sizes = SIZE_MAP[size] || SIZE_MAP.md;
  const { animate, transition } = getAnimationProps(stage.animation);

  const containerClass =
    variant === "plain"
      ? `${sizes.container} flex items-center justify-center shrink-0 ${className}`
      : `${sizes.container} bg-gradient-to-br ${stage.bgGradient} ${stage.borderColor} border-4 flex items-center justify-center shadow-lg shrink-0 ${className}`;

  return (
    <div className="flex flex-col items-center">
      <div className={`relative ${containerClass}`}>
        {stage.accessory && (
          <span className={`absolute ${sizes.accessoryPos} ${sizes.accessory} select-none drop-shadow-sm`}>
            {stage.accessory}
          </span>
        )}
        <motion.span
          className={`${sizes.emoji} select-none`}
          animate={animate}
          transition={transition}
        >
          {stage.emoji}
        </motion.span>
      </div>
      {showStage && (
        <div className="text-center mt-1.5">
          <p className={`text-[10px] font-black ${stage.textColor}`}>{stage.name}</p>
          <p className="text-[8px] text-slate-400 leading-tight">{stage.description}</p>
        </div>
      )}
    </div>
  );
}