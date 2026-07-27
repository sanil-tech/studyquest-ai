import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Loader2, Square, RotateCw, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useDiagnosticAudio } from "@/hooks/useDiagnosticAudio";

const ACCURACY_THRESHOLD = 70;

export default function DiagnosticVoiceQuestion({ question, questionNumber, totalQuestions, onAnswerNext }) {
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isCorrect, setIsCorrect] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [micError, setMicError] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioFileUrlRef = useRef(null);

  const targetText = question.correct || question.display || "";
  // Auto-play the example reading
  const { audioUrl, loading: loadingAudio, playAudio } = useDiagnosticAudio(question.id, targetText, true);

  const startRecording = async () => {
    setTranscript("");
    setShowResult(false);
    setManualMode(false);
    setAiAnalysis(null);
    setMicError(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((track) => track.stop());
        await transcribeAndAnalyze(audioBlob);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      console.error("Mic access error:", err);
      setMicError(true);
      setManualMode(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      setTranscribing(true);
    }
  };

  const transcribeAndAnalyze = async (audioBlob) => {
    try {
      // Step 1: Upload audio
      const audioFile = new File([audioBlob], "recording.webm", { type: "audio/webm" });
      const { file_url } = await base44.integrations.Core.UploadFile({ file: audioFile });
      audioFileUrlRef.current = file_url;

      // Step 2: Transcribe
      const transcribeResult = await base44.integrations.Core.TranscribeAudio({ audio_url: file_url });
      const transcriptText = (transcribeResult || "").trim();
      setTranscript(transcriptText);

      // Step 3: AI Voice Analysis (pronunciation, fluency, confidence)
      setTranscribing(false);
      setAnalyzing(true);

      const analysisRes = await base44.functions.invoke("analyzeReadingVoice", {
        audio_url: file_url,
        target_text: targetText,
        transcript: transcriptText,
        skill: question._meta?.skill,
        sub_skill: question._meta?.sub_skill,
        question_id: question.id,
      });

      const analysis = analysisRes.data;
      setAiAnalysis(analysis);
      setIsCorrect(analysis?.is_correct ?? false);
      setShowResult(true);
    } catch (err) {
      console.error("Voice analysis error:", err);
      setManualMode(true);
    } finally {
      setTranscribing(false);
      setAnalyzing(false);
    }
  };

  const handleNext = () => {
    onAnswerNext(isCorrect, {
      transcript,
      accuracy: aiAnalysis?.pronunciation_accuracy || 0,
      target: targetText,
      audio_url: audioFileUrlRef.current,
      ai_analysis: aiAnalysis,
    });
    setTranscript("");
    setShowResult(false);
    setManualMode(false);
    setAiAnalysis(null);
  };

  const handleManualYes = () => {
    setIsCorrect(true);
    setAiAnalysis({
      pronunciation_accuracy: 100,
      fluency_score: 100,
      confidence: 80,
      strength: "Pelajar membaca dengan betul!",
      needs_practice: "Teruskan latihan bacaan.",
      educational_feedback: "Bagus! Pelajar boleh membaca dengan baik.",
    });
    setShowResult(true);
    setManualMode(false);
  };

  const handleManualNo = () => {
    setIsCorrect(false);
    setAiAnalysis({
      pronunciation_accuracy: 0,
      fluency_score: 0,
      confidence: 30,
      strength: "Pelajar sedang berusaha.",
      needs_practice: "Latihan bacaan diperlukan.",
      educational_feedback: "Teruskan berlatih, kamu semakin baik!",
    });
    setShowResult(true);
    setManualMode(false);
  };

  const statement = showResult && aiAnalysis
    ? isCorrect
      ? `🎉 ${aiAnalysis.strength}`
      : `💪 ${aiAnalysis.needs_practice}`
    : "";

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
        <p className="text-lg font-black text-white">{question.question}</p>
        {question.display && (
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="text-5xl sm:text-6xl font-black text-amber-300 py-6 min-h-[80px] flex items-center justify-center"
          >
            {question.display}
          </motion.div>
        )}
      </div>

      {/* TTS — auto-plays example, replay button */}
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

      {/* Recording / Analyzing / Manual mode */}
      {!showResult && !manualMode && (
        <div className="flex flex-col items-center gap-3">
          {analyzing ? (
            <>
              <div className="w-24 h-24 rounded-full flex items-center justify-center border-4 bg-purple-500 border-purple-300">
                <Sparkles className="w-10 h-10 text-white animate-pulse" />
              </div>
              <p className="text-sm font-bold text-purple-300">
                ✨ Suku sedang analisis bacaan kamu...
              </p>
            </>
          ) : (
            <>
              <motion.button
                onClick={recording ? stopRecording : startRecording}
                whileTap={{ scale: 0.95 }}
                disabled={transcribing}
                className={`w-24 h-24 rounded-full flex items-center justify-center border-4 transition-all ${
                  recording
                    ? "bg-rose-500 border-rose-300 animate-pulse"
                    : transcribing
                      ? "bg-stone-700 border-stone-600"
                      : "bg-emerald-500 border-emerald-300 hover:bg-emerald-400"
                }`}
              >
                {transcribing ? (
                  <Loader2 className="w-10 h-10 text-white animate-spin" />
                ) : recording ? (
                  <Square className="w-8 h-8 text-white" />
                ) : (
                  <Mic className="w-10 h-10 text-white" />
                )}
              </motion.button>
              <p className="text-sm font-bold text-stone-400">
                {transcribing
                  ? "⏳ Suku sedang semak bacaan kamu..."
                  : recording
                    ? "🎙️ Sila baca sekarang... (Tekan untuk berhenti)"
                    : "Tekan butang dan baca dengan kuat"}
              </p>
              {micError && (
                <p className="text-xs text-amber-400 font-bold text-center max-w-xs">
                  Tidak dapat akses mikrofon. Gunakan mod manual di bawah.
                </p>
              )}
            </>
          )}
        </div>
      )}

      {/* Manual mode */}
      {manualMode && !showResult && (
        <div className="bg-stone-800/60 rounded-2xl p-4 text-center">
          <p className="text-sm font-bold text-stone-300 mb-3">Adakah pelajar membaca dengan betul?</p>
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
      )}

      {/* Result with AI analysis */}
      <AnimatePresence>
        {showResult && aiAnalysis && (
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

            {/* AI Analysis scores */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-stone-800/60 rounded-xl p-2.5 text-center">
                <p className="text-[10px] font-bold text-stone-500 uppercase">Sebutan</p>
                <p className={`text-lg font-black ${aiAnalysis.pronunciation_accuracy >= 70 ? "text-emerald-400" : "text-amber-400"}`}>
                  {aiAnalysis.pronunciation_accuracy || 0}%
                </p>
              </div>
              <div className="bg-stone-800/60 rounded-xl p-2.5 text-center">
                <p className="text-[10px] font-bold text-stone-500 uppercase">Kefasihan</p>
                <p className={`text-lg font-black ${aiAnalysis.fluency_score >= 70 ? "text-emerald-400" : "text-amber-400"}`}>
                  {aiAnalysis.fluency_score || 0}%
                </p>
              </div>
              <div className="bg-stone-800/60 rounded-xl p-2.5 text-center">
                <p className="text-[10px] font-bold text-stone-500 uppercase">Keyakinan</p>
                <p className={`text-lg font-black ${aiAnalysis.confidence >= 70 ? "text-emerald-400" : "text-amber-400"}`}>
                  {aiAnalysis.confidence || 0}%
                </p>
              </div>
            </div>

            {/* Feedback */}
            <div className={`p-3 rounded-2xl text-center font-black text-sm ${
              isCorrect
                ? "bg-emerald-900/60 text-emerald-300 border-2 border-emerald-500/40"
                : "bg-amber-900/60 text-amber-300 border-2 border-amber-500/40"
            }`}>
              {statement}
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