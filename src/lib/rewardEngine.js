// src/lib/rewardEngine.js
// Anti-farming reward engine: calculates fair XP & Coins based on learning progress.
// First completion = highest rewards; repeat attempts = diminishing returns.
// XP rewards learning effort; Coins reward achievement & milestones.
import { base44 } from "@/api/base44Client";
import { awardCoinsAndXP } from "@/lib/rewardSystem";

// ============================================================
// DEFAULT REWARD RULES (fallback when no admin-configured rules exist)
// ============================================================
const DEFAULT_RULES = {
  lesson_complete: {
    base_xp: 10,
    base_coins: 0,
    first_completion_multiplier: 1.5,
    first_completion_coins: 5,
    diminishing_tiers: [1.0, 0.5, 0.25, 0.1, 0.05],
    mastery_threshold: 80,
    mastery_coin_bonus: 0,
    improvement_bonus_rate: 0,
    daily_xp_cap: 350,
  },
  quiz_practice: {
    base_xp: 35,
    base_coins: 0,
    first_completion_multiplier: 1.5,
    first_completion_coins: 10,
    diminishing_tiers: [1.0, 0.5, 0.25, 0.1, 0.05],
    mastery_threshold: 80,
    mastery_coin_bonus: 20,
    improvement_bonus_rate: 2,
    daily_xp_cap: 350,
  },
  quiz_mastery: {
    base_xp: 70,
    base_coins: 10,
    first_completion_multiplier: 2.0,
    first_completion_coins: 20,
    diminishing_tiers: [1.0, 0.5, 0.25, 0.1, 0.05],
    mastery_threshold: 80,
    mastery_coin_bonus: 35,
    improvement_bonus_rate: 3,
    daily_xp_cap: 350,
  },
};

// Streak milestone coin bonuses (awarded once per milestone)
const STREAK_MILESTONES = [
  { days: 3, coins: 20 },
  { days: 7, coins: 50 },
  { days: 14, coins: 100 },
  { days: 30, coins: 200 },
];

// ============================================================
// HELPER FUNCTIONS
// ============================================================

const safeJsonParse = (str, fallback) => {
  if (!str) return fallback;
  if (typeof str !== "string") return str;
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
};

let cachedRules = null;

async function loadRules() {
  if (cachedRules) return cachedRules;
  try {
    const rules = await base44.entities.RewardRule.filter({ is_active: true });
    const adminRules = {};
    if (Array.isArray(rules)) {
      rules.forEach((r) => {
        if (r.activity_type) {
          adminRules[r.activity_type] = {
            base_xp: r.base_xp ?? DEFAULT_RULES[r.activity_type]?.base_xp ?? 10,
            base_coins: r.base_coins ?? 0,
            first_completion_multiplier: r.first_completion_multiplier ?? 1.5,
            first_completion_coins: r.first_completion_coins ?? 0,
            diminishing_tiers: safeJsonParse(r.diminishing_tiers, [1.0, 0.7, 0.5, 0.3, 0.15]),
            mastery_threshold: r.mastery_threshold ?? 80,
            mastery_coin_bonus: r.mastery_coin_bonus ?? 0,
            improvement_bonus_rate: r.improvement_bonus_rate ?? 0,
            daily_xp_cap: r.daily_xp_cap ?? 500,
          };
        }
      });
    }
    cachedRules = { ...DEFAULT_RULES, ...adminRules };
  } catch (e) {
    cachedRules = DEFAULT_RULES;
  }
  return cachedRules;
}

export function clearRuleCache() {
  cachedRules = null;
}

async function getCompletionCount(studentId, activityType, referenceId) {
  if (!referenceId) return 0;
  try {
    const logs = await base44.entities.ActivityLog.filter({
      student_id: studentId,
      activity_type: activityType,
      reference_id: referenceId,
    });
    return Array.isArray(logs) ? logs.length : 0;
  } catch {
    return 0;
  }
}

