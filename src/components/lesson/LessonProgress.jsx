import React, { useState, useEffect } from "react";
import { BookOpen, Layers, Network, Gamepad2, CheckCircle2, Circle, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";

const STEPS = [
  { key: "lesson", label: "Lesson Read", icon: BookOpen },
  { key: "flashcards", label: "Flashcards", icon: Layers },
  { key: "mindmap", label: "Mind Map", icon: Network },
  { key: "activity", label: "Activity", icon: Gamepad2 },
];

export default function LessonProgress({ steps, onStepClick, progressId }) {
  // Mengira peratusan kemajuan pembelajaran berdasarkan tugasan yang selesai
  const completed = STEPS.filter((s) => steps[s.key]).length;
  const percent = Math.round((completed / STEPS.length) * 100);

  // State untuk menjejak masa aktif pembelajaran dalam unit saat
  const [secondsActive, setSecondsActive] = useState(0);

  // 1. Fungsi 'Timer' harian berjalan setiap saat di latar belakang
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsActive((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 2. Fungsi 'Cleanup' untuk sinkronisasi masa belajar ke database apabila menukar halaman
  useEffect(() => {
    return () => {
      // Hanya rekodkan jika anak aktif belajar melebihi 5 saat untuk mengelakkan spam data kosong
      if (progressId && secondsActive > 5) {
        const minutesEarned = Math.round(secondsActive / 60) || 1;

        base44.entities.Progress.get(progressId)
          .then((currentProgress) => {
            const oldTime = currentProgress?.study_time || 0;
            
            // Kemas kini jumlah minit belajar terkumpul dan tarikh aktif terakhir (updated_at)
            base44.entities.Progress.update(progressId, {
              study_time: oldTime + minutesEarned,
              updated_at: new Date().toISOString()
            });
          })
          .catch((err) => {
            console.error("Gagal mengemas kini masa pembelajaran ke server:", err);
          });
      }
    };
  }, [secondsActive, progressId]);

  return (
    <div className="bg-white rounded-2xl p-4 border border-border/50 shadow-xs">
      {/* Bahagian Atas: Bar Kemajuan */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold text-slate-800">Learning Progress</span>
        <span className="text-xs font-black text-indigo-600">{percent}%</span>
      </div>
      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden mb-3">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.5 }}
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
        />
      </div>

      {/* Maklumat Penunjuk Masa Aktif Semasa */}
      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 mb-4 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100 w-fit">
        <Clock className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
        Sesi Seterusnya: {Math.floor(secondsActive / 60)}m {secondsActive % 60}s
      </div>

      {/* Bahajaran Senarai Langkah Pembelajaran */}
      <div className="grid grid-cols-2 gap-2">
        {STEPS.map((step) => {
          const done = steps[step.key];
          const Icon = step.icon;
          return (
            <button
              key={step.key}
              onClick={() => onStepClick?.(step.key)}
              className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                done
                  ? "border-emerald-200 bg-emerald-50/70 shadow-2xs"
                  : "border-slate-100 bg-slate-50/50 hover:bg-slate-50"
              }`}
            >
              {done ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-slate-300 shrink-0" />
              )}
              <Icon className={`w-4 h-4 shrink-0 ${done ? "text-emerald-600" : "text-slate-400"}`} />
              <span className={`text-xs font-bold truncate ${done ? "text-emerald-700" : "text-slate-600"}`}>
                {step.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}