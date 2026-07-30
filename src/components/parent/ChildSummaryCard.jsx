import React from "react";
import { Coins, Flame, ChevronDown } from "lucide-react";
import { getChildDisplayName, getChildAvatar, isAvatarUrl } from "@/lib/childUtils";

/**
 * Simple, compact child card for the dashboard grid.
 * Click to expand the full detail panel below.
 */
export default function ChildSummaryCard({ child, isSelected = false, onClick }) {
  const displayName = getChildDisplayName(child);
  const avatar = getChildAvatar(child);
  const avatarIsUrl = isAvatarUrl(avatar);

  const currentLevel = child.realProgress?.level || 1;
  const streakDays = child.realProgress?.streak_days || 0;
  const coins = child.wallet?.balance || 0;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-xl border-2 transition-all active:scale-[0.98] ${
        isSelected
          ? "bg-indigo-50 border-indigo-400 shadow-sm"
          : "bg-white border-slate-200 hover:border-indigo-200 hover:shadow-sm"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0 overflow-hidden">
          {avatarIsUrl ? (
            <img src={avatar} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-lg select-none">{avatar}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-slate-800 truncate">{displayName}</h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
              Lv {currentLevel}
            </span>
            {child.education_level && (
              <span className="text-[10px] text-slate-400 font-medium truncate">
                {child.education_level}
              </span>
            )}
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isSelected ? "rotate-180" : ""}`}
        />
      </div>

      <div className="flex items-center gap-3 mt-2.5 pt-2.5 border-t border-slate-100">
        <span className="flex items-center gap-1 text-[11px] font-bold text-amber-600">
          <Coins className="w-3 h-3" /> {coins}
        </span>
        <span className="flex items-center gap-1 text-[11px] font-bold text-orange-500">
          <Flame className="w-3 h-3" /> {streakDays}h
        </span>
      </div>
    </button>
  );
}