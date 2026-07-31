import React from "react";
import { useNavigate } from "react-router-dom";
import { Star, Zap, Coins, Flame, BookOpen, Clock, TrendingUp, ArrowRight, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getChildDisplayName, getChildAvatar, isAvatarUrl } from "@/lib/childUtils";
import SukuAIInsights from "@/components/parent/ai-insights/SukuAIInsights";
import DiagnosticReportCard from "@/components/parent/DiagnosticReportCard";
import moment from "moment";

/**
 * Full detail panel shown when a child card is clicked.
 * Combines the full stats report + AI Learning Insights.
 */
export default function ChildDetailPanel({ child, onClose }) {
  const navigate = useNavigate();

  const displayName = getChildDisplayName(child);
  const avatar = getChildAvatar(child);
  const avatarIsUrl = isAvatarUrl(avatar);

  const currentXP = child.realProgress?.total_xp || 0;
  const currentLevel = child.realProgress?.level || 1;
  const xpForNext = currentLevel ? currentLevel * 200 : 200;
  const xpPercentage = Math.min(Math.round((currentXP / xpForNext) * 100), 100);

  const streakDays = child.realProgress?.streak_days || 0;
  const coins = child.wallet?.balance || 0;
  const currentTopic = child.latestSession?.topic_name || "Misi Belum Mula";
  const totalStudyMinutes = child.latestSession?.duration_minutes || 0;

  const lastActiveTime = child.realProgress?.last_study_date
    ? moment(child.realProgress.last_study_date).format("DD/MM/YYYY")
    : "Tiada rekod aktif";

  return (
    <div className="space-y-4">
      <Card className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-4 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Profile Header */}
        <div className="flex items-center gap-3 pr-8">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0 overflow-hidden">
            {avatarIsUrl ? (
              <img src={avatar} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl select-none">{avatar}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-slate-800 truncate">{displayName}</h2>
            {child.full_name && child.full_name !== displayName && (
              <p className="text-xs text-slate-400 font-medium truncate">{child.full_name}</p>
            )}
            <div className="flex items-center gap-2 mt-1">
              <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                <Clock className="w-3 h-3 text-slate-400" /> {lastActiveTime}
              </span>
              {child.education_level && (
                <span className="text-[11px] text-slate-500 font-medium bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                  {child.education_level}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-100">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-500" /> Kemajuan Tahap
            </span>
            <span>{currentXP} / {xpForNext} XP ({xpPercentage}%)</span>
          </div>
          <Progress value={xpPercentage} className="h-2 bg-slate-200 rounded-full" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-lg flex flex-col items-center justify-center text-center">
            <Star className="w-4 h-4 text-indigo-500 mb-1" />
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Tahap</span>
            <span className="text-sm font-bold text-slate-700">{currentLevel}</span>
          </div>
          <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-lg flex flex-col items-center justify-center text-center">
            <Zap className="w-4 h-4 text-purple-500 mb-1" />
            <span className="text-[10px] font-semibold text-slate-400 uppercase">XP</span>
            <span className="text-sm font-bold text-slate-700">{currentXP}</span>
          </div>
          <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-lg flex flex-col items-center justify-center text-center">
            <Coins className="w-4 h-4 text-amber-500 mb-1" />
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Syiling</span>
            <span className="text-sm font-bold text-slate-700">{coins}</span>
          </div>
          <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-lg flex flex-col items-center justify-center text-center">
            <Flame className="w-4 h-4 text-orange-500 mb-1" />
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Streak</span>
            <span className="text-sm font-bold text-slate-700">{streakDays}</span>
          </div>
        </div>

        {/* Mission Footer Info */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-indigo-50/50 border border-indigo-100 p-3 rounded-lg flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-500 shrink-0" />
            <div className="min-w-0">
              <span className="block text-[10px] font-semibold text-slate-400 uppercase">Topik Semasa</span>
              <span className="text-xs font-bold text-slate-700 truncate block">{currentTopic}</span>
            </div>
          </div>
          <div className="bg-slate-800 p-3 rounded-lg flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
            <div className="min-w-0">
              <span className="block text-[10px] font-semibold text-slate-400 uppercase">Sesi Terakhir</span>
              <span className="text-xs font-bold text-white">{totalStudyMinutes} minit</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => navigate(`/parent/child/${child.id}`)}
          className="w-full flex items-center justify-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700 py-2"
        >
          Lihat Laporan Penuh Anak <ArrowRight className="w-4 h-4" />
        </button>
      </Card>

      {/* Diagnostic Report */}
      <div>
        <h3 className="text-sm font-bold text-slate-700 mb-2">Keputusan Diagnostik</h3>
        <DiagnosticReportCard childId={child.id} childName={displayName} />
      </div>

      {/* AI Learning Insights */}
      <SukuAIInsights childId={child.id} />
    </div>
  );
}