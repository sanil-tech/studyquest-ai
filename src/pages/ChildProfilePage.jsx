import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { LogOut, BookOpen, Trophy, Coins, BookMarked, ChevronRight, Pen, Check, X, ShieldAlert, Sparkles, Lock } from "lucide-react";
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

// ==========================================
// KOLEKSI AVATAR PERCUMA (DICEBEAR API)
// ==========================================
const FREE_AVATARS = [
  "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Happy&backgroundColor=ffdfbf",
  "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Wink&backgroundColor=b6e3f4",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Robot1&backgroundColor=c0aede",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Cody&backgroundColor=ffdfbf",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Felix&backgroundColor=ffdfbf",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Mia&backgroundColor=b6e3f4",
  "https://api.dicebear.com/7.x/micah/svg?seed=Alex&backgroundColor=ffdfbf",
  "https://api.dicebear.com/7.x/notionists/svg?seed=Luna&backgroundColor=ffdfbf"
];

// ==========================================
// KOLEKSI AVATAR PREMIUM (TAYANGAN SAHAJA - AKAN DATANG)
// ==========================================
const PREMIUM_AVATARS = [
  { id: "prem1", url: "https://api.dicebear.com/7.x/pixel-art/svg?seed=King&backgroundColor=ffd700", cost: 100, label: "Raja Pixel" },
  { id: "prem2", url: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Queen&backgroundColor=ff69b4", cost: 100, label: "Ratu Pixel" },
  { id: "prem3", url: "https://api.dicebear.com/7.x/lorelei/svg?seed=Magic&backgroundColor=87ceeb", cost: 250, label: "Magik Ais" },
  { id: "prem4", url: "https://api.dicebear.com/7.x/lorelei/svg?seed=Fire&backgroundColor=ff7f50", cost: 250, label: "Wira Api" },
  { id: "prem5", url: "https://api.dicebear.com/7.x/shapes/svg?seed=Pro&backgroundColor=98fb98", cost: 500, label: "Pro Master" },
  { id: "prem6", url: "https://api.dicebear.com/7.x/rings/svg?seed=Legend&backgroundColor=dda0dd", cost: 1000, label: "Legend" },
];

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [progress, setProgress] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [totalQuizzes, setTotalQuizzes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAvatar, setShowAvatar] = useState(false);
  const [editing, setEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: "", nickname: "", school_year: "", school_name: "",
    class_name: "", gender: "", date_of_birth: "", country: "Malaysia", state: "",
    notification_preferences: {
      email_notifications: true, push_notifications: true, quiz_reminders: true,
      daily_learning_reminder: true, parent_progress_reports: true, weekly_achievement_summary: true,
    },
    learning_preferences: {
      daily_goal_minutes: 20, difficulty_preference: "medium", favorite_subjects: [],
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
          full_name: u.full_name || "", nickname: u.nickname || "", school_year: u.school_year || "",
          school_name: u.school_name || "", class_name: u.class_name || "", gender: u.gender || "",
          date_of_birth: u.date_of_birth || "", country: u.country || "Malaysia", state: u.state || "",
          notification_preferences: u.notification_preferences || formData.notification_preferences,
          learning_preferences: u.learning_preferences || formData.learning_preferences,
        });
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id]);

  const handleLogout = () => base44.auth.logout("/login");

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
      toast({ title: "Gambar dimuat naik!", description: "Profil anda telah dikemas kini." });
    } catch (err) {
      toast({ title: "Gagal", description: "Sila cuba lagi.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    await base44.auth.updateMe({ profile_picture_url: null });
    setUser((prev) => ({ ...prev, profile_picture_url: null }));
    setAvatarMode("emoji");
  };

  const handleSelectPresetAvatar = async (url) => {
    setUploading(true);
    try {
      await base44.auth.updateMe({ profile_picture_url: url, avatar_emoji: null });
      setUser((prev) => ({ ...prev, profile_picture_url: url, avatar_emoji: null }));
      setAvatarMode("photo");
      toast({
        title: "Avatar Ditukar! 🌟",
        description: "Avatar baru anda kelihatan sangat hebat!",
      });
    } catch (err) {
      toast({ title: "Gagal", description: "Tidak dapat menukar avatar.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  // LOGIK PEMBELIAN AVATAR PREMIUM DITANGGUHKAN
  const handlePurchaseAvatar = () => {
    toast({
      title: "Fungsi Akan Datang! 🚀",
      description: "Pembelian avatar premium sedang dibina. Teruskan kumpul syiling anda!",
    });
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe(formData);
      const updatedUser = await base44.auth.me();
      setUser(updatedUser);
      setEditing(false);
      toast({ title: "Profil disimpan! ✓", description: "Maklumat anda telah dikemas kini." });
    } catch (err) {
      toast({ title: "Gagal menyimpan", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-32"><div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" /></div>;

  const isStudent = user?.app_role === "student";
  const isParent = user?.app_role === "parent";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* HEADER KAD PROFIL */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 p-6 md:p-10 text-white shadow-xl">
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 z-10">
          <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            <div className="relative group">
              <div className="w-28 h-28 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center overflow-hidden border-4 border-white/30 shadow-xl">
                {user?.profile_picture_url ? (
                  <img src={user.profile_picture_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-5xl select-none">{user?.avatar_emoji || "🦧"}</span>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{user?.full_name || "Pelajar"}</h1>
              <p className="text-orange-50 font-medium">{user?.email}</p>
            </div>
          </div>
          
          {(isStudent || isParent) && (
            <div className="flex flex-wrap items-center justify-center gap-3 bg-white/10 p-2 rounded-2xl backdrop-blur-md border border-white/20">
              {isStudent && (
                <Button variant="ghost" size="sm" onClick={() => setShowAvatar(!showAvatar)} className="text-white hover:bg-white/20 hover:text-white rounded-xl text-xs h-9 px-4 font-bold">
                  {showAvatar ? "Tutup Tetapan" : "Tukar Avatar/Gambar"}
                </Button>
              )}
              <Button size="sm" variant={editing ? "secondary" : "default"} disabled={saving} onClick={() => editing ? handleSaveProfile() : setEditing(true)} className={`text-xs h-9 px-4 font-bold rounded-xl transition-all shadow-sm ${editing ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "bg-white text-orange-600 hover:bg-orange-50"}`}>
                {saving ? "Menyimpan..." : editing ? "Simpan Profil" : "Kemaskini"}
              </Button>
            </div>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* SIDEBAR KIRI (Metrik & Identiti) */}
        <div className="lg:col-span-1 space-y-6">
           {isStudent && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-3 gap-3">
              <Card className="border-orange-100 shadow-sm"><CardContent className="p-4 text-center"><p className="text-xl font-bold">{totalQuizzes}</p><p className="text-[10px] text-slate-500 uppercase font-bold">Kuiz</p></CardContent></Card>
              <Card className="border-orange-100 shadow-sm"><CardContent className="p-4 text-center"><p className="text-xl font-bold">Lv {progress?.level || 1}</p><p className="text-[10px] text-slate-500 uppercase font-bold">Tahap</p></CardContent></Card>
              <Card className="border-orange-100 shadow-sm"><CardContent className="p-4 text-center"><p className="text-xl font-bold text-amber-500">{wallet?.balance || 0}</p><p className="text-[10px] text-slate-500 uppercase font-bold">Syiling</p></CardContent></Card>
            </motion.div>
          )}
          {isStudent && <div className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden"><StudentIdSection user={user} /></div>}
          <Button variant="outline" onClick={handleLogout} className="w-full rounded-2xl h-12 text-red-500 border-red-200 bg-red-50 hover:bg-red-100 font-bold">Log Keluar Akaun</Button>
        </div>

        {/* BAHAGIAN KANAN (Tetapan Avatar & Borang) */}
        <div className="lg:col-span-2 space-y-6">
          
          <AnimatePresence>
            {showAvatar && isStudent && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden bg-white rounded-2xl border border-orange-100 shadow-sm">
                
                {/* 1. Komponen Upload Asal */}
                <div className="p-1 border-b-2 border-orange-50">
                  <ProfilePhotoSection
                    user={user} avatarMode={avatarMode} setAvatarMode={setAvatarMode}
                    uploading={uploading} setUploading={setUploading} fileInputRef={fileInputRef}
                    handlePhotoUpload={handlePhotoUpload} handleRemovePhoto={handleRemovePhoto}
                    handleSaveAvatar={handleSaveAvatar} showAvatar={showAvatar} setShowAvatar={setShowAvatar}
                  />
                </div>

                {/* 2. Galeri Avatar Percuma */}
                <div className="p-6 bg-slate-50/50">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-blue-500" />
                    <h3 className="text-sm font-bold text-slate-700">Koleksi Avatar Percuma</h3>
                  </div>
                  
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-4">
                    {FREE_AVATARS.map((url, idx) => {
                      const isSelected = user?.profile_picture_url === url;
                      return (
                        <button
                          key={idx}
                          onClick={() => handleSelectPresetAvatar(url)}
                          disabled={uploading}
                          className={`relative aspect-square rounded-2xl border-4 transition-all overflow-hidden ${
                            isSelected 
                              ? "border-blue-500 shadow-md scale-105" 
                              : "border-transparent hover:border-blue-200 hover:scale-105 hover:shadow-sm"
                          }`}
                        >
                          <img src={url} alt={`Avatar Percuma ${idx}`} className="w-full h-full object-cover bg-white" />
                          {isSelected && (
                            <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                              <Check className="w-6 h-6 text-blue-600 drop-shadow-md" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Galeri Avatar Premium (Kunci & Akan Datang) */}
                <div className="p-6 bg-amber-50/50 border-t border-amber-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-amber-500" />
                      <h3 className="text-sm font-bold text-amber-700">Avatar Premium (Akan Datang)</h3>
                    </div>
                    <div className="flex items-center gap-1 bg-amber-100 px-3 py-1 rounded-full">
                      <Coins className="w-4 h-4 text-amber-600" />
                      <span className="text-sm font-bold text-amber-700">{wallet?.balance || 0}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {PREMIUM_AVATARS.map((avatar) => {
                      return (
                        <button
                          key={avatar.id}
                          onClick={handlePurchaseAvatar}
                          className="relative flex flex-col items-center p-2 rounded-2xl border-4 border-transparent bg-white hover:border-amber-200 hover:scale-105 hover:shadow-sm transition-all overflow-hidden"
                        >
                          <div className="relative w-full aspect-square rounded-xl overflow-hidden mb-2">
                            <img src={avatar.url} alt={avatar.label} className="w-full h-full object-cover bg-white" />
                            {/* Overlay Kunci */}
                            <div className="absolute inset-0 bg-slate-900/30 flex items-center justify-center backdrop-blur-[1px]">
                              <Lock className="w-6 h-6 text-white" />
                            </div>
                          </div>
                          
                          <div className="text-center w-full">
                            <p className="text-xs font-bold text-slate-700 truncate">{avatar.label}</p>
                            <div className="flex items-center justify-center gap-1 mt-1 text-xs font-bold text-slate-500">
                              <Coins className="w-3 h-3" />
                              {avatar.cost}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

              </motion.div>
            )}
          </AnimatePresence>

          {(isStudent || isParent) && (
            <Card className="border-orange-100 shadow-sm rounded-2xl overflow-hidden bg-white">
              <CardContent className="p-6 md:p-8">
                <ProfileForm user={user} editing={editing} formData={formData} setFormData={setFormData} isStudent={isStudent} />
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}