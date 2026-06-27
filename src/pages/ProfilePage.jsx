import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { User, LogOut, BookOpen, Trophy, Coins, BookMarked, ChevronRight, Pen } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import ConnectParent from "@/components/student/ConnectParent";
import AvatarSelector from "@/components/student/AvatarSelector";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [progress, setProgress] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [totalQuizzes, setTotalQuizzes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAvatar, setShowAvatar] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ full_name: "", school_year: "", school_name: "", class_name: "" });

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
        setFormData({
          full_name: u.full_name || "",
          school_year: u.school_year || "",
          school_name: u.school_name || "",
          class_name: u.class_name || "",
        });
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleLogout = () => {
    base44.auth.logout("/login");
  };

  const handleSaveAvatar = async (emoji) => {
    await base44.auth.updateMe({ avatar_emoji: emoji });
    setUser((prev) => ({ ...prev, avatar_emoji: emoji }));
  };

  const handleSaveProfile = async () => {
    try {
      await base44.auth.updateMe(formData);
      const updatedUser = await base44.auth.me();
      setUser(updatedUser);
      setFormData({
        full_name: updatedUser.full_name || "",
        school_year: updatedUser.school_year || "",
        school_name: updatedUser.school_name || "",
        class_name: updatedUser.class_name || "",
      });
      setEditing(false);
    } catch (err) {
      console.error("Failed to save profile:", err);
    }
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
        {editing ? (
          <Input
            value={formData.full_name}
            onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
            className="bg-white/20 border-white/30 text-white placeholder-white/60 text-center font-heading font-bold mb-2"
            placeholder="Your name"
          />
        ) : (
          <h1 className="text-xl font-heading font-bold">{user?.full_name || "User"}</h1>
        )}
        <p className="text-white/70 text-sm">{user?.email}</p>
        <span className="inline-block mt-2 px-3 py-1 rounded-full bg-white/20 text-xs font-medium capitalize">
          {user?.app_role || "student"}
        </span>
        {user?.app_role === "student" && (
          <div className="flex items-center justify-center gap-3 mt-3">
            <button
              onClick={() => setShowAvatar(!showAvatar)}
              className="text-xs text-white/90 hover:text-white underline"
            >
              {showAvatar ? "Close Avatar" : "Change Avatar"}
            </button>
            <button
              onClick={() => editing ? handleSaveProfile() : setEditing(true)}
              className="text-xs text-white/90 hover:text-white underline font-medium flex items-center gap-1"
            >
              <Pen className="w-3 h-3" />
              {editing ? "Save" : "Edit Profile"}
            </button>
          </div>
        )}
      </motion.div>

      {/* Avatar selector */}
      {showAvatar && user?.app_role === "student" && (
        <AvatarSelector currentAvatar={user?.avatar_emoji} onSelect={handleSaveAvatar} />
      )}

      {/* Parent connection — students only */}
      {user?.app_role === "student" && <ConnectParent user={user} />}

      {/* Stats for students */}
      {user?.app_role === "student" && (
        <>
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

          {/* Profile editor */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl p-5 border border-border/50"
          >
            <h3 className="font-heading font-bold text-foreground mb-4">School Profile</h3>
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Year Level</Label>
                {editing ? (
                  <Select value={formData.school_year} onValueChange={(v) => setFormData(prev => ({ ...prev, school_year: v }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Standard 1">Standard 1</SelectItem>
                      <SelectItem value="Standard 2">Standard 2</SelectItem>
                      <SelectItem value="Standard 3">Standard 3</SelectItem>
                      <SelectItem value="Standard 4">Standard 4</SelectItem>
                      <SelectItem value="Standard 5">Standard 5</SelectItem>
                      <SelectItem value="Standard 6">Standard 6</SelectItem>
                      <SelectItem value="Form 1">Form 1</SelectItem>
                      <SelectItem value="Form 2">Form 2</SelectItem>
                      <SelectItem value="Form 3">Form 3</SelectItem>
                      <SelectItem value="Form 4">Form 4</SelectItem>
                      <SelectItem value="Form 5">Form 5</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm font-medium mt-1">{user?.school_year || "Not set"}</p>
                )}
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">School Name</Label>
                {editing ? (
                  <Input
                    value={formData.school_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, school_name: e.target.value }))}
                    placeholder="e.g. SK Taman Jaya"
                    className="mt-1"
                  />
                ) : (
                  <p className="text-sm font-medium mt-1">{user?.school_name || "Not set"}</p>
                )}
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Class</Label>
                {editing ? (
                  <Input
                    value={formData.class_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, class_name: e.target.value }))}
                    placeholder="e.g. 1A, 3B"
                    className="mt-1"
                  />
                ) : (
                  <p className="text-sm font-medium mt-1">{user?.class_name || "Not set"}</p>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}

      {/* Admin tools */}
      {user?.role === "admin" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link to="/admin/textbooks" className="flex items-center gap-3 bg-primary/5 rounded-2xl p-4 border border-primary/10 hover:bg-primary/10 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <BookMarked className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">Textbook Library</p>
              <p className="text-xs text-muted-foreground">Upload Malaysian curriculum textbooks</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </Link>
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