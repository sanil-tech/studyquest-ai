import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

// 1. Terima quizId dan fungsi onComplete daripada props
export default function QuizComponent({ quizId, onComplete }) {
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!quizId) return;
    
    setLoading(true);
    base44.entities.Quiz.get(quizId).then(q => {
      setQuiz(q);
      setQuestions(JSON.parse(q.questions_json));
      setLoading(false);
    });
  }, [quizId]);

  const handleAnswer = (qIndex, answer) => {
    if (submitted || isSubmitting) return;
    setAnswers(prev => ({ ...prev, [qIndex]: answer }));
  };

  const handleSubmit = async () => {
    if (isSubmitting || submitted) return;
    setIsSubmitting(true);

    try {
      const user = await base44.auth.me();

      let correct = 0;
      questions.forEach((q, i) => {
        if (answers[i] === q.correct_answer) correct++;
      });
      const score = Math.round((correct / questions.length) * 100);

      let coins = correct * 10;
      if (score === 100) coins += 50;
      const xpEarned = correct * 5;

      const feedbackResult = await base44.integrations.Core.InvokeLLM({
        prompt: `A student scored ${score}% on a quiz about "${quiz.topic_name}"...` // kekalkan prompt asal anda
      });

      const attempt = await base44.entities.QuizAttempt.create({
        student_id: user.id,
        quiz_id: quizId,
        topic_name: quiz.topic_name,
        subject_name: quiz.subject_name,
        answers_json: JSON.stringify(answers),
        score,
        coins_earned: coins,
        feedback_text: feedbackResult,
      });

      // --- Sisa logik Wallet, Transaction, Progress, Notification kekal sama ---
      // [Masukkan kod asal anda untuk bahagian wallet, progress, dll. di sini]

      setSubmitted(true);

      // 2. Panggil fungsi onComplete untuk hantar data ke LessonPage
      if (onComplete) {
        onComplete(attempt.id);
      }
    } catch (error) {
      console.error("Gagal menghantar kuiz:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const q = questions[currentQ];
  const selectedAnswer = answers[currentQ];
  const allAnswered = Object.keys(answers).length === questions.length;

  return (
    <div className="space-y-6 bg-muted/30 p-6 rounded-2xl border border-border/40">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-heading font-bold">{quiz?.topic_name} Quiz</h3>
          <p className="text-muted-foreground text-xs">{quiz?.subject_name}</p>
        </div>
        <span className="text-xs font-medium bg-primary/10 text-primary px-3 py-1 rounded-full">
          {currentQ + 1} / {questions.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          animate={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
          className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQ}
          initial={{ opacity: 0, x: 15 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -15 }}
          className="bg-white rounded-xl p-5 border border-border/50"
        >
          <h4 className="text-sm font-semibold mb-3 leading-relaxed">{q.question}</h4>
          <div className="space-y-2">
            {q.options.map((option, i) => {
              const isSelected = selectedAnswer === option;
              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(currentQ, option)}
                  disabled={submitted || isSubmitting}
                  className={`w-full text-left p-3.5 rounded-lg border transition-all text-xs ${
                    isSelected
                      ? "border-primary bg-primary/5 font-medium"
                      : "border-border/50 hover:border-primary/30 hover:bg-muted/50"
                  }`}
                >
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-muted text-[10px] font-bold mr-2">
                    {String.fromCharCode(65 + i)}
                  </span>
                  {option}
                </button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center gap-3">
        {currentQ > 0 && (
          <Button
            variant="outline"
            onClick={() => setCurrentQ(currentQ - 1)}
            className="flex-1 rounded-lg h-10 text-xs"
          >
            Sebelumnya
          </Button>
        )}
        {currentQ < questions.length - 1 ? (
          <Button
            onClick={() => setCurrentQ(currentQ + 1)}
            disabled={!selectedAnswer}
            className="flex-1 rounded-lg h-10 text-xs"
          >
            Seterusnya
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!allAnswered || isSubmitting || submitted}
            className="flex-1 rounded-lg h-10 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin mr-2" />
                Menilai...
              </>
            ) : (
              "Hantar Kuiz ✅"
            )}
          </Button>
        )}
      </div>

      {/* Question dots */}
      <div className="flex items-center justify-center gap-1.5">
        {questions.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentQ(i)}
            className={`w-2 h-2 rounded-full transition-all ${
              i === currentQ
                ? "bg-primary scale-125"
                : answers[i]
                  ? "bg-primary/40"
                  : "bg-muted"
            }`}
          />
        ))}
      </div>
    </div>
  );
}