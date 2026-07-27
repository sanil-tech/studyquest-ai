// src/pages/ProfilePage.jsx
import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { 
  LogOut, Trophy, Coins, Check, Sparkles, Lock, Loader2 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import ProfilePhotoSection from "@/components/profile/ProfilePhotoSection";
import ProfileForm from "@/components/profile/ProfileForm";
import StudentIdSection from "@/components/profile/StudentIdSection";
import CreatureCompanionSection from "@/components/profile/CreatureCompanionSection";
import { useStudentData } from "@/hooks/useStudentData";
import { resolveCssAvatar } from "@/lib/avatarSystem";
import { useAuth } from "@/lib/AuthContext";
import { useViewMode } from "@/lib/ViewModeContext";

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

const PREMIUM_AVATARS = [
  { id: "prem1", url: "https://api.dicebear.com/7.x/pixel-art/svg?seed=King&backgroundColor=ffd700", cost: 100, label: "Raja Pixel" },
  { id: "prem2", url: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Queen&backgroundColor=ff69b4", cost: 100, label: "Ratu Pixel" },
  { id: "prem3", url: "https://api.dicebear.com/7.x/lorelei/svg?seed=Magic&backgroundColor=87ceeb", cost: 250, label: "Magik Ais" },
  { id: "prem4", url: "https://api.dicebear.com/7.x/lorelei/svg?seed=Fire&backgroundColor=ff7f50", cost: 250, label: "Wira Api" },
  { id: "prem5", url: "https://api.dicebear.com/7.x/shapes/svg?seed=Pro&backgroundColor=98fb98", cost: 500, label: "Pro Master" },
  { id: "prem6", url: "https://api.dicebear.com/7.x/rings/svg?seed=Legend&backgroundColor=dda0dd", cost: 1000, label: "Legend" },
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [user, setUser] = useState(null);
  const [targetStudentId, setTargetStudentId] = useState(null);
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
    education_level: "",
    school_name: "",
    class_name: "", 
    gender: "", 
    date_of_birth: "", 
    country: "Malaysia", 
    state: "",
    district: "",
  });

  const [avatarMode, setAvatarMode] = useState("emoji");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);
  const { data, loading: hookLoading, studentUser, studentId: hookStudentId } = useStudentData();
  const { checkUserAuth } = useAuth();
  const { selectedChildProfile, updateSelectedChildProfile } = useViewMode();

  // Helper: refresh header avatar after any avatar change
  const syncHeaderAvatar = (updatedFields) => {
    // If parent is in child mode, update the ViewModeContext profile
    if (selectedChildProfile) {
      const childUpdates = {};
      if (updatedFields.profile_picture_url !== undefined) childUpdates.profile_picture_url = updatedFields.profile_picture_url;
      if (updatedFields.avatar_emoji !== undefined || updatedFields.selected_avatar !== undefined) {
        childUpdates.avatar = updatedFields.selected_avatar || updatedFields.avatar_emoji || selectedChildProfile.avatar;
      }
      updateSelectedChildProfile(childUpdates);
    } else {
      // Direct login: refresh AuthContext so the header user updates
      checkUserAuth();
    }
  };

  useEffect(() => {
    setLoading(hookLoading);
    if (!data || !studentUser) return;

    const profileUser = data.user || studentUser;

    setUser(profileUser);
    setTargetStudentId(hookStudentId);
    setProgress(data.progress || { level: 1, total_xp: 0 });
    setWallet(data.wallet || { balance: 0 });
    setTotalQuizzes(data.quizAttempts?.length || 0);

    const eduLevel = profileUser.education_level || profileUser.school_year || "";

    setFormData({
      full_name: profileUser.full_name || "",
      nickname: profileUser.nickname || "",
      school_year: eduLevel,
      education_level: eduLevel,
      school_name: profileUser.school_name || "",
      class_name: profileUser.class_name || "",
      gender: profileUser.gender || "",
      date_of_birth: profileUser.date_of_birth || "",
      country: profileUser.country || "Malaysia",
      state: profileUser.state || "",
      district: profileUser.district || "",
    });
  }, [data, hookLoading, studentUser, hookStudentId]);

  const handleLogout = () => {
    localStorage.clear();
    base44.auth.logout("/login");
  };

  const handleCreatureChanged = (newCreatureId) => {
    setUser((prev) => ({ ...prev, selected_creature: newCreatureId }));
  };

  const handleSaveAvatar = async (emoji) => {
    try {
      const childId = user?.id || targetStudentId;
      if (childId) {
        await base44.functions.invoke("updateChildProfile", {
          child_id: childId,
          selected_avatar: emoji,
        });
      } else {
        await base44.auth.updateMe({ avatar_emoji: emoji, profile_picture_url: null });
      }
      setUser((prev) => ({ ...prev, avatar_emoji: emoji, selected_avatar: emoji, profile_picture_url: null }));
      syncHeaderAvatar({ avatar_emoji: emoji, selected_avatar: emoji, profile_picture_url: null });
      toast({ title: "Avatar Ditukar! 🎨", description: "Avatar baharu anda telah disimpan." });
    } catch (err) {
      toast({ title: "Gagal", description: "Sila cuba lagi.", variant: "destructive" });
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      const childId = user?.id || targetStudentId;
      if (childId) {
        await base44.functions.invoke("updateChildProfile", {
          child_id: childId,
          profile_picture_url: result.file_url,
        });
      } else {
        await base44.auth.updateMe({ profile_picture_url: result.file_url, avatar_emoji: null });
      }
      setUser((prev) => ({ ...prev, profile_picture_url: result.file_url, avatar_emoji: null }));
      syncHeaderAvatar({ profile_picture_url: result.file_url, avatar_emoji: null });
      setAvatarMode("photo");
      toast({ title: "Gambar dimuat naik!", description: "Profil anda telah dikemas kini." });
    } catch (err) {
      toast({ title: "Gagal", description: "Sila cuba lagi.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    try {
      const childId = user?.id || targetStudentId;
      if (childId) {
        await base44.functions.invoke("updateChildProfile", {
          child_id: childId,
          profile_picture_url: null,
        });
      } else {
        await base44.auth.updateMe({ profile_picture_url: null });
      }
      setUser((prev) => ({ ...prev, profile_picture_url: null }));
      syncHeaderAvatar({ profile_picture_url: null });
      setAvatarMode("emoji");
    } catch (err) {
      toast({ title: "Gagal", description: "Tidak dapat memadam gambar.", variant: "destructive" });
    }
  };

  const handleSelectPresetAvatar = async (url) => {
    setUploading(true);
    try {
      const childId = user?.id || targetStudentId;
      if (childId) {
        await base44.functions.invoke("updateChildProfile", {
          child_id: childId,
          profile_picture_url: url,
        });
      } else {
        await base44.auth.updateMe({ profile_picture_url: url, avatar_emoji: null });
      }
      setUser((prev) => ({ ...prev, profile_picture_url: url, avatar_emoji: null }));
      syncHeaderAvatar({ profile_picture_url: url, avatar_emoji: null });
      setAvatarMode("photo");
      toast({ title: "Avatar Ditukar! 🌟", description: "Avatar baru anda kelihatan sangat hebat!" });
    } catch (err) {
      toast({ title: "Gagal", description: "Tidak dapat menukar avatar.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handlePurchaseAvatar = () => {
    toast({
      title: "Fungsi Akan Datang! 🚀",
      description: "Pembelian avatar premium sedang dibina. Teruskan kumpul syiling anda!",
    });
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const childId = user?.id || targetStudentId;

      const payload = {
        child_id: childId,
        nickname: formData.nickname || user?.nickname || "",
        full_name: formData.full_name || user?.full_name || "",
        education_level: formData.education_level || formData.school_year || "",
        school_name: formData.school_name || "",
        gender: formData.gender || "",
        date_of_birth: formData.date_of_birth || "",
        state: formData.state || "",
        district: formData.district || "",
        class_name: formData.class_name || "",
        country: formData.country || "Malaysia",
      };

      if (childId) {
        const response = await base44.functions.invoke("updateChildProfile", payload);
        const resPayload = response?.data || response;

        if (resPayload?.success === false) {
          throw new Error(resPayload?.error || "Gagal mengemaskini profil anak.");
        }

        if (resPayload?.user) {
          setUser(resPayload.user);
          const cachedChildren = JSON.parse(localStorage.getItem("cached_children") || "{}");
          cachedChildren[childId] = { ...cachedChildren[childId], ...resPayload.user };
          localStorage.setItem("cached_children", JSON.stringify(cachedChildren));
        }
      } else {
        await base44.auth.updateMe({
          full_name: formData.full_name,
          nickname: formData.nickname,
          education_level: formData.education_level || formData.school_year,
          school_name: formData.school_name,
          gender: formData.gender,
          date_of_birth: formData.date_of_birth,
          state: formData.state,
          district: formData.district,
          class_name: formData.class_name,
          country: formData.country || "Malaysia",
        });
        const updatedMe = await base44.auth.me();
        setUser(updatedMe);
      }

      setEditing(false);
      toast({ title: "Profil disimpan! ✓", description: "Maklumat profil telah dikemas kini." });
    } catch (err) {
      toast({ title: "Gagal menyimpan", description: err.message || "Ralat pelayan", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
        <p className="mt-3 text-xs font-bold text-stone-500 uppercase tracking-wider">Memuat turun profil...</p>
      </div>
    );
  }

  const isStudent = user?.app_role === "student" || Boolean(targetStudentId);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans text-stone-800">
      
      {/* HEADER KAD PROFIL */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 p-6 md:p-10 text-white shadow-xl"
      >
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 z-10">
          <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            <div className="relative group">
              {(() => {
                const cssAvatar = resolveCssAvatar(user?.profile_picture_url) || resolveCssAvatar(user?.avatar_emoji) || resolveCssAvatar(user?.selected_avatar);
                const realPhoto = user?.profile_picture_url && !cssAvatar ? user.profile_picture_url : null;
                const fallbackEmoji = user?.selected_avatar || user?.avatar_emoji || "🦧";
                return (
                  <div className={`w-28 h-28 rounded-full flex items-center justify-center overflow-hidden border-4 border-white/30 shadow-xl ${
                    cssAvatar ? `bg-gradient-to-br ${cssAvatar.bg}` : "bg-white/20 backdrop-blur-md"
                  }`}>
                    {cssAvatar ? (
                      <span className="text-5xl select-none drop-shadow-md">{cssAvatar.emoji}</span>
                    ) : realPhoto ? (
                      <img src={realPhoto} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-5xl select-none">{fallbackEmoji}</span>
                    )}
                  </div>
                );
              })()}
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                  {user?.nickname || user?.full_name || "Pelajar"}
                </h1>
                {targetStudentId && (
                  <span className="bg-amber-100 text-amber-900 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Mod Anak
                  </span>
                )}
              </div>
              <p className="text-orange-50 font-medium text-sm">
                {formData.education_level ? `Tahap: ${formData.education_level}` : "Penjelajah StudyQuest"}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-3 bg-white/10 p-2 rounded-2xl backdrop-blur-md border border-white/20">
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
              {saving ? "Menyimpan..." : editing ? "Simpan Profil" : "Kemaskini"}
            </Button>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* SIDEBAR KIRI */}
        <div className="lg:col-span-1 space-y-6">
          {isStudent && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-3 gap-3">
              <Card className="border-orange-100 shadow-sm">
                <CardContent className="p-4 text-center">
                  <p className="text-xl font-bold">{totalQuizzes}</p>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Kuiz</p>
                </CardContent>
              </Card>
              <Card className="border-orange-100 shadow-sm">
                <CardContent className="p-4 text-center">
                  <p className="text-xl font-bold">Lv {progress?.level || 1}</p>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Tahap</p>
                </CardContent>
              </Card>
              <Card className="border-orange-100 shadow-sm">
                <CardContent className="p-4 text-center">
                  <p className="text-xl font-bold text-amber-500">{wallet?.balance || 0}</p>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Syiling</p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {isStudent && (
            <div className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden">
              <StudentIdSection user={user} />
            </div>
          )}

          <Button 
            variant="outline" 
            onClick={handleLogout} 
            className="w-full rounded-2xl h-12 text-red-500 border-red-200 bg-red-50 hover:bg-red-100 font-bold"
          >
            <LogOut className="w-4 h-4 mr-2" /> Log Keluar Akaun
          </Button>
        </div>

        {/* BAHAGIAN KANAN */}
        <div className="lg:col-span-2 space-y-6">
          
          <AnimatePresence>
            {showAvatar && isStudent && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: "auto" }} 
                exit={{ opacity: 0, height: 0 }} 
                className="overflow-hidden bg-white rounded-2xl border border-orange-100 shadow-sm"
              >
                <div className="p-1 border-b-2 border-orange-50">
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
                </div>

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

          {isStudent && (
            <CreatureCompanionSection
              user={user}
              xp={progress?.total_xp || 0}
              targetStudentId={targetStudentId}
              onCreatureChanged={handleCreatureChanged}
            />
          )}

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

        </div>
      </div>
    </div>
  );
}