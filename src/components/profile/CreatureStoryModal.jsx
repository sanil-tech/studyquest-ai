// src/components/profile/CreatureStoryModal.jsx
// An illustrated storybook that teaches children about the Rakan Makhluk system.
// Multi-page modal with creature images, evolution stages, and simple Bahasa Melayu storytelling.

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CREATURES, getCreatureById } from "@/lib/avatarSystem";
import {
  Dialog, DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BookOpen, ChevronLeft, ChevronRight, Sparkles, Star, Heart, Zap } from "lucide-react";

const STORY_PAGES = [
  {
    icon: "🌳",
    bgGradient: "from-emerald-50 to-teal-50",
    title: "Hutan Ilmu yang Ajaib",
    text: "Pada zaman dahulu, di Hutan Ilmu yang ajaib, tiga makhluk kecil dilahirkan. Otan dari rimba, Pyro dari gunung berapi, dan Aqua dari lautan dalam. Mereka menunggu seorang penjelajah muda untuk menjadi rakan mereka...",
    showAllBabies: true,
  },
  {
    icon: "⭐",
    bgGradient: "from-amber-50 to-yellow-50",
    title: "Kuasa Ajaib Bernama XP",
    text: "Setiap kali kamu belajar, jawab kuiz, dan siapkan misi, kamu mengumpul kuasa ajaib bernama XP! XP ini bukan untuk kamu sahaja — ia juga memberi tenaga kepada rakan makhluk kamu untuk membesar!",
    showXP: true,
  },
  {
    icon: "🔄",
    bgGradient: "from-purple-50 to-indigo-50",
    title: "Rakan Makhluk Membesar!",
    text: "Setiap rakan makhluk mempunyai 3 tahap pertumbuhan. Apabila XP kamu cukup, rakan kamu akan berubah menjadi lebih kuat dan hebat! Lihat bagaimana Otan membesar...",
    showEvolution: true,
    evolutionCreatureId: "otan",
  },
  {
    icon: "🤝",
    bgGradient: "from-pink-50 to-rose-50",
    title: "Pilih Ran Kamu Hari Ini!",
    text: "Sekarang giliran kamu! Pilih rakan makhluk yang paling kamu suka. Dia akan menemani kamu dalam setiap pengembaraan belajar, dan membesar bersama kamu. Siapakah rakan pilihan kamu?",
    showAllCreatures: true,
  },
];

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
                {current.showAllBabies && (
                  <div className="flex gap-3">
                    {CREATURES.map((c) => (
                      <div key={c.id} className="text-center">
                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${c.bgGradient} border-2 ${c.borderColor} overflow-hidden shadow-sm`}>
                          <img src={c.stages[0].imageUrl} alt={c.name} className="w-full h-full object-cover" />
                        </div>
                        <p className={`text-[10px] font-black mt-1 ${c.textColor}`}>{c.name}</p>
                      </div>
                    ))}
                  </div>
                )}

                {current.showXP && (
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
                )}

                {current.showEvolution && (() => {
                  const creature = getCreatureById(current.evolutionCreatureId);
                  return (
                    <div className="flex items-end gap-2">
                      {creature.stages.map((stage, i) => (
                        <React.Fragment key={i}>
                          <div className="text-center">
                            <div className={`relative w-14 h-14 rounded-xl bg-gradient-to-br ${creature.bgGradient} border-2 ${creature.borderColor} overflow-hidden shadow-sm`}>
                              <img src={stage.imageUrl} alt={stage.name} className="w-full h-full object-cover" />
                              {i === 2 && (
                                <Star className="absolute -top-1 -right-1 w-4 h-4 text-amber-400 fill-amber-300" />
                              )}
                            </div>
                            <p className="text-[9px] font-bold text-slate-500 mt-1">T{stage.stage}</p>
                          </div>
                          {i < 2 && (
                            <ChevronRight className="w-4 h-4 text-slate-300 mb-4" />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  );
                })()}

                {current.showAllCreatures && (
                  <div className="grid grid-cols-3 gap-3">
                    {CREATURES.map((c) => (
                      <div key={c.id} className="text-center">
                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${c.bgGradient} border-2 ${c.borderColor} overflow-hidden shadow-sm`}>
                          <img src={c.stages[2].imageUrl} alt={c.name} className="w-full h-full object-cover" />
                        </div>
                        <p className={`text-[10px] font-black mt-1 ${c.textColor}`}>{c.name}</p>
                        <p className="text-[8px] text-slate-400">{c.title}</p>
                      </div>
                    ))}
                  </div>
                )}
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