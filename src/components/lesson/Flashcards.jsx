// src/components/lesson/Flashcards.jsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, HelpCircle, Sparkles, CheckCircle2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Flashcards({ flashcards = [] }) {
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [revealedCount, setRevealedCount] = useState(new Set());

  const next = () => { 
    setFlipped(false); 
    setCurrent(p => Math.min(p + 1, flashcards.length - 1)); 
  };
  
  const prev = () => { 
    setFlipped(false); 
    setCurrent(p => Math.max(p - 1, 0)); 
  };

  const handleFlip = () => {
    setFlipped(!flipped);
    if (!flipped) {
      // Catat kartu yang sudah dibuka oleh anak untuk indikator progres cerdas
      setRevealedCount(prev => new Set([...prev, current]));
    }
  };

  const resetGame = () => {
    setFlipped(false);
    setCurrent(0);
    setRevealedCount(new Set());
  };

  const card = flashcards[current];
  
  if (!card || flashcards.length === 0) {
    return (
      <div className="text-center py-12 text-sm text-muted-foreground bg-amber-50/40 rounded-3xl border-2 border-dashed border-amber-200 p-6">
        ✨ Belum ada kartu memori yang dimuat. Sila muatkan nota atau bank soalan terlebih dahulu!
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-amber-50 via-white to-orange-50 rounded-3xl p-6 border-4 border-amber-400/40 shadow-[0_8px_0_0_rgba(251,191,36,0.2)] max-w-xl mx-auto space-y-6">
      
      {/* HEADER GAME BAR */}
      <div className="flex items-center justify-between bg-amber-100/70 p-3 rounded-2xl border border-amber-200">
        <div className="flex items-center gap-2">
          <div className="bg-amber-400 p-1.5 rounded-xl text-amber-950 shadow-sm animate-bounce">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading font-black text-amber-900 text-sm sm:text-base tracking-wide">
              CABARAN KAD IMBAS
            </h3>
            <p className="text-[10px] text-amber-700 font-medium">
              Kad {current + 1} daripada {flashcards.length}
            </p>
          </div>
        </div>
        
        {/* PROGRES ICON BAR */}
        <div className="flex items-center gap-1.5 bg-white/90 px-3 py-1.5 rounded-xl border border-amber-200/60 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span className="text-xs font-bold text-slate-700">
            {revealedCount.size}/{flashcards.length} Selesai
          </span>
        </div>
      </div>

      {/* MAIN 3D FLIP CONTAINER */}
      <div className="relative h-64 w-full cursor-pointer select-none" style={{ perspective: "1200px" }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            className="absolute inset-0 w-full h-full"
            style={{ transformStyle: "preserve-3d" }}
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            onClick={handleFlip}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* ========================================== */}
            {/* MUKA DEPAN KAD (SOALAN YANG MENARIK)     */}
            {/* ========================================== */}
            <div
              className="absolute inset-0 flex flex-col items-center justify-between bg-white rounded-3xl border-4 border-amber-400 p-6 text-center shadow-[0_10px_20px_rgba(251,191,36,0.15)] bg-[radial-gradient(#fef3c7_1px,transparent_1px)] [background-size:16px_16px]"
              style={{ backfaceVisibility: "hidden" }}
            >
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center border-2 border-amber-300 shadow-inner">
                <span className="text-2xl animate-pulse">❓</span>
              </div>

              <div className="space-y-2 px-2 max-y-32 overflow-y-auto no-scrollbar">
                <span className="text-[10px] font-black tracking-widest text-amber-600 bg-amber-100 px-3 py-1 rounded-full uppercase">
                  TEKA JAWAPAN
                </span>
                <p className="text-base sm:text-xl font-heading font-extrabold text-slate-800 leading-snug">
                  {card.front}
                </p>
              </div>

              <div className="text-[11px] font-bold text-amber-700 bg-amber-400/20 px-4 py-1.5 rounded-xl border border-amber-400/30">
                Klik Kad Untuk Semak ✨
              </div>
            </div>

 {/* ========================================== */}
{/* MUKA BELAKANG KAD (JAWAPAN & ULASAN CERIA) */}
{/* ========================================== */}
<div
  className="absolute inset-0 flex flex-col items-center justify-between bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl border-4 border-emerald-400 p-6 text-center shadow-[0_10px_25px_rgba(16,185,129,0.25)] text-white"
  style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
>
  {/* Icon bahagian atas */}
  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/40 shadow-inner shrink-0">
    <span className="text-2xl animate-pulse">🎉</span>
  </div>

  {/* KONTENA UTAMA JAWAPAN (DIBESARKAN & DITENGAHKAN) */}
  <div className="w-full flex-1 flex flex-col justify-center items-center my-auto px-1 max-h-36 overflow-y-auto no-scrollbar">
    <span className="text-[10px] font-black tracking-widest text-emerald-100 bg-white/20 px-3 py-1 rounded-full uppercase border border-white/10 mb-2">
      JAWAPAN TEPAT
    </span>
    
    {/* Teks kini bersaiz lebih besar (text-lg sm:text-xl), tebal (font-extrabold), dan berada tepat di tengah (text-center) */}
    <div className="w-full bg-black/20 p-4 rounded-2xl border border-white/20 shadow-inner">
      <p className="text-lg sm:text-xl font-heading font-black text-white text-center leading-relaxed whitespace-pre-line tracking-wide drop-shadow-md">
        {card.back}
      </p>
    </div>
  </div>

  {/* Arahan navigasi bawah */}
              <div className="text-[10px] font-semibold text-emerald-100/90 flex items-center gap-1 bg-black/10 px-3 py-1 rounded-full">
                Klik kad untuk lihat soalan semula 🔄
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* NAVIGASI KAWALAN BAWAH */}
      <div className="flex items-center justify-between gap-3 pt-2">
        {/* Butang Sebelum */}
        <Button 
          variant="outline" 
          onClick={prev} 
          disabled={current === 0} 
          className="rounded-2xl h-11 px-4 text-xs font-bold border-2 border-slate-200 active:scale-95 transition-transform shadow-sm disabled:opacity-50"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Sebelum
        </Button>

        {/* Indikator Titik (Dots Progress) */}
        <div className="flex items-center gap-1.5 max-w-[140px] overflow-x-auto no-scrollbar py-1 px-2 bg-slate-100 rounded-full border border-slate-200/60 shadow-inner">
          {flashcards.map((_, i) => (
            <span
              key={i}
              className={`h-2.5 rounded-full transition-all duration-300 shrink-0 ${
                i === current 
                  ? "bg-amber-500 w-5" 
                  : revealedCount.has(i) 
                    ? "bg-emerald-400 w-2.5" 
                    : "bg-slate-300 w-2.5"
              }`}
            />
          ))}
        </div>

        {/* Butang Seterusnya / Main Semula */}
        {current === flashcards.length - 1 ? (
          <Button 
            onClick={resetGame} 
            className="rounded-2xl h-11 px-4 text-xs font-black bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white active:scale-95 transition-transform shadow-md"
          >
            <RotateCcw className="w-4 h-4 mr-1" /> Main Semula
          </Button>
        ) : (
          <Button 
            variant="outline" 
            onClick={next} 
            disabled={current === flashcards.length - 1} 
            className="rounded-2xl h-11 px-4 text-xs font-bold border-2 border-slate-200 active:scale-95 transition-transform shadow-sm"
          >
            Seterusnya <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>

      {/* EXTRA INFO FOOTER BANNER */}
      <p className="text-center text-[10px] font-bold text-amber-800/60 flex items-center justify-center gap-1 bg-amber-400/5 py-1.5 rounded-xl border border-dashed border-amber-400/20">
        <HelpCircle className="w-3 h-3"/> Kad dicabut secara rawak dinamik daripada kolam 50 bank soalan tersedia!
      </p>
      
    </div>
  );
}