// src/components/parent/ai-insights/AttentionAreaCard.jsx
// Early warning system — educational observations only, never medical diagnoses.
import React from "react";
import { AlertTriangle } from "lucide-react";
import InsightCard from "./InsightCard";

const safeParse = (str) => {
  if (!str) return [];
  if (Array.isArray(str)) return str;
  try { return JSON.parse(str); } catch { return []; }
};

export default function AttentionAreaCard({ report }) {
  const warnings = safeParse(report.early_warnings);
  if (!warnings.length) return null;

  return (
    <InsightCard icon={AlertTriangle} title="Kawasan Perhatian" accentColor="bg-amber-100 text-amber-600">
      <div className="space-y-2">
        {warnings.map((w, i) => (
          <div key={i} className="flex items-start gap-2 bg-amber-50/60 rounded-xl p-2.5 border border-amber-100/50">
            <span className="text-xs shrink-0">⚠️</span>
            <div>
              <p className="text-[10px] font-black text-amber-700 uppercase tracking-wide">{w.type}</p>
              <p className="text-xs text-slate-600 font-medium leading-relaxed mt-0.5">{w.message}</p>
            </div>
          </div>
        ))}
        <p className="text-[9px] text-slate-400 italic mt-1">
          * Pemerhatian pendidikan sahaja, bukan diagnosis perubatan.
        </p>
      </div>
    </InsightCard>
  );
}