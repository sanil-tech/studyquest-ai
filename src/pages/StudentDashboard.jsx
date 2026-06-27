import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { BookOpen, ArrowRight, Clock, Trophy, Sparkles, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatsBar from "@/components/student/StatsBar";
import StreakBadges from "@/components/student/StreakBadges";
import SubjectCard from "@/components/student/SubjectCard";
import LearningOverview from "@/components/student/LearningOverview";
import { motion } from "framer-motion";
import moment from "moment";

export default function StudentDashboard() {
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [progress, setProgress] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [recentSessions, setRecentSessions] = useState([]);
  const [recentAttempts, setRecentAttempts] = useState([]);
  const [allSessions, setAllSessions] = useState([]);
  const [allAttempts, setAllAttempts] = useState([]);
  const [todaySessionCount, setTodaySessionCount] = useState(0);
  const [todayStudyMinutes, setTodayStudyMinutes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let unsubscribe;
    const load = async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);

        // Subscribe to user updates for real-time name/avatar changes
        unsubscribe = base44.entities.User.subscribe(async (event) => {
          if (event.data.id === u.id) {
            const updatedUser = await base44.auth.me();
            setUser(updatedUser);
          }
        });

        const [wallets, progresses, subs, sessions, attempts] = await Promise.all([
          base44.entities.Wallet.filter({ student_id: u.id }),
          base44.entities.Progress.filter({ student_id: u.id }),
          base44.entities.Subject.list(),
          base44.entities.StudySession.filter({ student_id: u.id }, "-created_date", 50),
          base44.entities.QuizAttempt.filter({ student_id: u.id }, "-created_date", 50),
        ]);

        setWallet(wallets[0] || { balance: 0 });
        setProgress(progresses[0] || { total_xp: 0, level: 1, streak_days: 0 });
        setSubjects(subs || []);
        setRecentSessions((sessions || []).slice(0, 3));
        setRecentAttempts((attempts || []).slice(0, 3));
        setAllSessions(sessions || []);
        setAllAttempts(attempts || []);

        // Daily progress: sessions created today
        const today = new Date().toISOString().split("T")[0];
        const todays = (sessions || []).filter(s => moment(s.created_date).isSame(today, "day"));
        setTodaySessionCount(todays.length);
        setTodayStudyMinutes(todays.reduce((sum, s) => sum + (s.duration_minutes || 0), 0));
      } catch (err) {
        setError(err.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => unsubscribe && unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">{error}</p>
        <Button variant="outline" className="mt-4 rounded-xl" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  const displayName = user?.nickname || user?.full_name || "Student";
  const firstName = displayName.split(" ")[0];

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-2xl shadow-md">
            {user?.avatar_emoji || "🎓"}
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">
              Hey {firstName}! 👋
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Ready to level up today?</p>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <StatsBar wallet={wallet} progress={progress} />

      <LearningOverview
        sessions={allSessions}
        attempts={allAttempts}
        subjectsCount={subjects.length}
      />

      {/* Streak Milestones */}
      <StreakBadges streakDays={progress?.streak_days} />

      {/* XP Progress Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl p-4 border border-border/50"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">Level {progress?.level || 1}</span>
          <span className="text-xs text-muted-foreground">
            {progress?.total_xp || 0} / {(progress?.level || 1) * 200} XP
          </span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(((progress?.total_xp || 0) % ((progress?.level || 1) * 200)) / ((progress?.level || 1) * 200) * 100, 100)}%` }}
            transition={{ duration: 1, delay: 0.3 }}
            className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
          />
        </div>
      </motion.div>

      {/* Daily progress summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-2 gap-3"
      >
        <div className="bg-white rounded-2xl p-4 border border-border/50 text-center">
          <ListChecks className="w-5 h-5 text-primary mx-auto mb-1" />
          <p className="text-xl font-bold text-foreground">{todaySessionCount}</p>
          <p className="text-[10px] text-muted-foreground font-medium">Sessions Today</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-border/50 text-center">
          <Clock className="w-5 h-5 text-blue-500 mx-auto mb-1" />
          <p className="text-xl font-bold text-foreground">{todayStudyMinutes}m</p>
          <p className="text-[10px] text-muted-foreground font-medium">Study Time Today</p>
        </div>
      </motion.div>

      {/* Quick start */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Link to="/study">
          <div className="bg-gradient-to-r from-primary to-indigo-600 rounded-2xl p-5 text-white relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="font-heading font-bold text-lg">Start Studying 🚀</h3>
              <p className="text-white/80 text-sm mt-1">Pick a subject and let AI teach you</p>
              <Button variant="secondary" className="mt-3 bg-white/20 hover:bg-white/30 text-white border-0">
                Let's Go <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-6xl opacity-20">📚</div>
          </div>
        </Link>
      </motion.div>

      {/* Continue learning */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="font-heading font-semibold text-foreground mb-3">Continue Learning</h2>
        {recentSessions.length > 0 ? (
          <div className="space-y-2">
            {recentSessions.map(session => {
              const sessionAttempts = recentAttempts.filter(a => a.quiz_id && 
                moment(a.created_date).isAfter(moment(session.created_date)));
              const isComplete = sessionAttempts.length > 0;
              const bestScore = sessionAttempts.length > 0 
                ? Math.max(...sessionAttempts.map(a => a.score))
                : 0;
              
              return (
                <Link
                  key={session.id}
                  to={`/study/${session.subject_id}/${session.topic_id}`}
                  className="flex items-center gap-3 p-3 bg-white rounded-xl border border-border/50 hover:shadow-sm transition-all"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{session.topic_name}</p>
                    <p className="text-xs text-muted-foreground">{session.subject_name}</p>
                  </div>
                  {isComplete ? (
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${bestScore >= 80 ? "text-emerald-600" : bestScore >= 50 ? "text-amber-600" : "text-red-500"}`}>
                        {bestScore}%
                      </span>
                      <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                        <svg className="w-3 h-3 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded-full">In Progress</span>
                  )}
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 bg-white rounded-2xl border border-border/50">
            <Sparkles className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No study sessions yet.</p>
            <Link to="/study">
              <Button size="sm" className="mt-3 rounded-xl">
                Start your first session <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        )}
      </motion.div>

      {/* Recent quiz activity */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <h2 className="font-heading font-semibold text-foreground mb-3">Recent Quizzes</h2>
        {recentAttempts.length > 0 ? (
          <div className="space-y-2">
            {recentAttempts.map(a => (
              <div key={a.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-border/50">
                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{a.topic_name || "Quiz"}</p>
                  <p className="text-xs text-muted-foreground">{moment(a.created_date).fromNow()}</p>
                </div>
                <span className={`font-bold text-sm ${a.score >= 80 ? "text-emerald-600" : a.score >= 50 ? "text-amber-600" : "text-red-500"}`}>
                  {a.score}%
                </span>
                {a.coins_earned > 0 && (
                  <span className="text-xs text-amber-600 font-medium">+{a.coins_earned}🪙</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-white rounded-2xl border border-border/50">
            <Trophy className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No quizzes taken yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Complete a lesson to unlock quizzes!</p>
          </div>
        )}
      </motion.div>

      {/* Subjects */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="font-heading font-semibold text-foreground mb-3">Subjects</h2>
        {subjects.length > 0 ? (
          <div className="space-y-2">
            {subjects.map((s, i) => (
              <SubjectCard key={s.id} subject={s} index={i} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-white rounded-2xl border border-border/50">
            <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No subjects available yet.</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}