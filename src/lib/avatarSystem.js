// Avatar Evolution System for StudyQuest — Subject Mascot Companions
// Each school subject has a mascot creature that evolves through 10 stages based on XP.
// Students choose a companion that grows alongside their learning journey.

// === Unified Evolution System ===
// All creatures share the same 10-level progression: Bayi → Pelajar → Master → Lagenda
// Same stage names, emojis, and XP thresholds across ALL creatures for consistency.
// Each level's emoji is visually distinct to show clear upgrade progression.

const STAGE_DEFS = [
  { stage: 1, name: "Telur Misteri", xpRequired: 0, emoji: "🥚", tier: "bayi", animation: "bounce" },
  { stage: 2, name: "Baru Menetas", xpRequired: 100, emoji: "🐣", tier: "bayi", animation: "bounce" },
  { stage: 3, name: "Anak Comel", xpRequired: 300, emoji: "🐾", tier: "bayi", animation: "wiggle" },
  { stage: 4, name: "Penjelajah", xpRequired: 600, emoji: "✨", tier: "pelajar", animation: "float" },
  { stage: 5, name: "Pelajar Rajin", xpRequired: 1000, emoji: "📚", tier: "pelajar", animation: "pulse" },
  { stage: 6, name: "Pakar Muda", xpRequired: 1500, emoji: "🌟", tier: "pelajar", animation: "swing" },
  { stage: 7, name: "Sarjana", xpRequired: 2200, emoji: "🔮", tier: "master", animation: "pulse" },
  { stage: 8, name: "Master Ilmu", xpRequired: 3000, emoji: "💫", tier: "master", animation: "wiggle" },
  { stage: 9, name: "Profesor", xpRequired: 4000, emoji: "🎓", tier: "master", animation: "pulse" },
  { stage: 10, name: "Raja Penjaga", xpRequired: 5500, emoji: "👑", tier: "lagenda", animation: "pulse" },
];

const STAGE_DESCS = [
  "Telur ajaib {c} menanti di {h}.",
  "{c} menetas! {t} mula terbentuk.",
  "{c} mula belajar asas {s}.",
  "{c} meneroka dunia {s} dengan penuh semangat!",
  "{c} menguasai asas {s}.",
  "{c} mahir kemahiran {s} baharu!",
  "{c} menjadi bijak dan dipercayai.",
  "{c} mencapai penguasaan tinggi {s}!",
  "{c} dikenali sebagai sarjana {s} agung.",
  "{c} menjadi legenda {s} Hutan Ilmu!",
];

const buildStages = (creature, subject, habitat, trait) =>
  STAGE_DEFS.map((def, i) => ({
    ...def,
    description: STAGE_DESCS[i]
      .replace(/{c}/g, creature)
      .replace(/{s}/g, subject)
      .replace(/{h}/g, habitat)
      .replace(/{t}/g, trait),
  }));

