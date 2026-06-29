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
  const [error, setError] = useState("");
  const [showAddChild, setShowAddChild] = useState(false);
  const { toast } = useToast();

  // ======================
  // UNLINK CHILD
  // ======================
  const handleUnlinkChild = async (childId, childName) => {
    if (!confirm(`Remove ${childName}?`)) return;

    try {
      const rel = await base44.entities.ParentChildRelationship.filter({
        parent_id: user.id,
        child_id: childId,
        status: "active",
      });

      if (rel[0]) {
        await base44.entities.ParentChildRelationship.update(rel[0].id, {
          status: "inactive",
        });
      }

      toast({
        title: "Child removed",
        description: `${childName} has been unlinked.`,
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

  // ======================
  // LOAD DATA
  // ======================
  const loadData = async () => {
    try {
      setError("");
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

      // ======================
      // CHILD DATA
      // ======================
      const childrenData = await Promise.all(
        studentIds.map(async (sid) => {

          const [
            progress,
            wallet,
            sessions,
            quizzes,
            transactions
          ] = await Promise.all([
            base44.entities.Progress.filter({ student_id: sid }),
            base44.entities.Wallet.filter({ student_id: sid }),
            base44.entities.StudySession.filter({ student_id: sid }, "-created_date", 10),
            base44.entities.QuizAttempt.filter({ student_id: sid }, "-created_date", 5),
            base44.entities.WalletTransaction
              ? base44.entities.WalletTransaction.filter({ student_id: sid }, "-created_date", 10)
              : Promise.resolve([])
          ]);

          const weekAgo = moment().subtract(7, "days");

          const weeklyMinutes = (sessions || [])
            .filter(s => moment(s.created_date).isAfter(weekAgo))
            .reduce((sum, s) => sum + (s.duration_minutes || 0), 0);

          return {
            id: sid,
            progress: progress?.[0] || { level: 1, total_xp: 0, streak_days: 0 },
            wallet: wallet?.[0] || { balance: 0 },
            sessions: sessions || [],
            quizzes: quizzes || [],
            transactions: transactions || [],
            recentSessions: sessions?.slice(0, 5) || [],
            recentQuizzes: quizzes || [],
            weeklyMinutes,
          };
        })
      );

      // ======================
      // NAME FIX (IMPORTANT)
      // ======================
      const enriched = await Promise.all(
        childrenData.map(async (c) => {
          try {
            const user = await base44.entities.User.get(c.id);

            const name =
              user?.nickname ||
              user?.full_name ||
              user?.username ||
              `Student ${c.id.slice(-5)}`;

            return { ...c, name };
          } catch {
            return {
              ...c,
              name: `Student ${c.id.slice(-5)}`
            };
          }
        })
      );

      // ======================
      // REWARD REQUESTS
      // ======================
      const rewardRequests = await Promise.all(
        studentIds.map(sid =>
          base44.entities.RewardRequest.filter({
            student_id: sid,
            status: "pending",
          })
        )
      );

      setChildren(enriched);
      setPendingRequests(rewardRequests.flat());
      setLoading(false);

    } catch (err) {
      setError(err.message || "Failed to load");
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ======================
  // UI
  // ======================
  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Parent Dashboard</h1>

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
      <div className="bg-white p-4 rounded-xl">
        <h2 className="font-semibold mb-2">
          Reward Requests ({pendingRequests.length})
        </h2>

        {pendingRequests.length === 0 ? (
          <p className="text-sm text-gray-500">No pending requests</p>
        ) : (
          pendingRequests.map(r => (
            <div key={r.id} className="flex justify-between p-2 border-b">
              <span>{r.reward_title}</span>
              <span>{r.coin_cost} coins</span>
            </div>
          ))
        )}
      </div>

      {/* CHILD LIST */}
      <div className="space-y-4">
        {children.map(child => (
          <div key={child.id} className="bg-white p-4 rounded-xl">

            {/* HEADER */}
            <div className="flex justify-between items-center">
              <h3 className="font-bold">{child.name}</h3>

              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleUnlinkChild(child.id, child.name)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            {/* STATS */}
            <p className="text-sm text-gray-500 mt-1">
              Level {child.progress.level} • XP {child.progress.total_xp}
            </p>

            <p className="text-sm">
              Weekly Study: {child.weeklyMinutes} min
            </p>

            <p className="text-sm">
              Wallet: {child.wallet.balance} coins
            </p>

            {/* LESSON PROGRESS */}
            <div className="mt-3">
              <p className="text-xs font-semibold">Recent Lessons</p>

              {child.recentSessions.length === 0 ? (
                <p className="text-xs text-gray-400">No lessons yet</p>
              ) : (
                child.recentSessions.map(s => (
                  <div key={s.id} className="text-xs text-gray-500">
                    {s.topic_name || "Lesson"} • {moment(s.created_date).fromNow()}
                  </div>
                ))
              )}
            </div>

            {/* QUIZZES */}
            <div className="mt-3">
              <p className="text-xs font-semibold">Recent Quizzes</p>

              {child.recentQuizzes.length === 0 ? (
                <p className="text-xs text-gray-400">No quizzes yet</p>
              ) : (
                child.recentQuizzes.map(q => (
                  <div key={q.id} className="text-xs text-gray-500">
                    {q.topic_name || "Quiz"} • {q.score}%
                  </div>
                ))
              )}
            </div>

            {/* TRANSACTIONS */}
            <div className="mt-3">
              <p className="text-xs font-semibold">Transactions</p>

              {child.transactions.length === 0 ? (
                <p className="text-xs text-gray-400">No transactions</p>
              ) : (
                child.transactions.slice(0, 3).map(t => (
                  <div key={t.id} className="text-xs text-gray-500">
                    {t.type} • {t.amount}
                  </div>
                ))
              )}
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}