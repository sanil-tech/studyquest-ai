import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  Users, Coins, Trophy, Clock,
  CheckSquare, BookOpen, Plus, Trash2
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
      // FIX NAME (NO "Student afxxx")
      // =========================
      const enriched = await Promise.all(
        childrenData.map(async (c) => {
          try {
            const user = await base44.entities.User.get(c.id);
            return {
              ...c,
              name: getDisplayName(user), // nickname → full_name → fallback
            };
          } catch {
            return {
              ...c,
              name: "Student",
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

  // =========================
  // LOADING
  // =========================
  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // =========================
  // UI
  // =========================
  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">
            Hi {user?.full_name?.split(" ")[0] || "Parent"} 👋
          </h1>
          <p className="text-sm text-muted-foreground">
            Track your child learning progress
          </p>
        </div>

        <Button onClick={() => setShowAddChild(true)}>
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
      <div className="bg-white rounded-2xl p-4 border">
        <div className="flex items-center gap-2 mb-3">
          <CheckSquare className="w-5 h-5 text-amber-500" />
          <h2 className="font-semibold">
            Reward Requests ({pendingRequests.length})
          </h2>
        </div>

        {pendingRequests.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pending requests</p>
        ) : (
          pendingRequests.map(r => (
            <div key={r.id} className="flex justify-between text-sm py-2 border-b">
              <span>{r.reward_title}</span>
              <span className="text-amber-600 font-semibold">{r.coin_cost} 🪙</span>
            </div>
          ))
        )}
      </div>

      {/* CHILD CARDS */}
      <div className="grid gap-4">
        {children.map(child => (
          <motion.div
            key={child.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border bg-white overflow-hidden shadow-sm"
          >

            {/* HEADER */}
            <div className="p-5 flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold">{child.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {child.sessions.length} sessions • {child.weeklyMinutes} min/week
                </p>
              </div>

              <Button
                size="icon"
                variant="ghost"
                onClick={() => handleUnlinkChild(child.id, child.name)}
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </div>

            {/* STATS */}
            <div className="grid grid-cols-4 gap-2 px-4 pb-4">

              <Stat icon={<Trophy />} label="Level" value={child.progress.level} />
              <Stat icon={<Coins />} label="Coins" value={child.wallet.balance} />
              <Stat icon={<Clock />} label="Streak" value={child.progress.streak_days} />
              <Stat icon={<BookOpen />} label="XP" value={child.progress.total_xp} />

            </div>

            {/* LESSONS */}
            <div className="px-4 pb-3">
              <p className="text-xs font-semibold text-muted-foreground mb-2">
                Recent Lessons
              </p>

              {child.sessions.slice(0, 3).map(s => (
                <div key={s.id} className="text-xs flex justify-between text-muted-foreground">
                  <span>{s.topic_name || "Lesson"}</span>
                  <span>{moment(s.created_date).fromNow()}</span>
                </div>
              ))}
            </div>

            {/* QUIZZES */}
            <div className="px-4 pb-4">
              <p className="text-xs font-semibold text-muted-foreground mb-2">
                Recent Quizzes
              </p>

              {child.quizzes.slice(0, 3).map(q => (
                <div key={q.id} className="text-xs flex justify-between">
                  <span>{q.topic_name || "Quiz"}</span>
                  <span className="font-semibold">
                    {q.score}%
                  </span>
                </div>
              ))}
            </div>

          </motion.div>
        ))}
      </div>
    </div>
  );
}

// =========================
// SMALL UI COMPONENT
// =========================
function Stat({ icon, label, value }) {
  return (
    <div className="text-center p-3 rounded-xl bg-gray-50">
      <div className="flex justify-center text-gray-600">{icon}</div>
      <p className="font-bold text-sm">{value}</p>
      <p className="text-[10px] text-gray-500">{label}</p>
    </div>
  );
}