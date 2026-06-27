import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { GraduationCap, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

export default function RoleSetup() {
  const [step, setStep] = useState("role");
  const [role, setRole] = useState(null);
  const [linkCode, setLinkCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSelectRole = async (selectedRole) => {
    setRole(selectedRole);
    if (selectedRole === "parent") {
      setSaving(true);
      try {
        const u = await base44.auth.me();
        await base44.entities.User.update(u.id, { role: "parent", linked_student_ids: [] });
        window.location.href = "/parent";
      } catch (err) {
        setError(err.message || "Failed to set role");
        setSaving(false);
      }
    } else {
      setStep("link");
    }
  };

  const handleFinishStudent = async () => {
    setSaving(true);
    try {
      const user = await base44.auth.me();
      await base44.entities.User.update(user.id, { role: "student" });
      // Create wallet and progress for the student
      const wallets = await base44.entities.Wallet.filter({ student_id: user.id });
      if (wallets.length === 0) {
        await base44.entities.Wallet.create({ student_id: user.id, balance: 0 });
      }
      const progress = await base44.entities.Progress.filter({ student_id: user.id });
      if (progress.length === 0) {
        await base44.entities.Progress.create({ student_id: user.id, total_xp: 0, level: 1, streak_days: 0, total_study_time: 0 });
      }
      window.location.href = "/";
    } catch (err) {
      setError(err.message || "Failed to set up account");
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-pink-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {step === "role" ? (
          <div className="text-center space-y-8">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
            )}
            <div>
              <h1 className="text-3xl font-heading font-bold text-foreground">Welcome to StudyQuest! 🎉</h1>
              <p className="text-muted-foreground mt-2">Who are you?</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleSelectRole("student")}
                className="group p-6 rounded-2xl bg-white border-2 border-border hover:border-primary hover:shadow-lg transition-all flex flex-col items-center gap-3"
              >
                <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                  <GraduationCap className="w-8 h-8 text-primary" />
                </div>
                <span className="font-heading font-semibold">I'm a Student</span>
                <span className="text-xs text-muted-foreground">Learn & earn coins</span>
              </button>

              <button
                onClick={() => handleSelectRole("parent")}
                disabled={saving}
                className="group p-6 rounded-2xl bg-white border-2 border-border hover:border-accent hover:shadow-lg transition-all flex flex-col items-center gap-3"
              >
                <div className="w-16 h-16 rounded-2xl bg-pink-100 flex items-center justify-center group-hover:bg-pink-200 transition-colors">
                  <Users className="w-8 h-8 text-accent" />
                </div>
                <span className="font-heading font-semibold">I'm a Parent</span>
                <span className="text-xs text-muted-foreground">Track & reward</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-6">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
            )}
            <div>
              <h2 className="text-2xl font-heading font-bold">Almost ready! 🎓</h2>
              <p className="text-muted-foreground mt-2">You're set up as a student.</p>
            </div>
            <Button onClick={handleFinishStudent} disabled={saving} className="w-full h-12 rounded-xl text-base font-semibold">
              {saving ? "Setting up..." : "Start Learning! 🚀"}
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}