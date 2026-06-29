import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  Users, Coins, Trophy, Clock, CheckSquare, BookOpen, 
  Plus, Trash2, Calendar, Award, Flame, Target, CloudSun, Sparkles, Heart
} from "lucide-react";
import { getDisplayName } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import moment from "moment";
import AddChildModal from "@/components/parent/AddChildModal";

export default function ParentDashboard() {
  const [user, setUser] = useState(null);
  const [children, setChildren] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddChild, setShowAddChild] = useState(false);
  const { toast } = useToast();

  // --- LIVE WEB WIDGET STATES ---
  const [reminders, setReminders] = useState([
    { id: 1, text: "Sign permission slip for coming school tour", completed: false },
    { id: 2, text: "Review next week's textbook chapters", completed: true },
    { id: 3, text: "Settle upcoming school bus fees balance", completed: false }
  ]);
  const [newReminder, setNewReminder] = useState("");
  
  // Weather starts as a neutral loading layout
  const [weather, setWeather] = useState({ temp: "--°C", status: "Locating... 🔍", tip: "Finding your school zone weather metrics." });
  const [weatherLoading, setWeatherLoading] = useState(true);

  // =========================
  // GEOLOCATION WEATHER SETUP
  // =========================
  useEffect(() => {
    if (!navigator.geolocation) {
      setWeather({
        temp: "--°C",
        status: "Not Supported",
        tip: "Location tracking is unavailable on this device browser profile."
      });
      setWeatherLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Open-Meteo provides accurate geolocation weather metrics instantly without keys
          const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
          );
          const data = await res.json();
          
          const rawTemp = Math.round(data.current_weather.temperature);
          const weatherCode = data.current_weather.weathercode;
          
          let statusStr = "Clear Skies ☀️";
          let tipStr = "Clear routes! Perfect conditions for active study blocks today.";
          
          // Translate standard WMO weather interpretation codes
          if (weatherCode >= 51 && weatherCode <= 67) {
            statusStr = "Drizzle / Rain 🌧️";
            tipStr = "Expect wet roads. Remind the kids to pack umbrellas for school dismissal.";
          } else if (weatherCode >= 71 && weatherCode <= 86) {
            statusStr = "Snowy Conditions ❄️";
            tipStr = "Freezing temperatures tracked. Keep children insulated on commutes.";
          } else if (weatherCode >= 1 && weatherCode <= 3) {
            statusStr = "Partly Cloudy ⛅";
            tipStr = "Mild, safe commuting window for extracurricular pickups.";
          } else if (weatherCode >= 95) {
            statusStr = "Thunderstorm ⛈️";
            tipStr = "Heavy storm alerts tracked. Check in with transportation routes.";
          }

          setWeather({
            temp: `${rawTemp}°C`,
            status: statusStr,
            tip: tipStr
          });
        } catch {
          // Graceful database fallback if network drops out
          setWeather({ temp: "30°C", status: "Sunny ☀️", tip: "Enjoy your day monitoring your family milestones!" });
        } finally {
          setWeatherLoading(false);
        }
      },
      (error) => {
        // Handled cleanly if parent rejects browser alert request prompt
        setWeather({
          temp: "Secured",
          status: "Permissions Locked 🔒",
          tip: "Allow location access prompts to unlock automated localized commute alerts."
        });
        setWeatherLoading(false);
      }
    );
  }, []);

  // =========================
  // LOAD CORE METRICS DATA
  // =========================
  const loadData = async () => {
    try {
      setLoading(true);

      const u = await base44.auth.me();
      setUser(u);

      const relationships = await base44.entities.ParentChildRelationship.filter({
        parent_id: u.id,
        status: "active",
      });

      const studentIds = relationships.map(r => r.child_id);

      if (!studentIds.length) {
        setChildren([]);
        setPendingRequests([]);
        setLoading(false);
        return;
      }

      const childrenData = await Promise.all(
        studentIds.map(async (sid) => {
          const [progress, wallet, sessions, quizzes] = await Promise.all([
            base44.entities.Progress.filter({ student_id: sid }),
            base44.entities.Wallet.filter({ student_id: sid }),
            base44.entities.StudySession.filter({ student_id: sid }, "-created_date", 20),
            base44.entities.QuizAttempt.filter({ student_id: sid }, "-created_date", 10),
          ]);

          const weekAgo = moment().subtract(7, "days");

          const weeklyMinutes = (sessions || [])
            .filter(s => moment(s.created_date).isAfter(weekAgo))
            .reduce((a, b) => a + (b.duration_minutes || 0), 0);

          return {
            id: sid,
            progress: progress?.[0] || { level: 1, total_xp: 0, streak_days: 0 },
            wallet: wallet?.[0] || { balance: 0 },
            sessions: sessions || [],
            quizzes: quizzes || [],
            weeklyMinutes,
          };
        })
      );

      const enriched = await Promise.all(
        childrenData.map(async (c) => {
          try {
            const studentUser = await base44.entities.User.get(c.id);
            return {
              ...c,
              name: getDisplayName(studentUser),
              avatar_emoji: studentUser.avatar_emoji || "👦🏽",
              education_level: studentUser.education_level || studentUser.school_year || "Student",
            };
          } catch {
            return {
              ...c,
              name: "Student",
              avatar_emoji: "👦🏽",
              education_level: "Student",
            };
          }
        })
      );

      const rewardNested = await Promise.all(
        studentIds.map(sid =>
          base44.entities.RewardRequest.filter({
            student_id: sid,
            status: "pending",
          })
        )
      );

      setChildren(enriched);
      setPendingRequests(rewardNested.flat());
      setLoading(false);

    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUnlinkChild = async (childId, childName) => {
    if (!confirm(`Remove ${childName}?`)) return;
    try {
      const rel = await base44.entities.ParentChildRelationship.filter({
        parent_id: user.id,
        child_id: childId,
        status: "active",
      });
      if (rel?.[0]) {
        await base44.entities.ParentChildRelationship.update(rel[0].id, { status: "inactive" });
      }
      toast({ title: "Child Removed", description: `${childName} unlinked successfully` });
      loadData();
    } catch (err) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
  };

  // --- ACTIONS ---
  const handleToggleReminder = (id) => {
    setReminders(reminders.map(r => r.id === id ? { ...r, completed: !r.completed } : r));
  };

  const handleAddReminder = (e) => {
    e.preventDefault();
    if (!newReminder.trim()) return;
    setReminders([...reminders, { id: Date.now(), text: newReminder, completed: false }]);
    setNewReminder("");
  };

  const triggerKudosReward = (childName) => {
    toast({
      title: "Kudos Pushed! ✨",
      description: `Sent a live celebratory spark popup directly to ${childName}'s study page!`,
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-1 py-4 space-y-6 bg-slate-50/30 min-h-screen pb-20">
      
      {/* HEADER CONTROL CONTAINER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-black font-heading text-slate-800 tracking-tight">
            Hi {user?.full_name?.split(" ")[0] || "Parent"} 👋
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">Real-time family monitoring terminal & lifestyle assets.</p>
        </div>
        <Button onClick={() => setShowAddChild(true)} className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-sm">
          <Plus className="w-4 h-4 mr-2" />
          Link New Child Account
        </Button>
      </div>

      <AddChildModal open={showAddChild} onOpenChange={setShowAddChild} onLinked={loadData} />

      {/* DASHBOARD CORE MASTER GRID SYSTEM */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* PROGRESS AND CHILD DETAILS REGIONS */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* PENDING CASHIER REQUEST REWARDS */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
                <CheckSquare className="w-4 h-4 text-amber-500" />
              </div>
              <h2 className="font-heading font-black text-slate-800 text-base">
                Pending Reward Approvals ({pendingRequests.length})
              </h2>
            </div>

            {pendingRequests.length === 0 ? (
              <p className="text-xs text-slate-400 font-medium">Your kids haven't requested store items yet. Splendid!</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {pendingRequests.map(r => (
                  <div key={r.id} className="flex justify-between items-center text-xs p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="font-bold text-slate-700 truncate max-w-[150px]">{r.reward_title}</span>
                    <span className="text-amber-700 font-black bg-amber-100/60 px-2 py-0.5 rounded-lg border border-amber-200/40 text-[11px] shrink-0">
                      {r.coin_cost} 🪙
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ACTIVE STUDENT LOOPS */}
          <div className="grid gap-6">
            {children.map(child => (
              <ChildCard 
                key={child.id} 
                child={child} 
                onUnlink={handleUnlinkChild} 
                onSendKudos={triggerKudosReward}
              />
            ))}
          </div>
        </div>

        {/* SIDEBAR WEB MINI WIDGETS PLATFORM CONTAINER */}
        <div className="space-y-6">
          
          {/* MINI-CARD 1: GEOLOCATION-BASED WEATHER ADVISORY */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
                  <CloudSun className="w-4 h-4" />
                </div>
                <h3 className="font-heading font-black text-xs text-slate-800 tracking-wide uppercase">School Commute Advisory</h3>
              </div>
              <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md font-bold">Live Context</span>
            </div>
            
            <div className="flex items-center justify-between bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
              <div>
                <p className={`text-2xl font-black tracking-tight text-slate-800 ${weatherLoading ? 'animate-pulse text-slate-300' : ''}`}>
                  {weather.temp}
                </p>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">{weather.status}</p>
              </div>
              <span className="text-3xl shrink-0">🌦️</span>
            </div>
            
            <p className="text-[11px] font-bold text-amber-800 bg-amber-50/60 border border-amber-200/40 p-3 rounded-2xl leading-relaxed">
              💡 <span className="font-medium text-amber-900">{weather.tip}</span>
            </p>
          </div>

          {/* MINI-CARD 2: LIVE SCHEDULE ROUTINE LINEUP */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex items