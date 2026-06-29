import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  Users,
  Coins,
  Trophy,
  Clock,
  TrendingUp,
  CheckSquare,
  BookOpen,
  Plus,
  Trash2,
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
  const handleUnlinkChild = async (childId) => {
    try {
      await base44.functions.invoke("linkParentToChild", {
        method: "unlink_child",
        child_id: childId,
      });

      toast({
        title: "Unlinked",
        description: "Child removed successfully",
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

      const relationships =
        await base44.entities.ParentChildRelationship.filter({
          parent_id: u.id,
          status: "active",
        });

      const uniqueChildIds = [
        ...new Set(relationships.map((r) => r.child_id)),
      ];

      const childrenList = [];

      for (const sid of uniqueChildIds) {
        try {
          const [progresses, wallets, attempts, sessions] =
            await Promise.all([
              base44.entities.Progress.filter({ student_id: sid }),
              base44.entities.Wallet.filter({ student_id: sid }),
              base44.entities.QuizAttempt.filter(
                { student_id: sid },
                "-created_date",
                5
              ),
              base44.entities.StudySession.filter(
                { student_id: sid },
                "-created_date",
                50
              ),
            ]);

          const student = await base44.entities.User.get(sid).catch(() => null);

          const displayName = student
            ? getDisplayName(student)
            : "Unknown Child";

          const weekAgo = moment().subtract(7, "days").toDate();

          const weeklySessions = sessions.filter(
            (s) => new Date(s.created_date) >= weekAgo
          );

          childrenList.push({
            id: sid,
            name: displayName,
            progress: progresses?.[0] || {
              total_xp: 0,
              level: 1,
              streak_days: 0,
            },
            wallet: wallets?.[0] || { balance: 0 },
            recentAttempts: attempts || [],
            recentSessions: sessions.slice(0, 5),
            weeklyMinutes: weeklySessions.reduce(
              (sum, s) => sum + (s.duration_minutes || 0),
              0
            ),
            sessionCount: sessions.length,
          });
        } catch (err) {
          console.error("Child load error:", err);
        }
      }

      setChildren(childrenList);

      // =========================
      // 🔥 RESTORED REWARD REQUESTS
      // =========================
      const rewardRequests = await Promise.all(
        uniqueChildIds.map((sid) =>
          base44.entities.RewardRequest.filter({
            student_id: sid,
            status: "pending",
          })
        )
      );

      setPendingRequests(rewardRequests.flat());
    } catch (err) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
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
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Hi {user?.full_name?.split(" ")[0] || "Parent"} 👋
          </h1>
          <p className="text-sm text-muted-foreground">
            Track your child's progress
          </p>
        </div>

        <Button onClick={() => setShowAddChild(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Child
        </Button>
      </div>

      {/* ADD CHILD MODAL */}
      <AddChildModal
        open={showAddChild}
        onOpenChange={setShowAddChild}
        onChildAdded={() => {
          setShowAddChild(false);
          loadData();
        }}
      />

      {/* =========================
          🔥 REWARD REQUEST SECTION
          ========================= */}
      <motion.div
        className="bg-white rounded-xl border p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-amber-500" />
            <h2 className="font-semibold">Reward Requests</h2>
          </div>

          <span className="text-xs bg-amber-100 px-2 py-1 rounded-full">
            {pendingRequests.length} pending
          </span>
        </div>

        {pendingRequests.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No pending requests
          </p>
        ) : (
          <div className="space-y-2">
            {pendingRequests.map((req) => {
              const child = children.find((c) => c.id === req.student_id);

              return (
                <div
                  key={req.id}
                  className="flex items-center justify-between p-2 bg-amber-50 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {req.reward_title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {child?.name || "Unknown Child"} ·{" "}
                      {moment(req.created_date).fromNow()}
                    </p>
                  </div>

                  <span className="text-sm font-bold text-amber-600">
                    {req.coin_cost}🪙
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* =========================
          CHILDREN LIST
          ========================= */}
      {children.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border">
          <Users className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
          <p>No children linked yet</p>
        </div>
      ) : (
        children.map((child) => (
          <motion.div
            key={child.id}
            className="bg-white border rounded-xl p-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >

            {/* HEADER */}
            <div className="flex justify-between items-center mb-3">
              <div>
                <h2 className="font-bold">{child.name}</h2>
                <p className="text-xs text-muted-foreground">
                  {child.sessionCount} sessions · {child.weeklyMinutes} min/week
                </p>
              </div>

              {/* UNLINK */}
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleUnlinkChild(child.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            {/* STATS */}
            <div className="grid grid-cols-4 text-center text-xs gap-2">
              <div>
                <TrendingUp className="w-4 h-4 mx-auto" />
                Lv {child.progress.level}
              </div>
              <div>
                <Coins className="w-4 h-4 mx-auto" />
                {child.wallet.balance}
              </div>
              <div>
                <Trophy className="w-4 h-4 mx-auto" />
                {child.progress.total_xp}
              </div>
              <div>
                <Clock className="w-4 h-4 mx-auto" />
                {child.progress.streak_days}
              </div>
            </div>

          </motion.div>
        ))
      )}
    </div>
  );
}