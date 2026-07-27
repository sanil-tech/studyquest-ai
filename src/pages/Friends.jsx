import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Search, UserPlus, Check, X, Loader2, Users, UserMinus, Clock, Inbox } from "lucide-react";
import { useStudentData } from "@/hooks/useStudentData";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";

function AvatarBubble({ entry, size = "w-12 h-12" }) {
  if (entry.profile_picture_url) {
    return <img src={entry.profile_picture_url} alt={entry.nickname} className={`${size} rounded-full object-cover border-2 border-white shadow`} />;
  }
  return (
    <div className={`${size} rounded-full bg-gradient-to-br from-orange-100 to-amber-100 border-2 border-white shadow flex items-center justify-center text-xl`}>
      {entry.avatar_emoji || "🧑"}
    </div>
  );
}

export default function Friends() {
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [friends, setFriends] = useState([]);
  const [pendingIncoming, setPendingIncoming] = useState([]);
  const [pendingOutgoing, setPendingOutgoing] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [tab, setTab] = useState("friends");
  const { studentId } = useStudentData();
  const { toast } = useToast();

  const loadFriends = useCallback(async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke("manageFriends", { action: "list", student_id: studentId });
      const data = response?.data || response;
      if (data?.success) {
        setFriends(data.friends || []);
        setPendingIncoming(data.pendingIncoming || []);
        setPendingOutgoing(data.pendingOutgoing || []);
      }
    } catch (err) {
      console.error("Load friends error:", err);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim() || searchQuery.trim().length < 2) return;
    setSearching(true);
    setHasSearched(true);
    try {
      const response = await base44.functions.invoke("manageFriends", { action: "search", query: searchQuery, student_id: studentId });
      const data = response?.data || response;
      if (data?.success) {
        setSearchResults(data.results || []);
      }
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async (addresseeId) => {
    setActionLoading(true);
    try {
      const response = await base44.functions.invoke("manageFriends", { action: "send_request", addressee_id: addresseeId, student_id: studentId });
      const data = response?.data || response;
      if (data?.success) {
        toast({ title: "Permintaan dihantar! ✉️", description: data.message });
        setSearchResults([]);
        setSearchQuery("");
        setHasSearched(false);
        loadFriends();
      } else {
        toast({ title: "Gagal", description: data?.error || "Ralat berlaku.", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Gagal", description: "Ralat pelayan.", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAccept = async (friendshipId) => {
    setActionLoading(true);
    try {
      const response = await base44.functions.invoke("manageFriends", { action: "accept", friendship_id: friendshipId, student_id: studentId });
      const data = response?.data || response;
      if (data?.success) {
        toast({ title: "Rakan diterima! 🎉", description: data.message });
        loadFriends();
      }
    } catch (err) {
      toast({ title: "Gagal", description: "Ralat pelayan.", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecline = async (friendshipId) => {
    setActionLoading(true);
    try {
      const response = await base44.functions.invoke("manageFriends", { action: "decline", friendship_id: friendshipId, student_id: studentId });
      const data = response?.data || response;
      if (data?.success) {
        toast({ title: "Permintaan ditolak", description: data.message });
        loadFriends();
      }
    } catch (err) {
      toast({ title: "Gagal", description: "Ralat pelayan.", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemove = async (friendshipId) => {
    setActionLoading(true);
    try {
      const response = await base44.functions.invoke("manageFriends", { action: "remove", friendship_id: friendshipId, student_id: studentId });
      const data = response?.data || response;
      if (data?.success) {
        toast({ title: "Rakan dibuang", description: data.message });
        loadFriends();
      }
    } catch (err) {
      toast({ title: "Gagal", description: "Ralat pelayan.", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <p className="mt-3 text-xs font-bold text-stone-500 uppercase tracking-wider">Memuat rakan...</p>
      </div>
    );
  }

  const pendingCount = pendingIncoming.length;

  return (
    <div className="space-y-6 pb-4">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-100 px-4 py-2 rounded-full mb-3">
          <Users className="w-5 h-5 text-indigo-600" />
          <span className="font-black text-indigo-700 text-sm uppercase tracking-wide">Rakan</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-stone-800">Cari & Tambah Rakan</h1>
        <p className="text-sm text-stone-500 mt-1">Tambah rakan yang menggunakan StudyQuest!</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama panggilan, username, atau ID pelajar..."
            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-stone-200 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <Button type="submit" disabled={searching || searchQuery.trim().length < 2} className="bg-indigo-500 hover:bg-indigo-600 rounded-2xl px-6">
          {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </Button>
      </form>

      {searchResults.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-black text-stone-400 uppercase tracking-wider px-1">Hasil Carian</p>
          {searchResults.map(r => {
            const alreadyFriend = friends.some(f => f.student_id === r.id);
            const alreadyRequested = pendingOutgoing.some(f => f.student_id === r.id);
            const incomingRequest = pendingIncoming.some(f => f.student_id === r.id);
            return (
              <motion.div key={r.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 p-3 bg-white border border-stone-100 rounded-2xl">
                <AvatarBubble entry={r} size="w-10 h-10" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-stone-800 truncate text-sm">{r.nickname}</p>
                  <p className="text-xs text-stone-400 truncate">
                    {r.username ? `@${r.username}` : r.student_id_code || ""}
                    {r.school_name ? ` · ${r.school_name}` : ""}
                  </p>
                </div>
                {alreadyFriend ? (
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">Rakan ✓</span>
                ) : incomingRequest ? (
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full">Terima dulu</span>
                ) : alreadyRequested ? (
                  <span className="text-xs font-bold text-stone-400 bg-stone-50 px-3 py-1.5 rounded-full">Menunggu</span>
                ) : (
                  <Button size="sm" onClick={() => handleSendRequest(r.id)} disabled={actionLoading} className="bg-indigo-500 hover:bg-indigo-600 rounded-xl text-xs">
                    <UserPlus className="w-3.5 h-3.5" /> Tambah
                  </Button>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {hasSearched && searchResults.length === 0 && !searching && (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🔍</div>
          <p className="font-bold text-stone-400 text-sm">Tiada pelajar dijumpai. Cuba nama lain!</p>
        </div>
      )}

      <div className="flex gap-2 bg-white p-1.5 rounded-2xl border border-stone-200 shadow-sm">
        <button onClick={() => setTab("friends")} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all ${tab === "friends" ? "bg-indigo-500 text-white shadow-md" : "text-stone-500 hover:bg-stone-50"}`}>
          <Users className="w-4 h-4" /> Rakan ({friends.length})
        </button>
        <button onClick={() => setTab("requests")} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all ${tab === "requests" ? "bg-indigo-500 text-white shadow-md" : "text-stone-500 hover:bg-stone-50"}`}>
          <Inbox className="w-4 h-4" /> Permintaan {pendingCount > 0 && <span className="bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">{pendingCount}</span>}
        </button>
      </div>

      {tab === "friends" ? (
        friends.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">🤝</div>
            <p className="font-bold text-stone-500">Belum ada rakan lagi.</p>
            <p className="text-xs text-stone-400 mt-1">Cari rakan di atas untuk mula menambah!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {friends.map(f => (
              <motion.div key={f.friendship_id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 p-3 bg-white border border-stone-100 rounded-2xl">
                <AvatarBubble entry={f} size="w-10 h-10" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-stone-800 truncate text-sm">{f.nickname}</p>
                  <p className="text-xs text-emerald-500">Rakan ✓</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => handleRemove(f.friendship_id)} disabled={actionLoading} className="text-red-400 hover:bg-red-50 hover:text-red-600 rounded-xl">
                  <UserMinus className="w-4 h-4" />
                </Button>
              </motion.div>
            ))}
          </div>
        )
      ) : (
        <div className="space-y-4">
          {pendingIncoming.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-black text-stone-400 uppercase tracking-wider px-1">Permintaan Masuk</p>
              {pendingIncoming.map(f => (
                <motion.div key={f.friendship_id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 p-3 bg-indigo-50 border border-indigo-200 rounded-2xl">
                  <AvatarBubble entry={f} size="w-10 h-10" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-stone-800 truncate text-sm">{f.nickname}</p>
                    <p className="text-xs text-indigo-500">Ingin menjadi rakan kamu</p>
                  </div>
                  <div className="flex gap-1.5">
                    <Button size="sm" onClick={() => handleAccept(f.friendship_id)} disabled={actionLoading} className="bg-emerald-500 hover:bg-emerald-600 rounded-xl text-xs px-3">
                      <Check className="w-3.5 h-3.5" /> Terima
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDecline(f.friendship_id)} disabled={actionLoading} className="text-red-400 hover:bg-red-50 hover:text-red-600 rounded-xl px-2.5">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {pendingOutgoing.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-black text-stone-400 uppercase tracking-wider px-1">Menunggu Jawapan</p>
              {pendingOutgoing.map(f => (
                <motion.div key={f.friendship_id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 p-3 bg-white border border-stone-100 rounded-2xl">
                  <AvatarBubble entry={f} size="w-10 h-10" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-stone-800 truncate text-sm">{f.nickname}</p>
                    <p className="text-xs text-stone-400 flex items-center gap-1"><Clock className="w-3 h-3" /> Menunggu jawapan</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => handleRemove(f.friendship_id)} disabled={actionLoading} className="text-stone-400 hover:bg-stone-50 rounded-xl text-xs">
                    Batal
                  </Button>
                </motion.div>
              ))}
            </div>
          )}

          {pendingIncoming.length === 0 && pendingOutgoing.length === 0 && (
            <div className="text-center py-16">
              <div className="text-5xl mb-3">📭</div>
              <p className="font-bold text-stone-500">Tiada permintaan rakan.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}