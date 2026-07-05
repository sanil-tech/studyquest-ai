import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { LogOut, BookOpen, Trophy, Coins, BookMarked, ChevronRight, Pen, Check, X, Bot, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import ParentConnections from "@/components/student/ParentConnections";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import ProfileForm from "@/components/profile/ProfileForm";
import NotificationPreferencesSection from "@/components/profile/NotificationPreferencesSection";
import LearningPreferencesSection from "@/components/profile/LearningPreferencesSection";
import SecuritySection from "@/components/profile/SecuritySection";
import StudentIdSection from "@/components/profile/StudentIdSection";

// ==========================================
// DATA AVATAR 3D BERTEMA (SIMPAN TERUS DI SINI)
// ==========================================
const AVATAR_THEMES = {
  robot: {
    label: "🤖 Cyber-Bots",
    items: [
      { id: "rob_01", name: "Alpha Mech", url: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Alpha" },
      { id: "rob_02", name: "Neon Spark", url: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Spark" },
      { id: "rob_03", name: "Cyber Node", url: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Node" },
    ]
  },
  haiwan: {
    label: "🦁 Wild 3D",
    items: [
      { id: "ani_01", name: "Shadow Tiger", url: "https://api.dicebear.com/7.x/lorelei/svg?seed=Tiger" },
      { id: "ani_02", name: "Sonic Falcon", url: "https://api.dicebear.com/7.x/lorelei/svg?seed=Falcon" },
      { id: "ani_03", name: "Mystic Fox", url: "https://api.dicebear.com/7.x/lorelei/svg?seed=Fox" },
    ]
  },
  dragon: {
    label: "🐉 Dragon Clan",
    items: [
      { id: "drg_01", name: "Inferno Drake", url: "https://api.dicebear.com/7.x/identicon/svg?seed=Inferno" },
      { id: "drg_02", name: "Frost Wyrm", url: "https://api.dicebear.com/7.x/identicon/svg?seed=Frost" },
      { id: "drg_03", name: "Abyss Dragon", url: "https://api.dicebear.com/7.x/identicon/svg?seed=Abyss" },
    ]
  },
  mystic: {
    label: "🔮 Mystic Roleplay",
    items: [
      { id: "mys_01", name: "Astral Mage", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Mage" },
      { id: "mys_02", name: "Void Rogue", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Rogue" },
      { id: "mys_03", name: "Solar Knight", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Knight" },
    ]
  }
};

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [progress, setProgress] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [totalQuizzes, setTotalQuizzes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAvatar, setShowAvatar] = useState(false);
  const [activeTab, setActiveTab] = useState("robot"); // Mengawal tab tema avatar yang aktif
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: "",
    nickname: "",
    school_year: "",
    school_name: "",
    class_name: "",
    gender: "",
    date_of_birth: "",
    country: "Malaysia",
    state: "",
    notification_preferences: {
      email_notifications: true,
      push_notifications: true,
      quiz_reminders: true,
      daily_learning_reminder: true,
      parent_progress_reports: true,
      weekly_achievement_summary: true,
    },
    learning_preferences: {
      daily_goal_minutes: 20,
      difficulty_preference: "medium",
      favorite_subjects: [],
    },
  });

  const fileInputRef = useRef(null);
  const { toast } = useToast();

  const syncFormData = (userData) => {
    setFormData({
      full_name: userData.full_name || "",
      nickname: userData.nickname || "",
      school_year: userData.school_year || "",
      school_name: userData.school_name || "",
      class_name: userData.class_name || "",
      gender: userData.gender || "",
      date_of_birth: userData.date_of_birth || "",
      country: userData.country || "Malaysia",
      state: userData.state || "",
      notification_preferences: userData.notification_preferences || {
        email_notifications: true,
        push_notifications: true,
        quiz_reminders: true,
        daily_learning_reminder: true,
        parent_progress_reports: true,
        weekly_achievement_summary: true,
      },
      learning_preferences: userData.learning_preferences || {
        daily_goal_minutes: 20,
        difficulty_preference: "medium",
        favorite_subjects: [],
      },
    });
  };

  useEffect(() => {
    const load = async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
        syncFormData(u);
        
        if (u.app_role === "student") {
          const [progs, wallets, attempts] = await Promise.all([
            base44.entities.Progress.filter({ student_id: u.id }),
            base44.entities.Wallet.filter({ student_id: u.id }),
            base44.entities.QuizAttempt.filter({ student_id: u.id }),
          ]);
          
          if (progs?.[0]) setProgress(progs[0]);
          if (wallets?.[0]) setWallet(wallets[0]);
          if (attempts) setTotalQuizzes(attempts.length);
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleLogout = () => {
    base44.auth.logout("/login");
  };

  // Fungsi menyimpan avatar bertema 3D yang dipilih oleh anak
  const handleSelectThemeAvatar = async (avatarUrl) => {
    try {
      await base44.auth.updateMe({ profile_picture_url: avatarUrl, avatar_emoji: null });
      setUser((prev) => ({ ...prev, profile_picture_url: avatarUrl, avatar_emoji: null }));
      toast({
        title: "Avatar Dikemaskini! 🎉",
        description: "Penampilan avatar baharu anda berjaya disimpan.",
      });
    } catch (err) {
      console.error("Failed to save avatar:", err);
      toast({
        title: "Gagal menukar avatar",
        description: "Sila cuba sebentar lagi.",
        variant: "destructive",
      });
    }
  };

  const handleRemovePhoto = async () => {
    await base44.auth.updateMe({ profile_picture_url: null, avatar_emoji: "🎓" });
    setUser((prev) => ({ ...prev, profile_picture_url: null, avatar_emoji: "🎓" }));
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe(formData);
      const updatedUser = await base44.auth.me();
      setUser(updatedUser);
      syncFormData(updatedUser);
      setEditing(false);

      if (updatedUser.app_role === "student") {
        const linkReqs = await base44.entities.LinkRequest.filter({ 
          student_email: updatedUser.email, 
          status: "approved" 
        });
        await Promise.all(
          linkReqs.map(req =>
            base44.entities.LinkRequest.update(req.id, { 
              student_name: updatedUser.full_name || updatedUser.email 
            })
          )
        );
      }

      toast({
        title: "Profile saved! ✓",
        description: "Your profile has been updated successfully.",
      });
    } catch (err) {
      console.error("Failed to save profile:", err);
      toast({
        title: "Failed to save",
        description: err.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const isStudent = user?.app_role === "student";
  const isParent = user?.app_role === "parent";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Profile Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-indigo-600 to-violet-700 p-6 md:p-10 text-white shadow-xl shadow-indigo-900/10"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4 blur-lg pointer-events-none" />
        
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            <div className="relative group">
              <div className="w-28 h-28 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center overflow-hidden border-4 border-white/20 shadow-xl transition-transform duration-300 group-hover:scale-105">
                {user?.profile_picture_url ? (
                  <img src={user.profile_picture_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-5xl select-none">{user?.avatar_emoji || "🎓"}</span>
                )}
              </div>
              {isStudent && (user?.profile_picture_url || user?.avatar_emoji !== "🎓") && (
                <button
                  onClick={handleRemovePhoto}
                  className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-destructive text-white flex items-center justify-center font-bold text-xs hover:bg-destructive/90 shadow-md transition-colors"
                  title="Reset Avatar"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{user?.full_name || "User"}</h1>
                <span className="px-3 py-0.5 text-xs font-semibold uppercase tracking-wider rounded-full bg-white/20 backdrop-blur-xs text-white/90">
                  {user?.app_role || "student"}
                </span>
              </div>
              <p className="text-white/75 text-sm md:text-base font-medium">{user?.email}</p>
            </div>
          </div>

          {/* Header Actions Panel */}
          {(isStudent || isParent) && (
            <div className="flex flex-wrap items-center justify-center gap-3 bg-white/10 p-2 rounded-2xl backdrop-blur-md border border-white/10 w-full md:w-auto">
              {isStudent && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAvatar(!showAvatar)}
                  className="text-white hover:bg-white/10 hover:text-white rounded-xl text-xs h-9 px-4 font-medium"
                >
                  {showAvatar ? "Tutup Pilihan" : "Pilih Avatar Roleplay 3D"}
                </Button>
              )}
              
              <Button
                size="sm"
                variant={editing ? "secondary" : "default"}
                disabled={saving}
                onClick={() => editing ? handleSaveProfile() : setEditing(true)}
                className={`text-xs h-9 px-4 font-semibold rounded-xl transition-all shadow-xs ${
                  editing ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "bg-white text-indigo-700 hover:bg-white/90"
                }`}
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-indigo-700/30 border-t-indigo-700 rounded-full animate-spin mr-1.5" />
                ) : editing ? (
                  <Check className="w-3.5 h-3.5 mr-1.5" />
                ) : (
                  <Pen className="w-3.5 h-3.5 mr-1.5" />
                )}
                {saving ? "Saving..." : editing ? "Save Profile Data" : "Edit Details"}
              </Button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Main Core Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Hand Sidebar Column */}
        <div className="lg:col-span-1 space-y-6">
          {/* Quick Metrics */}
          {isStudent && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="grid grid-cols-3 gap-3"
            >
              <Card className="border-border/60 shadow-xs bg-card">
                <CardContent className="p-4 text-center space-y-1">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <p className="text-xl font-bold tracking-tight mt-1">{totalQuizzes}</p>
                  <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Quizzes</p>
                </CardContent>
              </Card>
              
              <Card className="border-border/60 shadow-xs bg-card">
                <CardContent className="p-4 text-center space-y-1">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <p className="text-xl font-bold tracking-tight mt-1">Lv {progress?.level || 1}</p>
                  <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Level</p>
                </CardContent>
              </Card>

              <Card className="border-border/60 shadow-xs bg-card">
                <CardContent className="p-4 text-center space-y-1">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
                    <Coins className="w-4 h-4" />
                  </div>
                  <p className="text-xl font-bold tracking-tight mt-1">{wallet?.balance || 0}</p>
                  <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Coins</p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Student Identifiers */}
          {isStudent && (
            <div className="bg-card rounded-2xl shadow-xs border border-border/60 overflow-hidden">
              <StudentIdSection user={user} />
            </div>
          )}

          {/* Connected Parents Links */}
          {isStudent && (
            <div className="bg-card rounded-2xl shadow-xs border border-border/60 overflow-hidden p-1">
              <ParentConnections user={user} />
            </div>
          )}

          {/* Admin Tools Links */}
          {user?.role === "admin" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Link to="/admin/textbooks" className="group flex items-center gap-4 bg-primary/5 rounded-2xl p-4 border border-primary/10 hover:bg-primary/10 transition-all duration-200">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                  <BookMarked className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground">Textbook Library</p>
                  <p className="text-xs text-muted-foreground truncate">Upload Malaysian curriculum modules</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/70 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </motion.div>
          )}

          {/* Sign Out Action Button */}
          <Button
            variant="outline"
            onClick={handleLogout}
            className="w-full rounded-2xl h-12 text-destructive border-destructive/20 bg-destructive/5 hover:bg-destructive/10 transition-colors font-medium text-sm"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out of Account
          </Button>
        </div>

        {/* Right Hand / Main Content Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* SECRESY SELECTION: INTEGRATED TEMA AVATAR BARU */}
          <AnimatePresence>
            {showAvatar && isStudent && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-card rounded-2xl border border-border/60 p-6 shadow-md overflow-hidden space-y-4"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
                  <h3 className="font-bold text-lg tracking-tight text-foreground">Pilih Tema Avatar Lively 3D</h3>
                </div>

                {/* Butang Navigasi Kategori / Tema Tab */}
                <div className="flex flex-wrap gap-2 p-1 bg-secondary/40 rounded-xl">
                  {Object.entries(AVATAR_THEMES).map(([key, theme]) => (
                    <button
                      key={key}
                      onClick={() => setActiveTab(key)}
                      className={`flex-1 min-w-[80px] py-2 px-3 text-xs font-semibold rounded-lg transition-all capitalize ${
                        activeTab === key
                          ? "bg-primary text-white shadow-xs"
                          : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                      }`}
                    >
                      {theme.label.split(" ")[1] || theme.label} 
                    </button>
                  ))}
                </div>

                {/* Paparan Grid Item Avatar Mengikut Kategori Pilihan */}
                <div className="grid grid-cols-3 gap-4 pt-2">
                  {AVATAR_THEMES[activeTab].items.map((avatar) => {
                    const isSelected = user?.profile_picture_url === avatar.url;
                    return (
                      <div
                        key={avatar.id}
                        onClick={() => handleSelectThemeAvatar(avatar.url)}
                        className={`group relative cursor-pointer border-2 rounded-2xl p-3 text-center transition-all bg-secondary/10 hover:bg-secondary/30 ${
                          isSelected ? "border-primary bg-primary/5 shadow-md scale-102" : "border-transparent"
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 bg-primary text-white p-0.5 rounded-full z-10">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                        <img
                          src={avatar.url}
                          alt={avatar.name}
                          className="w-16 h-16 sm:w-20 sm:h-20 mx-auto object-contain transition-transform duration-200 group-hover:scale-110"
                        />
                        <p className="text-[11px] font-bold mt-2 text-foreground truncate">{avatar.name}</p>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Core Form Inputs */}
          {(isStudent || isParent) && (
            <Card className="border-border/60 shadow-xs rounded-2xl overflow-hidden bg-card">
              <CardContent className="p-6 md:p-8">
                <ProfileForm
                  user={user}
                  editing={editing}
                  formData={formData}
                  setFormData={setFormData}
                  isStudent={isStudent}
                />
              </CardContent>
            </Card>
          )}

          {/* Notifications Form Blocks */}
          {editing && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border/60 shadow-xs p-6 md:p-8">
              <NotificationPreferencesSection
                editing={editing}
                formData={formData}
                setFormData={setFormData}
              />
            </motion.div>
          )}

          {/* Learning Sub-settings Track */}
          {isStudent && editing && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border/60 shadow-xs p-6 md:p-8">
              <LearningPreferencesSection
                editing={editing}
                formData={formData}
                setFormData={setFormData}
              />
            </motion.div>
          )}

          {/* Password Security Actions Module */}
          {editing && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border/60 shadow-xs p-6 md:p-8">
              <SecuritySection
                editing={editing}
                formData={formData}
                setFormData={setFormData}
                onSavePassword={async () => {
                  toast({
                    title: "Security Request Notice",
                    description: "Please utilize the native portal forgot password authorization pipeline to handle active updates.",
                    variant: "destructive",
                  });
                }}
              />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}