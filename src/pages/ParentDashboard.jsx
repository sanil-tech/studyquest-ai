import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Users, Coins, Trophy, Clock, TrendingUp, CheckSquare, BookOpen, Plus } from "lucide-react";
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
  const [error, setError] = useState("");
  const [showAddChild, setShowAddChild] = useState(false);
  const { toast } = useToast();

  const loadData = async () => {
    try {
      setError("");
      const u = await base44.auth.me();
      setUser(u);

      const relationships = await base44.entities.ParentChildRelationship.filter({ parent_id: u.id, status: "active" });
      const studentIds = relationships.map(r => r.child_id);

      if (studentIds.length > 0) {
        const [childrenData, allPendingReqs, allStudents] = await Promise.all([
          Promise.all(
            studentIds.map(async (sid, idx) => {
              const [progresses, wallets, attempts, sessions] = await Promise.all([
                base44.entities.Progress.filter({ student_id: sid }),
                base44.entities.Wallet.filter({ student_id: sid }),
                base44.entities.QuizAttempt.filter({ student_id: sid }, "-created_date", 5),
                base44.entities.StudySession.filter({ student_id: sid }, "-created_date", 50),
              ]);
              const weekAgo = moment().subtract(7, "days").toDate();
              const weeklySessions = sessions.filter(s => new Date(s.created_date) >= weekAgo);
              const weeklyMinutes = weeklySessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
              return {
                id: sid,
                linkRequestIdx: idx,
                progress: progresses[0] || { total_xp: 0, level: 1, streak_days: 0, total_study_time: 0 },
                wallet: wallets[0] || { balance: 0 },
                recentAttempts: attempts || [],
                recentSessions: sessions.slice(0, 5),
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
          Promise.all(
            studentIds.map(sid => base44.entities.User.filter({ id: sid }))
          ),
        ]);
        
        // Merge student names from User entity with children data
        const childrenWithNames = childrenData.map((child, idx) => ({
          ...child,
          name: allStudents[idx]?.[0]?.full_name || "Student",
        }));
        
        setChildren(childrenWithNames);
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

  useEffect(() => {
    const unsubscribeRelationship = base44.entities.ParentChildRelationship.subscribe(() => {
      loadData();
    });
    const unsubscribeReward = base44.entities.RewardRequest.subscribe(() => {
      loadData();
    });
    return () => {
      unsubscribeRelationship();
      unsubscribeReward();
    };
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">
            Hi {user?.full_name?.split(" ")[0] || "Parent"}! 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Track your child's progress</p>
        </div>
        <Button onClick={() => setShowAddChild(true)} className="rounded-xl">
          <Plus className="w-4 h-4 mr-2" />
          Add Child
        </Button>
      </div>

      {/* Add Child Modal */}
      <AddChildModal 
        open={showAddChild} 
        onOpenChange={setShowAddChild}
        onChildAdded={() => {
          setShowAddChild(false);
          loadData();
        }}
      />

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

      {children.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-border/50">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No children linked yet.</p>
          <p className="text-sm text-muted-foreground mt-1">Ask your child for their Student ID or scan their QR code from the Profile page.</p>
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

            <div className="px-4 pb-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Recent Lessons</h3>
              {child.recentSessions.length > 0 ? (
                <div className="space-y-2">
                  {child.recentSessions.map(s => (
                    <div key={s.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-sm">
                      <span className="truncate">{s.topic_name || "Lesson"}</span>
                      <span className="text-xs text-muted-foreground shrink-0 ml-2">
                        {moment(s.created_date).format("DD MMM, h:mm a")}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 text-sm text-muted-foreground">
                  <BookOpen className="w-4 h-4" />
                  No lessons started yet
                </div>
              )}
            </div>

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