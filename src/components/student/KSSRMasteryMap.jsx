// src/components/student/KSSRMasteryMap.jsx
// Phase 4A RPG-Style KSSR/KSSM Mastery Map Visualizer
// Renders TP1-TP6 mastery badges, EWMA score bars, and subject progress maps.

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";

// KSSR / KSSM Tahap Penguasaan (TP1 - TP6) Metadata Definitions
export const TP_LEVELS = {
  1: {
    title: "TP 1: Tahu",
    sub: "Asas Permulaan",
    badge: "🥉",
    bg: "bg-amber-100 text-amber-900 border-amber-300",
    ring: "border-amber-400",
    desc: "Mengingat kembali pengetahuan asas dan kemahiran.",
  },
  2: {
    title: "TP 2: Tahu & Faham",
    sub: "Kefahaman Terbina",
    badge: "🥈",
    bg: "bg-orange-100 text-orange-900 border-orange-300",
    ring: "border-orange-400",
    desc: "Memahami dan menjelaskan fakta serta konsep.",
  },
  3: {
    title: "TP 3: Boleh Buat",
    sub: "Aplikasi Asas",
    badge: "🥇",
    bg: "bg-yellow-100 text-yellow-900 border-yellow-400",
    ring: "border-yellow-500",
    desc: "Mengaplikasikan pengetahuan untuk melaksanakan tugas.",
  },
  4: {
    title: "TP 4: Buat Beradab",
    sub: "Kemahiran Konsisten",
    badge: "💎",
    bg: "bg-emerald-100 text-emerald-900 border-emerald-300",
    ring: "border-emerald-400",
    desc: "Melaksanakan kemahiran secara sistematik dan bersikap positif.",
  },
  5: {
    title: "TP 5: Terpuji",
    sub: "Aplikasi Cemerlang",
    badge: "👑",
    bg: "bg-cyan-100 text-cyan-900 border-cyan-400",
    ring: "border-cyan-500",
    desc: "Mengaplikasikan kemahiran dalam situasi baharu secara tekun.",
  },
  6: {
    title: "TP 6: Exemplari",
    sub: "Pakar & Suri Teladan",
    badge: "🔥",
    bg: "bg-purple-100 text-purple-900 border-purple-400",
    ring: "border-purple-500",
    desc: "Berfikir secara kreatif dan menjadi contoh teladan cemerlang.",
  },
};

const DEFAULT_SUBJECTS = [
  { id: "bm", name: "Bahasa Melayu", icon: "📖", color: "from-blue-500 to-indigo-600" },
  { id: "bi", name: "Bahasa Inggeris", icon: "🔤", color: "from-purple-500 to-pink-600" },
  { id: "mt", name: "Matematik", icon: "🔢", color: "from-amber-500 to-orange-600" },
  { id: "sn", name: "Sains", icon: "🔬", color: "from-emerald-500 to-teal-600" },
  { id: "sj", name: "Sejarah", icon: "🏛️", color: "from-rose-500 to-red-600" },
];

