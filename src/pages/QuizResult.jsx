import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useParams, Link } from "react-router-dom";
import { Trophy, Coins, Zap, RotateCcw, ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";

export default function QuizResult() {
  const { attemptId } = useParams();
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.QuizAttempt.get(attemptId).then(a => {
      setAttempt(a);
      setLoading(false);
    });
  }, [attemptId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const score = attempt?.score || 0;
  const isGreat = score >= 80;
  const isPerfect = score === 100;

  return (
    <div className="space-y-6">
      {/* Score Hero */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`rounded-3xl p-8 text-center relative overflow-hidden ${
          isPerfect
            ? "bg-gradient-to-br from-amber-400 to-orange-500"
            : isGreat
              ? "bg-gradient-to-br from-emerald-400 to-teal-500"
              : "bg-gradient-to-br from-primary to-indigo-600"
        }`}
      >
        <div className="relative z-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="text-6xl mb-3"
          >
            {isPerfect ? "🏆" : isGreat ? "🌟" : "💪"}
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-white/80 text-sm font-medium mb-1"
          >
            {attempt?.topic_name}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-5xl font-heading font-bold text-white mb-2"
          >
            {score}%
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-white/90 font-medium"
          >
            {isPerfect ? "Perfect Score!" : isGreat ? "Great Job!" : "Keep Going!"}
          </motion.p>
        </div>
        <div className="absolute inset-0 opacity-10">
          {[...Array(20)].map((_, i) => (
            <Star key={i} className="absolute text-white" style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 20 + 10}px`,
              transform: `rotate(${Math.random() * 360}deg)`,
            }} />
          ))}
        </div>
      </motion.div>

      {/* Rewards earned */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-2 gap-3"
      >
        <div className="bg-amber-50 rounded-2xl p-4 text-center border border-amber-100">
          <Coins className="w-6 h-6 text-amber-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-amber-700">+{attempt?.coins_earned || 0}</p>
          <p className="text-xs text-amber-500">Coins Earned</p>
        </div>
        <div className="bg-purple-50 rounded-2xl p-4 text-center border border-purple-100">
          <Zap className="w-6 h-6 text-purple-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-purple-700">+{Math.round(score / 2)}</p>
          <p className="text-xs text-purple-500">XP Earned</p>
        </div>
      </motion.div>

      {/* AI Feedback */}
      {attempt?.feedback_text && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-2xl p-5 border border-border/50"
        >
          <h3 className="font-heading font-semibold mb-3 flex items-center gap-2">
            <span className="text-lg">🤖</span> AI Feedback
          </h3>
          <div className="prose prose-sm max-w-none text-muted-foreground">
            <ReactMarkdown>{attempt.feedback_text}</ReactMarkdown>
          </div>
        </motion.div>
      )}

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="space-y-3"
      >
        <Link to="/study" className="block">
          <Button className="w-full h-12 rounded-xl text-base">
            Study Next Topic <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
        <Link to="/dashboard" className="block">
          <Button variant="outline" className="w-full h-12 rounded-xl">
            Back to Dashboard
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}