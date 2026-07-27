// Avatar Evolution System for StudyQuest — Pokémon-style Creature Companions
// Students choose a creature companion that evolves through stages based on XP.
// They can also buy and equip items from the Avatar Shop.

export const CREATURES = [
  {
    id: "otan",
    name: "Otan",
    title: "Penjaga Rimba",
    element: "forest",
    emoji: "🌿",
    bgGradient: "from-emerald-100 to-teal-100",
    borderColor: "border-emerald-300",
    textColor: "text-emerald-700",
    description: "Makhluk hutan yang setia dan tabah. Besar bersama rimba!",
    stages: [
      {
        stage: 1,
        name: "Baby Otan",
        xpRequired: 0,
        imageUrl: "https://media.base44.com/images/public/6a3f271e41dc4ee0d0d5abdf/735650f4c_generated_image.png",
        emoji: "🐵",
        description: "Baru lahir di rimba!",
        animation: "bounce",
      },
      {
        stage: 2,
        name: "Young Otan",
        xpRequired: 1000,
        imageUrl: "https://media.base44.com/images/public/6a3f271e41dc4ee0d0d5abdf/a11d888cb_generated_image.png",
        emoji: "🐒",
        description: "Penuh tenaga dan semangat!",
        animation: "wiggle",
      },
      {
        stage: 3,
        name: "Guardian Otan",
        xpRequired: 5000,
        imageUrl: "https://media.base44.com/images/public/6a3f271e41dc4ee0d0d5abdf/bd7c323b8_generated_image.png",
        emoji: "🦧",
        description: "Penjaga rimba yang gagah!",
        animation: "pulse",
      },
    ],
  },
  {
    id: "pyro",
    name: "Pyro",
    title: "Naga Api",
    element: "fire",
    emoji: "🔥",
    bgGradient: "from-orange-100 to-red-100",
    borderColor: "border-orange-300",
    textColor: "text-orange-700",
    description: "Naga kecil yang berani dan penuh semangat menyala!",
    stages: [
      {
        stage: 1,
        name: "Baby Pyro",
        xpRequired: 0,
        imageUrl: "https://media.base44.com/images/public/6a3f271e41dc4ee0d0d5abdf/7a75c3ee9_generated_image.png",
        emoji: "🦎",
        description: "Api kecil yang comel!",
        animation: "bounce",
      },
      {
        stage: 2,
        name: "Flare Pyro",
        xpRequired: 1000,
        imageUrl: "https://media.base44.com/images/public/6a3f271e41dc4ee0d0d5abdf/d7828e82d_generated_image.png",
        emoji: "🐉",
        description: "Naga muda yang berani!",
        animation: "pulse",
      },
      {
        stage: 3,
        name: "Inferno Pyro",
        xpRequired: 5000,
        imageUrl: "https://media.base44.com/images/public/6a3f271e41dc4ee0d0d5abdf/f1002fe9b_generated_image.png",
        emoji: "🔥",
        description: "Naga legenda api sejati!",
        animation: "pulse",
      },
    ],
  },
  {
    id: "aqua",
    name: "Aqua",
    title: "Penjaga Laut",
    element: "water",
    emoji: "💧",
    bgGradient: "from-blue-100 to-cyan-100",
    borderColor: "border-blue-300",
    textColor: "text-blue-700",
    description: "Penyu laut yang tenang dan bijak. Penjelajah lautan dalam!",
    stages: [
      {
        stage: 1,
        name: "Baby Aqua",
        xpRequired: 0,
        imageUrl: "https://media.base44.com/images/public/6a3f271e41dc4ee0d0d5abdf/b07de502b_generated_image.png",
        emoji: "🐢",
        description: "Penyu kecil yang comel!",
        animation: "float",
      },
      {
        stage: 2,
        name: "Tide Aqua",
        xpRequired: 1000,
        imageUrl: "https://media.base44.com/images/public/6a3f271e41dc4ee0d0d5abdf/edb1114ae_generated_image.png",
        emoji: "🌊",
        description: "Penjelajah laut yang lincah!",
        animation: "swing",
      },
      {
        stage: 3,
        name: "Tsunami Aqua",
        xpRequired: 5000,
        imageUrl: "https://media.base44.com/images/public/6a3f271e41dc4ee0d0d5abdf/202a48625_generated_image.png",
        emoji: "🐋",
        description: "Penjaga laut yang agung!",
        animation: "pulse",
      },
    ],
  },
];

