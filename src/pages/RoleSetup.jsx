import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { GraduationCap, Users, CheckCircle2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function RoleSetup() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    base44.auth.me()
      .then(u => setUser(u))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const handleConfirm = async () => {
    setError("");
    setSaving(true);
    try {
      const u = await base44.auth.me();
      await base44.entities.User.update(u.id, { role: selectedRole });

      if (selectedRole === "student") {
        const wallets = await base44.entities.Wallet.filter({ student_id: u.id });
        if (wallets.length === 0) {
          await base44.entities.Wallet.create({ student_id: u.id, balance: 0 });
        }
        const progress = await base44.entities.Progress.filter({ student_id: u.id });
        if (progress.length === 0) {
          await base44.entities.Progress.create({ student_id: u.id, total_xp: 0, level: 1, streak_days: 0, total_study_time: 0 });
        }
        window.location.href = "/dashboard";
      } else {
        await base44.entities.User.update(u.id, { linked_student_ids: [] });
        window.location.href = "/parent";
      }
    } catch (err) {
      setError(err.message || "Failed to save role");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Already has a valid role — redirect away
  if (user?.role && ["student", "parent"].includes(user.role)) {
    return <Navigate to={user.role === "parent" ? "/parent" : "/dashboard"} replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-pink-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center space-y-8">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
          )}
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Welcome to StudyQuest! 🎉</h1>
            <p className="text-muted-foreground mt-2">Choose your role to get started.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setSelectedRole("student")}
              disabled={saving}
              className={`p-6 rounded-2xl bg-white border-2 transition-all flex flex-col items-center gap-3 ${
                selectedRole === "student"
                  ? "border-primary shadow-lg"
                  : "border-border hover:border-primary/30 hover:shadow-md"
              }`}
            >
              <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center">
                <GraduationCap className="w-8 h-8 text-primary" />
              </div>
              <span className="font-heading font-semibold">I'm a Student</span>
              <span className="text-xs text-muted-foreground">Learn & earn coins</span>
              {selectedRole === "student" && <CheckCircle2 className="w-5 h-5 text-primary" />}
            </button>

            <button
              onClick={() => setSelectedRole("parent")}
              disabled={saving}
              className={`p-6 rounded-2xl bg-white border-2 transition-all flex flex-col items-center gap-3 ${
                selectedRole === "parent"
                  ? "border-primary shadow-lg"
                  : "border-border hover:border-accent/30 hover:shadow-md"
              }`}
            >
              <div className="w-16 h-16 rounded-2xl bg-pink-100 flex items-center justify-center">
                <Users className="w-8 h-8 text-accent" />
              </div>
              <span className="font-heading font-semibold">I'm a Parent</span>
              <span className="text-xs text-muted-foreground">Track & reward</span>
              {selectedRole === "parent" && <CheckCircle2 className="w-5 h-5 text-primary" />}
            </button>
          </div>

          <button
            onClick={handleConfirm}
            disabled={!selectedRole || saving}
            className="w-full h-12 rounded-xl bg-primary text-white font-semibold disabled:opacity-50 hover:bg-primary/90 transition-colors flex items-center justify-center"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Setting up...
              </>
            ) : (
              "Continue 🚀"
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}