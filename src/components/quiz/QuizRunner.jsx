// src/components/quiz/QuizRunner.jsx
import React, { useState } from "react";
import { getActiveStudentId } from "@/lib/rewardSystem";
import { processReward } from "@/lib/rewardEngine";
import QuestionCard from "./QuestionCard";
import ExplanationCard from "./ExplanationCard";
import QuizResult from "./QuizResult";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check } from "lucide-react";

export default function QuizRunner({ assessment, studentName, onFinish }) {
  const questions = assessment?.questions || [];
  const rewardXp = assessment?.reward_xp || 50;
  const rewardCoins = assessment?.reward_coins || 10;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const currentQuestion = questions[currentIndex] || null;

  const handleSelectOption = (label) => {
    if (isSubmitted) return;
    setSelectedOption(label);
  };

  const handleSubmitAnswer = () => {
    if (!selectedOption || isSubmitted) return;
    setIsSubmitted(true);

    if (selectedOption === currentQuestion?.correct_answer) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNextQuestion = async () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsSubmitted(false);
    } else {
      // Quiz complete: process rewards
      const activeStudentId = await getActiveStudentId();
      if (activeStudentId) {
        await processReward(activeStudentId, {
          activityType: "quiz_complete",
          referenceId: assessment?.id || "quiz",
          referenceName: assessment?.title || "Penilaian",
          reason: "Selesai Penilaian Minda"
        }).catch(() => {});
      }
      setIsCompleted(true);
    }
  };

  const handleRetry = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsSubmitted(false);
    setScore(0);
    setIsCompleted(false);
  };

  if (isCompleted) {
    return (
      <QuizResult
        score={score}
        totalQuestions={questions.length}
        rewardXp={rewardXp}
        rewardCoins={rewardCoins}
        completionMessage={assessment?.completion_message}
        onRetry={handleRetry}
        onContinue={onFinish}
      />
    );
  }

  if (!currentQuestion) {
    return (
      <div className="p-8 text-center bg-stone-900/80 rounded-3xl border border-stone-800 text-stone-400 font-bold text-xs">
        Soalan tidak dijumpai.
      </div>
    );
  }

  const isCorrect = selectedOption === currentQuestion.correct_answer;

  return (
    <div className="space-y-5">
      {/* Progress Header Indicator */}
      <div className="flex items-center justify-between text-xs font-black text-stone-400 px-1">
        <span>Soalan {currentIndex + 1} daripada {questions.length}</span>
        <span>Skor: {score}</span>
      </div>

      {/* Question Card View */}
      <QuestionCard
        question={currentQuestion}
        selectedOption={selectedOption}
        isSubmitted={isSubmitted}
        onSelectOption={handleSelectOption}
      />

      {/* Interactive Explanation Card (Revealed after submission) */}
      {isSubmitted && (
        <ExplanationCard
          explanationDetails={currentQuestion.explanation_details}
          isCorrect={isCorrect}
        />
      )}

      {/* Action Submit / Next Button */}
      <div className="pt-2">
        {!isSubmitted ? (
          <Button
            onClick={handleSubmitAnswer}
            disabled={!selectedOption}
            className="w-full h-13 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-stone-950 font-black text-xs rounded-2xl border-b-4 border-amber-600 active:translate-y-0.5 transition-all flex items-center justify-center gap-2"
          >
            Sahkan Jawapan <Check className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={handleNextQuestion}
            className="w-full h-13 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-xs rounded-2xl border-b-4 border-emerald-700 active:translate-y-0.5 transition-all flex items-center justify-center gap-2"
          >
            {currentIndex + 1 < questions.length ? "Soalan Seterusnya" : "Lihat Keputusan"} <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