async function getPreviousBestScore(studentId, referenceId) {
  if (!referenceId) return null;
  try {
    const logs = await base44.entities.ActivityLog.filter({
      student_id: studentId,
      reference_id: referenceId,
    });
    if (!Array.isArray(logs) || logs.length === 0) return null;
    const scores = logs.filter((l) => l.score > 0).map((l) => l.score);
    if (scores.length === 0) return null;
    return Math.max(...scores);
  } catch {
    return null;
  }
}

async function getDailyXPRecord(studentId) {
  const today = new Date().toISOString().split("T")[0];
  try {
    const records = await base44.entities.DailyXPTracker.filter({
      student_id: studentId,
      date: today,
    });
    return Array.isArray(records) && records.length > 0 ? records[0] : null;
  } catch {
    return null;
  }
}

async function updateDailyXP(studentId, xpToAdd, dailyCap) {
  if (xpToAdd <= 0) return;
  const today = new Date().toISOString().split("T")[0];
  const cap = dailyCap || 500;
  try {
    const existing = await getDailyXPRecord(studentId);
    if (existing) {
      const newXp = (existing.xp_earned || 0) + xpToAdd;
      await base44.entities.DailyXPTracker.update(existing.id, {
        xp_earned: newXp,
        is_capped: newXp >= cap,
      });
    } else {
      await base44.entities.DailyXPTracker.create({
        student_id: studentId,
        date: today,
        xp_earned: xpToAdd,
        xp_cap: cap,
        is_capped: xpToAdd >= cap,
      });
    }
  } catch (e) {
    console.error("Failed to update daily XP:", e);
  }
}

async function logActivity(studentId, data) {
  try {
    await base44.entities.ActivityLog.create({
      student_id: studentId,
      activity_type: data.activityType,
      reference_id: data.referenceId || "",
      reference_name: data.referenceName || "",
      subject_name: data.subjectName || "",
      score: data.score || 0,
      xp_earned: data.xp || 0,
      coins_earned: data.coins || 0,
      reward_tier: data.rewardTier || 1,
      is_first_completion: data.isFirstCompletion || false,
      completion_number: data.completionNumber || 1,
      flagged: data.isFlagged || false,
      flag_reason: data.flagReason || "",
    });
  } catch (e) {
    console.error("Failed to log activity:", e);
  }
}

async function checkStreakMilestone(studentId) {
  try {
    const progresses = await base44.entities.Progress.filter({ student_id: studentId });
    const progress = Array.isArray(progresses) ? progresses[0] : progresses;
    const streak = progress?.streak_days || 0;

    const milestone = STREAK_MILESTONES.find((m) => m.days === streak);
    if (!milestone) return null;

    // Check if already awarded
    const existing = await base44.entities.ActivityLog.filter({
      student_id: studentId,
      activity_type: "streak_milestone",
      reference_id: `streak_${milestone.days}`,
    });
    if (existing && Array.isArray(existing) && existing.length > 0) return null;

    // Award bonus coins
    await awardCoinsAndXP(studentId, {
      coins: milestone.coins,
      xp: 0,
      reason: `Bonus Streak: ${milestone.days} hari berturut-turut! 🔥`,
    });
    await base44.entities.ActivityLog.create({
      student_id: studentId,
      activity_type: "streak_milestone",
      reference_id: `streak_${milestone.days}`,
      reference_name: `${milestone.days} Day Streak`,
      xp_earned: 0,
      coins_earned: milestone.coins,
      reward_tier: 1,
      is_first_completion: true,
      completion_number: 1,
      flagged: false,
    });
    return milestone;
  } catch (e) {
    console.error("Streak milestone check failed:", e);
    return null;
  }
}

// ============================================================
// CORE REWARD CALCULATION
// ============================================================

