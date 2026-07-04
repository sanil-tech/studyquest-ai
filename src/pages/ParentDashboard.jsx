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
  AlertCircle,
  BrainCircuit,
  TrendingUp,
  Award,
  X,
  Lightbulb,
  Sparkle
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
function ChildProgressCard({ child, onUnlink, onAnalyzeAI }) {
  const [showId, setShowId] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const xp = child?.progress?.total_xp || 0;
  const level = child?.progress?.level || 1;
  const nextXp = level * 200;
  const progressPercentage = Math.min(Math.round((xp / nextXp) * 100), 100);

  const handleAIAnalysis = async () => {
    setAnalyzing(true);
    await onAnalyzeAI(child);
    setAnalyzing(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group"
    >
      <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-400 group-hover:bg-rose-500 transition-colors" />
      
      <div className="flex justify-between items-start pl-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 shadow-inner group-hover:scale-105 transition-transform">
            <Baby className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-800 tracking-tight">{child.name}</h3>
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

      {showId && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mx-2 mt-3 p-2 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-mono text-slate-500 break-all"
        >
          System Child Identity Key: {child.id}
        </motion.div>
      )}

      <div className="mt-5 pl-2 space-y-3">
        <div>
          <div className="text-xs font-medium text-slate-600 mb-1.5 flex justify-between items-center">
            <span className="flex items-center gap-1 text-slate-500 font-semibold">
              <GraduationCap className="w-3.5 h-3.5 text-rose-400" /> Level {level}
            </span>
            <span className="text-rose-500 font-bold bg-rose-50/60 px-2 py-0.5 rounded-md text-[11px] flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> {progressPercentage}% Lesson Complete
            </span>
          </div>
          
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
            <div
              className="h-full bg-gradient-to-r from-rose-400 via-amber-400 to-emerald-400 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        <div className="text-[11px] text-slate-400 flex justify-between px-0.5">
          <span>Current Score: <strong className="text-slate-600 font-mono">{xp} XP</strong></span>
          <span>Target Milestone: <strong className="text-slate-600 font-mono">{nextXp} XP</strong></span>
        </div>

        <Button
          onClick={handleAIAnalysis}
          disabled={analyzing}
          className="w-full mt-2 h-9 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl text-xs font-medium shadow-sm gap-2 transition-all duration-300 hover:shadow-md"
        >
          <BrainCircuit className={`w-3.5 h-3.5 ${analyzing ? "animate-spin" : ""}`} />
          {analyzing ? "Analyzing Learning Track..." : "AI Child Lesson Analysis"}
        </Button>
      </div>
    </motion.div>
  );
}