export default function KSSRMasteryMap({ skillProfiles = [], summary = {}, onSelectStandard }) {
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [expandedSubject, setExpandedSubject] = useState(null);

  // Group Skill Profiles by Subject
  const groupedProfiles = React.useMemo(() => {
    const map = {};
    skillProfiles.forEach((profile) => {
      const subj = profile.subject || "Matematik";
      if (!map[subj]) map[subj] = [];
      map[subj].push(profile);
    });
    return map;
  }, [skillProfiles]);

  const subjectNames = Object.keys(groupedProfiles).length > 0
    ? Object.keys(groupedProfiles)
    : DEFAULT_SUBJECTS.map((s) => s.name);

  const activeSubjects = selectedSubject === "all"
    ? subjectNames
    : [selectedSubject];

  return (
    <div className="bg-white rounded-3xl p-6 border-4 border-stone-200 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-stone-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-stone-900 font-black shadow-md shrink-0">
            <Trophy className="w-6 h-6 text-stone-900" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                Peta Kemahiran KSSR / KSSM
              </span>
            </div>
            <h2 className="text-xl font-black text-stone-800 leading-tight">
              Peta Penguasaan DSKP Pelajar
            </h2>
          </div>
        </div>

        {/* Global Summary Pill */}
        <div className="flex items-center gap-2 bg-stone-50 p-2 rounded-2xl border border-stone-200 self-start sm:self-auto">
          <div className="text-center px-3 py-1 bg-white rounded-xl border border-stone-200 shadow-2xs">
            <p className="text-[10px] font-bold text-stone-400 uppercase">Purata EWMA</p>
            <p className="text-base font-black text-emerald-600">
              {summary.average_ewma || 0}%
            </p>
          </div>
          <div className="text-center px-3 py-1 bg-white rounded-xl border border-stone-200 shadow-2xs">
            <p className="text-[10px] font-bold text-stone-400 uppercase">Kemahiran Ditentu</p>
            <p className="text-base font-black text-indigo-600">
              {summary.total_skills || skillProfiles.length || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Subject Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setSelectedSubject("all")}
          className={`px-4 py-2 rounded-2xl text-xs font-black transition-all whitespace-nowrap border-2 ${
            selectedSubject === "all"
              ? "bg-stone-900 text-white border-stone-900 shadow-sm"
              : "bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100"
          }`}
        >
          🌟 Semua Subjek ({skillProfiles.length})
        </button>
        {subjectNames.map((subj) => (
          <button
            key={subj}
            onClick={() => setSelectedSubject(subj)}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition-all whitespace-nowrap border-2 ${
              selectedSubject === subj
                ? "bg-amber-400 text-stone-900 border-amber-500 shadow-sm"
                : "bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100"
            }`}
          >
            {subj} ({groupedProfiles[subj]?.length || 0})
          </button>
        ))}
      </div>

      {/* Subject Cards List */}
      <div className="space-y-4">
        {activeSubjects.length === 0 || skillProfiles.length === 0 ? (
          <div className="text-center py-10 bg-stone-50 rounded-2xl border-2 border-dashed border-stone-200">
            <BookOpen className="w-10 h-10 text-stone-300 mx-auto mb-2" />
            <p className="font-extrabold text-stone-600 text-sm">
              Belum ada rekod penilaian DSKP.
            </p>
            <p className="text-xs text-stone-400 mt-1">
              Selesaikan kuiz atau latihan untuk mengemaskini peta penguasaan KSSR anda!
            </p>
          </div>
        ) : (
          activeSubjects.map((subjectName) => {
            const profiles = groupedProfiles[subjectName] || [];
            const isExpanded = expandedSubject === subjectName || activeSubjects.length === 1;

            // Calculate subject avg
            const subjAvg = profiles.length > 0
              ? Math.round(profiles.reduce((acc, p) => acc + (p.ewma_score ?? p.score ?? 0), 0) / profiles.length)
              : 0;

            // Subject max TP
            const maxTp = profiles.length > 0
              ? Math.max(...profiles.map((p) => p.tp_level || 1))
              : 1;

            const tpMeta = TP_LEVELS[maxTp] || TP_LEVELS[1];

            return (
              <div
                key={subjectName}
                className="bg-stone-50 rounded-2xl border-2 border-stone-200 overflow-hidden transition-all"
              >
                {/* Subject Header Banner */}
                <div
                  onClick={() => setExpandedSubject(isExpanded ? null : subjectName)}
                  className="p-4 bg-white flex items-center justify-between gap-4 cursor-pointer hover:bg-stone-50/80 transition-colors border-b border-stone-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-lg font-bold shrink-0">
                      {subjectName.includes("Matematik") ? "🔢" : subjectName.includes("Sains") ? "🔬" : subjectName.includes("Inggeris") ? "🔤" : "📖"}
                    </div>
                    <div>
                      <h3 className="font-black text-stone-800 text-base flex items-center gap-2">
                        {subjectName}
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${tpMeta.bg}`}>
                          {tpMeta.badge} {tpMeta.title}
                        </span>
                      </h3>
                      <p className="text-xs font-bold text-stone-400 mt-0.5">
                        {profiles.length} Standard Pembelajaran DSKP Dinilai
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Subject EWMA Bar */}
                    <div className="hidden sm:block text-right">
                      <p className="text-xs font-black text-stone-700">{subjAvg}% Skor EWMA</p>
                      <div className="w-28 h-2.5 bg-stone-200 rounded-full overflow-hidden mt-1">
                        <div
                          className="h-full bg-gradient-to-r from-amber-400 to-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(subjAvg, 100)}%` }}
                        />
                      </div>
                    </div>

                    <button className="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600 hover:bg-stone-200 transition-colors">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Subject Expanded Skills Grid */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-4 space-y-3"
                    >
                      {profiles.map((profile) => {
                        const score = profile.ewma_score ?? profile.score ?? 50;
                        const tp = profile.tp_level || (score >= 85 ? 5 : score >= 70 ? 4 : score >= 50 ? 3 : 2);
                        const tpInfo = TP_LEVELS[tp] || TP_LEVELS[1];
                        const standardCode = profile.standard_pembelajaran || profile.skill || "SK_1.1";

                        return (
                          <div
                            key={profile.id || standardCode}
                            className="bg-white rounded-xl p-3.5 border border-stone-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-amber-300 transition-all"
                          >
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base font-black shrink-0 border ${tpInfo.bg}`}>
                                {tpInfo.badge}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200 font-mono">
                                    {standardCode}
                                  </span>
                                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${tpInfo.bg}`}>
                                    {tpInfo.title}
                                  </span>
                                </div>
                                <p className="text-xs font-extrabold text-stone-700 mt-1 line-clamp-1">
                                  {profile.skill_description || profile.skill_name || `Kemahiran ${standardCode}`}
                                </p>
                              </div>
                            </div>

                            {/* Score & Next Goal Target */}
                            <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-stone-100">
                              <div className="text-left sm:text-right">
                                <span className="text-xs font-black text-stone-800">{score}% EWMA</span>
                                <div className="w-24 h-2 bg-stone-100 rounded-full overflow-hidden mt-0.5">
                                  <div
                                    className={`h-full rounded-full ${
                                      score >= 85
                                        ? "bg-emerald-500"
                                        : score >= 70
                                        ? "bg-amber-500"
                                        : "bg-rose-500"
                                    }`}
                                    style={{ width: `${Math.min(score, 100)}%` }}
                                  />
                                </div>
                              </div>

                              {onSelectStandard && (
                                <button
                                  onClick={() => onSelectStandard(standardCode, subjectName)}
                                  className="text-[11px] font-black text-amber-900 bg-amber-400 hover:bg-amber-300 px-3 py-1.5 rounded-xl border-b-2 border-amber-600 transition-colors shrink-0 flex items-center gap-1"
                                >
                                  <Target className="w-3.5 h-3.5" /> Misi
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>

      {/* KSSR TP Level Guide Legend */}
      <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200">
        <p className="text-xs font-black text-stone-700 uppercase tracking-wider mb-2 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Panduan Tahap Penguasaan (TP1 - TP6)
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {Object.entries(TP_LEVELS).map(([levelNum, meta]) => (
            <div key={levelNum} className={`p-2 rounded-xl border text-center ${meta.bg}`}>
              <div className="text-base">{meta.badge}</div>
              <p className="text-[10px] font-black leading-tight mt-1">{meta.title}</p>
              <p className="text-[9px] font-bold opacity-80 mt-0.5">{meta.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
