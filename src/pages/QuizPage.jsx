import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export default function QuizPage() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Quiz.get(quizId).then(q => {
      setQuiz(q);
      setQuestions(JSON.parse(q.questions_json));
      setLoading(false);
    });
  }, [quizId]);

  const handleAnswer = (qIndex, answer) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [qIndex]: answer }));
  };

  const handleSubmit = async () => {
    setSubmitted(true);
    const user = await base44.auth.me();

    // Calculate score
    let correct = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.correct_answer) correct++;
    });
    const score = Math.round((correct / questions.length) * 100);

    // Calculate coins
    let coins = 20; // base
    if (score > 80) coins += 20;
    if (score === 100) coins += 50;

    // XP earned
    const xpEarned = Math.round(score / 2);

    // Generate AI feedback
    const feedbackResult = await base44.integrations.Core.InvokeLLM({
      prompt: `A student scored ${score}% on a quiz about "${quiz.topic_name}". They got ${correct}/${questions.length} correct.

Their answers: ${JSON.stringify(questions.map((q, i) => ({
  question: q.question,
  student_answer: answers[i] || "No answer",
  correct_answer: q.correct_answer,
  is_correct: answers[i] === q.correct_answer
})))}

Provide brief, encouraging feedback:
1. Score summary
2. Brief explanation of mistakes (if any)
3. One improvement tip
4. Suggested next topic

Keep it short and motivating.`,
    });

    // Create quiz attempt
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

    // Update wallet
    const wallets = await base44.entities.Wallet.filter({ student_id: user.id });
    if (wallets.length > 0) {
      await base44.entities.Wallet.update(wallets[0].id, { balance: wallets[0].balance + coins });
    }

    // Log transaction
    await base44.entities.Transaction.create({
      student_id: user.id,
      type: "earn",
      amount: coins,
      reason: `Quiz completed: ${quiz.topic_name} (Score: ${score}%)`,
      reference_id: attempt.id,
    });

    // Update progress
    const progresses = await base44.entities.Progress.filter({ student_id: user.id });
    if (progresses.length > 0) {
      const p = progresses[0];
      const newXP = (p.total_xp || 0) + xpEarned;
      const newLevel = Math.floor(newXP / 200) + 1;
      const today = new Date().toISOString().split("T")[0];
      const isNewDay = p.last_study_date !== today;
      const isConsecutive = p.last_study_date && 
        new Date(today) - new Date(p.last_study_date) <= 86400000 * 1.5;
      
      await base44.entities.Progress.update(p.id, {
        total_xp: newXP,
        level: newLevel,
        streak_days: isNewDay ? (isConsecutive ? (p.streak_days || 0) + 1 : 1) : p.streak_days,
        last_study_date: today,
      });
    }

    // Create notifications
    await base44.entities.Notification.create({
      user_id: user.id,
      title: "Quiz Complete! 🎉",
      message: `You scored ${score}% and earned ${coins} coins!`,
      type: "quiz_complete",
      reference_id: attempt.id,
    });

    navigate(`/quiz-result/${attempt.id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const q = questions[currentQ];
  const selectedAnswer = answers[currentQ];
  const allAnswered = Object.keys(answers).length === questions.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-heading font-bold">{quiz?.topic_name} Quiz</h1>
          <p className="text-muted-foreground text-sm">{quiz?.subject_name}</p>
        </div>
        <span className="text-sm font-medium bg-primary/10 text-primary px-3 py-1 rounded-full">
          {currentQ + 1} / {questions.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-muted rounded-full overflow-hidden">
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
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-white rounded-2xl p-6 border border-border/50"
        >
          <h2 className="text-base font-semibold mb-4 leading-relaxed">{q.question}</h2>
          <div className="space-y-2">
            {q.options.map((option, i) => {
              const isSelected = selectedAnswer === option;
              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(currentQ, option)}
                  disabled={submitted}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all text-sm ${
                    isSelected
                      ? "border-primary bg-primary/5 font-medium"
                      : "border-border/50 hover:border-primary/30 hover:bg-muted/50"
                  }`}
                >
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-bold mr-3">
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
            className="flex-1 rounded-xl h-12"
          >
            Previous
          </Button>
        )}
        {currentQ < questions.length - 1 ? (
          <Button
            onClick={() => setCurrentQ(currentQ + 1)}
            disabled={!selectedAnswer}
            className="flex-1 rounded-xl h-12"
          >
            Next
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!allAnswered || submitted}
            className="flex-1 rounded-xl h-12 bg-emerald-600 hover:bg-emerald-700"
          >
            {submitted ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Grading...
              </>
            ) : (
              "Submit Quiz ✅"
            )}
          </Button>
        )}
      </div>

      {/* Question dots */}
      <div className="flex items-center justify-center gap-2">
        {questions.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentQ(i)}
            className={`w-3 h-3 rounded-full transition-all ${
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