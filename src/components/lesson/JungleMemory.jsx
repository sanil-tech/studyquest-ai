// src/components/lesson/JungleMemory.jsx
import React, { useState, useEffect } from "react";
import { Leaf, Sparkles, Trophy, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";

export default function JungleMemory({ questions = [], onComplete }) {
  const [cards, setCards] = useState([]);
  const [flippedIndices, setFlippedIndices] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [moves, setMoves] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  // Fungsi untuk memulakan dan mengocok kad (Shuffle)
  const initializeGame = () => {
    if (!questions || questions.length === 0) return;

    // Ambil maksimum 6 soalan untuk dijadikan 12 kad (Saiz optimum untuk grid telefon bimbit)
    const gameQuestions = questions.slice(0, 6);
    
    let deck = [];
    gameQuestions.forEach((q, index) => {
      // Pasangkan Soalan dan Jawapan dengan pairId yang sama
      deck.push({ id: `q-${index}`, text: q.question, pairId: index, type: "question" });
      deck.push({ id: `a-${index}`, text: q.correct_answer || q.correctAnswer, pairId: index, type: "answer" });
    });

    // Algoritma Fisher-Yates Shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    setCards(deck);
    setFlippedIndices([]);
    setMatchedPairs([]);
    setMoves(0);
    setIsLocked(false);
  };

  useEffect(() => {
    initializeGame();
  }, [questions]);

  const handleCardClick = (index) => {
    // Sekat klik jika animasi sedang berjalan, kad sudah terbuka, atau sudah berpadanan
    if (isLocked || flippedIndices.includes(index) || matchedPairs.includes(cards[index].pairId)) return;

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setIsLocked(true);
      setMoves((prev) => prev + 1);

      const firstCard = cards[newFlipped[0]];
      const secondCard = cards[newFlipped[1]];

      // Semak jika pairId sepadan
      if (firstCard.pairId === secondCard.pairId) {
        setMatchedPairs((prev) => [...prev, firstCard.pairId]);
        setFlippedIndices([]);
        setIsLocked(false);
        
        // Cetus konfeti jika semua kad berjaya dipadankan
        if (matchedPairs.length + 1 === cards.length / 2) {
          confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        }
      } else {
        // Jika salah, tutup semula kad selepas 1 saat
        setTimeout(() => {
          setFlippedIndices([]);
          setIsLocked(false);
        }, 1000);
      }
    }
  };

  const isGameWon = matchedPairs.length === cards.length / 2 && cards.length > 0;

  if (cards.length === 0) {
    return (
      <div className="text-center p-8 bg-stone-50 border-2 border-dashed border-stone-200 rounded-2xl text-stone-500 font-bold text-xs">
        ⚠️ Tiada data soalan yang mencukupi untuk memulakan Misi Memori Rimba.
      </div>
    );
  }

  return (
    <div className="bg-stone-50/60 p-4 sm:p-6 rounded-2xl border-2 border-emerald-100 shadow-inner">
      {/* PENGURUS SKOR & STATUS PERMAINAN */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm sm:text-base font-black text-emerald-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
            Misi Memori Rimba 🌳
          </h3>
          <p className="text-[11px] text-stone-500 font-bold mt-0.5">Padankan daun "Soalan" dengan daun "Jawapan" yang betul, Bah!</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl border-2 border-stone-200 text-xs font-black text-stone-700 shadow-xs">
          Langkah: <span className="text-amber-600 text-sm">{moves}</span>
        </div>
      </div>

      {/* SKRIN TAHNIAH MENANG PERMAINAN */}
      {isGameWon ? (
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          className="bg-gradient-to-br from-emerald-400 to-teal-600 p-6 rounded-2xl text-center shadow-md border-2 border-emerald-300"
        >
          <Trophy className="w-12 h-12 text-yellow-300 mx-auto mb-3 animate-bounce" />
          <h2 className="text-base sm:text-lg font-black text-white mb-1">Dahsyat, Wira Rimba! 🏆</h2>
          <p className="text-emerald-50 text-xs font-bold mb-5">Anda berjaya memulihkan memori Oki dengan {moves} langkah sahaja.</p>
          <div className="flex gap-4 justify-center">
            <Button 
              onClick={initializeGame} 
              className="bg-emerald-700 hover:bg-emerald-800 text-white border-0 shadow-[0_4px_0_#064e3b] active:translate-y-1 active:shadow-none text-xs rounded-xl font-black h-10 px-4 transition-all"
            >
              <RotateCcw className="w-4 h-4 mr-1.5" /> Main Semula
            </Button>
            {onComplete && (
              <Button 
                onClick={onComplete} 
                className="bg-amber-400 hover:bg-amber-500 text-stone-900 border-0 shadow-[0_4px_0_#d97706] active:translate-y-1 active:shadow-none text-xs rounded-xl font-black h-10 px-4 transition-all"
              >
                Tuntut Ganjaran Misi 🍃
              </Button>
            )}
          </div>
        </motion.div>
      ) : (
        /* GRID KAD MEMORI UTAMA */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {cards.map((card, index) => {
            const isFlipped = flippedIndices.includes(index);
            const isMatched = matchedPairs.includes(card.pairId);
            const showContent = isFlipped || isMatched;

            return (
              <div 
                key={card.id + index} 
                onClick={() => handleCardClick(index)}
                className="relative w-full aspect-[4/3] cursor-pointer"
                style={{ perspective: "1000px" }}
              >
                <div 
                  className={`relative w-full h-full duration-500 [transform-style:preserve-3d] transition-transform ${
                    showContent ? "[transform:rotateY(180deg)]" : "hover:-translate-y-0.5"
                  }`}
                >
                  {/* DESIGN KAD DEPAN (Bentuk Daun Hutan) */}
                  <div className={`absolute inset-0 w-full h-full [backface-visibility:hidden] rounded-xl border-b-4 flex items-center justify-center p-2 transition-colors bg-emerald-500 border-emerald-700 shadow-md ${
                    showContent ? "pointer-events-none" : ""
                  }`}>
                    <Leaf className="w-7 h-7 text-emerald-300/60 animate-pulse" />
                  </div>

                  {/* DESIGN KAD BELAKANG (Paparan Kandungan Teks Data) */}
                  <div className={`absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-xl border-b-4 flex items-center justify-center p-2.5 text-center shadow-md overflow-hidden ${
                    isMatched 
                      ? "bg-lime-100 border-lime-400 text-emerald-950" 
                      : "bg-amber-100 border-amber-300 text-amber-950"
                  }`}>
                    <span className="text-[10px] sm:text-xs font-black line-clamp-3 leading-tight tracking-wide">
                      {card.text}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
