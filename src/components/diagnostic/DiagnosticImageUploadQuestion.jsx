import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Upload, Loader2, ImageIcon, CheckCircle2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useDiagnosticAudio } from "@/hooks/useDiagnosticAudio";
import TTSButton from "@/components/diagnostic/TTSButton";

export default function DiagnosticImageUploadQuestion({ question, questionNumber, totalQuestions, onAnswerNext }) {
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const fileInputRef = useRef(null);

  const { audioUrl, loading: loadingAudio, playAudio } = useDiagnosticAudio(question.id, question.question);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setImageUrl(file_url);
    } catch (err) {
      console.error("Upload error:", err);
      alert("Gagal memuat naik gambar. Cuba lagi.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = () => {
    setShowResult(true);
  };

  const handleNext = () => {
    onAnswerNext(true, { imageUrl, target: question.correct, question: question.display });
    setImageUrl(null);
    setShowResult(false);
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
        <p className="text-sm font-bold text-stone-300">{question.question}</p>
        {question.display && (
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="text-4xl sm:text-5xl font-black text-blue-300 py-6 min-h-[80px] flex items-center justify-center"
          >
            {question.display}
          </motion.div>
        )}
      </div>

      {/* TTS — dengar soalan dibaca dengan kuat */}
      <div className="flex items-center justify-center">
        <TTSButton loading={loadingAudio} audioUrl={audioUrl} onPlay={playAudio} label="Dengar Soalan" />
      </div>

      {/* Upload area */}
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
              <p className="text-xs font-bold text-stone-400">
                {uploading ? "⏳ Sedang memuat naik..." : "📷 Ambil gambar atau pilih fail"}
              </p>
              <div className="flex items-center gap-2 text-[10px] text-stone-500">
                <Upload className="w-3 h-3" />
                <span>Format: JPG, PNG</span>
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

      {/* Result */}
      <AnimatePresence>
        {showResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div className="bg-emerald-900/60 text-emerald-300 border-2 border-emerald-500/40 p-3 rounded-2xl text-center font-black text-sm">
              ✅ Gambar tulisan kamu dah dihantar! Suku akan semak selepas ini.
            </div>
            {imageUrl && (
              <div className="rounded-2xl overflow-hidden border-2 border-stone-700">
                <img src={imageUrl} alt="Tulisan pelajar" className="w-full max-h-40 object-contain bg-white" />
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