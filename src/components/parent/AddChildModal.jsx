import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  UserPlus, Loader2, KeyRound, CheckCircle2, Sparkles, ChevronRight,
  ChevronLeft, Heart, Palette
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";

const AVATAR_OPTIONS = [
  { type: "emoji", value: "🦖", label: "Dino" },
  { type: "emoji", value: "🦊", label: "Fox" },
  { type: "emoji", value: "🐼", label: "Panda" },
  { type: "emoji", value: "🦁", label: "Lion" },
  { type: "emoji", value: "🐸", label: "Frog" },
  { type: "emoji", value: "🦉", label: "Owl" },
  { type: "emoji", value: "🐙", label: "Octo" },
  { type: "emoji", value: "🦄", label: "Uni" },
  { type: "emoji", value: "🐯", label: "Tiger" },
  { type: "emoji", value: "🐧", label: "Pengu" },
  { type: "emoji", value: "🦜", label: "Bird" },
  { type: "emoji", value: "🐝", label: "Bee" },
];

const INTEREST_OPTIONS = [
  "Sains", "Matematik", "Bahasa", "Sejarah", "Seni", "Muzik",
  "Sukan", "Komputer", "Alam Semula Jadi", "Memasak", "Astronomi", "Geografi"
];

const GRADE_OPTIONS = [
  "Standard 1", "Standard 2", "Standard 3", "Standard 4", "Standard 5", "Standard 6",
  "Form 1", "Form 2", "Form 3", "Form 4", "Form 5", "Lain-lain"
];

const GENDER_OPTIONS = [
  { value: "male", label: "Lelaki 👦" },
  { value: "female", label: "Perempuan 👧" },
  { value: "other", label: "Lain-lain 🌟" },
  { value: "prefer_not_to_say", label: "Rahsia 🤫" },
];

const LANGUAGE_OPTIONS = [
  { value: "ms", label: "🇲🇾 Bahasa Melayu" },
  { value: "en", label: "🇬🇧 English" },
];

const StepIndicator = ({ current, total }) => (
  <div className="flex items-center justify-center gap-1.5 mb-4">
    {Array.from({ length: total }).map((_, i) => (
      <div
        key={i}
        className={`h-1.5 rounded-full transition-all duration-300 ${
          i <= current ? "w-8 bg-indigo-500" : "w-4 bg-slate-200"
        }`}
      />
    ))}
  </div>
);

const AvatarGrid = ({ selected, onSelect }) => (
  <div className="grid grid-cols-4 gap-2.5">
    {AVATAR_OPTIONS.map((avatar) => {
      const isSelected = selected === avatar.value;
      return (
        <button
          key={avatar.value}
          type="button"
          onClick={() => onSelect(avatar.value)}
          className={`aspect-square rounded-2xl flex items-center justify-center text-3xl transition-all border-2 ${
            isSelected
              ? "bg-indigo-100 border-indigo-500 scale-110 shadow-md"
              : "bg-slate-50 border-transparent hover:border-indigo-200 hover:scale-105"
          }`}
        >
          {avatar.value}
        </button>
      );
    })}
  </div>
);

