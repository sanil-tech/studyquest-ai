// src/lib/gameEngine.js
// Educational game engine: recommends games, processes rewards, adapts difficulty.
// AI is NOT used for game interactions — stored templates only.
// AI is used only for: recommending game types (cached) and analyzing mistakes (on mastery).
import { base44 } from "@/api/base44Client";
import { awardCoinsAndXP } from "@/lib/rewardSystem";
import { getActiveStudentId } from "@/lib/rewardSystem";

// ============================================================
// GAME TYPE RECOMMENDATIONS BY SUBJECT
// ============================================================
const GAME_TYPE_BY_SUBJECT = {
  mathematics: ["sorting", "matching", "time_challenge", "sequence"],
  sains: ["matching", "sorting", "memory"],
  science: ["matching", "sorting", "memory"],
  "bahasa melayu": ["word_builder", "matching", "memory", "sorting"],
  bahasa: ["word_builder", "matching", "memory", "sorting"],
  english: ["word_builder", "matching", "memory", "sorting"],
  sejarah: ["memory", "matching", "sequence"],
  history: ["memory", "matching", "sequence"],
  seni: ["matching", "memory"],
  ict: ["matching", "sorting"],
};

export function getRecommendedGameTypes(subject) {
  const key = (subject || "").toLowerCase();
  for (const [subj, types] of Object.entries(GAME_TYPE_BY_SUBJECT)) {
    if (key.includes(subj)) return types;
  }
  return ["matching", "memory", "sorting"];
}

// ============================================================
// FALLBACK GAMES (used when no database games exist for a topic)
// These are built-in templates that work for any topic.
// ============================================================
const FALLBACK_GAMES = {
  mathematics: [
    {
      game_name: "Padankan Nombor",
      game_type: "matching",
      skill: "Number recognition",
      difficulty: "easy",
      instructions: "Padankan nombor dengan perkataan yang betul!",
      reward_xp: 20,
      reward_coins: 5,
      game_data: JSON.stringify({
        pairs: [
          { left: "1", right: "Satu" },
          { left: "2", right: "Dua" },
          { left: "3", right: "Tiga" },
          { left: "4", right: "Empat" },
          { left: "5", right: "Lima" },
        ],
      }),
    },
    {
      game_name: "Susun Nombor",
      game_type: "sorting",
      skill: "Odd and even numbers",
      difficulty: "easy",
      instructions: "Susun nombor kepada Nombor Ganjil dan Nombor Genap!",
      reward_xp: 25,
      reward_coins: 5,
      game_data: JSON.stringify({
        categories: ["Ganjil (Odd)", "Genap (Even)"],
        items: [
          { value: "3", category: "Ganjil (Odd)" },
          { value: "6", category: "Genap (Even)" },
          { value: "9", category: "Ganjil (Odd)" },
          { value: "4", category: "Genap (Even)" },
          { value: "7", category: "Ganjil (Odd)" },
          { value: "8", category: "Genap (Even)" },
        ],
      }),
    },
  ],
  sains: [
    {
      game_name: "Benda Hidup vs Benda Bukan Hidup",
      game_type: "sorting",
      skill: "Classification",
      difficulty: "easy",
      instructions: "Susun benda kepada Benda Hidup dan Benda Bukan Hidup!",
      reward_xp: 20,
      reward_coins: 5,
      game_data: JSON.stringify({
        categories: ["Benda Hidup", "Benda Bukan Hidup"],
        items: [
          { value: "🐱 Kucing", category: "Benda Hidup" },
          { value: "🪨 Batu", category: "Benda Bukan Hidup" },
          { value: "🌳 Pokok", category: "Benda Hidup" },
          { value: "🚗 Kereta", category: "Benda Bukan Hidup" },
          { value: "🐟 Ikan", category: "Benda Hidup" },
          { value: "📖 Buku", category: "Benda Bukan Hidup" },
        ],
      }),
    },
    {
      game_name: "Ingatan Haiwan",
      game_type: "memory",
      skill: "Memory",
      difficulty: "easy",
      instructions: "Cari pasangan haiwan yang sama!",
      reward_xp: 25,
      reward_coins: 5,
      game_data: JSON.stringify({
        pairs: [
          { front: "🐱", back: "Kucing" },
          { front: "🐶", back: "Anjing" },
          { front: "🐰", back: "Arnab" },
          { front: "🐟", back: "Ikan" },
        ],
      }),
    },
  ],
  science: [
    {
      game_name: "Benda Hidup vs Benda Bukan Hidup",
      game_type: "sorting",
      skill: "Classification",
      difficulty: "easy",
      instructions: "Susun benda kepada Benda Hidup dan Benda Bukan Hidup!",
      reward_xp: 20,
      reward_coins: 5,
      game_data: JSON.stringify({
        categories: ["Benda Hidup", "Benda Bukan Hidup"],
        items: [
          { value: "🐱 Kucing", category: "Benda Hidup" },
          { value: "🪨 Batu", category: "Benda Bukan Hidup" },
          { value: "🌳 Pokok", category: "Benda Hidup" },
          { value: "🚗 Kereta", category: "Benda Bukan Hidup" },
        ],
      }),
    },
  ],
  "bahasa melayu": [
    {
      game_name: "Bina Perkataan",
      game_type: "word_builder",
      skill: "Syllable recognition",
      difficulty: "easy",
      instructions: "Susun suku kata untuk membina perkataan yang betul!",
      reward_xp: 25,
      reward_coins: 5,
      game_data: JSON.stringify({
        words: [
          { word: "baju", syllables: ["ba", "ju"] },
          { word: "meja", syllables: ["me", "ja"] },
          { word: "susu", syllables: ["su", "su"] },
          { word: "buku", syllables: ["bu", "ku"] },
        ],
      }),
    },
    {
      game_name: "Padankan Haiwan",
      game_type: "matching",
      skill: "Vocabulary",
      difficulty: "easy",
      instructions: "Padankan haiwan dengan nama yang betul!",
      reward_xp: 20,
      reward_coins: 5,
      game_data: JSON.stringify({
        pairs: [
          { left: "🐱", right: "Kucing" },
          { left: "🐶", right: "Anjing" },
          { left: "🐰", right: "Arnab" },
          { left: "🐟", right: "Ikan" },
          { left: "🐦", right: "Burung" },
        ],
      }),
    },
  ],
  bahasa: [
    {
      game_name: "Bina Perkataan",
      game_type: "word_builder",
      skill: "Syllable recognition",
      difficulty: "easy",
      instructions: "Susun suku kata untuk membina perkataan yang betul!",
      reward_xp: 25,
      reward_coins: 5,
      game_data: JSON.stringify({
        words: [
          { word: "baju", syllables: ["ba", "ju"] },
          { word: "meja", syllables: ["me", "ja"] },
          { word: "susu", syllables: ["su", "su"] },
          { word: "buku", syllables: ["bu", "ku"] },
        ],
      }),
    },
  ],
  english: [
    {
      game_name: "Match Animals",
      game_type: "matching",
      skill: "Vocabulary",
      difficulty: "easy",
      instructions: "Match each animal with its name!",
      reward_xp: 20,
      reward_coins: 5,
      game_data: JSON.stringify({
        pairs: [
          { left: "🐱", right: "Cat" },
          { left: "🐶", right: "Dog" },
          { left: "🐰", right: "Rabbit" },
          { left: "🐟", right: "Fish" },
          { left: "🐦", right: "Bird" },
        ],
      }),
    },
    {
      game_name: "Build Words",
      game_type: "word_builder",
      skill: "Spelling",
      difficulty: "easy",
      instructions: "Arrange the letters to build the word!",
      reward_xp: 25,
      reward_coins: 5,
      game_data: JSON.stringify({
        words: [
          { word: "cat", syllables: ["c", "a", "t"] },
          { word: "sun", syllables: ["s", "u", "n"] },
          { word: "dog", syllables: ["d", "o", "g"] },
          { word: "hat", syllables: ["h", "a", "t"] },
        ],
      }),
    },
  ],
};

