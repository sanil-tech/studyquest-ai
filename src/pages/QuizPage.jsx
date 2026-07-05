// src/pages/QuizPage.jsx
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, XCircle, Loader2, Trophy } from "lucide-react";
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
  const [submitting, setSubmitting] = useState(false); // 🌟 Solusi ralat double-submit
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    base44.entities.Quiz.get(quizId)
      .then(q => {
        if (!isMounted) return;
        setQuiz(q);
        setQuestions(JSON.parse(q.questions_json || "[]"));
        setLoading(false);
      })
      .catch(err => {
        console.error("Gagal memuatkan data kuiz:", err);
        setLoading(false);
      });
    return () => { isMounted = false; };
  }, [quizId]);

  const handleAnswer = (qIndex, answer) => {
    if (submitted || submitting) return;
    setAnswers(prev => ({ ...prev, [qIndex]: answer }));
  };

  const handleSubmit = async () => {
    if (submitting || submitted) return; // 🌟 Block serta merta klik berganda
    setSubmitting(true);

    try {
      const user = await base44.auth.me();

      // Calculate score
      let correct = 0;
      questions.forEach((q, i) => {
        if (answers[i] === q.correct_answer) correct++;
      });
      const score = Math.round((correct / questions.length) * 100);

      // Calculate coins — 10 per correct answer, bonus 50 for perfect score
      let coins = correct * 10;
      if (score === 100) coins += 50;

      // XP earned — 5 per correct answer
      const xpEarned = correct * 5;

      // Generate AI feedback
      let feedbackResult = "Hebat usaha anda! Cuba lagi pada masa akan datang.";
      try {
        feedbackResult = await base44.integrations.Core.InvokeLLM({
          prompt: `A student scored ${score}% on a quiz about "${quiz.topic_name}". They got ${correct}/${questions.length} correct.

Their answers: ${JSON.stringify(questions.map((q, i) => ({
            question: q.question,
            student_answer: answers[i] || "No answer",
            correct_answer: q.correct_answer,
            is_correct: answers[i] === q.correct_answer
          })))}

Provide brief, encouraging feedback in Bahasa Melayu:
1. Score summary
2. Brief explanation of mistakes (if any)
3. One improvement tip
4. Suggested next topic

Keep it short, playful and highly motivating. Use lots of emojis and celebrate their effort (e.g. "Hebat! ⭐", "Tabik spring! 👏"). Be warm like a friendly teacher cheering on a young learner.`,
        });
      } catch (aiErr) {
        console.warn("AI Feedback generation failed, using fallback.", aiErr);
      }

      // Create quiz attempt
      const attempt = await base44.entities.QuizAttempt.create({
        student_id: user.id,
        quiz_id: quizId,
        topic_name: quiz.topic_name,
        subject_name: quiz.subject_name,
        answers_json: JSON.stringify(answers),
        score,
        coins_earned: coins,
        feedback_text: typeof feedbackResult === "string" ? feedbackResult : JSON.stringify(feedbackResult),
      });

      // Update wallet balance safely
      const wallets = await base44.entities.Wallet.filter({ student_id: user.id });
      if (wallets.length > 0) {
        await base44.entities.Wallet.update(wallets[0].id, { balance: Number(wallets[0].balance || 0) + coins });
      }

      // Log transaction
      await base44.entities.Transaction.create({
        student_id: user.id,
        type: "earn",
        amount: coins,
        reason: `Quiz completed: ${quiz.topic_name} (Score: ${score}%)`,
        reference_id: attempt.id,
      });

      // Update progress & streak calculation
      const progresses = await base44.entities.Progress.filter({ student_id: user.id });
      if (progresses.length > 0) {
        const p = progresses[0];
        const newXP = (p.total_xp || 0) + xpEarned;
        const newLevel = Math.floor(newXP / 200) + 1;
        const today = new Date().toISOString().split("T")[0];
        
        let finalStreak = p.streak_days || 0;
        if (p.last_study_date !== today) {
          const msd = p.last_study_date ? new Date(p.last_study_date) : null;
          const currentDay = new Date(today);
          const diffTime = msd ? Math.abs(currentDay - msd) : null;
          const diffDays = diffTime ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : null;

          if (diffDays === 1) {
            finalStreak += 1;
          } else if (diffDays > 1 || !msd) {
            finalStreak = 1;
          }
        }

        await base44.entities.Progress.update(p.id, {
          total_xp: newXP,
          level: newLevel,
          streak_days: finalStreak,
          last_study_date: today,
        });
      }

      // Create system notifications
      await base44.entities.Notification.create({
        user_id: user.id,
        title: "Kuiz Selesai! 🎉",
        message: `Anda mendapat skor ${score}% dan berjaya meraih ${coins} syiling!`,
        type: "quiz_complete",
        reference_id: attempt.id,
      });

      setSubmitted(true);
      navigate(`/quiz-result/${attempt.id}`);
    } catch (err) {
      console.error("Proses hantaran kuiz gagal:", err);
      alert("Alamak, ada ralat teknikal berlaku semasa menghantar kuiz. Sila cuba sekali lagi!");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-10 h-10 border-t-primary rounded-full animate-spin text-primary" />
        <p className="text-sm font-medium text-slate-500">Membuka lembaran kuiz ajaib...</p>
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border p-8 max-w-md mx-auto shadow-sm">
        <p className="text-slate-600 font-medium mb-4">Kuiz ini tidak mengandungi sebarang soalan buat masa ini.</p>
        <Button onClick={() => navigate(-1)} className="rounded-full">Kembali</Button>
      </div>
    );
  }

  const q = questions[currentQ];
  const selectedAnswer = answers[currentQ];
  const allAnswered = Object.keys(answers).length === questions.length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 min-h-screen pb-24 font-sans">
      
      {/* Top Meta Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-xl active:scale-95 transition-transform">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="min-w-0">
            <h1 className="text-base font-bold text-slate-800 truncate tracking-tight">{quiz?.topic_name}</h1>
            <p className="text-xs text-slate-400 font-medium truncate">{quiz?.subject_name}</p>
          </div>
        </div>
        <span className="text-xs font-bold bg-primary/10 text-primary px-3 py-1.5 rounded-full shrink-0">
          Soalan {currentQ + 1} / {questions.length}
        </span>
      </div>

      {/* Modern Fluid Progress Bar */}
      <div className="h-2.5 bg-slate-200/60 rounded-full overflow-hidden shadow-inner">
        <motion.div
          animate={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
          className="h-full bg-gradient-to-r from-primary via-cyan-500 to-emerald-500 rounded-full"
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      </div>

      {/* Dynamic Animated Core Question Body */}
      <div className="relative overflow-hidden min-h-[300px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQ}
            initial={{ opacity: 0, x: 25 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -25 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="bg-white rounded-3xl p-5 sm:p-7 border-2 border-slate-100 shadow-md space-y-5"
          >
            <h2 className="text-base sm:text-lg font-bold text-slate-800 leading-relaxed">
              {q?.question}
            </h2>
            
            <div className="space-y-3">
              {q?.options?.map((option, i) => {
                const isSelected = selectedAnswer === option;
                return (
                  <button
                    key={i}
                    onClick={() => handleAnswer(currentQ, option)}
                    disabled={submitted || submitting}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center gap-3 text-sm group ${
                      isSelected
                        ? "border-primary bg-primary/5 font-semibold text-primary shadow-sm"
                        : "border-slate-100 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-xl text-xs font-black shrink-0 transition-colors ${
                      isSelected ? "bg-primary text-white" : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                    }`}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="flex-1 break-words">{option}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Contextual Action Buttons */}
      <div className="flex items-center gap-3">
        {currentQ > 0 && (
          <Button
            variant="outline"
            onClick={() => setCurrentQ(currentQ - 1)}
            disabled={submitting}
            className="flex-1 rounded-2xl h-14 font-bold border-2 border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-98 transition-transform"
          >
            Sebelumnya
          </Button>
        )}
        
        {currentQ < questions.length - 1 ? (
          <Button
            onClick={() => setCurrentQ(currentQ + 1)}
            disabled={!selectedAnswer}
            className="flex-1 rounded-2xl h-14 font-bold text-white shadow-md active:scale-98 transition-transform"
          >
            Seterusnya
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!allAnswered || submitting || submitted}
            className="flex-1 rounded-2xl h-14 font-extrabold text-white bg-emerald-500 hover:bg-emerald-600 border-b-4 border-emerald-700 active:border-b-0 active:translate-y-1 shadow-md transition-all"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Menghantar...
              </>
            ) : (
              "Selesai & Semak Impak! 🏆"
            )}
          </Button>
        )}
      </div>

      {/* Interactive Bottom Footprint Dots */}
      <div className="flex items-center justify-center flex-wrap gap-2 pt-2 bg-slate-100/50 p-3 rounded-full border border-dashed border-slate-200">
        {questions.map((_, i) => (
          <button
            key={i}
            onClick={() => { if (!submitting) setCurrentQ(i); }}
            className={`w-3 h-3 rounded-full transition-all ${
              i === currentQ
                ? "bg-primary scale-125 ring-4 ring-primary/20"
                : answers[i]
                  ? "bg-primary/50"
                  : "bg-slate-300"
            }`}
          />
        ))}
      </div>
      
    </div>
  );
}