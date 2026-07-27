import React from "react";
import { motion } from "framer-motion";
import { getMasteryEmoji, getMasteryLabel } from "@/lib/diagnosticQuestions";

export default function FoundationProfile({ session, skillResults = [] }) {
  const modules = [
    {
      id: "membaca",
      title: "Membaca",
      emoji: "📖",
      level: session.reading_level,
      mastery: session.reading_mastery,
      gradient: "from-emerald-600 to-green-700",
      border: "border-emerald-400/40",
    },
    {
      id: "menulis",
      title: "Menulis",
      emoji: "✏️",
      level: session.writing_level,
      mastery: session.writing_mastery,
      gradient: "from-blue-600 to-indigo-700",
      border: "border-blue-400/40",
    },
    {
      id: "mengira",
      title: "Mengira",
      emoji: "🔢",
      level: session.numeracy_level,
      mastery: session.numeracy_mastery,
      gradient: "from-amber-600 to-orange-700",
      border: "border-amber-400/40",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h2 className="text-xl font-black text-white">Profil Asas 3M</h2>
        <p className="text-xs text-stone-400 mt-1">Keputusan Misi Penemuan StudyQuest</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {modules.map((mod, i) => {
          const skills = skillResults.filter((s) => s.skill_category === mod.id);

          return (
            <motion.div
              key={mod.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`rounded-3xl p-4 border-2 ${mod.border} bg-gradient-to-br ${mod.gradient} shadow-xl`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-3xl">{mod.emoji}</div>
                <span className="text-2xl">{getMasteryEmoji(mod.mastery)}</span>
              </div>
              <h3 className="text-base font-black text-white">{mod.title}</h3>
              <div className="mt-1.5 space-y-0.5">
                <p className="text-xs font-bold text-white/90">Tahap {mod.level}/4</p>
                <p className="text-[11px] text-white/60">{getMasteryLabel(mod.mastery)}</p>
              </div>

              {skills.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-white/20 space-y-1">
                  {skills.map((skill, j) => (
                    <div key={j} className="flex items-center justify-between text-[10px]">
                      <span className="text-white/70 truncate pr-1">{skill.skill_display_name}</span>
                      <span className="text-white/50 font-bold shrink-0">{skill.score}%</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Total Score */}
      <div className="bg-stone-900/80 border-2 border-stone-700 rounded-2xl p-3.5 flex items-center justify-between">
        <span className="text-sm font-bold text-stone-300">Skor Keseluruhan</span>
        <span className="text-2xl font-black text-amber-400">{session.total_score}%</span>
      </div>
    </div>
  );
}