import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { LogOut, BookOpen, Trophy, Coins, BookMarked, ChevronRight, Pen } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import ConnectParent from "@/components/student/ConnectParent";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import ProfilePhotoSection from "@/components/profile/ProfilePhotoSection";
import ProfileForm from "@/components/profile/ProfileForm";
import NotificationPreferencesSection from "@/components/profile/NotificationPreferencesSection";
import LearningPreferencesSection from "@/components/profile/LearningPreferencesSection";
import SecuritySection from "@/components/profile/SecuritySection";

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
          setTotalQuizzes(attempts.length);
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

    // Real-time subscription for user profile updates
    const unsubscribe = base44.entities.User.subscribe((event) => {
      if (event.type === "update" && event.data?.id === user?.id) {
        setUser(event.data);
        setFormData({
          full_name: event.data.full_name || "",
          nickname: event.data.nickname || "",
          school_year: event.data.school_year || "",
          school_name: event.data.school_name || "",
          class_name: event.data.class_name || "",
          gender: event.data.gender || "",
          date_of_birth: event.data.date_of_birth || "",
          country: event.data.country || "Malaysia",
          state: event.data.state || "",
          notification_preferences: event.data.notification_preferences || formData.notification_preferences,
          learning_preferences: event.data.learning_preferences || formData.learning_preferences,
        });
        toast({
          title: "Profile Updated",
          description: "Your profile has been updated successfully.",
        });
      }
    });

    return () => unsubscribe();
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

      // Sync name to any approved LinkRequest so parent dashboard shows updated name
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
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const isStudent = user?.app_role === "student";
  const isParent = user?.app_role === "parent";

  return (
    <div className="space-y-6 pb-8">
      {/* Profile Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-primary to-indigo-600 rounded-3xl p-8 text-white text-center relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative inline-block">
          <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4 overflow-hidden border-4 border-white/30 shadow-lg">
            {user?.profile_picture_url ? (
              <img 
                src={user.profile_picture_url} 
                alt="Profile" 
                className="w-full h-full object-cover" 
              />
            ) : (
              <span className="text-5xl">{user?.avatar_emoji || "🎓"}</span>
            )}
          </div>
          {isStudent && showAvatar && (
            <button
              onClick={handleRemovePhoto}
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center text-sm hover:bg-red-600 shadow-lg"
              title="Remove photo"
            >
              ×
            </button>
          )}
        </div>
        
        <h1 className="text-2xl font-heading font-bold mb-1">{user?.full_name || "User"}</h1>
        <p className="text-white/80 text-sm mb-3">{user?.email}</p>
        <span className="inline-block px-4 py-1.5 rounded-full bg-white/20 text-sm font-medium capitalize backdrop-blur-sm">
          {user?.app_role || "student"}
        </span>
        
        {(isStudent || isParent) && (
          <div className="flex items-center justify-center gap-4 mt-4">
            {isStudent && (
              <button
                onClick={() => setShowAvatar(!showAvatar)}
                className="text-sm text-white/90 hover:text-white underline flex items-center gap-1"
              >
                {showAvatar ? "Close" : "Change Photo"}
              </button>
            )}
            <button
              onClick={() => editing ? handleSaveProfile() : setEditing(true)}
              disabled={saving}
              className="text-sm text-white/90 hover:text-white underline font-medium flex items-center gap-1 disabled:opacity-50 bg-white/10 px-3 py-1.5 rounded-full"
            >
              <Pen className={`w-4 h-4 ${saving ? "animate-spin" : ""}`} />
              {saving ? "Saving..." : (editing ? "Save Changes" : "Edit Profile")}
            </button>
          </div>
        )}
      </motion.div>

      {/* Profile Photo Section */}
      {showAvatar && isStudent && (
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
      )}

      {/* Student Stats */}
      {isStudent && (
        <>
          <ConnectParent user={user} />
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-3 gap-3"
          >
            <Card className="border-border/50">
              <CardContent className="p-4 text-center">
                <BookOpen className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="text-lg font-bold">{totalQuizzes}</p>
                <p className="text-[10px] text-muted-foreground">Quizzes</p>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-4 text-center">
                <Trophy className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                <p className="text-lg font-bold">Lv {progress?.level || 1}</p>
                <p className="text-[10px] text-muted-foreground">Level</p>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-4 text-center">
                <Coins className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                <p className="text-lg font-bold">{wallet?.balance || 0}</p>
                <p className="text-[10px] text-muted-foreground">Coins</p>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}

      {/* Profile Form */}
      {(isStudent || isParent) && (
        <ProfileForm
          user={user}
          editing={editing}
          formData={formData}
          setFormData={setFormData}
          isStudent={isStudent}
        />
      )}

      {/* Notification Preferences */}
      {editing && (
        <NotificationPreferencesSection
          editing={editing}
          formData={formData}
          setFormData={setFormData}
        />
      )}

      {/* Learning Preferences */}
      {isStudent && editing && (
        <LearningPreferencesSection
          editing={editing}
          formData={formData}
          setFormData={setFormData}
        />
      )}

      {/* Security Settings */}
      {editing && (
        <SecuritySection
          editing={editing}
          formData={formData}
          setFormData={setFormData}
          onSavePassword={async (passwordData) => {
            toast({
              title: "Password change",
              description: "Please use the forgot password flow to reset your password",
              variant: "destructive",
            });
          }}
        />
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