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
  if (!card) return null;

  return (
    <div className="bg-gradient-to-br from-violet-50 to-pink-50 rounded-2xl p-5 border border-violet-100">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">🃏</span>
        <h3 className="font-heading font-bold text-violet-800">Kad Imbas (Flashcards)</h3>
      </div>

      <div className="relative h-44 mb-3" style={{ perspective: "1000px" }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            className="absolute inset-0 cursor-pointer"
            style={{ transformStyle: "preserve-3d" }}
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ duration: 0.4 }}
            onClick={() => setFlipped(!flipped)}
          >
            <div
              className="absolute inset-0 flex items-center justify-center bg-white rounded-2xl border-2 border-violet-200 p-6 text-center"
              style={{ backfaceVisibility: "hidden" }}
            >
              <div>
                <p className="text-xs text-violet-400 mb-2">Soalan</p>
                <p className="text-lg font-semibold text-violet-900">{card.front}</p>
                <p className="text-xs text-muted-foreground mt-3">Klik untuk flip 🔄</p>
              </div>
            </div>
            <div
              className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-6 text-center"
              style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
            >
              <div>
                <p className="text-xs text-violet-100 mb-2">Jawapan</p>
                <p className="text-lg font-semibold text-white">{card.back}</p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between gap-2">
        <Button variant="outline" size="sm" onClick={prev} disabled={current === 0} className="rounded-xl">
          <ChevronLeft className="w-4 h-4" /> Sebelum
        </Button>
        <div className="flex items-center gap-1">
          {flashcards.map((_, i) => (
            <span
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${
                i === current ? "bg-violet-500 scale-125" : i < current ? "bg-violet-300" : "bg-violet-100"
              }`}
            />
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={next} disabled={current === flashcards.length - 1} className="rounded-xl">
          Seterusnya <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}