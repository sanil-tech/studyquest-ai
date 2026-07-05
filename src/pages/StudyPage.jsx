import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Trophy, Sparkles, RefreshCcw, ArrowRight, Check, XCircle, Heart
} from "lucide-react";
import { Button } from "@/components/ui/button";

// MOCK MISSION DATA
const missionData = {
  title: "Mission: Jungle Fractions",
  totalQuestions: 4,
  questions: [
    { id: 1, text: "Which fraction is equivalent to 1/2?", options: ["2/4", "1/3", "3/8", "4/5"], answer: "2/4" },
    { id: 2, text: "What is 1/4 + 1/4?", options: ["2/8", "1/2", "1/8", "1/16"], answer: "1/2" },
    { id: 3, text: "Which is larger?", options: ["1/3", "1/4", "1/5", "1/6"], answer: "1/3" },
    { id: 4, text: "Simplify 5/10.", options: ["1/5", "2/5", "1/2", "5/1"], answer: "1/2" }
  ]
};

export default function MissionQuizPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);
  const [mistakes, setMistakes] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const currentQuestion = missionData.questions[currentIndex];
  const progressPercentage = ((currentIndex) / missionData.totalQuestions) * 100;
  const hasPassed = mistakes === 0; // 100% required to pass!

  const handleCheck = () => {
    if (!selectedAnswer) return;
    
    setIsChecking(true);
    const correct = selectedAnswer === currentQuestion.answer;
    setIsCorrect(correct);
    
    if (!correct) {
      setMistakes(prev => prev + 1);
    }
  };

  const handleNext = () => {
    setIsChecking(false);
    setSelectedAnswer(null);
    setIsCorrect(null);
    
    if (currentIndex < missionData.totalQuestions - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsFinished(true);
    }
  };

  const handleRetake = () => {
    setCurrentIndex(0);
    setMistakes(0);
    setIsFinished(false);
    setSelectedAnswer(null);
    setIsChecking(false);
  };

  // --- VIEW: RESULTS SCREEN (PASS OR FAIL) ---
  if (isFinished) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full bg-white rounded-3xl p-8 border-2 border-slate-100 shadow-xl text-center relative mt-16"
        >
          {/* Floating Avatar */}
          <div className="absolute -top-24 left-1/2 transform -translate-x-1/2 flex flex-col items-center z-10">
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className={`text-[11px] font-black px-4 py-2 rounded-2xl border-2 shadow-md mb-2 whitespace-nowrap uppercase tracking-wider relative ${
                hasPassed ? "bg-emerald-100 border-emerald-300 text-emerald-700" : "bg-orange-100 border-orange-300 text-orange-700"
              }`}
            >
              {hasPassed ? "Flawless Victory!" : "We need 100%!"}
              <div className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 border-4 border-transparent ${
                hasPassed ? "border-t-emerald-100" : "border-t-orange-100"
              }`} />
            </motion.div>
            
            <motion.div 
              animate={{ y: [0, -8, 0], scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="text-8xl drop-shadow-2xl"
            >
              🦧
              {/* Note: Replace 🦧 with your 3D Bornean Orangutan image tag! */}
            </motion.div>
          </div>

          <div className="mt-12 space-y-4">
            {hasPassed ? (
              <>
                <h1 className="text-3xl font-heading font-black text-emerald-500 tracking-tight">Mission Complete!</h1>
                <p className="text-slate-500 font-medium text-sm">You scored 100% and mastered this topic. Awesome job, Explorer!</p>
                <div className="bg-amber-100 border-2 border-amber-300 rounded-2xl p-4 flex items-center justify-center gap-3">
                  <Trophy className="w-8 h-8 text-amber-500" />
                  <div className="text-left">
                    <p className="text-xs font-bold text-amber-700 uppercase">Rewards Earned</p>
                    <p className="text-xl font-black text-amber-600">+50 XP</p>
                  </div>
                </div>
                <Button className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-black py-6 rounded-2xl text-base uppercase tracking-wider shadow-lg border-b-4 border-emerald-700 active:border-b-0 active:translate-y-1 transition-all mt-4">
                  Next Mission
                </Button>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-heading font-black text-slate-800 tracking-tight">Mission Failed</h1>
                <p className="text-slate-500 font-medium text-sm">You made <span className="text-rose-500 font-bold">{mistakes} mistake{mistakes > 1 ? "s" : ""}</span>. To complete this mission, you need a perfect score!</p>
                <div className="bg-slate-100 border-2 border-slate-200 rounded-2xl p-4 flex items-center justify-center gap-3">
                  <RefreshCcw className="w-8 h-8 text-slate-400" />
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-500 uppercase">Don't Give Up</p>
                    <p className="text-base font-black text-slate-700">Practice makes perfect.</p>
                  </div>
                </div>
                <Button 
                  onClick={handleRetake}
                  className="w-full bg-orange-500 hover:bg-orange-400 text-white font-black py-6 rounded-2xl text-base uppercase tracking-wider shadow-lg border-b-4 border-orange-700 active:border-b-0 active:translate-y-1 transition-all mt-4"
                >
                  Retake Mission
                </Button>
              </>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  // --- VIEW: ACTIVE QUIZ SCREEN ---
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Top Header & Progress Bar */}
      <div className="w-full max-w-3xl mx-auto px-4 py-6 flex items-center gap-4 z-10 relative">
        <button className="text-slate-400 hover:text-slate-600 transition-colors">
          <X className="w-7 h-7 stroke-[2.5]" />
        </button>
        
        <div className="flex-1 h-4 bg-slate-200 rounded-full overflow-hidden relative">
          <motion.div 
            className="absolute top-0 left-0 bottom-0 bg-emerald-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {/* Highlight strip for 3D effect on progress bar */}
            <div className="absolute top-1 left-2 right-2 h-1 bg-white/30 rounded-full" />
          </motion.div>
        </div>

        {/* Gamified 100% Tracker (Shows red if they messed up) */}
        <div className="flex items-center gap-1.5">
          <Heart className={`w-7 h-7 stroke-[2.5] ${mistakes === 0 ? "fill-rose-500 text-rose-600" : "fill-slate-200 text-slate-300"}`} />
        </div>
      </div>

      {/* Main Question Area */}
      <main className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 pb-32 pt-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex-1"
          >
            <h2 className="text-2xl sm:text-3xl font-heading font-black text-slate-800 tracking-tight leading-snug mb-8">
              {currentQuestion.text}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {currentQuestion.options.map((option, i) => {
                const isSelected = selectedAnswer === option;
                
                // Determine styling based on checking state
                let cardStyle = "bg-white border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 text-slate-700";
                
                if (isSelected) {
                  cardStyle = "bg-indigo-50 border-indigo-400 text-indigo-700 ring-4 ring-indigo-100";
                }
                
                // Once checked, reveal correct/incorrect colors
                if (isChecking) {
                  if (option === currentQuestion.answer) {
                    cardStyle = "bg-emerald-50 border-emerald-500 text-emerald-700 ring-4 ring-emerald-100";
                  } else if (isSelected && option !== currentQuestion.answer) {
                    cardStyle = "bg-rose-50 border-rose-500 text-rose-700 ring-4 ring-rose-100";
                  } else {
                    cardStyle = "bg-white border-slate-200 text-slate-400 opacity-50";
                  }
                }

                return (
                  <button
                    key={i}
                    disabled={isChecking}
                    onClick={() => setSelectedAnswer(option)}
                    className={`
                      relative p-5 sm:p-6 rounded-2xl border-2 transition-all duration-200
                      font-bold text-lg text-center shadow-sm active:scale-[0.98]
                      ${cardStyle}
                    `}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Dynamic Bottom Action Bar */}
      <div className={`fixed bottom-0 left-0 right-0 border-t-2 transition-colors duration-300 z-50 ${
        !isChecking ? "bg-white border-slate-200" 
        : isCorrect ? "bg-emerald-100 border-emerald-200" 
        : "bg-rose-100 border-rose-200"
      }`}>
        <div className="max-w-3xl mx-auto px-4 py-4 sm:py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Feedback Message */}
          <div className="w-full flex-1">
            {isChecking && isCorrect && (
              <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex items-center gap-3 text-emerald-700">
                <div className="bg-emerald-500 p-2 rounded-full text-white"><Check className="w-6 h-6 stroke-[3]" /></div>
                <div>
                  <p className="font-black text-xl tracking-tight">Excellent!</p>
                </div>
              </motion.div>
            )}
            
            {isChecking && !isCorrect && (
              <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex items-center gap-3 text-rose-700">
                <div className="bg-rose-500 p-2 rounded-full text-white"><XCircle className="w-6 h-6 stroke-[3]" /></div>
                <div>
                  <p className="font-black text-xl tracking-tight">Correct answer:</p>
                  <p className="font-bold text-sm">{currentQuestion.answer}</p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Action Button */}
          <div className="w-full sm:w-auto">
            {!isChecking ? (
              <Button 
                onClick={handleCheck}
                disabled={!selectedAnswer}
                className={`w-full sm:w-48 py-6 rounded-2xl text-base uppercase font-black tracking-wider shadow-sm transition-all border-b-4 active:border-b-0 active:translate-y-1 ${
                  selectedAnswer 
                    ? "bg-indigo-500 hover:bg-indigo-400 text-white border-indigo-700" 
                    : "bg-slate-200 text-slate-400 border-slate-300 pointer-events-none"
                }`}
              >
                Check
              </Button>
            ) : (
              <Button 
                onClick={handleNext}
                className={`w-full sm:w-48 py-6 rounded-2xl text-base uppercase font-black tracking-wider shadow-sm transition-all border-b-4 active:border-b-0 active:translate-y-1 ${
                  isCorrect 
                    ? "bg-emerald-500 hover:bg-emerald-400 text-white border-emerald-700" 
                    : "bg-rose-500 hover:bg-rose-400 text-white border-rose-700"
                }`}
              >
                Continue
              </Button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}