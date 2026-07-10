// src/pages/QuizPage.jsx
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
    base44.entities.Quiz.get(quizId)
      .then(q => {
        if (q) {
          setQuiz(q);
          try {
            // Memastikan penukaran teks JSON ke objek berjalan selamat
            const rawQuestions = typeof q.questions_json === "string" 
              ? JSON.parse(q.questions_json) 
              : q.questions_json;
            setQuestions(Array.isArray(rawQuestions) ? rawQuestions : []);
          } catch (e) {
            console.error("Ralat membaca data soalan kuiz:", e);
            setQuestions([]);
          }
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Gagal mendapatkan kuiz:", err);
        setLoading(false);
      });
  }, [quizId]);

  const handleAnswer = (qIndex, answer) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [qIndex]: answer }));
  };

  const handleSubmit = async () => {
    if (questions.length === 0) return;
    setSubmitted(true);
    
    try {
      const user = await base44.auth.me();
      if (!user) throw new Error("Pengguna tidak ditemui.");

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
      let feedbackResult = "Syabas atas usaha anda!";
      try {
        feedbackResult = await base44.integrations.Core.InvokeLLM({
          prompt: `A student scored ${score}% on a quiz about "${quiz?.topic_name || 'Topic'}". They got ${correct}/${questions.length} correct.

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

Keep it short and motivating. Use lots of emojis and celebrate their effort (e.g. "Hebat! ⭐", "Tabik spring! 👏"). Be warm and playful like a friendly teacher cheering on a young learner.`,
        });
      } catch (llmErr) {
        console.warn("Gagal mendapatkan maklum balas AI LLM:", llmErr);
      }

      // Create quiz attempt
      const attempt = await base44.entities.QuizAttempt.create({
        student_id: user.id,
        quiz_id: quizId,
        topic_name: quiz?.topic_name || "Topik",
        subject_name: quiz?.subject_name || "Subjek",
        answers_json: JSON.stringify(answers),
        score,
        coins_earned: coins,
        feedback_text: typeof feedbackResult === "object" ? JSON.stringify(feedbackResult) : feedbackResult,
      });

      // PENCEGAHAN: Tangkap ID Sesi Percubaan sama ada berbentuk Array mahupun Objek terus
      const finalAttemptId = Array.isArray(attempt) ? attempt[0]?.id : attempt?.id;
      if (!finalAttemptId) throw new Error("Gagal menyimpan rekod cubaan kuiz.");

      // Update wallet
      try {
        const wallets = await base44.entities.Wallet.filter({ student_id: user.id });
        const targetWallet = Array.isArray(wallets) ? wallets[0] : wallets;
        if (targetWallet?.id) {
          await base44.entities.Wallet.update(targetWallet.id, { balance: (targetWallet.balance || 0) + coins });
        }
      } catch (walletErr) {
        console.warn("Gagal mengemas kini dompet digital:", walletErr);
      }

      // Log transaction
      try {
        await base44.entities.Transaction.create({
          student_id: user.id,
          type: "earn",
          amount: coins,
          reason: `Quiz completed: ${quiz?.topic_name || 'Topic'} (Score: ${score}%)`,
          reference_id: finalAttemptId,
        });
      } catch (txErr) {
        console.warn("Gagal log transaksi kewangan:", txErr);
      }

      // Update progress
      try {
        const progresses = await base44.entities.Progress.filter({ student_id: user.id });
        const targetProgress = Array.isArray(progresses) ? progresses[0] : progresses;
        if (targetProgress?.id) {
          const newXP = (targetProgress.total_xp || 0) + xpEarned;
          const newLevel = Math.floor(newXP / 200) + 1;
          const today = new Date().toISOString().split("T")[0];
          const isNewDay = targetProgress.last_study_date !== today;
          const isConsecutive = targetProgress.last_study_date && 
            (new Date(today) - new Date(targetProgress.last_study_date)) <= 86400000 * 1.5;
          
          await base44.entities.Progress.update(targetProgress.id, {
            total_xp: newXP,
            level: newLevel,
            streak_days: isNewDay ? (isConsecutive ? (targetProgress.streak_days || 0) + 1 : 1) : targetProgress.streak_days,
            last_study_date: today,
          });
        }
      } catch (progErr) {
        console.warn("Gagal mengemas kini rekod markah XP:", progErr);
      }

      // Create notifications
      try {
        await base44.entities.Notification.create({
          user_id: user.id,
          title: "Quiz Complete! 🎉",
          message: `You scored ${score}% and earned ${coins} coins!`,
          type: "quiz_complete",
          reference_id: finalAttemptId,
        });
      } catch (notifErr) {
        console.warn("Gagal menghantar notifikasi:", notifErr);
      }

      // Menuju ke halaman keputusan dengan ID yang sah
      navigate(`/quiz-result/${finalAttemptId}`);

    } catch (err) {
      console.error("Ralat semasa menghantar kuiz:", err);
      setSubmitted(false);
      alert("Gagal menghantar keputusan kuiz. Sila cuba sekali lagi.");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-[#FAFAF7] min-h-[50vh] space-y-3">
        <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
        <p className="text-xs font-bold text-stone-500">Menyediakan kertas soalan Kuiz Boss... ⚔️</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="p-6 text-center bg-red-50 border border-red-200 rounded-3xl max-w-md mx-auto my-10 space-y-3">
        <p className="text-red-700 font-bold text-sm">
          ❌ Tiada soalan kuiz ditemui untuk topik ini atau format data salah.
        </p>
        <Button onClick={() => navigate(-1)} className="bg-stone-600 text-white rounded-xl">
          Kembali ke Menu
        </Button>
      </div>
    );
  }

  const q = questions[currentQ];
  const selectedAnswer = answers[currentQ];
  const allAnswered = Object.keys(answers).length === questions.length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 font-sans bg-[#FAFAF7] min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-stone-100 shadow-sm">
        <div>
          <h1 className="text-base sm:text-lg font-black text-stone-800">{quiz?.topic_name} Quiz</h1>
          <p className="text-stone-400 text-xs font-bold uppercase tracking-wider">{quiz?.subject_name}</p>
        </div>
        <span className="text-xs font-black bg-emerald-50 border border-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full">
          {currentQ + 1} / {questions.length} Soalan
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-3 bg-stone-200 rounded-full overflow-hidden border border-stone-300 shadow-inner">
        <motion.div
          animate={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
          className="h-full bg-gradient-to-r from-lime-400 to-emerald-600 rounded-full"
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Question Container */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQ}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-white rounded-[2rem] p-6 border border-emerald-100 shadow-md space-y-4"
        >
          <h2 className="text-sm sm:text-base font-bold text-stone-800 leading-relaxed bg-stone-50 p-4 rounded-xl border border-stone-100 shadow-inner">
            {q?.question}
          </h2>
          <div className="space-y-2.5">
            {q?.options?.map((option, i) => {
              const isSelected = selectedAnswer === option;
              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(currentQ, option)}
                  disabled={submitted}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-transform active:scale-[0.99] text-xs sm:text-sm flex items-center ${
                    isSelected
                      ? "border-emerald-600 bg-emerald-50/50 text-emerald-900 font-bold"
                      : "border-stone-200 hover:border-emerald-200 hover:bg-stone-50 text-stone-700"
                  }`}
                >
                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-black mr-3 shadow-sm shrink-0 ${
                    isSelected ? "bg-emerald-600 text-white" : "bg-stone-100 text-stone-500"
                  }`}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="flex-1">{option}</span>
                </button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Controls */}
      <div className="flex items-center gap-3">
        {currentQ > 0 && (
          <Button
            variant="outline"
            onClick={() => setCurrentQ(currentQ - 1)}
            className="flex-1 rounded-xl h-12 text-xs font-bold border-stone-300 text-stone-600 hover:bg-stone-100"
          >
            Sebelumnya
          </Button>
        )}
        {currentQ < questions.length - 1 ? (
          <Button
            onClick={() => setCurrentQ(currentQ + 1)}
            disabled={!selectedAnswer}
            className="flex-1 rounded-xl h-12 text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white border-0"
          >
            Seterusnya
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!allAnswered || submitted}
            className="flex-1 rounded-xl h-12 text-xs font-black bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-md"
          >
            {submitted ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Memeriksa Jawapan...
              </>
            ) : (
              "Hantar Kuiz Boss! ⚔️"
            )}
          </Button>
        )}
      </div>

      {/* Question dots tracker */}
      <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
        {questions.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentQ(i)}
            className={`w-3 h-3 rounded-full transition-all ${
              i === currentQ
                ? "bg-emerald-600 scale-125 ring-2 ring-emerald-200"
                : answers[i]
                  ? "bg-emerald-400/50"
                  : "bg-stone-300"
            }`}
          />
        ))}
      </div>
    </div>
  );
}