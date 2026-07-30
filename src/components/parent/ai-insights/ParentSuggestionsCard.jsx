// src/components/parent/ai-insights/ParentSuggestionsCard.jsx
// AI-generated home activities parents can do outside StudyQuest.
import React from "react";
import { Lightbulb } from "lucide-react";
import InsightCard from "./InsightCard";

const safeParse = (str) => {
  if (!str) return [];
  if (Array.isArray(str)) return str;
  try { return JSON.parse(str); } catch { return []; }
};

export default function ParentSuggestionsCard({ report }) {
  const activities = safeParse(report.home_activities);
  if (!activities.length) return null;

  return (
    <InsightCard icon={Lightbulb} title="Aktiviti di Rumah" accentColor="bg-teal-100 text-teal-600">
      <div className="space-y-2">
        {activities.map((act, i) => (
          <div key={i} className="bg-teal-50/60 rounded-xl p-2.5 border border-teal-100/50">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-bold text-slate-700">{act.name}</p>
              {act.duration && (
                <span className="text-[9px] font-black text-teal-600 bg-teal-100 px-1.5 py-0.5 rounded-full">
                  ⏱ {act.duration}
                </span>
              )}
            </div>
            {act.purpose && (
              <p className="text-[10px] text-slate-500 font-medium">{act.purpose}</p>
            )}
          </div>
        ))}
      </div>
    </InsightCard>
  );
}