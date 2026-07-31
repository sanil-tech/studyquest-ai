// src/pages/MyChildrenPage.jsx
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { 
  Users, Flame, Clock, Coins, BarChart3, Zap, Loader2, 
  Eye, EyeOff, Edit3, Trash2, Key, GraduationCap, UserCheck, UserPlus, UserMinus
} from "lucide-react";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { getChildDisplayName, getStudentEducationLevel, loadChildrenWithStats } from "@/lib/childUtils";
import ChildCredentialManager from "@/components/parent/ChildCredentialManager";
import AddChildModal from "@/components/parent/AddChildModal";

const GRADE_OPTIONS = [
  "Standard 1", "Standard 2", "Standard 3", "Standard 4", "Standard 5", "Standard 6",
  "Form 1", "Form 2", "Form 3", "Form 4", "Form 5"
];

// ================= 1. KAD DETEIL ANAK (DETAILED CHILD CARD) =================
function DetailedChildCard({ child, onOpenReport, onOpenAiAnalysis, onDataUpdated }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [showPin, setShowPin] = useState(false);
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [inputPin, setInputPin] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [isChangingGrade, setIsChangingGrade] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [openCredentialsModal, setOpenCredentialsModal] = useState(false);
  
  const displayName = getChildDisplayName(child);
  const currentGrade = getStudentEducationLevel(child) || "Standard 1";

  const [inputName, setInputName] = useState(child.nickname || displayName);
  const [selectedGrade, setSelectedGrade] = useState(currentGrade);
  const [updating, setUpdating] = useState(false);

  const sessionData = child.latestSession || {};
  const progressData = child.realProgress || {};
  
  const currentXP = progressData.total_xp || 0; 
  const xpForNext = progressData.level ? progressData.level * 200 : 200;
  
  const rawPercentage = xpForNext > 0 ? Math.round(((currentXP % xpForNext) / xpForNext) * 100) : 0;
  const xpPercentage = Math.min(Math.max(rawPercentage, 0), 100);
  
  const streakDays = progressData.streak_days || 0;
  const currentCoins = child.wallet?.balance || 0;
  
  const lastActiveTime = sessionData.updated_at 
    ? `Belajar Terakhir: ${moment(sessionData.updated_at).format("DD/MM/YYYY")}` 
    : "Tiada rekod aktif";

  // 🔥 UPDATE NAME IN DATABASE
  const handleSaveName = async () => {
    if (!inputName.trim()) {
      toast({ title: "Medan Wajib", description: "Nama panggilan tidak boleh kosong.", variant: "destructive" });
      return;
    }
    setUpdating(true);
    try {
      const cleanName = inputName.trim();

      const response = await base44.functions.invoke("updateChildProfile", {
        child_id: child.id,
        nickname: cleanName,
        full_name: cleanName
      });

      const resPayload = response?.data || response;
      if (resPayload?.success === false) {
        throw new Error(resPayload?.error || "Gagal mengemaskini nama.");
      }

      toast({ title: "Berjaya Dikemaskini 🦖", description: "Nama panggilan anak berjaya disimpan." });
      setIsEditingName(false);
      if (onDataUpdated) onDataUpdated();
    } catch (err) {
      toast({ title: "Gagal menukar nama", description: err.message, variant: "destructive" });
    } finally {
      setUpdating(false);
    }
  };

  // 🔥 UPDATE EDUCATION LEVEL / GRADE IN DATABASE
  const handleSaveGrade = async (newGrade) => {
    setUpdating(true);
    try {
      const response = await base44.functions.invoke("updateChildProfile", {
        child_id: child.id,
        education_level: newGrade,
        school_year: newGrade
      });

      const resPayload = response?.data || response;
      if (resPayload?.success === false) {
        throw new Error(resPayload?.error || "Gagal mengemaskini tahap persekolahan.");
      }

      setSelectedGrade(newGrade);
      setIsChangingGrade(false);
      toast({ title: "Tahap Dikemaskini 🎓", description: `Tahap persekolahan ${displayName} telah ditukar ke ${newGrade}.` });
      if (onDataUpdated) onDataUpdated();
    } catch (err) {
      toast({ title: "Gagal menukar tahap", description: err.message, variant: "destructive" });
    } finally {
      setUpdating(false);
    }
  };

  // 🔥 UPDATE PIN IN DATABASE
  const handleSaveNewPin = async () => {
    if (inputPin.length !== 4) {
      toast({ title: "Format Salah", description: "PIN mestilah tepat 4 digit.", variant: "destructive" });
      return;
    }
    setUpdating(true);
    try {
      const response = await base44.functions.invoke("resetChildCredentials", {
        child_id: child.id,
        action: "reset_pin",
        new_pin: inputPin,
      });

      const resPayload = response?.data || response;
      if (resPayload?.success === false) {
        throw new Error(resPayload?.error || "Gagal menyimpan PIN.");
      }

      toast({ title: "PIN Dikunci Kekal! 🔑", description: "PIN baharu disimpan ke pangkalan data." });
      setIsSettingPin(false);
      setInputPin("");
      if (onDataUpdated) onDataUpdated();
    } catch (err) {
      toast({ title: "Gagal menyimpan PIN 🛑", description: err.message, variant: "destructive" });
    } finally {
      setUpdating(false);
    }
  };

  // 🔥 UNLINK CHILD (keeps child account & progress)
  const handleUnlinkChild = async () => {
    setUpdating(true);
    try {
      const response = await base44.functions.invoke("removeParentChildLink", { child_id: child.id });
      const resPayload = response?.data || response;
      if (resPayload?.success === false) throw new Error(resPayload?.error || "Gagal memutuskan tautan.");
      toast({ title: "Tautan Diputus 🚪", description: `${displayName} tidak lagi dikaitkan dengan akaun anda.` });
      setConfirmDeleteOpen(false);
      if (onDataUpdated) onDataUpdated();
    } catch (err) {
      toast({ title: "Gagal memutuskan tautan", description: err.message, variant: "destructive" });
    } finally {
      setUpdating(false);
    }
  };

  // 🔥 DELETE CHILD PERMANENTLY (removes account + all data)
  const handleDeleteChild = async () => {
    setUpdating(true);
    try {
      const response = await base44.functions.invoke("removeChildLink", { child_id: child.id });
      const resPayload = response?.data || response;
      if (resPayload?.success === false) throw new Error(resPayload?.error || "Gagal memadamkan profil.");
      toast({ title: "Profil Dihapus 🗑️", description: `Profil ${displayName} dan semua data telah dipadamkan.` });
      setConfirmDeleteOpen(false);
      if (onDataUpdated) onDataUpdated();
    } catch (err) {
      toast({ title: "Gagal memadamkan profil", description: err.message, variant: "destructive" });
    } finally {
      setUpdating(false);
    }
  };

  // 🔥 SWITCH TO CHILD MODE
  const handleSwitchToChildMode = () => {
    localStorage.setItem("active_child_session", child.id);
    localStorage.setItem("selected_child_id", child.id);
    localStorage.setItem("active_student_id", child.id);
    localStorage.setItem("active_student_name", displayName);
    localStorage.setItem("active_child", JSON.stringify(child));

    toast({ title: "Mod Anak Diaktifkan 🚀", description: `Anda kini melihat portal sebagai ${displayName}.` });
    navigate("/study");
  };

  return (
    <Card className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm flex flex-col justify-between space-y-4 relative">
      
      {/* CARD TOP STATUS BAR */}
      <div className="flex items-center justify-between border-b border-slate-50 pb-2.5 text-[10px] text-slate-400 font-bold">
        <span className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full uppercase text-[9px]">
          <Clock className="w-3 h-3" /> {lastActiveTime}
        </span>
        <Badge className="bg-slate-100 text-slate-700 font-mono font-bold text-[9px] border-0">
          ID: {child.student_id || child.id?.substring(0, 8) || "------"}
        </Badge>
      </div>

      {/* CHILD PROFILE HEADER & QUICK EDITS */}
      <div className="flex items-start gap-3">
        <div className="w-14 h-14 rounded-2xl bg-pink-100 flex items-center justify-center border-2 border-pink-200 text-2xl shrink-0 overflow-hidden shadow-xs">
          {child.profile_picture_url ? (
            <img src={child.profile_picture_url} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            <span className="select-none">{child.selected_avatar || child.avatar_emoji || "🦧"}</span>
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-1.5">
          {/* NAME INLINE EDIT */}
          <div className="flex items-center justify-between gap-1">
            {isEditingName ? (
              <div className="flex items-center gap-1 w-full">
                <input 
                  type="text"
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  className="px-2 py-0.5 text-xs border rounded-md font-bold text-slate-700 w-full focus:outline-indigo-500"
                />
                <button onClick={handleSaveName} disabled={updating} className="text-[10px] font-bold text-emerald-600 shrink-0 px-2 py-1 bg-emerald-50 rounded">
                  {updating ? <Loader2 className="w-3 h-3 animate-spin" /> : "Simpan"}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 min-w-0 group cursor-pointer" onClick={() => { setInputName(child.nickname || displayName); setIsEditingName(true); }}>
                <h3 className="text-base font-black text-slate-800 tracking-tight truncate">
                  {displayName}
                </h3>
                <Edit3 className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </div>
            )}
            
            <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100 text-[10px] font-black px-2 py-0.5 rounded-lg shrink-0">
              Lv {progressData.level || 1}
            </Badge>
          </div>

          {/* EDUCATION LEVEL DROPDOWN SELECTOR */}
          <div className="flex items-center gap-2">
            <GraduationCap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            {isChangingGrade ? (
              <select
                disabled={updating}
                value={selectedGrade}
                onChange={(e) => handleSaveGrade(e.target.value)}
                className="text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200 rounded-lg px-2 py-0.5 focus:outline-none"
              >
                {GRADE_OPTIONS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            ) : (
              <button 
                onClick={() => setIsChangingGrade(true)}
                className="inline-flex items-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-black px-2 py-0.5 rounded-md border border-amber-200/80 transition-all"
              >
                <span>{currentGrade}</span>
                <Edit3 className="w-2.5 h-2.5 text-amber-600" />
              </button>
            )}
          </div>

          {/* USERNAME & LOGIN PIN DISPLAY */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[9px] font-bold text-slate-400 uppercase">User:</span>
            <span className="text-[10px] font-mono font-black text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 truncate max-w-[130px]">
              {child.username || child.nickname || "student"}
            </span>

            <span className="text-slate-200 text-[10px]">•</span>

            {isSettingPin ? (
              <div className="flex items-center gap-1">
                <input 
                  type="password" 
                  maxLength={4}
                  placeholder="PIN"
                  value={inputPin}
                  onChange={(e) => setInputPin(e.target.value.replace(/\D/g, ""))}
                  className="w-12 px-1.5 py-0.5 text-center text-xs border rounded-md text-slate-700 font-bold focus:outline-indigo-500 bg-white"
                />
                <button onClick={handleSaveNewPin} disabled={updating} className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                  {updating ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : "Set"}
                </button>
              </div>
            ) : (
              <button 
                onClick={() => {
                  if (!child.child_login_pin) {
                    setIsSettingPin(true);
                  } else {
                    setShowPin(!showPin);
                  }
                }}
                className="bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 font-mono font-black text-[9px] px-1.5 py-0.5 rounded-md tracking-wider flex items-center gap-1 shrink-0"
              >
                <span>🔑 PIN: {!child.child_login_pin ? "Set" : (showPin ? child.child_login_pin : "••••")}</span>
                {child.child_login_pin ? (
                  showPin ? <EyeOff className="w-2.5 h-2.5 text-slate-400" /> : <Eye className="w-2.5 h-2.5 text-slate-400" />
                ) : <Edit3 className="w-2.5 h-2.5 text-amber-500" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* XP & PROGRESS BAR */}
      <div className="space-y-1 bg-slate-50 p-3 rounded-2xl border border-slate-100">
        <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
          <span className="flex items-center gap-1 text-purple-600"><Zap className="w-3 h-3 fill-purple-600" /> XP TERKUMPUL</span>
          <span>{currentXP} XP ({xpPercentage}%)</span>
        </div>
        <ProgressBar value={xpPercentage} className="h-2 bg-slate-200 rounded-full" />
      </div>

      {/* STATS QUICK METRICS */}
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="p-2 bg-emerald-50/60 border border-emerald-100 rounded-xl">
          <p className="text-[9px] font-bold text-emerald-700 uppercase">Syiling Emas</p>
          <p className="text-sm font-black text-emerald-900 flex items-center justify-center gap-1 mt-0.5">
            <Coins className="w-3.5 h-3.5 text-amber-500" /> {currentCoins}
          </p>
        </div>

        <div className="p-2 bg-orange-50/60 border border-orange-100 rounded-xl">
          <p className="text-[9px] font-bold text-orange-700 uppercase">Streak Hari</p>
          <p className="text-sm font-black text-orange-900 flex items-center justify-center gap-1 mt-0.5">
            <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" /> {streakDays} Hari
          </p>
        </div>
      </div>

      {/* CARD ACTION BUTTONS */}
      <div className="pt-2 border-t border-slate-100 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={handleSwitchToChildMode}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold h-9 shadow-xs flex items-center justify-center gap-1"
          >
            <UserCheck className="w-3.5 h-3.5" /> Mod Anak
          </Button>

          <Button
            variant="outline"
            onClick={() => navigate(`/parent/child/${child.id}`)}
            className="border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold h-9 flex items-center justify-center gap-1"
          >
            <Edit3 className="w-3.5 h-3.5 text-indigo-600" /> Sunting Profil
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={() => setOpenCredentialsModal(true)}
            className="flex-1 text-[11px] font-bold text-slate-600 hover:bg-slate-100 h-8 rounded-lg"
          >
            <Key className="w-3 h-3 mr-1 text-indigo-600" /> Kredensial & PIN
          </Button>

          <Button
            variant="ghost"
            onClick={() => onOpenReport && onOpenReport(child)}
            className="flex-1 text-[11px] font-bold text-slate-600 hover:bg-slate-100 h-8 rounded-lg"
          >
            <BarChart3 className="w-3 h-3 mr-1 text-emerald-600" /> Laporan
          </Button>

          <Button
            variant="ghost"
            onClick={() => setConfirmDeleteOpen(true)}
            className="text-[11px] font-bold text-rose-500 hover:bg-rose-50 h-8 rounded-lg"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* CREDENTIAL MANAGER MODAL */}
      <ChildCredentialManager
        open={openCredentialsModal}
        onOpenChange={setOpenCredentialsModal}
        child={child}
        onCredentialsUpdated={onDataUpdated}
      />

      {/* DELETE / UNLINK CONFIRMATION DIALOG */}
      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-black text-slate-900 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-500" /> Urus Akaun Anak
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-500 leading-relaxed">
              Pilih tindakan untuk <strong className="text-slate-700">{displayName}</strong>. Anda boleh memutuskan tautan (anak kekal akaun & data) atau memadamkan secara kekal (semua data hilang).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2">
            <Button
              onClick={handleUnlinkChild}
              disabled={updating}
              variant="outline"
              className="w-full h-11 rounded-xl border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-black justify-start"
            >
              {updating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserMinus className="w-4 h-4 mr-2" />}
              Putus Tautan (Akaun Anak Kekal)
            </Button>
            <Button
              onClick={handleDeleteChild}
              disabled={updating}
              className="w-full h-11 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black justify-start"
            >
              {updating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Padam Kekal (Semua Data Dihapus)
            </Button>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl text-xs font-bold" disabled={updating}>Batal</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

// ================= 2. MAIN MY CHILDREN PAGE =================
export default function MyChildrenPage() {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);

  const loadChildren = async () => {
    setLoading(true);
    try {
      const data = await loadChildrenWithStats();
      setChildren(data);
    } catch (err) {
      console.error("Gagal memuat turun senarai anak:", err);
    } finally {
      setLoading(false);
    }
  };

  // Optimistic update: immediately display the new child card, then re-fetch full stats
  const handleChildAdded = (student) => {
    if (!student?.id) return;
    const optimisticChild = {
      id: student.id,
      nickname: student.nickname,
      full_name: student.full_name,
      username: student.username,
      student_id: student.student_id,
      child_login_pin: student.child_login_pin,
      selected_avatar: student.selected_avatar,
      avatar_emoji: student.selected_avatar,
      education_level: student.education_level,
      wallet: { balance: 0 },
      realProgress: { total_xp: 0, streak_days: 0, level: 1 },
      latestSession: {},
      allSessions: [],
      allAttempts: [],
      quiz: { quiz_score: null },
    };
    setChildren((prev) =>
      prev.some((c) => c.id === student.id) ? prev : [...prev, optimisticChild]
    );
    loadChildren();
  };

  useEffect(() => {
    loadChildren();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="mt-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Memuat turun data anak-anak...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-sans text-slate-800">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" /> Senarai Anak
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Urus profil, tukar tahap persekolahan, dan pantau kemajuan pembelajaran.
          </p>
        </div>
        <Button
          onClick={() => setAddModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold h-9 flex items-center gap-1.5 shadow-sm"
        >
          <UserPlus className="w-4 h-4" /> Tambah Anak
        </Button>
      </div>

      <AddChildModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        onChildAdded={handleChildAdded}
      />

      {children.length === 0 ? (
        <Card className="p-12 text-center rounded-3xl border-dashed border-2 border-slate-200">
          <p className="text-sm font-bold text-slate-500">Tiada profil anak dijumpai.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {children.map((child) => (
            <DetailedChildCard
              key={child.id}
              child={child}
              onDataUpdated={loadChildren}
            />
          ))}
        </div>
      )}
    </div>
  );
}