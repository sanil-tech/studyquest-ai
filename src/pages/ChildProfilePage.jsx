// src/pages/ChildProfilePage.jsx
import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Key, Sparkles, Check, Loader2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import ProfileForm from "@/components/profile/ProfileForm";
import StudentIdSection from "@/components/profile/StudentIdSection";
import ChildCredentialManager from "@/components/parent/ChildCredentialManager";

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

export default function ChildProfilePage() {
  const params = useParams();
  const routeChildId = params.childId || params.id;
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const [childUser, setChildUser] = useState(null);
  const [activeChildId, setActiveChildId] = useState(null);
  const [progress, setProgress] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [totalQuizzes, setTotalQuizzes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showAvatar, setShowAvatar] = useState(false);
  const [openCredentialManager, setOpenCredentialManager] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "",
    nickname: "",
    school_year: "",
    education_level: "",
    school_name: "",
    class_name: "",
    gender: "",
    date_of_birth: "",
  });

  const [avatarMode, setAvatarMode] = useState("emoji");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const loadChildData = async () => {
    try {
      setLoading(true);

      // Resolve child ID parameter from route or session fallback
      const targetId = 
        routeChildId || 
        localStorage.getItem("selected_child_id") || 
        localStorage.getItem("active_child_session") || 
        localStorage.getItem("active_student_id");

      if (!targetId) {
        toast({ title: "Mod Profil Anak", description: "Sila pilih anak dari senarai.", variant: "destructive" });
        navigate("/parent/children");
        return;
      }

      let fetchedUser = null;

      // ── TIER 1: Direct Primary Key Query ──────────────────────────────
      fetchedUser = await base44.entities.User.get(targetId).catch(() => null);

      // ── TIER 2: Query by student_id Code (e.g. SQ-XXXXXX) ──────────────
      if (!fetchedUser) {
        const matches = await base44.entities.User.filter({ student_id: targetId }).catch(() => []);
        if (matches && matches.length > 0) {
          fetchedUser = matches[0];
        }
      }

      // ── TIER 3: Backend Edge Function Fetch (Uses Service Role) ────────
      if (!fetchedUser) {
        try {
          const res = await base44.functions.invoke("fetchParentChildren");
          const children = res?.data?.children || [];
          fetchedUser = children.find((c) => c.id === targetId || c.student_id === targetId);
        } catch (e) {
          console.warn("Edge function child fetch fallback skipped:", e);
        }
      }

      // ── TIER 4: Local Storage Cache Fallback ───────────────────────────
      if (!fetchedUser) {
        try {
          const cachedMap = JSON.parse(localStorage.getItem("cached_children") || "{}");
          fetchedUser = cachedMap[targetId] || null;
        } catch (e) {}

        if (!fetchedUser) {
          try {
            const activeChildStr = localStorage.getItem("active_child");
            if (activeChildStr) {
              fetchedUser = JSON.parse(activeChildStr);
            }
          } catch (e) {}
        }
      }

      if (!fetchedUser) {
        toast({ 
          title: "Profil Tidak Ditemui", 
          description: "Data murid tidak dapat dimuat turun dari pangkalan data.", 
          variant: "destructive" 
        });
        return;
      }

      const confirmedPkId = fetchedUser.id || targetId;
      setActiveChildId(confirmedPkId);
      setChildUser(fetchedUser);

      // Fetch Child Stats using resolved student ID
      const [progs, wallets, attempts] = await Promise.all([
        base44.entities.Progress.filter({ student_id: confirmedPkId }).catch(() => []),
        base44.entities.Wallet.filter({ student_id: confirmedPkId }).catch(() => []),
        base44.entities.QuizAttempt.filter({ student_id: confirmedPkId }).catch(() => []),
      ]);

      setProgress(progs?.[0] || { level: 1, total_xp: 0 });
      setWallet(wallets?.[0] || { balance: 0 });
      setTotalQuizzes(attempts?.length || 0);

      const eduLevel = fetchedUser.education_level || fetchedUser.school_year || "";

      setFormData({
        full_name: fetchedUser.full_name || "",
        nickname: fetchedUser.nickname || "",
        school_year: eduLevel,
        education_level: eduLevel,
        school_name: fetchedUser.school_name || "",
        class_name: fetchedUser.class_name || "",
        gender: fetchedUser.gender || "",
        date_of_birth: fetchedUser.date_of_birth || "",
      });

    } catch (err) {
      console.error("Error loading child profile:", err);
      toast({ title: "Ralat System", description: "Gagal memuat turun profil murid.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChildData();
  }, [routeChildId]);

  const handleSaveProfile = async () => {
    const targetId = activeChildId || childUser?.id || routeChildId;
    if (!targetId) return;

    setSaving(true);

    try {
      const response = await base44.functions.invoke("updateChildProfile", {
        child_id: targetId,
        nickname: formData.nickname,
        full_name: formData.full_name,
        education_level: formData.education_level || formData.school_year,
        school_name: formData.school_name,
        gender: formData.gender,
        date_of_birth: formData.date_of_birth,
        state: formData.state || "",
        district: formData.district || "",
        class_name: formData.class_name || "",
        country: formData.country || "Malaysia",
      });

      const resPayload = response?.data || response;

      if (resPayload?.success === false) {
        throw new Error(resPayload?.error || "Gagal mengemaskini profil anak.");
      }

      if (resPayload?.user) {
        setChildUser(resPayload.user);
        
        // Sync local storage cache
        const cachedChildren = JSON.parse(localStorage.getItem("cached_children") || "{}");
        cachedChildren[targetId] = { ...cachedChildren[targetId], ...resPayload.user };
        localStorage.setItem("cached_children", JSON.stringify(cachedChildren));
      }

      setEditing(false);
      toast({ title: "Profil Disimpan! ✓", description: "Maklumat anak telah dikemas kini di pangkalan data." });
    } catch (err) {
      toast({ title: "Gagal Menyimpan 🛑", description: err.message || "Ralat pelayan", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAvatar = async (emoji) => {
    try {
      const targetId = activeChildId || childUser?.id;
      await base44.functions.invoke("updateChildProfile", {
        child_id: targetId,
        selected_avatar: emoji,
      });

      setChildUser((prev) => ({ ...prev, selected_avatar: emoji, avatar_emoji: emoji, profile_picture_url: null }));
      toast({ title: "Avatar Ditukar! 🎨", description: "Avatar baharu telah disimpan." });
    } catch (err) {
      toast({ title: "Gagal", description: "Sila cuba lagi.", variant: "destructive" });
    }
  };

  const handleSelectPresetAvatar = async (url) => {
    setUploading(true);
    try {
      const targetId = activeChildId || childUser?.id;
      await base44.functions.invoke("updateChildProfile", {
        child_id: targetId,
        profile_picture_url: url,
      });

      setChildUser((prev) => ({ ...prev, profile_picture_url: url }));
      setAvatarMode("photo");
      toast({ title: "Avatar Ditukar! 🌟", description: "Gambar avatar baharu telah dikemas kini." });
    } catch (err) {
      toast({ title: "Gagal", description: "Tidak dapat menukar avatar.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <p className="mt-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Memuat turun profil anak...</p>
      </div>
    );
  }

  const childDisplayName = childUser?.nickname || childUser?.full_name || "Pelajar";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans text-slate-800">
      
      {/* BACK BUTTON BAR */}
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/parent/children")} 
          className="rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-100"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Senarai Anak
        </Button>

        <Button 
          onClick={() => setOpenCredentialManager(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-sm"
        >
          <Key className="w-3.5 h-3.5 mr-1.5" /> Pengurusan PIN & Log Masuk
        </Button>
      </div>

      {/* BANNER HEADER */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 p-6 md:p-10 text-white shadow-xl"
      >
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 z-10">
          <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            <div className="w-28 h-28 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center overflow-hidden border-4 border-white/30 shadow-xl shrink-0">
              {childUser?.profile_picture_url ? (
                <img src={childUser.profile_picture_url} alt={childDisplayName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-5xl select-none">{childUser?.selected_avatar || childUser?.avatar_emoji || "🦧"}</span>
              )}
            </div>

            <div className="space-y-1.5">
              <h1 className="text-2xl md:text-3xl font-black tracking-tight">{childDisplayName}</h1>
              <p className="text-indigo-100 font-medium text-sm">
                {formData.education_level ? `Tahap: ${formData.education_level}` : "Murid StudyQuest"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/10 p-2 rounded-2xl backdrop-blur-md border border-white/20">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowAvatar(!showAvatar)} 
              className="text-white hover:bg-white/20 rounded-xl text-xs h-9 px-4 font-bold"
            >
              {showAvatar ? "Tutup Tetapan" : "Tukar Avatar"}
            </Button>

            <Button 
              size="sm" 
              disabled={saving} 
              onClick={() => editing ? handleSaveProfile() : setEditing(true)} 
              className={`text-xs h-9 px-4 font-bold rounded-xl transition-all shadow-sm ${
                editing ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "bg-white text-indigo-700 hover:bg-indigo-50"
              }`}
            >
              {saving ? "Menyimpan..." : editing ? "Simpan Profil" : "Kemaskini Profil"}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* LEFT COLUMN: METRICS & STUDENT ID */}
        <div className="lg:col-span-1 space-y-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-3 gap-3">
            <Card className="border-indigo-100 shadow-sm">
              <CardContent className="p-4 text-center">
                <p className="text-xl font-black text-slate-800">{totalQuizzes}</p>
                <p className="text-[10px] text-slate-400 uppercase font-bold">Kuiz</p>
              </CardContent>
            </Card>
            <Card className="border-indigo-100 shadow-sm">
              <CardContent className="p-4 text-center">
                <p className="text-xl font-black text-slate-800">Lv {progress?.level || 1}</p>
                <p className="text-[10px] text-slate-400 uppercase font-bold">Tahap</p>
              </CardContent>
            </Card>
            <Card className="border-indigo-100 shadow-sm">
              <CardContent className="p-4 text-center">
                <p className="text-xl font-black text-amber-500">{wallet?.balance || 0}</p>
                <p className="text-[10px] text-slate-400 uppercase font-bold">Syiling</p>
              </CardContent>
            </Card>
          </motion.div>

          <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-hidden">
            <StudentIdSection user={childUser} />
          </div>
        </div>

        {/* RIGHT COLUMN: PROFILE FORM & AVATAR SELECTOR */}
        <div className="lg:col-span-2 space-y-6">
          
          <AnimatePresence>
            {showAvatar && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: "auto" }} 
                exit={{ opacity: 0, height: 0 }} 
                className="overflow-hidden bg-white rounded-2xl border border-indigo-100 shadow-sm p-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-indigo-500" />
                  <h3 className="text-sm font-bold text-slate-700">Pilih Avatar Percuma</h3>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-6 gap-4">
                  {FREE_AVATARS.map((url, idx) => {
                    const isSelected = childUser?.profile_picture_url === url;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectPresetAvatar(url)}
                        disabled={uploading}
                        className={`relative aspect-square rounded-2xl border-4 transition-all overflow-hidden ${
                          isSelected 
                            ? "border-indigo-500 shadow-md scale-105" 
                            : "border-transparent hover:border-indigo-200 hover:scale-105"
                        }`}
                      >
                        <img src={url} alt={`Avatar ${idx}`} className="w-full h-full object-cover bg-white" />
                        {isSelected && (
                          <div className="absolute inset-0 bg-indigo-500/20 flex items-center justify-center">
                            <Check className="w-6 h-6 text-indigo-600 drop-shadow-md" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Card className="border-indigo-100 shadow-sm rounded-2xl overflow-hidden bg-white">
            <CardContent className="p-6 md:p-8">
              <ProfileForm 
                user={childUser} 
                editing={editing} 
                formData={formData} 
                setFormData={setFormData} 
                isStudent={true} 
              />
            </CardContent>
          </Card>

        </div>
      </div>

      {/* CREDENTIAL MANAGER MODAL */}
      {childUser && (
        <ChildCredentialManager
          open={openCredentialManager}
          onOpenChange={setOpenCredentialManager}
          child={childUser}
          onCredentialsUpdated={loadChildData}
        />
      )}

    </div>
  );
}