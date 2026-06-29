import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useParams, Link } from "react-router-dom";
import { 
  TrendingUp, 
  Award, 
  Clock, 
  AlertTriangle, 
  CloudSun, 
  CheckSquare, 
  CalendarDays, 
  ChevronRight, 
  Heart, 
  Sparkles, 
  User 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ParentDashboard() {
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [childProgress, setChildProgress] = useState({ subjects: [], analytics: {} });
  const [loading, setLoading] = useState(true);
  
  // --- MINI WEB WIDGETS STATE ---
  const [reminders, setReminders] = useState([
    { id: 1, text: "Sign permission slip for field trip", completed: false },
    { id: 2, text: "Check science project checklist", completed: true },
    { id: 3, text: "Renew learning subscription next Monday", completed: false }
  ]);
  const [newReminder, setNewReminder] = useState("");
  const [weather, setWeather] = useState({ temp: "31°C", status: "Passing Showers 🌦️", tip: "Pack an umbrella for school pickup!" });
  
  // Simulated school timeline schedule
  const currentSchedule = [
    { time: "08:00 AM", subject: "Mathematics", room: "Online Lab", status: "done" },
    { time: "10:15 AM", subject: "Bahasa Melayu", room: "Main Room", status: "active" },
    { time: "02:00 PM", subject: "Science Quest", room: "Interactive", status: "upcoming" }
  ];

  useEffect(() => {
    const loadParentData = async () => {
      try {
        // Fetch children managed by this account
        const kids = await base44.entities.Student.list();
        setChildren(kids);
        
        if (kids.length > 0) {
          const firstChild = kids[0];
          setSelectedChild(firstChild);
          await loadChildMetrics(firstChild.id);
        }
      } catch (err) {
        console.error("Error loading profile details:", err);
      } finally {
        setLoading(false);
      }
    };
    loadParentData();
  }, []);

  const loadChildMetrics = async (studentId) => {
    setLoading(true);
    // Fetch individual metrics, analytics frameworks, and progress markers
    const progressData = await base44.entities.Progress.filter({ student_id: studentId });
    setChildProgress({
      subjects: progressData || [],
      analytics: { screenTime: "1h 15m", completedQuests: 12, criticalReview: "Fractions & Decimals" }
    });
    setLoading(false);
  };

  const handleSelectChild = async (child) => {
    setSelectedChild(child);
    await loadChildMetrics(child.id);
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

  const triggerKudosReward = () => {
    alert(`🎉 Awesome! A 'Superstar Star Sparkleburst' badge and matching pop-up celebration has been sent straight to ${selectedChild.name}'s study view!`);
  };

  if (loading && children.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-500 animate-pulse">Synchronizing Family Command Center...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 bg-slate-50/50 min-h-screen pb-24">
      
      {/* HEADER BAR & KIDS TOGGLER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm">
        <div>
          <h1 className="text-2xl font-heading font-black text-slate-800 tracking-tight">Family Hub Dashboard 🏠</h1>
          <p className="text-sm text-slate-500 mt-0.5">Stay connected with your child's daily habits and milestones.</p>
        </div>
        
        {/* Child Selector Badges */}
        <div className="flex flex-wrap gap-2">
          {children.map((child) => (
            <button
              key={child.id}
              onClick={() => handleSelectChild(child)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all shadow-sm ${
                selectedChild?.id === child.id
                  ? "bg-indigo-600 text-white ring-2 ring-indigo-600/20"
                  : "bg-white hover:bg-slate-50 border border-slate-200 text-slate-700"
              }`}
            >
              <User className="w-4 h-4 opacity-80" />
              <span>{child.name}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${selectedChild?.id === child.id ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-100 text-slate-500'}`}>
                {child.education_level || child.school_year || "Student"}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* DASHBOARD GRID TIMELINE PLATFORM */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT & CENTER FIELDS: LEARNING PROGRESS & QUICK INSIGHTS */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* CELEBRATE / ENGAGEMENT PANEL */}
          <div className="bg-gradient-to-r from-amber-400/20 via-pink-400/10 to-indigo-400/20 rounded-3xl p-6 border-2 border-dashed border-amber-300/60 relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-1 text-amber-700 font-extrabold text-[10px] uppercase tracking-widest bg-amber-400/30 px-2.5 py-0.5 rounded-full w-max">
                <Sparkles className="w-3 h-3 fill-current" /> Instant Motivation Loop
              </div>
              <h3 className="text-lg font-heading font-black text-slate-800">Cheer on {selectedChild?.name || "your child"}!</h3>
              <p className="text-xs text-slate-600 max-w-md">Notice them studying right now? Push a real-time reward sticker onto their interface instantly!</p>
            </div>
            <button 
              onClick={triggerKudosReward}
              className="w-full sm:w-auto shrink-0 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 group"
            >
              <Heart className="w-4 h-4 text-rose-400 fill-current group-hover:scale-110 transition-transform" />
              <span>Send Sparkle Kudos</span>
            </button>
          </div>

          {/* ACTIVE ANALYTICS SUMMARY CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Active Study</p>
                <p className="text-lg font-black text-slate-800">{childProgress.analytics.screenTime || "0m"}</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Quests Beaten</p>
                <p className="text-lg font-black text-slate-800">{childProgress.analytics.completedQuests || 0} Topics</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Needs Review</p>
                <p className="text-xs font-bold text-slate-700 truncate max-w-[140px]" title={childProgress.analytics.criticalReview}>
                  {childProgress.analytics.criticalReview || "All Clear!"}
                </p>
              </div>
            </div>
          </div>

          {/* CORE SUBJECT PROGRESS ROADMAP */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-heading font-black text-slate-800 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-500" />
                <span>Subject Roadmap Progress</span>
              </h2>
              <span className="text-xs font-semibold text-slate-400">Synced Real-Time</span>
            </div>

            {childProgress.subjects.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-xs text-slate-400 font-medium">No courses tracked yet this semester. Check back once courses are initialized.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {childProgress.subjects.map((sub) => {
                  const percentComplete = sub.completion_rate || 0;
                  return (
                    <div key={sub.id} className="p-3 bg-slate-50/60 rounded-xl border border-slate-100 flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="font-bold text-xs text-slate-800 truncate">{sub.subject_name}</p>
                          <span className="text-[11px] font-black text-indigo-600">{percentComplete}%</span>
                        </div>
                        {/* Custom Progress Track Slider Bar */}
                        <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${percentComplete}%` }} />
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: THE WEB MINI WIDGET CARDS MODULE CONTAINER */}
        <div className="space-y-6">
          
          {/* MINI CARD 1: WEATHER & SCHOOL COMMUTE INSIGHT */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                  <CloudSun className="w-4 h-4" />
                </div>
                <h3 className="font-heading font-black text-xs text-slate-800 uppercase tracking-wider">Local Weather Cabinet</h3>
              </div>
              <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold">Live Context</span>
            </div>
            
            <div className="flex items-center justify-between pt-1">
              <div>
                <p className="text-2xl font-black text-slate-800 tracking-tight">{weather.temp}</p>
                <p className="text-xs font-semibold text-slate-500">{weather.status}</p>
              </div>
              <span className="text-3xl">🌦️</span>
            </div>
            
            <p className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200/60 p-2.5 rounded-xl">
              💡 <span className="font-medium text-amber-900">{weather.tip}</span>
            </p>
          </div>

          {/* MINI CARD 2: TODAY'S SCHEDULE TIMELINE TRACKER */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <h3 className="font-heading font-black text-xs text-slate-800 uppercase tracking-wider">Today's Live Tracker</h3>
              </div>
            </div>

            <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
              {currentSchedule.map((item, idx) => (
                <div key={idx} className="flex gap-3 items-start relative pl-1">
                  {/* Custom Bullet Marker */}
                  <div className={`w-4 h-4 rounded-full border-4 bg-white z-10 mt-0.5 shrink-0 ${
                    item.status === 'active' ? 'border-indigo-500 ring-4 ring-indigo-500/10' :
                    item.status === 'done' ? 'border-slate-300' : 'border-slate-200'
                  }`} />
                  
                  <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                    <div>
                      <p className={`font-bold text-xs ${item.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                        {item.subject}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium">{item.time} · {item.room}</p>
                    </div>
                    {item.status === 'active' && (
                      <span className="text-[9px] font-bold bg-indigo-500 text-white px-1.5 py-0.5 rounded-md animate-pulse">
                        LIVE NOW
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* MINI CARD 3: STICKY TASK REMINDERS FOR PARENTS */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center">
                <CheckSquare className="w-4 h-4" />
              </div>
              <h3 className="font-heading font-black text-xs text-slate-800 uppercase tracking-wider">Parent Sticky Reminders</h3>
            </div>

            <form onSubmit={handleAddReminder} className="flex gap-1.5">
              <input 
                type="text" 
                value={newReminder}
                onChange={(e) => setNewReminder(e.target.value)}
                placeholder="Add domestic admin note..." 
                className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-300 placeholder:text-slate-400 text-slate-700"
              />
              <button type="submit" className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3 py-2 rounded-xl transition-colors">
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
                    className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50/60 transition-colors"
                  >
                    <input 
                      type="checkbox" 
                      checked={rem.completed} 
                      onChange={() => handleToggleReminder(rem.id)}
                      className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20"
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