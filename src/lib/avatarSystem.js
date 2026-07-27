// Avatar Evolution System for StudyQuest
// Every student starts as a Baby Orangutan and evolves through 7 stages based on XP.

export const AVATAR_STAGES = [
  {
    stage: 1,
    name: "Baby Otan",
    xpRequired: 0,
    emoji: "🐵",
    bgGradient: "from-amber-100 to-orange-100",
    borderColor: "border-amber-200",
    textColor: "text-amber-700",
    description: "Mula kembara pertama!",
    animation: "bounce",
    accessory: null,
  },
  {
    stage: 2,
    name: "Young Otan",
    xpRequired: 500,
    emoji: "🐒",
    bgGradient: "from-amber-200 to-yellow-200",
    borderColor: "border-amber-300",
    textColor: "text-amber-700",
    description: "Semakin penuh tenaga!",
    animation: "wiggle",
    accessory: null,
  },
  {
    stage: 3,
    name: "Explorer Otan",
    xpRequired: 1500,
    emoji: "🦧",
    bgGradient: "from-emerald-200 to-teal-200",
    borderColor: "border-emerald-300",
    textColor: "text-emerald-700",
    description: "Berani meneroka rimba!",
    animation: "pulse",
    accessory: null,
  },
  {
    stage: 4,
    name: "Smart Otan",
    xpRequired: 3500,
    emoji: "🦧",
    bgGradient: "from-blue-200 to-indigo-200",
    borderColor: "border-blue-300",
    textColor: "text-blue-700",
    description: "Bijak dan pantas berfikir!",
    animation: "float",
    accessory: "🎓",
  },
  {
    stage: 5,
    name: "Adventure Otan",
    xpRequired: 7000,
    emoji: "🦧",
    bgGradient: "from-purple-200 to-pink-200",
    borderColor: "border-purple-300",
    textColor: "text-purple-700",
    description: "Pakar pengembaraan sejati!",
    animation: "swing",
    accessory: "🎒",
  },
  {
    stage: 6,
    name: "Master Otan",
    xpRequired: 12000,
    emoji: "🦧",
    bgGradient: "from-amber-300 to-yellow-300",
    borderColor: "border-amber-400",
    textColor: "text-amber-800",
    description: "Guru kembara yang disegani!",
    animation: "bounce",
    accessory: "👑",
  },
  {
    stage: 7,
    name: "Legend Otan",
    xpRequired: 20000,
    emoji: "🦧",
    bgGradient: "from-yellow-300 via-amber-300 to-orange-300",
    borderColor: "border-yellow-400",
    textColor: "text-amber-900",
    description: "Legenda Rimba yang tidak tergugat!",
    animation: "pulse",
    accessory: "✨",
  },
];

// Returns the avatar stage object for a given XP value
export const getAvatarStage = (xp = 0) => {
  let stage = AVATAR_STAGES[0];
  for (const s of AVATAR_STAGES) {
    if (xp >= s.xpRequired) stage = s;
  }
  return stage;
};

