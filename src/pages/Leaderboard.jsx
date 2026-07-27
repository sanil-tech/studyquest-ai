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

function LeaderboardRow({ entry, isMe }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${
        isMe ? "bg-emerald-50 border-2 border-emerald-300 shadow-sm" : "bg-white border border-stone-100 hover:shadow-sm"
      }`}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${
        entry.rank <= 3 ? "bg-amber-100 text-amber-700" : "bg-stone-100 text-stone-500"
      }`}>
        {entry.rank}
      </div>
      <AvatarBubble entry={entry} size="w-10 h-10" />
      <div className="flex-1 min-w-0">
        <p className="font-bold text-stone-800 truncate text-sm">
          {entry.name} {isMe && <span className="text-emerald-600 text-xs">(Anda)</span>}
        </p>
        <p className="text-xs text-stone-400">Tahap {entry.level}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="font-black text-orange-600 text-sm">{entry.total_xp.toLocaleString()}</p>
        <p className="text-[10px] text-stone-400 uppercase font-bold">XP</p>
      </div>
    </motion.div>
  );
}

export default function Leaderboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("xp");
  const { studentId } = useStudentData();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await base44.functions.invoke("fetchLeaderboard", {});
        setData(response?.data || response);
      } catch (err) {
        console.error("Leaderboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

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
  const top3 = (board || []).slice(0, 3);
  const rest = (board || []).slice(3);

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

      {/* My Rank Card */}
      {data?.my_entry && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl p-5 text-white shadow-lg flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center font-black text-xl">
            #{data.my_entry.rank}
          </div>
          <div className="flex-1">
            <p className="font-black text-lg">{data.my_entry.name}</p>
            <p className="text-emerald-50 text-sm">Tahap {data.my_entry.level} · {data.my_entry.streak_days} hari streak 🔥</p>
          </div>
          <div className="text-right">
            <p className="font-black text-2xl">{data.my_entry.total_xp.toLocaleString()}</p>
            <p className="text-emerald-50 text-xs uppercase font-bold">XP Kamu</p>
          </div>
        </motion.div>
      )}

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
          <div className="text-5xl mb-3">🌱</div>
          <p className="font-bold text-stone-500">Belum ada juara lagi. Jadilah yang pertama!</p>
        </div>
      ) : (
        <>
          {/* Podium */}
          {top3.length >= 3 && (
            <div className="flex items-end justify-center gap-2 md:gap-4 mb-4">
              {top3.map((entry, idx) => {
                const style = PODIUM_STYLES[idx];
                const isMe = entry.student_id === myId;
                return (
                  <motion.div
                    key={entry.student_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.15 }}
                    className={`flex flex-col items-center ${style.order} flex-1 max-w-[140px]`}
                  >
                    <div className="text-3xl mb-1">{style.medal}</div>
                    <AvatarBubble entry={entry} />
                    <p className={`font-black text-sm mt-2 text-center truncate w-full ${isMe ? "text-emerald-600" : "text-stone-700"}`}>
                      {entry.name}
                    </p>
                    <p className={`text-xs font-bold ${style.text}`}>
                      {tab === "xp" ? `${entry.total_xp.toLocaleString()} XP` : `${entry.streak_days} hari 🔥`}
                    </p>
                    <div className={`bg-gradient-to-t ${style.gradient} ${style.height} w-full rounded-t-2xl mt-2 border-t-4 ${style.border} flex items-center justify-center`}>
                      <span className="text-2xl font-black text-white drop-shadow">{entry.rank}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Remaining entries */}
          <div className="space-y-2">
            {rest.map(entry => (
              <LeaderboardRow key={entry.student_id} entry={entry} isMe={entry.student_id === myId} />
            ))}
          </div>

          {/* Total count */}
          <p className="text-center text-xs text-stone-400 font-bold pt-2">
            {data?.total_students || board.length} pelajar dalam carta
          </p>
        </>
      )}
    </div>
  );
}