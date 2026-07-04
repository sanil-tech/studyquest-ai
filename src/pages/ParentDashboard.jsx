import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import {
  Coins, Trophy, Clock, CheckSquare, BookOpen, 
  Trash2, Calendar, Award, Flame, Target, CloudSun, Heart, MapPinOff
} from "lucide-react";
import { getDisplayName } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import moment from "moment";

// ============================================================================
// WMO WEATHER CODE TRANSLATION DICTIONARY
// ============================================================================
const parseWmoCode = (code) => {
  const map = {
    0: { status: "Sunny", emoji: "☀️", tip: "Perfect conditions for outdoor school blocks today." },
    1: { status: "Mainly Clear", emoji: "🌤️", tip: "Great commuting window for school drop-offs." },
    2: { status: "Partly Cloudy", emoji: "⛅", tip: "Nice, mild weather for a standard school day balance." },
    3: { status: "Overcast", emoji: "☁️", tip: "Overcast conditions. No instant weather alerts expected." },
    45: { status: "Foggy", emoji: "🌫️", tip: "Reduced visibility. Drive with caution during school rush hours." },
    48: { status: "Misty Fog", emoji: "🌫️", tip: "Misty conditions. Keep car headlights on for safety." },
    51: { status: "Light Drizzle", emoji: "🌧️", tip: "Slight dampness out. Remind kids to pack rain gear." },
    53: { status: "Mod. Drizzle", emoji: "🌧️", tip: "Persistent light rain. Umbrellas might be useful today." },
    55: { status: "Thick Drizzle", emoji: "🌧️", tip: "Thick drizzle active. Grab a raincoat for dismissal paths." },
    61: { status: "Slight Rain", emoji: "🌧️", tip: "Mild showers. Pack an umbrella inside their bags this morning." },
    63: { status: "Moderate Rain", emoji: "🌧️", tip: "Wet roads tracking. Plan for extra minutes on the drive home." },
    65: { status: "Heavy Rain", emoji: "🌧️", tip: "Heavy downpour. Indoor school dismissals likely." },
    71: { status: "Light Snow", emoji: "❄️", tip: "Light winter flurries. Ensure coats are zipped up well." },
    73: { status: "Moderate Snow", emoji: "❄️", tip: "Snow accumulative track. Bundle up kids in full winter layers." },
    75: { status: "Heavy Snow", emoji: "❄️", tip: "Thick snowfall active. Watch out for delayed transit buses." },
    80: { status: "Slight Showers", emoji: "🌦️", tip: "Passing raindrops. Safe commute windows should open soon." },
    81: { status: "Mod. Showers", emoji: "🌦️", tip: "Intermittent sudden rain. Keep rain protection on hand." },
    82: { status: "Violent Showers", emoji: "⛈️", tip: "Heavy cloud bursts. Recommend delayed pick-ups if possible." },
    95: { status: "Thunderstorm", emoji: "⛈️", tip: "Storm alerts tracked. Keep devices close for school announcements." },
  };
  return map[code] || { status: "Clear Skies", emoji: "☀️", tip: "Enjoy your day monitoring your family milestones!" };
};

