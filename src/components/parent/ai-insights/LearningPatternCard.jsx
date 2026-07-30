// src/components/parent/ai-insights/LearningPatternCard.jsx
// Shows how the child learns — visual/auditory/kinesthetic, evidence, preferred activities.
import React from "react";
import { Brain } from "lucide-react";
import InsightCard from "./InsightCard";

const safeParse = (str) => {
  if (!str) return null;
  if (typeof str === "object") return str;
  try { return JSON.parse(str); } catch { return null; }
};

export default function LearningPatternCard({ report }) {
  const pattern = safeParse(report.learning_pattern);
  if (!pattern) return null;

  return (
    <InsightCard icon={Brain} title="Corak Pembelajaran" accentColor="bg-purple-100 text-purple-600">
      <div className="space-y-2">
        {pattern.pattern_type && (
          <span className="inline-block px-2.5 py-1 bg-purple-50 rounded-full text-[10px] font-black text-purple-700 border border-purple-100">
            {pattern.pattern_type}
          </span>
        )}
        {pattern.evidence && (
          <p className="text-xs text-slate-600 font-medium leading-relaxed">{pattern.evidence}</p>
        )}
        {pattern.preferred_activities?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {pattern.preferred_activities.map((act, i) => (
              <span key={i} className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full text-slate-600 font-bold">
                ✓ {act}
              </span>
            ))}
          </div>
        )}
      </div>
    </InsightCard>
  );
}