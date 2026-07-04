import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import {
  CloudSun,
  CheckSquare,
  Calendar,
  Heart,
  Trash2,
  MapPinOff,
  Flame,
  Award,
  Sparkles,
  Zap,
  Bot
} from "lucide-react";
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

// ---------------- WEATHER ----------------
const parseWmoCode = (code) => {
  const map = {
    0: { status: "Sunny", emoji: "☀️" },
    1: { status: "Clear", emoji: "🌤️" },
    2: { status: "Cloudy", emoji: "⛅" },
    3: { status: "Overcast", emoji: "☁️" },
    61: { status: "Rain", emoji: "🌧️" },
    95: { status: "Thunderstorm", emoji: "⛈️" },
  };
  return map[code] || { status: "Clear", emoji: "☀️" };
};

// ---------------- LIVE ANIMATED AVATAR COMPONENT ----------------
function LiveAvatar({ level }) {
  const lvl = level || 1;

  const getAvatarTheme = (l) => {
    if (l >= 15) {
      return {
        bg: "bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-500",
        auraColor: "border-pink-300",
        title: "Mythic Hero",
        accessory: "👑",
        model: "🧙‍♂️"
      };
    } else if (l >= 6) {
      return {
        bg: "bg-gradient-to-br from-sky-500 via-blue-500 to-indigo-600",
        auraColor: "border-cyan-200",
        title: "Adventurer",
        accessory: "🛡️",
        model: "🧑‍🚀"
      };
    } else {
      return {
        bg: "bg-gradient-to-br from-amber-200 via-orange-300 to-rose-400",
        auraColor: "border-amber-100",
        title: "Novice",
        accessory: "🌱",
        model: "👶"
      };
    }
  };

  const theme = getAvatarTheme(lvl);

  // Animation constants for reusable motion properties
  const floatTransition = {
    duration: 3,
    repeat: Infinity,
    ease: "easeInOut"
  };

  const auraPulseTransition = {
    duration: 2.5,
    repeat: Infinity,
    ease: "easeInOut",
    repeatType: "reverse"
  };

  const orbitTransition = {
    duration: 5,
    repeat: Infinity,
    ease: "linear"
  };

  return (
    <div className="relative flex flex-col items-center justify-center p-3 flex-shrink-0">
      
      {/* 1. LIVE AURA: Continuous pulse and rotation */}
      <motion.div 
        animate={{ 
          scale: [1, 1.1, 1], 
          opacity: [0.3, 0.6, 0.3],
          rotate: [0, 360] 
        }}
        transition={{...auraPulseTransition, duration: 8}}
        className={`absolute w-28 h-28 rounded-full border-2 border-dashed ${theme.auraColor}`} 
      />
      
      {/* 2. INNER GLOW LAYER */}
      <motion.div 
        animate={{ scale: [1.1, 1, 1.1] }}
        transition={auraPulseTransition}
        className={`absolute w-24 h-24 rounded-full border-4 ${theme.auraColor} opacity-40`} 
      />
      
      {/* 3. MAIN LIVE CHARACTER CONTAINER */}
      <motion.div 
        whileHover={{ scale: 1.15, rotate: 10 }}
        className={`w-20 h-20 rounded-full ${theme.bg} shadow-lg border-2 border-white flex items-center justify-center relative overflow-hidden z-10`}
      >
        {/* CHARACTER MODEL: Has gentle floating animation */}
        <motion.span 
          animate={{ y: [-5, 5, -5] }}
          transition={floatTransition}
          className="text-5xl select-none filter drop-shadow-md relative z-20"
        >
          {theme.model}
        </motion.span>

        {/* ORBITING ACCESSORY: Continuously spins around the edge of the avatar */}
        <motion.div 
          animate={{ rotate: [-360, 0] }}
          transition={orbitTransition}
          className="absolute inset-0 z-10"
        >
          <motion.div 
            animate={{ scale: [1, 1.2, 1] }}
            transition={auraPulseTransition}
            className="absolute top-1 right-1 text-base bg-white/60 p-1 rounded-full shadow-inner"
          >
            {theme.accessory}
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Title Subtext */}
      <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mt-2 relative z-20">
        {theme.title}
      </span>
    </div>
  );
}

