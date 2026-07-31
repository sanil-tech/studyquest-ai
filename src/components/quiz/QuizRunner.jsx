// src/components/quiz/QuizRunner.jsx
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import QuestionCard from "./QuestionCard";
import QuizResult from "./QuizResult";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Loader2, AlertCircle } from "lucide-react";

export default function QuizRunner({ assessment, studentName, onFinish }) {
  const questions = assessment?.questions || [];

  const [currentIndex, setCurrentIndex] = useState(0);
  // selectedAnswers mapping { [question_id]: selected_option_id }
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [status, setStatus] = useState("answering"); // "answering" | "submitting" | "completed" | "error"
  const [submissionResult, setSubmissionResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [startTime] = useState(() => Date.now());

  const currentQuestion = questions[currentIndex] || null;
  const currentQuestionId = currentQuestion?.id || `q_${currentIndex}`;
  const currentSelectedOption = selectedAnswers[currentQuestionId] || null;

  const handleSelectOption = (optionLabelOrId) => {
    if (status === "submitting" || status === "completed") return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestionId]: optionLabelOrId,
    }));
  };

  const handleSubmitAssessment = async () => {
    try {
      setStatus("submitting");
      setErrorMessage("");

      const durationSeconds = Math.max(1, Math.round((Date.now() - startTime) / 1000));

      const formattedAnswers = questions.map((q) => {
        const qId = q.id;
        const selectedOpt = selectedAnswers[qId] || "";
        return {
          question_id: qId,
          selected_option_id: selectedOpt,
          selected_option: selectedOpt,
        };
      });

      const response = await base44.functions.invoke("submitAssessment", {
        assessment_id: assessment?.id,
        answers: formattedAnswers,
        duration_seconds: durationSeconds,
      });

      const resData = response?.data;

      if (resData && resData.success) {
        setSubmissionResult({
          success: true,
          attempt_id: resData.attempt_id,
          score_percentage: resData.score ?? resData.score_percentage ?? 0,
          correct_count: resData.correct_count ?? 0,
          total_questions: resData.total_questions ?? questions.length,
          passed: Boolean(resData.passed),
          xp_earned: resData.xp_earned ?? 0,
          coins_earned: resData.coins_earned ?? 0,
          attempt_number: resData.attempt_number ?? 1,
          already_passed: resData.already_passed ?? false,
          reward_status: resData.reward_status ?? "awarded",
          detailed_results: resData.question_results || [],
        });
        setStatus("completed");
      } else {
        setErrorMessage(resData?.error || "Gagal menghantar jawapan ujian.");
        setStatus("error");
      }
    } catch (err) {
      console.error("Submission error:", err);
      setErrorMessage("Ralat rangkaian semasa menghantar jawapan.");
      setStatus("error");
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      handleSubmitAssessment();
    }
  };

  const handleRetry = () => {
    setCurrentIndex(0);
    setSelectedAnswers({});
    setSubmissionResult(null);
    setErrorMessage("");
    setStatus("answering");
  };

  if (status === "completed" && submissionResult) {
    return (
      <QuizResult
        submissionResult={submissionResult}
        totalQuestions={questions.length}
        completionMessage={assessment?.completion_message}
        onRetry={handleRetry}
        onContinue={onFinish}
      />
    );
  }

  if (status === "submitting") {
    return (
      <div className="p-12 text-center bg-stone-900/90 rounded-3xl border-2 border-stone-800 shadow-2xl space-y-4">
        <Loader2 className="w-10 h-10 text-amber-400 animate-spin mx-auto" />
        <h3 className="text-base font-black text-white">Menilai Jawapan Anda...</h3>
        <p className="text-xs font-bold text-stone-400">
          Sistem sedang memproses markah dan ganjaran secara selamat di pelayan.
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="p-8 text-center bg-stone-900/90 rounded-3xl border-2 border-rose-500/50 shadow-2xl space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
        <h3 className="text-base font-black text-rose-200">Ralat Penghantaran</h3>
        <p className="text-xs font-bold text-stone-400">{errorMessage}</p>
        <div className="flex gap-3 justify-center pt-2">
          <Button
            onClick={handleSubmitAssessment}
            className="bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs px-5 py-2.5 rounded-xl border-b-4 border-amber-600"
          >
            Cuba Hantar Lagi
          </Button>
          <Button
            onClick={() => setStatus("answering")}
            variant="outline"
            className="border-stone-700 bg-stone-800 text-stone-300 font-black text-xs px-5 py-2.5 rounded-xl"
          >
            Semak Jawapan
          </Button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="p-8 text-center bg-stone-900/80 rounded-3xl border border-stone-800 text-stone-400 font-bold text-xs">
        Soalan tidak dijumpai.
      </div>
    );
  }

  const isLastQuestion = currentIndex + 1 >= questions.length;

  return (
    <div className="space-y-5">
      {/* Progress Header Indicator */}
      <div className="flex items-center justify-between text-xs font-black text-stone-400 px-1">
        <span>Soalan {currentIndex + 1} daripada {questions.length}</span>
        <span className="text-amber-400 font-bold">
          {Object.keys(selectedAnswers).length} / {questions.length} Dijawab
        </span>
      </div>

      {/* Question Card View */}
      <QuestionCard
        question={currentQuestion}
        selectedOption={currentSelectedOption}
        isSubmitted={false}
        onSelectOption={handleSelectOption}
      />

      {/* Action Submit / Next Button */}
      <div className="flex items-center gap-3 pt-2">
        {currentIndex > 0 && (
          <Button
            onClick={() => setCurrentIndex((prev) => prev - 1)}
            variant="outline"
            className="h-13 px-5 border-stone-700 bg-stone-800 hover:bg-stone-700 text-stone-300 font-black text-xs rounded-2xl"
          >
            Sebelumnya
          </Button>
        )}

        <Button
          onClick={handleNextQuestion}
          disabled={!currentSelectedOption}
          className="flex-1 h-13 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-stone-950 font-black text-xs rounded-2xl border-b-4 border-amber-600 active:translate-y-0.5 transition-all flex items-center justify-center gap-2"
        >
          {isLastQuestion ? (
            <>Hantar & Lihat Keputusan <Check className="w-4 h-4" /></>
          ) : (
            <>Soalan Seterusnya <ArrowRight className="w-4 h-4" /></>
          )}
        </Button>
      </div>
    </div>
  );
}

