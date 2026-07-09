import React from "react";
import { BookOpen, Layers, Network, Gamepad2, CheckCircle2, Lock, Play, Star, Leaf, Cloud } from "lucide-react";
import { motion } from "framer-motion";

const STEPS = [
  { key: "lesson", label: "Nota Pintar", icon: BookOpen },
  { key: "flashcards", label: "Kad Memori", icon: Layers },
  { key: "mindmap", label: "Peta Minda", icon: Network },
  { key: "activity", label: "Cabaran Boss", icon: Gamepad2 },
];

export default function LessonProgress({ steps, onStepClick }) {
  // Kira peratusan untuk papan tanda kemajuan
  const completedCount = STEPS.filter((s) => steps[s.key]).length;
  const percent = Math.round((completedCount / STEPS.length) * 100);
  const isAllComplete = percent === 100;

  return (
    <div className="relative bg-gradient-to-b from-sky-300 via-sky-100 to-lime-100 rounded-[2.5rem] border-4 border-sky-200 shadow-xl overflow-hidden p-6 sm:p-8 min-h-[500px]">
      
      {/* 1. ELEMEN LATAR BELAKANG (Awan & Dedaun) */}
      <div className="absolute top-4 right-4 text-white/50 z-0"><Cloud className="w-20 h-20 fill-white" /></div>
      <div className="absolute top-24 -left-10 text-white/40 z-0"><Cloud className="w-32 h-32 fill-white" /></div>
      <div className="absolute -bottom-10 -right-10 text-emerald-500/20 z-0"><Leaf className="w-48 h-48 transform -rotate-45" /></div>

      {/* 2. BATANG POKOK UTAMA (Trunk) */}
      <div className="absolute left-8 sm:left-14 top-0 bottom-0 w-12 sm:w-16 bg-gradient-to-r from-[#5C3A21] via-[#8B5A2B] to-[#4A2E19] shadow-[10px_0_15px_rgba(0,0,0,0.2)] z-0 border-l-2 border-white/10" />
      {/* Tekstur Urat Kayu pada Pokok */}
      <div className="absolute left-10 sm:left-16 top-0 bottom-0 w-1 bg-black/30 z-0 mix-blend-overlay" />
      <div className="absolute left-14 sm:left-22 top-0 bottom-0 w-0.5 bg-black/20 z-0 mix-blend-overlay" />
      
      {/* Tumbuhan menjalar pada batang pokok (Vines) */}
      <svg className="absolute left-8 sm:left-14 top-0 bottom-0 w-12 sm:w-16 h-full z-0 opacity-40 text-emerald-700" preserveAspectRatio="none" viewBox="0 0 100 1000">
        <path d="M 20,0 Q 80,100 20,200 T 20,400 T 20,600 T 20,800 T 20,1000" fill="none" stroke="currentColor" strokeWidth="8" />
      </svg>

      {/* 3. PAPAN TANDA KEMAJUAN (Hanging Wooden Sign) */}
      <div className="relative z-20 flex flex-col items-center mb-10 w-full sm:w-3/4 mx-auto pl-12 sm:pl-20">
        {/* Tali gantung */}
        <div className="flex gap-12 sm:gap-24 -mb-2">
          <div className="w-1.5 h-6 bg-[#C19A6B] rounded-full shadow-sm" />
          <div className="w-1.5 h-6 bg-[#C19A6B] rounded-full shadow-sm" />
        </div>
        {/* Papan Kayu */}
        <div className="bg-gradient-to-b from-[#8B5A2B] to-[#5C3A21] border-b-[6px] border-[#3A2210] rounded-2xl p-4 w-full text-center shadow-lg relative">
          {/* Paku papan */}
          <div className="absolute top-2 left-2 w-2 h-2 bg-black/40 rounded-full" />
          <div className="absolute top-2 right-2 w-2 h-2 bg-black/40 rounded-full" />
          
          <span className="text-amber-100 font-black text-xs sm:text-sm uppercase tracking-widest flex items-center justify-center gap-2">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /> Kemajuan Misi
          </span>
          <div className="h-3 bg-black/40 rounded-full mt-2.5 overflow-hidden shadow-inner border border-black/20 p-0.5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percent}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-lime-400 to-emerald-400 rounded-full relative"
            >
              <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/40 rounded-t-full" />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Otan meraikan di puncak jika 100% */}
      <AnimatePresence>
        {isAllComplete && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="absolute top-28 left-4 sm:left-8 z-30 flex flex-col items-center"
          >
            <div className="text-5xl animate-bounce filter drop-shadow-lg transform -scale-x-100">🦧</div>
            <div className="bg-white px-3 py-1 rounded-xl text-[10px] font-black text-emerald-600 shadow-md border-b-2 border-emerald-200 -mt-1 ml-4">
              Tahniah! 🎉
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. TANGGA MISI (Steps) - Menggunakan flex-col-reverse supaya bermula dari bawah */}
      <div className="relative z-10 flex flex-col-reverse gap-8 pb-4 w-full">
        {STEPS.map((step, index) => {
          const isDone = steps[step.key];
          // Misi dikunci jika misi sebelumnya belum siap (Kecuali indeks 0 sentiasa buka)
          const isLocked = index > 0 && !steps[STEPS[index - 1].key];
          const isCurrent = !isDone && !isLocked;
          const Icon = step.icon;
          
          return (
            <motion.div 
              key={step.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative flex items-center w-full"
            >
              {/* Otan memanjat di batang pokok untuk misi semasa (Current) */}
              {isCurrent && (
                <motion.div 
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  className="absolute left-1 sm:left-5 -top-10 text-4xl sm:text-5xl z-30 filter drop-shadow-xl transform -scale-x-100 animate-pulse"
                >
                  🦧
                </motion.div>
              )}

              {/* Tempat Paku di Batang Pokok (Tree Knot) */}
              <div className="absolute left-11 sm:left-[4.25rem] w-6 h-6 rounded-full bg-[#3A2210] border-4 border-[#5C3A21] shadow-inner z-10" />

              {/* Tiang penyambung dari pokok ke papan tanda (Branch peg) */}
              <div className="absolute left-12 sm:left-20 w-8 sm:w-10 h-3 bg-[#5C3A21] border-b-2 border-black/30 z-0" />

              {/* Butang Papan Tangga (Wooden Plank Step) */}
              <button
                disabled={isLocked}
                onClick={() => !isLocked && onStepClick?.(step.key)}
                className={`ml-16 sm:ml-[6.5rem] flex-1 max-w-[280px] p-4 rounded-2xl border-b-[6px] transition-all flex items-center justify-between group relative overflow-hidden ${
                  isDone 
                    ? "bg-gradient-to-r from-emerald-500 to-green-600 border-emerald-800 text-white shadow-md hover:brightness-110 active:border-b-0 active:translate-y-1.5" 
                    : isCurrent
                    ? "bg-gradient-to-r from-amber-400 to-orange-500 border-orange-700 text-white shadow-xl hover:brightness-110 active:border-b-0 active:translate-y-1.5 ring-4 ring-amber-300/50"
                    : "bg-[#D4C4B7] border-[#A8988A] text-stone-500 opacity-80 cursor-not-allowed"
                }`}
              >
                {/* Pantulan Cahaya Atas Kayu */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-white/20 rounded-t-full" />

                <div className="flex items-center gap-3 relative z-10">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-inner border border-white/20 transform group-hover:rotate-6 transition-transform ${
                    isLocked ? 'bg-stone-300/50' : 'bg-white/20'
                  }`}>
                    <Icon className={`w-5 h-5 ${isLocked ? 'text-stone-400' : 'text-white'}`} />
                  </div>
                  
                  <div className="text-left">
                    <span className="block text-[9px] sm:text-[10px] uppercase tracking-widest opacity-90 font-bold mb-0.5">
                      Tahap {index + 1}
                    </span>
                    <span className="block text-sm sm:text-base font-black tracking-tight leading-none drop-shadow-sm">
                      {step.label}
                    </span>
                  </div>
                </div>

                {/* Ikon Status di Kanan */}
                <div className="shrink-0 relative z-10 bg-black/10 p-2 rounded-full backdrop-blur-sm">
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-lime-300" />
                  ) : isLocked ? (
                    <Lock className="w-5 h-5 text-stone-500" />
                  ) : (
                    <Play className="w-5 h-5 text-yellow-200 fill-yellow-200 drop-shadow-sm group-hover:scale-110 transition-transform" />
                  )}
                </div>
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}