// ---------------- INDIVIDUAL CHILD CARD ----------------
function ChildCard({ child, onUnlink }) {
  const currentLevel = child.progress?.level || 1;

  return (
    <Card className="p-6 space-y-4 hover:shadow-md transition-shadow relative overflow-hidden border-l-4 border-l-purple-500">
      <div className="flex items-start justify-between">
        
        <div className="flex items-center space-x-4">
          <LiveAvatar level={currentLevel} />
          <div>
            {/* Reverted back to your original fallback rendering pattern here */}
            <h3 className="text-xl font-bold">
              {child.full_name || child.username || "Unnamed Student"}
            </h3>
            <p className="text-sm text-muted-foreground">
              Age {calculateAge(child.date_of_birth)} • {child.education_level}
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onUnlink(child.id, child.full_name || child.username || "Student")}
          className="text-rose-500 hover:bg-rose-50 h-8 w-8 p-0 rounded-full"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl text-center text-sm border">
        <div className="flex flex-col items-center justify-center border-r">
          <div className="flex items-center gap-1 font-extrabold text-purple-600 text-lg">
            <Award className="w-4 h-4" />
            <span>{currentLevel}</span>
          </div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-tight">Level</p>
        </div>
        
        <div className="flex flex-col items-center justify-center border-r">
          <div className="flex items-center gap-1 font-extrabold text-amber-500 text-lg">
            <Zap className="w-4 h-4 fill-amber-400" />
            <span>{child.wallet?.balance || 0}</span>
          </div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-tight">Coins</p>
        </div>

        <div className="flex flex-col items-center justify-center">
          <div className="flex items-center gap-1 font-extrabold text-orange-500 text-lg">
            <Flame className="w-4 h-4 fill-orange-400" />
            <span>{child.progress?.streak_days || 0}</span>
          </div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-tight">Streak</p>
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

  const [weather, setWeather] = useState({
    temp: "--",
    status: "Loading...",
    emoji: "☀️",
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
          const user = await base44.entities.User.get(id).catch(() => null);

          return {
            id,
            full_name: user?.full_name || "",
            username: user?.username || "",
            date_of_birth: user?.date_of_birth || "",
            education_level: user?.education_level || "",
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

  // ---------------- WEATHER ----------------
  const fetchWeather = useCallback(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;

      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
      );

      const data = await res.json();
      const meta = parseWmoCode(data.current_weather.weathercode);

      setWeather({
        temp: `${Math.round(data.current_weather.temperature)}°C`,
        status: meta.status,
        emoji: meta.emoji,
      });
    });
  }, []);

  // ---------------- EFFECT ----------------
  useEffect(() => {
    loadData();
    fetchWeather();
  }, []);

  // ---------------- UNLINK ----------------
  const handleUnlink = async (childId, name) => {
    try {
      const rel = await base44.entities.ParentChildRelationship.filter({
        parent_id: user.id,
        child_id: childId,
        status: ["active", "pending"],
      });
      if (rel?.[0]) {
        await base44.entities.ParentChildRelationship.update(rel[0].id, {
          status: "inactive",
        });
      }
      toast({
        title: "Unlinked",
        description: `${name} removed`,
      });
      loadData();
    } catch (err) {
      toast({
        title: "Failed to unlink",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  // ================= UI =================
  if (loading) {
    return <div className="p-10 text-center">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">

      {/* HEADER SECTION WITH WEATHER */}
      <div className="bg-gradient-to-r from-slate-50 to-white p-6 rounded-2xl border flex items-center justify-between shadow-sm relative overflow-hidden">
        {/* Subtle live background effect for the header itself */}
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 15, repeat: Infinity }}
          className="absolute -top-10 -right-10 w-40 h-40 bg-purple-200 rounded-full blur-3xl z-0" 
        />
        
        <div className="relative z-10">
          <h1 className="text-2xl font-black text-gray-800 flex items-center gap-3">
            <motion.span animate={{ rotate: [0, 20, 0] }} transition={{ duration: 0.5, delay: 1 }} className="origin-bottom-right select-none">👋</motion.span>
            <span>Selamat Datang, {user?.full_name || "Ibu Bapa"}</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Berikut adalah ringkasan aktiviti dan pencapaian anak-anak hari ini.
          </p>
        </div>
        
        <div className="bg-white px-4 py-2 rounded-xl border flex items-center gap-3 shadow-sm relative z-10">
          <div className="text-right">
            <div className="text-lg font-bold text-gray-700">{weather.temp}</div>
            <div className="text-xs text-gray-400 font-medium">{weather.status}</div>
          </div>
          <div className="text-2xl">{weather.emoji}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* MAIN PANEL: CHILDREN LISTING */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-2 font-bold text-gray-700 border-b pb-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <h2>Akaun Anak-anak ({children.length})</h2>
          </div>

          {children.length === 0 ? (
            <div className="p-8 border border-dashed rounded-xl text-center text-gray-400 bg-gray-50">
              No student profiles connected to this parent account.
            </div>
          ) : (
            <div className="grid gap-4">
              {children.map(c => (
                <ChildCard
                  key={c.id}
                  child={c}
                  onUnlink={handleUnlink}
                />
              ))}
            </div>
          )}
        </div>

        {/* SIDE PANEL: PENDING REQUESTS */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 font-bold text-gray-700 border-b pb-2">
            <CheckSquare className="w-5 h-5 text-amber-500" />
            <h2>Pending Action Requests</h2>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="text-gray-400 text-sm border border-dashed p-6 rounded-xl bg-gray-50/50 text-center">
              All caught up! No pending item approvals.
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {pendingRequests.map(r => (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    key={r.id} 
                    className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl text-sm font-medium text-amber-900 flex justify-between items-center group hover:bg-amber-100 transition-colors"
                  >
                    <span>{r.reward_title}</span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-amber-200 rounded-full text-amber-700 group-hover:bg-amber-300 transition-colors">
                      Verify
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}