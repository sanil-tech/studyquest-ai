import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  Coins, Trophy, Clock, BookOpen, Flame, 
  Target, Sparkles, Award, ArrowRight, Play, CheckCircle2, UserCheck, UserX, ShieldAlert
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import moment from "moment";

export default function StudentDashboard() {
  const [user, setUser] = useState(null);
  const [progress, setProgress] = useState({ level: 1, total_xp: 0, streak_days: 0 });
  const [wallet, setWallet] = useState({ balance: 0 });
  const [sessions, setSessions] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();

  // ==========================================
  // LOAD DATA & HYDRATE PARENT RELATIONSHIPS
  // ==========================================
  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // 1. Get authenticated student
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // 2. Fetch baseline blocks
      const [progressData, walletData, sessionData, quizData, pendingRels] = await Promise.all([
        base44.entities.Progress.filter({ student_id: currentUser.id }),
        base44.entities.Wallet.filter({ student_id: currentUser.id }),
        base44.entities.StudySession.filter({ student_id: currentUser.id }, "-created_date", 10),
        base44.entities.QuizAttempt.filter({ student_id: currentUser.id }, "-created_date", 10),
        base44.entities.ParentChildRelationship.filter({ child_id: currentUser.id, status: "pending" }),
      ]);

      if (progressData?.[0]) setProgress(progressData[0]);
      if (walletData?.[0]) setWallet(walletData[0]);
      if (sessionData) setSessions(sessionData);
      if (quizData) setQuizzes(quizData);

      // 3. HYDRATE PARENT USER PROFILE DATA
      if (pendingRels && pendingRels.length > 0) {
        const hydratedRequests = await Promise.all(
          pendingRels.map(async (rel) => {
            try {
              const parentUser = await base44.entities.User.get(rel.parent_id);
              return {
                id: rel.id,
                parent_name: parentUser.full_name || parentUser.nickname || parentUser.username,
                parent_email: parentUser.email || "No contact email linked",
              };
            } catch {
              return {
                id: rel.id,
                parent_name: "Unknown Parent Account",
                parent_email: "System verification required",
              };
            }
          })
        );
        setPendingRequests(hydratedRequests);
      } else {
        setPendingRequests([]);
      }

    } catch (err) {
      console.error("Error loading student dashboard:", err);
      toast({
        title: "Oops!",
        description: "Failed to load your learning data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // ==========================================
  // DIRECT MUTATION OF THE LINK STATUS
  // ==========================================
  const handleLinkAction = async (relationshipId, actionType) => {
    setActionLoading(true);
    try {
      if (actionType === "approve") {
        // Update connection status row directly via entity SDK
        await base44.entities.ParentChildRelationship.update(relationshipId, {
          status: "active",
        });
        
        toast({ 
          title: "Family Link Approved! 🎉",
          description: "Your dashboard is now successfully connected to your parent." 
        });
      } else {
        // Drop the invitation request row completely from database
        await base44.entities.ParentChildRelationship.delete(relationshipId);
        
        toast({ 
          title: "Request Declined",
          description: "Dismissed dashboard connection map successfully." 
        });
      }

      // Re-initialize local state tables
      loadDashboardData();
    } catch (err) {
      console.error(err);
      toast({ 
        title: "Action Failed", 
        description: err.message || "Network error processing link", 
        variant: "destructive" 
      });
    } finally {
      setActionLoading(false);
    }
  };

  // =========================
  // CALCULATIONS
  // =========================
  const level = progress?.level || 1;
  const xp = progress?.total_xp || 0;
  const nextLevelXp = level * 200;
  const xpPercentage = Math.min((xp / nextLevelXp) * 100, 100);

  const todayDateString = moment().format("YYYY-MM-DD");
  const todayMinutes = sessions
    .filter(s => moment(s.created_date).isSame(todayDateString, "day"))
    .reduce((sum, s) => sum + (s.duration_minutes || 0), 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-500 animate-pulse">Loading your universe...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 max-w-5xl mx-auto px-4">
      
      {/* 1. HERO PROFILE BANNER */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 rounded-3xl p-6 sm:p-8 text-white shadow-md">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute right-20 bottom-[-20px] w-32 h-32 bg-emerald-400/20 rounded-full blur-xl" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <div className="w-20 h-20 rounded-2xl bg-white shadow-md flex items-center justify-center text-4xl transform rotate-3 hover:rotate-0 transition-transform duration-300 shrink-0">
              {user?.avatar_emoji || "🚀"}
            </div>
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <span className="bg-emerald-400/30 text-emerald-100 font-bold px-2.5 py-0.5 rounded-lg text-xs uppercase tracking-wider">
                  Student Portal
                </span>
              </div>
              <h1 className="text-3xl font-black font-heading tracking-tight">
                Welcome back, {user?.nickname || user?.full_name?.split(" ")[0] || "Explorer"}!
              </h1>
              <p className="text-emerald-100/90 text-sm mt-1">
                Ready to crush your targets and earn some coins today?
              </p>
            </div>
          </div>

          <Button className="bg-white text-emerald-600 hover:bg-emerald-50 font-extrabold rounded-2xl shadow-sm px-6 py-6 border-0 text-base group">
            <Play className="w-4 h-4 mr-2 fill-emerald-600 group-hover:scale-110 transition-transform" />
            Resume Next Lesson
          </Button>
        </div>
      </div>

      {/* 🚨 RECONFIGURED: DYNAMIC PENDING RELATIONSHIPS BANNER */}
      <AnimatePresence>
        {pendingRequests.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-amber-50/70 border border-amber-200 rounded-3xl p-5 space-y-3 shadow-3xs"
          >
            <div className="flex items-center gap-2 text-amber-800 font-extrabold text-sm tracking-tight">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              Family Connection Request Pending
            </div>
            
            {pendingRequests.map(req => (
              <div key={req.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-amber-100 shadow-2xs">
                <div>
                  <p className="text-sm font-black text-slate-800 tracking-tight">
                    {req.parent_name}
                  </p>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {req.parent_email} • Wants to link to your dashboard
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    disabled={actionLoading}
                    onClick={() => handleLinkAction(req.id, "approve")}
                    className="bg-emerald-600 hover:bg-emerald-700 font-extrabold text-xs rounded-xl px-4 h-9 shadow-2xs border-0 text-white"
                  >
                    <UserCheck className="w-3.5 h-3.5 mr-1.5 stroke-[2.5]" /> Accept Link
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    disabled={actionLoading}
                    onClick={() => handleLinkAction(req.id, "reject")}
                    className="border-slate-200 text-slate-500 hover:bg-slate-50 font-extrabold text-xs rounded-xl px-4 h-9 shadow-3xs"
                  >
                    <UserX className="w-3.5 h-3.5 mr-1.5" /> Decline
                  </Button>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. STATS & MILESTONES GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500 shadow-sm shrink-0">
            <Flame className="w-6 h-6 fill-orange-500/10" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Streak</p>
            <p className="text-xl font-black text-slate-800 mt-0.5">{progress?.streak_days || 0} Days</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-500 shadow-sm shrink-0">
            <Target className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Studied Today</p>
            <p className="text-xl font-black text-slate-800 mt-0.5">{todayMinutes} min</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 shadow-sm shrink-0">
            <Coins className="w-6 h-6 fill-amber-500/10" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">My Wallet</p>
            <p className="text-xl font-black text-slate-800 mt-0.5">{wallet?.balance || 0} Coins</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 shadow-sm shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Score</p>
            <p className="text-xl font-black text-slate-800 mt-0.5">{xp} XP</p>
          </div>
        </div>
      </div>

      {/* 3. LEVEL PROGRESS TRACKER */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-xl text-sm font-black flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 fill-emerald-700" />
              Level {level}
            </div>
            <span className="text-slate-300">•</span>
            <p className="text-sm font-medium text-slate-600">
              {xp} / {nextLevelXp} XP collected
            </p>
          </div>
          <div className="text-xs font-bold text-slate-400 uppercase bg-slate-50 px-2.5 py-1 rounded-lg">
            {Math.round(nextLevelXp - xp)} XP needed for Level {level + 1}
          </div>
        </div>

        <div>
          <div className="h-4 bg-slate-100 rounded-full overflow-hidden p-1 shadow-inner">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${xpPercentage}%` }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
            />
          </div>
          <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1.5 px-1">
            <span>Level {level}</span>
            <span className="font-bold">{Math.round(xpPercentage)}% Done</span>
            <span>Level {level + 1}</span>
          </div>
        </div>
      </div>

      {/* 4. ACTIVITY SECTIONS */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              Recent Lessons
            </h2>
            <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">
              {sessions.length} Completed
            </span>
          </div>

          <div className="space-y-3 flex-1">
            {sessions.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                No study sessions logged yet. Time to hit the books!
              </div>
            ) : (
              sessions.slice(0, 4).map((s) => (
                <div key={s.id} className="flex justify-between items-center p-3 bg-slate-50/60 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors">
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-slate-700 truncate text-sm">
                      {s.topic_name || "Lesson Study Room"}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {moment(s.created_date).fromNow()}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-xl shrink-0">
                    +{s.duration_minutes || 0} min
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-500" />
              Quiz Scores
            </h2>
            <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">
              {quizzes.length} Attempted
            </span>
          </div>

          <div className="space-y-3 flex-1">
            {quizzes.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                No quiz scores recorded yet. Challenge yourself!
              </div>
            ) : (
              quizzes.slice(0, 4).map((q) => {
                const isHigh = q.score >= 80;
                const isMid = q.score >= 50;
                return (
                  <div key={q.id} className="flex justify-between items-center p-3 bg-slate-50/60 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors">
                    <div className="min-w-0 pr-2">
                      <p className="font-bold text-slate-700 truncate text-sm">
                        {q.topic_name || "Assessment Test"}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {moment(q.created_date).fromNow()}
                      </p>
                    </div>
                    <span className={`text-xs font-black px-2.5 py-1 rounded-xl shrink-0 ${
                      isHigh ? "bg-emerald-50 text-emerald-600" : isMid ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-500"
                    }`}>
                      {q.score}%
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}