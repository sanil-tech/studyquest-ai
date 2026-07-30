// src/components/parent/ai-insights/RecommendedMissionCard.jsx
// AI-recommended actions and missions for the child.
import React from "react";
import { Target } from "lucide-react";
import InsightCard from "./InsightCard";

const safeParse = (str) => {
  if (!str) return [];
  if (Array.isArray(str)) return str;
  try { return JSON.parse(str); } catch { return []; }
};

export default function RecommendedMissionCard({ report }) {
  const recommendations = safeParse(report.recommendations);
  if (!recommendations.length) return null;

  return (
    <InsightCard icon={Target} title="Misi Disyorkan" accentColor="bg-blue-100 text-blue-600">
      <div className="space-y-2.5">
        {recommendations.map((rec, i) => (
          <div key={i} className="bg-blue-50/60 rounded-xl p-2.5 border border-blue-100/50">
            <p className="text-xs font-bold text-slate-700 mb-0.5">{rec.action}</p>
            {rec.mission && (
              <p className="text-[10px] font-medium text-blue-600 flex items-center gap-1">
                🎯 Misi: {rec.mission}
              </p>
            )}
          </div>
        ))}
      </div>
    </InsightCard>
  );
}