// src/pages/QuizPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, CheckCircle2, XCircle, ArrowLeft, Trophy, Star, Clock, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function QuizPage() {
  const { quizId } = useParams();
  const navigate = useNavigate();

  // States Utama Kuiz
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

  // 1. MEMBACA & MENGURAI DATA KUIZ (DEEP PARSING LOOP)
  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        console.log("Mengambil data Quiz ID:", quizId);
        const quizData = await base44.entities.Quiz.get(quizId);
        
        if (quizData) {
          setQuizMeta(quizData);
          
          // Ambil strings mentah dari lajur questions_json mengikut skema
          let rawData = quizData.questions_json || "[]";
          
          // Kupas lapisan string jika data tersangkut dalam format string berkali-kali
          while (typeof rawData === "string") {
            try {
              rawData = JSON.parse(rawData);
            } catch (e) {
              console.error("Gagal melakukan parse JSON:", e);
              break;
            }
          }

          if (Array.isArray(rawData) && rawData.length > 0) {
            // Selaraskan struktur data supaya serasi dengan bank soalan CSV mahupun Flashcard
            const normalizedQuestions = rawData.map(q => {
              const teksSoalan = q.question || q.Question || q.front || "";
              let jawapanTepat = q.correct_answer || q.Correct_Answer || "";
              let ulasanCikgu = q.explanation || q.Explanation || "";
              
              // Pemulihan jika data dihantar dalam struktur Flashcard literal { front, back }
              if (q.back && !jawapanTepat) {
                const parts = q.back.split("\n\n");
                jawapanTepat = parts[0] || "";
                ulasanCikgu = parts[1] || "";
              }

              // Ambil pilihan jawapan, bina pilihan dinamik jika tiada options
              let pilihanJawapan = q.options || q.Options || [];
              if ((!pilihanJawapan || pilihanJawapan.length === 0) && jawapanTepat) {
                pilihanJawapan = [
                  jawapanTepat, 
                  "Pilihan Salah A", 
                  "Pilihan Salah B", 
                  "Pilihan Salah C"
                ];
                // Rawakkan kedudukan jawapan betul
                pilihanJawapan.sort(() => Math.random() - 0.5);
              }

              return {
                question: teksSoalan,
                options: pilihanJawapan,
                correct_answer: jawapanTepat,
                explanation: ulasanCikgu
              };
            });

            const validQuestions = normalizedQuestions.filter(q => q.question !== "");
            setQuestions(validQuestions);
            console.log("🎯 Kertas soalan berjaya disiarkan:", validQuestions);
          }
        }
      } catch (err) {
        console.error("Ralat kritikal memuatkan halaman kuiz:", err);
      } finally {
        setLoading(false);
        startTimeRef.current = Date.now();
      }
    };
    
    fetchQuizData();
  }, [quizId]);

  // 2. LOGIK PENGESAHAN JAWAPAN KUIZ
  const handleOptionClick = (option) => {
    if (isAnswered) return;
    setSelectedOpt(option);
    setIsAnswered(true);

    if (option.trim() === questions[currentIdx].correct_answer.trim()) {
      setScore(p => p + 1);
    }
  };

  // 3. LOGIK NAVIGASI SEBELUM / SETERUSNYA
  const handleNext = () => {
    setSelectedOpt(null);
    setIsAnswered(false);

    if (currentIdx < questions.length - 1) {
      setCurrentIdx(p => p + 1);
    } else {
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
        <p className="text-xs font-bold text-slate-500 animate-pulse">Menyusun helaian kertas ujian kuiz...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm max-w-sm space-y-4">
          <p className="text-slate-600 text-sm font-bold">⚠️ Sesi kuiz tidak dapat dimuatkan buat masa ini.</p>
          <Button onClick={() => navigate(-1)} className="rounded-xl bg-indigo-600 w-full h-11">
            <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Nota
          </Button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIdx];

  return (
    <div className="min-h-screen bg-slate-50/60 py-8 px-4 sm:px-6">
      <div className="max-w-xl mx-auto">
        
        {!showResult ? (
          <div className="space-y-5">
            {/* BAR KEMAJUAN ATAS */}
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="rounded-xl text-slate-500 h-9">
                <ArrowLeft className="w-4 h-4 mr-1" /> Keluar
              </Button>
              <div className="text-center">
                <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                  Mod {quizMeta?.difficulty || "Medium"}
                </span>
                <p className="text-[11px] text-slate-400 font-bold mt-1.5">
                  Soalan {currentIdx + 1} / {questions.length}
                </p>
              </div>
              <div className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                Markah: {score}
              </div>
            </div>

            {/* PROGRESS LINE BAR */}
            <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden shadow-inner">
              <div 
                className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
                style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
              />
            </div>

            {/* PAPARAN KAD SOALAN UTAMA */}
            <div className="bg-white rounded-3xl border-2 border-slate-100 p-6 sm:p-8 shadow-sm space-y-6">
              <h2 className="text-base sm:text-lg font-heading font-extrabold text-slate-800 leading-relaxed text-center sm:text-left">
                {currentQ.question}
              </h2>

              {/* LIST UTAMA PILIHAN JAWAPAN (A, B, C, D) */}
              <div className="grid grid-cols-1 gap-3">
                {currentQ.options?.map((option, index) => {
                  const isSelected = selectedOpt === option;
                  const isCorrect = option.trim() === currentQ.correct_answer.trim();
                  
                  let optStyle = "border-slate-200 hover:bg-indigo-50/30 hover:border-indigo-200 text-slate-700 bg-white";
                  if (isAnswered) {
                    if (isCorrect) {
                      optStyle = "border-emerald-500 bg-emerald-50 text-emerald-800 font-black shadow-[0_4px_0_0_#10b981]";
                    } else if (isSelected && !isCorrect) {
                      optStyle = "border-rose-500 bg-rose-50 text-rose-800 font-black shadow-[0_4px_0_0_#f43f5e]";
                    } else {
                      optStyle = "border-slate-100 bg-slate-50 text-slate-400 opacity-50";
                    }
                  }

                  return (
                    <button
                      key={index}
                      disabled={isAnswered}
                      onClick={() => handleOptionClick(option)}
                      className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 flex items-center justify-between text-sm font-semibold shadow-sm active:scale-[0.99] ${optStyle}`}
                    >
                      <span>{option}</span>
                      {isAnswered && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 ml-2 animate-bounce" />}
                      {isAnswered && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-rose-600 shrink-0 ml-2 animate-shake" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* KOTAK MAKLUM BALAS ULASAN CIKGU AI */}
            <AnimatePresence>
              {isAnswered && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12 }}
                  className="bg-indigo-50/80 border-2 border-indigo-100 p-5 rounded-2xl space-y-2 shadow-sm"
                >
                  <p className="text-[11px] font-black text-indigo-700 tracking-wider uppercase flex items-center gap-1">
                    <Lightbulb className="w-3.5 h-3.5" /> Ulasan Cikgu AI:
                  </p>
                  <p className="text-xs sm:text-sm text-indigo-950 leading-relaxed font-medium bg-white/70 p-3 rounded-xl border border-indigo-100/50">
                    {currentQ.explanation || "Hebat sekali! Teruskan fokus untuk menjawab baki soalan kuiz seteterusnya. ✨"}
                  </p>
                  <div className="flex justify-end pt-1">
                    <Button onClick={handleNext} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold shadow-md h-10 px-4">
                      {currentIdx === questions.length - 1 ? "Lihat Keputusan" : "Seterusnya"} <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          
          /* ========================================================= */
          /* SKRIN KEPUTUSAN AKHIR (RESULT SCREEN)                     */
          /* ========================================================= */
          <motion.div 
            initial={{ scale: 0.97, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl border-2 border-slate-100 p-8 text-center shadow-xl space-y-6"
          >
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto border-4 border-amber-200 shadow-inner">
              <Trophy className="w-8 h-8 animate-bounce" />
            </div>

            <div className="space-y-1">
              <h1 className="text-xl font-heading font-black text-slate-800">Ujian Selesai, Syabas! 🏆</h1>
              <p className="text-xs text-slate-400 font-bold">Topik: {quizMeta?.topic_name}</p>
            </div>

            <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200/60 max-w-xs mx-auto grid grid-cols-2 gap-4 divide-x divide-slate-200">
              <div>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Markah Anda</p>
                <p className="text-2xl font-black text-indigo-600 mt-1">{score} / {questions.length}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Masa Dijawab</p>
                <p className="text-xs font-black text-slate-700 mt-2.5 flex items-center justify-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> {timeTaken}
                </p>
              </div>
            </div>

            {/* BINTANG PENILAIAN PRESTASI */}
            <div className="flex justify-center gap-1.5 text-amber-400">
              {[...Array(3)].map((_, i) => {
                const percent = (score / questions.length) * 100;
                const active = i === 0 || (i === 1 && percent >= 50) || (i === 2 && percent >= 85);
                return <Star key={i} className={`w-6 h-6 ${active ? "fill-amber-400" : "text-slate-200"}`} />;
              })}
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
              <Button onClick={() => navigate(-1)} variant="outline" className="rounded-xl h-11 border-2 font-bold text-xs px-5">
                Kembali ke Nota
              </Button>
              <Button onClick={() => window.location.reload()} className="rounded-xl h-11 bg-indigo-600 hover:bg-indigo-700 font-bold text-xs px-5 shadow-md">
                Cuba Kuiz Semula
              </Button>
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}