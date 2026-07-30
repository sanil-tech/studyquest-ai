// src/components/parent/ai-insights/InsightCard.jsx
// Reusable card wrapper for AI insight cards.
import React from "react";
import { Card } from "@/components/ui/card";

export default function InsightCard({ icon: Icon, title, badge, accentColor = "bg-indigo-100 text-indigo-600", children }) {
  return (
    <Card className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${accentColor}`}>
            <Icon className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-black text-slate-700">{title}</h3>
        </div>
        {badge && (
          <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
            {badge}
          </span>
        )}
      </div>
      {children}
    </Card>
  );
}