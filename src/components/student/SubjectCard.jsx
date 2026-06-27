import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

export default function SubjectCard({ subject, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link
        to={`/study/${subject.id}`}
        className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-border/50 hover:shadow-md hover:border-primary/20 transition-all group"
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0"
          style={{ backgroundColor: (subject.color || "#6366F1") + "15" }}
        >
          {subject.icon || "📚"}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-heading font-semibold text-foreground">{subject.name}</h3>
          <p className="text-xs text-muted-foreground">Tap to explore topics</p>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
      </Link>
    </motion.div>
  );
}