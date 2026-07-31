import React from "react";
import { CheckCircle2, AlertCircle, FileText, Layers, HelpCircle, Gamepad2, BookOpen } from "lucide-react";

const ICONS = {
  notes: FileText,
  flashcards: Layers,
  questions: HelpCircle,
  activities: Gamepad2,
  teacher_guide: BookOpen,
};

export default function CompletenessDashboard({ completeness }) {
  if (!completeness) return null;

  const items = [
    { key: "notes", label: "Nota Pelajaran", met: completeness.checks?.notes, count: completeness.counts?.notes ? "✓" : "✗" },
    { key: "flashcards", label: "Flashcards", met: completeness.checks?.flashcards, count: `${completeness.counts?.flashcards || 0} (min 5)` },
    { key: "questions", label: "Soalan", met: completeness.checks?.questions, count: `${completeness.counts?.questions || 0} (min 10)` },
    { key: "activities", label: "Aktiviti", met: completeness.checks?.activities, count: `${completeness.counts?.activities || 0} (min 1)` },
    { key: "teacher_guide", label: "Panduan Guru", met: completeness.checks?.teacher_guide, count: completeness.counts?.teacher_guide ? "✓" : "✗" },
  ];

  const pct = completeness.completion_percentage || 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-heading font-bold">Dashboard Kesempurnaan</h3>
        <div className="flex items-center gap-2">
          <div className="text-2xl font-black text-primary">{pct}%</div>
          <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full transition-all rounded-full"
              style={{
                width: `${pct}%`,
                background: pct === 100 ? "#22c55e" : pct >= 60 ? "#eab308" : "#ef4444",
              }}
            />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((item) => {
          const Icon = ICONS[item.key];
          return (
            <div
              key={item.key}
              className={`flex items-center gap-3 p-3 rounded-lg border ${
                item.met ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"
              }`}
            >
              <div className={`p-2 rounded-lg ${item.met ? "bg-emerald-100" : "bg-amber-100"}`}>
                <Icon className={`w-4 h-4 ${item.met ? "text-emerald-600" : "text-amber-600"}`} />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold">{item.label}</div>
                <div className="text-xs text-muted-foreground">{item.count}</div>
              </div>
              {item.met ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-500" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}