import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Crown, Flame, Loader2, Trophy } from "lucide-react";
import { useStudentData } from "@/hooks/useStudentData";

const PODIUM_STYLES = [
  { gradient: "from-amber-300 via-yellow-400 to-amber-500", border: "border-amber-400", text: "text-amber-700", medal: "🥇", height: "h-32", order: "md:order-2" },
  { gradient: "from-slate-200 via-slate-300 to-slate-400", border: "border-slate-400", text: "text-slate-700", medal: "🥈", height: "h-24", order: "md:order-1" },
  { gradient: "from-orange-300 via-amber-400 to-orange-500", border: "border-orange-400", text: "text-orange-700", medal: "🥉", height: "h-20", order: "md:order-3" },
];

function AvatarBubble({ entry, size = "w-14 h-14" }) {
  if (entry.profile_picture_url) {
    return (
      <img src={entry.profile_picture_url} alt={entry.name} className={`${size} rounded-full object-cover border-4 border-white shadow-md`} />
    );
  }
  return (
    <div className={`${size} rounded-full bg-gradient-to-br from-orange-100 to-amber-100 border-4 border-white shadow-md flex items-center justify-center text-2xl`}>
      {entry.avatar_emoji || "🧑"}
    </div>
  );
}

const SCOPES = [
  { id: "global", label: "Global", emoji: "🌍" },
  { id: "friends", label: "Rakan", emoji: "👥" },
  { id: "school", label: "Sekolah", emoji: "🏫" },
  { id: "district", label: "Kawasan", emoji: "📍" },
  { id: "state", label: "Negeri", emoji: "🗺️" },
];

const SCOPE_LABELS = {
  global: "Global",
  friends: "Rakan",
  school: "Sekolah",
  district: "Kawasan",
  state: "Negeri",
};

function LeaderboardRow({ entry, isMe, showStreak }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${
        isMe ? "bg-gradient-to-r from-emerald-500 to-teal-500 border-2 border-emerald-400 shadow-lg" : "bg-white border border-stone-100 hover:shadow-sm"
      }`}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${
        isMe ? "bg-white/20 text-white" : entry.rank <= 3 ? "bg-amber-100 text-amber-700" : "bg-stone-100 text-stone-500"
      }`}>
        {entry.rank}
      </div>
      <AvatarBubble entry={entry} size="w-10 h-10" />
      <div className="flex-1 min-w-0">
        <p className={`font-bold truncate text-sm ${isMe ? "text-white" : "text-stone-800"}`}>
          {entry.name} {isMe && <span className="text-emerald-50 text-xs">(Anda)</span>}
        </p>
        <p className={`text-xs ${isMe ? "text-emerald-50" : "text-stone-400"}`}>
          Tahap {entry.level}{showStreak ? ` · ${entry.streak_days} hari 🔥` : ""}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className={`font-black text-sm ${isMe ? "text-white" : "text-orange-600"}`}>
          {showStreak ? `${entry.streak_days} hari` : entry.total_xp.toLocaleString()}
        </p>
        <p className={`text-[10px] uppercase font-bold ${isMe ? "text-emerald-50" : "text-stone-400"}`}>
          {showStreak ? "Streak" : "XP"}
        </p>
      </div>
    </motion.div>
  );
}

