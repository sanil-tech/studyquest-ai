// src/components/lesson/Flashcards.jsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Flashcards({ flashcards = [] }) {
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const next = () => { setFlipped(false); setCurrent(p => Math.min(p + 1, flashcards.length - 1)); };
  const prev = () => { setFlipped(false); setCurrent(p => Math.max(p - 1, 0)); };

  const card = flashcards[current];
  if (!card || flashcards.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground bg-muted/20 rounded-2xl border border-dashed">
        Tiada kad imbas tersedia untuk sesi ini.
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-100 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">🎮</span>
        <h3 className="font-heading font-bold text-amber-800">Permainan Kad Imbas</h3>
      </div>

      {/* Kontena Utama Kad dengan Ketinggian Dinamik (Diubah kepada h-52 supaya muat penjelasan panjang) */}
      <div className="relative h-52 mb-4" style={{ perspective: "1000px" }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            className="absolute inset-0 cursor-pointer"
            style={{ transformStyle: "preserve-3d" }}
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ duration: 0.4 }}
            onClick={() => setFlipped(!flipped)}
          >
            {/* 1. MUKA DEPAN KAD (SOALAN) */}
            <div
              className="absolute inset-0 flex flex-col items-center justify-center bg-white rounded-2xl border-2 border-amber-200 p-6 text-center shadow-sm select-none"
              style={{ backfaceVisibility: "hidden" }}
            >
              <span className="text-2xl mb-1">❓</span>
              <p className="text-xs font-semibold text-amber-500 uppercase tracking-wider mb-2">Soalan Kuiz</p>
              <p className="text-base sm:text-lg font-bold text-slate-800 leading-snug">{card.front}</p>
              <p className="text-[11px] text-muted-foreground mt-4 bg-slate-100 px-2 py-1 rounded-full animate-pulse">
                👉 Klik kad untuk semak jawapan
              </p>
            </div>

            {/* 2. MUKA BELAKANG KAD (JAWAPAN & PENJELASAN CIKGU AI) */}
            <div
              className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-center shadow-md select-none"
              style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
            >
              <span className="text-2xl mb-1">✨</span>
              <p className="text-xs font-semibold text-emerald-100 uppercase tracking-wider mb-1">Jawapan Betul</p>
              
              {/* Teks kandungan belakang menggunakan whitespace pre-line */}
              <div className="text-white max-w-full overflow-y-auto no-scrollbar">
                {/* Gaya pre-line membolehkan \n\n memisahkan jawapan dengan ulasan Cikgu */}
                <p className="text-sm font-medium leading-relaxed whitespace-pre-line bg-black/15 p-2.5 rounded-xl border border-white/10">
                  {card.back}
                </p>
              </div>
              <p className="text-[10px] text-emerald-200 mt-2">Klik semula untuk kembali ke soalan 🔄</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* BAHAGIAN NAVIGASI SEBELUM / SETERUSNYA */}
      <div className="flex items-center justify-between gap-2">
        <Button variant="outline" size="sm" onClick={prev} disabled={current === 0} className="rounded-xl h-9 text-xs font-medium border-amber-200 hover:bg-amber-100/50">
          <ChevronLeft className="w-4 h-4 mr-1" /> Sebelum
        </Button>
        
        {/* Titik Penunjuk Indikator (Dots) */}
        <div className="flex items-center gap-1.5 max-w-[120px] overflow-x-auto no-scrollbar">
          {flashcards.map((_, i) => (
            <span
              key={i}
              className={`h-2 rounded-full transition-all shrink-0 ${
                i === current ? "bg-amber-500 w-4" : i < current ? "bg-amber-300 w-2" : "bg-amber-100 w-2"
              }`}
            />
          ))}
        </div>

        <Button variant="outline" size="sm" onClick={next} disabled={current === flashcards.length - 1} className="rounded-xl h-9 text-xs font-medium border-amber-200 hover:bg-amber-100/50">
          Seterusnya <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}