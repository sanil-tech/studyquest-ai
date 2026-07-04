import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import {
  CloudSun,
  CheckSquare,
  Calendar,
  Heart,
  Flame,
  Award,
  Sparkles,
  Zap,
  Check,
  X,
  Gift,
  MapPin,
  Wind,
  CloudRain,
  Clock
} from "lucide-react";
import { getDisplayName } from "@/lib/utils"; 
import { useToast } from "@/components/ui/use-toast";
import moment from "moment";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const calculateAge = (birthDate) => {
  if (!birthDate) return "N/A";
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

// ---------------- WEATHER HELPERS ----------------
const parseWmoCode = (code) => {
  const map = {
    0: { status: "Cerah Besari", emoji: "☀️" },
    1: { status: "Cerah Berawan", emoji: "🌤️" },
    2: { status: "Berawan", emoji: "⛅" },
    3: { status: "Mendung", emoji: "☁️" },
    45: { status: "Kabus", emoji: "🌫️" },
    48: { status: "Kabus Berair", emoji: "🌫️" },
    51: { status: "Gerimis Ringan", emoji: "🌧️" },
    53: { status: "Gerimis", emoji: "🌧️" },
    55: { status: "Gerimis Lebat", emoji: "🌧️" },
    61: { status: "Hujan Ringan", emoji: "🌧️" },
    63: { status: "Hujan", emoji: "🌧️" },
    65: { status: "Hujan Lebat", emoji: "🌧️" },
    80: { status: "Hujan Mandi Ringan", emoji: "🌧️" },
    81: { status: "Hujan Mandi", emoji: "🌧️" },
    95: { status: "Ribut Petir", emoji: "⛈️" },
  };
  return map[code] || { status: "Cerah", emoji: "☀️" };
};

// ---------------- 3D REALISTIC LIVE DRAGON AVATAR ----------------
function Realistic3DAvatar({ level }) {
  const lvl = level || 1;

  const getDragonStage = (l) => {
    if (l >= 15) {
      return {
        stageTitle: "Ancient Inferno",
        gradient: "from-rose-600 via-red-500 to-amber-400",
        glow: "rgba(239, 68, 68, 0.6)",
        orbColor: "bg-red-400 shadow-red-500/80",
        icon: "🐉",
        subtext: "Tier 3 Titan"
      };
    } else if (l >= 6) {
      return {
        stageTitle: "Emerald Drake",
        gradient: "from-emerald-500 via-teal-500 to-cyan-500",
        glow: "rgba(16, 185, 129, 0.5)",
        orbColor: "bg-emerald-400 shadow-emerald-500/80",
        icon: "🐲",
        subtext: "Tier 2 Winged"
      };
    } else {
      return {
        stageTitle: "Ruby Hatchling",
        gradient: "from-purple-500 via-pink-500 to-rose-400",
        glow: "rgba(219, 39, 119, 0.4)",
        orbColor: "bg-pink-400 shadow-pink-500/80",
        icon: "🦖",
        subtext: "Tier 1 Egg"
      };
    }
  };

  const stage = getDragonStage(lvl);

  return (
    <div className="relative flex flex-col items-center justify-center p-4 flex-shrink-0 select-none">
      <div style={{ perspective: "1000px" }} className="relative w-24 h-24 flex items-center justify-center">
        
        {/* Shadow */}
        <motion.div
          animate={{ scale: [0.85, 1.05, 0.85], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-2 w-16 h-3 bg-black/40 blur-md rounded-full z-0"
        />

        {/* Backdrop Aura */}
        <motion.div
          animate={{ scale: [0.95, 1.15, 0.95], rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          style={{ boxShadow: `0 0 30px ${stage.glow}` }}
          className={`absolute inset-0 rounded-full border-2 border-dashed border-white/30 opacity-70`}
        />

        {/* Token Base */}
        <motion.div
          style={{ transformStyle: "preserve-3d" }}
          animate={{ 
            y: [-6, 6, -6],
            rotateY: [-10, 10, -10],
            rotateX: [5, -5, 5]
          }}
          whileHover={{ scale: 1.1, rotateZ: 5, y: -10 }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className={`w-20 h-20 rounded-full bg-gradient-to-tr ${stage.gradient} border-[3px] border-white/80 shadow-[0_15px_30px_rgba(0,0,0,0.3),inset_0_4px_12px_rgba(255,255,255,0.6)] flex items-center justify-center relative z-10`}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-black/20 rounded-full pointer-events-none" />

          {/* Dragon Model */}
          <motion.span 
            style={{ transform: "translateZ(30px)" }}
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="text-5xl drop-shadow-[0_8px_10px_rgba(0,0,0,0.4)] filter state-character"
          >
            {stage.icon}
          </motion.span>

          {/* Orbiter */}
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0"
          >
            <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full ${stage.orbColor} border border-white shadow-lg animate-pulse`} />
          </motion.div>
        </motion.div>
      </div>

      <span className="text-[11px] font-black tracking-wide text-gray-700 mt-3 drop-shadow-sm">
        {stage.stageTitle}
      </span>
      <span className="text-[9px] font-bold text-muted-foreground/80 tracking-wider uppercase -mt-0.5">
        {stage.subtext}
      </span>
    </div>
  );
}

// ---------------- INDIVIDUAL CHILD CARD ----------------
function ChildCard({ child }) {
  return (
    <Card className="p-6 space-y-4 hover:shadow-md transition-shadow duration-200 border border-slate-100 relative overflow-hidden bg-white">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <Realistic3DAvatar level={child.progress?.level} />
          <div>
            <h3 className="text-xl font-bold text-slate-800">
              {child.display_name}
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Age {calculateAge(child.date_of_birth)} • {child.education_level || "Grade Unassigned"}
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Rail Grid */}
      <div className="grid grid-cols-3 gap-2 bg-slate-50/70 p-3 rounded-xl text-center text-sm border border-slate-100">
        <div>
          <p className="font-extrabold text-slate-700 text-base">{child.progress?.level || 1}</p>
          <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-tight">Level</p>
        </div>
        <div className="border-x border-slate-200/60">
          <p className="font-extrabold text-amber-500 text-base">🪙 {child.wallet?.balance || 0}</p>
          <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-tight">Coins</p>
        </div>
        <div>
          <p className="font-extrabold text-orange-500 text-base">🔥 {child.progress?.streak_days || 0}</p>
          <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-tight">Streak</p>
        </div>
      </div>
    </Card>
  );
}

// ================= MAIN DASHBOARD =================
export default function ParentDashboard() {
  const { toast } = useToast();

  const [user, setUser] = useState(null);
  const [children, setChildren] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Status Cuaca Lengkap
  const [weather, setWeather] = useState({
    temp: "--",
    status: "Mencari isyarat langit...",
    emoji: "☀️",
    location: "Lokasi tidak dikesan",
    windSpeed: "0",
    rainProbability: "0",
    hourlyForecast: [] // Menampung ramalan 5 jam kehadapan
  });

  // ---------------- LOAD DATA ----------------
  const loadData = async () => {
    try {
      setLoading(true);

      const u = await base44.auth.me();
      setUser(u);

      const rel = await base44.entities.ParentChildRelationship.filter({
        parent_id: u.id,
        status: ["active", "pending"],
      });

      if (!rel.length) {
        setChildren([]);
        setPendingRequests([]);
        setLoading(false);
        return;
      }

      const childIds = rel.map(r => r.child_id);

      const kids = await Promise.all(
        childIds.map(async (id) => {
          const [progress, wallet] = await Promise.all([
            base44.entities.Progress.filter({ student_id: id }),
            base44.entities.Wallet.filter({ student_id: id }),
          ]);
          const userRecord = await base44.entities.User.get(id).catch(() => null);

          return {
            ...userRecord,
            id,
            full_name: userRecord?.full_name || "",
            username: userRecord?.username || "",
            date_of_birth: userRecord?.date_of_birth || "",
            education_level: userRecord?.education_level || "",
            display_name: userRecord ? getDisplayName(userRecord) : "Unnamed Student",
            progress: progress?.[0] || {},
            wallet: wallet?.[0] || { balance: 0 },
          };
        })
      );

      const pending = await base44.entities.RewardRequest.filter({
        status: "pending",
      });

      setChildren(kids);
      setPendingRequests(pending);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- REWARD ACTIONS (LULUSKAN / TOLAK) ----------------
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

  // ---------------- WEATHER & GEOLOCATION DATA ----------------
  const fetchWeather = useCallback(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;

      try {
        // 1. Dapatkan nama kawasan/lokasi (Reverse Geocoding Percuma)
        let locName = "Kawasan Setempat";
        try {
          const geoRes = await fetch(`https://api.bigdatacloud.com/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=ms`);
          const geoData = await geoRes.json();
          locName = geoData.principalSubdivision || geoData.city || geoData.locality || "Kawasan Setempat";
        } catch (e) {
          console.error("Gagal menjejak nama bandar:", e);
        }

        // 2. Dapatkan data cuaca semasa & ramalan setiap jam (hourly)
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m,weathercode,windspeed_10m,precipitation_probability`
        );
        const data = await res.json();
        const current = data.current_weather;
        const meta = parseWmoCode(current.weathercode);

        // 3. Proses ramalan untuk 5 jam seterusnya
        const currentHourIndex = new Date().getHours();
        const hourlyList = [];

        // Ambil 5 jam berikutnya dari struktur array hourly Open-Meteo
        for (let i = 1; i <= 5; i++) {
          const index = currentHourIndex + i;
          if (data.hourly && data.hourly.time[index]) {
            const timeString = moment(data.hourly.time[index]).format("h A");
            const wCode = data.hourly.weathercode[index];
            const hourMeta = parseWmoCode(wCode);

            hourlyList.push({
              time: timeString,
              temp: `${Math.round(data.hourly.temperature_2m[index])}°C`,
              emoji: hourMeta.emoji,
              status: hourMeta.status,
              wind: `${Math.round(data.hourly.windspeed_10m[index])} km/h`,
              rain: `${data.hourly.precipitation_probability[index]}%`
            });
          }
        }

        setWeather({
          temp: `${Math.round(current.temperature)}°C`,
          status: meta.status,
          emoji: meta.emoji,
          location: locName,
          windSpeed: `${Math.round(current.windspeed)} km/h`,
          rainProbability: data.hourly ? `${data.hourly.precipitation_probability[currentHourIndex]}%` : "--%",
          hourlyForecast: hourlyList
        });

      } catch (err) {
        console.error("Gagal memproses data cuaca:", err);
      }
    });
  }, []);

  // ---------------- EFFECT ----------------
  useEffect(() => {
    loadData();
    fetchWeather();
  }, []);

  // ================= UI =================
  if (loading) {
    return <div className="p-10 text-center text-sm font-medium text-muted-foreground">Loading parent dashboard telemetry...</div>;
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">

      {/* DYNAMIC METEO WEATHER BLOCK */}
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-2xl shadow-md border-0 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        
        {/* Atas: Semasa */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/10 pb-4 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-sky-400 font-bold text-sm tracking-wide">
              <MapPin className="w-4 h-4 animate-pulse" />
              <span>{weather.location}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black">{weather.temp}</span>
              <span className="text-sm font-semibold text-slate-300">| {weather.status}</span>
            </div>
          </div>

          <div className="flex items-center gap-6 bg-white/5 px-4 py-2 rounded-xl border border-white/5 w-full sm:w-auto justify-around">
            <div className="text-center">
              <div className="text-slate-400 text-[10px] uppercase font-bold flex items-center justify-center gap-1">
                <Wind className="w-3 h-3 text-teal-400" /> Angin
              </div>
              <div className="text-xs font-black mt-0.5">{weather.windSpeed}</div>
            </div>
            <div className="h-6 w-px bg-white/10" />
            <div className="text-center">
              <div className="text-slate-400 text-[10px] uppercase font-bold flex items-center justify-center gap-1">
                <CloudRain className="w-3 h-3 text-sky-400" /> Hujan
              </div>
              <div className="text-xs font-black mt-0.5">{weather.rainProbability}</div>
            </div>
            <div className="text-4xl select-none hidden sm:block ml-2">{weather.emoji}</div>
          </div>
        </div>

        {/* Bawah: Ramalan 5 Jam Seterusnya */}
        <div className="pt-4 space-y-2">
          <div className="flex items-center gap-1 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5 text-purple-400" />
            <span>Ramalan 5 Jam Seterusnya</span>
          </div>

          <div className="grid grid-cols-5 gap-2 pt-1 overflow-x-auto">
            {weather.hourlyForecast.map((hour, idx) => (
              <div key={idx} className="bg-white/5 rounded-xl p-2.5 text-center min-w-[75px] border border-white/[0.03] space-y-1">
                <p className="text-[10px] text-slate-400 font-bold">{hour.time}</p>
                <p className="text-lg select-none py-0.5">{hour.emoji}</p>
                <p className="text-xs font-black">{hour.temp}</p>
                <div className="text-[9px] text-slate-300/80 flex items-center justify-center gap-0.5 font-medium">
                  <span>💧 {hour.rain}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CHILDREN SECTION */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-500" />
            Anak-Anak Saya
          </h2>

          {children.length === 0 ? (
            <div className="p-8 border border-dashed rounded-xl text-center text-sm text-gray-400 bg-slate-50/50">
              Tiada profil pelajar yang disambungkan ke portal ini.
            </div>
          ) : (
            <div className="grid gap-4">
              {children.map(c => (
                <ChildCard
                  key={c.id}
                  child={c}
                />
              ))}
            </div>
          )}
        </div>

        {/* PENDING ACTIONS */}
        <div className="space-y-3">
          <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
            <Gift className="w-4 h-4 text-rose-500 animate-bounce" />
            Tuntutan Ganjaran 🪙
          </h2>

          {pendingRequests.length === 0 ? (
            <div className="text-gray-400 text-xs border border-dashed p-6 rounded-xl bg-slate-50/40 text-center leading-relaxed">
              Semua tuntutan ganjaran koin anak-anak telah diselesaikan. Bagus! 👍
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
                      className="p-4 border border-purple-100 rounded-2xl bg-gradient-to-br from-white to-purple-50/20 shadow-sm space-y-3 relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-bl-xl px-2">
                        Tukar Koin
                      </div>

                      <div>
                        <p className="text-xs font-bold text-purple-600 mb-0.5">🚀 {requesterName} memohon:</p>
                        <h4 className="font-extrabold text-slate-800 text-base flex items-center gap-1.5">
                          🎁 {r.reward_title}
                        </h4>
                        {r.coin_cost && (
                          <p className="text-xs font-semibold text-amber-600 mt-1">
                            Kos: 🪙 {r.coin_cost} Koin
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2 pt-1">
                        <Button
                          size="sm"
                          onClick={() => handleReviewRequest(r.id, true)}
                          className="flex-1 h-8 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs gap-1 shadow-xs rounded-xl"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          Bagi Ganjaran
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleReviewRequest(r.id, false)}
                          className="h-8 bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-500 font-bold text-xs gap-1 rounded-xl"
                        >
                          <X className="w-3.5 h-3.5" />
                          Nanti Dulu
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