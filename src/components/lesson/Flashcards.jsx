// src/components/lesson/Flashcards.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
// 🌟 PASTIKAN 'Sparkles' ADA DI DALAM SENARAI IMPORT INI:
import { ChevronLeft, ChevronRight, HelpCircle, Sparkles, CheckCircle2, RotateCcw, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Flashcards({ flashcards = [], lang = "ms" }) {
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [revealedCount, setRevealedCount] = useState(new Set());
  const [availableVoices, setAvailableVoices] = useState([]);

  // Muatkan senarai suara sistem operasi dengan selamat
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;

    const loadVoices = () => {
      setAvailableVoices(window.speechSynthesis.getVoices());
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Memburu suara manusia paling berkualiti tinggi mengikut slang subjek
  const dapatkanSuaraTerbaik = (bahasaMisi) => {
    if (availableVoices.length === 0) return null;

    if (bahasaMisi === "en") {
      const enVoices = availableVoices.filter(v => v.lang.includes("en-US") || v.lang.includes("en-GB"));
      return enVoices.find(v => v.name.toLowerCase().includes("natural") || v.name.toLowerCase().includes("neural")) ||
             enVoices.find(v => v.name.toLowerCase().includes("google")) ||
             enVoices[0];
    } else {
      const msVoices = availableVoices.filter(v => v.lang.includes("ms-MY") || v.lang.startsWith("ms"));
      if (msVoices.length === 0) return null;

      return msVoices.find(v => v.name.toLowerCase().includes("natural") || v.name.toLowerCase().includes("neural")) ||
             msVoices.find(v => v.name.toLowerCase().includes("online")) ||
             msVoices.find(v => v.name.toLowerCase().includes("google")) ||
             msVoices.find(v => v.name.toLowerCase().includes("amira")) ||
             msVoices[0];
    }
  };

  const extractEmojis = (text) => {
    if (!text) return "";
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{1F1E6}-\u{1F1FF}]/gu;
    const matches = text.match(emojiRegex);
    return matches ? matches.join("") : "";
  };

  const cleanText = (text) => {
    if (!text) return "";
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{1F1E6}-\u{1F1FF}]/gu;
    return text.replace(emojiRegex, "").trim();
  };

  const sebutTeks = (textToSpeak) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const textBersih = cleanText(textToSpeak);
      if (!textBersih) return;

      const utterance = new SpeechSynthesisUtterance(textBersih);
      const suaraTerbaik = dapatkanSuaraTerbaik(lang);

      if (suaraTerbaik) {
        utterance.voice = suaraTerbaik;
      } else {
        utterance.lang = lang === "en" ? "en-US" : "ms-MY";
      }

      utterance.rate = lang === "en" ? 0.90 : 0.88; 
      utterance.pitch = lang === "en" ? 1.0 : 1.05;

      window.speechSynthesis.speak(utterance);
    }
  };

  const card = flashcards[current];

  useEffect(() => {
    if (flashcards.length > 0 && card) {
      const textToSpeak = flipped ? card.back : card.front;
      const timer = setTimeout(() => sebutTeks(textToSpeak), 350);
      return () => clearTimeout(timer);
    }
  }, [current, flipped, flashcards, availableVoices]);

  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

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
      setRevealedCount(prev => new Set([...prev, current]));
    }
  };

  const resetGame = () => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setFlipped(false);
    setCurrent(0);
    setRevealedCount(new Set());
  };
  
  if (!card || flashcards.length === 0) {
    return (
      <div className="text-center py-12 text-sm text-muted-foreground bg-amber-50/40 rounded-3xl border-2 border-dashed border-amber-200 p-6">
        ✨ Belum ada kartu memori yang dimuat. Sila muatkan nota atau bank soalan terlebih dahulu!
      </div>
    );
  }

  const frontEmojis = extractEmojis(card.front);
  const backEmojis = extractEmojis(card.back);

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
      <div className="relative h-72 w-full cursor-pointer select-none" style={{ perspective: "1200px" }}>
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
            {/* FRONT OF CARD */}
            <div
              className="absolute inset-0 flex flex-col items-center justify-between bg-white rounded-3xl border-4 border-amber-400 p-6 text-center shadow-[0_10px_20px_rgba(251,191,36,0.15)] bg-[radial-gradient(#fef3c7_1px,transparent_1px)] [background-size:16px_16px]"
              style={{ backfaceVisibility: "hidden" }}
            >
              <button
                onClick={(e) => { e.stopPropagation(); sebutTeks(card.front); }}
                className="absolute top-4 right-4 p-2 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-full transition-transform active:scale-90 z-20 shadow-sm"
                title="Dengar semula"
              >
                <Volume2 className="w-4 h-4 animate-pulse" />
              </button>

              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center border-2 border-amber-300 shadow-inner shrink-0">
                <span className="text-xl">❓</span>
              </div>

              <div className="space-y-3 px-2 flex-1 flex flex-col justify-center items-center overflow-hidden">
                <span className="text-[9px] font-black tracking-widest text-amber-600 bg-amber-100 px-3 py-1 rounded-full uppercase shrink-0">
                  TEKA JAWAPAN
                </span>

                {frontEmojis && (
                  <div className="text-4xl sm:text-5xl filter drop-shadow-sm tracking-widest animate-bounce py-1 shrink-0">
                    {frontEmojis}
                  </div>
                )}

                <p className="text-sm sm:text-lg font-heading font-extrabold text-slate-800 leading-snug max-h-24 overflow-y-auto no-scrollbar">
                  {cleanText(card.front)}
                </p>
              </div>

              <div className="text-[10px] font-bold text-amber-700 bg-amber-400/20 px-4 py-1.5 rounded-xl border border-amber-400/30 shrink-0">
                Sentuh Kad Untuk Semak Jawapan ✨
              </div>
            </div>

            {/* BACK OF CARD */}
            <div
              className="absolute inset-0 flex flex-col items-center justify-between bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl border-4 border-emerald-400 p-5 text-center shadow-[0_10px_25px_rgba(16,185,129,0.25)] text-white"
              style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
            >
              <button
                onClick={(e) => { e.stopPropagation(); sebutTeks(card.back); }}
                className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 text-white rounded-full transition-transform active:scale-90 z-20 shadow-sm border border-white/10"
                title="Dengar semula"
              >
                <Volume2 className="w-4 h-4" />
              </button>

              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/40 shadow-inner shrink-0">
                <span className="text-xl">🎉</span>
              </div>

              <div className="w-full flex-1 flex flex-col justify-center items-center px-2 my-auto overflow-hidden">
                <span className="text-[9px] font-black tracking-widest text-emerald-100 bg-white/20 px-3 py-1 rounded-full uppercase border border-white/10 mb-2 shrink-0">
                  JAWAPAN TEPAT
                </span>
                
                {backEmojis && (
                  <div className="text-4xl sm:text-5xl filter drop-shadow-sm tracking-widest mb-2 shrink-0">
                    {backEmojis}
                  </div>
                )}
                
                <div className="w-full bg-black/15 p-3 sm:p-4 rounded-2xl border border-white/10 shadow-inner max-h-28 overflow-y-auto no-scrollbar">
                  <p className="text-xs sm:text-sm font-heading font-bold text-white text-center leading-relaxed whitespace-pre-line tracking-wide drop-shadow-sm">
                    {cleanText(card.back)}
                  </p>
                </div>
              </div>

              <div className="text-[10px] font-semibold text-emerald-100/90 flex items-center gap-1 bg-black/10 px-3 py-1 rounded-full shrink-0">
                Sentuh untuk kembali ke soalan 🔄
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* CONTROLS BAR */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <Button 
          variant="outline" 
          onClick={prev} 
          disabled={current === 0} 
          className="rounded-2xl h-11 px-4 text-xs font-bold border-2 border-slate-200 active:scale-95 transition-transform shadow-sm disabled:opacity-50"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Sebelum
        </Button>

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

      <p className="text-center text-[10px] font-bold text-amber-800/60 flex items-center justify-center gap-1 bg-amber-400/5 py-1.5 rounded-xl border border-dashed border-amber-400/20">
        <HelpCircle className="w-3 h-3"/> Menjana suara manusia dengan loghat Malaysia asli! 🇲🇾
      </p>
      
    </div>
  );
}