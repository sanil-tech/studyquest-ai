// src/components/profile/CreatureStoryModal.jsx
// An illustrated storybook that teaches children about the Rakan Makhluk system.
// Covers: 6 subject mascots, XP mechanics, 10 evolution levels, and creature selection.

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CREATURES, getCreatureById } from "@/lib/avatarSystem";
import {
  Dialog, DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BookOpen, ChevronLeft, ChevronRight, Heart, Zap } from "lucide-react";

const STORY_PAGES = [
  {
    icon: "🌳",
    bgGradient: "from-emerald-50 to-teal-50",
    title: "Hutan Ilmu yang Ajaib",
    text: "Di Hutan Ilmu yang ajaib, enam penjaga bijak hidup. Setiap penjaga mewakili satu subjek sekolah. Mereka menunggu seorang penjelajah muda untuk menjadi rakan mereka...",
    type: "allBabies",
  },
  {
    icon: "⭐",
    bgGradient: "from-amber-50 to-yellow-50",
    title: "Kuasa Ajaib Bernama XP",
    text: "Setiap kali kamu belajar, jawab kuiz, dan siapkan misi, kamu mengumpul kuasa ajaib bernama XP! XP ini memberi tenaga kepada rakan makhluk kamu untuk membesar!",
    type: "xp",
  },
  {
    icon: "🥚",
    bgGradient: "from-indigo-50 to-blue-50",
    title: "10 Tahap Evolusi",
    text: "Setiap rakan makhluk mempunyai 10 tahap pertumbuhan! Bermula dari telur kecil, menjadi bayi, dewasa, dan akhirnya Raja Penjaga! Lihat perjalanan Numerix...",
    type: "evolution",
    evolutionCreatureId: "mat",
  },
  {
    icon: "🔄",
    bgGradient: "from-purple-50 to-violet-50",
    title: "Setiap Subjek Ada Penjaga",
    text: "Matematik ada Numerix 🦉, English ada Lexis 🦊, Sains ada Sparky 🐭, Sejarah ada Shelldon 🐢, Geografi ada Skyler 🦅, dan Bahasa Melayu ada Rimau 🐯!",
    type: "allCreatures",
  },
  {
    icon: "🤝",
    bgGradient: "from-pink-50 to-rose-50",
    title: "Pilih Rakan Kamu Hari Ini!",
    text: "Sekarang giliran kamu! Pilih rakan makhluk yang paling kamu suka. Dia akan menemani kamu dalam setiap pengembaraan belajar, dan membesar bersama kamu melalui 10 tahap!",
    type: "choose",
  },
];

function StoryIllustration({ page }) {
  if (page.type === "allBabies") {
    return (
      <div className="grid grid-cols-3 gap-2">
        {CREATURES.map((c) => (
          <div key={c.id} className="text-center">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${c.bgGradient} border-2 ${c.borderColor} flex items-center justify-center text-3xl shadow-sm`}>
              {c.stages[0].emoji}
            </div>
            <p className={`text-[9px] font-black mt-1 ${c.textColor}`}>{c.name}</p>
          </div>
        ))}
      </div>
    );
  }

  if (page.type === "xp") {
    return (
      <div className="flex flex-col items-center gap-2">
        <motion.div
          animate={{ y: [0, -8, 0], rotate: [0, 5, -5, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-16 h-16 rounded-2xl bg-amber-100 border-2 border-amber-300 flex items-center justify-center shadow"
        >
          <Zap className="w-8 h-8 text-amber-500 fill-amber-400" />
        </motion.div>
        <p className="text-xs font-black text-amber-600">XP = Tenaga Membesar!</p>
      </div>
    );
  }

  if (page.type === "evolution") {
    const creature = getCreatureById(page.evolutionCreatureId);
    return (
      <div className="w-full">
        <div className="flex items-center justify-between gap-0.5 overflow-x-auto pb-1">
          {creature.stages.map((stage, i) => (
            <React.Fragment key={i}>
              <div className="flex flex-col items-center gap-0.5 shrink-0">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${creature.bgGradient} border ${creature.borderColor} flex items-center justify-center text-base`}>
                  {stage.emoji}
                </div>
                <span className="text-[7px] font-black text-slate-400">{stage.stage}</span>
              </div>
              {i < creature.stages.length - 1 && (
                <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>
        <p className="text-center text-[10px] font-bold text-slate-400 mt-2">
          Dari telur ke Raja! 10 tahap pertumbuhan.
        </p>
      </div>
    );
  }

  if (page.type === "allCreatures" || page.type === "choose") {
    return (
      <div className="grid grid-cols-3 gap-3">
        {CREATURES.map((c) => (
          <div key={c.id} className="text-center">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${c.bgGradient} border-2 ${c.borderColor} flex items-center justify-center text-3xl shadow-sm`}>
              {c.emoji}
            </div>
            <p className={`text-[9px] font-black mt-1 ${c.textColor}`}>{c.name}</p>
            <p className="text-[7px] text-slate-400">{c.subjectIcon} {c.subject}</p>
          </div>
        ))}
      </div>
    );
  }

  return null;
}

export default function CreatureStoryModal({ open, onClose }) {
  const [page, setPage] = useState(0);

  const handleNext = () => {
    if (page < STORY_PAGES.length - 1) {
      setPage(page + 1);
    } else {
      handleReset();
      onClose();
    }
  };

  const handlePrev = () => {
    if (page > 0) setPage(page - 1);
  };

  const handleReset = () => setPage(0);

  const current = STORY_PAGES[page];
  const isLastPage = page === STORY_PAGES.length - 1;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleReset(); onClose(); }}>
      <DialogContent className="max-w-lg p-0 overflow-hidden rounded-3xl">
        {/* Story Page */}
        <div className={`relative bg-gradient-to-b ${current.bgGradient} min-h-[460px] flex flex-col`}>
          {/* Page indicator dots */}
          <div className="flex justify-center gap-1.5 pt-4">
            {STORY_PAGES.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === page ? "w-6 bg-emerald-500" : "w-1.5 bg-slate-300"
                }`}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col items-center justify-center px-6 py-4 text-center"
            >
              {/* Page Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.1, type: "spring" }}
                className="text-5xl mb-3"
              >
                {current.icon}
              </motion.div>

              {/* Title */}
              <h2 className="text-lg font-black text-slate-800 mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-500" />
                {current.title}
              </h2>

              {/* Story Text */}
              <p className="text-sm text-slate-600 leading-relaxed max-w-xs mb-4">
                {current.text}
              </p>

              {/* Illustration Area */}
              <div className="w-full flex justify-center">
                <StoryIllustration page={current} />
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between px-6 pb-5 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrev}
              disabled={page === 0}
              className="text-slate-500 hover:bg-white/50 rounded-xl text-xs font-bold h-9 disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Undur
            </Button>

            <span className="text-[10px] font-bold text-slate-400">
              {page + 1} / {STORY_PAGES.length}
            </span>

            <Button
              size="sm"
              onClick={handleNext}
              className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black h-9 px-5"
            >
              {isLastPage ? (
                <>
                  <Heart className="w-4 h-4 mr-1" /> Selesai!
                </>
              ) : (
                <>
                  Seterusnya <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}