// Achievement badge definitions for StudyQuest
// Expanded system covering the full 6-to-17 year learning journey.
// Each achievement has a tier for visual rarity:
//   bronze → silver → gold → platinum → diamond

export const ACHIEVEMENT_TIERS = {
  bronze:   { label: 'Gangsa',    color: 'text-amber-700',    bg: 'from-amber-100 to-orange-100',    border: 'border-amber-300',    ring: 'ring-amber-300' },
  silver:   { label: 'Perak',     color: 'text-slate-600',     bg: 'from-slate-100 to-slate-200',    border: 'border-slate-400',    ring: 'ring-slate-300' },
  gold:     { label: 'Emas',      color: 'text-yellow-700',    bg: 'from-yellow-100 to-amber-200',   border: 'border-yellow-400',   ring: 'ring-yellow-300' },
  platinum: { label: 'Platinum',  color: 'text-cyan-700',      bg: 'from-cyan-100 to-sky-200',       border: 'border-cyan-400',     ring: 'ring-cyan-300' },
  diamond:  { label: 'Berlian',   color: 'text-fuchsia-700',   bg: 'from-fuchsia-100 to-purple-200',  border: 'border-fuchsia-400',  ring: 'ring-fuchsia-300' },
};

export const ACHIEVEMENT_CATEGORIES = [
  { id: 'all',       label: 'Semua',          icon: '🏆' },
  { id: 'xp',        label: 'XP',             icon: '⭐' },
  { id: 'streak',    label: 'Streak',        icon: '🔥' },
  { id: 'quiz',      label: 'Kuiz',          icon: '📝' },
  { id: 'level',     label: 'Tahap',          icon: '🎖️' },
  { id: 'study',     label: 'Masa Belajar',  icon: '⏰' },
  { id: 'coins',     label: 'Syiling',       icon: '💰' },
  { id: 'lessons',   label: 'Pelajaran',     icon: '📖' },
  { id: 'subjects',  label: 'Mata Pelajaran',icon: '📚' },
  { id: 'mastery',   label: 'Penguasaan',    icon: '🎯' },
  { id: 'games',     label: 'Permainan',     icon: '🎮' },
  { id: 'social',    label: 'Sosial',        icon: '🤝' },
  { id: 'dedication',label: 'Komitmen',      icon: '📅' },
];

