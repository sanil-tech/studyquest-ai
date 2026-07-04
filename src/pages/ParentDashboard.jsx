// ---------------- LIVE ANIMATED DRAGON AVATAR COMPONENT ----------------
function LiveAvatar({ level }) {
  const lvl = level || 1;

  const getAvatarTheme = (l) => {
    if (l >= 15) {
      return {
        // High level: Ancient Dragon
        bg: "bg-gradient-to-br from-red-600 via-orange-500 to-yellow-500",
        auraColor: "border-orange-400",
        title: "Ancient Titan",
        accessory: "🔥", // Fire aura accessory
        model: "🐉"      // Chinese-style or full body elder dragon
      };
    } else if (l >= 6) {
      return {
        // Mid level: Growing Winged Dragon
        bg: "bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600",
        auraColor: "border-emerald-300",
        title: "Winged Drake",
        accessory: "⚡", // Lightning speed indicator
        model: "🐲"      // Dragon face/drake model
      };
    } else {
      return {
        // Base level: Dragon Hatchling/Egg
        bg: "bg-gradient-to-br from-slate-200 via-purple-300 to-pink-300",
        auraColor: "border-purple-200",
        title: "Hatchling",
        accessory: "🥚", // Egg shell item
        model: "🦖"      // Cute small dinosaur/baby monster look
      };
    }
  };

  const theme = getAvatarTheme(lvl);

  const floatTransition = {
    duration: 3,
    repeat: Infinity,
    ease: "easeInOut"
  };

  const auraPulseTransition = {
    duration: 2.5,
    repeat: Infinity,
    ease: "easeInOut",
    repeatType: "reverse"
  };

  const orbitTransition = {
    duration: 6,
    repeat: Infinity,
    ease: "linear"
  };

  return (
    <div className="relative flex flex-col items-center justify-center p-3 flex-shrink-0">
      
      {/* LIVE AURA: Continuous pulse and rotation */}
      <motion.div 
        animate={{ 
          scale: [1, 1.1, 1], 
          opacity: [0.3, 0.6, 0.3],
          rotate: [0, 360] 
        }}
        transition={{...auraPulseTransition, duration: 8}}
        className={`absolute w-28 h-28 rounded-full border-2 border-dashed ${theme.auraColor}`} 
      />
      
      {/* INNER GLOW LAYER */}
      <motion.div 
        animate={{ scale: [1.1, 1, 1.1] }}
        transition={auraPulseTransition}
        className={`absolute w-24 h-24 rounded-full border-4 ${theme.auraColor} opacity-40`} 
      />
      
      {/* MAIN LIVE CHARACTER CONTAINER */}
      <motion.div 
        whileHover={{ scale: 1.15, rotate: -5 }}
        className={`w-20 h-20 rounded-full ${theme.bg} shadow-lg border-2 border-white flex items-center justify-center relative overflow-hidden z-10`}
      >
        {/* CHARACTER MODEL: Gentle dragon breathing/floating motion */}
        <motion.span 
          animate={{ y: [-4, 4, -4], scale: [1, 1.05, 1] }}
          transition={floatTransition}
          className="text-5xl select-none filter drop-shadow-md relative z-20"
        >
          {theme.model}
        </motion.span>

        {/* ORBITING ELEMENT (Fire, Lightning, or Egg Shell) */}
        <motion.div 
          animate={{ rotate: [0, 360] }}
          transition={orbitTransition}
          className="absolute inset-0 z-10"
        >
          <motion.div 
            className="absolute top-1 right-1 text-sm bg-white/80 p-1 rounded-full shadow-sm"
          >
            {theme.accessory}
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Rarity/Rank Subtext */}
      <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mt-2 relative z-20">
        {theme.title}
      </span>
    </div>
  );
}