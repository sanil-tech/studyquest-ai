import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { User, LogOut, BookOpen, Trophy, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import ConnectParent from "@/components/student/ConnectParent";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [progress, setProgress] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [totalQuizzes, setTotalQuizzes] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const u = await base44.auth.me();
      setUser(u);
      if (u.app_role === "student") {
        const [progs, wallets, attempts] = await Promise.all([
          base44.entities.Progress.filter({ student_id: u.id }),
          base44.entities.Wallet.filter({ student_id: u.id }),
          base44.entities.QuizAttempt.filter({ student_id: u.id }),
        ]);
        setProgress(progs[0]);
        setWallet(wallets[0]);
        setTotalQuizzes(attempts.length);
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleLogout = () => {
    base44.auth.logout("/login");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-primary to-indigo-600 rounded-3xl p-8 text-white text-center"
      >
        <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3 text-4xl">
          {user?.avatar_emoji || "🎓"}
        </div>
        <h1 className="text-xl font-heading font-bold">{user?.full_name || "User"}</h1>
        <p className="text-white/70 text-sm">{user?.email}</p>
        <span className="inline-block mt-2 px-3 py-1 rounded-full bg-white/20 text-xs font-medium capitalize">
          {user?.app_role || "student"}
        </span>
      </motion.div>

      {/* Connect parent — students only */}
      {user?.app_role === "student" && <ConnectParent user={user} />}

      {/* Stats for students */}
      {user?.app_role === "student" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-3"
        >
          <div className="bg-white rounded-2xl p-4 text-center border border-border/50">
            <BookOpen className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-lg font-bold">{totalQuizzes}</p>
            <p className="text-[10px] text-muted-foreground">Quizzes</p>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center border border-border/50">
            <Trophy className="w-5 h-5 text-amber-500 mx-auto mb-1" />
            <p className="text-lg font-bold">Lv {progress?.level || 1}</p>
            <p className="text-[10px] text-muted-foreground">Level</p>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center border border-border/50">
            <Coins className="w-5 h-5 text-amber-500 mx-auto mb-1" />
            <p className="text-lg font-bold">{wallet?.balance || 0}</p>
            <p className="text-[10px] text-muted-foreground">Coins</p>
          </div>
        </motion.div>
      )}

      {/* Logout */}
      <Button
        variant="outline"
        onClick={handleLogout}
        className="w-full rounded-xl h-12 text-red-500 border-red-200 hover:bg-red-50"
      >
        <LogOut className="w-4 h-4 mr-2" />
        Log Out
      </Button>
    </div>
  );
}