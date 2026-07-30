// src/components/parent/ai-insights/GrowthReportCard.jsx
// AI-generated learning summary with generated date.
import React from "react";
import { TrendingUp } from "lucide-react";
import InsightCard from "./InsightCard";

export default function GrowthReportCard({ report }) {
  const generatedDate = report.generated_date
    ? new Date(report.generated_date).toLocaleDateString("ms-MY", { day: "numeric", month: "short", year: "numeric" })
    : null;

  return (
    <InsightCard icon={TrendingUp} title="Laporan Pertumbuhan" badge={generatedDate} accentColor="bg-emerald-100 text-emerald-600">
      <p className="text-xs text-slate-600 leading-relaxed font-medium">
        {report.learning_summary || "Laporan sedang disediakan..."}
      </p>
    </InsightCard>
  );
}