import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { GraduationCap, Users, BookOpen, CheckCircle2, Loader2 } from "lucide-react";
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
      await base44.auth.updateMe({ app_role: selectedRole });

      if (selectedRole === "student") {
        const wallets = await base44.entities.Wallet.filter({ student_id: u.id });
        if (wallets.length === 0) {
          await base44.entities.Wallet.create({ student_id: u.id, balance: 0 });
        }
        const progress = await base44.entities.Progress.filter({ student_id: u.id });
        if (progress.length === 0) {
          await base44.entities.Progress.create({ student_id: u.id, total_xp: 0, level: 1, streak_days: 0, total_study_time: 0 });
        }
      } else if (selectedRole === "parent") {
        await base44.auth.updateMe({ linked_student_ids: [] });
      }
      window.location.href = "/complete-profile";
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
  if (user?.app_role && ["student", "parent"].includes(user.app_role)) {
    return <Navigate to={user.app_role === "parent" ? "/parent" : "/dashboard"} replace />;
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

          <div className="space-y-4">
            <button
              onClick={() => setSelectedRole("parent")}
              disabled={saving}
              className={`w-full p-4 rounded-2xl border-2 transition-all flex items-start gap-4 text-left ${
                selectedRole === "parent"
                  ? "border-accent bg-accent/5 shadow-lg"
                  : "border-border hover:border-accent/30 hover:shadow-md"
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6 text-accent" />
              </div>
              <div className="flex-1">
                <span className="font-heading font-semibold block">I am a Parent</span>
                <span className="text-sm text-muted-foreground">Create and manage child accounts for learners under 13</span>
              </div>
              {selectedRole === "parent" && <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />}
            </button>

            <button
              onClick={() => setSelectedRole("student")}
              disabled={saving}
              className={`w-full p-4 rounded-2xl border-2 transition-all flex items-start gap-4 text-left ${
                selectedRole === "student"
                  ? "border-primary bg-primary/5 shadow-lg"
                  : "border-border hover:border-primary/30 hover:shadow-md"
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                <GraduationCap className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <span className="font-heading font-semibold block">I am a Student</span>
                <span className="text-sm text-muted-foreground">For students aged 13+ who want to manage their own learning</span>
              </div>
              {selectedRole === "student" && <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />}
            </button>

            <button
              onClick={() => setSelectedRole("teacher")}
              disabled={saving}
              className={`w-full p-4 rounded-2xl border-2 transition-all flex items-start gap-4 text-left ${
                selectedRole === "teacher"
                  ? "border-emerald-600 bg-emerald-600/5 shadow-lg"
                  : "border-border hover:border-emerald-600/30 hover:shadow-md"
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                <BookOpen className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="flex-1">
                <span className="font-heading font-semibold block">I am a Teacher</span>
                <span className="text-sm text-muted-foreground">Manage classes and monitor student progress</span>
              </div>
              {selectedRole === "teacher" && <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />}
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