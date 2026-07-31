import React from "react";
import { motion } from "framer-motion";
import { Compass, Clock, CheckCircle2, BookOpen, Pencil, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Calculates age from date_of_birth string.
 */
function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

/**
 * Determines if the 3M diagnostic recommendation should be shown for a child.
 * Condition: age >= 6 AND age <= 8 AND diagnostic_status !== "completed"
 */
export function shouldShowDiagnosticRecommendation(child) {
  if (!child) return false;
  if (child.diagnostic_status === "completed") return false;
  const age = calculateAge(child.date_of_birth);
  if (age === null) return false;
  return age >= 6 && age <= 8;
}

export { calculateAge };

const BENEFITS = [
  { label: "Kenal tahap kemampuan semasa anak", icon: CheckCircle2 },
  { label: "Kenal pasti kekuatan pembelajaran", icon: CheckCircle2 },
  { label: "Cari kemahiran yang perlu latihan tambahan", icon: CheckCircle2 },
  { label: "Dapat cadangan pembelajaran peribadi", icon: CheckCircle2 },
];

const MODULES = [
  { icon: BookOpen, label: "Membaca", color: "text-emerald-600", bg: "bg-emerald-50", items: "Pengenalan huruf · Suku kata · Perkataan mudah" },
  { icon: Pencil, label: "Menulis", color: "text-blue-600", bg: "bg-blue-50", items: "Tulisan huruf · Tulisan perkataan · Kesediaan ayat" },
  { icon: Calculator, label: "Mengira", color: "text-amber-600", bg: "bg-amber-50", items: "Pengenalan nombor · Kiraan · Pengiraan asas" },
];

export default function DiagnosticRecommendationCard({ child, onStart, onSkip, isReminder = false }) {
  const childName = child?.nickname || child?.full_name || "anak anda";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-2xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-purple-50 shadow-sm"
    >
      {/* Decorative gradient bar */}
      <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
            <Compass className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-slate-900 leading-tight">
              🧭 Terokai Tahap Pembelajaran {childName}
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Sebelum memulakan pengembaraan StudyQuest, mari faham asas kemahiran {childName} dalam Membaca, Menulis, dan Mengira (3M).
            </p>
          </div>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {BENEFITS.map((b) => (
            <div key={b.label} className="flex items-center gap-2">
              <b.icon className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span className="text-xs text-slate-600 font-medium">{b.label}</span>
            </div>
          ))}
        </div>

        {/* Modules overview */}
        <div className="grid grid-cols-3 gap-2">
          {MODULES.map((m) => (
            <div key={m.label} className={`${m.bg} rounded-lg p-2.5 text-center`}>
              <m.icon className={`w-4 h-4 ${m.color} mx-auto mb-1`} />
              <p className={`text-xs font-bold ${m.color}`}>{m.label}</p>
              <p className="text-[9px] text-slate-500 leading-tight mt-0.5">{m.items}</p>
            </div>
          ))}
        </div>

        {/* Duration */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <Clock className="w-3.5 h-3.5" />
          <span className="font-medium">Anggaran masa: 15–20 minit</span>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={onStart}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm h-10 rounded-lg shadow-sm"
          >
            <Compass className="w-4 h-4 mr-1.5" />
            Mula Misi Penemuan 3M
          </Button>
          <Button
            onClick={onSkip}
            variant="outline"
            className="sm:w-auto bg-white border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 font-medium text-sm h-10 rounded-lg"
          >
            {isReminder ? "Tutup" : "Nanti Saja"}
          </Button>
        </div>

        {/* Reminder footer (when skipped) */}
        {isReminder && (
          <p className="text-center text-[11px] text-amber-600 font-medium pt-1">
            ✨ Lengkapkan Penemuan Pembelajaran untuk membuka cadangan yang lebih peribadi.
          </p>
        )}
      </div>
    </motion.div>
  );
}