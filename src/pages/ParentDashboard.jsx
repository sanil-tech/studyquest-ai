import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import {
  CloudSun,
  Trash2,
  Clock,
  Heart,
  Baby,
  GraduationCap,
  Sparkles,
  UserPlus,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

// ---------------- WEATHER UTILS ----------------
const parseWmoCode = (code) => {
  const map = {
    0: { status: "Bright & Sunny", emoji: "☀️" },
    1: { status: "Clear Skies", emoji: "🌤️" },
    2: { status: "Partly Cloudy", emoji: "⛅" },
    3: { status: "Overcast", emoji: "☁️" },
    61: { status: "Passing Showers", emoji: "🌧️" },
    95: { status: "Thunderstorms", emoji: "⛈️" },
  };
  return map[code] || { status: "Clear Skies", emoji: "☀️" };
};

// ================= CHILDREN TRACKER CARD =================
function ChildProgressCard({ child, onUnlink }) {
  const [showId, setShowId] = useState(false);

  const xp = child?.progress?.total_xp || 0;
  const level = child?.progress?.level || 1;
  const nextXp = level * 200;
  const progressPercentage = Math.min((xp / nextXp) * 100, 100);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
    >
      <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-400" />
      
      {/* HEADER */}
      <div className="flex justify-between items-start pl-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 shadow-inner">
            <Baby className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-800 tracking-tight">
              {child.name}
            </h3>
            <button
              onClick={() => setShowId(!showId)}
              className="text-[11px] text-slate-400 hover:text-rose-500 block transition-colors mt-0.5"
            >
              {showId ? "Hide Link Meta" : "View Managed Profile ID"}
            </button>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
          onClick={() => onUnlink(child.id, child.name)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* SECURE ID FOOTNOTE */}
      {showId && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mx-2 mt-3 p-2 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-mono text-slate-500 break-all"
        >
          System Child Identity Key: {child.id}
        </motion.div>
      )}

      {/* METRIC EXP SCORE BAR */}
      <div className="mt-5 pl-2">
        <div className="text-xs font-medium text-slate-600 mb-1.5 flex justify-between items-center">
          <span className="flex items-center gap-1 text-slate-500 font-semibold">
            <GraduationCap className="w-3.5 h-3.5 text-rose-400" /> Level {level}
          </span>
          <span className="text-slate-400 font-mono text-[11px]">{xp} / {nextXp} XP</span>
        </div>
        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
          <div
            className="h-full bg-gradient-to-r from-rose-400 to-amber-400 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
    </motion.div>
  );
}

