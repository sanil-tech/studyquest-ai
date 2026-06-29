import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  Users, Coins, Trophy, Clock,
  TrendingUp, CheckSquare, BookOpen, Plus, Trash2
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
        title: "Child Removed",
        description: "Successfully unlinked child",
      });

      loadData();
    } catch (err) {
      toast({
        title: "Unlink Failed",
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
      setError("");
      setLoading(true);

      const u = await base44.auth.me();
      setUser(u);

      const relationships =
        await base44.entities.ParentChildRelationship.filter({
          parent_id: u.id,
          status: "active",
        });

      const studentIds = relationships.map((r) => r.child_id);

      if (studentIds.length === 0) {
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
          const [progress, wallet, attempts, sessions] =
            await Promise.all([
              base44.entities.Progress.filter({ student_id: sid }),
              base44.entities.Wallet.filter({ student_id: sid }),
              base44.entities.QuizAttempt.filter({ student_id: sid }, "-created_date", 5),
              base44.entities.StudySession.filter({ student_id: sid }, "-created_date", 10),
            ]);

          const weekAgo = moment().subtract(7, "days");

          const weeklySessions = sessions.filter(
            (s) => moment(s.created_date).isAfter(weekAgo)
          );

          const weeklyMinutes = weeklySessions.reduce(
            (sum, s) => sum + (s.duration_minutes || 0),
            0
          );

          return {
            id: sid,
            progress: progress?.[0] || {
              total_xp: 0,
              level: 1,
              streak_days: 0,
            },
            wallet: wallet?.[0] || { balance: 0 },
            recentAttempts: attempts || [],
            recentSessions: sessions || [],
            weeklyMinutes,
          };
        })
      );

      // =========================
      // CHILD NAMES (SAFE GET)
      // =========================
      const childrenWithNames = await Promise.all(
        childrenData.map(async (child, idx) => {
          try {
            const student = await base44.entities.User.get(studentIds[idx]);
            return {
              ...child,
              name: getDisplayName(student),
            };
          } catch {
            return {
              ...child,
              name: "Unknown Student",
            };
          }
        })
      );

      // =========================
      // REWARD REQUESTS (ALL CHILDREN)
      // =========================
      const rewardRequestsNested = await Promise.all(
        studentIds.map((sid) =>
          base44.entities.RewardRequest.filter({
            student_id: sid,
            status: "pending",
          })
        )
      );

      setChildren(childrenWithNames);
      setPendingRequests(rewardRequestsNested.flat());
      setLoading(false);
    } catch (err) {
      setError(err.message || "Failed to load dashboard");
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // =========================
  // UI STATES
  // =========================
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
        <Button className="mt-4" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  // =========================
  // RENDER
  // =========================
  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div