export const ACHIEVEMENTS = [
  // ═══════════════ XP MILESTONES (10) ═══════════════
  { id: 'xp_100',      category: 'xp', tier: 'bronze',   name: 'Langkah Pertama',   description: 'Kumpul 100 XP',          icon: '🌱',  requirement: { type: 'total_xp', value: 100 } },
  { id: 'xp_500',      category: 'xp', tier: 'bronze',   name: 'Penjelajah Aktif',  description: 'Kumpul 500 XP',          icon: '⭐',  requirement: { type: 'total_xp', value: 500 } },
  { id: 'xp_1000',     category: 'xp', tier: 'silver',   name: 'Bintang Meningkat', description: 'Kumpul 1,000 XP',        icon: '🌟',  requirement: { type: 'total_xp', value: 1000 } },
  { id: 'xp_2500',     category: 'xp', tier: 'silver',   name: 'Cahaya Gemilang',   description: 'Kumpul 2,500 XP',         icon: '💫',  requirement: { type: 'total_xp', value: 2500 } },
  { id: 'xp_5000',     category: 'xp', tier: 'gold',     name: 'Legenda XP',       description: 'Kumpul 5,000 XP',          icon: '👑',  requirement: { type: 'total_xp', value: 5000 } },
  { id: 'xp_10000',    category: 'xp', tier: 'gold',     name: 'Pemburu Bintang',   description: 'Kumpul 10,000 XP',        icon: '🌠',  requirement: { type: 'total_xp', value: 10000 } },
  { id: 'xp_25000',    category: 'xp', tier: 'platinum', name: 'Galaksi Ilmu',     description: 'Kumpul 25,000 XP',       icon: '🌌',  requirement: { type: 'total_xp', value: 25000 } },
  { id: 'xp_50000',    category: 'xp', tier: 'platinum', name: 'Cakra Dewa',       description: 'Kumpul 50,000 XP',        icon: '⚡',  requirement: { type: 'total_xp', value: 50000 } },
  { id: 'xp_100000',   category: 'xp', tier: 'diamond',  name: 'Maharaja Ilmu',    description: 'Kumpul 100,000 XP',       icon: '🏯',  requirement: { type: 'total_xp', value: 100000 } },
  { id: 'xp_250000',   category: 'xp', tier: 'diamond',  name: 'Tiang Dunia',      description: 'Kumpul 250,000 XP',      icon: '🗿',  requirement: { type: 'total_xp', value: 250000 } },

  // ═══════════════ STREAK MILESTONES (8) ═══════════════
  { id: 'streak_3',    category: 'streak', tier: 'bronze',   name: 'Gigih 3 Hari',      description: 'Belajar 3 hari berturut-turut',  icon: '🔥',  requirement: { type: 'streak_days', value: 3 } },
  { id: 'streak_7',    category: 'streak', tier: 'bronze',   name: 'Minggu Tekun',      description: 'Belajar 7 hari berturut-turut',  icon: '🔥',  requirement: { type: 'streak_days', value: 7 } },
  { id: 'streak_14',   category: 'streak', tier: 'silver',   name: 'Dua Minggu Setia',  description: 'Belajar 14 hari berturut-turut', icon: '⚡',  requirement: { type: 'streak_days', value: 14 } },
  { id: 'streak_30',   category: 'streak', tier: 'silver',   name: 'Juara Bulanan',     description: 'Belajar 30 hari berturut-turut', icon: '🏆',  requirement: { type: 'streak_days', value: 30 } },
  { id: 'streak_60',   category: 'streak', tier: 'gold',     name: 'Dua Bulan Cahaya',  description: 'Belajar 60 hari berturut-turut', icon: '🌟',  requirement: { type: 'streak_days', value: 60 } },
  { id: 'streak_100',  category: 'streak', tier: 'gold',     name: 'Seniwira Senyap',   description: 'Belajar 100 hari berturut-turut',icon: '🛡️',  requirement: { type: 'streak_days', value: 100 } },
  { id: 'streak_180',  category: 'streak', tier: 'platinum', name: 'Separuh Tahun',     description: 'Belajar 180 hari berturut-turut',icon: '💎',  requirement: { type: 'streak_days', value: 180 } },
  { id: 'streak_365',  category: 'streak', tier: 'diamond',  name: 'Setahun Penuh',     description: 'Belajar 365 hari berturut-turut',icon: '🏯',  requirement: { type: 'streak_days', value: 365 } },

  // ═══════════════ QUIZ MILESTONES (8) ═══════════════
  { id: 'quiz_5',      category: 'quiz', tier: 'bronze',   name: 'Pencuba Pertama',    description: 'Selesaikan 5 kuiz',      icon: '📝',  requirement: { type: 'quiz_count', value: 5 } },
  { id: 'quiz_10',     category: 'quiz', tier: 'bronze',   name: 'Peminat Kuiz',       description: 'Selesaikan 10 kuiz',     icon: '✏️',  requirement: { type: 'quiz_count', value: 10 } },
  { id: 'quiz_25',     category: 'quiz', tier: 'silver',   name: 'Pencinta Kuiz',      description: 'Selesaikan 25 kuiz',     icon: '📚',  requirement: { type: 'quiz_count', value: 25 } },
  { id: 'quiz_50',     category: 'quiz', tier: 'silver',   name: 'Master Kuiz',        description: 'Selesaikan 50 kuiz',     icon: '🎓',  requirement: { type: 'quiz_count', value: 50 } },
  { id: 'quiz_100',    category: 'quiz', tier: 'gold',     name: 'Pakar Kuiz',         description: 'Selesaikan 100 kuiz',    icon: '🧠',  requirement: { type: 'quiz_count', value: 100 } },
  { id: 'quiz_200',    category: 'quiz', tier: 'platinum', name: 'Veteran Kuiz',       description: 'Selesaikan 200 kuiz',    icon: '⚔️',  requirement: { type: 'quiz_count', value: 200 } },
  { id: 'quiz_350',    category: 'quiz', tier: 'platinum', name: 'Tentera Kuiz',       description: 'Selesaikan 350 kuiz',    icon: '🛡️',  requirement: { type: 'quiz_count', value: 350 } },
  { id: 'quiz_500',    category: 'quiz', tier: 'diamond',  name: 'Lagenda Kuiz',       description: 'Selesaikan 500 kuiz',    icon: '🗿',  requirement: { type: 'quiz_count', value: 500 } },

  // ═══════════════ PERFECT SCORES (6) ═══════════════
  { id: 'perfect_1',   category: 'quiz', tier: 'bronze',   name: 'Sempurna!',          description: 'Skor 100% dalam 1 kuiz',  icon: '💯',  requirement: { type: 'perfect_scores', value: 1 } },
  { id: 'perfect_5',   category: 'quiz', tier: 'silver',   name: 'Sering Sempurna',    description: 'Skor 100% dalam 5 kuiz', icon: '🌟',  requirement: { type: 'perfect_scores', value: 5 } },
  { id: 'perfect_10',  category: 'quiz', tier: 'gold',     name: 'Ketepatan Emas',     description: 'Skor 100% dalam 10 kuiz',icon: '🎯',  requirement: { type: 'perfect_scores', value: 10 } },
  { id: 'perfect_25',  category: 'quiz', tier: 'platinum', name: 'Dewa Ketepatan',     description: 'Skor 100% dalam 25 kuiz',icon: '🏹',  requirement: { type: 'perfect_scores', value: 25 } },
  { id: 'perfect_50',  category: 'quiz', tier: 'diamond',  name: 'Ketepatan Mutlak',   description: 'Skor 100% dalam 50 kuiz',icon: '💎',  requirement: { type: 'perfect_scores', value: 50 } },
  { id: 'perfect_100', category: 'quiz', tier: 'diamond',  name: 'Sempurna Selamanya',description: 'Skor 100% dalam 100 kuiz',icon: '👑',  requirement: { type: 'perfect_scores', value: 100 } },

  // ═══════════════ LEVEL MILESTONES (8) ═══════════════
  { id: 'level_5',     category: 'level', tier: 'bronze',   name: 'Tahap 5',     description: 'Capai tahap 5',     icon: '🎖️',  requirement: { type: 'level', value: 5 } },
  { id: 'level_10',    category: 'level', tier: 'silver',   name: 'Tahap 10',    description: 'Capai tahap 10',    icon: '🏅',  requirement: { type: 'level', value: 10 } },
  { id: 'level_20',    category: 'level', tier: 'silver',   name: 'Tahap 20',    description: 'Capai tahap 20',    icon: '🥈',  requirement: { type: 'level', value: 20 } },
  { id: 'level_30',    category: 'level', tier: 'gold',     name: 'Tahap 30',    description: 'Capai tahap 30',    icon: '🥇',  requirement: { type: 'level', value: 30 } },
  { id: 'level_50',    category: 'level', tier: 'gold',     name: 'Tahap 50',    description: 'Capai tahap 50',    icon: '🌟',  requirement: { type: 'level', value: 50 } },
  { id: 'level_75',    category: 'level', tier: 'platinum', name: 'Tahap 75',    description: 'Capai tahap 75',    icon: '💎',  requirement: { type: 'level', value: 75 } },
  { id: 'level_100',   category: 'level', tier: 'platinum', name: 'Tahap 100',   description: 'Capai tahap 100',   icon: '🏆',  requirement: { type: 'level', value: 100 } },
  { id: 'level_150',   category: 'level', tier: 'diamond',  name: 'Tahap 150',   description: 'Capai tahap 150',   icon: '👑',  requirement: { type: 'level', value: 150 } },

  // ═══════════════ STUDY TIME (8) ═══════════════
  { id: 'time_30',     category: 'study', tier: 'bronze',   name: 'Setengah Jam',  description: 'Belajar 30 minit',       icon: '⏰',  requirement: { type: 'total_study_time', value: 30 } },
  { id: 'time_60',     category: 'study', tier: 'bronze',   name: 'Sejam Belajar', description: 'Belajar 1 jam',          icon: '🕐',  requirement: { type: 'total_study_time', value: 60 } },
  { id: 'time_300',    category: 'study', tier: 'silver',   name: 'Pelajar Setia',description: 'Belajar 5 jam',          icon: '🕰️',  requirement: { type: 'total_study_time', value: 300 } },
  { id: 'time_600',    category: 'study', tier: 'silver',   name: 'Sepuluh Jam',   description: 'Belajar 10 jam',         icon: '⏳',  requirement: { type: 'total_study_time', value: 600 } },
  { id: 'time_1500',   category: 'study', tier: 'gold',     name: 'Pencinta Ilmu', description: 'Belajar 25 jam',        icon: '📚',  requirement: { type: 'total_study_time', value: 1500 } },
  { id: 'time_3000',   category: 'study', tier: 'gold',     name: 'Pelajar Sejati',description: 'Belajar 50 jam',         icon: '💡',  requirement: { type: 'total_study_time', value: 3000 } },
  { id: 'time_6000',   category: 'study', tier: 'platinum', name: 'Seratus Jam',   description: 'Belajar 100 jam',        icon: '🔥',  requirement: { type: 'total_study_time', value: 6000 } },
  { id: 'time_15000',  category: 'study', tier: 'diamond',  name: 'Cahaya Ilmu',   description: 'Belajar 250 jam',       icon: '☀️',  requirement: { type: 'total_study_time', value: 15000 } },

  // ═══════════════ COINS (7) ═══════════════
  { id: 'coins_50',    category: 'coins', tier: 'bronze',   name: 'Pengumpul Syiling', description: 'Kumpul 50 syiling',   icon: '💰',  requirement: { type: 'coins', value: 50 } },
  { id: 'coins_200',   category: 'coins', tier: 'silver',   name: 'Kaya Syiling',      description: 'Kumpul 200 syiling',  icon: '🤑',  requirement: { type: 'coins', value: 200 } },
  { id: 'coins_500',   category: 'coins', tier: 'silver',   name: 'Tuan Syiling',      description: 'Kumpul 500 syiling',  icon: '💎',  requirement: { type: 'coins', value: 500 } },
  { id: 'coins_1000',  category: 'coins', tier: 'gold',     name: 'Raja Harta',        description: 'Kumpul 1,000 syiling',icon: '👑',  requirement: { type: 'coins', value: 1000 } },
  { id: 'coins_2500',  category: 'coins', tier: 'gold',     name: 'Bank Emas',         description: 'Kumpul 2,500 syiling',icon: '🏦',  requirement: { type: 'coins', value: 2500 } },
  { id: 'coins_5000',  category: 'coins', tier: 'platinum', name: 'Perbendaharaan',     description: 'Kumpul 5,000 syiling',icon: '🏯',  requirement: { type: 'coins', value: 5000 } },
  { id: 'coins_10000', category: 'coins', tier: 'diamond',  name: 'Naga Harta',         description: 'Kumpul 10,000 syiling',icon: '🐉',  requirement: { type: 'coins', value: 10000 } },

  // ═══════════════ LESSONS COMPLETED (6) ═══════════════
  { id: 'lesson_1',    category: 'lessons', tier: 'bronze',   name: 'Pelajaran Pertama',  description: 'Selesaikan 1 pelajaran',  icon: '📖',  requirement: { type: 'lessons_completed', value: 1 } },
  { id: 'lesson_10',   category: 'lessons', tier: 'bronze',   name: 'Pembaca Awal',       description: 'Selesaikan 10 pelajaran', icon: '📗',  requirement: { type: 'lessons_completed', value: 10 } },
  { id: 'lesson_25',   category: 'lessons', tier: 'silver',   name: 'Peminat Buku',       description: 'Selesaikan 25 pelajaran', icon: '📚',  requirement: { type: 'lessons_completed', value: 25 } },
  { id: 'lesson_50',   category: 'lessons', tier: 'silver',   name: 'Pelajar Rajin',      description: 'Selesaikan 50 pelajaran', icon: '✏️',  requirement: { type: 'lessons_completed', value: 50 } },
  { id: 'lesson_100',  category: 'lessons', tier: 'gold',     name: 'Seratus Pelajaran',  description: 'Selesaikan 100 pelajaran',icon: '🎓',  requirement: { type: 'lessons_completed', value: 100 } },
  { id: 'lesson_250',  category: 'lessons', tier: 'platinum', name: 'Perpustakaan Hidup', description: 'Selesaikan 250 pelajaran',icon: '🏛️',  requirement: { type: 'lessons_completed', value: 250 } },

  // ═══════════════ SUBJECTS EXPLORED (5) ═══════════════
  { id: 'subj_1',      category: 'subjects', tier: 'bronze',   name: 'Peneroka Pertama', description: 'Cuba 1 mata pelajaran',  icon: '🔍',  requirement: { type: 'subjects_explored', value: 1 } },
  { id: 'subj_3',      category: 'subjects', tier: 'silver',   name: 'Pencari Ilmu',     description: 'Cuba 3 mata pelajaran', icon: '🧭',  requirement: { type: 'subjects_explored', value: 3 } },
  { id: 'subj_5',      category: 'subjects', tier: 'gold',     name: 'Pelajar Pelbagai', description: 'Cuba 5 mata pelajaran', icon: '🌐',  requirement: { type: 'subjects_explored', value: 5 } },
  { id: 'subj_8',      category: 'subjects', tier: 'platinum', name: 'Pakar Serba Boleh',description: 'Cuba 8 mata pelajaran',icon: '🌈',  requirement: { type: 'subjects_explored', value: 8 } },
  { id: 'subj_12',     category: 'subjects', tier: 'diamond',  name: 'Cendekia Sejati',  description: 'Cuba 12 mata pelajaran',icon: '👑',  requirement: { type: 'subjects_explored', value: 12 } },

  // ═══════════════ MASTERY QUIZZES (5) ═══════════════
  { id: 'mastery_1',   category: 'mastery', tier: 'bronze',   name: 'Ujian Pertama',     description: 'Lulus 1 kuiz penguasaan',  icon: '🎯',  requirement: { type: 'mastery_quiz_count', value: 1 } },
  { id: 'mastery_5',   category: 'mastery', tier: 'silver',   name: 'Penguasa Muda',     description: 'Lulus 5 kuiz penguasaan',  icon: '🏹',  requirement: { type: 'mastery_quiz_count', value: 5 } },
  { id: 'mastery_10',  category: 'mastery', tier: 'gold',     name: 'Pakar Penguasaan',  description: 'Lulus 10 kuiz penguasaan', icon: '🎖️',  requirement: { type: 'mastery_quiz_count', value: 10 } },
  { id: 'mastery_25',  category: 'mastery', tier: 'platinum', name: 'Master Sejati',    description: 'Lulus 25 kuiz penguasaan', icon: '💎',  requirement: { type: 'mastery_quiz_count', value: 25 } },
  { id: 'mastery_50',  category: 'mastery', tier: 'diamond',  name: 'Lagenda Penguasaan',description: 'Lulus 50 kuiz penguasaan', icon: '👑',  requirement: { type: 'mastery_quiz_count', value: 50 } },

  // ═══════════════ GAMES PLAYED (5) ═══════════════
  { id: 'game_1',      category: 'games', tier: 'bronze',   name: 'Pemain Baru',      description: 'Main 1 permainan',   icon: '🎮',  requirement: { type: 'games_played', value: 1 } },
  { id: 'game_10',     category: 'games', tier: 'bronze',   name: 'Pemain Aktif',     description: 'Main 10 permainan',  icon: '🕹️',  requirement: { type: 'games_played', value: 10 } },
  { id: 'game_25',     category: 'games', tier: 'silver',   name: 'Pemain Mahir',     description: 'Main 25 permainan',  icon: '🎲',  requirement: { type: 'games_played', value: 25 } },
  { id: 'game_50',     category: 'games', tier: 'gold',     name: 'Master Permainan', description: 'Main 50 permainan',  icon: '🏆',  requirement: { type: 'games_played', value: 50 } },
  { id: 'game_100',    category: 'games', tier: 'platinum', name: 'Lagenda Permainan',description: 'Main 100 permainan', icon: '👑',  requirement: { type: 'games_played', value: 100 } },

  // ═══════════════ SOCIAL / FRIENDS (5) ═══════════════
  { id: 'friend_1',    category: 'social', tier: 'bronze',   name: 'Sahabat Baru',     description: 'Tambah 1 rakan',     icon: '🤝',  requirement: { type: 'friends_count', value: 1 } },
  { id: 'friend_3',    category: 'social', tier: 'silver',   name: 'Popular',          description: 'Tambah 3 rakan',     icon: '👥',  requirement: { type: 'friends_count', value: 3 } },
  { id: 'friend_5',    category: 'social', tier: 'gold',     name: 'Sahabat Setia',    description: 'Tambah 5 rakan',     icon: '💛',  requirement: { type: 'friends_count', value: 5 } },
  { id: 'friend_10',   category: 'social', tier: 'platinum', name: 'Pakar Sosial',      description: 'Tambah 10 rakan',    icon: '🌟',  requirement: { type: 'friends_count', value: 10 } },
  { id: 'friend_25',   category: 'social', tier: 'diamond',  name: 'Ketua Kelab',       description: 'Tambah 25 rakan',    icon: '👑',  requirement: { type: 'friends_count', value: 25 } },

  // ═══════════════ HIGH SCORES (score >= 80) (5) ═══════════════
  { id: 'high_1',      category: 'mastery', tier: 'bronze',   name: 'Skor Tinggi!',      description: 'Skor 80%+ dalam 1 kuiz',  icon: '📈',  requirement: { type: 'high_score_count', value: 1 } },
  { id: 'high_10',     category: 'mastery', tier: 'silver',   name: 'Pencapaian Baik',   description: 'Skor 80%+ dalam 10 kuiz', icon: '📊',  requirement: { type: 'high_score_count', value: 10 } },
  { id: 'high_25',     category: 'mastery', tier: 'gold',     name: 'Pencapaian Cemerlang',description: 'Skor 80%+ dalam 25 kuiz',icon: '🏅',  requirement: { type: 'high_score_count', value: 25 } },
  { id: 'high_50',     category: 'mastery', tier: 'platinum', name: 'Cemerlang Berterusan',description: 'Skor 80%+ dalam 50 kuiz',icon: '💎',  requirement: { type: 'high_score_count', value: 50 } },
  { id: 'high_100',    category: 'mastery', tier: 'diamond',  name: 'Sentiasa Cemerlang',description: 'Skor 80%+ dalam 100 kuiz',icon: '👑',  requirement: { type: 'high_score_count', value: 100 } },

  // ═══════════════ DEDICATION / ANNUAL (5) ═══════════════
  { id: 'dedicate_30',  category: 'dedication', tier: 'bronze',   name: 'Sebulan Aktif',      description: 'Belajar 30 hari (jumlah)',  icon: '📅',  requirement: { type: 'total_active_days', value: 30 } },
  { id: 'dedicate_100',  category: 'dedication', tier: 'silver',   name: 'Seratus Hari',       description: 'Belajar 100 hari (jumlah)', icon: '🗓️',  requirement: { type: 'total_active_days', value: 100 } },
  { id: 'dedicate_200',  category: 'dedication', tier: 'gold',     name: 'Dua Ratus Hari',     description: 'Belajar 200 hari (jumlah)',  icon: '📆',  requirement: { type: 'total_active_days', value: 200 } },
  { id: 'dedicate_500',  category: 'dedication', tier: 'platinum', name: 'Lima Ratus Hari',    description: 'Belajar 500 hari (jumlah)',  icon: '🌟',  requirement: { type: 'total_active_days', value: 500 } },
  { id: 'dedicate_1000', category: 'dedication', tier: 'diamond',  name: 'Seribu Hari Cahaya', description: 'Belajar 1,000 hari (jumlah)',icon: '☀️',  requirement: { type: 'total_active_days', value: 1000 } },
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
  const quizAttempts = data?.quizAttempts || data?.quizzes || [];
  const sessions = data?.sessions || [];
  const games = data?.games || data?.gameProgress || [];

  // Count unique subjects explored from sessions and quizzes
  const subjectSet = new Set();
  sessions.forEach(s => {
    if (s.subject_name) subjectSet.add(s.subject_name);
    if (s.subject) subjectSet.add(s.subject);
  });
  quizAttempts.forEach(q => {
    if (q.subject_name) subjectSet.add(q.subject_name);
    if (q.subject) subjectSet.add(q.subject);
  });

  // Count unique active study days from sessions
  const activeDaySet = new Set();
  sessions.forEach(s => {
    const dateKey = s.created_date ? new Date(s.created_date).toDateString() : null;
    if (dateKey) activeDaySet.add(dateKey);
  });

  return {
    total_xp: progress.total_xp || 0,
    level: progress.level || 1,
    streak_days: progress.streak_days || 0,
    total_study_time: progress.total_study_time || 0,
    quiz_count: quizAttempts.length,
    perfect_scores: quizAttempts.filter(a => a.score === 100 || a.percentage === 100).length,
    high_score_count: quizAttempts.filter(a => (a.score ?? a.percentage ?? 0) >= 80).length,
    mastery_quiz_count: quizAttempts.filter(a => a.quiz_type === 'mastery').length,
    coins: wallet.balance || 0,
    lessons_completed: sessions.filter(s => s.status === 'completed' || s.completed).length || sessions.length,
    subjects_explored: subjectSet.size,
    games_played: games.length,
    friends_count: data?.friends?.length || 0,
    total_active_days: activeDaySet.size,
  };
}