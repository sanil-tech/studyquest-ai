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

  // Initialize and shuffle cards
  const initializeGame = () => {
    if (!questions || questions.length === 0) return;

    // Take up to 6 questions to make 12 cards (perfect for mobile grid)
    const gameQuestions = questions.slice(0, 6);
    
    let deck = [];
    gameQuestions.forEach((q, index) => {
      // Create two cards for each question (Question & Answer)
      deck.push({ id: `q-${index}`, text: q.question, pairId: index, type: "question" });
      deck.push({ id: `a-${index}`, text: q.correct_answer || q.correctAnswer, pairId: index, type: "answer" });
    });

    // Shuffle array using Fisher-Yates
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
    // Prevent flipping if locked, already flipped, or already matched
    if (isLocked || flippedIndices.includes(index) || matchedPairs.includes(cards[index].pairId)) return;

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setIsLocked(true);
      setMoves((prev) => prev + 1);

      const card1 = cards[newFlipped[0]];
      const card2 = cards[newFlipped[1]];

      if (card1.pairId === card2.pairId) {
        // Match found!
        setMatchedPairs((prev) => [...prev, card1.pairId]);
        setFlippedIndices([]);
        setIsLocked(false);
        
        // Check win condition
        if (matchedPairs.length + 1 === cards.length / 2) {
          confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        }
      } else {
        // No match, flip back after 1 second
        setTimeout(() => {
          setFlippedIndices([]);
          setIsLocked(false);
        }, 1000);
      }
    }
  };

  const isGameWon = matchedPairs.length === cards.length / 2 && cards.length > 0;

  if (cards.length === 0) {
    return <div className="text-center p-6 text-stone-500 font-bold">⚠️ Tiada data soalan untuk permainan memori.</div>;
  }

  return (
    <div className="bg-stone-50 p-4 sm:p-6 rounded-2xl border-2 border-emerald-100 shadow-inner">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm sm:text-base font-black text-emerald-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Misi Memori Rimba
          </h3>
          <p className="text-xs text-stone-500 font-bold mt-1">Cari pasangan soalan dan jawapan yang betul!</p>
        </div>
        <div className="bg-white px-3 py-1.5 rounded-xl border-2 border-stone-200 text-xs font-black text-stone-700 shadow-sm">
          Langkah: <span className="text-amber-600">{moves}</span>
        </div>
      </div>

      {isGameWon ? (
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-gradient-to-br from-emerald-400 to-teal-500 p-6 rounded-2xl text-center shadow-md border-2 border-emerald-300">
          <Trophy className="w-12 h-12 text-yellow-300 mx-auto mb-3 animate-bounce" />
          <h2 className="text-lg font-black text-white mb-2">Terbaik, Wira Rimba!</h2>
          <p className="text-emerald-50 text-xs font-bold mb-5">Anda berjaya memadankan semua daun ilmu dengan hanya {moves} langkah.</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={initializeGame} className="bg-emerald-700 hover:bg-emerald-800 text-white border-0 shadow-[0_4px_0_#064e3b] active:translate-y-1 active:shadow-none text-xs rounded-xl font-black">
              <RotateCcw className="w-4 h-4 mr-2" /> Main Semula
            </Button>
            {onComplete && (
              <Button onClick={onComplete} className="bg-amber-400 hover:bg-amber-500 text-stone-900 border-0 shadow-[0_4px_0_#b45309] active:translate-y-1 active:shadow-none text-xs rounded-xl font-black">
                Ambil +15 XP 🍃
              </Button>
            )}
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {cards.map((card, index) => {
            const isFlipped = flippedIndices.includes(index);
            const isMatched = matchedPairs.includes(card.pairId);

            return (
              <div 
                key={index} 
                onClick={() => handleCardClick(index)}
                className={`relative w-full aspect-[4/3] cursor-pointer transition-all duration-300 transform preserve-3d ${
                  isFlipped || isMatched ? "rotate-y-180" : "hover:-translate-y-1"
                }`}
                style={{ perspective: "1000px" }}
              >
                {/* FRONT OF CARD (Leaf Design) */}
                <div className={`absolute inset-0 w-full h-full backface-hidden rounded-xl border-b-4 flex items-center justify-center p-2 transition-all duration-300 ${
                  isFlipped || isMatched ? "opacity-0" : "bg-emerald-500 border-emerald-700 shadow-md"
                }`}>
                  <Leaf className="w-8 h-8 text-emerald-300 opacity-50" />
                </div>

                {/* BACK OF CARD (Question/Answer Data) */}
                <div className={`absolute inset-0 w-full h-full backface-hidden rounded-xl border-b-4 flex items-center justify-center p-3 text-center transition-all duration-300 ${
                  isFlipped || isMatched ? "opacity-100 rotate-y-180" : "opacity-0"
                } ${
                  isMatched 
                    ? "bg-lime-200 border-lime-400 text-emerald-900" 
                    : "bg-amber-100 border-amber-300 text-amber-950"
                }`}>
                  <span className="text-[10px] sm:text-xs font-black line-clamp-3 leading-tight">
                    {card.text}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
