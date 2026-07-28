import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { useStudentData } from "@/hooks/useStudentData";
import { ACHIEVEMENT_TIERS, evaluateAchievements, buildStatsFromData } from "@/lib/achievements";

function FriendAvatar({ user, size = "w-20 h-20" }) {
  if (user?.profile_picture_url) {
    return (
      <img
        src={user.profile_picture_url}
        alt={user.nickname}
        className={`${size} rounded-full object-cover border-4 border-white shadow-lg`}
      />
    );
  }
  return (
    <div className={`${size} rounded-full bg-gradient-to-br from-orange-100 to-amber-100 border-4 border-white shadow-lg flex items-center justify-center text-4xl`}>
      {user?.avatar_emoji || "🧑"}
    </div>
  );
}

function StatPill({ icon, label, value }) {
  return (
    <div className="flex flex-col items-center bg-white/15 backdrop-blur-sm rounded-xl py-2 px-3">
      <span className="text-lg">{icon}</span>
      <span className="text-base font-black text-white leading-tight">{value}</span>
      <span className="text-[9px] text-orange-50 uppercase font-bold tracking-wide">{label}</span>
    </div>
  );
}

export default function FriendProfileModal({ friend, open, onOpenChange }) {
  const { studentId } = useStudentData();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    if (!open || !friend?.student_id) return;
    let cancelled = false;
    const fetchProfile = async () => {
      setLoading(true);
      setProfileData(null);
      try {
        const response = await base44.functions.invoke("manageFriends", {
          action: "view_profile",
          friend_id: friend.student_id,
          student_id: studentId,
        });
        const data = response?.data || response;
        if (data?.success && !cancelled) {
          setProfileData(data);
        } else {
          toast({ title: "Gagal", description: data?.error || "Tidak dapat memuatkan profil rakan.", variant: "destructive" });
        }
      } catch (err) {
        if (!cancelled) {
          toast({ title: "Gagal", description: "Ralat pelayan.", variant: "destructive" });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchProfile();
    return () => { cancelled = true; };
  }, [open, friend?.student_id, studentId, toast]);

  const stats = useMemo(() => buildStatsFromData(profileData), [profileData]);
  const evaluated = useMemo(() => evaluateAchievements(stats), [stats]);
  const earnedBadges = evaluated.filter(a => a.earned);
  const lockedBadges = evaluated.filter(a => !a.earned);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => onOpenChange(false)}
        >
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-stone-50 w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl max-h-[92vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => onOpenChange(false)}
              className="sticky top-2 float-right z-10 mr-2 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center text-stone-500 hover:bg-stone-100"
            >
              <X className="w-4 h-4" />
            </button>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
                <p className="mt-3 text-xs font-bold text-stone-500 uppercase tracking-wider">Memuat profil rakan...</p>
              </div>
            ) : profileData ? (
              <div className="pb-6">
                {/* Banner Header */}
                <div className="bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 px-6 pt-10 pb-6 rounded-t-3xl">
                  <div className="flex flex-col items-center text-center">
                    <FriendAvatar user={profileData.user} />
                    <h2 className="text-xl font-black text-white mt-3">{profileData.user?.nickname || "Pelajar"}</h2>
                    {profileData.user?.school_name && (
                      <p className="text-xs text-orange-50 font-medium mt-0.5">{profileData.user.school_name}</p>
                    )}
                    <p className="text-xs text-orange-100 mt-0.5">
                      {profileData.user?.school_year || ""}
                      {profileData.user?.state ? ` · ${profileData.user.state}` : ""}
                    </p>
                  </div>

                  {/* Stats Row */}
                  <div className="flex items-center justify-center gap-2.5 mt-4">
                    <StatPill icon="⭐" label="Tahap" value={profileData.progress?.level || 1} />
                    <StatPill icon="✨" label="XP" value={(profileData.progress?.total_xp || 0).toLocaleString()} />
                    <StatPill icon="🔥" label="Streak" value={profileData.progress?.streak_days || 0} />
                    <StatPill icon="💰" label="Syiling" value={profileData.wallet?.balance || 0} />
                  </div>
                </div>

                {/* Achievement Summary */}
                <div className="px-5 mt-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-black text-stone-800">Lencana Pencapaian</h3>
                    <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full">
                      {earnedBadges.length} / {evaluated.length}
                    </span>
                  </div>

                  {/* Earned Badges */}
                  {earnedBadges.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                      {earnedBadges.map((badge) => {
                        const tierStyle = ACHIEVEMENT_TIERS[badge.tier] || ACHIEVEMENT_TIERS.bronze;
                        return (
                          <div
                            key={badge.id}
                            className={`relative rounded-xl p-2.5 border-2 text-center bg-gradient-to-br ${tierStyle.bg} ${tierStyle.border} shadow-sm`}
                          >
                            <div className="text-2xl">{badge.icon}</div>
                            <p className="text-[9px] font-black text-stone-700 mt-1 leading-tight line-clamp-2">{badge.name}</p>
                            <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                              <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {earnedBadges.length === 0 && (
                    <div className="text-center py-6 bg-white rounded-2xl border border-stone-100">
                      <div className="text-3xl mb-1">🌱</div>
                      <p className="text-xs font-bold text-stone-400">Belum ada lencana lagi</p>
                    </div>
                  )}

                  {/* Locked Badges Preview */}
                  {lockedBadges.length > 0 && (
                    <div className="mt-4">
                      <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Lencana Belum Diperoleh</p>
                      <div className="flex flex-wrap gap-1.5">
                        {lockedBadges.slice(0, 16).map((badge) => (
                          <div
                            key={badge.id}
                            className="w-9 h-9 rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-300"
                            title={`${badge.name} — ${badge.description}`}
                          >
                            <span className="text-base opacity-40">🔒</span>
                          </div>
                        ))}
                        {lockedBadges.length > 16 && (
                          <div className="w-9 h-9 rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-center text-[9px] font-bold text-stone-400">
                            +{lockedBadges.length - 16}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="text-4xl mb-2">😕</div>
                <p className="text-sm font-bold text-stone-500">Profil tidak tersedia</p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}