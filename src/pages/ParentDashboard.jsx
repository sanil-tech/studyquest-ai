import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import moment from "moment";

export default function ParentDashboard() {
  const [user, setUser] = useState(null);
  const [children, setChildren] = useState([]);
  const [rewardRequests, setRewardRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const { toast } = useToast();

  // ======================
  // SAFE NAME RESOLVER
  // ======================
  const getChildName = (student) => {
    if (!student) return "Unknown";

    return (
      student.full_name ||
      student.nickname ||
      student.username ||
      student.student_id ||
      (student.email ? student.email.split("@")[0] : null) ||
      `Student ${student.id.slice(-5)}`
    );
  };

  // ======================
  // UNLINK CHILD
  // ======================
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

  // ======================
  // LOAD DATA
  // ======================
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

      const studentIds = relationships.map(r => r.child_id);

      if (!studentIds.length) {
        setChildren([]);
        setRewardRequests([]);
        setLoading(false);
        return;
      }

      // ======================
      // CHILD DATA (SAFE)
      // ======================
      const childrenData = await Promise.all(
        studentIds.map(async (sid) => {

          const [progress, wallet, sessions, quizzes] =
            await Promise.all([
              base44.entities.Progress.filter({ student_id: sid }),
              base44.entities.Wallet.filter({ student_id: sid }),
              base44.entities.StudySession.filter({ student_id: sid }, "-created_date", 10),
              base44.entities.QuizAttempt.filter({ student_id: sid }, "-created_date", 5),
            ]);

          const weekAgo = moment().subtract(7, "days");

          const weeklyMinutes = sessions
            .filter(s => moment(s.created_date).isAfter(weekAgo))
            .reduce((a, b) => a + (b.duration_minutes || 0), 0);

          return {
            id: sid,
            progress: progress?.[0] || { level: 1, total_xp: 0, streak_days: 0 },
            wallet: wallet?.[0] || { balance: 0 },
            sessions,
            quizzes,
            weeklyMinutes,
          };
        })
      );

      // ======================
      // GET USER DATA SAFELY (NO PERMISSION ERROR)
      // ======================
      const enrichedChildren = await Promise.all(
        childrenData.map(async (c) => {
          let student = null;

          try {
            student = await base44.entities.User.get(c.id);
          } catch (e) {
            student = null;
          }

          return {
            ...c,
            name: getChildName(student),
          };
        })
      );

      // ======================
      // REWARD REQUESTS
      // ======================
      const rewardNested = await Promise.all(
        studentIds.map(sid =>
          base44.entities.RewardRequest.filter({
            student_id: sid,
            status: "pending",
          })
        )
      );

      setChildren(enrichedChildren);
      setRewardRequests(rewardNested.flat());
      setLoading(false);

    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ======================
  // LOADING
  // ======================
  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // ======================
  // UI
  // ======================
  return (
    <div className="space-y-6">

      <h1 className="text-2xl font-bold">Parent Dashboard</h1>

      {/* REWARD REQUESTS */}
      <div className="bg-white p-4 rounded-xl">
        <h2 className="font-semibold mb-2">
          Reward Requests ({rewardRequests.length})
        </h2>

        {rewardRequests.length === 0 ? (
          <p className="text-sm text-gray-500">No pending requests</p>
        ) : (
          rewardRequests.map(r => (
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

            <div className="flex justify-between">
              <h3 className="font-bold">{child.name}</h3>

              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleUnlinkChild(child.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <p className="text-sm text-gray-500">
              Level {child.progress.level} • XP {child.progress.total_xp}
            </p>

            <p className="text-sm">
              Weekly Study: {child.weeklyMinutes} min
            </p>

            {/* LESSON PROGRESS */}
            <div className="mt-2">
              <p className="text-xs font-semibold">Recent Lessons</p>

              {child.sessions.length === 0 ? (
                <p className="text-xs text-gray-400">No lessons yet</p>
              ) : (
                child.sessions.slice(0, 3).map(s => (
                  <div key={s.id} className="text-xs text-gray-500">
                    {s.topic_name || "Lesson"} - {moment(s.created_date).fromNow()}
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