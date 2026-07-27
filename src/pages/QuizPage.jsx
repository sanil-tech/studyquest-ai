// src/pages/QuizPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Eraser,
  PenTool,
  Lightbulb,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { getActiveStudentId } from "@/lib/rewardSystem";
import { processReward } from "@/lib/rewardEngine";
import { trackedInvokeLLM } from "@/lib/aiUsageTracker";
import QuizModeHeader from "@/components/quiz/QuizModeHeader";
import { saveQuizSession, getQuizSession, clearQuizSession } from "@/lib/sessionCache";

const DrawingCanvas = ({ onVerify, expectedAnswer, isVerifying }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = 12;
      ctx.strokeStyle = "#059669";
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    if (e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current.getContext("2d");
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    const ctx = canvasRef.current.getContext("2d");
    ctx.closePath();
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleVerify = () => {
    const canvas = canvasRef.current;
    const imageDataUrl = canvas.toDataURL("image/jpeg", 0.8);
    onVerify(imageDataUrl);
  };

  return (
    <div className="bg-stone-50 p-4 rounded-2xl border-2 border-dashed border-emerald-200 flex flex-col items-center space-y-4">
      <div className="text-center w-full">
        <p className="text-sm font-bold text-emerald-800">
          Ruangan Menulis 🖍️
        </p>
        <p className="text-xs text-stone-500">
          Tulis jawapan anda di bawah dan biarkan AI menyemaknya!
        </p>
      </div>

      <div className="relative border-4 border-emerald-500 rounded-2xl overflow-hidden shadow-inner bg-white">
        <canvas
          ref={canvasRef}
          width={320}
          height={200}
          className="touch-none cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>

      <div className="flex items-center gap-3 w-full max-w-[320px]">
        <Button
          className="flex-1 rounded-xl border-stone-300 text-stone-600 h-10 text-xs font-bold"
          disabled={isVerifying}
          onClick={clearCanvas}
          type="button"
          variant="outline"
        >
          <Eraser className="w-4 h-4 mr-1" /> Padam
        </Button>
        <Button
          className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white h-10 text-xs font-black shadow-md"
          disabled={isVerifying}
          onClick={handleVerify}
          type="button"
        >
          {isVerifying ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-1" /> Semak...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 mr-1" /> Hantar Jawapan
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

const safeJsonParse = (str, fallback = []) => {
  if (!str) return fallback;
  if (typeof str === "object") return str;
  try {
    return JSON.parse(
      String(str)
        .replace(/^```json/i, "")
        .replace(/^```/i, "")
        .replace(/```$/i, "")
        .trim()
    );
  } catch (e) {
    return fallback;
  }
};

export default function QuizPage() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [inputMode, setInputMode] = useState("mcq");
  const [isVerifyingAI, setIsVerifyingAI] = useState(false);

  // Mode-aware states
  const [quizType, setQuizType] = useState("practice");
  const [hint, setHint] = useState(null);
  const [hintLoading, setHintLoading] = useState(false);
  const [aiEncouragement, setAiEncouragement] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  // ✅ Pre-generated content (loaded once from DB — reused, no AI calls)
  const [feedbackLibrary, setFeedbackLibrary] = useState([]);

  const isPracticeMode = quizType !== "mastery";
  const isMasteryMode = quizType === "mastery";

  useEffect(() => {
    const loadQuiz = async () => {
      try {
        const contentRes = await base44.functions.invoke('getLessonContent', { quiz_id: quizId });
        const q = contentRes.data;
        setQuiz(q);
        // ✅ Load pre-generated feedback library from DB (no AI needed)
        const storedFeedback = safeJsonParse(q.feedback_library_json, []);
        setFeedbackLibrary(Array.isArray(storedFeedback) ? storedFeedback : []);
        const modeParam = searchParams.get("mode");
        const resolvedType = modeParam === "mastery" ? "mastery" : (modeParam === "practice" ? "practice" : (q?.quiz_type || "practice"));
        setQuizType(resolvedType);

        let parsed = safeJsonParse(q.questions_json, []);

        const limitParam = parseInt(searchParams.get("limit"));
        if (limitParam && limitParam > 0 && parsed.length > limitParam) {
          const shuffled = [...parsed];
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }
          parsed = shuffled.slice(0, limitParam);
        }

        if (parsed.length > 0) setQuestions(parsed);

        // ✅ Pulihkan sesi dari cache jika ada
        const cached = getQuizSession(quizId);
        if (cached && cached.answers && Object.keys(cached.answers).length > 0) {
          setAnswers(cached.answers);
          if (typeof cached.currentQ === "number" && cached.currentQ < parsed.length) {
            setCurrentQ(cached.currentQ);
          }
        }
      } catch (e) {
        console.error("Gagal memuat turun kuiz:", e);
      } finally {
        setLoading(false);
      }
    };
    loadQuiz();
  }, [quizId, searchParams]);

  // ✅ Auto-simpan jawapan ke cache setiap kali berubah
  useEffect(() => {
    if (quizId && questions.length > 0 && Object.keys(answers).length > 0) {
      saveQuizSession(quizId, { currentQ, answers, quizType });
    }
  }, [quizId, currentQ, answers, quizType, questions.length]);

  // PRACTICE MODE: Encouragement after each answer
  // ✅ OPTIMIZATION: Use pre-generated feedback library first — AI only as fallback
  const generateAIEncouragement = async (questionIndex, studentAnswer) => {
    const q = questions[questionIndex];
    if (!q) return;
    const correctAns = q.correct_answer || q.correctAnswer || "";
    const isCorrect =
      String(studentAnswer).trim().toLowerCase() ===
      String(correctAns).trim().toLowerCase();

    // ✅ Step 1: Try pre-generated feedback from library (ZERO AI tokens)
    const feedbackType = isCorrect ? "correct" : "incorrect";
    const matchingFeedback = feedbackLibrary.filter(f => f.type === feedbackType);
    if (matchingFeedback.length > 0) {
      const randomFeedback = matchingFeedback[Math.floor(Math.random() * matchingFeedback.length)];
      setAiEncouragement(randomFeedback.message);
      return;
    }

    // Step 2: Fallback to AI only if no pre-generated feedback exists
    setAiLoading(true);
    setAiEncouragement(null);
    try {
      const prompt = isCorrect
        ? `A Malaysian primary school student correctly answered a quiz question. Question: "${q.question}". Their answer: "${studentAnswer}". Generate a short, warm encouragement in Bahasa Melayu (1-2 sentences) that celebrates their correct answer. Use friendly, motivating language suitable for children.`
        : `A Malaysian primary school student answered a quiz question incorrectly. Question: "${q.question}". Their answer: "${studentAnswer}". Correct answer: "${correctAns}". Generate a warm encouragement in Bahasa Melayu (1-2 sentences) that encourages them not to give up and gives a simple hint. Do NOT reveal the correct answer directly. Use friendly, motivating language suitable for children.`;

      const result = await trackedInvokeLLM({ prompt }, "encouragement", quiz?.topic_name);
      setAiEncouragement(typeof result === "string" ? result : String(result));
    } catch (e) {
      console.error("AI encouragement error:", e);
    } finally {
      setAiLoading(false);
    }
  };

  // PRACTICE MODE: Hint request
  // ✅ OPTIMIZATION: Use stored explanation or feedback library first — AI only as fallback
  const requestHint = async () => {
    const q = questions[currentQ];
    if (!q) return;

    // ✅ Step 1: Use question's stored explanation as hint (ZERO AI tokens)
    if (q.explanation) {
      setHint(q.explanation);
      return;
    }

    // ✅ Step 2: Try pre-generated hint from feedback library
    const storedHints = feedbackLibrary.filter(f => f.type === "hint");
    if (storedHints.length > 0) {
      const randomHint = storedHints[Math.floor(Math.random() * storedHints.length)];
      setHint(randomHint.message);
      return;
    }

    // Step 3: Fallback to AI only if no stored content exists
    setHintLoading(true);
    setHint(null);
    try {
      const prompt = `A Malaysian primary school student needs a hint for this question: "${
        q.question
      }". Options: ${(q.options || []).join(
        ", "
      )}. Generate a helpful hint in Bahasa Melayu (1-2 sentences) that guides them toward the correct answer WITHOUT revealing it directly. Use friendly language suitable for children.`;
      const result = await trackedInvokeLLM({ prompt }, "hint", quiz?.topic_name);
      setHint(typeof result === "string" ? result : String(result));
    } catch (e) {
      console.error("Hint error:", e);
    } finally {
      setHintLoading(false);
    }
  };

  const handleAnswer = (index, answer) => {
    setAnswers((prev) => ({ ...prev, [index]: answer }));
    setShowExplanation(true);

    // Practice mode: get AI encouragement; Mastery mode: no AI help
    if (isPracticeMode) {
      generateAIEncouragement(index, answer);
    }
  };

  const verifyHandwritingWithAI = async (imageDataUrl) => {
    setIsVerifyingAI(true);
    try {
      const q = questions[currentQ];
      const targetAns = q?.correct_answer || q?.correctAnswer || "";

      const promptMsg = `Look at this handwritten image of a primary school student. Is the written text matching "${targetAns}"? Answer strictly YES or NO, followed by detected text.`;

      const res = await trackedInvokeLLM({
        prompt: promptMsg,
        file_urls: [imageDataUrl],
      }, "student_interaction", quiz?.topic_name);

      const resStr = String(res).toLowerCase();
      if (resStr.includes("yes")) {
        handleAnswer(currentQ, targetAns);
        alert("✨ AI mengesahkan jawapan tulisan tangan anda TEPAT!");
      } else {
        alert(
          `AI mengesahkan tulisan anda belum tepat. Jawapan dijangka: ${targetAns}`
        );
      }
    } catch (e) {
      alert("AI sibuk sebentar. Sila guna pilihan butang.");
    } finally {
      setIsVerifyingAI(false);
      setInputMode("mcq");
    }
  };

  const goToQuestion = (index) => {
    setCurrentQ(index);
    setInputMode("mcq");
    setShowExplanation(!!answers[index]);
    setHint(null);
    setAiEncouragement(null);
  };

  // MODE-AWARE SUBMIT
  const handleSubmit = async () => {
    if (questions.length === 0) return;
    setSubmitted(true);

    try {
      const studentId = await getActiveStudentId();
      if (!studentId) throw new Error("Pengguna tidak dikesan");

      let correct = 0;
      questions.forEach((q, i) => {
        const targetAns = q.correct_answer || q.correctAnswer || "";
        if (
          String(answers[i] || "")
            .trim()
            .toLowerCase() ===
          String(targetAns).trim().toLowerCase()
        )
          correct++;
      });

      const score = Math.round((correct / questions.length) * 100);

      // 🎯 Anti-farming reward engine: calculates fair rewards based on completion history
      const reward = await processReward(studentId, {
        activityType: isPracticeMode ? "quiz_practice" : "quiz_mastery",
        referenceId: quizId,
        referenceName: quiz?.topic_name || "Topik",
        subjectName: quiz?.subject_name,
        score,
        reason: isPracticeMode
          ? `Latihan: ${quiz?.topic_name || "Topik"}`
          : `Ujian Mahir: ${quiz?.topic_name || "Topik"}`,
      });

      // Generate mode-aware feedback/analysis
      let feedbackResult = "";
      let analysisJson = null;

      if (isPracticeMode) {
        // PRACTICE REPORT
        try {
          const practiceAnalysis = await trackedInvokeLLM({
            prompt: `Generate a practice report for a Malaysian primary school student who completed a practice quiz.
Topic: "${quiz?.topic_name}". Subject: "${quiz?.subject_name}". Score: ${score}%. Correct: ${correct}/${questions.length}.

Questions and answers:
${questions
              .map(
                (q, i) =>
                  `Q: ${q.question}, Student: ${
                    answers[i] || "no answer"
                  }, Correct: ${q.correct_answer || q.correctAnswer}`
              )
              .join("; ")}

Respond in JSON:
{
  "concepts_understood": ["concepts the student understood - in Bahasa Melayu"],
  "mistakes_made": ["specific mistakes - in Bahasa Melayu"],
  "recommended_revision": ["recommended revision activities - in Bahasa Melayu"],
  "summary": "Brief encouraging summary in Bahasa Melayu (1-2 sentences)"
}`,
            response_json_schema: {
              type: "object",
              properties: {
                concepts_understood: {
                  type: "array",
                  items: { type: "string" },
                },
                mistakes_made: {
                  type: "array",
                  items: { type: "string" },
                },
                recommended_revision: {
                  type: "array",
                  items: { type: "string" },
                },
                summary: { type: "string" },
              },
            },
          }, "quiz_analysis", quiz?.topic_name);
          analysisJson = JSON.stringify(practiceAnalysis);
          feedbackResult =
            practiceAnalysis.summary || "Syabas atas usaha anda!";
        } catch (e) {
          feedbackResult =
            "Syabas atas usaha anda! Teruskan berlatih untuk menjadi lebih handal.";
        }
      } else {
        // MASTERY ANALYSIS
        try {
          const masteryAnalysis = await trackedInvokeLLM({
            prompt: `You are an EdTech assessment specialist for Malaysian KSSR primary education. Analyze this student's mastery assessment results.

Topic: "${quiz?.topic_name}". Subject: "${quiz?.subject_name}". Score: ${score}% (${correct}/${questions.length} correct).

Questions and answers:
${questions
              .map((q, i) => {
                const targetAns = q.correct_answer || q.correctAnswer || "";
                const isCorrect =
                  String(answers[i] || "")
                    .trim()
                    .toLowerCase() ===
                  String(targetAns).trim().toLowerCase();
                return `Q${i + 1}: ${q.question} | Student: ${
                  answers[i] || "no answer"
                } | Correct: ${targetAns} | ${
                  isCorrect ? "CORRECT" : "WRONG"
                }`;
              })
              .join("\n")}

Generate a comprehensive mastery report. Respond in JSON:
{
  "mastery_level": "Mastered" (score>=80) | "Developing" (50-79) | "Needs Support" (<50),
  "strengths": ["areas of strength - in Bahasa Melayu"],
  "improvements": ["areas needing improvement - in Bahasa Melayu"],
  "ai_recommendation": "Specific recommendation in Bahasa Melayu based on the wrong answers pattern",
  "wrong_answer_review": [{"question": "the question text", "their_answer": "student's answer", "correct_answer": "correct answer", "what_went_wrong": "explanation of what went wrong in Bahasa Melayu", "concept_explanation": "correct concept explanation in Bahasa Melayu", "recommended_activity": "specific revision activity in Bahasa Melayu"}],
  "learning_path": "unlock_next" (score>=80) | "reinforcement" (50-79) | "revision" (<50)
}`,
            response_json_schema: {
              type: "object",
              properties: {
                mastery_level: { type: "string" },
                strengths: {
                  type: "array",
                  items: { type: "string" },
                },
                improvements: {
                  type: "array",
                  items: { type: "string" },
                },
                ai_recommendation: { type: "string" },
                wrong_answer_review: {
                  type: "array",
                  items: { type: "object" },
                },
                learning_path: { type: "string" },
              },
            },
          }, "quiz_analysis", quiz?.topic_name);
          analysisJson = JSON.stringify(masteryAnalysis);
          feedbackResult =
            masteryAnalysis.ai_recommendation ||
            `Skor anda: ${score}%.`;
        } catch (e) {
          feedbackResult = `Skor anda: ${score}%. ${
            score >= 80
              ? "Anda telah menguasai topik ini!"
              : score >= 50
                ? "Teruskan berlatih untuk lebih baik!"
                : "Jom ulang kaji topik ini sekali lagi."
          }`;
        }
      }

      // Create QuizAttempt with mode info
      const attempt = await base44.entities.QuizAttempt.create({
        student_id: studentId,
        quiz_id: quizId,
        topic_name: quiz?.topic_name || "Topik",
        subject_name: quiz?.subject_name || "Subjek",
        answers_json: JSON.stringify(answers),
        score,
        coins_earned: reward.coins,
        xp_earned: reward.xp,
        feedback_text:
          typeof feedbackResult === "object"
            ? JSON.stringify(feedbackResult)
            : feedbackResult,
        quiz_type: quizType,
        analysis_json: analysisJson,
      });
      const finalAttemptId = Array.isArray(attempt)
        ? attempt[0]?.id
        : attempt?.id;

      // Rewards already processed by processReward above (anti-farming engine)

      // ✅ Bersihkan cache sesi selepas berjaya submit
      clearQuizSession(quizId);

      if (document.fullscreenElement) {
        if (document.exitFullscreen)
          await document.exitFullscreen().catch(() => {});
      }
      navigate(`/quiz-result/${finalAttemptId}`);
    } catch (err) {
      setSubmitted(false);
      alert("Gagal menghantar kuiz. Sila cuba sekali lagi.");
    }
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-[#FAFAF7] min-h-screen space-y-3">
        <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
        <p className="text-xs font-bold text-stone-500">
          Menyediakan kertas soalan... ⚔️
        </p>
      </div>
    );

  if (questions.length === 0)
    return (
      <div className="p-6 text-center bg-red-50 border border-red-200 rounded-2xl max-w-md mx-auto my-12">
        <p className="text-sm font-bold text-red-700">
          Soalan kuiz belum disediakan untuk topik ini.
        </p>
        <Button
          onClick={() => navigate(-1)}
          className="mt-4 bg-red-600 text-white font-bold rounded-xl text-xs"
        >
          Kembali
        </Button>
      </div>
    );

  const q = questions[currentQ];
  const selectedAnswer = answers[currentQ];
  const allAnswered = Object.keys(answers).length === questions.length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 bg-[#FAFAF7] min-h-screen font-sans">
      {/* Header bar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl bg-stone-100 text-stone-600 hover:bg-stone-200"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="text-center">
          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
            {quiz?.subject_name}
          </span>
          <h1 className="text-xs sm:text-sm font-black text-stone-800">
            {quiz?.topic_name}
          </h1>
        </div>
        <span className="text-xs font-black bg-amber-100 text-amber-800 px-3 py-1 rounded-full">
          Soalan {currentQ + 1}/{questions.length}
        </span>
      </div>

      {/* Mode-aware banner */}
      <QuizModeHeader
        quizType={quizType}
        currentQ={currentQ}
        totalQ={questions.length}
      />

      {/* Hint button (practice only) */}
      {isPracticeMode && !selectedAnswer && (
        <div className="flex justify-end">
          <Button
            onClick={requestHint}
            disabled={hintLoading}
            variant="outline"
            className="text-xs font-bold border-amber-300 text-amber-700 hover:bg-amber-50"
          >
            {hintLoading ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <Lightbulb className="w-4 h-4 mr-1" />
            )}
            {hintLoading
              ? "Suku sedang berfikir..."
              : hint
                ? "Petunjuk Lain"
                : "Minta Petunjuk"}
          </Button>
        </div>
      )}

      {/* Hint display (practice only) */}
      {isPracticeMode && hint && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4"
        >
          <p className="text-xs font-black text-amber-800 flex items-center gap-1.5 mb-1">
            <Lightbulb className="w-4 h-4 text-amber-500" /> Petunjuk Suku:
          </p>
          <p className="text-xs text-stone-700 font-medium">{hint}</p>
        </motion.div>
      )}

      {/* Question card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQ}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-white p-6 rounded-3xl border-2 border-stone-200 shadow-sm space-y-5"
        >
          <h2 className="text-sm sm:text-base font-black text-stone-900 leading-relaxed">
            {currentQ + 1}. {q?.question}
          </h2>

          {/* Input mode toggle */}
          <div className="flex items-center gap-2 border-b pb-3 border-stone-100">
            <Button
              onClick={() => setInputMode("mcq")}
              type="button"
              className={`h-9 px-3 text-xs font-black rounded-xl ${
                inputMode === "mcq"
                  ? "bg-emerald-600 text-white"
                  : "bg-stone-100 text-stone-600"
              }`}
            >
              Pilihan Butang
            </Button>
            <Button
              onClick={() => setInputMode("draw")}
              type="button"
              className={`h-9 px-3 text-xs font-black rounded-xl ${
                inputMode === "draw"
                  ? "bg-emerald-600 text-white"
                  : "bg-stone-100 text-stone-600"
              }`}
            >
              <PenTool className="w-3.5 h-3.5 mr-1" /> Tulisan Tangan AI
            </Button>
          </div>

          {inputMode === "draw" ? (
            <DrawingCanvas
              expectedAnswer={q?.correct_answer || q?.correctAnswer}
              isVerifying={isVerifyingAI}
              onVerify={verifyHandwritingWithAI}
            />
          ) : (
            <div className="space-y-2.5">
              {q?.options?.map((option, i) => {
                const isSelected =
                  String(selectedAnswer || "").toLowerCase() ===
                  String(option).toLowerCase();

                // Mode-aware styling
                let buttonClass =
                  "border-stone-200 hover:border-emerald-200 hover:bg-stone-50 text-stone-700";
                let iconClass = "bg-stone-100 text-stone-500";
                let iconText = String.fromCharCode(65 + i);

                if (isSelected) {
                  if (isPracticeMode) {
                    // Practice: show correct/wrong
                    const correctAns =
                      q?.correct_answer || q?.correctAnswer || "";
                    const isCorrect =
                      String(correctAns).toLowerCase() ===
                      String(option).toLowerCase();

                    if (isCorrect) {
                      buttonClass =
                        "border-emerald-600 bg-emerald-50/50 text-emerald-900 font-bold";
                      iconClass = "bg-emerald-600 text-white";
                      iconText = "✓";
                    } else {
                      buttonClass =
                        "border-rose-400 bg-rose-50/50 text-rose-900 font-bold";
                      iconClass = "bg-rose-500 text-white";
                      iconText = "✗";
                    }
                  } else {
                    // Mastery: just show selected without correct/wrong indication
                    buttonClass =
                      "border-emerald-600 bg-emerald-50/50 text-emerald-900 font-bold";
                    iconClass = "bg-emerald-600 text-white";
                  }
                }

                return (
                  <button
                    key={i}
                    onClick={() => handleAnswer(currentQ, option)}
                    disabled={submitted}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-transform active:scale-[0.99] text-xs sm:text-sm flex items-center ${buttonClass}`}
                  >
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-black mr-3 shadow-sm shrink-0 ${iconClass}`}
                    >
                      {iconText}
                    </span>
                    <span className="flex-1">{option}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* AI Encouragement (practice only) */}
          {isPracticeMode && selectedAnswer && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-4 space-y-1"
            >
              <p className="text-xs font-black text-emerald-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-500" /> Suku
                Menggalakkan:
              </p>
              {aiLoading ? (
                <p className="text-xs text-stone-500 italic">
                  Suku sedang berfikir...
                </p>
              ) : (
                <p className="text-xs text-stone-700 font-medium leading-relaxed">
                  {aiEncouragement}
                </p>
              )}
            </motion.div>
          )}

          {/* Explanation (practice only) */}
          {isPracticeMode &&
            showExplanation &&
            selectedAnswer &&
            q?.explanation && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 space-y-1"
              >
                <p className="text-xs font-black text-amber-800 flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-amber-500" /> Penjelasan
                  Cikgu:
                </p>
                <p className="text-xs text-stone-700 font-medium leading-relaxed">
                  {q.explanation}
                </p>
              </motion.div>
            )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center gap-3">
        {currentQ > 0 && (
          <Button
            onClick={() => goToQuestion(currentQ - 1)}
            variant="outline"
            className="flex-1 rounded-xl h-12 text-xs font-bold border-stone-300 text-stone-600 hover:bg-stone-100"
          >
            Sebelumnya
          </Button>
        )}
        {currentQ < questions.length - 1 ? (
          <Button
            onClick={() => goToQuestion(currentQ + 1)}
            disabled={!selectedAnswer}
            className="flex-1 rounded-xl h-12 text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white border-0"
          >
            Seterusnya
          </Button>
        ) : (
          <Button
            className="flex-1 rounded-xl h-12 text-xs font-black bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-md"
            disabled={!allAnswered || submitted}
            onClick={handleSubmit}
          >
            {submitted ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> Memeriksa...
              </>
            ) : isMasteryMode ? (
              "Hantar Ujian ⚔️"
            ) : (
              "Selesaikan Latihan! 🌟"
            )}
          </Button>
        )}
      </div>

      {/* Question dots */}
      <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
        {questions.map((_, i) => (
          <button
            key={i}
            onClick={() => goToQuestion(i)}
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