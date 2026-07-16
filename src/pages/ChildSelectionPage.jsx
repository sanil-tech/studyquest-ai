import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import moment from "moment";
import {
  ArrowLeft, Coins, Flame, Zap, Star, Clock, UserPlus, Loader2, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { loadChildrenWithStats, getChildDisplayName, getChildAvatar, isAvatarUrl, setSelectedChildId } from "@/lib/childUtils";

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
  const avatar = getChildAvatar(child);
  const avatarIsUrl = isAvatarUrl(avatar);

  const currentXP = child.realProgress?.total_xp || 0;
  const currentLevel = child.realProgress?.level || 1;
  const streakDays = child.realProgress?.streak_days || 0;
  const coins = child.wallet?.balance || 0;

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
      {/* Decorative bubble */}
      <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
      <div className="absolute -bottom-8 -left-4 w-20 h-20 bg-white/5 rounded-full" />

      {/* Avatar */}
      <div className="relative z-10 flex flex-col items-center mb-3">
        <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30 shadow-lg overflow-hidden">
          {avatarIsUrl ? (
            <img src={avatar} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-4xl select-none">{avatar}</span>
          )}
        </div>
        {/* Level badge */}
        <div className="absolute -bottom-1 right-1/2 translate-x-1/2 bg-white text-slate-800 text-[10px] font-black px-2 py-0.5 rounded-full shadow-md flex items-center gap-0.5">
          <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" /> Tahap {currentLevel}
        </div>
      </div>

      {/* Nickname (large) */}
      <h3 className="relative z-10 text-center font-black text-lg tracking-tight truncate">
        {displayName}
      </h3>

      {/* Full name (secondary, optional) */}
      {child.full_name && child.full_name !== displayName && (
        <p className="relative z-10 text-center text-[10px] text-white/70 font-medium truncate">
          {child.full_name}
        </p>
      )}

      {/* Stats grid */}
      <div className="relative z-10 grid grid-cols-3 gap-1.5 mt-3">
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

      {/* Last active */}
      {lastActiveTime && (
        <div className="relative z-10 flex items-center justify-center gap-1 mt-2 text-[9px] text-white/60 font-medium">
          <Clock className="w-2.5 h-2.5" /> Aktif terakhir: {lastActiveTime}
        </div>
      )}

      {/* Select hint */}
      <div className="relative z-10 flex items-center justify-center gap-1 mt-2 text-[10px] font-black uppercase tracking-wider text-white/90 bg-white/10 rounded-full py-1 px-3 mx-auto w-fit">
        Pilih Profil <ChevronRight className="w-3 h-3" />
      </div>
    </motion.button>
  );
}

export default function ChildSelectionPage() {
  const navigate = useNavigate();
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);

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
    setSelectedChildId(child.id);
    navigate("/parent");
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
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link to="/parent" className="p-2.5 bg-white rounded-xl text-slate-600 shadow-sm hover:shadow-md transition-all active:scale-95">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">Pilih Profil Anak 👨‍👩‍👧‍👦</h1>
          <p className="text-xs text-slate-500">Pilih anak untuk lihat progres mereka.</p>
        </div>
      </div>

      {/* Children grid */}
      {children.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border-2 border-dashed border-slate-200">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <UserPlus className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-sm text-slate-500 font-medium mb-4">Tiada profil anak dijumpai.</p>
          <Button
            onClick={() => navigate("/parent")}
            className="bg-indigo-600 text-white rounded-xl font-bold text-xs px-6"
          >
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
    </div>
  );
}