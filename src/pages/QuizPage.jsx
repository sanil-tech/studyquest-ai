// src/pages/QuizPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Loader2, Eraser, PenTool, Image as ImageIcon, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { getActiveStudentId, awardCoinsAndXP } from "@/lib/rewardSystem";

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
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top }; 
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
        <p className="text-sm font-bold text-emerald-800">Ruangan Menulis 🖍️</p>
        <p className="text-xs text-stone-500">Tulis jawapan anda di bawah dan biarkan AI menyemaknya!</p>
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
        <Button className="flex-1 rounded-xl border-stone-300 text-stone-600 h-10 text-xs font-bold" disabled={isVerifying} onClick={clearCanvas} type="button" variant="outline">
          <Eraser className="w-4 h-4 mr-1"/> Padam
        </Button>
        <Button className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white h-10 text-xs font-black shadow-md" disabled={isVerifying} onClick={handleVerify} type="button">
          {isVerifying ? (
            <><Loader2 className="w-4 h-4 animate-spin mr-1"/> Semak...</>
          ) : (
            <><CheckCircle2 className="w-4 h-4 mr-1"/> Hantar Jawapan</>
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

  useEffect(() => {
    const loadQuiz = async () => {
      try {
        const q = await base44.entities.Quiz.get(quizId);
        setQuiz(q);
        
        let parsed = safeJsonParse(q.questions_json, []);

        // Apply question limit from URL param (?limit=10 or ?limit=20)
        const limitParam = parseInt(searchParams.get("limit"));
        if (limitParam && limitParam > 0 && parsed.length > limitParam) {
          // Shuffle and slice to get the requested number of questions
          const shuffled = [...parsed];
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }
          parsed = shuffled.slice(0, limitParam);
        }

        if (parsed.length > 0) setQuestions(parsed);
      } catch (e) {
        console.error("Gagal memuat turun kuiz:", e);
      } finally {
        setLoading(false);
      }
    };
    loadQuiz();
  }, [quizId, searchParams]);

  const handleAnswer = (index, answer) => {
    setAnswers(prev => ({ ...prev, [index]: answer }));
    setShowExplanation(true);
  };

  const verifyHandwritingWithAI = async (imageDataUrl) => {
    setIsVerifyingAI(true);
    try {
      const q = questions[currentQ];
      const targetAns = q?.correct_answer || q?.correctAnswer || "";

      const promptMsg = `Look at this handwritten image of a primary school student. Is the written text matching "${targetAns}"? Answer strictly YES or NO, followed by detected text.`;
      
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: promptMsg,
        file_urls: [imageDataUrl]
      });

      const resStr = String(res).toLowerCase();
      if (resStr.includes("yes")) {
        handleAnswer(currentQ, targetAns);
        alert("✨ AI mengesahkan jawapan tulisan tangan anda TEPAT!");
      } else {
        alert(`AI mengesahkan tulisan anda belum tepat. Jawapan dijangka: ${targetAns}`);
      }
    } catch (e) {
      alert("AI sibuk sebentar. Sila guna pilihan butang.");
    } finally {
      setIsVerifyingAI(false);
      setInputMode("mcq");
    }
  };

  // 🔥 SUBMIT QUIZ RESULTS UNDER ACTIVE STUDENT ID
  const handleSubmit = async () => {
    if (questions.length === 0) return; 
    setSubmitted(true);

    try {
      const studentId = await getActiveStudentId();
      if (!studentId) throw new Error("Pengguna tidak dikesan");

      let correct = 0; 
      questions.forEach((q, i) => { 
        const targetAns = q.correct_answer || q.correctAnswer || ""; 
        if (String(answers[i] || "").trim().toLowerCase() === String(targetAns).trim().toLowerCase()) correct++; 
      });

      const score = Math.round((correct / questions.length) * 100);
      let coins = correct * 10; 
      if (score === 100) coins += 50; 
      const xpEarned = correct * 5;
      
      let feedbackResult = "Syabas atas usaha anda!";
      try { 
        feedbackResult = await base44.integrations.Core.InvokeLLM({ 
          prompt: `Student scored ${score}% on quiz "${quiz?.topic_name}". warm friendly teacher feedback.` 
        }); 
      } catch(e){}

      // 1. Cipta Percubaan Kuiz
      const attempt = await base44.entities.QuizAttempt.create({ 
        student_id: studentId, 
        quiz_id: quizId, 
        topic_name: quiz?.topic_name || "Topik", 
        subject_name: quiz?.subject_name || "Subjek", 
        answers_json: JSON.stringify(answers), 
        score, 
        coins_earned: coins, 
        xp_earned: xpEarned,
        feedback_text: typeof feedbackResult === "object" ? JSON.stringify(feedbackResult) : feedbackResult 
      });
      const finalAttemptId = Array.isArray(attempt) ? attempt[0]?.id : attempt?.id;

      // 2. Anugerah Daun & XP menggunakan Fail-Safe System
      await awardCoinsAndXP(studentId, {
        coins,
        xp: xpEarned,
        reason: `Kuiz Boss: ${quiz?.topic_name || "Cabaran"}`,
        referenceId: finalAttemptId
      });

      if (document.fullscreenElement) { 
        if (document.exitFullscreen) await document.exitFullscreen().catch(()=>{}); 
      }
      navigate(`/quiz-result/${finalAttemptId}`);

    } catch (err) { 
      setSubmitted(false); 
      alert("Gagal menghantar kuiz. Sila cuba sekali lagi."); 
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 bg-[#FAFAF7] min-h-screen space-y-3">
      <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      <p className="text-xs font-bold text-stone-500">Menyediakan kertas soalan Kuiz Boss... ⚔️</p>
    </div>
  );

  if (questions.length === 0) return (
    <div className="p-6 text-center bg-red-50 border border-red-200 rounded-2xl max-w-md mx-auto my-12">
      <p className="text-sm font-bold text-red-700">Soalan kuiz belum disediakan untuk topik ini.</p>
      <Button onClick={() => navigate(-1)} className="mt-4 bg-red-600 text-white font-bold rounded-xl text-xs">
        Kembali
      </Button>
    </div>
  );

  const q = questions[currentQ];
  const selectedAnswer = answers[currentQ];
  const allAnswered = Object.keys(answers).length === questions.length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 bg-[#FAFAF7] min-h-screen font-sans">
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-stone-100 text-stone-600 hover:bg-stone-200">
          <ArrowLeft className="w-4 h-4"/>
        </button>
        <div className="text-center">
          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{quiz?.subject_name}</span>
          <h1 className="text-xs sm:text-sm font-black text-stone-800">{quiz?.topic_name}</h1>
        </div>
        <span className="text-xs font-black bg-amber-100 text-amber-800 px-3 py-1 rounded-full">
          Soalan {currentQ + 1}/{questions.length}
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={currentQ} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-white p-6 rounded-3xl border-2 border-stone-200 shadow-sm space-y-5">
          <h2 className="text-sm sm:text-base font-black text-stone-900 leading-relaxed">
            {currentQ + 1}. {q?.question}
          </h2>

          <div className="flex items-center gap-2 border-b pb-3 border-stone-100">
            <Button onClick={() => setInputMode("mcq")} type="button"
              className={`h-9 px-3 text-xs font-black rounded-xl ${inputMode === "mcq" ? "bg-emerald-600 text-white" : "bg-stone-100 text-stone-600"}`}
            >
              Pilihan Butang
            </Button>
            <Button onClick={() => setInputMode("draw")} type="button"
              className={`h-9 px-3 text-xs font-black rounded-xl ${inputMode === "draw" ? "bg-emerald-600 text-white" : "bg-stone-100 text-stone-600"}`}
            >
              <PenTool className="w-3.5 h-3.5 mr-1"/> Tulisan Tangan AI
            </Button>
          </div>

          {inputMode === "draw" ? ( 
            <DrawingCanvas expectedAnswer={q?.correct_answer || q?.correctAnswer} isVerifying={isVerifyingAI} onVerify={verifyHandwritingWithAI} />
          ) : (
            <div className="space-y-2.5">
              {q?.options?.map((option, i) => {
                const isSelected = String(selectedAnswer || "").toLowerCase() === String(option).toLowerCase();
                const correctAns = q?.correct_answer || q?.correctAnswer || "";
                const isCorrect = isSelected && String(correctAns).toLowerCase() === String(option).toLowerCase();
                const isWrongChoice = isSelected && !isCorrect;
                return (
                  <button 
                    key={i} 
                    onClick={() => handleAnswer(currentQ, option)} 
                    disabled={submitted} 
                    className={`w-full text-left p-4 rounded-xl border-2 transition-transform active:scale-[0.99] text-xs sm:text-sm flex items-center ${isCorrect ? "border-emerald-600 bg-emerald-50/50 text-emerald-900 font-bold" : isWrongChoice ? "border-rose-400 bg-rose-50/50 text-rose-900 font-bold" : isSelected ? "border-emerald-600 bg-emerald-50/50 text-emerald-900 font-bold" : "border-stone-200 hover:border-emerald-200 hover:bg-stone-50 text-stone-700"}`}
                  >
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-black mr-3 shadow-sm shrink-0 ${isCorrect ? "bg-emerald-600 text-white" : isWrongChoice ? "bg-rose-500 text-white" : isSelected ? "bg-emerald-600 text-white" : "bg-stone-100 text-stone-500"}`}>
                      {isCorrect ? "✓" : isWrongChoice ? "✗" : String.fromCharCode(65 + i)}
                    </span>
                    <span className="flex-1">{option}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* EXPLANATION DISPLAY — shown after student answers */}
          {showExplanation && selectedAnswer && q?.explanation && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }} 
              animate={{ opacity: 1, y: 0 }}
              className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 space-y-1"
            >
              <p className="text-xs font-black text-amber-800 flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-amber-500" /> Penjelasan Cikgu:
              </p>
              <p className="text-xs text-stone-700 font-medium leading-relaxed">{q.explanation}</p>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center gap-3">
        {currentQ > 0 && ( 
          <Button onClick={() => { setCurrentQ(currentQ - 1); setInputMode("mcq"); setShowExplanation(!!answers[currentQ - 1]); }}
            variant="outline"
            className="flex-1 rounded-xl h-12 text-xs font-bold border-stone-300 text-stone-600 hover:bg-stone-100"
          >
            Sebelumnya
          </Button>
        )}
        {currentQ < questions.length - 1 ? ( 
          <Button onClick={() => { setCurrentQ(currentQ + 1); setInputMode("mcq"); setShowExplanation(!!answers[currentQ + 1]); }}
            disabled={!selectedAnswer}
            className="flex-1 rounded-xl h-12 text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white border-0"
          >
            Seterusnya
          </Button>
        ) : ( 
          <Button className="flex-1 rounded-xl h-12 text-xs font-black bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-md" disabled={!allAnswered || submitted} onClick={handleSubmit}>
            {submitted ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2"/> Memeriksa...</>
            ) : (
              "Hantar Kuiz Boss! ⚔️"
            )}
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
        {questions.map((_, i) => ( 
          <button 
            key={i} 
            onClick={() => { setCurrentQ(i); setInputMode("mcq"); setShowExplanation(!!answers[i]); }} 
            className={`w-3 h-3 rounded-full transition-all ${i === currentQ ? "bg-emerald-600 scale-125 ring-2 ring-emerald-200" : answers[i] ? "bg-emerald-400/50" : "bg-stone-300"}`} 
          /> 
        ))}
      </div>
    </div>
  );
}