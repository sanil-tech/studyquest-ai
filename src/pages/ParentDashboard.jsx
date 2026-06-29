import React from "react";
import { Trash2, Clock, Coins, BookOpen, Calendar, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function ChildCard({ child }) {
  // Mock data falling back to your provided state values
  const name = child?.name || "MORRY";
  const level = child?.level || 1;
  const xp = child?.xp || 150;
  const nextLevelXp = (level || 1) * 200;
  const xpPercentage = Math.min((xp / nextLevelXp) * 100, 100);
  const weeklyStudy = child?.weekly_study || "1 min";
  const walletCoins = child?.coins || 100;
  const recentLesson = child?.recent_lesson || "Suku Kata & Bacaan";
  const recentLessonTime = child?.recent_lesson_time || "9 hours ago";
  const avatarEmoji = child?.avatar_emoji || "👦🏽"; // Or an <img> tag if you use illustration URLs

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-xl bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"
    >
      {/* Top Banner & Header Section */}
      <div className="bg-gradient-to-b from-slate-50 to-white px-6 pt-6 pb-4 relative flex flex-col items-center">
        {/* Delete Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-xl w-9 h-9"
          onClick={() => { /* Handle delete functionality */ }}
        >
          <Trash2 className="w-4 h-4" />
        </Button>

        {/* Profile Avatar Frame */}
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-sky-400 to-emerald-500 p-[3px] shadow-sm flex items-center justify-center text-4xl mb-3">
          <div className="w-full h-full bg-white rounded-full flex items-center justify-center overflow-hidden">
            {avatarEmoji}
          </div>
        </div>

        {/* Child Name */}
        <h2 className="text-xl font-bold tracking-wide text-slate-800 uppercase font-heading">
          {name}
        </h2>
      </div>

      {/* Progress & Stats Section */}
      <div className="px-6 pb-6 space-y-4">
        {/* XP Level Text Header */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5 font-medium text-slate-700">
            <span>Level {level}</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 font-normal">XP {xp}</span>
          </div>
          <div className="flex items-center gap-1 text-amber-600 font-medium text-xs bg-amber-50 px-2 py-0.5 rounded-full">
            <Award className="w-3.5 h-3.5" />
            <span>Excellent!</span>
          </div>
        </div>

        {/* Animated Custom Progress Bar */}
        <div>
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${xpPercentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-emerald-600 rounded-full"
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5 font-medium">
            Progress to Level {level + 1}: {Math.round(xpPercentage)}%
          </p>
        </div>

        {/* Quick Insights Grid */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="flex items-center gap-2.5 p-3 bg-sky-50/60 rounded-xl border border-sky-100/40">
            <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center shadow-xs">
              <Clock className="w-4 h-4 text-sky-600" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-sky-500">Weekly Study</p>
              <p className="text-sm font-semibold text-slate-700">{weeklyStudy}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 bg-amber-50/60 rounded-xl border border-amber-100/40">
            <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center shadow-xs">
              <Coins className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-amber-500">Wallet Balance</p>
              <p className="text-sm font-semibold text-slate-700">{walletCoins} coins</p>
            </div>
          </div>
        </div>

        {/* Recent Lesson Panel */}
        <div className="p-3.5 bg-amber-50/30 border border-amber-100/30 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100/50 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-amber-700" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 tracking-wide uppercase">Recent Lessons</p>
              <p className="text-sm font-semibold text-slate-700 mt-0.5">{recentLesson}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{recentLessonTime}</p>
            </div>
          </div>
          <Calendar className="w-4 h-4 text-amber-700/40 mr-1" />
        </div>
      </div>
    </motion.div>
  );
}