// ================= PARENT DASHBOARD CORELayout =================
export default function ParentDashboard() {
  const { toast } = useToast();

  const [user, setUser] = useState(null);
  const [activeChildren, setActiveChildren] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [rewardRequests, setRewardRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const [weather, setWeather] = useState({
    temp: "--",
    status: "Syncing sky...",
    emoji: "☀️",
  });

  // ---------------- DATAFETCH LAYER ----------------
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
        setActiveChildren([]);
        setSentRequests([]);
        setRewardRequests([]);
        return;
      }

      const activeRows = rel.filter(r => r.status === "active");
      const pendingRows = rel.filter(r => r.status === "pending");

      const hydrateProfiles = async (rows) => {
        return Promise.all(
          rows.map(async (r) => {
            const studentUser = await base44.entities.User.get(r.child_id).catch(() => null);
            const progress = await base44.entities.Progress.filter({ student_id: r.child_id });

            return {
              id: r.child_id,
              relationshipId: r.id,
              name: studentUser?.full_name || studentUser?.email || "Student Profile",
              email: studentUser?.email || "",
              progress: progress?.[0] || {},
            };
          })
        );
      };

      const [hydratedActive, hydratedPending] = await Promise.all([
        hydrateProfiles(activeRows),
        hydrateProfiles(pendingRows)
      ]);

      const rewards = await base44.entities.RewardRequest.filter({
        status: "pending",
      });

      setActiveChildren(hydratedActive);
      setSentRequests(hydratedPending);
      setRewardRequests(rewards);
    } catch (err) {
      console.error("Dashboard metric retrieval failure:", err);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- LOCAL AMBIENT WEATHER API ----------------
  const fetchWeather = useCallback(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
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
      } catch {
        // Fallback silently if meteo service experiences service timeouts
      }
    });
  }, []);

  useEffect(() => {
    loadData();
    fetchWeather();
  }, []);

  // ---------------- DISCONNECT TRACKER MODULE ----------------
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
        title: "Family Hub Updated",
        description: `Successfully detached relationship logging for ${name}.`,
      });
      loadData();
    } catch (err) {
      toast({
        title: "Failed to update connection structural data",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-sm font-medium text-slate-400 space-y-2 animate-pulse">
        <Sparkles className="w-5 h-5 mx-auto text-rose-300 animate-spin" />
        <div>Gathering family metrics...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto bg-slate-50/50 min-h-screen rounded-3xl">

      {/* FAMILY WELCOME HEADER CARD */}
      <div className="bg-gradient-to-br from-rose-50 via-white to-amber-50/40 p-6 rounded-3xl border border-rose-100/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            Hello, {user?.full_name || user?.nickname || "Parent Partner"} <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Welcome to your Family Portal. Here is your tracking report for today.
          </p>
        </div>
        
        {/* ATMOSPHERIC WEATHER CHIP */}
        <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-2xl border border-slate-100 flex items-center gap-3 shadow-inner self-stretch sm:self-auto justify-between">
          <div>
            <div className="text-lg font-bold text-slate-800 font-mono leading-none">{weather.temp}</div>
            <div className="text-[10px] font-medium text-slate-400 mt-0.5">{weather.status}</div>
          </div>
          <div className="text-2xl select-none">{weather.emoji}</div>
        </div>
      </div>

      {/* ACTIVE TRACKERS SECTION */}
      <div className="space-y-3">
        <div className="flex items-center justify-between pl-1">
          <h2 className="font-bold text-base text-slate-800 tracking-tight flex items-center gap-2">
            Children Accounts ({activeChildren.length})
          </h2>
        </div>

        {activeChildren.length === 0 ? (
          <div className="p-8 border border-dashed border-slate-200 rounded-2xl text-center text-slate-400 bg-white shadow-sm flex flex-col items-center justify-center gap-2">
            <UserPlus className="w-8 h-8 text-slate-300" />
            <p className="text-sm font-medium text-slate-600">No active child monitors running.</p>
            <p className="text-xs text-slate-400 max-w-xs">
              Provide your kid with your Parent User ID or check your child's profile dashboard to authorize tracking keys.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {activeChildren.map(c => (
              <ChildProgressCard
                key={c.id}
                child={c}
                onUnlink={handleUnlink}
              />
            ))}
          </div>
        )}
      </div>

      {/* SENT PENDING APPROVAL LINKS */}
      {sentRequests.length > 0 && (
        <div className="space-y-3 pt-2">
          <h2 className="font-bold text-xs uppercase tracking-wider text-amber-600 flex items-center gap-1.5 pl-1">
            <Clock className="w-3.5 h-3.5" /> Outgoing Student Invitations ({sentRequests.length})
          </h2>
          <div className="grid gap-2">
            {sentRequests.map((req) => (
              <div 
                key={req.id} 
                className="bg-amber-50/40 border border-amber-100 rounded-2xl p-4 flex items-center justify-between shadow-sm animate-fade-in"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100/50 flex items-center justify-center text-amber-600">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-amber-900">{req.name}</p>
                    <p className="text-[11px] text-amber-700/70">Awaiting authorization confirmation inside student app</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-xl border-amber-200 hover:bg-amber-100 text-amber-900 shadow-sm text-xs"
                  onClick={() => handleUnlink(req.id, req.name)}
                >
                  Revoke
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FAMILY REWARDS MANAGEMENT LOG */}
      <div className="space-y-3 pt-2">
        <h2 className="font-bold text-base text-slate-800 tracking-tight pl-1">
          Pending Reward Requests
        </h2>

        {rewardRequests.length === 0 ? (
          <div className="text-slate-400 text-xs pl-1 italic">
            No pending reward claims waiting for your confirmation.
          </div>
        ) : (
          <div className="space-y-2">
            {rewardRequests.map(r => (
              <div 
                key={r.id} 
                className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm flex justify-between items-center group hover:border-rose-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-400 group-hover:scale-125 transition-transform" />
                  <span className="text-sm font-medium text-slate-700">{r.reward_title}</span>
                </div>
                <Badge variant="secondary" className="text-[10px] bg-slate-50 text-slate-500 rounded-lg px-2 py-0.5 border">
                  Awaiting Review
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}