function getFallbackGames(subject) {
  const key = (subject || "").toLowerCase();
  for (const [subj, games] of Object.entries(FALLBACK_GAMES)) {
    if (key.includes(subj)) return games;
  }
  return FALLBACK_GAMES.mathematics;
}

// ============================================================
// LOAD GAMES FOR A TOPIC
// ============================================================
export async function getGamesForTopic(subject, formLevel, topicId, topicName) {
  try {
    const allGames = await base44.entities.EducationalGame.filter({ is_active: true });
    let dbGames = [];
    if (Array.isArray(allGames)) {
      dbGames = allGames.filter((g) => {
        if (topicId && g.topic_id === topicId) return true;
        if (topicName && g.topic_name && g.topic_name.toLowerCase() === topicName.toLowerCase()) return true;
        return false;
      });
    }
    // If no topic-specific games, use fallback
    if (dbGames.length === 0) {
      const fallbacks = getFallbackGames(subject);
      return fallbacks.map((g, i) => ({
        ...g,
        id: `fallback_${i}`,
        subject,
        form_level: formLevel,
        topic_id: topicId || "",
        topic_name: topicName || "",
        is_active: true,
        is_fallback: true,
      }));
    }
    return dbGames;
  } catch (e) {
    const fallbacks = getFallbackGames(subject);
    return fallbacks.map((g, i) => ({
      ...g,
      id: `fallback_${i}`,
      subject,
      form_level: formLevel,
      topic_id: topicId || "",
      topic_name: topicName || "",
      is_active: true,
      is_fallback: true,
    }));
  }
}