// CSS Avatar Presets — stored as `css-avatar:<id>` in profile_picture_url
// Shared between ProfilePhotoSection (selection) and AppLayout (rendering)
export const CSS_AVATAR_PRESETS = [
  { id: "war_01", emoji: "🥷", bg: "from-red-500 via-orange-500 to-amber-500" },
  { id: "war_02", emoji: "🛡️", bg: "from-blue-600 via-indigo-600 to-cyan-500" },
  { id: "war_03", emoji: "⚔️", bg: "from-rose-500 via-purple-600 to-indigo-600" },
  { id: "war_04", emoji: "🪓", bg: "from-amber-600 via-amber-700 to-amber-900" },
  { id: "war_05", emoji: "🏹", bg: "from-emerald-600 via-teal-600 to-cyan-600" },
  { id: "war_06", emoji: "🔱", bg: "from-orange-600 via-red-600 to-stone-700" },
  { id: "her_01", emoji: "🦸", bg: "from-blue-500 via-red-500 to-yellow-400" },
  { id: "her_02", emoji: "⚡", bg: "from-yellow-400 via-orange-500 to-red-500" },
  { id: "her_03", emoji: "🕶️", bg: "from-zinc-700 via-slate-800 to-zinc-900" },
  { id: "her_04", emoji: "🧜‍♂️", bg: "from-cyan-500 via-blue-500 to-indigo-600" },
  { id: "her_05", emoji: "🧬", bg: "from-lime-400 via-emerald-500 to-teal-700" },
  { id: "her_06", emoji: "🛡️", bg: "from-indigo-600 via-purple-600 to-pink-500" },
  { id: "cyb_01", emoji: "🤖", bg: "from-slate-700 via-zinc-800 to-gray-600" },
  { id: "cyb_02", emoji: "👾", bg: "from-emerald-500 via-teal-600 to-cyan-500" },
  { id: "cyb_03", emoji: "🚀", bg: "from-amber-400 via-orange-500 to-red-600" },
  { id: "cyb_04", emoji: "💻", bg: "from-fuchsia-500 via-purple-600 to-indigo-700" },
  { id: "cyb_05", emoji: "🎧", bg: "from-pink-500 via-rose-500 to-violet-600" },
  { id: "cyb_06", emoji: "🦾", bg: "from-cyan-600 via-slate-700 to-blue-900" },
  { id: "bst_01", emoji: "🦊", bg: "from-orange-500 via-red-500 to-yellow-400" },
  { id: "bst_02", emoji: "🐉", bg: "from-cyan-400 via-blue-500 to-emerald-500" },
  { id: "bst_03", emoji: "🐯", bg: "from-amber-500 via-yellow-600 to-zinc-800" },
  { id: "bst_04", emoji: "🐼", bg: "from-stone-300 via-stone-500 to-stone-700" },
  { id: "bst_05", emoji: "🐶", bg: "from-amber-400 via-orange-400 to-amber-600" },
  { id: "bst_06", emoji: "🐱", bg: "from-purple-400 via-pink-400 to-indigo-500" },
  { id: "mys_01", emoji: "🔮", bg: "from-purple-600 via-fuchsia-600 to-pink-500" },
  { id: "mys_02", emoji: "🔥", bg: "from-red-600 via-rose-500 to-amber-400" },
  { id: "mys_03", emoji: "✨", bg: "from-indigo-900 via-purple-800 to-slate-900" },
  { id: "mys_04", emoji: "🦅", bg: "from-amber-500 via-red-500 to-rose-600" },
  { id: "mys_05", emoji: "❄️", bg: "from-sky-400 via-blue-500 to-teal-400" },
  { id: "mys_06", emoji: "⏳", bg: "from-emerald-600 via-teal-700 to-slate-800" },
];

// Returns { emoji, bg } if the URL is a css-avatar: identifier, or null otherwise
export const resolveCssAvatar = (url) => {
  if (!url || typeof url !== "string" || !url.startsWith("css-avatar:")) return null;
  const id = url.replace("css-avatar:", "");
  return CSS_AVATAR_PRESETS.find((a) => a.id === id) || null;
};

// Returns the next stage after the current one (or null if at max)
export const getNextStage = (xp = 0) => {
  const current = getAvatarStage(xp);
  const idx = AVATAR_STAGES.findIndex((s) => s.stage === current.stage);
  return idx < AVATAR_STAGES.length - 1 ? AVATAR_STAGES[idx + 1] : null;
};

// Returns full stage progress info: current stage, next stage, percent, XP remaining
export const getStageProgress = (xp = 0) => {
  const currentStage = getAvatarStage(xp);
  const nextStage = getNextStage(xp);

  if (!nextStage) {
    return {
      currentStage,
      nextStage: null,
      percent: 100,
      xpToNext: 0,
      isMaxStage: true,
    };
  }

  const xpInCurrent = xp - currentStage.xpRequired;
  const xpForNext = nextStage.xpRequired - currentStage.xpRequired;
  const percent = Math.min(Math.round((xpInCurrent / xpForNext) * 100), 100);

  return {
    currentStage,
    nextStage,
    percent,
    xpToNext: nextStage.xpRequired - xp,
    isMaxStage: false,
  };
};

// Framer Motion animation variants keyed by animation name
export const getAnimationProps = (animationName) => {
  const animations = {
    bounce: { y: [0, -8, 0] },
    wiggle: { rotate: [-5, 5, -5, 0] },
    pulse: { scale: [1, 1.05, 1] },
    float: { y: [0, -6, 0] },
    swing: { rotate: [0, 8, -8, 0] },
  };
  const transitions = {
    bounce: { repeat: Infinity, duration: 1.5, ease: "easeInOut" },
    wiggle: { repeat: Infinity, duration: 2, ease: "easeInOut" },
    pulse: { repeat: Infinity, duration: 2, ease: "easeInOut" },
    float: { repeat: Infinity, duration: 3, ease: "easeInOut" },
    swing: { repeat: Infinity, duration: 2.5, ease: "easeInOut" },
  };
  return {
    animate: animations[animationName] || animations.bounce,
    transition: transitions[animationName] || transitions.bounce,
  };
};