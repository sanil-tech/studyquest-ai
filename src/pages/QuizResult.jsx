import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Coins, Zap, Trophy, ArrowLeft, Loader2, Home, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";

export default function QuizResult() {
  const { attemptId } = useParams();
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadAttempt = async () => {
      try {
        const data = await base44.entities.QuizAttempt.get(attemptId);
        setAttempt(data);
        if (data?.score >= 50) {
          confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        }
      } catch (err) {
        setError(err.message || "Gagal memuatkan keputusan kuiz.");
      } finally {
        setLoading(false);
      }
    };
    loadAttempt();
  }, [attemptId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground mt-3 font-bold">Memuatkan keputusan...</p>
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <p className="text-sm text-destructive font-bold mb-4">{error || "Keputusan tidak dijumpai."}</p>
        <Link to="/dashboard">
          <Button variant="outline" className="rounded-xl">
            <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  const score = attempt.score || 0;
  const isPass = score >= 50;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${isPass ? "bg-emerald-50" : "bg-orange-50"}`}>
          <Trophy className={`w-10 h-10 ${isPass ? "text-emerald-500" : "text-orange-500"}`} />
        </div>
        <h1 className="text-2xl font-black text-stone-800">
          {isPass ? "Tahniah! Misi Selesai! 🎉" : "Teruskan Berusaha! 💪"}
        </h1>
        <p className="text-sm text-muted-foreground font-medium mt-1">
          {attempt.topic_name} • {attempt.subject_name}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl p-6 border-2 border-stone-200 shadow-sm text-center"
      >
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Skor Akhir</p>
        <p className={`text-5xl font-black ${isPass ? "text-emerald-600" : "text-orange-500"}`}>{Math.round(score)}%</p>
        <div className="mt-3 h-2 bg-stone-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className={`h-full rounded-full ${isPass ? "bg-emerald-500" : "bg-orange-400"}`}
          />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-2 gap-3"
      >
        <div className="bg-amber-50 rounded-2xl p-4 text-center border border-amber-100">
          <Coins className="w-6 h-6 text-amber-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-amber-700">+{attempt.coins_earned || 0}</p>
          <p className="text-xs text-amber-500">Syiling Diperoleh</p>
        </div>
        <div className="bg-purple-50 rounded-2xl p-4 text-center border border-purple-100">
          <Zap className="w-6 h-6 text-purple-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-purple-700">+{attempt.xp_earned || Math.round(score / 10)}</p>
          <p className="text-xs text-purple-500">XP Diperoleh</p>
        </div>
      </motion.div>

      {attempt.feedback_text && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-indigo-50 rounded-2xl p-5 border border-indigo-100"
        >
          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-wider mb-2">💬 Maklum Balas Cikgu Otan</p>
          <p className="text-sm text-indigo-900 font-medium leading-relaxed">{attempt.feedback_text}</p>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="flex gap-3"
      >
        <Link to="/dashboard" className="flex-1">
          <Button className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl border-0">
            <Home className="w-4 h-4 mr-2" /> Dashboard
          </Button>
        </Link>
        <Link to="/study" className="flex-1">
          <Button variant="outline" className="w-full h-12 font-black rounded-xl">
            <RotateCcw className="w-4 h-4 mr-2" /> Belajar Lagi
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}