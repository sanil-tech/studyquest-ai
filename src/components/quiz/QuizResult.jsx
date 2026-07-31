// src/components/quiz/QuizResult.jsx
import React, { useEffect, useState } from "react";
import { Trophy, Leaf, Coins, RotateCcw, ArrowRight, CheckCircle2, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";

export default function QuizResult({
  submissionResult,
  score: fallbackScore = 0,
  totalQuestions: fallbackTotal = 1,
  rewardXp: fallbackXp = 0,
  rewardCoins: fallbackCoins = 0,
  completionMessage,
  onRetry,
  onContinue
}) {
  const [showReview, setShowReview] = useState(false);

  const percentage = submissionResult?.score_percentage ?? Math.round((fallbackScore / Math.max(1, fallbackTotal)) * 100);
  const correctCount = submissionResult?.correct_count ?? fallbackScore;
  const totalQuestions = submissionResult?.total_questions ?? fallbackTotal;
  const xpEarned = submissionResult?.xp_earned ?? fallbackXp;
  const coinsEarned = submissionResult?.coins_earned ?? fallbackCoins;
  const isPassed = submissionResult?.passed ?? (percentage >= 70);
  const detailedResults = submissionResult?.detailed_results || [];

  useEffect(() => {
    if (isPassed) {
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
    }
  }, [isPassed]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-stone-900/95 border-2 border-stone-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6 max-w-md mx-auto"
    >
      {/* Badge Trophy */}
      <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-amber-500 to-lime-400 p-0.5 shadow-xl flex items-center justify-center">
        <div className="w-full h-full bg-stone-950 rounded-[22px] flex items-center justify-center">
          <Trophy className={`w-10 h-10 ${isPassed ? "text-amber-400 animate-bounce" : "text-stone-500"}`} />
        </div>
      </div>

      {/* Title & Score Percentage */}
      <div className="space-y-1">
        <h2 className="text-xl font-black text-white">
          {isPassed ? "Misi Berjaya! 🎉" : "Teruskan Usaha! 💪"}
        </h2>
        <p className="text-xs font-bold text-stone-400">
          {completionMessage || `Skor Anda: ${correctCount} daripada ${totalQuestions} soalan betul.`}
        </p>
        <div className="text-3xl font-black text-amber-300 pt-2">
          {percentage}%
        </div>
      </div>

      {/* Rewards Card */}
      <div className="bg-stone-950/80 rounded-2xl p-4 border border-stone-800 grid grid-cols-2 gap-3">
        <div className="flex items-center justify-center gap-2 p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
          <Leaf className="w-5 h-5 text-emerald-400" />
          <span className="font-black text-sm text-emerald-300">+{xpEarned} XP</span>
        </div>
        <div className="flex items-center justify-center gap-2 p-2 bg-amber-500/10 rounded-xl border border-amber-500/20">
          <Coins className="w-5 h-5 text-amber-400" />
          <span className="font-black text-sm text-amber-300">+{coinsEarned} Syiling</span>
        </div>
      </div>

      {/* Detailed Review Section */}
      {detailedResults.length > 0 && (
        <div className="text-left space-y-2 pt-2 border-t border-stone-800">
          <button
            onClick={() => setShowReview(!showReview)}
            className="w-full py-2 px-3 bg-stone-800/80 hover:bg-stone-800 text-stone-300 text-xs font-black rounded-xl border border-stone-700 flex items-center justify-between transition-all"
          >
            <span>Semakan Jawapan Ujian ({detailedResults.filter(r => r.is_correct).length}/{detailedResults.length} Betul)</span>
            {showReview ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showReview && (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1 pt-2">
              {detailedResults.map((res, idx) => (
                <div
                  key={res.question_id || idx}
                  className={`p-3 rounded-xl border text-xs space-y-1 ${
                    res.is_correct
                      ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-200"
                      : "bg-rose-950/40 border-rose-500/30 text-rose-200"
                  }`}
                >
                  <div className="flex items-center justify-between font-black">
                    <span>Soalan {idx + 1}</span>
                    <span className="flex items-center gap-1">
                      {res.is_correct ? (
                        <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Betul</>
                      ) : (
                        <><XCircle className="w-3.5 h-3.5 text-rose-400" /> Salah</>
                      )}
                    </span>
                  </div>
                  {res.explanation && (
                    <p className="text-[11px] text-stone-300 font-medium pt-1 border-t border-stone-800/60 mt-1">
                      {res.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-2.5 pt-2">
        <Button
          onClick={onContinue}
          className="w-full h-12 bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs rounded-xl border-b-4 border-amber-600 active:translate-y-0.5 transition-all flex items-center justify-center gap-2"
        >
          Teruskan Pengembaraan <ArrowRight className="w-4 h-4" />
        </Button>
        <Button
          onClick={onRetry}
          variant="outline"
          className="w-full h-11 border-stone-700 bg-stone-800 hover:bg-stone-700 text-stone-300 font-black text-xs rounded-xl flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" /> Cuba Lagi
        </Button>
      </div>
    </motion.div>
  );
}

