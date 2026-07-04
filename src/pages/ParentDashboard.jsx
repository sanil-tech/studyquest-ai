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
  Zap
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
      {/* Real-time 3D depth wrapper */}
      <div style={{ perspective: "1000px" }} className="relative w-24 h-24 flex items-center justify-center">
        
        {/* 3D Dynamic Ambient Floor Shadow */}
        <motion.div
          animate={{ scale: [0.85, 1.05, 0.85], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-2 w-16 h-3 bg-black/40 blur-md rounded-full z-0"
        />

        {/* Pulsing Cinematic Backdrop Aura */}
        <motion.div
          animate={{ scale: [0.95, 1.15, 0.95], rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          style={{ boxShadow: `0 0 30px ${stage.glow}` }}
          className={`absolute inset-0 rounded-full border-2 border-dashed border-white/30 opacity-70`}
        />

        {/* Main 3D Glossy Token Base */}
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
          {/* Internal Volumetric Lighting Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-black/20 rounded-full pointer-events-none" />

          {/* Floating Realistic Dragon Model */}
          <motion.span 
            style={{ transform: "translateZ(30px)" }}
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="text-5xl drop-shadow-[0_8px_10px_rgba(0,0,0,0.4)] filter state-character"
          >
            {stage.icon}
          </motion.span>

          {/* 3D Orbiting Elemental Plasma Particle */}
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0"
          >
            <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full ${stage.orbColor} border border-white shadow-lg animate-pulse`} />
          </motion.div>
        </motion.div>
      </div>

      {/* 3D Stage Badging Labels */}
      <span className="text-[11px] font-black tracking-wide text-gray-700 mt-3 drop-shadow-sm">
        {stage.stageTitle}
      </span>
      <span className="text-[9px] font-bold text-muted-foreground/80 tracking-wider uppercase -mt-0.5">
        {stage.subtext}
      </span>
    </div>
  );
}

// ---------------- CHILD CARD ----------------
function ChildCard({ child, onUnlink }) {
  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Injecting our live realistic 3D dragon passing current level progress */}
          <Realistic3DAvatar level={child.progress?.level} />
          <div>
            {/* RESTORED: Exact naming logic from your original code */}
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
          className="text-rose-500 hover:bg-rose-50"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Unlink
        </Button>
      </div>

      <div className="grid grid-cols-3 text-center text-sm">
        <div>
          <p className="font-bold">{child.progress?.level || 1}</p>
          <p>Level</p>
        </div>
        <div>
          <p className="font-bold">{child.wallet?.balance || 0}</p>
          <p>Coins</p>
        </div>
        <div>
          <p className="font-bold">{child.progress?.streak_days || 0}</p>
          <p>Streak</p>
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
    <div className="p-6 space-y-6">

      {/* RESTORED: Weather layout exactly matching your original file structure */}
      <div className="bg-white p-4 rounded-2xl border flex justify-between">
        <div>
          <div className="text-2xl font-bold">{weather.temp}</div>
          <div className="text-sm text-gray-500">{weather.status}</div>
        </div>
        <div className="text-3xl">{weather.emoji}</div>
      </div>

      {/* CHILDREN SECTION */}
      <div>
        <h2 className="font-bold mb-3">My Children</h2>

        {children.length === 0 ? (
          <div className="p-4 border rounded-xl text-gray-500">
            No student profile connected
          </div>
        ) : (
          <div className="grid gap-3">
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

      {/* PENDING ACTIONS */}
      <div>
        <h2 className="font-bold mb-3">Pending Requests</h2>

        {pendingRequests.length === 0 ? (
          <div className="text-gray-400 text-sm">
            No pending requests
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {pendingRequests.map(r => (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  key={r.id} 
                  className="p-3 border rounded-xl"
                >
                  {r.reward_title}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}