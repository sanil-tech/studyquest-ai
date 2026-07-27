import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DiagnosticIntro() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-900 via-green-900 to-stone-950 font-body text-stone-100 flex flex-col items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg w-full space-y-5 text-center"
      >
        {/* Mascot */}
        <motion.div
          initial={{ scale: 0.7, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-28 h-28 mx-auto rounded-full bg-emerald-500/20 border-4 border-emerald-400/40 flex items-center justify-center text-6xl shadow-2xl shadow-emerald-500/20"
        >
          🐢
        </motion.div>

        {/* Title */}
        <div>
          <span className="inline-block text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
            Misi Penemuan StudyQuest
          </span>
          <h1 className="text-2xl font-black text-white mt-3">
            Selamat Datang, Pengembara!
          </h1>
        </div>

        {/* Suku Dialogue */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-stone-900/80 border-2 border-stone-700 rounded-3xl p-5 text-left space-y-3"
        >
          <p className="text-sm font-bold text-emerald-300">🐢 Suku berkata:</p>
          <p className="text-sm text-stone-200 leading-relaxed">
            "Sebelum memulakan perjalanan ilmu, Suku ingin mengenali kemahiran asas kamu.
            Kita akan main satu permainan ringkas untuk kenal huruf, nombor dan menulis."
          </p>
          <p className="text-xs text-stone-400 leading-relaxed">
            Ini bukan ujian — ia adalah misi penemuan untuk memahami tahap permulaan kamu.
            Jawab dengan jujur ya!
          </p>
        </motion.div>

        {/* 3M Modules */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { emoji: "📖", label: "Membaca", color: "text-emerald-400", border: "border-emerald-500/30" },
            { emoji: "✏️", label: "Menulis", color: "text-blue-400", border: "border-blue-500/30" },
            { emoji: "🔢", label: "Mengira", color: "text-amber-400", border: "border-amber-500/30" },
          ].map((mod, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className={`bg-stone-900/60 border-2 ${mod.border} rounded-2xl p-3 text-center`}
            >
              <div className="text-2xl mb-1">{mod.emoji}</div>
              <p className={`text-xs font-black ${mod.color}`}>{mod.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Start Button */}
        <Button
          onClick={() => navigate("/diagnostic/assessment")}
          className="w-full h-14 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-base rounded-2xl border-b-4 border-amber-700 active:translate-y-1 transition-all"
        >
          <Sparkles className="w-5 h-5 mr-2" />
          Mula Misi Penemuan!
        </Button>

        <button
          onClick={() => navigate("/dashboard")}
          className="text-xs text-stone-400 hover:text-stone-200 font-bold flex items-center gap-1 mx-auto"
        >
          <ArrowLeft className="w-3 h-3" />
          Kembali ke Dashboard
        </button>
      </motion.div>
    </div>
  );
}