// ================= PARENT DASHBOARD CORE LAYOUT =================
export default function ParentDashboard() {
  const { toast } = useToast();

  const [user, setUser] = useState(null);
  const [activeChildren, setActiveChildren] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [rewardRequests, setRewardRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // AI Modal States
  const [analysisModal, setAnalysisModal] = useState({ open: false, childName: "", report: null });

  const [weather, setWeather] = useState({
    temp: "--",
    status: "Syncing sky...",
    emoji: "☀️",
  });

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

      const rewards = await base44.entities.RewardRequest.filter({ status: "pending" });

      setActiveChildren(hydratedActive);
      setSentRequests(hydratedPending);
      setRewardRequests(rewards);
    } catch (err) {
      console.error("Dashboard metric retrieval failure:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeather = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const { latitude, longitude } = pos.coords;
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
        const data = await res.json();
        const meta = parseWmoCode(data.current_weather.weathercode);
        setWeather({ temp: `${Math.round(data.current_weather.temperature)}°C`, status: meta.status, emoji: meta.emoji });
      } catch {}
    });
  }, []);

  useEffect(() => {
    loadData();
    fetchWeather();
  }, []);

  // ---------------- REAL AI RUNTIME INVOCATION ----------------
  const handleAIAnalysisTrigger = async (child) => {
    try {
      // Direct Live execution calling your Base44 custom backend cloud edge function
      const response = await base44.functions.analyzeChildLessons({
        student_id: child.id
      });

      if (response?.error) throw new Error(response.error);

      setAnalysisModal({
        open: true,
        childName: child.name,
        report: response // Object containing analysis text and tailored action steps
      });
    } catch (err) {
      toast({
        title: "Analysis Timeout",
        description: err.message || "Could not generate live analysis report. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUnlink = async (childId, name) => {
    try {
      const rel = await base44.entities.ParentChildRelationship.filter({
        parent_id: user.id,
        child_id: childId,
        status: ["active", "pending"],
      });
      if (rel?.[0]) {
        await base44.entities.ParentChildRelationship.update(rel[0].id, { status: "inactive" });
      }
      toast({ title: "Family Hub Updated", description: `Successfully detached relationship logging for ${name}.` });
      loadData();
    } catch (err) {
      toast({ title: "Failed to update structural link", description: err.message, variant: "destructive" });
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
    <div className="p-6 space-y-6 max-w-4xl mx-auto bg-slate-50/50 min-h-screen rounded-3xl relative">

      {/* FAMILY WELCOME HEADER */}
      <div className="bg-gradient-to-br from-rose-50 via-white to-amber-50/40 p-6 rounded-3xl border border-rose-100/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            Hello, {user?.full_name || user?.nickname || "Parent Partner"} <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Welcome to your Family Portal. Here is your tracking report for today.</p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-2xl border border-slate-100 flex items-center gap-3 shadow-inner self-stretch sm:self-auto justify-between">
          <div>
            <div className="text-lg font-bold text-slate-800 font-mono leading-none">{weather.temp}</div>
            <div className="text-[10px] font-medium text-slate-400 mt-0.5">{weather.status}</div>
          </div>
          <div className="text-2xl select-none">{weather.emoji}</div>
        </div>
      </div>

      {/* ACTIVE TRACKERS */}
      <div className="space-y-3">
        <h2 className="font-bold text-base text-slate-800 tracking-tight pl-1">Children Accounts ({activeChildren.length})</h2>
        {activeChildren.length === 0 ? (
          <div className="p-8 border border-dashed border-slate-200 rounded-2xl text-center text-slate-400 bg-white shadow-sm flex flex-col items-center justify-center gap-2">
            <UserPlus className="w-8 h-8 text-slate-300" />
            <p className="text-sm font-medium text-slate-600">No active child monitors running.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {activeChildren.map(c => (
              <ChildProgressCard key={c.id} child={c} onUnlink={handleUnlink} onAnalyzeAI={handleAIAnalysisTrigger} />
            ))}
          </div>
        )}
      </div>

      {/* OUTGOING REQUESTS */}
      {sentRequests.length > 0 && (
        <div className="space-y-3 pt-2">
          <h2 className="font-bold text-xs uppercase tracking-wider text-amber-600 flex items-center gap-1.5 pl-1"><Clock className="w-3.5 h-3.5" /> Outgoing Student Invitations ({sentRequests.length})</h2>
          <div className="grid gap-2">
            {sentRequests.map((req) => (
              <div key={req.id} className="bg-amber-50/40 border border-amber-100 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100/50 flex items-center justify-center text-amber-600"><AlertCircle className="w-4 h-4" /></div>
                  <div>
                    <p className="font-semibold text-sm text-amber-900">{req.name}</p>
                    <p className="text-[11px] text-amber-700/70">Awaiting authorization confirmation inside student app</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="h-8 rounded-xl border-amber-200 hover:bg-amber-100 text-amber-900 text-xs" onClick={() => handleUnlink(req.id, req.name)}>Revoke</Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* REWARDS BLOCK */}
      <div className="space-y-3 pt-2">
        <h2 className="font-bold text-base text-slate-800 tracking-tight pl-1">Pending Reward Requests</h2>
        {rewardRequests.length === 0 ? (
          <div className="text-slate-400 text-xs pl-1 italic">No pending reward claims waiting for confirmation.</div>
        ) : (
          <div className="space-y-2">
            {rewardRequests.map(r => (
              <div key={r.id} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm flex justify-between items-center group">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-lg bg-gradient-to-br from-amber-400 to-rose-400 flex items-center justify-center text-[7px] text-white"><Award className="w-2 h-2" /></div>
                  <span className="text-sm font-medium text-slate-700">{r.reward_title}</span>
                </div>
                <Badge variant="secondary" className="text-[10px] bg-slate-50 text-slate-500 rounded-lg px-2 py-0.5 border">Awaiting Review</Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================= */}
      {/* REAL-TIME AI ANALYSIS OVERLAY MODAL       */}
      {/* ========================================= */}
      <AnimatePresence>
        {analysisModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-lg overflow-hidden border border-slate-100 shadow-2xl flex flex-col max-h-[85vh]"
            >
              <div className="p-6 bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 text-white flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                    <BrainCircuit className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base leading-tight">AI Learning Portrait</h3>
                    <p className="text-xs text-indigo-100 mt-0.5">Custom analysis brief for {analysisModal.childName}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setAnalysisModal({ open: false, childName: "", report: null })}
                  className="p-1.5 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-5 text-slate-700 text-sm leading-relaxed">
                <div className="bg-violet-50/60 rounded-2xl p-4 border border-violet-100/50 space-y-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-violet-700 flex items-center gap-1">
                    <Sparkle className="w-3.5 h-3.5 fill-violet-200" /> Performance Breakdown
                  </h4>
                  <p className="text-slate-600 text-xs">
                    {analysisModal.report?.summary || "No active progress log analysis was gathered for this period."}
                  </p>
                </div>

                <div className="space-y-2.5">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Recommended Actions for Parents
                  </h4>
                  <ul className="space-y-2">
                    {analysisModal.report?.recommendations?.map((item, index) => (
                      <li key={index} className="flex gap-2.5 items-start text-xs text-slate-600">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                          {index + 1}
                        </span>
                        <span>{item}</span>
                      </li>
                    )) || <li className="text-xs text-slate-400 italic">No recommendations available at this level.</li>}
                  </ul>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <Button 
                  onClick={() => setAnalysisModal({ open: false, childName: "", report: null })}
                  className="h-9 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs px-5"
                >
                  Close Portrait
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}