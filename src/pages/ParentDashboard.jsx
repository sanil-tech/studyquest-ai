import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Users, Coins, Trophy, Clock } from "lucide-react";
import moment from "moment";
import { Button } from "@/components/ui/button";
import AddChildModal from "@/components/parent/AddChildModal";

export default function ParentDashboard() {
  const [user, setUser] = useState(null);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddChild, setShowAddChild] = useState(false);

  // -----------------------------
  // LOAD DASHBOARD DATA
  // -----------------------------
  const loadData = async () => {
    try {
      setLoading(true);

      // ⚠️ IMPORTANT:
      // We do NOT use auth.getUser()
      // We assume Base44 already gives session via entities or context
      const currentUser = await base44.auth.me().catch(() => null);

      if (!currentUser) {
        setUser(null);
        setChildren([]);
        return;
      }

      setUser(currentUser);

      // 1. Get parent-child relationships
      const relationships =
        await base44.entities.ParentChildRelationship.filter({
          parent_id: currentUser.id,
          status: "active",
        });

      const childIds = relationships.map((r) => r.child_id);

      if (childIds.length === 0) {
        setChildren([]);
        return;
      }

      // 2. Load child-related data (Progress, Wallet, etc.)
      const childrenData = await Promise.all(
        childIds.map(async (childId) => {
          const [progress, wallet, sessions, attempts] = await Promise.all([
            base44.entities.Progress.filter({ student_id: childId }),
            base44.entities.Wallet.filter({ student_id: childId }),
            base44.entities.StudySession.filter({ student_id: childId }),
            base44.entities.QuizAttempt.filter({ student_id: childId }),
          ]);

          return {
            id: childId,

            // fallback name (because no User entity exists)
            name: `Student ${childId.slice(-4)}`,

            progress: progress[0] || {
              total_xp: 0,
              level: 1,
              streak_days: 0,
            },

            wallet: wallet[0] || {
              balance: 0,
            },

            sessions: sessions.slice(0, 5),
            attempts: attempts.slice(0, 5),
          };
        })
      );

      setChildren(childrenData);
    } catch (err) {
      console.error("Dashboard error:", err);
      setChildren([]);
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // INIT
  // -----------------------------
  useEffect(() => {
    loadData();
  }, []);

  // -----------------------------
  // RELOAD WHEN CHILD ADDED
  // -----------------------------
  const handleChildAdded = () => {
    setShowAddChild(false);
    loadData();
  };

  // -----------------------------
  // UI STATES
  // -----------------------------
  if (loading) {
    return (
      <div className="p-10 text-center">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">
            Parent Dashboard
          </h1>
          <p className="text-gray-500">
            Track your children's progress
          </p>
        </div>

        <Button onClick={() => setShowAddChild(true)}>
          <Users className="w-4 h-4 mr-2" />
          Add Child
        </Button>
      </div>

      {/* CHILDREN EMPTY STATE */}
      {children.length === 0 && (
        <div className="p-10 text-center border rounded-xl">
          <p className="text-gray-500">
            No children linked yet
          </p>
        </div>
      )}

      {/* CHILDREN LIST */}
      <div className="grid md:grid-cols-2 gap-4">
        {children.map((child) => (
          <div
            key={child.id}
            className="p-4 border rounded-xl space-y-3"
          >
            {/* NAME */}
            <h2 className="font-semibold">
              {child.name}
            </h2>

            {/* STATS */}
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="p-2 bg-gray-50 rounded">
                <Trophy className="w-4 h-4" />
                <p>{child.progress.level} Lv</p>
              </div>

              <div className="p-2 bg-gray-50 rounded">
                <Coins className="w-4 h-4" />
                <p>{child.wallet.balance}</p>
              </div>

              <div className="p-2 bg-gray-50 rounded">
                <Clock className="w-4 h-4" />
                <p>{child.progress.streak_days} days</p>
              </div>
            </div>

            {/* RECENT ACTIVITY */}
            <div className="text-xs text-gray-500">
              Last updated: {moment().format("DD MMM YYYY")}
            </div>
          </div>
        ))}
      </div>

      {/* ADD CHILD MODAL */}
      <AddChildModal
        open={showAddChild}
        onOpenChange={setShowAddChild}
        parentId={user?.id}
        onChildAdded={handleChildAdded}
      />
    </div>
  );
}