// ============================================================
// ADAPTIVE DIFFICULTY
// ============================================================
export function adaptDifficulty(currentDifficulty, lastScore) {
  if (lastScore === null || lastScore === undefined) return currentDifficulty;
  if (lastScore < 50) {
    if (currentDifficulty === "hard") return "medium";
    if (currentDifficulty === "medium") return "easy";
  }
  if (lastScore >= 80) {
    if (currentDifficulty === "easy") return "medium";
    if (currentDifficulty === "medium") return "hard";
  }
  return currentDifficulty;
}

// ============================================================
// GAME REWARD PROCESSING
// Rules:
// - First completion: High XP + Coins
// - Improvement: Additional XP
// - Mastery (80%+): Coins + Badge
// - Repeated play: Practice only (minimal XP, no coins)
// ============================================================
export async function processGameReward(studentId, game, score) {
  if (!studentId) return null;

  // Check existing progress
  let progress = null;
  try {
    const existing = await base44.entities.GameProgress.filter({
      student_id: studentId,
      game_id: game.id,
    });
    progress = Array.isArray(existing) && existing.length > 0 ? existing[0] : null;
  } catch (e) {}

  const attempts = (progress?.attempts || 0) + 1;
  const isFirstCompletion = !progress;
  const previousBest = progress?.highest_score || 0;
  const improved = score > previousBest;
  const masteryAchieved = score >= 80;

  // Reward calculation
  let xp = 0;
  let coins = 0;
  let rewardType = "practice";

  if (isFirstCompletion) {
    // First completion: full rewards
    xp = game.reward_xp || 20;
    coins = game.reward_coins || 5;
    rewardType = "first_completion";
  } else if (masteryAchieved && improved) {
    // Mastery improvement: bonus XP + coins
    xp = Math.round((game.reward_xp || 20) * 0.6);
    coins = 10;
    rewardType = "mastery_improvement";
  } else if (improved) {
    // Improvement: half XP
    xp = Math.round((game.reward_xp || 20) * 0.5);
    coins = 0;
    rewardType = "improvement";
  } else {
    // Repeated play: practice only
    xp = Math.round((game.reward_xp || 20) * 0.15);
    coins = 0;
    rewardType = "practice";
  }

  // Mastery badge (first time reaching 80%+)
  let badgeEarned = null;
  if (masteryAchieved && progress?.mastery_level !== "mastered") {
    coins += 15;
    badgeEarned = {
      name: `Master ${game.game_name}`,
      icon: "🏆",
      description: `Mencapai skor 80%+ dalam ${game.game_name}`,
    };
    rewardType = "mastery_badge";
  }

  // Award via existing system
  await awardCoinsAndXP(studentId, {
    coins,
    xp,
    reason: `Permainan: ${game.game_name}`,
    referenceId: game.id,
  });

  // Update GameProgress
  const masteryLevel = masteryAchieved ? "mastered" : score >= 50 ? "proficient" : "developing";
  const progressData = {
    student_id: studentId,
    game_id: game.id,
    game_name: game.game_name,
    game_type: game.game_type,
    subject: game.subject || "",
    topic_name: game.topic_name || "",
    attempts,
    highest_score: Math.max(previousBest, score),
    mastery_level: masteryLevel,
    last_played: new Date().toISOString(),
    total_xp_earned: (progress?.total_xp_earned || 0) + xp,
    total_coins_earned: (progress?.total_coins_earned || 0) + coins,
  };

  try {
    if (progress) {
      await base44.entities.GameProgress.update(progress.id, progressData);
    } else {
      await base44.entities.GameProgress.create(progressData);
    }
  } catch (e) {
    console.error("Failed to update game progress:", e);
  }

  // Log to ActivityLog
  try {
    await base44.entities.ActivityLog.create({
      student_id: studentId,
      activity_type: "game_complete",
      reference_id: game.id,
      reference_name: game.game_name,
      subject_name: game.subject || "",
      score,
      xp_earned: xp,
      coins_earned: coins,
      reward_tier: isFirstCompletion ? 1 : improved ? 2 : 4,
      is_first_completion: isFirstCompletion,
      completion_number: attempts,
      flagged: attempts >= 5,
      flag_reason: attempts >= 5 ? "Repeated game play — practice mode" : "",
    });
  } catch (e) {}

  return {
    xp,
    coins,
    isFirstCompletion,
    improved,
    masteryAchieved,
    badgeEarned,
    attempts,
    previousBest,
    rewardType,
  };
}

// ============================================================
// GET STUDENT GAME PROGRESS (for parent dashboard)
// ============================================================
export async function getStudentGameProgress(studentId) {
  try {
    const progress = await base44.entities.GameProgress.filter({ student_id: studentId });
    return Array.isArray(progress) ? progress : [];
  } catch (e) {
    return [];
  }
}

// ============================================================
// GET GAME PROGRESS FOR A SPECIFIC GAME
// ============================================================
export async function getGameProgress(studentId, gameId) {
  try {
    const existing = await base44.entities.GameProgress.filter({
      student_id: studentId,
      game_id: gameId,
    });
    return Array.isArray(existing) && existing.length > 0 ? existing[0] : null;
  } catch (e) {
    return null;
  }
}