// Shop Items — accessories students can buy with Syiling Emas and equip
export const AVATAR_ITEMS = [
  { id: "hat_grad", slot: "hat", name: "Topi Graduasi", emoji: "🎓", price: 50, description: "Untuk otan yang bijak!" },
  { id: "hat_crown", slot: "hat", name: "Mahkota Diraja", emoji: "👑", price: 100, description: "Lambang keagungan!" },
  { id: "hat_cap", slot: "hat", name: "Topi Bola", emoji: "🧢", price: 30, description: "Gaya sukan!" },
  { id: "hat_wizard", slot: "hat", name: "Topi Ahli Sihir", emoji: "🎩", price: 60, description: "Kuasa sihir!" },
  { id: "hat_party", slot: "hat", name: "Topi Parti", emoji: "🥳", price: 20, description: "Sambutan meriah!" },
  { id: "glasses_cool", slot: "glasses", name: "Cermin Gelap", emoji: "🕶️", price: 40, description: "Nampak macho!" },
  { id: "glasses_nerd", slot: "glasses", name: "Cermin Bijak", emoji: "🤓", price: 25, description: "Jenius sejati!" },
  { id: "glasses_goggle", slot: "glasses", name: "Goggle Sains", emoji: "🥽", price: 35, description: "Untuk eksperimen!" },
  { id: "acc_cape", slot: "accessory", name: "Jubah Hero", emoji: "🦸", price: 80, description: "Hero sebenar!" },
  { id: "acc_backpack", slot: "accessory", name: "Backpack", emoji: "🎒", price: 45, description: "Sedia berkelah!" },
  { id: "acc_guitar", slot: "accessory", name: "Gitar", emoji: "🎸", price: 70, description: "Bintang muzik!" },
  { id: "acc_star", slot: "accessory", name: "Bintang Bersinar", emoji: "⭐", price: 15, description: "Bersinar cerah!" },
];

// === Helper Functions ===

export const getCreatureById = (id) => CREATURES.find((c) => c.id === id) || CREATURES[0];

export const getCreatureStage = (creatureId, xp = 0) => {
  const creature = getCreatureById(creatureId);
  let stage = creature.stages[0];
  for (const s of creature.stages) {
    if (xp >= s.xpRequired) stage = s;
  }
  return stage;
};

export const getCreatureStageProgress = (creatureId, xp = 0) => {
  const creature = getCreatureById(creatureId);
  const currentStage = getCreatureStage(creatureId, xp);
  const idx = creature.stages.findIndex((s) => s.stage === currentStage.stage);
  const nextStage = idx < creature.stages.length - 1 ? creature.stages[idx + 1] : null;

  if (!nextStage) {
    return { currentStage, nextStage: null, percent: 100, xpToNext: 0, isMaxStage: true };
  }

  const xpInCurrent = xp - currentStage.xpRequired;
  const xpForNext = nextStage.xpRequired - currentStage.xpRequired;
  const percent = Math.min(Math.round((xpInCurrent / xpForNext) * 100), 100);

  return { currentStage, nextStage, percent, xpToNext: nextStage.xpRequired - xp, isMaxStage: false };
};

export const getItemById = (id) => AVATAR_ITEMS.find((i) => i.id === id);

export const parseOwnedItems = (raw) => {
  if (!raw) return [];
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const parseEquippedItems = (raw) => {
  if (!raw) return {};
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
};

// Position for equipped item overlays on the avatar
export const getItemPosition = (slot) => {
  switch (slot) {
    case "hat": return { top: "-4px", left: "50%", transform: "translateX(-50%)" };
    case "glasses": return { top: "28%", left: "50%", transform: "translateX(-50%)" };
    case "accessory": return { bottom: "-4px", right: "-4px" };
    default: return { top: "0", right: "0" };
  }
};

// Framer Motion animation variants
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

// === Backward Compatibility — default to Otan creature ===
export const AVATAR_STAGES = CREATURES[0].stages;
export const getAvatarStage = (xp = 0) => getCreatureStage("otan", xp);
export const getStageProgress = (xp = 0) => getCreatureStageProgress("otan", xp);
export const getNextStage = (xp = 0) => getCreatureStageProgress("otan", xp).nextStage;

// CSS Avatar Presets — for profile picture selection (separate from creature system)
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

export const resolveCssAvatar = (url) => {
  if (!url || typeof url !== "string" || !url.startsWith("css-avatar:")) return null;
  const id = url.replace("css-avatar:", "");
  return CSS_AVATAR_PRESETS.find((a) => a.id === id) || null;
};