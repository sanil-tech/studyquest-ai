import React from "react";
import { motion } from "framer-motion";

const cardStyles = {
  remember: { bg: "bg-blue-50", border: "border-blue-200", icon: "💡", title: "Remember", titleColor: "text-blue-800" },
  example: { bg: "bg-emerald-50", border: "border-emerald-200", icon: "📖", title: "Example", titleColor: "text-emerald-800" },
  mistake: { bg: "bg-amber-50", border: "border-amber-200", icon: "⚠️", title: "Common Mistake", titleColor: "text-amber-800" },
  tip: { bg: "bg-purple-50", border: "border-purple-200", icon: "🎯", title: "Tip", titleColor: "text-purple-800" },
  fact: { bg: "bg-pink-50", border: "border-pink-200", icon: "🧠", title: "Did You Know?", titleColor: "text-pink-800" },
  story: { bg: "bg-orange-50", border: "border-orange-200", icon: "📚", title: "Real-Life Story", titleColor: "text-orange-800" },
};

export default function InfoCard({ type = "remember", title, children }) {
  const style = cardStyles[type] || cardStyles.remember;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${style.bg} ${style.border} border rounded-xl p-4 my-4`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{style.icon}</span>
        <h4 className={`font-bold ${style.titleColor}`}>{title || style.title}</h4>
      </div>
      <div className="text-sm text-muted-foreground">{children}</div>
    </motion.div>
  );
}