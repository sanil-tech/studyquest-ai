import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Loader2, Volume2 } from "lucide-react";

export default function DiagnosticVoiceQuestion({ question, questionNumber, totalQuestions, onAnswerNext }) {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [unsupported, setUnsupported] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setUnsupported(true);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "ms-MY";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const result = event.results[0][0].transcript.toLowerCase().trim();
      setTranscript(result);
      const target = (question.correct || "").toLowerCase().trim();
      const matched = target.split(/\s+/).some((word) => result.includes(word)) || result.includes(target);
      setIsCorrect(matched);
      setShowResult(true);
      setRecording(false);
    };

    recognition.onerror = () => {
      setRecording(false);
      setManualMode(true);
    };

    recognition.onend = () => {
      setRecording(false);
    };

    recognitionRef.current = recognition;
    return () => {
      try { recognition.stop(); } catch (e) {}
    };
  }, [question.id]);

  const startRecording = () => {
    if (unsupported || !recognitionRef.current) {
      setManualMode(true);
      return;
    }
    setTranscript("");
    setShowResult(false);
    setRecording(true);
    try {
      recognitionRef.current.start();
    } catch (e) {
      setRecording(false);
      setManualMode(true);
    }
  };

  const handleNext = () => {
    onAnswerNext(isCorrect);
    setTranscript("");
    setShowResult(false);
    setManualMode(false);
  };

  const handleManualYes = () => {
    setIsCorrect(true);
    setShowResult(true);
    setManualMode(false);
  };

  const handleManualNo = () => {
    setIsCorrect(false);
    setShowResult(true);
    setManualMode(false);
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
        Soalan {questionNumber} / {totalQuestions} · 🎤 Bacaan Suara
      </p>

      {/* Question + display */}
      <div className="text-center space-y-3 py-2">
        <p className="text-sm font-bold text-stone-300">{question.question}</p>
        {question.display && (
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="text-4xl sm:text-5xl font-black text-amber-300 py-6 min-h-[80px] flex items-center justify-center"
          >
            {question.display}
          </motion.div>
        )}
      </div>

      {/* Mic button */}
      {!showResult && !manualMode && (
        <div className="flex flex-col items-center gap-3">
          <motion.button
            onClick={startRecording}
            whileTap={{ scale: 0.95 }}
            disabled={recording}
            className={`w-24 h-24 rounded-full flex items-center justify-center border-4 transition-all ${
              recording
                ? "bg-rose-500 border-rose-300 animate-pulse"
                : "bg-emerald-500 border-emerald-300 hover:bg-emerald-400"
            }`}
          >
            {recording ? (
              <Loader2 className="w-10 h-10 text-white animate-spin" />
            ) : (
              <Mic className="w-10 h-10 text-white" />
            )}
          </motion.button>
          <p className="text-xs font-bold text-stone-400">
            {recording ? "🎙️ Sila baca sekarang..." : "Tekan butang dan baca dengan kuat"}
          </p>
          {unsupported && (
            <p className="text-xs text-amber-400 font-bold text-center max-w-xs">
              Pelayar anda tidak menyokong rakaman suara. Gunakan butang manual di bawah.
            </p>
          )}
          {unsupported && (
            <button onClick={() => setManualMode(true)} className="text-xs font-black text-emerald-400 underline">
              Guna mod manual →
            </button>
          )}
        </div>
      )}

      {/* Manual mode: teacher/parent confirms */}
      {manualMode && !showResult && (
        <div className="space-y-4">
          <div className="bg-stone-800/60 rounded-2xl p-4 text-center">
            <p className="text-sm font-bold text-stone-300 mb-3">
              Adakah pelajar membaca dengan betul?
            </p>
            <p className="text-2xl font-black text-amber-300 mb-4">"{question.display}"</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleManualYes}
                className="py-4 bg-emerald-500 text-stone-950 font-black rounded-xl border-b-4 border-emerald-700 active:translate-y-1 transition-all"
              >
                ✅ Ya, Betul
              </button>
              <button
                onClick={handleManualNo}
                className="py-4 bg-rose-500 text-white font-black rounded-xl border-b-4 border-rose-700 active:translate-y-1 transition-all"
              >
                ❌ Belum Tepat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transcript + result */}
      <AnimatePresence>
        {showResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {transcript && (
              <div className="bg-stone-800/60 rounded-2xl p-3 text-center">
                <p className="text-[10px] font-black text-stone-500 uppercase tracking-wider mb-1">Kamu sebut:</p>
                <p className="text-sm font-bold text-stone-300">"{transcript}"</p>
              </div>
            )}
            <div className={`p-3 rounded-2xl text-center font-black text-sm ${
              isCorrect
                ? "bg-emerald-900/60 text-emerald-300 border-2 border-emerald-500/40"
                : "bg-amber-900/60 text-amber-300 border-2 border-amber-500/40"
            }`}>
              {isCorrect ? "🎉 Hebat! Bacaan yang baik!" : "💪 Cuba lagi, latihan menjadikan sempurna!"}
            </div>
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