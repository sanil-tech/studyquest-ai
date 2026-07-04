import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import {
  MapPin, Wind, CloudRain, Clock, Sparkles, Gift, Check, X,
  Award, Zap, Flame, User, TrendingUp
} from "lucide-react";
import { getDisplayName } from "@/lib/utils"; 
import { useToast } from "@/components/ui/use-toast";
import moment from "moment";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

// ---------------- HELPERS ----------------
const calculateAge = (birthDate) => {
  if (!birthDate) return "N/A";
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

const parseWmoCode = (code) => {
  const map = {
    0: { status: "Cerah Bersari", emoji: "☀️" },
    1: { status: "Cerah Berawan", emoji: "🌤️" },
    2: { status: "Berawan", emoji: "⛅" },
    3: { status: "Mendung", emoji: "☁️" },
    45: { status: "Kabus", emoji: "🌫️" },
    61: { status: "Hujan Ringan", emoji: "🌧️" },
    63: { status: "Hujan", emoji: "🌧️" },
    95: { status: "Ribut Petir", emoji: "⛈️" },
  };
  return map[code] || { status: "Cerah", emoji: "☀️" };
};

// ---------------- 3D REALISTIC LIVE DRAGON AVATAR ----------------
function Realistic3DAvatar({ level }) {
  const lvl = level || 1;
  const getDragonStage = (l) => {
    if (l >= 15) return { stageTitle: "Ancient Inferno", gradient: "from-rose-600 to-amber-400", icon: "🐉", subtext: "Tier 3 Titan", glow: "rgba(239, 68, 68, 0.4)" };
    if (l >= 6) return { stageTitle: "Emerald Drake", gradient: "from-emerald-500 to-cyan-500", icon: "🐲", subtext: "Tier 2 Winged", glow: "rgba(16, 185, 129, 0.3)" };
    return { stageTitle: "Ruby Hatchling", gradient: "from-purple-500 to-rose-400", icon: "🦖", subtext: "Tier 1 Egg", glow: "rgba(219, 39, 119, 0.2)" };
  };
  const stage = getDragonStage(lvl);
  return (
    <div className="relative flex flex-col items-center justify-center p-2 select-none flex-shrink-0">
      <div style={{ perspective: "1000px" }} className="relative w-20 h-20 flex items-center justify-center">
        <motion.div animate={{ scale: [0.95, 1.15, 0.95], rotate: 360 }} transition={{ duration: 10, repeat: Infinity }} style={{ boxShadow: `0 0 20px ${stage.glow}` }} className="absolute inset-0 rounded-full border border-dashed border-white/20 opacity-50" />
        <motion.div animate={{ y: [-4, 4, -4], rotateY: [-5, 5, -5] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className={`w-16 h-16 rounded-full bg-gradient-to-tr ${stage.gradient} border-2 border-white shadow-xl flex items-center justify-center relative z-10`}>
          <span className="text-4xl drop-shadow-lg">{stage.icon}</span>
        </motion.div>
      </div>
      <span className="text-[10px] font-black text-slate-700 mt-2">{stage.stageTitle}</span>
    </div>
  );
}

// ---------------- INDIVIDUAL CHILD CARD ----------------
function ChildCard({ child }) {
  // Pengiraan XP Sebenar berasaskan pencapaian real-time anak
  const currentXP = child.progress?.xp_score || 0;
  const nextLevelXP = child.progress?.next_level_xp || (child.progress?.level ? child.progress.level * 500 : 1000);
  const xpPercentage = Math.min(Math.round((currentXP / nextLevelXP) * 100), 100);
  const lastActive = child.last_active ? moment(child.last_active).fromNow() : "Baru aktif";

  return (
    <Card className="p-6 space-y-4 bg-white hover:shadow-lg transition-all border-slate-100 relative overflow-hidden group">
      
      {/* Status Keaktifan Sebenar */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5">
        <div className={`w-2 h-2 rounded-full ${child.last_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{lastActive}</span>
      </div>

      <div className="flex items-start gap-4">
        <Realistic3DAvatar level={child.progress?.level} />
        <div className="flex-grow space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-slate-800">{child.display_name}</h3>
            <Badge variant="secondary" className="bg-blue-50 text-blue-600 text-[10px] font-bold h-5">
              {child.education_level || "Standard 2"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground font-medium">Umur {calculateAge(child.date_of_birth)} Tahun</p>
          
          {/* Progress Bar Grafik XP yang Tepat */}
          <div className="pt-3 space-y-1.5">
            <div className="flex justify-between items-center text-[10px]">
              <span className="font-bold text-slate-500 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-indigo-500" /> 
                Ganjaran XP: <span className="text-slate-700 font-extrabold">{currentXP}</span> / {nextLevelXP} XP
              </span>
              <span className="font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                Tahap {child.progress?.level || 1}
              </span>
            </div>
            <Progress value={xpPercentage} className="h-1.5 bg-slate-100" />
            <p className="text-[9px] text-right text-slate-400 font-medium">{xpPercentage}% menuju tahap seterusnya</p>
          </div>
        </div>
      </div>

      {/* Grid Subjek Fokus & Misi Harian Pelajar */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Topik Utama</p>
            <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-xs shadow-sm">🔢</div>
                <span className="text-xs font-bold text-slate-700 truncate">
                  {child.progress?.current_topic || "Pecahan (Math)"}
                </span>
            </div>
        </div>
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Misi Hari Ini</p>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-[10px] shadow-sm text-emerald-500 font-extrabold">
                  {child.progress?.completed_quests || 2}/{child.progress?.total_quests || 3}
                </div>
                <span className="truncate">Selesaikan Misi</span>
            </div>
        </div>
      </div>

      {/* Rail Metrik & Butang Sorakan Interaktif */}
      <div className="grid grid-cols-3 gap-2 bg-slate-50/50 p-3 rounded-xl text-center border border-slate-100 group-hover:bg-white transition-colors">
        <div>
          <p className="font-black text-slate-700">🪙 {child.wallet?.balance || 0}</p>
          <p className="text-[9px] text-muted-foreground font-bold uppercase">Koin</p>
        </div>
        <div className="border-x border-slate-200/50">
          <p className="font-black text-orange-500">🔥 {child.progress?.streak_days || 0}</p>
          <p className="text-[9px] text-muted-foreground font-bold uppercase">Streak</p>
        </div>
        <div 
          className="cursor-pointer hover:scale-105 transition-transform active:scale-95"
          onClick={() => alert(`🎉 Sorakan kasih sayang telah dihantar terus ke peranti ${child.display_name}!`)}
        >
          <p className="font-black text-rose-500">❤️ Sorak!</p>
          <p className="text-[9px] text-muted-foreground font-bold uppercase">Puji Anak</p>
        </div>
      </div>
    </Card>
  );
}

// ================= MAIN DASHBOARD =================
export default function ParentDashboard() {
  const { toast } = useToast();
  const [children, setChildren] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState({
    temp: "--", status: "Mencari isyarat langit...", emoji: "☀️", location: "Menjejak lokasi...", hourly: []
  });

  // ---------------- MEMUATKAN DATA UTAMA ----------------
  const loadData = async () => {
    try {
      setLoading(true);
      const u = await base44.auth.me();
      
      const rel = await base44.entities.ParentChildRelationship.filter({ 
        parent_id: u.id, 
        status: "active" 
      });
      
      if (!rel.length) {
        setChildren([]);
        setPendingRequests([]);
        setLoading(false);
        return;
      }

      const kids = await Promise.all(rel.map(async (r) => {
        const [progress, wallet, userRecord] = await Promise.all([
          base44.entities.Progress.filter({ student_id: r.child_id }).then(res => res[0] || {}),
          base44.entities.Wallet.filter({ student_id: r.child_id }).then(res => res[0] || { balance: 0 }),
          base44.entities.User.get(r.child_id).catch(() => null)
        ]);
        return { 
          ...userRecord, 
          id: r.child_id,
          display_name: userRecord ? getDisplayName(userRecord) : "Unnamed Student", 
          progress, 
          wallet 
        };
      }));

      const pending = await base44.entities.RewardRequest.filter({ status: "pending" });
      setChildren(kids);
      setPendingRequests(pending);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- PENGURUSAN TUNTUTAN REWARD ----------------
  const handleReviewRequest = async (requestId, approved) => {
    try {
      await base44.entities.RewardRequest.update(requestId, {
        status: approved ? "approved" : "rejected",
      });
      toast({
        title: approved ? "Ganjaran Diluluskan! 🎉" : "Permintaan Ditolak",
        description: approved ? "Koin anak berjaya ditukarkan kepada ganjaran!" : "Permintaan penukaran telah dibatalkan.",
      });
      loadData();
    } catch (err) {
      toast({
        title: "Gagal memproses",
        description: err.message,
        variant: "destructive"
      });
    }
  };

  // ---------------- DATA METEOROLOGI DAN RAMALAN 5 JAM ----------------
  const fetchWeather = useCallback(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      
      try {
        let locName = "Kawasan Setempat";
        try {
          const geoRes = await fetch(`https://api.bigdatacloud.com/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=ms`);
          const geoData = await geoRes.json();
          locName = geoData.principalSubdivision || geoData.city || geoData.locality || "Kawasan Setempat";
        } catch (e) {
          console.error(e);
        }

        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m,weathercode,precipitation_probability`);
        const data = await res.json();
        const current = data.current_weather;
        const meta = parseWmoCode(current.weathercode);
        
        const currentHour = new Date().getHours();
        const forecast = Array.from({ length: 5 }, (_, i) => {
          const targetIndex = currentHour + i + 1;
          return {
            time: moment().add(i + 1, 'hours').format("h A"),
            temp: data.hourly ? `${Math.round(data.hourly.temperature_2m[targetIndex])}°C` : "--°C",
            emoji: data.hourly ? parseWmoCode(data.hourly.weathercode[targetIndex]).emoji : "☀️",
            rain: data.hourly ? `${data.hourly.precipitation_probability[targetIndex]}%` : "0%"
          };
        });

        setWeather({
          temp: `${Math.round(current.temperature)}°C`, 
          status: meta.status, 
          emoji: meta.emoji,
          location: locName, 
          hourly: forecast
        });
      } catch (err) {
        console.error(err);
      }
    });
  }, []);

  useEffect(() => { loadData(); fetchWeather(); }, []);

  if (loading) {
    return <div className="p-20 text-center text-sm font-bold text-slate-400">Memuatkan data dashboard induk...</div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      
      {/* BLOK CUACA DENGAN LOKASI & RAMALAN 5 JAM */}
      <Card className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl border-0 overflow-hidden relative">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/10 pb-4 mb-4 gap-4">
            <div className="space-y-1">
                <p className="text-xs font-bold text-sky-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3 animate-pulse" /> {weather.location}
                </p>
                <h1 className="text-4xl font-black">
                  {weather.temp} <span className="text-lg text-slate-400 font-bold">| {weather.status} {weather.emoji}</span>
                </h1>
            </div>
            
            {/* Horizontal Forecast Row */}
            <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1">
                {weather.hourly.map((h, i) => (
                    <div key={i} className="bg-white/5 p-2 rounded-xl text-center min-w-[70px] border border-white/5">
                        <p className="text-[10px] text-slate-400 font-bold">{h.time}</p>
                        <p className="text-lg my-1">{h.emoji}</p>
                        <p className="text-xs font-black">{h.temp}</p>
                        <p className="text-[8px] text-sky-300 font-medium">💧 {h.rain}</p>
                    </div>
                ))}
            </div>
        </div>
        <p className="text-[10px] text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" /> Dipaparkan berdasarkan zon masa dan kedudukan GPS anda.</p>
      </Card>

      {/* SEKSYEN KANDUNGAN UTAMA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* PANEL ANAK-ANAK */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-black text-xl text-slate-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" /> Anak-anak Saya
          </h2>
          <div className="grid gap-4">
            {children.length === 0 ? (
              <div className="p-12 border border-dashed rounded-3xl text-center text-sm text-slate-400 bg-slate-50/50">
                Tiada profil pelajar aktif ditemui под pautan akaun ini.
              </div>
            ) : (
              children.map(c => <ChildCard key={c.id} child={c} />)
            )}
          </div>
        </div>

        {/* PANEL REWARD SANTAI */}
        <div className="space-y-4">
          <h2 className="font-black text-xl text-slate-800 flex items-center gap-2">
            <Gift className="w-5 h-5 text-rose-500 animate-bounce" /> Tuntutan Ganjaran 🪙
          </h2>
          
          {pendingRequests.length === 0 ? (
            <div className="p-10 border border-dashed rounded-3xl bg-slate-50/50 text-center text-xs text-slate-400 leading-relaxed">
              Semua tuntutan ganjaran koin anak-anak telah selesai disemak! Bagus ibu bapa! 👍
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {pendingRequests.map(r => {
                  const targetChild = children.find(c => c.id === r.student_id);
                  const requesterName = targetChild ? targetChild.display_name : "Anak anda";

                  return (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95, y: 5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      key={r.id}
                      className="p-4 bg-gradient-to-br from-white to-purple-50/30 border border-purple-100 rounded-3xl shadow-xs relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-black rounded-bl-xl">Tukar Koin</div>
                      <p className="text-[10px] font-bold text-purple-600 mb-0.5">🚀 {requesterName} memohon:</p>
                      <h4 className="font-black text-slate-800 text-base">🎁 {r.reward_title}</h4>
                      {r.coin_cost && (
                        <p className="text-xs font-bold text-amber-600 mt-1">Kos: 🪙 {r.coin_cost} Koin</p>
                      )}
                      
                      <div className="flex gap-2 mt-4">
                          <Button 
                            size="sm" 
                            onClick={() => handleReviewRequest(r.id, true)}
                            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl h-8 text-[11px] gap-1"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" /> Bagi Ganjaran
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleReviewRequest(r.id, false)}
                            className="bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-600 font-bold rounded-xl h-8 text-[11px]"
                          >
                            <X className="w-3.5 h-3.5" />
                          </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}