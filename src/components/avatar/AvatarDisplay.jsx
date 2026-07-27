import React from "react";
import { motion } from "framer-motion";
import {
  getCreatureById,
  getCreatureStage,
  getAnimationProps,
  getItemById,
  getItemPosition,
} from "@/lib/avatarSystem";

const SIZE_MAP = {
  sm: { container: "w-12 h-12 rounded-xl", radius: "rounded-xl", emoji: "text-2xl", itemSize: "text-xs", glow: "blur-md", sparkle: "text-[6px]", sparkles: 3 },
  md: { container: "w-16 h-16 rounded-2xl", radius: "rounded-2xl", emoji: "text-3xl", itemSize: "text-sm", glow: "blur-lg", sparkle: "text-[8px]", sparkles: 4 },
  lg: { container: "w-20 h-20 rounded-full", radius: "rounded-full", emoji: "text-4xl", itemSize: "text-base", glow: "blur-lg", sparkle: "text-[10px]", sparkles: 5 },
  xl: { container: "w-32 h-32 rounded-3xl", radius: "rounded-3xl", emoji: "text-7xl", itemSize: "text-2xl", glow: "blur-xl", sparkle: "text-sm", sparkles: 6 },
};

// Subject-themed glow colors for the magical aura
const GLOW_COLORS = {
  mat: "rgba(99, 102, 241, 0.5)",
  lex: "rgba(236, 72, 153, 0.5)",
  atom: "rgba(16, 185, 129, 0.5)",
  krono: "rgba(245, 158, 11, 0.5)",
  atlas: "rgba(59, 130, 246, 0.5)",
  sastera: "rgba(139, 92, 246, 0.5)",
};

export default function AvatarDisplay({
  xp = 0,
  creatureId = "otan",
  equippedItems = {},
  size = "md",
  showStage = false,
  variant = "card",
  fill = false,
  className = "",
}) {
  const creature = getCreatureById(creatureId);
  const stage = getCreatureStage(creatureId, xp);
  const sizes = SIZE_MAP[size] || SIZE_MAP.md;
  const { animate, transition } = getAnimationProps(stage.animation);
  const glowColor = GLOW_COLORS[creature.id] || GLOW_COLORS.mat;
  const isMagical = !stage.imageUrl;

  const containerClass = fill
    ? `w-full h-full flex items-center justify-center shrink-0 ${className}`
    : variant === "plain"
      ? `${sizes.container} flex items-center justify-center shrink-0 ${className}`
      : `${sizes.container} bg-gradient-to-br ${creature.bgGradient} ${creature.borderColor} border-4 flex items-center justify-center shadow-lg shrink-0 ${className}`;

  const equippedList = Object.values(equippedItems)
    .map((id) => getItemById(id))
    .filter(Boolean);

  return (
    <div className="flex flex-col items-center">
      <div className={`relative ${containerClass}`}>
        {/* Magical glow aura — pulsing energy behind the creature */}
        {isMagical && (
          <motion.div
            className={`absolute inset-0 ${sizes.radius} ${sizes.glow}`}
            style={{ background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)` }}
            animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
          />
        )}

        {/* Rotating magical energy ring */}
        {isMagical && size !== "sm" && (
          <motion.div
            className={`absolute inset-[-4px] ${sizes.radius} opacity-30`}
            style={{
              background: `conic-gradient(from 0deg, transparent, ${glowColor}, transparent, ${glowColor}, transparent)`,
            }}
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
          />
        )}

        {/* Creature emoji/image */}
        {stage.imageUrl ? (
          <motion.img
            src={stage.imageUrl}
            alt={stage.name}
            className={`w-full h-full object-cover relative z-[1] ${fill ? "" : sizes.radius}`}
            animate={animate}
            transition={transition}
          />
        ) : (
          <motion.span
            className={`${sizes.emoji} select-none relative z-[1] drop-shadow-[0_0_8px_${glowColor}]`}
            animate={animate}
            transition={transition}
          >
            {stage.emoji}
          </motion.span>
        )}

        {/* Orbiting sparkle particles */}
        {isMagical && (
          <motion.div
            className="absolute inset-0 z-[2] pointer-events-none"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
          >
            {Array.from({ length: sizes.sparkles }).map((_, i) => {
              const angle = (360 / sizes.sparkles) * i;
              return (
                <motion.span
                  key={i}
                  className={`absolute ${sizes.sparkle}`}
                  style={{
                    top: "50%",
                    left: "50%",
                    transform: `rotate(${angle}deg) translateY(-${size === "xl" ? 56 : size === "lg" ? 38 : size === "md" ? 30 : 22}px)`,
                  }}
                  animate={{ scale: [0.5, 1, 0.5], opacity: [0.3, 1, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.3, ease: "easeInOut" }}
                >
                  ✨
                </motion.span>
              );
            })}
          </motion.div>
        )}

        {/* Equipped items overlay */}
        {equippedList.map((item) => (
          <span
            key={item.id}
            className={`absolute ${sizes.itemSize} z-10 drop-shadow-md select-none`}
            style={getItemPosition(item.slot)}
          >
            {item.emoji}
          </span>
        ))}
      </div>
      {showStage && (
        <div className="text-center mt-1.5">
          <p className={`text-[10px] font-black ${creature.textColor}`}>{stage.name}</p>
          <p className="text-[8px] text-slate-400 leading-tight">{stage.description}</p>
        </div>
      )}
    </div>
  );
}