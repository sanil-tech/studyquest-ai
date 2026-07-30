// src/components/parent/ai-insights/SukuAIInsights.jsx
// Main container — premium gate, report loading, refresh, renders all insight cards + chat.
import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import PremiumGate from "./PremiumGate";
import GrowthReportCard from "./GrowthReportCard";
import LearningPatternCard from "./LearningPatternCard";
import RecommendedMissionCard from "./RecommendedMissionCard";
import AttentionAreaCard from "./AttentionAreaCard";
import ParentSuggestionsCard from "./ParentSuggestionsCard";
import ProgressVisualization from "./ProgressVisualization";
import ParentAIChat from "./ParentAIChat";

export default function SukuAIInsights({ childId }) {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => setUser(u)).catch(() => {});
  }, []);

  const loadReport = useCallback(async () => {
    if (!childId) return;
    setLoading(true);
    try {
      const reports = await base44.entities.AIInsightReport.filter(
        { student_id: childId },
        "-generated_date",
        1
      );
      setReport(reports.length > 0 ? reports[0] : null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [childId]);

  useEffect(() => { loadReport(); }, [loadReport]);

  const handleRefresh = async () => {
    setGenerating(true);
    try {
      const res = await base44.functions.invoke("generateAIInsightReport", {
        student_id: childId,
        report_type: "weekly",
        force: true,
      });
      if (res.data?.success) {
        setReport(res.data.report);
        toast({ title: "Laporan AI dikemas kini! 🐢", description: "Suku AI telah menganalisis data terkini anak anda." });
      } else {
        throw new Error(res.data?.error || "Gagal menjana laporan");
      }
    } catch (err) {
      toast({ title: "Ralat", description: "Gagal menjana laporan AI. Sila cuba lagi.", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  if (!user) return null;

  const isPremium = user.app_role === "admin" ||
    (user.subscription_tier === "premium" &&
     (!user.premium_expires_at || new Date(user.premium_expires_at) > new Date()));
  if (!isPremium) return <PremiumGate />;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-2">
        <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
        <p className="text-[10px] text-slate-400 font-bold">Memuatkan insight AI...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 text-center space-y-3 border border-indigo-100">
        <div className="text-3xl">🐢✨</div>
        <p className="text-xs text-slate-600 font-medium">
          Laporan AI belum dijana untuk anak ini. Klik butang di bawah untuk memulakan analisis pembelajaran.
        </p>
        <Button onClick={handleRefresh} disabled={generating} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl h-9">
          {generating ? <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Menjana...</> : <><Sparkles className="w-3.5 h-3.5 mr-1" /> Jana Laporan AI</>}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-3 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="text-xl">🐢</div>
          <div>
            <h2 className="text-xs font-black text-white">Suku AI Learning Insights</h2>
            <p className="text-[9px] text-indigo-100 font-medium">Analisis pembelajaran diberkuasa AI</p>
          </div>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={generating}
          variant="outline"
          className="h-8 text-[10px] font-bold rounded-xl bg-white/10 border-white/20 text-white hover:bg-white/20"
        >
          {generating ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <RefreshCw className="w-3 h-3 mr-1" />}
          {generating ? "Menjana..." : "Segar"}
        </Button>
      </div>

      {/* Insight Cards */}
      <GrowthReportCard report={report} />
      <ProgressVisualization report={report} />
      <LearningPatternCard report={report} />
      <RecommendedMissionCard report={report} />
      <AttentionAreaCard report={report} />
      <ParentSuggestionsCard report={report} />

      {/* AI Chat */}
      <ParentAIChat childId={childId} report={report} />
    </div>
  );
}