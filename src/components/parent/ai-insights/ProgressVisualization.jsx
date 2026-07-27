// src/components/parent/ai-insights/ProgressVisualization.jsx
// Growth journey chart — subject scores over months using recharts.
import React from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from "recharts";

const safeParse = (str) => {
  if (!str) return [];
  if (Array.isArray(str)) return str;
  try { return JSON.parse(str); } catch { return []; }
};

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"];

export default function ProgressVisualization({ report }) {
  const growthData = safeParse(report.growth_data);
  if (!growthData.length) return null;

  const subjects = [...new Set(growthData.flatMap(m => (m.subjects || []).map(s => s.subject)))];
  const chartData = growthData.map(m => {
    const entry = { month: m.month };
    subjects.forEach(sub => {
      const subjData = (m.subjects || []).find(s => s.subject === sub);
      entry[sub] = subjData ? subjData.score : 0;
    });
    return entry;
  });

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
      <h3 className="text-xs font-black text-slate-700 mb-3 flex items-center gap-1.5">
        📈 Perjalanan Pertumbuhan
      </h3>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={chartData} barGap={2}>
          <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "11px" }}
            cursor={{ fill: "#f1f5f9" }}
          />
          {subjects.length > 1 && <Legend wrapperStyle={{ fontSize: "10px" }} />}
          {subjects.map((sub, i) => (
            <Bar key={sub} dataKey={sub} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} maxBarSize={30} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}