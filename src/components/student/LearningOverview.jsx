import React from "react";
import { BookOpen, Layers, Brain, Trophy, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function LearningOverview({ sessions, attempts, subjectsCount }) {
  const lessonsRead = sessions.length;
  const quizzesTaken = attempts.length;
  const avgScore = attempts.length > 0
    ? Math.round(attempts.reduce((sum, a) => sum + (a.score || 0), 0) / attempts.length)
    : 0;

  const cards = [
    { label: "Lessons", value: lessonsRead, icon: BookOpen, color: "text-primary", bg: "bg-primary/10" },
    { label: "Quizzes", value: quizzesTaken, icon: Trophy, color: "text-amber-500", bg: "bg-amber-50" },
    { label: "Avg Score", value: `${avgScore}%`, icon: Brain, color: "text-emerald-500", bg: "bg-emerald-50" },
    { label: "Subjects", value: subjectsCount, icon: Layers, color: "text-blue-500", bg: "bg-blue-50" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-white rounded-2xl p-4 border border-border/50"
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-heading font-semibold text-foreground">Learning Progress</h2>
        <Link to="/study" className="text-xs text-primary font-medium flex items-center gap-1">
          Study <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="text-center">
              <div className={`w-10 h-10 ${c.bg} rounded-xl flex items-center justify-center mx-auto mb-1.5`}>
                <Icon className={`w-5 h-5 ${c.color}`} />
              </div>
              <p className="text-lg font-bold text-foreground leading-none">{c.value}</p>
              <p className="text-[10px] text-muted-foreground font-medium mt-1">{c.label}</p>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}