export default function Leaderboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("xp");
  const [scope, setScope] = useState("global");
  const { studentId } = useStudentData();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const response = await base44.functions.invoke("fetchLeaderboard", { scope, student_id: studentId });
        setData(response?.data || response);
      } catch (err) {
        console.error("Leaderboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [scope, studentId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
        <p className="mt-3 text-xs font-bold text-stone-500 uppercase tracking-wider">Memuat carta juara...</p>
      </div>
    );
  }

  const board = tab === "xp" ? data?.leaderboard : data?.streakboard;
  const myId = studentId || data?.my_entry?.student_id;
  const filterInfo = data?.filter_info || {};
  const hasScopeData = scope === "school" ? !!filterInfo.school
    : scope === "state" ? !!filterInfo.state
    : scope === "district" ? !!filterInfo.district
    : true;
  const top10 = (board || []).slice(0, 10);
  const myEntryInTop10 = top10.some(e => e.student_id === myId);

  return (
    <div className="space-y-6 pb-4">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-orange-100 px-4 py-2 rounded-full mb-3">
          <Crown className="w-5 h-5 text-orange-600" />
          <span className="font-black text-orange-700 text-sm uppercase tracking-wide">Carta Juara</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-stone-800">Siapa Juara Hutan Ilmu?</h1>
        <p className="text-sm text-stone-500 mt-1">Bandingkan kemajuan kamu dengan rakan-rakan lain!</p>
      </div>

      {/* Scope Selector */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {SCOPES.map(s => (
          <button
            key={s.id}
            onClick={() => setScope(s.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-xs whitespace-nowrap transition-all shrink-0 ${
              scope === s.id ? "bg-indigo-500 text-white shadow-md" : "bg-white text-stone-500 border border-stone-200 hover:bg-stone-50"
            }`}
          >
            <span>{s.emoji}</span> {s.label}
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white p-1.5 rounded-2xl border border-stone-200 shadow-sm">
        <button
          onClick={() => setTab("xp")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all ${
            tab === "xp" ? "bg-orange-500 text-white shadow-md" : "text-stone-500 hover:bg-stone-50"
          }`}
        >
          <Trophy className="w-4 h-4" /> Carta XP
        </button>
        <button
          onClick={() => setTab("streak")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all ${
            tab === "streak" ? "bg-orange-500 text-white shadow-md" : "text-stone-500 hover:bg-stone-50"
          }`}
        >
          <Flame className="w-4 h-4" /> Carta Streak
        </button>
      </div>

      {(!board || board.length === 0) ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">{scope === "global" ? "🌱" : "📋"}</div>
          <p className="font-bold text-stone-500">
            {scope === "global"
              ? "Belum ada juara lagi. Jadilah yang pertama!"
              : scope === "friends"
              ? "Tambah rakan untuk lihat kedudukan kamu di kalangan rakan-rakan!"
              : !hasScopeData
              ? "Lengkapkan profil sekolah dan lokasi kamu untuk lihat carta ini!"
              : "Tiada pelajar lain dalam kategori ini lagi."}
          </p>
        </div>
      ) : (
        <>
          {/* Top 10 Standard List */}
          <div className="space-y-2">
            {top10.map(entry => (
              <LeaderboardRow key={entry.student_id} entry={entry} isMe={entry.student_id === myId} showStreak={tab === "streak"} />
            ))}
          </div>

          {/* Floating My Rank Card — only if outside top 10 */}
          {data?.my_entry && !myEntryInTop10 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl p-5 text-white shadow-lg flex items-center gap-4 mt-2"
            >
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center font-black text-xl">
                #{data.my_entry.rank}
              </div>
              <div className="flex-1">
                <p className="font-black text-lg">{data.my_entry.name}</p>
                <p className="text-emerald-50 text-sm">
                  Tahap {data.my_entry.level} · {tab === "streak" ? `${data.my_entry.streak_days} hari 🔥` : `${data.my_entry.total_xp.toLocaleString()} XP`}
                </p>
              </div>
              <div className="text-right">
                <p className="font-black text-2xl">
                  {tab === "streak" ? `${data.my_entry.streak_days} hari` : data.my_entry.total_xp.toLocaleString()}
                </p>
                <p className="text-emerald-50 text-xs uppercase font-bold">
                  {tab === "streak" ? "Streak Kamu" : "XP Kamu"}
                </p>
              </div>
            </motion.div>
          )}

          {/* Total count */}
          <p className="text-center text-xs text-stone-400 font-bold pt-2">
            {data?.total_students || board.length} pelajar{scope !== "global" ? ` dalam ${SCOPE_LABELS[scope] || scope}` : ""} dalam carta
          </p>
        </>
      )}
    </div>
  );
}