import React, { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import {
  Users,
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
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);

  const { toast } = useToast();

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);

      const u = await base44.auth.me();
      if (!u) return;

      const relationships = await base44.entities.ParentChildRelationship.filter({
        parent_id: u.id,
        status: "active",
      });

      const childData = await Promise.all(
        relationships.map(async (rel) => {
          const child = await base44.entities.User.get(rel.child_id);

          const [progress, wallet] = await Promise.all([
            base44.entities.Progress
              .filter({ student_id: child.id })
              .then(r => r[0] || null),

            base44.entities.Wallet
              .filter({ student_id: child.id })
              .then(r => r[0] || null),
          ]);

          return {
            ...child,

            // ✅ EXACT SAME FORMAT AS MYCHILDRENPAGE
            display_name:
              child.full_name || child.username || "Unnamed Student",

            progress,
            wallet,
          };
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
        <h1 className="text-2xl font-bold">Parent Dashboard</h1>

        <Button onClick={loadDashboard} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* CHILD CARDS */}
      <div className="grid md:grid-cols-2 gap-6">

        <AnimatePresence>
          {children.map((child) => (
            <motion.div key={child.id} layout>
              <Card className="p-5 space-y-4">

                {/* ✅ SAME DISPLAY AS MYCHILDRENPAGE */}
                <div>
                  <h2 className="text-xl font-bold">
                    {child.display_name}
                  </h2>

                  <p className="text-sm text-muted-foreground">
                    {child.education_level}
                  </p>
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
                <div className="flex gap-2">
                  <Link to={`/parent/children/${child.id}`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      <Settings className="w-4 h-4 mr-2" />
                      Manage
                    </Button>
                  </Link>

                  <Button variant="outline">
                    <Eye className="w-4 h-4" />
                  </Button>

                  <Button variant="outline">
                    <Key className="w-4 h-4" />
                  </Button>
                </div>

              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

      </div>
    </div>
  );
}