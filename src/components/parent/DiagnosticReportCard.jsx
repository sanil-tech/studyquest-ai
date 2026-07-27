import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  BookOpen, PencilLine, Calculator, Sparkles, Target,
  Heart, Loader2, ChevronRight, AlertCircle
} from "lucide-react";
import { Card } from "@/components/ui/card";

const MASTERY_LABELS = {
  needs_foundation: { label: "Asas", cls: "bg-rose-50 text-rose-600 border-rose-200" },
  developing: { label: "Berkembang", cls: "bg-amber-50 text-amber-600 border-amber-200" },
  good: { label: "Baik", cls: "bg-blue-50 text-blue-600 border-blue-200" },
  strong: { label: "Cemerlang", cls: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  not_assessed: { label: "Belum Dinilai", cls: "bg-slate-50 text-slate-400 border-slate-200" },
};

const MODULE_META = [
  { key: "reading", label: "Membaca", icon: BookOpen, color: "text-blue-500", bg: "bg-blue-50" },
  { key: "writing", label: "Menulis", icon: PencilLine, color: "text-purple-500", bg: "bg-purple-50" },
  { key: "numeracy", label: "Mengira", icon: Calculator, color: "text-emerald-500", bg: "bg-emerald-50" },
];

export default function DiagnosticReportCard({ childId, childName }) {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDiagnostic = async () => {
      try {
        const sessions = await base44.entities.BasicDiagnosticSession.filter(
          { student_id: childId, status: "completed" },
          "-date",
          1
        );

        if (sessions && sessions.length > 0) {
          const latest = sessions[0];
          setSession(latest);

          if (latest.ai_analysis) {
            try {
              setAnalysis(JSON.parse(latest.ai_analysis));
            } catch (e) {
              setAnalysis(null);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load diagnostic:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDiagnostic();
  }, [childId]);

  if (loading) {
    return (
      <Card className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center justify-center min-h-[100px]">
        <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
      </Card>
    );
  }

  if (!session) {
    return (
      <Card className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-700">Belum Ada Diagnostik</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {childName || "Anak anda"} belum mengambil ujian diagnostik 3M.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const masteryKey = (mastery) => MASTERY_LABELS[mastery] || MASTERY_LABELS.not_assessed;
  const strengths = analysis?.strengths || [];
  const weaknesses = analysis?.weaknesses || [];

  return (
    <Card className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
            <Target className="w-4 h-4 text-indigo-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Laporan Diagnostik 3M</h3>
            <p className="text-[11px] text-slate-400">
              {childName || "Anak"} · Skor: {session.total_score || 0}%
            </p>
          </div>
        </div>
      </div>

      {/* Module Levels */}
      <div className="grid grid-cols-3 gap-2">
        {MODULE_META.map((mod) => {
          const levelKey = `${mod.key}_level`;
          const masteryKeyField = `${mod.key}_mastery`;
          const level = session[levelKey] || 0;
          const mastery = masteryKey(session[masteryKeyField]);
          const Icon = mod.icon;

          return (
            <div key={mod.key} className={`${mod.bg} border border-slate-100 p-3 rounded-lg text-center`}>
              <Icon className={`w-4 h-4 ${mod.color} mx-auto mb-1.5`} />
              <p className="text-[10px] font-semibold text-slate-400 uppercase">{mod.label}</p>
              <p className="text-lg font-bold text-slate-700">Tahap {level}</p>
              <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full border mt-1 ${mastery.cls}`}>
                {mastery.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* AI Analysis — Strengths */}
      {strengths.length > 0 && (
        <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <h4 className="text-xs font-bold text-emerald-700">Kekuatan</h4>
          </div>
          <div className="space-y-1.5">
            {strengths.slice(0, 3).map((s, i) => (
              <div key={i} className="text-xs text-slate-600">
                <span className="font-semibold text-slate-700">{s.skill}:</span>{" "}
                <span className="text-slate-500">{s.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Analysis — Areas to Develop */}
      {weaknesses.length > 0 && (
        <div className="bg-amber-50/50 border border-amber-100 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-1.5">
            <Target className="w-4 h-4 text-amber-500" />
            <h4 className="text-xs font-bold text-amber-700">Fokus Latihan</h4>
          </div>
          <div className="space-y-1.5">
            {weaknesses.slice(0, 3).map((w, i) => (
              <div key={i} className="text-xs text-slate-600">
                <span className="font-semibold text-slate-700">{w.skill}:</span>{" "}
                <span className="text-slate-500">{w.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Parent Insight */}
      {analysis?.parent_insight && (
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Heart className="w-4 h-4 text-purple-500" />
            <h4 className="text-xs font-bold text-purple-700">Mesej untuk Ibu Bapa</h4>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">{analysis.parent_insight}</p>
        </div>
      )}

      {/* View Full Report */}
      <button
        onClick={() => navigate(`/diagnostic/result/${session.id}`)}
        className="w-full flex items-center justify-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700 py-1.5"
      >
        Lihat Laporan Penuh <ChevronRight className="w-4 h-4" />
      </button>
    </Card>
  );
}