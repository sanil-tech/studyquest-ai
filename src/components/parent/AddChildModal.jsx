// src/components/parent/AddChildModal.jsx
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, UserPlus, Sparkles, Key, GraduationCap, Check, Info } from "lucide-react";

// Grade options matching StudyQuest standards
const GRADE_OPTIONS = [
  "Tahun 1", "Tahun 2", "Tahun 3", "Tahun 4", "Tahun 5", "Tahun 6",
  "Tingkatan 1", "Tingkatan 2", "Tingkatan 3", "Tingkatan 4", "Tingkatan 5"
];

// Preset avatar collection
const AVATAR_OPTIONS = [
  { id: "dino", label: "Dino 🦖", emoji: "🦖" },
  { id: "happy", label: "Ceria 😊", emoji: "😊" },
  { id: "robot", label: "Robot 🤖", emoji: "🤖" },
  { id: "star", label: "Bintang ⭐", emoji: "⭐" },
  { id: "cat", label: "Kucing 🐱", emoji: "🐱" },
  { id: "hero", label: "Wira 🦸", emoji: "🦸" }
];

/**
 * AddChildModal Component
 * 
 * @param {boolean} open - Controls dialog visibility
 * @param {function} onOpenChange - Callback when dialog state changes
 * @param {function} onChildAdded - Callback triggered after successful creation
 */