export async function calculateReward(studentId, { activityType, referenceId, score = null }) {
  const rules = await loadRules();
  const rule = rules[activityType] || DEFAULT_RULES.lesson_complete;

  // 1. Completion count from ActivityLog
  const completionCount = await getCompletionCount(studentId, activityType, referenceId);
  const completionNumber = completionCount + 1;
  const isFirstCompletion = completionCount === 0;

  // 2. Diminishing returns tier
  const tiers = rule.diminishing_tiers || [1.0, 0.7, 0.5, 0.3, 0.15];
  const tierIndex = Math.min(completionCount, tiers.length - 1);
  const tierMultiplier = tiers[tierIndex];

  // 3. XP calculation (rewards learning effort)
  let xp = isFirstCompletion
    ? Math.round(rule.base_xp * rule.first_completion_multiplier)
    : Math.round(rule.base_xp * tierMultiplier);

  // 4. Improvement bonus (rewards score improvement)
  let improvementBonus = 0;
  let previousBestScore = null;
  if (score !== null && rule.improvement_bonus_rate > 0) {
    previousBestScore = await getPreviousBestScore(studentId, referenceId);
    if (previousBestScore !== null && score > previousBestScore) {
      improvementBonus = Math.round((score - previousBestScore) * rule.improvement_bonus_rate);
      xp += improvementBonus;
    }
  }

  // 5. Coins calculation (rewards achievement & milestones)
  let coins = 0;
  if (isFirstCompletion) {
    coins += (rule.first_completion_coins || 0) + (rule.base_coins || 0);
  }

  // Mastery bonus
  let masteryAchieved = false;
  if (score !== null && score >= (rule.mastery_threshold || 80)) {
    coins += rule.mastery_coin_bonus || 0;
    masteryAchieved = true;
  }

  // Perfect score bonus (mastery mode only)
  if (score !== null && score === 100 && activityType === "quiz_mastery") {
    coins += 30;
  }

  // Improvement coin bonus (small)
  if (score !== null && previousBestScore !== null && score > previousBestScore) {
    coins += Math.floor((score - previousBestScore) / 10);
  }

  // 6. Daily XP cap
  const dailyCap = rule.daily_xp_cap || 500;
  const dailyRecord = await getDailyXPRecord(studentId);
  const xpEarnedToday = dailyRecord?.xp_earned || 0;
  const remainingXP = Math.max(0, dailyCap - xpEarnedToday);
  const isDailyCapped = xp > remainingXP;
  const finalXP = Math.min(xp, remainingXP);

  // 7. Unusual activity detection
  let isFlagged = false;
  let flagReason = null;
  if (completionNumber >= 5) {
    isFlagged = true;
    flagReason = `Repeated completion (${completionNumber}x) — diminishing returns active`;
  }

  return {
    xp: finalXP,
    coins,
    rawXP: xp,
    rewardTier: tierIndex + 1,
    completionNumber,
    isFirstCompletion,
    improvementBonus,
    masteryAchieved,
    previousBestScore,
    isDailyCapped,
    dailyXPCap: dailyCap,
    dailyXPEarned: xpEarnedToday,
    dailyXPRemaining: remainingXP - finalXP,
    isFlagged,
    flagReason,
  };
}

// ============================================================
// PROCESS REWARD — full pipeline: calculate → log → award → streaks
// ============================================================

export async function processReward(
  studentId,
  { activityType, referenceId, referenceName = "", subjectName = "", score = null, reason = null }
) {
  if (!studentId) return null;

  // 1. Calculate fair reward
  const reward = await calculateReward(studentId, { activityType, referenceId, score });

  // 2. Log activity to ActivityLog
  await logActivity(studentId, {
    activityType,
    referenceId,
    referenceName,
    subjectName,
    score,
    xp: reward.xp,
    coins: reward.coins,
    rewardTier: reward.rewardTier,
    completionNumber: reward.completionNumber,
    isFirstCompletion: reward.isFirstCompletion,
    isFlagged: reward.isFlagged,
    flagReason: reward.flagReason,
  });

  // 3. Update daily XP tracker
  const rules = await loadRules();
  const rule = rules[activityType] || DEFAULT_RULES.lesson_complete;
  await updateDailyXP(studentId, reward.xp, rule.daily_xp_cap);

  // 4. Award coins & XP via existing system
  const awardReason = reason || `${activityType}: ${referenceName || referenceId || "Activity"}`;
  await awardCoinsAndXP(studentId, {
    coins: reward.coins,
    xp: reward.xp,
    reason: awardReason,
    referenceId,
  });

  // 5. Check streak milestones (bonus coins)
  const streakBonus = await checkStreakMilestone(studentId);

  return { ...reward, streakBonus };
}