export default function ParentDashboard() {
  const [user, setUser] = useState(null);
  const [children, setChildren] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // --- WIDGET LOGIC MANAGEMENT STATES ---
  const [reminders, setReminders] = useState([
    { id: 1, text: "Sign permission slip for upcoming field trip", completed: false },
    { id: 2, text: "Review next week's textbook chapters", completed: true },
    { id: 3, text: "Settle upcoming school bus fees balance", completed: false }
  ]);
  const [newReminder, setNewReminder] = useState("");
  
  // --- UPGRADED HOURLY FORECAST STATES ---
  const [weather, setWeather] = useState({ temp: "--°C", status: "Locating... 🔍", emoji: "☀️", tip: "Resolving live school zone tracking variables.", fallback: false });
  const [hourlyForecast, setHourlyForecast] = useState([]); 
  const [weatherLoading, setWeatherLoading] = useState(true);

  // ============================================================================
  // WEATHER ENGINE CONTROLLER (GEOLOCATION 24H API)
  // ============================================================================
  const fetchLiveWeather = useCallback(() => {
    if (!navigator.geolocation) {
      setWeather(prev => ({ ...prev, status: "Unsupported browser", fallback: true }));
      setWeatherLoading(false);
      return;
    }

    setWeatherLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m,weathercode`
          );
          if (!res.ok) throw new Error("API Outage");
          const data = await res.json();
          
          // 1. Core Current Conditions
          const rawTemp = Math.round(data.current_weather.temperature);
          const currentMeta = parseWmoCode(data.current_weather.weathercode);
          
          setWeather({
            temp: `${rawTemp}°C`,
            status: currentMeta.status,
            emoji: currentMeta.emoji,
            tip: currentMeta.tip,
            fallback: false
          });

          // 2. Parse 24-Hour Forecast Array into next 5 upcoming hours
          const currentHourIndex = moment().hour(); 
          const shortTimeline = [];

          for (let i = 0; i < 5; i++) {
            const targetIndex = currentHourIndex + i;
            if (data.hourly && data.hourly.time[targetIndex]) {
              const timeString = data.hourly.time[targetIndex];
              const parsedMeta = parseWmoCode(data.hourly.weathercode[targetIndex]);
              
              shortTimeline.push({
                time: moment(timeString).format("h A"), 
                temp: `${Math.round(data.hourly.temperature_2m[targetIndex])}°C`,
                emoji: parsedMeta.emoji,
                status: parsedMeta.status
              });
            }
          }
          setHourlyForecast(shortTimeline);

        } catch (err) {
          setWeather({ 
            temp: "24°C", 
            status: "Offline Mode 🌤️", 
            emoji: "🌤️",
            tip: "Displaying generalized weather profiles. App is running optimally.",
            fallback: true 
          });
          setHourlyForecast([
            { time: "Now", temp: "24°C", emoji: "🌤️" },
            { time: "+1h", temp: "25°C", emoji: "☀️" },
            { time: "+2h", temp: "23°C", emoji: "☁️" },
            { time: "+3h", temp: "22°C", emoji: "🌧️" },
            { time: "+4h", temp: "23°C", emoji: "🌤️" },
          ]);
        } finally {
          setWeatherLoading(false);
        }
      },
      (error) => {
        setWeather({
          temp: "Locked",
          status: "Location Off",
          emoji: "🔒",
          tip: "Authorize location access for real-time local school commute alerts.",
          fallback: true
        });
        setWeatherLoading(false);
      },
      { timeout: 8000 }
    );
  }, []);

  useEffect(() => {
    fetchLiveWeather();
  }, [fetchLiveWeather]);

  // ============================================================================
  // DATABASE RETRIEVAL UTILS
  // ============================================================================
  const loadData = async () => {
    try {
      setLoading(true);
      const u = await base44.auth.me();
      setUser(u);

      const relationships = await base44.entities.ParentChildRelationship.filter({
        parent_id: u.id,
        status: ["active", "inactive"],
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
            return { ...c, name: "Student", avatar_emoji: "👦🏽", education_level: "Student" };
          }
        })
      );

      const rewardNested = await Promise.all(
        studentIds.map(sid =>
          base44.entities.RewardRequest.filter({ student_id: sid, status: "pending" })
        )
      );

      setChildren(enriched);
      setPendingRequests(rewardNested.flat());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
    const relationships = await base44.entities.ParentChildRelationship.filter({
  parent_id: u.id,
});

console.log("RELATIONSHIPS:", relationships);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUnlinkChild = async (childId, childName) => {
    if (!confirm(`Are you sure you want to disconnect ${childName}'s monitoring link?`)) return;
    try {
      const rel = await base44.entities.ParentChildRelationship.filter({
        parent_id: user.id,
        child_id: childId,
        status: ["active", "inactive"],
      });
      if (rel?.[0]) {
        await base44.entities.ParentChildRelationship.update(rel[0].id, { status: "inactive" });
      }
      toast({ title: "Child Disconnected", description: `${childName} unlinked successfully.` });
      loadData();
    } catch (err) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
  };

  // --- REMINDER MANAGEMENT INTERACTION LOOPS ---
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
      title: "Motivator Sent! ✨",
      description: `Sent a live celebratory sparkle notification directly to ${childName}'s learning interface!`,
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-3">
        <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-xs text-slate-400 font-semibold tracking-wide animate-pulse">Syncing Guardian Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 bg-slate-50/50 min-h-screen pb-24 selection:bg-indigo-100 text-slate-600 antialiased">
      
      {/* HEADER HERO ACTIONS CONTROLLER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
            Welcome Back, {user?.full_name || "Parent"} 👋
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">Real-time household study insights and system logs.</p>
        </div>
      </div>

      {/* CORE INTEGRATION MESH SYSTEM */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN MAIN INTERFACES */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* ACTION NEEDED STORE CONSOLE */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/60 shadow-sm">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
                <CheckSquare className="w-4 h-4 text-amber-500" />
              </div>
              <h2 className="font-black text-slate-800 text-sm tracking-tight">
                Pending Store Requests ({pendingRequests.length})
              </h2>
            </div>

            {pendingRequests.length === 0 ? (
              <p className="text-xs text-slate-400 font-medium bg-slate-50 border border-slate-100 p-3.5 rounded-2xl">
                ✨ No pending store item purchase request signatures found right now.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {pendingRequests.map(r => (
                  <div key={r.id} className="flex justify-between items-center text-xs p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/40 hover:border-slate-200 transition-colors">
                    <span className="font-bold text-slate-700 truncate max-w-[150px]">{r.reward_title}</span>
                    <span className="text-amber-700 font-black bg-amber-100/60 px-2.5 py-1 rounded-xl border border-amber-200/40 text-[11px] shrink-0">
                      {r.coin_cost} 🪙
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ACTIVE ATTACHED STUDENT MAPPER */}
          <div className="space-y-6">
            {children.length === 0 ? (
              <div className="bg-white p-8 rounded-3xl border border-dashed border-slate-200 text-center space-y-3">
                <div className="text-4xl">👥</div>
                <h3 className="font-bold text-slate-700 text-sm">No Student Profiles Connected</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">Link student profiles via your workspace directory tab to look over activity logs.</p>
              </div>
            ) : (
              children.map(child => (
                <ChildCard 
                  key={child.id} 
                  child={child} 
                  onUnlink={handleUnlinkChild} 
                  onSendKudos={triggerKudosReward}
                  
                />
              ))
            )}
          </div>
        </div>

        {/* RIGHT SIDEBAR MODULE CONTEXT PLATFORM */}
        <div className="space-y-6">
          
          {/* UPGRADED SUB-WIDGET 1: LIVE CONTEXT COMMUTE INTELLIGENCE WITH HOURLY TRACKER */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
                  <CloudSun className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-xs text-slate-800 tracking-wide uppercase">Commute Outlook</h3>
              </div>
              <button 
                onClick={fetchLiveWeather} 
                disabled={weatherLoading}
                className="text-[10px] text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors px-2 py-0.5 rounded-lg font-bold disabled:opacity-50"
              >
                {weatherLoading ? "Syncing..." : "Sync Local"}
              </button>
            </div>
            
            {/* MAIN CURRENT WEATHER DISPATCH */}
            <div className="flex items-center justify-between bg-gradient-to-br from-slate-50 to-slate-100/60 p-4 rounded-2xl border border-slate-100 shadow-inner">
              <div>
                {weatherLoading ? (
                  <div className="space-y-2 py-1">
                    <div className="h-6 w-14 bg-slate-200/80 animate-pulse rounded-lg" />
                    <div className="h-3 w-20 bg-slate-200/60 animate-pulse rounded-md" />
                  </div>
                ) : (
                  <>
                    <p className="text-2xl font-black tracking-tight text-slate-900">{weather.temp}</p>
                    <p className="text-xs font-bold text-slate-500 mt-0.5">{weather.status}</p>
                  </>
                )}
              </div>
              {weather.fallback && !weatherLoading ? (
                <div className="w-10 h-10 rounded-xl bg-slate-200/60 flex items-center justify-center text-slate-400">
                  <MapPinOff className="w-5 h-5" />
                </div>
              ) : (
                <span className="text-3xl shrink-0 filter drop-shadow">{weather.emoji}</span>
              )}
            </div>

            {/* HOURLY TIMELINE SCROLL */}
            {!weather.fallback && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Next 5 Hours</p>
                <div className="flex gap-2 overflow-x-auto pb-1.5 subtle-scrollbar scrollbar-none justify-between">
                  {weatherLoading ? (
                    Array(5).fill(0).map((_, idx) => (
                      <div key={idx} className="w-[58px] h-[68px] bg-slate-50 rounded-xl border border-slate-100 animate-pulse shrink-0" />
                    ))
                  ) : (
                    hourlyForecast.map((hour, idx) => (
                      <div 
                        key={idx} 
                        className={`flex flex-col items-center justify-center py-2 px-2.5 rounded-xl border shrink-0 text-center w-[58px] ${
                          idx === 0 
                            ? 'bg-indigo-50/60 border-indigo-100 text-indigo-900' 
                            : 'bg-slate-50/50 border-slate-100 text-slate-600'
                        }`}
                      >
                        <span className="text-[9px] font-bold text-slate-400 uppercase">{idx === 0 ? "Now" : hour.time}</span>
                        <span className="text-base my-1 filter drop-shadow-sm">{hour.emoji}</span>
                        <span className="text-[11px] font-black tracking-tight">{hour.temp}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
            
            {/* SYSTEM LOG METRIC TIPS FOR PARENTS */}
            <div className={`text-[11px] leading-relaxed p-3.5 rounded-2xl border ${weather.fallback ? 'bg-slate-50 border-slate-200/50 text-slate-500' : 'bg-amber-50/50 border-amber-200/40 text-amber-950 font-medium'}`}>
              <span className="font-bold">{weather.fallback ? "📋 Setup Notice:" : "💡 Commute Tip:"}</span> {weather.tip}
            </div>
          </div>

          {/* SUB-WIDGET 2: TIMELINE DISPATCH TRACKER */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-xs text-slate-800 tracking-wide uppercase">Today's Class Timelines</h3>
            </div>

            {children.length === 0 ? (
              <p className="text-xs text-slate-400 bg-slate-50 p-3 rounded-xl border border-slate-100">Attached student profiles map schedules here.</p>
            ) : (
              <div className="space-y-4">
                {children.map((child) => {
                  const latestSession = child.sessions?.[0];
                  return (
                    <div key={child.id} className="space-y-2 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs">{child.avatar_emoji}</span>
                        <p className="text-[11px] font-black text-slate-700 uppercase tracking-wider">{child.name}</p>
                      </div>

                      <div className="relative pl-3 border-l-2 border-indigo-500 ml-1.5 space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-800 truncate max-w-[150px]">
                            {latestSession?.topic_name || "Self Directed Study Blocks"}
                          </span>
                          <span className="font-extrabold text-[9px] tracking-wider text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded uppercase shrink-0">
                            ACTIVE
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400">Duration: {latestSession?.duration_minutes || "30"} mins active sequence</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SUB-WIDGET 3: NOTEBOOK LOG CHECKBOX TASKBOARD */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-sm space-y-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
                <CheckSquare className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-xs text-slate-800 tracking-wide uppercase">Domestic Admin Reminders</h3>
            </div>

            <form onSubmit={handleAddReminder} className="flex gap-2">
              <input 
                type="text" 
                value={newReminder}
                onChange={(e) => setNewReminder(e.target.value)}
                placeholder="Drop a private quick sticknote..." 
                className="flex-1 text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400 text-slate-800 font-medium transition-colors"
              />
              <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 rounded-xl transition-colors shrink-0">
                Add
              </button>
            </form>

            <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1 text-slate-600">
              <AnimatePresence initial={false}>
                {reminders.map((rem) => (
                  <motion.div 
                    key={rem.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ type: "spring", duration: 0.4 }}
                    className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-slate-50 transition-colors overflow-hidden"
                  >
                    <input 
                      type="checkbox" 
                      checked={rem.completed} 
                      onChange={() => handleToggleReminder(rem.id)}
                      className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20 w-3.5 h-3.5 shrink-0 cursor-pointer"
                    />
                    <span className={`text-xs leading-tight font-medium select-none cursor-pointer ${rem.completed ? "line-through text-slate-300 font-normal" : "text-slate-600"}`} onClick={() => handleToggleReminder(rem.id)}>
                      {rem.text}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

// ============================================================================
// INDIVIDUAL EXPANDED COMPONENT SCORECARD SUBSYSTEM
// ============================================================================
function ChildCard({ child, onUnlink, onSendKudos }) {
  const name = child?.name || "Student";
  const level = child?.progress?.level || 1;
  const xp = child?.progress?.total_xp || 0;
  const nextLevelXp = level * 200;
  const xpPercentage = Math.min((xp / nextLevelXp) * 100, 100);
  const avatarEmoji = child?.avatar_emoji || "👦🏽";
  const schoolTrack = child?.education_level || "Student";
  
  const streakDays = child?.progress?.streak_days || 0;
  const weeklyStudy = `${child?.weeklyMinutes || 0}m`;
  const walletCoins = child?.wallet?.balance || 0;

  const todayDateString = moment().format("YYYY-MM-DD");
  const todaysSessions = (child?.sessions || []).filter(s => moment(s.created_date).isSame(todayDateString, 'day'));
  const todayMinutes = todaysSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
  const todaySessionCount = todaysSessions.length;

  const latestSession = child?.sessions?.[0];
  const recentLesson = latestSession?.topic_name || "No active modules launched yet";
  const recentLessonTime = latestSession ? moment(latestSession.created_date).fromNow() : "--";

  const latestQuiz = child?.quizzes?.[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden"
    >
      {/* CARD TOP HEADER BANNER */}
      <div className="bg-gradient-to-b from-slate-50 to-white px-6 pt-5 pb-4 relative flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div className="w-14 h-14 rounded-2xl bg-white p-0.5 shadow-sm border border-slate-200 flex items-center justify-center text-2xl shrink-0">
            {avatarEmoji}
          </div>
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h2 className="text-base font-black text-slate-900 tracking-tight uppercase">
                {name}
              </h2>
              <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg border border-slate-200/40">
                {schoolTrack}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5 tracking-wide">ID ACC: ...{child.id?.slice(-6).toUpperCase()}</p>
          </div>
        </div>

        {/* INTERACTION ACTION CONTROLS */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-end">
          <button
            onClick={() => onSendKudos(name)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-amber-950 text-xs font-black rounded-xl shadow-sm transition-transform active:scale-95 shadow-amber-500/10"
          >
            <Heart className="w-3.5 h-3.5 fill-current text-rose-800/80" />
            <span>Send Spark Kudos</span>
          </button>

          <Button
            variant="ghost"
            size="icon"
            className="text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl w-9 h-9 border border-slate-100 shrink-0 transition-colors"
            onClick={() => onUnlink(child.id, name)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* PROGRESS EXPERIENCE CONTAINER BAR */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-600">
              <span>Grade Rank Level {level}</span>
              <span className="text-slate-200">•</span>
              <span className="text-slate-400 font-semibold">{xp} / {nextLevelXp} XP accumulated</span>
            </div>
            {xpPercentage >= 75 && (
              <div className="flex items-center gap-1 text-emerald-600 font-bold text-[10px] bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                <Award className="w-3 h-3 fill-current" /> Near Upgrade!
              </div>
            )}
          </div>
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner border border-slate-200/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${xpPercentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full"
            />
          </div>
        </div>

        {/* METRICS CORE TRACKING CONTAINER GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-sky-50/30 rounded-2xl border border-sky-100/50">
            <div className="flex items-center gap-1.5 text-sky-600 font-bold text-[10px] uppercase tracking-wider mb-1">
              <Target className="w-3.5 h-3.5" />
              <span>Today</span>
            </div>
            <p className="text-base font-black text-slate-900 tracking-tight">
              {todayMinutes}m <span className="text-[10px] font-semibold text-slate-400">({todaySessionCount}x)</span>
            </p>
          </div>

          <div className="p-3 bg-orange-50/30 rounded-2xl border border-orange-100/50">
            <div className="flex items-center gap-1.5 text-orange-600 font-bold text-[10px] uppercase tracking-wider mb-1">
              <Flame className="w-3.5 h-3.5" />
              <span>Streak</span>
            </div>
            <p className="text-base font-black text-slate-900 tracking-tight">{streakDays} Days</p>
          </div>

          <div className="p-3 bg-indigo-50/30 rounded-2xl border border-indigo-100/50">
            <div className="flex items-center gap-1.5 text-indigo-600 font-bold text-[10px] uppercase tracking-wider mb-1">
              <Clock className="w-3.5 h-3.5" />
              <span>7-Day Cycle</span>
            </div>
            <p className="text-base font-black text-slate-900 tracking-tight">{weeklyStudy}</p>
          </div>

          <div className="p-3 bg-amber-50/30 rounded-2xl border border-amber-100/50">
            <div className="flex items-center gap-1.5 text-amber-600 font-bold text-[10px] uppercase tracking-wider mb-1">
              <Coins className="w-3.5 h-3.5" />
              <span>Wallet Bank</span>
            </div>
            <p className="text-base font-black text-slate-900 tracking-tight">{walletCoins} 🪙</p>
          </div>
        </div>

        {/* LOWER SPLIT DETAILS PANEL ITEMS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="p-3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-50 to-slate-100/40 border border-slate-200/50 rounded-2xl flex items-center justify-between min-w-0">
            <div className="flex items-center gap-3 truncate">
              <div className="w-8 h-8 rounded-xl bg-white shadow-sm border border-slate-200/60 flex items-center justify-center shrink-0">
                <BookOpen className="w-3.5 h-3.5 text-slate-500" />
              </div>
              <div className="truncate">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Last Module Visited</p>
                <p className="text-xs font-bold text-slate-700 truncate" title={recentLesson}>{recentLesson}</p>
              </div>
            </div>
            <span className="text-[10px] font-semibold text-slate-400 shrink-0 ml-2 whitespace-nowrap">{recentLessonTime}</span>
          </div>

          {latestQuiz ? (
            <div className="p-3 bg-gradient-to-br from-emerald-50/30 to-teal-50/10 border border-emerald-100/60 rounded-2xl flex items-center justify-between min-w-0">
              <div className="flex items-center gap-3 truncate">
                <div className="w-8 h-8 rounded-xl bg-white shadow-sm border border-emerald-200 flex items-center justify-center shrink-0">
                  <Trophy className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div className="truncate">
                  <p className="text-[9px] font-bold text-emerald-600/80 uppercase tracking-wide">Latest Quiz Attempt</p>
                  <p className="text-xs font-bold text-slate-700 truncate" title={latestQuiz.topic_name}>{latestQuiz.topic_name || "Quiz Evaluation"}</p>
                </div>
              </div>
              <div className="shrink-0 ml-2 text-right whitespace-nowrap">
                <span className={`text-xs font-black ${latestQuiz.score >= 80 ? "text-emerald-600" : latestQuiz.score >= 50 ? "text-amber-600" : "text-red-500"}`}>
                  {latestQuiz.score}%
                </span>
                <p className="text-[9px] text-slate-400 mt-0.5">{moment(latestQuiz.created_date).fromNow(true)} ago</p>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-slate-50/40 border border-slate-200/40 rounded-2xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white shadow-sm border border-slate-200/40 flex items-center justify-center shrink-0 text-slate-300">
                🏆
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Latest Quiz Attempt</p>
                <p className="text-xs font-medium text-slate-400">No scores submitted yet</p>
              </div>
            </div>
          )}
        </div>

      </div>
    </motion.div>
  );
}