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
  sm: { container: "w-12 h-12 rounded-xl", radius: "rounded-xl", emoji: "text-2xl", itemSize: "text-xs" },
  md: { container: "w-16 h-16 rounded-2xl", radius: "rounded-2xl", emoji: "text-3xl", itemSize: "text-sm" },
  lg: { container: "w-20 h-20 rounded-full", radius: "rounded-full", emoji: "text-4xl", itemSize: "text-base" },
  xl: { container: "w-32 h-32 rounded-3xl", radius: "rounded-3xl", emoji: "text-7xl", itemSize: "text-2xl" },
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
        {stage.imageUrl ? (
          <motion.img
            src={stage.imageUrl}
            alt={stage.name}
            className={`w-full h-full object-cover ${fill ? "" : sizes.radius}`}
            animate={animate}
            transition={transition}
          />
        ) : (
          <motion.span
            className={`${sizes.emoji} select-none`}
            animate={animate}
            transition={transition}
          >
            {stage.emoji}
          </motion.span>
        )}
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