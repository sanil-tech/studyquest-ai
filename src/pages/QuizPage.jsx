// src/pages/QuizPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, CheckCircle2, XCircle, ArrowLeft, Trophy, Star, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function QuizPage() {
  const { quizId } = useParams();
  const navigate = useNavigate();

  // States Utama
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [quizMeta, setQuizMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showResult, setShowResult] = useState(false);

  // Rekod Masa
  const startTimeRef = useRef(Date.now());
  const [timeTaken, setTimeTaken] = useState("");

  // 1. Ambil Data Kuiz dari Database base44 dengan Penormalan Lajur CSV
  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        const quizData = await base44.entities.Quiz.get(quizId);
        if (quizData) {
          setQuizMeta(quizData);
          
          // Ambil strings JSON
          let rawData = quizData.questions_json || "[]";
          
          // Jika data tersangkut dalam double encoded string, kita parse sekali lagi
          if (typeof rawData === "string") {
            rawData = JSON.parse(rawData);
          }
          
          if (Array.isArray(rawData)) {
            // 🛠️ LOGIK PINTAR: Tukar kunci Huruf Besar CSV kepada huruf kecil jika perlu
            const normalizedQuestions = rawData.map(q => ({
              question: q.question || q.Question || q.soalan || "",
              options: Array.isArray(q.options) ? q.options : (q.Options || q.pilihan || []),
              correct_answer: q.correct_answer || q.Correct_Answer || q.jawapan || "",
              explanation: q.explanation || q.Explanation || q.ulasan || ""
            }));
            
            setQuestions(normalizedQuestions);
            console.log("🎯 Soalan berjaya dinormalisasikan & dimuatkan:", normalizedQuestions);
          }
        }
      } catch (err) {
        console.error("Gagal memuatkan atau mem-parse data kuiz:", err);
      } finally {
        setLoading(false);
        startTimeRef.current = Date.now();
      }
    };
    fetchQuizData();
  }, [quizId]);

  // 2. Logik Pengesahan Jawapan
  const handleOptionClick = (option) => {
    if (isAnswered) return; // Kunci jika dah jawab
    setSelectedOpt(option);
    setIsAnswered(true);

    const currentQuestion = questions[currentIdx];
    // Trim teks untuk elakkan ralat ruang kosong
    if (option.trim() === currentQuestion.correct_answer.trim()) {
      setScore(p => p + 1);
    }
  };

  // 3. Logik Butang Seterusnya / Selesai
  const handleNext = () => {
    setSelectedOpt(null);
    setIsAnswered(false);

    if (currentIdx < questions.length - 1) {
      setCurrentIdx(p => p + 1);
    } else {
      // Hitung masa keseluruhan kuiz diambil
      const durationSec = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const mins = Math.floor(durationSec / 60);
      const secs = durationSec % 60;
      setTimeTaken(`${mins} minit ${secs} saat`);
      setShowResult(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 space-y-3">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-bold text-slate-500 animate-pulse">Memuatkan kertas soalan kuiz...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <p className="text-slate-600 font-medium mb-4">Alamak, soalan tidak ditemui atau pangkalan data kosong.</p>
        <Button onClick={() => navigate(-1)} className="rounded-xl bg-indigo-600">
          <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
        </Button>
      </div>
    );
  }

  const currentQ = questions[currentIdx];

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        
        {/* JIKA KUIZ SEDANG BERJALAN */}
        {!showResult ? (
          <div className="space-y-6">
            {/* BAR ATAS: PROGRESS */}
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="rounded-xl text-slate-500">
                <ArrowLeft className="w-4 h-4 mr-1" /> Keluar
              </Button>
              <div className="text-center">
                <span className="text-xs font-black text-indigo-600 uppercase tracking-wider bg-indigo-50 px-3 py-1 rounded-full">
                  {quizMeta?.difficulty || "Medium"} Mode
                </span>
                <p className="text-xs text-slate-400 mt-1.5 font-bold">
                  Soalan {currentIdx + 1} daripada {questions.length}
                </p>
              </div>
              <div className="text-right text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                Score: {score}
              </div>
            </div>

            {/* STATUS PROGRESS BAR */}
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-600 transition-all duration-300"
                style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
              />
            </div>

            {/* KAD SOALAN UTAMA */}
            <div className="bg-white rounded-3xl border-2 border-slate-100 p-6 sm:p-8 shadow-sm space-y-6">
              <h2 className="text-lg sm:text-xl font-heading font-extrabold text-slate-800 leading-relaxed">
                {currentQ.question}
              </h2>

              {/* PILIHAN JAWAPAN (A, B, C, D) */}
              <div className="grid grid-cols-1 gap-3">
                {currentQ.options?.map((option, index) => {
                  const isSelected = selectedOpt === option;
                  const isCorrect = option.trim() === currentQ.correct_answer.trim();
                  
                  let optStyle = "border-slate-200 hover:bg-slate-50 text-slate-700";
                  if (isAnswered) {
                    if (isCorrect) {
                      optStyle = "border-emerald-500 bg-emerald-50 text-emerald-800 font-bold shadow-[0_4px_0_0_#10b981]";
                    } else if (isSelected && !isCorrect) {
                      optStyle = "border-rose-500 bg-rose-50 text-rose-800 font-bold shadow-[0_4px_0_0_#f43f5e]";
                    } else {
                      optStyle = "border-slate-100 bg-slate-50/50 text-slate-400 opacity-60";
                    }
                  }

                  return (
                    <button
                      key={index}
                      disabled={isAnswered}
                      onClick={() => handleOptionClick(option)}
                      className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${optStyle}`}
                    >
                      <span className="text-sm sm:text-base font-semibold">{option}</span>
                      {isAnswered && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 ml-2" />}
                      {isAnswered && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-rose-600 shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* KOTAK PENJELASAN (MUNCUL SELEPAS JAWAB) */}
            <AnimatePresence>
              {isAnswered && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 15 }}
                  className="bg-indigo-50 border-2 border-indigo-100 p-5 rounded-2xl space-y-2"
                >
                  <p className="text-xs font-black text-indigo-700 tracking-wider uppercase">💡 Ulasan Guru AI:</p>
                  <p className="text-xs sm:text-sm text-indigo-900 leading-relaxed font-medium">
                    {currentQ.explanation || "Syabas! Teruskan usaha menjawab soalan seterusnya."}
                  </p>
                  <div className="flex justify-end pt-2">
                    <Button onClick={handleNext} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-md">
                      {currentIdx === questions.length - 1 ? "Lihat Keputusan" : "Seterusnya"} <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          
          /* ========================================================= */
          /* KAD KEPUTUSAN AKHIR (RESULT SCREEN)                       */
          /* ========================================================= */
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl border border-slate-100 p-8 text-center shadow-xl space-y-6"
          >
            <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto border-4 border-amber-200 shadow-inner">
              <Trophy className="w-10 h-10 animate-bounce" />
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl font-heading font-black text-slate-800">Taniah! Selesai Kuiz</h1>
              <p className="text-sm text-slate-500 font-medium">Anda telah menamatkan cabaran topik {quizMeta?.topic_name}.</p>
            </div>

            {/* PAPARAN MARKAH BESAR */}
            <div className="bg-slate-50 rounded-2xl p-6 border max-w-sm mx-auto grid grid-cols-2 gap-4 divide-x">
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase">Markah Anda</p>
                <p className="text-3xl font-black text-indigo-600 mt-1">{score} / {questions.length}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase">Masa Diambil</p>
                <p className="text-sm font-black text-slate-700 mt-3 flex items-center justify-center gap-1">
                  <Clock className="w-4 h-4 text-slate-400" /> {timeTaken}
                </p>
              </div>
            </div>

            {/* STATUS PERINTIS / RATING STAR */}
            <div className="flex justify-center gap-1 text-amber-400">
              {[...Array(3)].map((_, i) => {
                const percent = (score / questions.length) * 100;
                const active = i === 0 || (i === 1 && percent >= 50) || (i === 2 && percent >= 85);
                return <Star key={i} className={`w-6 h-6 ${active ? "fill-amber-400" : "text-slate-200"}`} />;
              })}
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-2 justify-center">
              <Button onClick={() => navigate(-1)} variant="outline" className="rounded-xl h-11 border-2 font-bold">
                Kembali Ke Nota
              </Button>
              <Button onClick={() => window.location.reload()} className="rounded-xl h-11 bg-indigo-600 hover:bg-indigo-700 font-bold">
                Cuba Kuiz Semula
              </Button>
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}