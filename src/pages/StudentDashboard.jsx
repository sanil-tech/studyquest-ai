// src/pages/StudentDashboard.jsx
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { 
  Trophy, Flame, Sparkles, LogOut, Loader2, Bell, Compass, 
  ChevronRight, Target, Star, Gift, Shield, CheckCircle, MessageSquare
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// Senarai Kata-kata Semangat Rahsia Toko Otan & Kenyalang (Borneo Vibe)
const BORNEO_MOTIVATIONS = [
  "Bah! Tiada gunung yang terlalu tinggi kalau kita daki pelan-pelan. Kinabalu pun boleh ditawan, inikan pula silabus sekolah! ⛰️",
  "Aram gait! Luaskan sayap pengembaraan kamu macam Burung Kenyalang terbang tinggi merentas rimba! 🦅",
  "Bulih juga tu bossku! Sikit lagi kita mahu buka peti harta karun misteri hari ini. Jangan kasi lama! 🦧",
  "Tenang-tenang jak, tapi mantap! Pokok yang besar bermula daripada benih yang kecil di lantai hutan. Semangat! 🌱"
];

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [wallet, setWallet] = useState({ balance: 0 });
  const [progress, setProgress] = useState({ total_xp: 0, level: 1, streak_days: 0 });
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quote, setQuote] = useState("");

  // Simulasi Cabaran Harian (Daily Quests ala Duolingo)
  const [dailyQuests, setDailyQuests] = useState([
    { id: 1, text: "Tonton 1 Video Guru di Dahan Misi", xp: 50, done: false },
    { id: 2, text: "Kutip 20 Syiling Emas", xp: 100, done: true },
    { id: 3, text: "Selesaikan 1 Kuiz Tanpa Salah", xp: 150, done: false }
  ]);

  useEffect(() => {
    // Pilih kata semangat secara rawak semasa halaman dimuatkan
    const randomQuote = BORNEO_MOTIVATIONS[Math.floor(Math.random() * BORNEO_MOTIVATIONS.length)];
    setQuote(randomQuote);

    const loadHubData = async () => {
      try {
        setLoading(true);
        const me = await base44.auth.me();
        if (!me || me.app_role !== "student") {
          await base44.auth.signOut();
          navigate("/student-login");
          return;
        }
        setStudent(me);

        // 1. Ambil data Progress, Wallet, dan Notifikasi terkini
        const [walletData, progressData, notifData] = await Promise.all([
          base44.entities.Wallet.filter({ student_id: me.id }),
          base44.entities.Progress.filter({ student_id: me.id }),
          base44.entities.Notification.filter({ user_id: me.id }).catch(() => [])
        ]);

        if (walletData && walletData.length > 0) setWallet(walletData[0]);
        if (progressData && progressData.length > 0) setProgress(progressData[0]);
        if (notifData) setNotifications(notifData.slice(0, 3)); // Ambil 3 yang terbaharu sahaja

      } catch (err) {
        console.error("Gagal memuatkan Hab Utama:", err);
      } finally {
        setLoading(false);
      }
    };
    loadHubData();
  }, [navigate]);

  const handleLogout = async () => {
    await base44.auth.signOut();
    localStorage.clear();
    window.location.href = "/student-login";
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F3FBF7] flex flex-col items-center justify-center p-4">
      <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mb-2" />
      <p className="text-xs font-black text-emerald-800 uppercase tracking-widest animate-pulse">Menghias Basecamp Pengembara... 🏕️</p>
    </div>
  );

  const isKid = student?.age_group !== "teen";

  return (
    <div className={`min-h-screen font-sans pb-12 transition-colors duration-500 ${
      isKid ? "bg-gradient-to-b from-[#E8F5E9] via-[#F4FBF7] to-[#FFFDE7]" : "bg-slate-950 text-slate-100"
    }`}>
      
      {/* 🌟 1. HERO PENGASAS (TOP HUB BAR) */}
      <div className={`w-full px-4 pt-6 pb-24 rounded-b-[3.5rem] relative overflow-hidden shadow-lg border-b-4 ${
        isKid 
          ? "bg-gradient-to-r from-teal-600 via-emerald-500 to-lime-500 border-teal-800" 
          : "bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-slate-800"
      }`}>
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]" />
        
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          
          {/* STATS KAD KIRI */}
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black border-2 shadow-md ${
              isKid ? "bg-white border-amber-300 text-teal-600" : "bg-slate-900 border-slate-800 text-emerald-400"
            }`}>
              {progress.level}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-md text-white">
                  Tahap {progress.level}
                </span>
                <span className="text-xs font-black text-amber-200">✨ {progress.total_xp} XP</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1 uppercase">
                {student?.nickname || student?.full_name || "Petualang"}
              </h1>
            </div>
          </div>

          {/* MENUBAR STATUS UTAMA (DUOLINGO BAR METRICS) */}
          <div className="flex items-center gap-3 bg-black/20 backdrop-blur-md p-2 rounded-2xl border border-white/10 w-full md:w-auto justify-around md:justify-start">
            <div className="text-center px-4">
              <span className="block text-[9px] font-black text-amber-200 uppercase tracking-wide">Peti Emas</span>
              <span className="text-base font-mono font-black text-white mt-0.5 block">🪙 {wallet.balance}</span>
            </div>
            <div className="w-[1px] h-6 bg-white/10" />
            <div className="text-center px-4">
              <span className="block text-[9px] font-black text-orange-300 uppercase tracking-wide">Streak</span>
              <span className="text-base font-black text-white mt-0.5 flex items-center gap-1">
                <Flame className="w-4 h-4 fill-orange-500 text-orange-500 animate-pulse" /> {progress.streak_days || 0} Hari
              </span>
            </div>
            <div className="w-[1px] h-6 bg-white/10" />
            <button onClick={handleLogout} className="p-2 text-white/60 hover:text-rose-400 rounded-xl hover:bg-white/5 transition-all">
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>

        </div>
      </div>

      {/* 🌳 MAIN LAYOUT CONTAINER */}
      <div className="max-w-6xl mx-auto px-4 -mt-16 grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-30">
        
        {/* ========================================================== */}
        {/* GRID KIRI & TENGAH: CABARAN & PILIHAN PENGEMBARAAN         */}
        {/* ========================================================== */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* KAD PANGGILAN CEPAT: LAUNCH STUDY SPACE */}
          <motion.div whileHover={{ y: -4 }} className="w-full">
            <Card className={`p-6 rounded-[2.5rem] border-b-[8px] relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-4 ${
              isKid 
                ? "bg-gradient-to-br from-amber-400 via-orange-400 to-yellow-500 border-orange-700 text-white shadow-xl shadow-orange-100" 
                : "bg-gradient-to-r from-emerald-600 to-teal-600 border-emerald-900 text-white shadow-xl"
            }`}>
              <div className="absolute -left-6 -bottom-6 text-8xl opacity-10 select-none">🌴</div>
              <div className="text-center sm:text-left space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest bg-black/10 px-2.5 py-1 rounded-full inline-block">Misi Semasa</span>
                <h2 className="text-lg sm:text-xl font-black tracking-tight mt-1">Sifir Darab Hutan Kanopi 🌳</h2>
                <p className="text-xs opacity-90 font-medium">Sambung dahan pembelajaran anda dan kutip 150+ XP sekarang!</p>
              </div>
              <Button 
                onClick={() => navigate("/study")} 
                className="bg-white hover:bg-slate-50 text-orange-600 font-black rounded-2xl px-6 h-12 shadow-md shrink-0 flex items-center gap-1 text-xs border-b-4 border-slate-200 active:border-b-0 active:translate-y-1 transition-all"
              >
                Masuk Hutan Ilmu <Compass className="w-4 h-4 animate-spin-slow" />
              </Button>
            </Card>
          </motion.div>

          {/* SEKSYEN: CABARAN HARIAN (DAILY QUESTS) */}
          <Card className={`p-6 rounded-[2.5rem] border shadow-sm ${isKid ? "bg-white border-slate-100" : "bg-slate-900 border-slate-800"}`}>
            <div className="flex items-center gap-2 border-b pb-3 mb-4">
              <Target className="w-5 h-5 text-indigo-500" />
              <h3 className={`text-sm font-black uppercase tracking-wider ${!isKid && "text-white"}`}>Cabaran Harian Petualang</h3>
            </div>
            
            <div className="space-y-3">
              {dailyQuests.map((quest) => (
                <div 
                  key={quest.id} 
                  className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
                    quest.done 
                      ? isKid ? "bg-emerald-50/50 border-emerald-100 text-slate-500" : "bg-emerald-950/20 border-emerald-900/40 text-slate-400"
                      : isKid ? "bg-slate-50 border-slate-100 text-slate-700" : "bg-slate-950 border-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${quest.done ? "text-emerald-500" : "text-slate-300"}`}>
                      <CheckCircle className="w-5 h-5 fill-current bg-white rounded-full shadow-xs" />
                    </div>
                    <span className={`text-xs font-bold tracking-tight ${quest.done && "line-through opacity-60"}`}>{quest.text}</span>
                  </div>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg shrink-0 ${quest.done ? "bg-emerald-100/60 text-emerald-700" : "bg-indigo-50 text-indigo-600 dark:bg-slate-800 dark:text-indigo-400"}`}>
                    +{quest.xp} XP
                  </span>
                </div>
              ))}
            </div>
          </Card>

        </div>

        {/* ========================================================== */}
        {/* GRID KANAN: NOTIFIKASI & KATA SEMANGAT TOKO OTAN           */}
        {/* ========================================================== */}
        <div className="space-y-6">
          
          {/* PAPAN SUARA OTAN (MOTIVATIONAL SPEECH BUBBLE) */}
          {isKid && (
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="relative">
              {/* Kepala Maskot Otan Menjenguk */}
              <div className="text-5xl absolute -top-8 left-6 z-20 select-none animate-bounce">🦧</div>
              <div className="bg-gradient-to-br from-[#70421A] to-[#4A2810] text-amber-100 p-5 rounded-[2.5rem] border-b-[6px] border-[#2c1809] shadow-md relative overflow-hidden pt-8">
                <div className="absolute right-2 top-2 text-white/5"><MessageSquare className="w-24 h-24" /></div>
                <p className="text-xs font-black leading-relaxed tracking-wide shadow-xs">
                  "{quote}"
                </p>
                <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2.5">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-amber-300/80">Nasihat Toko Otan Sabah</span>
                  <button onClick={() => setQuote(BORNEO_MOTIVATIONS[Math.floor(Math.random() * BORNEO_MOTIVATIONS.length)])} className="text-[9px] font-black bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded-md text-white transition-colors">Tukar Kata 🔄</button>
                </div>
              </div>
            </motion.div>
          )}

          {/* KOTAK SURAT / NOTIFIKASI (NOTIFICATION CENTER) */}
          <Card className={`p-5 rounded-[2.5rem] border shadow-sm ${isKid ? "bg-white border-slate-100" : "bg-slate-900 border-slate-800"}`}>
            <div className="flex items-center justify-between border-b pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-500 fill-amber-400" />
                <h3 className={`text-xs font-black uppercase tracking-wider ${!isKid && "text-white"}`}>Surat Khabar Basecamp</h3>
              </div>
              {notifications.length > 0 && <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />}
            </div>

            <div className="space-y-2.5">
              {notifications.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 font-bold uppercase tracking-wide">
                  📭 Tiada surat baru hari ini.
                </div>
              ) : (
                notifications.map((notif) => (
                  <div key={notif.id} className={`p-3 rounded-xl border border-dashed text-left space-y-1 transition-all ${
                    isKid ? "bg-slate-50/50 border-slate-200" : "bg-slate-950 border-slate-800"
                  }`}>
                    <p className={`text-xs font-black tracking-tight ${!isKid && "text-slate-200"}`}>{notif.title}</p>
                    <p className="text-[11px] text-slate-400 font-medium leading-tight">{notif.message}</p>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* LENCANA PENCAPAIAN (ACHIEVEMENTS PREVIEW) */}
          <Card className={`p-5 rounded-[2.5rem] border shadow-sm ${isKid ? "bg-white border-slate-100" : "bg-slate-900 border-slate-800"}`}>
            <div className="flex items-center gap-2 border-b pb-3 mb-3">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <h3 className={`text-xs font-black uppercase tracking-wider ${!isKid && "text-white"}`}>Lencana Kehormatan</h3>
            </div>
            
            <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
              {[
                { label: "Peneroka", icon: "🧗", unlocked: true },
                { label: "Raja Sifir", icon: "👑", unlocked: true },
                { label: "Wira Kinabalu", icon: "🌋", unlocked: false }
              ].map((badge, i) => (
                <div key={i} className={`flex flex-col items-center p-2.5 rounded-xl border text-center shrink-0 min-w-[75px] ${
                  badge.unlocked 
                    ? isKid ? "bg-amber-50/30 border-amber-200 text-slate-800" : "bg-slate-800/60 border-slate-700 text-white" 
                    : "opacity-40 bg-slate-100 border-transparent text-slate-400 grayscale"
                }`}>
                  <span className="text-2xl">{badge.icon}</span>
                  <span className="text-[9px] font-black tracking-tight mt-1 truncate w-full">{badge.label}</span>
                </div>
              ))}
            </div>
          </Card>

        </div>

      </div>

    </div>
  );
}
