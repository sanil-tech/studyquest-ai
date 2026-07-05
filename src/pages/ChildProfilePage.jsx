import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { LogOut, BookOpen, Trophy, Coins, BookMarked, ChevronRight, Pen, Check, X, Sparkles } from "lucide-react";
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
import ProfilePhotoSection from "@/components/profile/ProfilePhotoSection";

// Peta data warna latar belakang dan emoji agar serasi dengan bingkai profil utama
const AVATAR_MAP = {
  "war_01": { emoji: "🥷", bg: "from-red-500 via-orange-500 to-amber-500" },
  "war_02": { emoji: "🛡️", bg: "from-blue-600 via-indigo-600 to-cyan-500" },
  "war_03": { emoji: "⚔️", bg: "from-rose-500 via-purple-600 to-indigo-600" },
  "mec_01": { emoji: "🤖", bg: "from-slate-700 via-zinc-800 to-gray-600" },
  "mec_02": { emoji: "👾", bg: "from-emerald-500 via-teal-600 to-cyan-500" },
  "mec_03": { emoji: "🚀", bg: "from-amber-400 via-orange-500 to-red-600" },
  "bst_01": { emoji: "🦊", bg: "from-orange-500 via-red-500 to-yellow-400" },
  "bst_02": { emoji: "🐉", bg: "from-cyan-400 via-blue-500 to-emerald-500" },
  "bst_03": { emoji: "🐯", bg: "from-amber-500 via-yellow-600 to-zinc-800" },
  "mys_01": { emoji: "🔮", bg: "from-purple-600 via-fuchsia-600 to-pink-500" },
  "mys_02": { emoji: "🔥", bg: "from-red-600 via-rose-500 to-amber-400" },
  "mys_03": { emoji: "✨", bg: "from-indigo-900 via-purple-800 to-slate-900" },
};

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [progress, setProgress] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [totalQuizzes, setTotalQuizzes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAvatar, setShowAvatar] = useState(false);
  const [avatarMode, setAvatarMode] = useState("emoji"); 
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
        
        if (u.profile_picture_url?.includes("css-avatar:")) {
          setAvatarMode("emoji");
        } else if (u.profile_picture_url) {
          setAvatarMode("photo");
        }

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

  const handleSaveAvatar = async (avatarUrl) => {
    try {
      await base44.auth.updateMe({ profile_picture_url: avatarUrl, avatar_emoji: null });
      setUser((prev) => ({ ...prev, profile_picture_url: avatarUrl, avatar_emoji: null }));
      toast({
        title: "Avatar Berhasil Diperbarui! ✨",
        description: "Gaya tampilan avatar baru Anda telah disimpan.",
      });
    } catch (err) {
      console.error("Failed to save avatar:", err);
      toast({
        title: "Gagal memperbarui avatar",
        description: "Silakan coba beberapa saat lagi.",
        variant: "destructive",
      });
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      await base44.auth.updateMe({ profile_picture_url: result.file_url, avatar_emoji: null });
      setUser((prev) => ({ ...prev, profile_picture_url: result.file_url, avatar_emoji: null }));
      setAvatarMode("photo");
      toast({
        title: "Foto profil berhasil diunggah!",
        description: "Gambar manual Anda kini aktif.",
      });
    } catch (err) {
      console.error("Photo upload failed:", err);
      toast({
        title: "Gagal mengunggah gambar",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    await base44.auth.updateMe({ profile_picture_url: null, avatar_emoji: "🎓" });
    setUser((prev) => ({ ...prev, profile_picture_url: null, avatar_emoji: "🎓" }));
    setAvatarMode("emoji");
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe(formData);
      const updatedUser = await base44.auth.me();
      setUser(updatedUser);
      syncFormData(updatedUser);
      setEditing(false);
      toast({
        title: "Profil berhasil disimpan!",
      });
    } catch (err) {
      console.error("Failed to save profile:", err);
    } finally {
      setSaving(false);
    }
  };

  // Fungsi Render Khusus Bingkai Foto Profil Utama (Kompatibilitas 2D CSS)
  const renderProfileFrame = () => {
    const picUrl = user?.profile_picture_url;

    if (picUrl && picUrl.startsWith("css-avatar:")) {
      const avatarId = picUrl.replace("css-avatar:", "");
      const config = AVATAR_MAP[avatarId] || { emoji: "🥷", bg: "from-slate-700 to-slate-900" };
      return (
        <div className={`w-full h-full bg-gradient-to-br ${config.bg} flex items-center justify-center text-5xl`}>
          <span className="select-none">{config.emoji}</span>
        </div>
      );
    }

    if (picUrl) {
      return <img src={picUrl} alt="Profile" className="w-full h-full object-cover" />;
    }

    return <span className="text-5xl select-none">{user?.avatar_emoji || "🎓"}</span>;
  };

  if (loading) return <div className="text-center py-32">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Profile */}
      <div className="rounded-3xl bg-gradient-to-br from-primary to-indigo-700 p-6 md:p-10 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="relative w-28 h-28 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border-4 border-white/20 shadow-xl">
            {renderProfileFrame()}
            {user?.app_role === "student" && (user?.profile_picture_url || user?.avatar_emoji !== "🎓") && (
              <button onClick={handleRemovePhoto} className="absolute top-0 right-0 bg-destructive p-1 rounded-full text-white">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{user?.full_name || "User"}</h1>
            <p className="text-white/80 text-sm">{user?.email}</p>
          </div>
        </div>

        <div className="flex gap-2">
          {user?.app_role === "student" && (
            <Button variant="secondary" size="sm" onClick={() => setShowAvatar(!showAvatar)} className="rounded-xl">
              {showAvatar ? "Tutup Panel" : "Pilih Avatar 2D"}
            </Button>
          )}
          <Button size="sm" onClick={() => editing ? handleSaveProfile() : setEditing(true)} className="rounded-xl">
            {editing ? "Simpan" : "Edit Profil"}
          </Button>
        </div>
      </div>

      {/* Grid Utama Konten */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          {user?.app_role === "student" && <StudentIdSection user={user} />}
          {user?.app_role === "student" && <ParentConnections user={user} />}
        </div>

        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence>
            {showAvatar && user?.app_role === "student" && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                <ProfilePhotoSection
                  user={user}
                  avatarMode={avatarMode}
                  setAvatarMode={setAvatarMode}
                  uploading={uploading}
                  fileInputRef={fileInputRef}
                  handlePhotoUpload={handlePhotoUpload}
                  handleSaveAvatar={handleSaveAvatar}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <Card className="rounded-2xl overflow-hidden bg-card border">
            <CardContent className="p-6">
              <ProfileForm user={user} editing={editing} formData={formData} setFormData={setFormData} isStudent={user?.app_role === "student"} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}