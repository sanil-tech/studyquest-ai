import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { LogOut, BookOpen, Trophy, Coins, BookMarked, ChevronRight, Pen, Check, X, ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import ParentConnections from "@/components/student/ParentConnections";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import ProfilePhotoSection from "@/components/profile/ProfilePhotoSection";
import ProfileForm from "@/components/profile/ProfileForm";
import NotificationPreferencesSection from "@/components/profile/NotificationPreferencesSection";
import LearningPreferencesSection from "@/components/profile/LearningPreferencesSection";
import SecuritySection from "@/components/profile/SecuritySection";
import StudentIdSection from "@/components/profile/StudentIdSection";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [progress, setProgress] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [totalQuizzes, setTotalQuizzes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAvatar, setShowAvatar] = useState(false);
  const [editing, setEditing] = useState(false);
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
  const [avatarMode, setAvatarMode] = useState("emoji");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
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
          totalQuizzes && setTotalQuizzes(attempts.length);
        }
        
        setFormData({
          full_name: u.full_name || "",
          nickname: u.nickname || "",
          school_year: u.school_year || "",
          school_name: u.school_name || "",
          class_name: u.class_name || "",
          gender: u.gender || "",
          date_of_birth: u.date_of_birth || "",
          country: u.country || "Malaysia",
          state: u.state || "",
          notification_preferences: u.notification_preferences || {
            email_notifications: true,
            push_notifications: true,
            quiz_reminders: true,
            daily_learning_reminder: true,
            parent_progress_reports: true,
            weekly_achievement_summary: true,
          },
          learning_preferences: u.learning_preferences || {
            daily_goal_minutes: 20,
            difficulty_preference: "medium",
            favorite_subjects: [],
          },
        });
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id]);

  const handleLogout = () => {
    base44.auth.logout("/login");
  };

  const handleSaveAvatar = async (emoji) => {
    await base44.auth.updateMe({ avatar_emoji: emoji, profile_picture_url: null });
    setUser((prev) => ({ ...prev, avatar_emoji: emoji, profile_picture_url: null }));
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
        title: "Photo uploaded!",
        description: "Your profile photo has been updated.",
      });
    } catch (err) {
      console.error("Photo upload failed:", err);
      toast({
        title: "Upload failed",
        description: "Failed to upload photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    await base44.auth.updateMe({ profile_picture_url: null });
    setUser((prev) => ({ ...prev, profile_picture_url: null }));
    setAvatarMode("emoji");
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe(formData);
      const updatedUser = await base44.auth.me();
      setUser(updatedUser);
      setFormData({
        full_name: updatedUser.full_name || "",
        nickname: updatedUser.nickname || "",
        school_year: updatedUser.school_year || "",
        school_name: updatedUser.school_name || "",
        class_name: updatedUser.class_name || "",
        gender: updatedUser.gender || "",
        date_of_birth: updatedUser.date_of_birth || "",
        country: updatedUser.country || "Malaysia",
        state: updatedUser.state || "",
        notification_preferences: updatedUser.notification_preferences || formData.notification_preferences,
        learning_preferences: updatedUser.learning_preferences || formData.learning_preferences,
      });
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
        <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  const isStudent = user?.app_role === "student";
  const isParent = user?.app_role === "parent";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* ==========================================
          PROFILE HEADER CARD (Tema Orang Utan)
          ========================================== */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 p-6 md:p-10 text-white shadow-xl shadow-orange-900/10"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/3 -translate-x-1/4 blur-lg pointer-events-none" />
        
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            <div className="relative group">
              <div className="w-28 h-28 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center overflow-hidden border-4 border-white/30 shadow-xl transition-transform duration-300 group-hover:scale-105">
                {user?.profile_picture_url ? (
                  <img src={user.profile_picture_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-5xl select-none">{user?.avatar_emoji || "🦧"}</span>
                )}
              </div>
              {isStudent && showAvatar && (
                <button
                  onClick={handleRemovePhoto}
                  className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center font-bold text-xs hover:bg-red-600 shadow-md transition-colors"
                  title="Remove photo"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{user?.full_name || "Pelajar"}</h1>
                <span className="px-3 py-0.5 text-xs font-bold uppercase tracking-wider rounded-full bg-white/30 backdrop-blur-xs text-white">
                  {user?.app_role || "student"}
                </span>
              </div>
              <p className="text-orange-50 text-sm md:text-base font-medium">{user?.email}</p>
            </div>
          </div>

          {/* Header Actions Panel */}
          {(isStudent || isParent) && (
            <div className="flex flex-wrap items-center justify-center gap-3 bg-white/10 p-2 rounded-2xl backdrop-blur-md border border-white/20 w-full md:w-auto">
              {isStudent && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAvatar(!showAvatar)}
                  className="text-white hover:bg-white/20 hover:text-white rounded-xl text-xs h-9 px-4 font-bold"
                >
                  {showAvatar ? "Tutup Tetapan" : "Tukar Avatar/Gambar"}
                </Button>
              )}
              
              <Button
                size="sm"
                variant={editing ? "secondary" : "default"}
                disabled={saving}
                onClick={() => editing ? handleSaveProfile() : setEditing(true)}
                className={`text-xs h-9 px-4 font-bold rounded-xl transition-all shadow-sm ${
                  editing ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "bg-white text-orange-600 hover:bg-orange-50"
                }`}
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-orange-600/30 border-t-orange-600 rounded-full animate-spin mr-1.5" />
                ) : editing ? (
                  <Check className="w-3.5 h-3.5 mr-1.5" />
                ) : (
                  <Pen className="w-3.5 h-3.5 mr-1.5" />
                )}
                {saving ? "Menyimpan..." : editing ? "Simpan Profil" : "Kemaskini"}
              </Button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Main Core Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Hand Sidebar Column */}
        <div className="lg:col-span-1 space-y-6">
          {isStudent && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="grid grid-cols-3 gap-3"
            >
              <Card className="border-orange-100 shadow-sm bg-white">
                <CardContent className="p-4 text-center space-y-1">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center mx-auto">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <p className="text-xl font-bold tracking-tight mt-1">{totalQuizzes}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Kuiz</p>
                </CardContent>
              </Card>
              
              <Card className="border-orange-100 shadow-sm bg-white">
                <CardContent className="p-4 text-center space-y-1">
                  <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <p className="text-xl font-bold tracking-tight mt-1">Lv {progress?.level || 1}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Tahap</p>
                </CardContent>
              </Card>

              <Card className="border-orange-100 shadow-sm bg-white">
                <CardContent className="p-4 text-center space-y-1">
                  <div className="w-8 h-8 rounded-xl bg-yellow-50 text-yellow-600 flex items-center justify-center mx-auto">
                    <Coins className="w-4 h-4" />
                  </div>
                  <p className="text-xl font-bold tracking-tight mt-1">{wallet?.balance || 0}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Syiling</p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Student Identifiers / Security Keys */}
          {isStudent && (
            <div className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden">
              <StudentIdSection user={user} />
            </div>
          )}

          {/* Associated Parent Node Bindings */}
          {isStudent && (
            <div className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden p-1">
              <ParentConnections user={user} />
            </div>
          )}

          {/* Admin Platform Tool Links */}
          {user?.role === "admin" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Link to="/admin/textbooks" className="group flex items-center gap-4 bg-orange-50 rounded-2xl p-4 border border-orange-100 hover:bg-orange-100 transition-all duration-200">
                <div className="w-10 h-10 rounded-xl bg-orange-200 flex items-center justify-center text-orange-700 group-hover:scale-105 transition-transform">
                  <BookMarked className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-slate-800">Perpustakaan Buku</p>
                  <p className="text-xs text-slate-500 truncate">Muat naik modul silibus</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </motion.div>
          )}

          {/* System Sign out Operations Anchor */}
          <Button
            variant="outline"
            onClick={handleLogout}
            className="w-full rounded-2xl h-12 text-red-500 border-red-200 bg-red-50 hover:bg-red-100 transition-colors font-bold text-sm"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Log Keluar Akaun
          </Button>
        </div>

        {/* Right Hand / Main Content Columns Content Segment */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Avatar Settings Section Dropdown Panel */}
          <AnimatePresence>
            {showAvatar && isStudent && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden bg-white rounded-2xl border border-orange-100 p-1 shadow-sm"
              >
                <ProfilePhotoSection
                  user={user}
                  avatarMode={avatarMode}
                  setAvatarMode={setAvatarMode}
                  uploading={uploading}
                  setUploading={setUploading}
                  fileInputRef={fileInputRef}
                  handlePhotoUpload={handlePhotoUpload}
                  handleRemovePhoto={handleRemovePhoto}
                  handleSaveAvatar={handleSaveAvatar}
                  showAvatar={showAvatar}
                  setShowAvatar={setShowAvatar}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Core Profile Parameters Forms Layout UI Block */}
          {(isStudent || isParent) && (
            <Card className="border-orange-100 shadow-sm rounded-2xl overflow-hidden bg-white">
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

          {/* Notification System Node Hooks */}
          {editing && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-orange-100 shadow-sm p-6 md:p-8">
              <NotificationPreferencesSection
                editing={editing}
                formData={formData}
                setFormData={setFormData}
              />
            </motion.div>
          )}

          {/* Curriculums Learning Track Preferences */}
          {isStudent && editing && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-orange-100 shadow-sm p-6 md:p-8">
              <LearningPreferencesSection
                editing={editing}
                formData={formData}
                setFormData={setFormData}
              />
            </motion.div>
          )}

          {/* Cryptography / Account Access Keys Modification Interface */}
          {editing && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-orange-100 shadow-sm p-6 md:p-8">
              <SecuritySection
                editing={editing}
                formData={formData}
                setFormData={setFormData}
                onSavePassword={async () => {
                  toast({
                    title: "Notis Keselamatan",
                    description: "Sila gunakan portal rasmi 'Lupa Kata Laluan' untuk mengemaskini tetapan ini.",
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