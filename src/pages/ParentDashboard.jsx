import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  Users, Coins, Trophy, Clock, CheckSquare, BookOpen, 
  Plus, Trash2, Calendar, Award, Flame, Target
} from "lucide-react";
import { getDisplayName } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import moment from "moment";
import AddChildModal from "@/components/parent/AddChildModal";

export default function ParentDashboard() {
  const [user, setUser] = useState(null);
  const [children, setChildren] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddChild, setShowAddChild] = useState(false);
  const { toast } = useToast();

  // =========================
  // UNLINK CHILD
  // =========================
  const handleUnlinkChild = async (childId, childName) => {
    if (!confirm(`Remove ${childName}?`)) return;

    try {
      const rel = await base44.entities.ParentChildRelationship.filter({
        parent_id: user.id,
        child_id: childId,
        status: "active",
      });

      if (rel?.[0]) {
        await base44.entities.ParentChildRelationship.update(rel[0].id, {
          status: "inactive",
        });
      }

      toast({
        title: "Child Removed",
        description: `${childName} unlinked successfully`,
      });

      loadData();
    } catch (err) {
      toast({
        title: "Failed",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  // =========================
  // LOAD DATA
  // =========================
  const loadData = async () => {
    try {
      setLoading(true);

      const u = await base44.auth.me();
      setUser(u);

      const relationships = await base44.entities.ParentChildRelationship.filter({
        parent_id: u.id,
        status: "active",
      });

      const studentIds = relationships.map(r => r.child_id);

      if (!studentIds.length) {
        setChildren([]);
        setPendingRequests([]);
        setLoading(false);
        return;
      }

      // =========================
      // CHILD DATA
      // =========================
      const childrenData = await Promise.all(
        studentIds.map(async (sid) => {
          const [progress, wallet, sessions, quizzes] = await Promise.all([
            base44.entities.Progress.filter({ student_id: sid }),
            base44.entities.Wallet.filter({ student_id: sid }),
            base44.entities.StudySession.filter({ student_id: sid }, "-created_date", 20),
            base44.entities.QuizAttempt.filter({ student_id: sid }, "-created_date", 10),
          ]);

          const weekAgo = moment().subtract(7, "days");

          const weeklyMinutes = (sessions || [])
            .filter(s => moment(s.created_date).isAfter(weekAgo))
            .reduce((a, b) => a + (b.duration_minutes || 0), 0);

          return {
            id: sid,
            progress: progress?.[0] || {
              level: 1,
              total_xp: 0,
              streak_days: 0,
            },
            wallet: wallet?.[0] || { balance: 0 },
            sessions: sessions || [],
            quizzes: quizzes || [],
            weeklyMinutes,
          };
        })
      );

      // =========================
      // FIX NAME & AVATAR
      // =========================
      const enriched = await Promise.all(
        childrenData.map(async (c) => {
          try {
            const user = await base44.entities.User.get(c.id);
            return {
              ...c,
              name: getDisplayName(user),
              avatar_emoji: user.avatar_emoji || "👦🏽",
            };
          } catch {
            return {
              ...c,
              name: "Student",
              avatar_emoji: "👦🏽",
            };
          }
        })
      );

      // =========================
      // REWARD REQUESTS
      // =========================
      const rewardNested = await Promise.all(
        studentIds.map(sid =>
          base44.entities.RewardRequest.filter({
            student_id: sid,
            status: "pending",
          })
        )
      );

      setChildren(enriched);
      setPendingRequests(rewardNested.flat());
      setLoading(false);

    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-800">
            Hi {user?.full_name?.split(" ")[0] || "Parent"} 👋
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track your child's learning progress
          </p>
        </div>

        <Button onClick={() => setShowAddChild(true)} className="rounded-xl">
          <Plus className="w-4 h-4 mr-2" />
          Add Child
        </Button>
      </div>

      <AddChildModal
        open={showAddChild}
        onOpenChange={setShowAddChild}
        onLinked={loadData}
      />

      {/* REWARD REQUESTS */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
            <CheckSquare className="w-4 h-4 text-amber-500" />
          </div>
          <h2 className="font-bold text-slate-800 text-lg">
            Reward Requests ({pendingRequests.length})
          </h2>
        </div>

        {pendingRequests.length === 0 ? (
          <p className="text-sm text-slate-400">No pending requests</p>
        ) : (
          <div className="space-y-3">
            {pendingRequests.map(r => (
              <div key={r.id} className="flex justify-between items-center text-sm p-3 bg-slate-50 rounded-xl">
                <span className="font-medium text-slate-700">{r.reward_title}</span>
                <span className="text-amber-600 font-bold bg-amber-100/50 px-2.5 py-1 rounded-lg">
                  {r.coin_cost} 🪙
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CHILD CARDS */}
      <div className="grid gap-6">
        {children.map(child => (
          <ChildCard 
            key={child.id} 
            child={child} 
            onUnlink={handleUnlinkChild} 
          />
        ))}
      </div>
    </div>
  );
}

// =========================
// SUPERCHARGED CHILD CARD
// =========================
function ChildCard({ child, onUnlink }) {
  // Basic Info
  const name = child?.name || "Student";
  const level = child?.progress?.level || 1;
  const xp = child?.progress?.total_xp || 0;
  const nextLevelXp = level * 200;
  const xpPercentage = Math.min((xp / nextLevelXp) * 100, 100);
  const avatarEmoji = child?.avatar_emoji || "👦🏽";
  
  // Learning Stats
  const streakDays = child?.progress?.streak_days || 0;
  const weeklyStudy = `${child?.weeklyMinutes || 0}m`;
  const walletCoins = child?.wallet?.balance || 0;

  // Daily Progress Calculation
  const todayDateString = moment().format("YYYY-MM-DD");
  const todaysSessions = (child?.sessions || []).filter(s => moment(s.created_date).isSame(todayDateString, 'day'));
  const todayMinutes = todaysSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
  const todaySessionCount = todaysSessions.length;

  // Recent Activity
  const latestSession = child?.sessions?.[0];
  const recentLesson = latestSession?.topic_name || "No recent lessons";
  const recentLessonTime = latestSession ? moment(latestSession.created_date).fromNow() : "--";

  const latestQuiz = child?.quizzes?.[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"
    >
      {/* Top Banner & Header Section */}
      <div className="bg-gradient-to-b from-slate-50 to-white px-6 pt-6 pb-4 relative flex flex-col items-center">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-xl w-9 h-9 transition-colors"
          onClick={() => onUnlink(child.id, name)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>

        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-sky-400 to-emerald-500 p-[3px] shadow-sm flex items-center justify-center text-4xl mb-3">
          <div className="w-full h-full bg-white rounded-full flex items-center justify-center overflow-hidden">
            {avatarEmoji}
          </div>
        </div>

        <h2 className="text-xl font-bold tracking-wide text-slate-800 uppercase font-heading">
          {name}
        </h2>
      </div>

      {/* Progress & Stats Section */}
      <div className="px-6 pb-6 space-y-5">
        
        {/* XP Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <div className="flex items-center gap-1.5 font-medium text-slate-700">
              <span>Level {level}</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 font-normal">XP {xp}</span>
            </div>
            {xpPercentage >= 75 && (
              <div className="flex items-center gap-1 text-amber-600 font-medium text-xs bg-amber-50 px-2 py-0.5 rounded-full">
                <Award className="w-3.5 h-3.5" />
                <span>Excellent!</span>
              </div>
            )}
          </div>
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${xpPercentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-emerald-600 rounded-full"
            />
          </div>
        </div>

        {/* Learning Data Grid (2x2) */}
        <div className="grid grid-cols-2 gap-3">
          {/* Today's Study */}
          <div className="flex items-center gap-3 p-3 bg-sky-50/60 rounded-2xl border border-sky-100/50">
            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm">
              <Target className="w-4 h-4 text-sky-600" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-sky-500">Today</p>
              <p className="text-sm font-semibold text-slate-700">
                {todayMinutes}m <span className="text-xs font-normal text-slate-400">({todaySessionCount} sess)</span>
              </p>
            </div>
          </div>

          {/* Streak */}
          <div className="flex items-center gap-3 p-3 bg-orange-50/60 rounded-2xl border border-orange-100/50">
            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm">
              <Flame className="w-4 h-4 text-orange-500" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-orange-500">Streak</p>
              <p className="text-sm font-semibold text-slate-700">{streakDays} Days</p>
            </div>
          </div>

          {/* Weekly Study */}
          <div className="flex items-center gap-3 p-3 bg-indigo-50/60 rounded-2xl border border-indigo-100/50">
            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm">
              <Clock className="w-4 h-4 text-indigo-500" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-indigo-500">This Week</p>
              <p className="text-sm font-semibold text-slate-700">{weeklyStudy}</p>
            </div>
          </div>

          {/* Wallet */}
          <div className="flex items-center gap-3 p-3 bg-amber-50/60 rounded-2xl border border-amber-100/50">
            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm">
              <Coins className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-amber-500">Wallet</p>
              <p className="text-sm font-semibold text-slate-700">{walletCoins} Coins</p>
            </div>
          </div>
        </div>

        {/* Recent Activity List */}
        <div className="space-y-2">
          {/* Latest Lesson */}
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3 truncate">
              <div className="w-8 h-8 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4 text-slate-600" />
              </div>
              <div className="truncate">
                <p className="text-[11px] font-bold text-slate-400 tracking-wide uppercase">Last Lesson</p>
                <p className="text-sm font-semibold text-slate-700 truncate">{recentLesson}</p>
              </div>
            </div>
            <span className="text-[11px] text-slate-400 shrink-0 ml-2">{recentLessonTime}</span>
          </div>

          {/* Latest Quiz */}
          {latestQuiz && (
            <div className="p-3 bg-emerald-50/50 border border-emerald-100/50 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3 truncate">
                <div className="w-8 h-8 rounded-xl bg-white shadow-sm border border-emerald-100 flex items-center justify-center shrink-0">
                  <Trophy className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="truncate">
                  <p className="text-[11px] font-bold text-emerald-600/70 tracking-wide uppercase">Latest Quiz</p>
                  <p className="text-sm font-semibold text-slate-700 truncate">{latestQuiz.topic_name || "Quiz"}</p>
                </div>
              </div>
              <div className="shrink-0 ml-2 text-right">
                <span className={`text-sm font-bold ${latestQuiz.score >= 80 ? "text-emerald-600" : latestQuiz.score >= 50 ? "text-amber-600" : "text-red-500"}`}>
                  {latestQuiz.score}%
                </span>
                <p className="text-[10px] text-slate-400">{moment(latestQuiz.created_date).fromNow(true)}</p>
              </div>
            </div>
          )}
        </div>

      </div>
    </motion.div>
  );
}