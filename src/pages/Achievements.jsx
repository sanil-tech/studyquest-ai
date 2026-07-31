import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Loader2, Check } from "lucide-react";
import { useStudentData } from "@/hooks/useStudentData";
import { ACHIEVEMENT_CATEGORIES, ACHIEVEMENT_TIERS, evaluateAchievements, buildStatsFromData } from "@/lib/achievements";

function AchievementCard({ achievement, index }) {
  const { earned, progress, current, target, tier } = achievement;
  const tierStyle = ACHIEVEMENT_TIERS[tier] || ACHIEVEMENT_TIERS.bronze;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: Math.min(index * 0.03, 0.5) }}
      className={`relative rounded-2xl p-4 border-2 transition-all ${
        earned
          ? `bg-gradient-to-br ${tierStyle.bg} ${tierStyle.border} shadow-md`
          : "bg-stone-50 border-stone-200"
      }`}
    >
      {earned && (
        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm">
          <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
        </div>
      )}

      {/* Tier badge */}
      <div className={`absolute top-2 left-2 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wide ${earned ? `${tierStyle.color} bg-white/60` : "text-stone-300"}`}>
        {tierStyle.label}
      </div>

      <div className={`text-4xl mb-2 mt-3 text-center ${earned ? "" : "grayscale opacity-40"}`}>
        {earned ? achievement.icon : "🔒"}
      </div>

      <p className={`text-sm font-black text-center ${earned ? "text-stone-800" : "text-stone-400"}`}>
        {achievement.name}
      </p>
      <p className={`text-[11px] text-center mt-1 ${earned ? "text-stone-500" : "text-stone-400"}`}>
        {achievement.description}
      </p>

      {!earned && (
        <div className="mt-2">
          <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-400 to-amber-500 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[9px] text-center text-stone-400 font-bold mt-1">
            {current.toLocaleString()} / {target.toLocaleString()}
          </p>
        </div>
      )}
    </motion.div>
  );
}

export default function Achievements() {
  const { data, loading } = useStudentData();
  const [filter, setFilter] = useState("all");

  const stats = useMemo(() => buildStatsFromData(data), [data]);
  const evaluated = useMemo(() => evaluateAchievements(stats), [stats]);

  const earnedCount = evaluated.filter(a => a.earned).length;
  const filtered = filter === "all" ? evaluated : evaluated.filter(a => a.category === filter);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
        <p className="mt-3 text-xs font-bold text-stone-500 uppercase tracking-wider">Memuat lencana...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-4">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-orange-100 px-4 py-2 rounded-full mb-3">
          <span className="text-lg">🏅</span>
          <span className="font-black text-orange-700 text-sm uppercase tracking-wide">Lencana Pencapaian</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-stone-800">Koleksi Lencana Kamu</h1>
        <p className="text-sm text-stone-500 mt-1">Kumpul lencana dengan belajar rajin-rajin!</p>
      </div>

      {/* Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 rounded-3xl p-6 text-white shadow-lg"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-orange-50 uppercase tracking-wide">Lencana Diperoleh</p>
            <p className="text-4xl font-black mt-1">{earnedCount} <span className="text-2xl text-orange-100">/ {evaluated.length}</span></p>
          </div>
          <div className="text-6xl">{earnedCount >= 60 ? "🗿" : earnedCount >= 40 ? "👑" : earnedCount >= 20 ? "🏆" : earnedCount >= 10 ? "🌟" : earnedCount >= 5 ? "⭐" : earnedCount >= 1 ? "🌱" : "🌰"}</div>
        </div>
        <div className="mt-3 h-3 bg-white/20 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(earnedCount / evaluated.length) * 100}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-white rounded-full"
          />
        </div>
      </motion.div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {ACHIEVEMENT_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setFilter(cat.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
              filter === cat.id
                ? "bg-orange-500 text-white shadow-md"
                : "bg-white text-stone-500 border border-stone-200 hover:bg-stone-50"
            }`}
          >
            <span>{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Achievement Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {filtered.map((achievement, idx) => (
          <AchievementCard key={achievement.id} achievement={achievement} index={idx} />
        ))}
      </div>
    </div>
  );
}