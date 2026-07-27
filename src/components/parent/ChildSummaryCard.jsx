import React from "react";
import { useNavigate } from "react-router-dom";
import { Coins, Flame, Clock, ChevronRight, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getChildDisplayName, getChildAvatar, isAvatarUrl } from "@/lib/childUtils";
import moment from "moment";

/**
 * Compact monitoring card for the Parent Dashboard.
 * Shows a quick-glance summary of ONE child — no management controls.
 * Tapping navigates to the child's full profile page.
 */
export default function ChildSummaryCard({ child, className = "" }) {
  const navigate = useNavigate();

  const displayName = getChildDisplayName(child);
  const avatar = getChildAvatar(child);
  const avatarIsUrl = isAvatarUrl(avatar);

  const currentXP = child.realProgress?.total_xp || 0;
  const currentLevel = child.realProgress?.level || 1;
  const xpForNext = currentLevel * 200;
  const xpPercentage = xpForNext > 0
    ? Math.min(Math.round((currentXP / xpForNext) * 100), 100)
    : 0;

  const streakDays = child.realProgress?.streak_days || 0;
  const coins = child.wallet?.balance || 0;

  const lastActiveTime = child.realProgress?.last_study_date
    ? moment(child.realProgress.last_study_date).format("DD/MM")
    : "—";

  return (
    <Card
      onClick={() => navigate(`/parent/child/${child.id}`)}
      className={`p-4 bg-white border border-slate-200 rounded-xl shadow-sm w-[250px] shrink-0 cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all active:scale-[0.98] ${className}`}
    >
      {/* Header: avatar + name + level */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0 overflow-hidden">
          {avatarIsUrl ? (
            <img src={avatar} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-lg select-none">{avatar}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-slate-800 truncate">{displayName}</h3>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
              Lv {currentLevel}
            </span>
            {child.education_level && (
              <span className="text-[10px] text-slate-500 font-medium truncate">
                {child.education_level}
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
      </div>

      {/* XP Progress */}
      <div className="space-y-1 mb-3">
        <div className="flex justify-between items-center text-[10px] font-semibold text-slate-400">
          <span className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-indigo-400" /> XP
          </span>
          <span>{currentXP} / {xpForNext}</span>
        </div>
        <Progress value={xpPercentage} className="h-1.5 bg-slate-100 rounded-full" />
      </div>

      {/* Mini Stats */}
      <div className="grid grid-cols-3 gap-1.5">
        <div className="bg-amber-50 border border-amber-100 rounded-lg py-1.5 text-center">
          <Coins className="w-3.5 h-3.5 text-amber-500 mx-auto mb-0.5" />
          <span className="text-xs font-bold text-slate-700">{coins}</span>
        </div>
        <div className="bg-orange-50 border border-orange-100 rounded-lg py-1.5 text-center">
          <Flame className="w-3.5 h-3.5 text-orange-500 mx-auto mb-0.5" />
          <span className="text-xs font-bold text-slate-700">{streakDays}h</span>
        </div>
        <div className="bg-slate-50 border border-slate-100 rounded-lg py-1.5 text-center">
          <Clock className="w-3.5 h-3.5 text-slate-400 mx-auto mb-0.5" />
          <span className="text-xs font-bold text-slate-700">{lastActiveTime}</span>
        </div>
      </div>
    </Card>
  );
}