export const STAGE_TIERS = {
  bayi: { label: "Bayi", color: "text-slate-500", bg: "bg-slate-50", border: "border-slate-200", ring: "ring-slate-300" },
  pelajar: { label: "Pelajar", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", ring: "ring-blue-300" },
  master: { label: "Master", color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200", ring: "ring-purple-300" },
  lagenda: { label: "Lagenda", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-300", ring: "ring-amber-400" },
};

export const CREATURES = [
  {
    id: "mat",
    name: "Numerix",
    title: "Penjaga Nombor Ajaib",
    subject: "Matematik",
    subjectIcon: "📐",
    emoji: "🦉",
    bgGradient: "from-indigo-100 to-blue-100",
    borderColor: "border-indigo-300",
    textColor: "text-indigo-700",
    imageUrl: "https://media.base44.com/images/public/6a3f271e41dc4ee0d0d5abdf/8f8d9b0dd_generated_image.png",
    description: "Burung hantu bijak yang menguasai nombor dan logik. Setiap soal matematik membuatnya semakin bijak!",
    stages: buildStages("Numerix", "matematik", "sarang pokok nombor", "Mata besar"),
  },
  {
    id: "lex",
    name: "Lexis",
    title: "Penjaga Kata Ajaib",
    subject: "Bahasa Inggeris",
    subjectIcon: "📖",
    emoji: "🦊",
    bgGradient: "from-pink-100 to-rose-100",
    borderColor: "border-pink-300",
    textColor: "text-pink-700",
    imageUrl: "https://media.base44.com/images/public/6a3f271e41dc4ee0d0d5abdf/fd809905a_generated_image.png",
    description: "Rubah yang bijak dan pantas. Menguasai perkataan dan cerita Inggeris dengan setiap pelajaran!",
    stages: buildStages("Lexis", "bahasa Inggeris", "rak buku lama", "Telinga tajam"),
  },
  {
    id: "atom",
    name: "Sparky",
    title: "Penjaga Sains Ajaib",
    subject: "Sains",
    subjectIcon: "🔬",
    emoji: "🐭",
    bgGradient: "from-emerald-100 to-teal-100",
    borderColor: "border-emerald-300",
    textColor: "text-emerald-700",
    imageUrl: "https://media.base44.com/images/public/6a3f271e41dc4ee0d0d5abdf/916bbea18_generated_image.png",
    description: "Tikus makmal yang sentiasa ingin tahu. Setiap eksperimen menjadikannya saintis yang lebih hebat!",
    stages: buildStages("Sparky", "sains", "makmal rahsia", "Hidung kecil"),
  },
  {
    id: "krono",
    name: "Shelldon",
    title: "Penjaga Masa Ajaib",
    subject: "Sejarah",
    subjectIcon: "🏛️",
    emoji: "🐢",
    bgGradient: "from-amber-100 to-yellow-100",
    borderColor: "border-amber-300",
    textColor: "text-amber-700",
    imageUrl: "https://media.base44.com/images/public/6a3f271e41dc4ee0d0d5abdf/b94af0be0_generated_image.png",
    description: "Penyu kuno yang menyimpan memori semua zaman. Setiap fakta sejarah menguatkan cengkerangnya!",
    stages: buildStages("Shelldon", "sejarah", "runtuhan kuil kuno", "Cengkerang kuat"),
  },
  {
    id: "atlas",
    name: "Skyler",
    title: "Penjaga Bumi Ajaib",
    subject: "Geografi",
    subjectIcon: "🌍",
    emoji: "🦅",
    bgGradient: "from-blue-100 to-cyan-100",
    borderColor: "border-blue-300",
    textColor: "text-blue-700",
    imageUrl: "https://media.base44.com/images/public/6a3f271e41dc4ee0d0d5abdf/0d9224b7e_generated_image.png",
    description: "Helang yang suka meneroka. Setiap tempat baharu di dunia mengembangkan sayapnya lebih luas!",
    stages: buildStages("Skyler", "geografi", "sarang gunung tinggi", "Sayap lebar"),
  },
  {
    id: "sastera",
    name: "Rimau",
    title: "Penjaga Bahasa Ajaib",
    subject: "Bahasa Melayu",
    subjectIcon: "🇲🇾",
    emoji: "🐯",
    bgGradient: "from-violet-100 to-purple-100",
    borderColor: "border-violet-300",
    textColor: "text-violet-700",
    imageUrl: "https://media.base44.com/images/public/6a3f271e41dc4ee0d0d5abdf/1a4f2c870_generated_image.png",
    description: "Harimau bangsawan yang menjaga bahasa Melayu. Setiap pantun dan sajak menguatkan roar-nya!",
    stages: buildStages("Rimau", "bahasa Melayu", "gua sastera kuno", "Belang gagah"),
  },
];

// Shop Items — accessories students can buy with Syiling Emas and equip
export const AVATAR_ITEMS = [
  { id: "hat_grad", slot: "hat", name: "Topi Graduasi", emoji: "🎓", price: 50, description: "Untuk makhluk yang bijak!" },
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

// === Backward Compatibility — default to first creature (Mat) ===
export const AVATAR_STAGES = CREATURES[0].stages;
export const getAvatarStage = (xp = 0) => getCreatureStage(CREATURES[0].id, xp);
export const getStageProgress = (xp = 0) => getCreatureStageProgress(CREATURES[0].id, xp);
export const getNextStage = (xp = 0) => getCreatureStageProgress(CREATURES[0].id, xp).nextStage;

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