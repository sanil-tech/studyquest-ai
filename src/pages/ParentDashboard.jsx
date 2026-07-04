import React, { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import {
  Users,
  TrendingUp,
  Award,
  Flame,
  Eye,
  Settings,
  Key,
  RefreshCw
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export default function ParentDashboard() {
  const [user, setUser] = useState(null);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);

  const { toast } = useToast();

  const calculateAge = (birthDate) => {
    if (!birthDate) return "N/A";
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);

      const u = await base44.auth.me();
      if (!u) return;

      setUser(u);

      const relationships = await base44.entities.ParentChildRelationship.filter({
        parent_id: u.id,
        status: "active",
      });

      const childData = await Promise.all(
        relationships.map(async (rel) => {
          try {
            const child = await base44.entities.User.get(rel.child_id);

            const [progress, wallet] = await Promise.all([
              base44.entities.Progress.filter({ student_id: child.id }).then(r => r[0] || null),
              base44.entities.Wallet.filter({ student_id: child.id }).then(r => r[0] || null),
            ]);

            return {
              ...child,

              // ❌ ORIGINAL LOGIC (BEFORE FIX)
              display_name: child.full_name || child.username || "Unnamed Student",

              progress,
              wallet,
              relationshipId: rel.id,
            };
          } catch (err) {
            console.error("Child load error:", err);
            return null;
          }
        })
      );

      setChildren(childData.filter(Boolean));
    } catch (err) {
      toast({
        title: "Error",
        description: err.message || "Failed to load dashboard",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <RefreshCw className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Parent Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor your children’s learning progress
          </p>
        </div>

        <Button onClick={loadDashboard} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* EMPTY STATE */}
      {children.length === 0 ? (
        <Card className="p-10 text-center">
          <Users className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
          <p className="font-medium">No children linked yet</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">

          <AnimatePresence>
            {children.map((child) => {
              const xpPercent =
                child.progress?.total_xp
                  ? child.progress.total_xp % 100
                  : 0;

              return (
                <motion.div
                  key={child.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="p-5 space-y-4">

                    {/* NAME */}
                    <div>
                      <h2 className="text-xl font-bold">
                        {child.display_name}
                      </h2>

                      <p className="text-sm text-muted-foreground">
                        Age {calculateAge(child.date_of_birth)} • {child.education_level}
                      </p>
                    </div>

                    {/* XP BAR */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>Progress</span>
                        <span>Level {child.progress?.level || 1}</span>
                      </div>

                      <Progress value={xpPercent} />
                    </div>

                    {/* STATS */}
                    <div className="grid grid-cols-3 text-center text-sm">
                      <div>
                        <p className="font-bold">{child.progress?.level || 1}</p>
                        <p>Level</p>
                      </div>

                      <div>
                        <p className="font-bold">{child.wallet?.balance || 0}</p>
                        <p>Coins</p>
                      </div>

                      <div>
                        <p className="font-bold">{child.progress?.streak_days || 0}</p>
                        <p>Streak</p>
                      </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="flex gap-2 pt-2">

                      <Link to={`/parent/children/${child.id}`} className="flex-1">
                        <Button className="w-full" variant="outline">
                          <Settings className="w-4 h-4 mr-2" />
                          Manage
                        </Button>
                      </Link>

                      <Link to={`/parent/analytics/${child.id}`}>
                        <Button variant="outline">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>

                      <Button variant="outline">
                        <Key className="w-4 h-4" />
                      </Button>

                    </div>

                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>

        </div>
      )}

    </div>
  );
}