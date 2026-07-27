// Achievement badge definitions for StudyQuest
// Each achievement is evaluated against the student's stats to determine if it's earned.

export const ACHIEVEMENT_CATEGORIES = [
  { id: 'all', label: 'Semua', icon: '🏆' },
  { id: 'xp', label: 'XP', icon: '⭐' },
  { id: 'streak', label: 'Streak', icon: '🔥' },
  { id: 'quiz', label: 'Kuiz', icon: '📝' },
  { id: 'level', label: 'Tahap', icon: '🎖️' },
  { id: 'study', label: 'Masa Belajar', icon: '⏰' },
  { id: 'coins', label: 'Syiling', icon: '💰' },
];

export const ACHIEVEMENTS = [
  // XP milestones
  { id: 'xp_100', category: 'xp', name: 'Langkah Pertama', description: 'Kumpul 100 XP', icon: '🌱', requirement: { type: 'total_xp', value: 100 } },
  { id: 'xp_500', category: 'xp', name: 'Penjelajah Aktif', description: 'Kumpul 500 XP', icon: '⭐', requirement: { type: 'total_xp', value: 500 } },
  { id: 'xp_1000', category: 'xp', name: 'Bintang Meningkat', description: 'Kumpul 1,000 XP', icon: '🌟', requirement: { type: 'total_xp', value: 1000 } },
  { id: 'xp_2500', category: 'xp', name: 'Cahaya Gemilang', description: 'Kumpul 2,500 XP', icon: '💫', requirement: { type: 'total_xp', value: 2500 } },
  { id: 'xp_5000', category: 'xp', name: 'Legenda XP', description: 'Kumpul 5,000 XP', icon: '👑', requirement: { type: 'total_xp', value: 5000 } },

  // Streak milestones
  { id: 'streak_3', category: 'streak', name: 'Gigih 3 Hari', description: 'Belajar 3 hari berturut-turut', icon: '🔥', requirement: { type: 'streak_days', value: 3 } },
  { id: 'streak_7', category: 'streak', name: 'Minggu Tekun', description: 'Belajar 7 hari berturut-turut', icon: '🔥', requirement: { type: 'streak_days', value: 7 } },
  { id: 'streak_14', category: 'streak', name: 'Dua Minggu Setia', description: 'Belajar 14 hari berturut-turut', icon: '⚡', requirement: { type: 'streak_days', value: 14 } },
  { id: 'streak_30', category: 'streak', name: 'Juara Bulanan', description: 'Belajar 30 hari berturut-turut', icon: '🏆', requirement: { type: 'streak_days', value: 30 } },

  // Quiz milestones
  { id: 'quiz_5', category: 'quiz', name: 'Pencuba Pertama', description: 'Selesaikan 5 kuiz', icon: '📝', requirement: { type: 'quiz_count', value: 5 } },
  { id: 'quiz_25', category: 'quiz', name: 'Pencinta Kuiz', description: 'Selesaikan 25 kuiz', icon: '📚', requirement: { type: 'quiz_count', value: 25 } },
  { id: 'quiz_50', category: 'quiz', name: 'Master Kuiz', description: 'Selesaikan 50 kuiz', icon: '🎓', requirement: { type: 'quiz_count', value: 50 } },

  // Perfect scores
  { id: 'perfect_1', category: 'quiz', name: 'Sempurna!', description: 'Skor 100% dalam satu kuiz', icon: '💯', requirement: { type: 'perfect_scores', value: 1 } },
  { id: 'perfect_5', category: 'quiz', name: 'Sering Sempurna', description: 'Skor 100% dalam 5 kuiz', icon: '🌟', requirement: { type: 'perfect_scores', value: 5 } },

  // Level milestones
  { id: 'level_5', category: 'level', name: 'Tahap 5', description: 'Capai tahap 5', icon: '🎖️', requirement: { type: 'level', value: 5 } },
  { id: 'level_10', category: 'level', name: 'Tahap 10', description: 'Capai tahap 10', icon: '🏅', requirement: { type: 'level', value: 10 } },

  // Study time
  { id: 'time_60', category: 'study', name: 'Sejam Belajar', description: 'Belajar selama 60 minit', icon: '⏰', requirement: { type: 'total_study_time', value: 60 } },
  { id: 'time_300', category: 'study', name: 'Pelajar Setia', description: 'Belajar selama 5 jam', icon: '🕐', requirement: { type: 'total_study_time', value: 300 } },

  // Coins
  { id: 'coins_50', category: 'coins', name: 'Pengumpul Syiling', description: 'Kumpul 50 syiling emas', icon: '💰', requirement: { type: 'coins', value: 50 } },
  { id: 'coins_200', category: 'coins', name: 'Kaya Syiling', description: 'Kumpul 200 syiling emas', icon: '🤑', requirement: { type: 'coins', value: 200 } },
];

// Evaluate all achievements against the student's stats
export function evaluateAchievements(stats) {
  return ACHIEVEMENTS.map(achievement => {
    const current = stats[achievement.requirement.type] || 0;
    const target = achievement.requirement.value;
    const earned = current >= target;
    const progress = Math.min(Math.round((current / target) * 100), 100);
    return { ...achievement, earned, current, target, progress };
  });
}

// Build stats object from student data
export function buildStatsFromData(data) {
  const progress = data?.progress || {};
  const wallet = data?.wallet || {};
  const quizAttempts = data?.quizAttempts || [];

  return {
    total_xp: progress.total_xp || 0,
    level: progress.level || 1,
    streak_days: progress.streak_days || 0,
    total_study_time: progress.total_study_time || 0,
    quiz_count: quizAttempts.length,
    perfect_scores: quizAttempts.filter(a => a.score === 100).length,
    coins: wallet.balance || 0,
  };
}