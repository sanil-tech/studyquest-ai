import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { BookOpen, ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatsBar from "@/components/student/StatsBar";
import SubjectCard from "@/components/student/SubjectCard";
import { motion } from "framer-motion";

export default function StudentDashboard() {
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [progress, setProgress] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [recentSessions, setRecentSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const u = await base44.auth.me();
      setUser(u);
      const [wallets, progresses, subs] = await Promise.all([
        base44.entities.Wallet.filter({ student_id: u.id }),
        base44.entities.Progress.filter({ student_id: u.id }),
        base44.entities.Subject.list(),
      ]);
      setWallet(wallets[0] || { balance: 0 });
      setProgress(progresses[0] || { total_xp: 0, level: 1, streak_days: 0 });
      setSubjects(subs);
      const sessions = await base44.entities.StudySession.filter({ student_id: u.id }, "-created_date", 3);
      setRecentSessions(sessions);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const firstName = user?.full_name?.split(" ")[0] || "Student";

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-heading font-bold text-foreground">
          Hey {firstName}! 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Ready to level up today?</p>
      </motion.div>

      {/* Stats */}
      <StatsBar wallet={wallet} progress={progress} />

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

      {/* Recent sessions */}
      {recentSessions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="font-heading font-semibold text-foreground mb-3">Continue Learning</h2>
          <div className="space-y-2">
            {recentSessions.map(session => (
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
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {/* Subjects */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <h2 className="font-heading font-semibold text-foreground mb-3">Subjects</h2>
        <div className="space-y-2">
          {subjects.map((s, i) => (
            <SubjectCard key={s.id} subject={s} index={i} />
          ))}
        </div>
      </motion.div>
    </div>
  );
}