export default function AddChildModal({ open, onOpenChange, onChildAdded }) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdStudentInfo, setCreatedStudentInfo] = useState(null);
  const { toast } = useToast();

  const [form, setForm] = useState({
    nickname: "",
    fullName: "",
    selectedAvatar: "🦖",
    dateOfBirth: "",
    gender: "",
    school: "",
    grade: "",
    language: "ms",
    interests: [],
    pin: "",
  });

  const updateForm = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  const toggleInterest = (interest) => {
    setForm((p) => ({
      ...p,
      interests: p.interests.includes(interest)
        ? p.interests.filter((i) => i !== interest)
        : [...p.interests, interest],
    }));
  };

  const handleNext = () => {
    if (step === 0 && !form.nickname.trim()) {
      toast({ title: "Nama panggilan diperlukan", description: "Sila isi nama panggilan anak anda.", variant: "destructive" });
      return;
    }
    if (step === 2 && form.pin.length !== 4) {
      toast({ title: "PIN tidak sah", description: "PIN mestilah tepat 4 digit.", variant: "destructive" });
      return;
    }
    setStep((s) => Math.min(s + 1, 2));
  };

  // 🔥 BULLETPROOF CHILD REGISTRATION HANDLER
  const handleRegisterChild = async () => {
    if (form.pin.length !== 4) {
      toast({ title: "PIN tidak sah", description: "PIN mestilah tepat 4 digit.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const response = await base44.functions.invoke("createChildAccount", {
        nickname: form.nickname.trim(),
        fullName: form.fullName.trim(),
        pin: form.pin.trim(),
        selectedAvatar: form.selectedAvatar,
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        school: form.school.trim(),
        grade: form.grade,
        language: form.language,
        interests: form.interests,
      });

      // 1. Safely extract response payload across all SDK wrappers
      const resPayload = response?.data || response;

      // 2. Check if server returned success: false
      if (!resPayload || resPayload.success === false) {
        const serverError = resPayload?.error || "Gagal menyimpan data anak ke pelayan.";
        throw new Error(serverError);
      }

      // 3. Extract student object safely
      const createdStudent = resPayload.student || resPayload.user;

      if (!createdStudent || !createdStudent.id) {
        throw new Error("Pendaftaran gagal - Maklumat murid tidak dikembalikan oleh pelayan.");
      }

      // 4. Extract generated username with fallback
      const safeUsername = createdStudent.username || `${form.nickname.toLowerCase()}_1234`;

      const safeStudentData = {
        id: createdStudent.id,
        nickname: createdStudent.nickname || form.nickname,
        full_name: createdStudent.full_name || form.fullName,
        username: safeUsername,
        student_id: createdStudent.student_id || "",
        child_login_pin: createdStudent.child_login_pin || form.pin,
        selected_avatar: form.selectedAvatar,
      };

      setCreatedStudentInfo(safeStudentData);

      // Save backup to local cache
      const cachedChildren = JSON.parse(localStorage.getItem("cached_children") || "{}");
      cachedChildren[createdStudent.id] = safeStudentData;
      localStorage.setItem("cached_children", JSON.stringify(cachedChildren));

      if (typeof onChildAdded === "function") {
        onChildAdded(safeStudentData);
      }
      setIsSuccess(true);

    } catch (err) {
      console.error("Ralat Pendaftaran Anak:", err);
      toast({
        title: "Pendaftaran Gagal 🛑",
        description: err.message || "Gagal menyimpan data ke pelayan.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setStep(0);
    setForm({
      nickname: "", fullName: "", selectedAvatar: "🦖",
      dateOfBirth: "", gender: "", school: "", grade: "",
      language: "ms", interests: [], pin: "",
    });
    setCreatedStudentInfo(null);
    setIsSuccess(false);
    onOpenChange(false);
  };

  const totalSteps = 3;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!loading) { if (!v) handleCloseModal(); else onOpenChange(v); } }}>
      <DialogContent className="sm:max-w-md rounded-3xl bg-white p-6 border-slate-100 shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <AnimatePresence mode="wait">
          {isSuccess ? (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4 space-y-4">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-500">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight">Profil Anak Berjaya Dicipta! 🎉</h3>
                <p className="text-xs text-slate-400 font-medium mt-1">Akaun telah didaftarkan secara kekal di dalam pangkalan data.</p>
              </div>
              
              <div className="bg-gradient-to-br from-amber-50 to-orange-50/60 border border-orange-100 p-4 rounded-2xl text-left space-y-2 relative overflow-hidden">
                <div className="absolute -right-6 -bottom-6 text-orange-200/40 font-black text-6xl select-none">{form.selectedAvatar}</div>
                <div className="text-xs relative z-10 space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Petualang Cilik</p>
                  <p className="font-black text-slate-700 text-base">{createdStudentInfo?.nickname || form.nickname}</p>
                  
                  {createdStudentInfo?.username && (
                    <div className="flex justify-between items-center bg-white/80 p-1.5 rounded-lg border border-orange-100">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Username Login:</span>
                      <span className="font-mono font-black text-indigo-600 text-xs">{createdStudentInfo.username}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center bg-white px-3 py-2 rounded-xl border border-orange-100/80 relative z-10 mt-2">
                  <div>
                    <p className="text-[9px] font-bold text-orange-500 uppercase tracking-wider flex items-center gap-0.5">
                      <Sparkles className="w-3 h-3 text-amber-500" /> PIN Portal Rahsia
                    </p>
                    <p className="text-xl font-black tracking-[0.4em] text-slate-800 mt-0.5">{form.pin}</p>
                  </div>
                </div>
              </div>

              <Button onClick={handleCloseModal} className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs h-10">
                Selesai & Tutup
              </Button>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <DialogHeader className="text-center sm:text-left">
                <DialogTitle className="text-lg font-black text-slate-800 flex items-center gap-2 justify-center sm:justify-start">
                  <UserPlus className="w-5 h-5 text-indigo-600" /> Tambah Profil Anak
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400 font-medium">
                  Cipta profil pembelajaran yang menyeronokkan untuk anak anda! 🌟
                </DialogDescription>
              </DialogHeader>

              <StepIndicator current={step} total={totalSteps} />

              {step === 0 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4 mt-2">
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto text-4xl border-2 border-indigo-100">
                      {form.selectedAvatar}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                      <Palette className="w-3 h-3" /> Pilih Avatar
                    </label>
                    <AvatarGrid selected={form.selectedAvatar} onSelect={(v) => updateForm("selectedAvatar", v)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Nama Panggilan *</label>
                    <input
                      type="text"
                      required
                      value={form.nickname}
                      onChange={(e) => updateForm("nickname", e.target.value)}
                      placeholder="Contoh: Adam, Mia, Corry"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:border-indigo-500 font-bold text-slate-700"
                    />
                  </div>
                </motion.div>
              )}

              {step === 1 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-3 mt-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Nama Penuh</label>
                    <input
                      type="text"
                      value={form.fullName}
                      onChange={(e) => updateForm("fullName", e.target.value)}
                      placeholder="Contoh: Corry Aileene Saniyil"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs focus:outline-none focus:border-indigo-500 font-medium text-slate-700"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Tarikh Lahir</label>
                      <input
                        type="date"
                        value={form.dateOfBirth}
                        onChange={(e) => updateForm("dateOfBirth", e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs focus:outline-none focus:border-indigo-500 font-medium text-slate-700"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Jantina</label>
                      <select
                        value={form.gender}
                        onChange={(e) => updateForm("gender", e.target.value)}
                        className="w-full px-2 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs focus:outline-none focus:border-indigo-500 font-medium text-slate-700"
                      >
                        <option value="">Pilih...</option>
                        {GENDER_OPTIONS.map((g) => (
                          <option key={g.value} value={g.value}>{g.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Sekolah (Pilihan)</label>
                      <input
                        type="text"
                        value={form.school}
                        onChange={(e) => updateForm("school", e.target.value)}
                        placeholder="SK Bandar"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs focus:outline-none focus:border-indigo-500 font-medium text-slate-700"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Tahun / Tingkatan</label>
                      <select
                        value={form.grade}
                        onChange={(e) => updateForm("grade", e.target.value)}
                        className="w-full px-2 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs focus:outline-none focus:border-indigo-500 font-medium text-slate-700"
                      >
                        <option value="">Pilih...</option>
                        {GRADE_OPTIONS.map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Bahasa Pembelajaran</label>
                    <div className="flex gap-2">
                      {LANGUAGE_OPTIONS.map((lang) => (
                        <button
                          key={lang.value}
                          type="button"
                          onClick={() => updateForm("language", lang.value)}
                          className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                            form.language === lang.value
                              ? "bg-indigo-500 text-white border-indigo-500"
                              : "bg-slate-50 text-slate-600 border-transparent hover:border-indigo-200"
                          }`}
                        >
                          {lang.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                      <Heart className="w-3 h-3" /> Minat (Pilihan)
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {INTEREST_OPTIONS.map((interest) => {
                        const isSelected = form.interests.includes(interest);
                        return (
                          <button
                            key={interest}
                            type="button"
                            onClick={() => toggleInterest(interest)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
                              isSelected
                                ? "bg-emerald-500 text-white border-emerald-500"
                                : "bg-slate-50 text-slate-500 border-slate-200 hover:border-emerald-300"
                            }`}
                          >
                            {interest}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4 mt-2">
                  <div className="text-center space-y-2">
                    <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto text-3xl border-2 border-amber-100">
                      <KeyRound className="w-8 h-8 text-amber-500" />
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      Tetapkan PIN 4-digit untuk anak anda log masuk dengan selamat.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-orange-600 uppercase tracking-wide flex items-center gap-0.5 justify-center">
                      <KeyRound className="w-3 h-3" /> PIN 4-Digit *
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      value={form.pin}
                      onChange={(e) => updateForm("pin", e.target.value.replace(/\D/g, ""))}
                      placeholder="0000"
                      className="w-full px-3 py-3 bg-orange-50/30 border border-orange-100 rounded-xl text-2xl focus:outline-none focus:border-orange-500 text-center font-black tracking-[0.5em] text-slate-800"
                    />
                  </div>
                </motion.div>
              )}

              <div className="flex gap-2 pt-4 justify-between">
                {step > 0 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={loading}
                    onClick={() => setStep((s) => Math.max(s - 1, 0))}
                    className="rounded-xl text-xs font-bold text-slate-500 h-9 px-4 hover:bg-slate-50"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" /> Kembali
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={loading}
                    onClick={handleCloseModal}
                    className="rounded-xl text-xs font-bold text-slate-500 h-9 px-4 hover:bg-slate-50"
                  >
                    Batal
                  </Button>
                )}
                {step < 2 ? (
                  <Button
                    type="button"
                    disabled={loading}
                    onClick={handleNext}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs h-9 px-5 shadow-sm"
                  >
                    Seterusnya <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    disabled={loading}
                    onClick={handleRegisterChild}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs h-9 px-5 shadow-sm"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <CheckCircle2 className="w-4 h-4 mr-1.5" />}
                    Cipta Profil
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
