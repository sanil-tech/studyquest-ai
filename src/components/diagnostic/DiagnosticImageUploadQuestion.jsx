import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Loader2, CheckCircle2, RotateCw, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useDiagnosticAudio } from "@/hooks/useDiagnosticAudio";

export default function DiagnosticImageUploadQuestion({ question, questionNumber, totalQuestions, onAnswerNext }) {
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const fileInputRef = useRef(null);

  // Auto-play instruction
  const { audioUrl, loading: loadingAudio, playAudio } = useDiagnosticAudio(question.id, question.question, true);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setImageUrl(file_url);
      await analyzeHandwriting(file_url);
    } catch (err) {
      console.error("Upload error:", err);
      alert("Gagal memuat naik gambar. Cuba lagi.");
    } finally {
      setUploading(false);
    }
  };

  const analyzeHandwriting = async (imgUrl) => {
    setAnalyzing(true);
    try {
      const res = await base44.functions.invoke("analyzeHandwriting", {
        image_url: imgUrl,
        target_text: question.correct || question.display || "",
        skill: question._meta?.skill,
        sub_skill: question._meta?.sub_skill,
        question_id: question.id,
      });
      setAiAnalysis(res.data);
    } catch (err) {
      console.error("Handwriting analysis error:", err);
      // Fallback — allow manual submit
      setAiAnalysis({
        overall_score: 0,
        is_correct: false,
        strength: "Pelajar berusaha menulis.",
        needs_practice: "Latihan menulis diperlukan.",
        educational_feedback: "Teruskan berlatih!",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmit = () => {
    setShowResult(true);
  };

  const handleNext = () => {
    onAnswerNext(
      aiAnalysis?.is_correct ?? true,
      {
        imageUrl,
        target: question.correct,
        question: question.display,
        ai_analysis: aiAnalysis,
      }
    );
    setImageUrl(null);
    setShowResult(false);
    setAiAnalysis(null);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <motion.div
      key={question.id}
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-1.5">
        {Array.from({ length: totalQuestions }).map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all duration-300 ${
              i < questionNumber ? "bg-emerald-500 w-8" : i === questionNumber - 1 ? "bg-amber-400 w-8" : "bg-stone-700 w-4"
            }`}
          />
        ))}
      </div>

      <p className="text-center text-xs font-black text-stone-400 uppercase tracking-widest">
        Soalan {questionNumber} / {totalQuestions} · 📸 Tulisan Tangan
      </p>

      {/* Question + what to write */}
      <div className="text-center space-y-3 py-2">
        <p className="text-lg font-black text-white">{question.question}</p>
        {question.display && (
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="text-5xl sm:text-6xl font-black text-blue-300 py-6 min-h-[100px] flex items-center justify-center"
          >
            {question.display}
          </motion.div>
        )}
      </div>

      {/* TTS — auto-plays; replay button */}
      <div className="flex items-center justify-center">
        {loadingAudio ? (
          <div className="flex items-center gap-2 text-xs font-bold text-stone-400">
            <div className="w-4 h-4 border-2 border-stone-500 border-t-stone-300 rounded-full animate-spin" />
            Sediakan suara...
          </div>
        ) : audioUrl ? (
          <button
            onClick={playAudio}
            className="flex items-center gap-2 bg-blue-500/20 border-2 border-blue-400/40 text-blue-300 font-black px-4 py-2.5 rounded-2xl text-sm active:scale-95 transition-all"
          >
            <RotateCw className="w-4 h-4" /> Dengar Lagi
          </button>
        ) : null}
      </div>

      {/* Upload / Analyzing / Result */}
      {!showResult && (
        <div className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />

          {!imageUrl ? (
            <div className="flex flex-col items-center gap-3">
              <motion.button
                onClick={triggerFileInput}
                whileTap={{ scale: 0.95 }}
                disabled={uploading}
                className="w-24 h-24 rounded-full flex items-center justify-center border-4 bg-blue-500 border-blue-300 hover:bg-blue-400 transition-all"
              >
                {uploading ? (
                  <Loader2 className="w-10 h-10 text-white animate-spin" />
                ) : (
                  <Camera className="w-10 h-10 text-white" />
                )}
              </motion.button>
              <p className="text-sm font-bold text-stone-400">
                {uploading ? "⏳ Sedang memuat naik..." : "📷 Ambil gambar tulisan kamu"}
              </p>
            </div>
          ) : analyzing ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="w-20 h-20 rounded-full flex items-center justify-center border-4 bg-purple-500 border-purple-300">
                <Sparkles className="w-8 h-8 text-white animate-pulse" />
              </div>
              <p className="text-sm font-bold text-purple-300">
                ✨ Suku sedang analisis tulisan kamu...
              </p>
              <div className="rounded-2xl overflow-hidden border-2 border-purple-500/40 max-w-xs">
                <img src={imageUrl} alt="Tulisan pelajar" className="w-full max-h-40 object-contain bg-white" />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500/40">
                <img src={imageUrl} alt="Tulisan pelajar" className="w-full max-h-64 object-contain bg-white" />
                <div className="absolute top-2 right-2 bg-emerald-500 text-white rounded-full p-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={triggerFileInput}
                  className="py-3 bg-stone-700 text-stone-200 font-bold text-sm rounded-xl border-b-4 border-stone-800 active:translate-y-1 transition-all flex items-center justify-center gap-1.5"
                >
                  <Camera className="w-4 h-4" /> Ambil Semula
                </button>
                <button
                  onClick={handleSubmit}
                  className="py-3 bg-emerald-500 text-stone-950 font-black text-sm rounded-xl border-b-4 border-emerald-700 active:translate-y-1 transition-all flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" /> Hantar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Result with AI handwriting analysis */}
      <AnimatePresence>
        {showResult && aiAnalysis && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {/* AI Analysis scores */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-stone-800/60 rounded-xl p-2.5 text-center">
                <p className="text-[10px] font-bold text-stone-500 uppercase">Pembentukan</p>
                <p className={`text-lg font-black ${(aiAnalysis.writing_accuracy || 0) >= 70 ? "text-emerald-400" : "text-amber-400"}`}>
                  {aiAnalysis.writing_accuracy || 0}%
                </p>
              </div>
              <div className="bg-stone-800/60 rounded-xl p-2.5 text-center">
                <p className="text-[10px] font-bold text-stone-500 uppercase">Ruang</p>
                <p className={`text-lg font-black ${(aiAnalysis.spacing || 0) >= 70 ? "text-emerald-400" : "text-amber-400"}`}>
                  {aiAnalysis.spacing || 0}%
                </p>
              </div>
              <div className="bg-stone-800/60 rounded-xl p-2.5 text-center">
                <p className="text-[10px] font-bold text-stone-500 uppercase">Penjajaran</p>
                <p className={`text-lg font-black ${(aiAnalysis.alignment || 0) >= 70 ? "text-emerald-400" : "text-amber-400"}`}>
                  {aiAnalysis.alignment || 0}%
                </p>
              </div>
            </div>

            {/* Feedback */}
            <div className={`p-3 rounded-2xl text-center font-black text-sm ${
              aiAnalysis.is_correct
                ? "bg-emerald-900/60 text-emerald-300 border-2 border-emerald-500/40"
                : "bg-amber-900/60 text-amber-300 border-2 border-amber-500/40"
            }`}>
              {aiAnalysis.is_correct ? `🎉 ${aiAnalysis.strength}` : `💪 ${aiAnalysis.needs_practice}`}
            </div>

            {/* Educational feedback */}
            {aiAnalysis.educational_feedback && (
              <div className="bg-purple-950/40 border border-purple-500/30 rounded-2xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <p className="text-[10px] font-black text-purple-400 uppercase tracking-wider">Maklum Balas Suku</p>
                </div>
                <p className="text-xs text-stone-300 leading-relaxed">{aiAnalysis.educational_feedback}</p>
              </div>
            )}

            <button
              onClick={handleNext}
              className="w-full h-13 py-3.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-base rounded-2xl border-b-4 border-amber-700 active:translate-y-1 transition-all"
            >
              Seterusnya →
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}