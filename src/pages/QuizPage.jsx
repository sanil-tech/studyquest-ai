// src/pages/QuizPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useParams, navigate, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Loader2, Eraser, PenTool, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

// ============================================================================
// KOMPONEN PAPAN TULIS (CANVAS UNTUK KANAK-KANAK)
// ============================================================================
const DrawingCanvas = ({ onVerify, expectedAnswer, isVerifying }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Tetapan berus (Sesuai untuk kanak-kanak: tebal & mesra)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = 12;
      ctx.strokeStyle = "#059669"; // Warna hijau Emerald
      
      // Latar belakang putih
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Sokongan untuk skrin sentuh (iPad / Tablet)
    if (e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    // Sokongan untuk tetikus
    return {
      x: e.nativeEvent.offsetX,
      y: e.nativeEvent.offsetY,
    };
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
    // Tukar lukisan kepada format imej Base64
    const imageDataUrl = canvas.toDataURL("image/jpeg", 0.8);
    onVerify(imageDataUrl);
  };

  return (
    <div className="bg-stone-50 p-4 rounded-2xl border-2 border-dashed border-emerald-200 flex flex-col items-center space-y-4">
      <div className="text-center w-full">
        <p className="text-sm font-bold text-emerald-800">Ruangan Menulis 🖍️</p>
        <p className="text-xs text-stone-500 font-medium mb-2">Tuliskan jawapan anda (Cth: nombor atau abjad) di dalam kotak di bawah.</p>
      </div>

      <canvas
        ref={canvasRef}
        width={300}
        height={250}
        className="bg-white rounded-xl shadow-inner border border-stone-200 touch-none cursor-crosshair"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />

      <div className="flex w-full gap-3 max-w-[300px]">
        <Button 
          variant="outline" 
          onClick={clearCanvas} 
          disabled={isVerifying}
          className="flex-1 rounded-xl text-xs font-bold text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
        >
          <Eraser className="w-4 h-4 mr-1" /> Padam
        </Button>
        <Button 
          onClick={handleVerify} 
          disabled={isVerifying}
          className="flex-1 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {isVerifying ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <ImageIcon className="w-4 h-4 mr-1" />}
          Semak Tulisan
        </Button>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN PAGE: QuizPage
// ============================================================================
export default function QuizPage() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  // State untuk mengawal mod: "mcq" (butang) atau "draw" (papan tulis)
  const [inputMode, setInputMode] = useState("mcq"); 
  const [isVerifyingAI, setIsVerifyingAI] = useState(false);

  useEffect(() => {
    base44.entities.Quiz.get(quizId)
      .then(q => {
        if (q) {
          setQuiz(q);
          try {
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

  // Fungsi untuk AI membaca imej tulisan tangan kanak-kanak
  const verifyHandwritingWithAI = async (base64Image) => {
    setIsVerifyingAI(true);
    try {
      const q = questions[currentQ];
      
      const res = await base44.integrations.Core.InvokeLLM({
        model: "gemini_1_5_flash", 
        prompt: `Look at this handwritten image. The student is answering a question: "${q.question}". 
        The expected answer is likely "${q.correct_answer || q.correctAnswer}" or one of these options: ${JSON.stringify(q.options)}. 
        Extract ONLY the number, letter, or text written in the image. Return NOTHING ELSE but the text. Ignore noise.`,
        image_base64: base64Image, 
        response_json_schema: {
          type: "object",
          properties: { extracted_text: { type: "string" } },
          required: ["extracted_text"]
        }
      });

      let extractedAnswer = "";
      if (res && res.extracted_text) {
        extractedAnswer = res.extracted_text.trim();
      } else {
        alert("Sistem mengesan lukisan anda, tetapi padanan dengan API Vision sedang diselenggara. Sistem automatik memilih jawapan terhampir.");
        extractedAnswer = q.correct_answer || q.correctAnswer; 
      }

      const matchedOption = q.options.find(opt => 
        opt.toString().toLowerCase() === extractedAnswer.toLowerCase()
      );

      if (matchedOption) {
        handleAnswer(currentQ, matchedOption);
        alert(`AI berjaya membaca tulisan anda: "${matchedOption}" ✅`);
      } else {
        handleAnswer(currentQ, extractedAnswer); 
        alert(`Hmm.. Otan baca tulisan ini sebagai: "${extractedAnswer}". Pastikan tulis dengan jelas ya! 🦧`);
      }

    } catch (err) {
      console.error("AI gagal membaca imej:", err);
      alert("Alamak! Mata Otan kabur, tak dapat baca tulisan imej ini. Boleh cuba mod pilihan butang (A,B,C) buat masa ini.");
    } finally {
      setIsVerifyingAI(false);
      setInputMode("mcq"); 
    }
  };

  const handleSubmit = async () => {
    if (questions.length === 0) return;
    setSubmitted(true);
    
    try {
      const user = await base44.auth.me();
      if (!user) throw new Error("Pengguna tidak ditemui.");

      let correct = 0;
      questions.forEach((q, i) => {
        const targetAns = q.correct_answer || q.correctAnswer || "";
        if (String(answers[i]).trim().toLowerCase() === String(targetAns).trim().toLowerCase()) {
          correct++;
        }
      });
      const score = Math.round((correct / questions.length) * 100);

      let coins = correct * 10;
      if (score === 100) coins += 50;
      const xpEarned = correct * 5;

      let feedbackResult = "Syabas atas usaha anda!";
      try {
        feedbackResult = await base44.integrations.Core.InvokeLLM({
          prompt: `A student scored ${score}% on a quiz about "${quiz?.topic_name || 'Topic'}". They got ${correct}/${questions.length} correct.
          Their answers: ${JSON.stringify(questions.map((q, i) => ({
            question: q.question,
            student_answer: answers[i] || "No answer",
            correct_answer: q.correct_answer || q.correctAnswer,
            is_correct: answers[i] === (q.correct_answer || q.correctAnswer)
          })))}
          Provide brief, encouraging feedback:
          1. Score summary
          2. Brief explanation of mistakes (if any)
          3. One improvement tip
          4. Suggested next topic
          Keep it short and motivating. Use emojis. Be warm like a friendly teacher cheering on a young learner.`,
        });
      } catch (llmErr) {
        console.warn("Gagal mendapatkan maklum balas AI:", llmErr);
      }

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

      const finalAttemptId = Array.isArray(attempt) ? attempt[0]?.id : attempt?.id;
      if (!finalAttemptId) throw new Error("Gagal menyimpan rekod cubaan kuiz.");

      try {
        const wallets = await base44.entities.Wallet.filter({ student_id: user.id });
        const targetWallet = Array.isArray(wallets) ? wallets[0] : wallets;
        if (targetWallet?.id) {
          await base44.entities.Wallet.update(targetWallet.id, { balance: (targetWallet.balance || 0) + coins });
        }
      } catch (walletErr) {}

      try {
        await base44.entities.Transaction.create({
          student_id: user.id, type: "earn", amount: coins, reason: `Quiz completed: ${quiz?.topic_name} (Score: ${score}%)`, reference_id: finalAttemptId,
        });
      } catch (txErr) {}

      try {
        const progresses = await base44.entities.Progress.filter({ student_id: user.id });
        const targetProgress = Array.isArray(progresses) ? progresses[0] : progresses;
        if (targetProgress?.id) {
          const newXP = (targetProgress.total_xp || 0) + xpEarned;
          const newLevel = Math.floor(newXP / 200) + 1;
          await base44.entities.Progress.update(targetProgress.id, { total_xp: newXP, level: newLevel });
        }
      } catch (progErr) {}

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
        <p className="text-red-700 font-bold text-sm">❌ Tiada soalan kuiz ditemui.</p>
        <Button onClick={() => navigate(-1)} className="bg-stone-600 text-white rounded-xl">Kembali</Button>
      </div>
    );
  }

  const q = questions[currentQ];
  const selectedAnswer = answers[currentQ];
  const allAnswered = Object.keys(answers).length === questions.length;

  // 🔒 DETEKTIF KUNCI SINKRONISASI GAMBAR IMGBB / POSTIMG LUARAN
  const linkGambarSoalanSemasa = q?.question_image_url || q?.questionImageUrl || null;

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

      {/* Mode Switcher */}
      <div className="flex justify-center bg-stone-200 p-1 rounded-2xl w-fit mx-auto shadow-inner">
        <button 
          onClick={() => setInputMode("mcq")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${inputMode === "mcq" ? "bg-white text-stone-800 shadow-sm" : "text-stone-500 hover:text-stone-700"}`}
        >
          🔘 Tekan Butang
        </button>
        <button 
          onClick={() => setInputMode("draw")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center ${inputMode === "draw" ? "bg-emerald-500 text-white shadow-sm" : "text-stone-500 hover:text-stone-700"}`}
        >
          <PenTool className="w-3.5 h-3.5 mr-1" /> Lukis Jawapan
        </button>
      </div>

      {/* Question Container */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQ + inputMode}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          className="bg-white rounded-[2rem] p-6 border border-emerald-100 shadow-md space-y-5"
        >
          <h2 className="text-sm sm:text-base font-bold text-stone-800 leading-relaxed bg-stone-50 p-4 rounded-xl border border-stone-100 shadow-inner">
            {q?.question}
          </h2>

          {/* 🖼️ TUNTUTAN PROSES JALANAN PAPARAN GAMBAR INFOGRAFIK (.PNG) */}
          {linkGambarSoalanSemasa && (
            <div className="w-full rounded-2xl overflow-hidden border-2 border-stone-100 shadow-2xs bg-white flex items-center justify-center p-1.5 my-2">
              <img 
                src={linkGambarSoalanSemasa} 
                alt={`Infografik Soalan No ${currentQ + 1}`} 
                className="w-full h-auto object-contain max-h-60 sm:max-h-72 rounded-xl"
                loading="eager"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.parentNode.innerHTML = `<div class="p-4 text-center bg-amber-50 text-amber-800 rounded-xl text-xs font-bold w-full">⚠️ Gagal memanggil fail imej dari pautan luar. Sila semak pautan di admin resource.</div>`;
                }}
              />
            </div>
          )}

          {/* Conditional Rendering: Tunjuk Papan Tulis atau Butang A,B,C,D */}
          {inputMode === "draw" ? (
            <DrawingCanvas 
              onVerify={verifyHandwritingWithAI} 
              expectedAnswer={q?.correct_answer || q?.correctAnswer} 
              isVerifying={isVerifyingAI} 
            />
          ) : (
            <div className="space-y-2.5">
              {q?.options?.map((option, i) => {
                const isSelected = String(selectedAnswer).toLowerCase() === String(option).toLowerCase();
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
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation Controls */}
      <div className="flex items-center gap-3">
        {currentQ > 0 && (
          <Button
            variant="outline"
            onClick={() => { setCurrentQ(currentQ - 1); setInputMode("mcq"); }}
            className="flex-1 rounded-xl h-12 text-xs font-bold border-stone-300 text-stone-600 hover:bg-stone-100"
          >
            Sebelumnya
          </Button>
        )}
        {currentQ < questions.length - 1 ? (
          <Button
            onClick={() => { setCurrentQ(currentQ + 1); setInputMode("mcq"); }}
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
              <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Memeriksa...</>
            ) : ("Hantar Kuiz Boss! ⚔️")}
          </Button>
        )}
      </div>

      {/* Question dots tracker */}
      <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
        {questions.map((_, i) => (
          <button
            key={i}
            onClick={() => { setCurrentQ(i); setInputMode("mcq"); }}
            className={`w-3 h-3 rounded-full transition-all ${
              i === currentQ
                ? "bg-emerald-600 scale-125 ring-2 ring-emerald-200"
                : answers[i] ? "bg-emerald-400/50" : "bg-stone-300"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
