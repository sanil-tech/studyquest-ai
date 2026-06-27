import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Users, Coins, Trophy, Clock, TrendingUp, UserPlus, CheckSquare, BookOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import moment from "moment";

export default function ParentDashboard() {
  const [user, setUser] = useState(null);
  const [children, setChildren] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [linkEmail, setLinkEmail] = useState("");
  const [linking, setLinking] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const loadData = async () => {
    try {
      setError("");
      const u = await base44.auth.me();
      setUser(u);
      const studentIds = u.linked_student_ids || [];

      if (studentIds.length > 0) {
        const [childrenData, allPendingReqs] = await Promise.all([
          Promise.all(
            studentIds.map(async (sid) => {
              const [progresses, wallets, attempts, sessions] = await Promise.all([
                base44.entities.Progress.filter({ student_id: sid }),
                base44.entities.Wallet.filter({ student_id: sid }),
                base44.entities.QuizAttempt.filter({ student_id: sid }, "-created_date", 5),
                base44.entities.StudySession.filter({ student_id: sid }, "-created_date", 50),
              ]);
              const users = await base44.entities.User.filter({ id: sid });
              // Weekly study time
              const weekAgo = moment().subtract(7, "days").toDate();
              const weeklySessions = sessions.filter(s => new Date(s.created_date) >= weekAgo);
              const weeklyMinutes = weeklySessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
              return {
                id: sid,
                name: users[0]?.full_name || "Student",
                progress: progresses[0] || { total_xp: 0, level: 1, streak_days: 0, total_study_time: 0 },
                wallet: wallets[0] || { balance: 0 },
                recentAttempts: attempts || [],
                weeklyMinutes,
                sessionCount: sessions.length,
              };
            })
          ),
          Promise.all(
            studentIds.map(sid =>
              base44.entities.RewardRequest.filter({ student_id: sid, status: "pending" }, "-created_date", 20)
            )
          ),
        ]);
        setChildren(childrenData);
        setPendingRequests(allPendingReqs.flat());
      } else {
        setChildren([]);
        setPendingRequests([]);
      }
    } catch (err) {
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const linkChild = async () => {
    setLinking(true);
    try {
      const students = await base44.entities.User.filter({ email: linkEmail });
      const student = students.find(u => u.app_role === "student");
      if (!student) {
        toast({ title: "Student not found", description: "No student with that email exists.", variant: "destructive" });
        return;
      }
      const currentIds = user.linked_student_ids || [];
      if (currentIds.includes(student.id)) {
        toast({ title: "Already linked", description: "This student is already linked.", variant: "destructive" });
        return;
      }
      await base44.auth.updateMe({ linked_student_ids: [...currentIds, student.id] });
      setDialogOpen(false);
      setLinkEmail("");
      toast({ title: "Child linked! 🎉" });
      loadData();
    } catch (err) {
      toast({ title: "Failed to link", description: err.message || "Something went wrong", variant: "destructive" });
    } finally {
      setLinking(false);
    }
  };

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Parent Dashboard 👨‍👩‍👧</h1>
          <p className="text-muted-foreground text-sm mt-1">Track your child's progress</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-xl">
              <UserPlus className="w-4 h-4 mr-1" /> Link Child
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Link a Student</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                placeholder="Student's email address"
                value={linkEmail}
                onChange={e => setLinkEmail(e.target.value)}
              />
              <Button onClick={linkChild} disabled={linking || !linkEmail} className="w-full rounded-xl">
                {linking ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Link Student
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pending reward requests — always visible */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-border/50 p-5"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-amber-500" />
            <h2 className="font-heading font-semibold">Reward Approvals</h2>
          </div>
          <span className="text-xs font-medium bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
            {pendingRequests.length} pending
          </span>
        </div>
        {pendingRequests.length > 0 ? (
          <div className="space-y-2">
            {pendingRequests.map(req => {
              const child = children.find(c => c.id === req.student_id);
              return (
                <div key={req.id} className="flex items-center gap-3 p-3 rounded-xl bg-amber-50/50 border border-amber-100">
                  <Coins className="w-5 h-5 text-amber-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{req.reward_title}</p>
                    <p className="text-xs text-muted-foreground">{child?.name || "Student"} · {moment(req.created_date).fromNow()}</p>
                  </div>
                  <span className="text-sm font-bold text-amber-600">{req.coin_cost}🪙</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6">
            <CheckSquare className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No pending reward requests.</p>
          </div>
        )}
      </motion.div>

      {/* Children overview */}
      {children.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-border/50">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No children linked yet.</p>
          <p className="text-sm text-muted-foreground mt-1">Link a student to see their progress.</p>
        </div>
      ) : (
        children.map((child, ci) => (
          <motion.div
            key={child.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: ci * 0.1 }}
            className="bg-white rounded-2xl border border-border/50 overflow-hidden"
          >
            <div className="p-5 border-b border-border/50">
              <h2 className="font-heading font-bold text-lg">{child.name}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{child.sessionCount} total sessions · {child.weeklyMinutes}m this week</p>
            </div>

            <div className="grid grid-cols-4 gap-2 p-4">
              <div className="text-center p-3 rounded-xl bg-purple-50">
                <TrendingUp className="w-5 h-5 text-purple-500 mx-auto mb-1" />
                <p className="font-bold text-sm text-purple-700">Lv {child.progress.level}</p>
                <p className="text-[10px] text-purple-500">Level</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-amber-50">
                <Coins className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                <p className="font-bold text-sm text-amber-700">{child.wallet.balance}</p>
                <p className="text-[10px] text-amber-500">Coins</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-orange-50">
                <Trophy className="w-5 h-5 text-orange-500 mx-auto mb-1" />
                <p className="font-bold text-sm text-orange-700">{child.progress.total_xp}</p>
                <p className="text-[10px] text-orange-500">XP</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-blue-50">
                <Clock className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                <p className="font-bold text-sm text-blue-700">{child.progress.streak_days}</p>
                <p className="text-[10px] text-blue-500">Streak</p>
              </div>
            </div>

            {/* Recent quizzes */}
            <div className="px-4 pb-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Recent Quizzes</h3>
              {child.recentAttempts.length > 0 ? (
                <div className="space-y-2">
                  {child.recentAttempts.map(a => (
                    <div key={a.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-sm">
                      <span className="truncate">{a.topic_name || "Quiz"}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`font-bold ${a.score >= 80 ? "text-emerald-600" : a.score >= 50 ? "text-amber-600" : "text-red-500"}`}>
                          {a.score}%
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {moment(a.created_date).fromNow()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 text-sm text-muted-foreground">
                  <BookOpen className="w-4 h-4" />
                  No quizzes taken yet
                </div>
              )}
            </div>
          </motion.div>
        ))
      )}
    </div>
  );
}