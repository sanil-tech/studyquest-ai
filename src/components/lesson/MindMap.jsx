import React from "react";
import { motion } from "framer-motion";

const branchColors = [
  { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700", dot: "bg-rose-400" },
  { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", dot: "bg-blue-400" },
  { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", dot: "bg-amber-400" },
  { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-400" },
];

export default function MindMap({ mindMap }) {
  if (!mindMap) return null;
  const { central_topic, branches = [] } = mindMap;

  return (
    <div className="bg-gradient-to-br from-sky-50 to-indigo-50 rounded-2xl p-5 border border-sky-100">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">🧠</span>
        <h3 className="font-heading font-bold text-indigo-800">Gambarajah Minda (Mind Map)</h3>
      </div>

      <div className="flex justify-center mb-2">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="px-6 py-3 bg-gradient-to-br from-indigo-500 to-purple-500 text-white rounded-2xl font-bold text-center shadow-lg"
        >
          {central_topic}
        </motion.div>
      </div>

      <div className="w-px h-4 bg-indigo-200 mx-auto" />

      <div className="grid grid-cols-2 gap-3 mt-2">
        {branches.map((branch, i) => {
          const color = branchColors[i % branchColors.length];
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`${color.bg} ${color.border} border rounded-xl p-3`}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <span className={`w-3 h-3 rounded-full ${color.dot} shrink-0`} />
                <p className={`font-semibold text-sm ${color.text}`}>{branch.label}</p>
              </div>
              {branch.children && branch.children.length > 0 && (
                <ul className="space-y-1">
                  {branch.children.map((child, ci) => (
                    <li key={ci} className="text-xs text-muted-foreground flex items-start gap-1">
                      <span className={color.text}>•</span>
                      <span>{child}</span>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}