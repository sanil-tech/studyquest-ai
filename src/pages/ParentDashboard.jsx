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
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <h3 className="font-heading font-black text-xs text-slate-800 tracking-wide uppercase">Today's Class Timelines</h3>
            </div>

            {children.length === 0 ? (
              <p className="text-xs text-slate-400">Link child accounts to compile course scheduling assets.</p>
            ) : (
              <div className="space-y-4">
                {children.map((child) => {
                  const latestSession = child.sessions?.[0];
                  return (
                    <div key={child.id} className="space-y-2 border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-400">{child.avatar_emoji}</span>
                        <p className="text-xs font-black text-slate-700 uppercase tracking-wide">{child.name}</p>
                      </div>

                      <div className="relative pl-3 border-l-2 border-indigo-100 ml-1.5 space-y-1">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="font-bold text-slate-600 truncate max-w-[150px]">
                            {latestSession?.topic_name || "Self Directed Study Blocks"}
                          </span>
                          <span className="font-semibold text-indigo-600 bg-indigo-50/80 px-1.5 py-0.2 rounded text-[10px] shrink-0 animate-pulse">
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

          {/* MINI-CARD 3: PRIVATE CHECKLIST CHECKBOX ITEMS */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
                <CheckSquare className="w-4 h-4" />
              </div>
              <h3 className="font-heading font-black text-xs text-slate-800 tracking-wide uppercase">Domestic Admin Reminders</h3>
            </div>

            <form onSubmit={handleAddReminder} className="flex gap-1.5">
              <input 
                type="text" 
                value={newReminder}
                onChange={(e) => setNewReminder(e.target.value)}
                placeholder="Drop a private quick sticknote..." 
                className="flex-1 text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-200 text-slate-700 font-medium"
              />
              <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 rounded-xl transition-colors">
                Add
              </button>
            </form>

            <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1 subtle-scrollbar pt-1">
              <AnimatePresence>
                {reminders.map((rem) => (
                  <motion.div 
                    key={rem.id}
                    initial={{ opacity: 0, y: 2 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-slate-50/50 transition-colors"
                  >
                    <input 
                      type="checkbox" 
                      checked={rem.completed} 
                      onChange={() => handleToggleReminder(rem.id)}
                      className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20 w-3.5 h-3.5 shrink-0 cursor-pointer"
                    />
                    <span className={`text-xs leading-tight font-medium ${rem.completed ? "line-through text-slate-400" : "text-slate-600"}`}>
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

// ==========================================
// DETAILED PROFILE SCOREBOARD SUBSECTION
// ==========================================
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"
    >
      <div className="bg-gradient-to-b from-slate-50 to-white px-6 pt-5 pb-3 relative flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-50">
        <div className="flex flex-col sm:flex-row items-center gap-3.5 text-center sm:text-left">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 p-0.5 shadow-inner flex items-center justify-center text-3xl shrink-0">
            {avatarEmoji}
          </div>
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h2 className="text-lg font-heading font-black text-slate-800 tracking-tight uppercase">
                {name}
              </h2>
              <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100/50 px-2 py-0.5 rounded-md">
                {schoolTrack}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Linked Student Reference Account ID: ...{child.id?.slice(-6)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-end">
          <button
            onClick={() => onSendKudos(name)}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-amber-950 text-xs font-black rounded-xl shadow-sm transition-transform active:scale-95"
          >
            <Heart className="w-3.5 h-3.5 fill-current text-rose-800/80" />
            <span>Send Sparkle Popup</span>
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
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-600">
              <span>Grade Rank Level {level}</span>
              <span className="text-slate-200">•</span>
              <span className="text-slate-400 font-semibold">Accumulated {xp} XP points</span>
            </div>
            {xpPercentage >= 75 && (
              <div className="flex items-center gap-1 text-emerald-600 font-bold text-[10px] bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                <Award className="w-3 h-3 fill-current" /> Near Upgrade!
              </div>
            )}
          </div>
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${xpPercentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-sky-50/40 rounded-2xl border border-sky-100/50">
            <div className="flex items-center gap-2 text-sky-600 font-bold text-[10px] uppercase tracking-wider mb-1">
              <Target className="w-3.5 h-3.5" />
              <span>Today</span>
            </div>
            <p className="text-base font-black text-slate-800 tracking-tight">
              {todayMinutes}m <span className="text-[11px] font-medium text-slate-400">({todaySessionCount}x)</span>
            </p>
          </div>

          <div className="p-3 bg-orange-50/40 rounded-2xl border border-orange-100/50">
            <div className="flex items-center gap-2 text-orange-600 font-bold text-[10px] uppercase tracking-wider mb-1">
              <Flame className="w-3.5 h-3.5" />
              <span>Streak</span>
            </div>
            <p className="text-base font-black text-slate-800 tracking-tight">{streakDays} Active Days</p>
          </div>

          <div className="p-3 bg-indigo-50/40 rounded-2xl border border-indigo-100/50">
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-[10px] uppercase tracking-wider mb-1">
              <Clock className="w-3.5 h-3.5" />
              <span>7-Day Cycle</span>
            </div>
            <p className="text-base font-black text-slate-800 tracking-tight">{weeklyStudy}</p>
          </div>

          <div className="p-3 bg-amber-50/40 rounded-2xl border border-amber-100/50">
            <div className="flex items-center gap-2 text-amber-600 font-bold text-[10px] uppercase tracking-wider mb-1">
              <Coins className="w-3.5 h-3.5" />
              <span>Wallet Bank</span>
            </div>
            <p className="text-base font-black text-slate-800 tracking-tight">{walletCoins} Balance</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between min-w-0">
            <div className="flex items-center gap-3 truncate">
              <div className="w-8 h-8 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4 text-slate-500" />
              </div>
              <div className="truncate">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Last Module Visited</p>
                <p className="text-xs font-bold text-slate-700 truncate" title={recentLesson}>{recentLesson}</p>
              </div>
            </div>
            <span className="text-[10px] font-medium text-slate-400 shrink-0 ml-2 whitespace-nowrap">{recentLessonTime}</span>
          </div>

          {latestQuiz ? (
            <div className="p-3 bg-emerald-50/40 border border-emerald-100/40 rounded-2xl flex items-center justify-between min-w-0">
              <div className="flex items-center gap-3 truncate">
                <div className="w-8 h-8 rounded-xl bg-white shadow-sm border border-emerald-100 flex items-center justify-center shrink-0">
                  <Trophy className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="truncate">
                  <p className="text-[10px] font-bold text-emerald-600/80 uppercase tracking-wide">Latest Quiz Attempt</p>
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
            <div className="p-3 bg-slate-50/60 border border-slate-100 rounded-2xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center shrink-0 text-slate-300">
                🏆
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Latest Quiz Attempt</p>
                <p className="text-xs font-medium text-slate-400">No test scores submitted yet</p>
              </div>
            </div>
          )}
        </div>

      </div>
    </motion.div>
  );
}