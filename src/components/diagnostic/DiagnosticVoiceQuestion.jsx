import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Loader2, Volume2, Square, CheckCircle2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const ACCURACY_THRESHOLD = 70;

function calculateMatchAccuracy(transcript, target) {
  if (!transcript || !target) return 0;
  const targetWords = target.toLowerCase().trim().split(/\s+/).filter((w) => w.length > 0);
  const transcriptWords = transcript.toLowerCase().trim().split(/\s+/);
  if (targetWords.length === 0) return 0;

  let matched = 0;
  for (const tw of targetWords) {
    const found = transcriptWords.some(
      (w) => w === tw || w.includes(tw) || tw.includes(w) ||
        (tw.length > 3 && (w.startsWith(tw.slice(0, 3)) || tw.startsWith(w.slice(0, 3))))
    );
    if (found) matched++;
  }
  return Math.round((matched / targetWords.length) * 100);
}

function getMatchedWords(transcript, target) {
  const targetWords = target.toLowerCase().trim().split(/\s+/).filter((w) => w.length > 0);
  const transcriptWords = transcript.toLowerCase().trim().split(/\s+/);
  let matched = 0;
  for (const tw of targetWords) {
    const found = transcriptWords.some(
      (w) => w === tw || w.includes(tw) || tw.includes(w) ||
        (tw.length > 3 && (w.startsWith(tw.slice(0, 3)) || tw.startsWith(w.slice(0, 3))))
    );
    if (found) matched++;
  }
  return { matched, total: targetWords.length };
}

export default function DiagnosticVoiceQuestion({ question, questionNumber, totalQuestions, onAnswerNext }) {
  const [loadingAudio, setLoadingAudio] = useState(true);
  const [audioUrl, setAudioUrl] = useState(null);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [accuracy, setAccuracy] = useState(0);
  const [isCorrect, setIsCorrect] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [micError, setMicError] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const targetText = question.correct || question.display || "";

  useEffect(() => {
    let cancelled = false;
    const loadAudio = async () => {
      try {
        const res = await base44.functions.invoke("getDiagnosticAudio", {
          question_id: question.id,
          target_text: targetText,
        });
        if (!cancelled && res.data?.success && res.data.audio_url) {
          setAudioUrl(res.data.audio_url);
        }
      } catch (err) {
        console.error("Audio load error:", err);
      } finally {
        if (!cancelled) setLoadingAudio(false);
      }
    };
    loadAudio();
    return () => { cancelled = true; };
  }, [question.id, targetText]);

  const playAudio = () => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play().catch((err) => console.error("Audio play error:", err));
    }
  };

  const startRecording = async () => {
    setTranscript("");
    setShowResult(false);
    setManualMode(false);
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
        await transcribeAudio(audioBlob);
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

  const transcribeAudio = async (audioBlob) => {
    try {
      const audioFile = new File([audioBlob], "recording.webm", { type: "audio/webm" });
      const { file_url } = await base44.integrations.Core.UploadFile({ file: audioFile });

      const transcribeResult = await base44.integrations.Core.TranscribeAudio({ audio_url: file_url });
      const transcriptText = (transcribeResult || "").trim();

      setTranscript(transcriptText);
      const acc = calculateMatchAccuracy(transcriptText, targetText);
      setAccuracy(acc);
      setIsCorrect(acc >= ACCURACY_THRESHOLD);
      setShowResult(true);
    } catch (err) {
      console.error("Transcription error:", err);
      setManualMode(true);
    } finally {
      setTranscribing(false);
    }
  };

  const handleNext = () => {
    onAnswerNext(isCorrect, { transcript, accuracy, target: targetText });
    setTranscript("");
    setShowResult(false);
    setManualMode(false);
  };

  const handleManualYes = () => {
    setIsCorrect(true);
    setAccuracy(100);
    setShowResult(true);
    setManualMode(false);
  };

  const handleManualNo = () => {
    setIsCorrect(false);
    setAccuracy(0);
    setShowResult(true);
    setManualMode(false);
  };

  const matchInfo = showResult && transcript ? getMatchedWords(transcript, targetText) : null;
  const statement = showResult && matchInfo
    ? accuracy === 100
      ? `🎉 Sempurna! Kamu baca semua ${matchInfo.total} perkataan dengan betul!`
      : accuracy >= ACCURACY_THRESHOLD
        ? `✅ Bagus! Kamu baca ${matchInfo.matched} daripada ${matchInfo.total} perkataan dengan betul (${accuracy}%).`
        : `💪 Cuba lagi. Kamu baca ${matchInfo.matched} daripada ${matchInfo.total} perkataan dengan betul (${accuracy}%). Latihan lagi ya!`
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

      {/* TTS Audio — play target so student can hear what to read */}
      <div className="flex items-center justify-center gap-2">
        {loadingAudio ? (
          <div className="flex items-center gap-2 text-xs font-bold text-stone-400">
            <Loader2 className="w-4 h-4 animate-spin" /> Sedang sediakan audio...
          </div>
        ) : audioUrl ? (
          <button
            onClick={playAudio}
            className="flex items-center gap-2 bg-blue-500/20 border-2 border-blue-400/40 text-blue-300 font-black px-4 py-2.5 rounded-2xl text-sm active:scale-95 transition-all"
          >
            <Volume2 className="w-4 h-4" /> Dengar Contoh Bacaan
          </button>
        ) : null}
      </div>

      {/* Recording / Transcribing / Manual mode */}
      {!showResult && !manualMode && (
        <div className="flex flex-col items-center gap-3">
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
          <p className="text-xs font-bold text-stone-400">
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
        </div>
      )}

      {/* Manual mode: teacher/parent confirms */}
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

      {/* Result with transcript and statement */}
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
              {statement}
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