export default function AddChildModal({ open, onOpenChange, onChildAdded }) {
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    nickname: "",
    fullName: "",
    grade: "Tahun 1",
    pin: "",
    selectedAvatar: "🦖"
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errorMessage) setErrorMessage("");
  };

  const resetForm = () => {
    setFormData({
      nickname: "",
      fullName: "",
      grade: "Tahun 1",
      pin: "",
      selectedAvatar: "🦖"
    });
    setErrorMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Client-side Form Validation
    const cleanNickname = formData.nickname.trim();
    const cleanPin = formData.pin.trim();

    if (!cleanNickname) {
      setErrorMessage("Sila masukkan nama panggilan anak.");
      return;
    }

    if (!cleanPin || cleanPin.length !== 4 || !/^\d{4}$/.test(cleanPin)) {
      setErrorMessage("PIN mestilah tepat 4 digit nombor.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      // 2. Invoke backend Edge Function
      const response = await base44.functions.invoke("createChildAccount", {
        nickname: cleanNickname,
        fullName: formData.fullName.trim() || cleanNickname,
        grade: formData.grade,
        pin: cleanPin,
        selectedAvatar: formData.selectedAvatar
      });

      // Safely extract payload
      const result = response?.data || response;

      if (!result || result.success === false) {
        throw new Error(result?.error || "Gagal mencatatkan profil anak.");
      }

      // Safe Property Extraction (Prevents Cannot read properties of undefined)
      const student = result?.student || {};
      const assignedUsername = student?.username || "Akaun Baharu";

      // 3. Success Notification
      toast({
        title: "Akaun Anak Dicipta! 🎉",
        description: `Profil untuk ${cleanNickname} (ID: ${assignedUsername}) telah berjaya didaftarkan.`,
      });

      resetForm();
      onOpenChange(false);

      if (onChildAdded) {
        onChildAdded(student);
      }

    } catch (err) {
      console.error("AddChildModal Error:", err);
      setErrorMessage(err.message || "Pendaftaran gagal. Sila cuba lagi.");
      toast({
        title: "Pendaftaran Gagal 🛑",
        description: err.message || "Ralat pelayan tidak dijangka.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!loading) { resetForm(); onOpenChange(val); } }}>
      <DialogContent className="sm:max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 font-sans">
        
        {/* HEADER SECTION */}
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-indigo-600" /> Tambah Profil Anak Baharu
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 font-medium">
            Sediakan profil pembelajaran dan PIN log masuk 4-digit untuk anak anda.
          </DialogDescription>
        </DialogHeader>

        {/* FORM BODY */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          
          {/* ERROR ALERT BOX */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs font-bold text-red-600 animate-fadeIn">
              ⚠️ {errorMessage}
            </div>
          )}

          {/* AVATAR SELECTOR */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Pilih Avatar
            </Label>
            <div className="grid grid-cols-6 gap-2">
              {AVATAR_OPTIONS.map((item) => {
                const isSelected = formData.selectedAvatar === item.emoji;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleInputChange("selectedAvatar", item.emoji)}
                    className={`aspect-square rounded-2xl border-2 flex items-center justify-center text-xl transition-all relative bg-slate-50 ${
                      isSelected ? "border-indigo-600 bg-indigo-50/50 scale-105 shadow-sm" : "border-slate-100 hover:border-slate-200"
                    }`}
                  >
                    <span>{item.emoji}</span>
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 bg-indigo-600 text-white rounded-full p-0.5">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="flex items-start gap-1.5 mt-1.5 p-2 bg-amber-50/60 border border-amber-100 rounded-xl">
              <Info className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-600 font-medium leading-relaxed">
                Avatar ini adalah sementara — anak anda boleh menukarnanya kemudian dari profil mereka.
              </p>
            </div>
          </div>

          {/* NICKNAME FIELD */}
          <div className="space-y-1">
            <Label htmlFor="nickname" className="text-xs font-bold text-slate-700">
              Nama Panggilan <span className="text-red-500">*</span>
            </Label>
            <Input
              id="nickname"
              placeholder="Contoh: Adam, Sarah"
              value={formData.nickname}
              onChange={(e) => handleInputChange("nickname", e.target.value)}
              className="rounded-xl border-slate-200 font-medium text-xs h-10 focus:ring-indigo-500"
              disabled={loading}
              required
            />
          </div>

          {/* FULL NAME FIELD (OPTIONAL) */}
          <div className="space-y-1">
            <Label htmlFor="fullName" className="text-xs font-bold text-slate-700">
              Nama Penuh (Pilihan)
            </Label>
            <Input
              id="fullName"
              placeholder="Contoh: Muhammad Adam Bin Ahmad"
              value={formData.fullName}
              onChange={(e) => handleInputChange("fullName", e.target.value)}
              className="rounded-xl border-slate-200 font-medium text-xs h-10 focus:ring-indigo-500"
              disabled={loading}
            />
          </div>

          {/* GRADE SELECTOR FIELD */}
          <div className="space-y-1">
            <Label htmlFor="grade" className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5 text-amber-500" /> Tahap Persekolahan
            </Label>
            <select
              id="grade"
              value={formData.grade}
              onChange={(e) => handleInputChange("grade", e.target.value)}
              disabled={loading}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 font-bold text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {GRADE_OPTIONS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* PIN FIELD */}
          <div className="space-y-1">
            <Label htmlFor="pin" className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <Key className="w-3.5 h-3.5 text-indigo-600" /> PIN Log Masuk 4-Digit <span className="text-red-500">*</span>
            </Label>
            <Input
              id="pin"
              type="password"
              maxLength={4}
              placeholder="••••"
              value={formData.pin}
              onChange={(e) => handleInputChange("pin", e.target.value.replace(/\D/g, ""))}
              className="rounded-xl border-slate-200 font-mono font-bold text-center tracking-widest text-sm h-10 focus:ring-indigo-500"
              disabled={loading}
              required
            />
            <p className="text-[10px] text-slate-400 font-medium">
              PIN ini digunakan oleh anak untuk log masuk di akaun mereka.
            </p>
          </div>

          {/* FOOTER ACTIONS */}
          <DialogFooter className="pt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="rounded-xl text-xs font-bold border-slate-200 h-10 px-4"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white h-10 px-5 shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> Mendaftarkan...
                </>
              ) : (
                "Daftar Anak"
              )}
            </Button>
          </DialogFooter>

        </form>
      </DialogContent>
    </Dialog>
  );
}