import React from "react";
import { BookOpen, Layers, Network, Gamepad2, CheckCircle2, Lock, Play, Star, Leaf, Cloud, Tv, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const STEPS = [
  { key: "video", label: "Video Guru", icon: Tv },
  { key: "lesson", label: "Nota Pintar", icon: BookOpen },
  { key: "flashcard", label: "Kad Memori", icon: Layers },
  { key: "mindmap", label: "Peta Minda", icon: Network },
  { key: "quiz", label: "Kuiz Boss", icon: Gamepad2 },
];

export default function LessonProgress({ steps, onStepClick }) {
  const completedCount = STEPS.filter((s) => steps[s.key]).length;
  const percent = Math.round((completedCount / STEPS.length) * 100);
  const isAllComplete = percent === 100;

  return (
    <div className="relative bg-gradient-to-b from-sky-400 via-sky-200 to-lime-100 rounded-[2.5rem] border-4 border-sky-300 shadow-2xl overflow-hidden p-6 sm:p-8 min-h-[650px] font-sans">
      
      {/* 1. ELEMEN ALAM (Awan, Cahaya, Dedaun Belakang) */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/20 blur-[80px] rounded-full pointer-events-none" />
      <div className="absolute top-10 right-4 text-white/70 z-0"><Cloud className="w-24 h-24 fill-white" /></div>
      <div className="absolute top-40 -left-12 text-white/50 z-0"><Cloud className="w-36 h-36 fill-white" /></div>
      
      {/* Rimbunan Kanopi Atas (Top Canopy) */}
      <div className="absolute -top-10 -left-10 w-64 h-48 bg-gradient-to-br from-emerald-400 to-green-700 rounded-full blur-2xl opacity-60 z-0 pointer-events-none" />
      <div className="absolute top-0 left-0 text-green-700/40 z-0 drop-shadow-xl transform -scale-x-100">
        <Leaf className="w-32 h-32 fill-current rotate-45" />
      </div>

      {/* 2. BATANG POKOK REALISTIK (3D Cylinder Trunk) */}
      <div className="absolute left-6 sm:left-12 top-0 bottom-10 w-16 sm:w-20 z-0 flex flex-col">
        {/* Badan Pokok */}
        <div className="flex-1 w-full relative bg-[#5C3A21] overflow-hidden">
          
          {/* SVG Penapis Urat Kayu (Realistic Wood Grain) */}
          <svg className="absolute inset-0 w-full h-full opacity-30 mix-blend-overlay pointer-events-none" preserveAspectRatio="none">
            <filter id="wood-grain">
              {/* x-frequency tinggi, y-frequency rendah untuk garisan menegak */}
              <feTurbulence type="fractalNoise" baseFrequency="0.1 0.005" numOctaves="3" result="noise" />
              <feColorMatrix type="matrix" values="1 0 0 0 0  0.8 0 0 0 0  0.6 0 0 0 0  0 0 0 1 0" in="noise" result="coloredNoise" />
            </filter>
            <rect width="100%" height="100%" filter="url(#wood-grain)" fill="#4A2E19" />
          </svg>

          {/* Lorekan Silinder (Cylindrical Ambient Occlusion) */}
          <div className="absolute inset-0 shadow-[inset_15px_0_20px_rgba(0,0,0,0.6),inset_-8px_0_15px_rgba(255,255,255,0.15)] z-10 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#2c1809] via-transparent to-[#4a2810] opacity-60 z-10 pointer-events-none" />

          {/* Akar Menjalar 3D (Vines) */}
          <svg className="absolute inset-0 w-full h-full z-20 opacity-80 drop-shadow-lg" preserveAspectRatio="none" viewBox="0 0 100 1000">
            <path d="M 0,0 Q 100,100 0,200 T 100,400 T 0,600 T 100,800 T 0,1000" fill="none" stroke="#166534" strokeWidth="6" strokeLinecap="round" />
            <path d="M 100,50 Q 0,150 100,250 T 0,450 T 100,650 T 0,850 T 100,1050" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
          </svg>
        </div>
      </div>

      {/* Akar Pokok Mengembang (Roots Base) */}
      <div className="absolute left-2 sm:left-6 bottom-0 w-24 sm:w-32 h-16 sm:h-20 text-[#2c1809] z-10 drop-shadow-2xl">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
          <path d="M 20,0 C 20,40 0,80 0,100 L 100,100 C 100,80 80,40 80,0 Z" fill="currentColor"/>
          {/* Lorekan akar */}
          <path d="M 20,0 C 20,40 0,80 0,100 L 20,100 C 30,70 35,30 35,0 Z" fill="rgba(0,0,0,0.4)" />
          <path d="M 80,0 C 80,40 100,80 100,100 L 80,100 C 70,70 65,30 65,0 Z" fill="rgba(255,255,255,0.05)" />
        </svg>
      </div>

      {/* Rimbunan Daun Dasar (Bush at base) */}
      <div className="absolute left-0 bottom-[-20px] text-green-700/80 z-20 drop-shadow-lg">
        <Leaf className="w-24 h-24 fill-current rotate-45" />
      </div>


      {/* 3. PAPAN TANDA KEMAJUAN (Hanging Wooden Sign) */}
      <div className="relative z-20 flex flex-col items-center mb-10 w-full sm:w-3/4 mx-auto pl-16 sm:pl-24">
        <div className="flex gap-12 sm:gap-24 -mb-2">
          <div className="w-2 h-8 bg-[#8B5A2B] rounded-full shadow-md border-l border-white/20" />
          <div className="w-2 h-8 bg-[#8B5A2B] rounded-full shadow-md border-l border-white/20" />
        </div>
        <div className="bg-gradient-to-b from-[#70421A] to-[#4A2810] border-b-[6px] border-[#2c1809] rounded-[1.5rem] p-4 w-full text-center shadow-[0_10px_20px_rgba(0,0,0,0.3)] relative">
          <div className="absolute top-2 left-3 w-3 h-3 bg-black/60 rounded-full shadow-[inset_1px_1px_2px_rgba(255,255,255,0.3)]" />
          <div className="absolute top-2 right-3 w-3 h-3 bg-black/60 rounded-full shadow-[inset_1px_1px_2px_rgba(255,255,255,0.3)]" />
          
          <span className="text-amber-100 font-black text-xs sm:text-sm uppercase tracking-widest flex items-center justify-center gap-2 drop-shadow-md">
            <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" /> Tahap Penguasaan
          </span>
          <div className="h-4 bg-black/50 rounded-full mt-3 overflow-hidden shadow-[inset_0_4px_6px_rgba(0,0,0,0.6)] p-0.5 border border-white/10">
            <motion.div
              initial={{ width: 0 }} animate={{ width: `${percent}%` }} transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-lime-400 via-emerald-400 to-green-500 rounded-full relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/30" />
            </motion.div>
          </div>
        </div>
      </div>

      {/* OTAN SORAK DI PUNCAK (Apabila 100%) */}
      <AnimatePresence>
        {isAllComplete && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.5, y: 50 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            className="absolute top-24 left-0 sm:left-4 z-40 flex flex-col items-center"
          >
            <div className="text-6xl animate-bounce filter drop-shadow-2xl transform -scale-x-100 relative">
              🦧
              <Sparkles className="absolute -top-2 -right-4 w-6 h-6 text-yellow-300 fill-yellow-200 animate-pulse" />
            </div>
            <div className="bg-white px-4 py-1.5 rounded-2xl text-[11px] font-black text-emerald-600 shadow-xl border-b-4 border-emerald-200 -mt-2 ml-6">
              Misi Berjaya! 🏆
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. TANGGA MISI (Steps & Branches) */}
      <div className="relative z-30 flex flex-col-reverse gap-8 pb-4 w-full">
        {STEPS.map((step, index) => {
          const isDone = steps[step.key] || false;
          const isLocked = index > 0 && !steps[STEPS[index - 1].key];
          const isCurrent = !isDone && !isLocked;
          const Icon = step.icon;
          
          return (
            <motion.div 
              key={step.key} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }}
              className="relative flex items-center w-full"
            >
              {/* OTAN MEMANJAT PADA TAHAP SEMASA */}
              {isCurrent && (
                <motion.div 
                  initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }}
                  className="absolute left-1 sm:left-6 -top-12 text-5xl sm:text-6xl z-40 filter drop-shadow-[0_10px_10px_rgba(0,0,0,0.4)] transform -scale-x-100 animate-pulse origin-bottom"
                >
                  🦧
                </motion.div>
              )}

              {/* Tempat Paku di Batang Pokok (Tree Knot) */}
              <div className="absolute left-12 sm:left-[4.5rem] w-6 h-8 rounded-[100%] bg-[#2c1809] border-[3px] border-[#5C3A21] shadow-[inset_0_4px_4px_rgba(0,0,0,0.8)] z-20" />

              {/* Dahan Penyambung ke Tangga (Wooden Branch Peg) */}
              <div className="absolute left-14 sm:left-[5rem] w-10 sm:w-14 h-6 bg-gradient-to-b from-[#70421A] to-[#3A2210] border-b-4 border-black/40 z-10 rounded-r-full shadow-[0_6px_6px_rgba(0,0,0,0.3)]" />

              {/* Papan Tangga Misi (Wooden Plank Step) */}
              <button
                disabled={isLocked}
                onClick={() => !isLocked && onStepClick?.(step.key)}
                className={`ml-20 sm:ml-28 flex-1 max-w-[280px] p-4 sm:p-5 rounded-2xl border-b-[8px] transition-all flex items-center justify-between group relative overflow-hidden ${
                  isDone 
                    ? "bg-gradient-to-r from-emerald-500 to-green-600 border-green-800 text-white shadow-[0_10px_20px_rgba(16,185,129,0.3)] hover:brightness-110 active:border-b-0 active:translate-y-2" 
                    : isCurrent
                    ? "bg-gradient-to-r from-amber-400 to-orange-500 border-orange-700 text-white shadow-[0_15px_30px_rgba(245,158,11,0.4)] hover:brightness-110 active:border-b-0 active:translate-y-2 ring-4 ring-amber-300/40"
                    : "bg-[#D4C4B7] border-[#9E8E81] text-stone-500 opacity-90 cursor-not-allowed shadow-md"
                }`}
              >
                {/* Tekstur Papan Kayu Atas (Highlight) */}
                <div className="absolute top-0 left-0 right-0 h-3 bg-white/20 rounded-t-full pointer-events-none" />

                {/* Hiasan Daun pada Papan (jika siap/semasa) */}
                {!isLocked && (
                  <Leaf className={`absolute -bottom-2 -left-2 w-10 h-10 opacity-30 transform -rotate-45 pointer-events-none ${isDone ? 'fill-emerald-800 text-emerald-800' : 'fill-orange-800 text-orange-800'}`} />
                )}

                <div className="flex items-center gap-3 sm:gap-4 relative z-10">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shadow-inner border border-white/20 transform group-hover:rotate-6 transition-transform ${
                    isLocked ? 'bg-stone-400/30' : 'bg-white/20 backdrop-blur-sm'
                  }`}>
                    <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${isLocked ? 'text-stone-500' : 'text-white'}`} />
                  </div>
                  
                  <div className="text-left">
                    <span className="block text-[9px] sm:text-[10px] uppercase tracking-widest opacity-90 font-black mb-1 drop-shadow-sm">
                      Dahan {index + 1}
                    </span>
                    <span className="block text-sm sm:text-base font-black tracking-tight leading-none drop-shadow-md">
                      {step.label}
                    </span>
                  </div>
                </div>

                <div className={`shrink-0 relative z-10 p-2 sm:p-2.5 rounded-full shadow-inner ${isLocked ? 'bg-stone-300/50' : 'bg-black/15 backdrop-blur-sm'}`}>
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-lime-300 drop-shadow-md" />
                  ) : isLocked ? (
                    <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-stone-500" />
                  ) : (
                    <Play className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-200 fill-yellow-200 drop-shadow-md group-hover:scale-125 transition-transform" />
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