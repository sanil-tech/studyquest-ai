import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import moment from "moment";
import {
  ArrowLeft, Coins, Flame, Zap, Star, Clock, UserPlus, Loader2, ChevronRight,
  KeyRound, ShieldCheck, BookOpen, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { loadChildrenWithStats, getChildDisplayName, setSelectedChildId } from "@/lib/childUtils";
import AvatarDisplay from "@/components/avatar/AvatarDisplay";
import { getStageProgress } from "@/lib/avatarSystem";

const CARD_GRADIENTS = [
  "from-violet-500 via-purple-500 to-fuchsia-500",
  "from-sky-500 via-blue-500 to-indigo-500",
  "from-emerald-500 via-teal-500 to-cyan-500",
  "from-amber-500 via-orange-500 to-red-500",
  "from-pink-500 via-rose-500 to-red-400",
  "from-lime-500 via-green-500 to-emerald-500",
];

function ChildSelectionCard({ child, gradient, onSelect, index }) {
  const displayName = getChildDisplayName(child);
  const currentXP = child.realProgress?.total_xp || 0;
  const currentLevel = child.realProgress?.level || 1;
  const streakDays = child.realProgress?.streak_days || 0;
  const coins = child.wallet?.balance || 0;
  const currentMission = child.latestSession?.topic_name || "Misi Belum Mula";
  const stageProgress = getStageProgress(currentXP);

  const lastActiveTime = child.realProgress?.last_study_date
    ? moment(child.realProgress.last_study_date).format("DD/MM/YYYY")
    : null;

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      onClick={() => onSelect(child)}
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${gradient} p-5 text-white text-left shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.99] transition-all border-4 border-white/20`}
    >
      <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
      <div className="absolute -bottom-8 -left-4 w-20 h-20 bg-white/5 rounded-full" />

      {/* Avatar with evolution stage */}
      <div className="relative z-10 flex flex-col items-center mb-3">
        <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-1 border-2 border-white/30 shadow-lg">
          <AvatarDisplay xp={currentXP} size="md" variant="plain" />
        </div>
        <div className="absolute -bottom-1 right-1/2 translate-x-1/2 bg-white text-slate-800 text-[10px] font-black px-2 py-0.5 rounded-full shadow-md flex items-center gap-0.5">
          <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" /> Tahap {currentLevel}
        </div>
      </div>

      <h3 className="relative z-10 text-center font-black text-lg tracking-tight truncate">{displayName}</h3>

      {child.full_name && child.full_name !== displayName && (
        <p className="relative z-10 text-center text-[10px] text-white/70 font-medium truncate">{child.full_name}</p>
      )}

      {/* Current mission */}
      <div className="relative z-10 bg-white/10 rounded-xl px-2 py-1.5 mt-2 flex items-center gap-1.5">
        <BookOpen className="w-3 h-3 shrink-0 text-white/80" />
        <p className="text-[9px] font-bold truncate">{currentMission}</p>
      </div>

      {/* Evolution progress */}
      <div className="relative z-10 mt-2">
        <div className="flex justify-between items-center text-[8px] font-bold text-white/80 mb-0.5">
          <span>{stageProgress.currentStage.name}</span>
          <span>{stageProgress.isMaxStage ? "MAX" : `${stageProgress.percent}%`}</span>
        </div>
        <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-white/60 rounded-full" style={{ width: `${stageProgress.percent}%` }} />
        </div>
      </div>

      {/* Stats grid */}
      <div className="relative z-10 grid grid-cols-3 gap-1.5 mt-2.5">
        <div className="bg-white/15 backdrop-blur-sm rounded-xl p-1.5 text-center">
          <Zap className="w-3.5 h-3.5 mx-auto text-yellow-200" />
          <p className="text-[8px] font-bold uppercase mt-0.5 opacity-80">XP</p>
          <p className="text-xs font-black">{currentXP}</p>
        </div>
        <div className="bg-white/15 backdrop-blur-sm rounded-xl p-1.5 text-center">
          <Coins className="w-3.5 h-3.5 mx-auto text-amber-200" />
          <p className="text-[8px] font-bold uppercase mt-0.5 opacity-80">Koin</p>
          <p className="text-xs font-black">{coins}</p>
        </div>
        <div className="bg-white/15 backdrop-blur-sm rounded-xl p-1.5 text-center">
          <Flame className="w-3.5 h-3.5 mx-auto text-orange-200" />
          <p className="text-[8px] font-bold uppercase mt-0.5 opacity-80">Streak</p>
          <p className="text-xs font-black">{streakDays}</p>
        </div>
      </div>

      {lastActiveTime && (
        <div className="relative z-10 flex items-center justify-center gap-1 mt-2 text-[9px] text-white/60 font-medium">
          <Clock className="w-2.5 h-2.5" /> Aktif: {lastActiveTime}
        </div>
      )}

      <div className="relative z-10 flex items-center justify-center gap-1 mt-2 text-[10px] font-black uppercase tracking-wider text-white/90 bg-white/10 rounded-full py-1 px-3 mx-auto w-fit">
        Pilih Profil <ChevronRight className="w-3 h-3" />
      </div>
    </motion.button>
  );
}

function PinEntryDialog({ child, open, onOpenChange, onSuccess }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const displayName = getChildDisplayName(child);
  const currentXP = child?.realProgress?.total_xp || 0;

  const handleVerify = () => {
    setError("");
    const childPin = child?.pin_hash;
    if (!childPin) {
      setError("PIN tidak tersedia. Sila guna kelulusan Ibu Bapa.");
      return;
    }
    if (pin === childPin) {
      onSuccess();
    } else {
      setError("PIN salah. Cuba lagi.");
      setPin("");
    }
  };

  const handleParentApprove = () => {
    onSuccess();
  };

  const handleClose = () => {
    setPin("");
    setError("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-sm rounded-3xl bg-white p-6 border-slate-100 shadow-xl overflow-hidden">
        <button onClick={handleClose} className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-slate-100 transition-colors">
          <X className="w-4 h-4 text-slate-400" />
        </button>

        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <AvatarDisplay xp={currentXP} size="lg" showStage />
          </div>

          <div>
            <h3 className="text-lg font-black text-slate-800">Hai, {displayName}! 🦧</h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Masukkan PIN anda untuk mula belajar</p>
          </div>

          {error && (
            <div className="p-2.5 rounded-xl bg-red-50 text-red-600 text-xs font-bold border border-red-100">
              ⚠️ {error}
            </div>
          )}

          <div className="space-y-1">
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input
                type="password"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                placeholder="••••"
                autoFocus
                className="w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-100 rounded-xl text-lg text-center tracking-[0.4em] font-black text-slate-700 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <Button
              onClick={handleVerify}
              disabled={pin.length < 4}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs h-11 shadow-sm disabled:opacity-40"
            >
              Mula Belajar ✨
            </Button>

            <div className="flex items-center gap-2 py-1">
              <div className="flex-1 h-px bg-slate-100" />
              <span className="text-[9px] text-slate-300 font-bold uppercase">atau</span>
              <div className="flex-1 h-px bg-slate-100" />
            </div>

            <Button
              onClick={handleParentApprove}
              variant="outline"
              className="w-full border-emerald-200 text-emerald-600 hover:bg-emerald-50 rounded-xl font-bold text-xs h-10"
            >
              <ShieldCheck className="w-3.5 h-3.5 mr-1.5" /> Ibu Bapa Luluskan
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ChildSelectionPage() {
  const navigate = useNavigate();
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState(null);
  const [pinDialogOpen, setPinDialogOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const kids = await loadChildrenWithStats();
        setChildren(kids);
      } catch (err) {
        console.error("Gagal memuatkan senarai anak:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSelectChild = (child) => {
    setSelectedChild(child);
    setPinDialogOpen(true);
  };

  const handlePinSuccess = () => {
    if (!selectedChild) return;
    setSelectedChildId(selectedChild.id);
    localStorage.setItem("active_child_session", selectedChild.id);
    setPinDialogOpen(false);
    navigate("/dashboard");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 min-h-screen">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-purple-50 to-pink-50 px-4 py-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/parent" className="p-2.5 bg-white rounded-xl text-slate-600 shadow-sm hover:shadow-md transition-all active:scale-95">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">Pilih Profil Anak 👨‍👩‍👧‍👦</h1>
          <p className="text-xs text-slate-500">Pilih anak untuk mula belajar.</p>
        </div>
      </div>

      {children.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border-2 border-dashed border-slate-200">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <UserPlus className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-sm text-slate-500 font-medium mb-4">Tiada profil anak dijumpai.</p>
          <Button onClick={() => navigate("/parent")} className="bg-indigo-600 text-white rounded-xl font-bold text-xs px-6">
            Kembali ke Dashboard
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {children.map((child, index) => (
            <ChildSelectionCard
              key={child.id}
              child={child}
              gradient={CARD_GRADIENTS[index % CARD_GRADIENTS.length]}
              onSelect={handleSelectChild}
              index={index}
            />
          ))}
        </div>
      )}

      <AnimatePresence>
        {pinDialogOpen && selectedChild && (
          <PinEntryDialog
            child={selectedChild}
            open={pinDialogOpen}
            onOpenChange={setPinDialogOpen}
            onSuccess={handlePinSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  );
}