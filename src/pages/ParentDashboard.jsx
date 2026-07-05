import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import moment from "moment";
import { 
  Users, Plus, Target, Sun, RefreshCw, Gift, CheckCircle2, 
  Coins, Settings, BarChart2, CloudRain, MapPin, Clock, ArrowRight, Activity
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getDisplayName } from "@/lib/utils"; 

// ---------------- 1. COMPACT CHILD OVERVIEW CARD (No Redundancy) ----------------
function CompactChildCard({ child }) {
  const navigate = useNavigate();
  
  const currentXP = child.progress?.xp_score || 0;
  const nextLevelXP = child.progress?.next_level_xp || 500;
  const xpPercentage = Math.min(Math.round((currentXP / nextLevelXP) * 100), 100);
  const displayName = child.display_name || "Pelajar";
  
  // Status real-time daripada aktiviti sebenar
  const lastActiveTime = child.last_active ? `Aktif ${moment(child.last_active).fromNow()}` : "Tiada rekod aktif";
  const currentLesson = child.progress?.current_topic || "Tiada subjek aktif";

  return (
    <Card 
      onClick={() => navigate(`/parent/children`)} // Klik di mana-mana terus ke page mychildren
      className="p-4 bg-white border border-slate-100 hover:border-indigo-200 shadow-sm hover:shadow-md transition-all rounded-2xl cursor-pointer flex flex-col justify-between group"
    >
      <div className="space-y-3">
        {/* Top Meta */}
        <div className="flex justify-between items-center text-[10px]">
          <span className="flex items-center gap-1 text-slate-400 font-medium">
            <Clock className="w-3 h-3 text-slate-400" /> {lastActiveTime}
          </span>
          <span className="text-indigo-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
            Lihat Laporan <ArrowRight className="w-3 h-3" />
          </span>
        </div>

        {/* Profil Mini */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100 font-text text-xl">
            🦖
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-slate-800 uppercase truncate">{displayName}</h3>
            <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
              📚 {currentLesson}
            </p>
          </div>
        </div>

        {/* Ringkasan Kemajuan / Progress Bar */}
        <div className="space-y-1 pt-1">
          <div className="flex justify-between items-center text-[10px] font-medium text-slate-400">
            <span>Progress Tahap {child.progress?.level || 1}</span>
            <span className="font-bold text-slate-600">{xpPercentage}%</span>
          </div>
          <Progress value={xpPercentage} className="h-1.5 bg-slate-100 rounded-full" />
        </div>
      </div>
    </Card>
  );
}

// ---------------- 2. REAL-TIME ACTIVITY & APPROVAL FEED ----------------
function ActionRequiredFeed({ requests, onApprove }) {
  return (
    <Card className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
      <div className="flex items-center gap-2 mb-3 border-b border-slate-50 pb-2">
        <Activity className="w-4 h-4 text-rose-500" />
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Tindakan Segera Ibu Bapa</h3>
      </div>
      
      {requests.length === 0 ? (
        <p className="text-xs text-slate-400 py-4 text-center">Semua tuntutan ganjaran dan tugasan telah disahkan. Bagus! ✨</p>
      ) : (
        <div className="space-y-2.5">
          {requests.map(r => (
            <div key={r.id} className="bg-slate-50/70 rounded-xl p-3 flex items-center justify-between gap-3 border border-slate-100">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-800 leading-snug">
                  {r.child_name} <span className="font-medium text-slate-600">menuntut</span> "{r.reward_title}"
                </p>
                <span className="text-[10px] text-amber-600 font-bold flex items-center gap-0.5 mt-1">
                  <Coins className="w-3 h-3" /> {r.coin_cost} Koin diperlukan
                </span>
              </div>
              <Button 
                size="sm" 
                className="h-7 px-3 text-[10px] bg-emerald-500 hover:bg-emerald-600 rounded-lg text-white font-bold shrink-0"
                onClick={() => onApprove(r.id, r.reward_title)}
              >
                Sahkan
              </Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ---------------- 3. UTILITY COMPONENT (WEATHER & TIPS SIMPLIFIED) ----------------
function WeatherCard() {
  return (
    <Card className="p-4 rounded-2xl shadow-sm border-sky-100 bg-gradient-to-br from-blue-50 to-sky-100 flex justify-between items-center">
      <div>
        <div className="flex items-center gap-1 text-sky-600 text-[10px] font-bold uppercase tracking-wider mb-0.5">
          <MapPin className="w-3 h-3" /> Kota Kinabalu
        </div>
        <h3 className="text-2xl font-black text-slate-800">30°c <span className="text-xs font-bold text-blue-500 ml-1">Hujan</span></h3>
      </div>
      <div className="w-10 h-10 bg-white/80 rounded-xl flex items-center justify-center shadow-2xs">
        <CloudRain className="w-5 h-5 text-blue-500" />
      </div>
    </Card>
  );
}

function ShortcutCard({ icon: Icon, title, desc, gradient, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`bg-gradient-to-br ${gradient} p-3 rounded-xl shadow-xs flex items-center gap-3 text-white justify-start w-full border border-white/5`}
    >
      <div className="bg-white/20 p-2 rounded-lg shrink-0"><Icon className="w-4 h-4" /></div>
      <div className="text-left flex-1 min-w-0">
        <p className="text-xs font-bold truncate">{title}</p>
        <p className="text-[9px] text-white/80 truncate">{desc}</p>
      </div>
    </motion.button>
  );
}

// ---------------- 4. MAIN PARENT DASHBOARD ----------------
export default function ParentDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [children, setChildren] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulasi data bersih sepadan dengan database sebenar anda
    const mockKids = [
      { id: "1", display_name: "IVANOVIC", last_active: new Date(Date.now() - 1000 * 60 * 30), progress: { level: 1, xp_score: 195, next_level_xp: 500, current_topic: "People & Culture (Lanjutan)" } },
      { id: "2", display_name: "CORRY A...", last_active: new Date(Date.now() - 1000 * 60 * 120), progress: { level: 2, xp_score: 260, next_level_xp: 1000, current_topic: "Misi Belum Mula" } },
      { id: "3", display_name: "MORRY", last_active: null, progress: { level: 2, xp_score: 295, next_level_xp: 1000, current_topic: "Kuiz Sains Harian" } }
    ];
    
    const mockRequests = [
      { id: "req-1", child_name: "IVANOVIC", reward_title: "Main Game 30 Minit", coin_cost: 300 }
    ];

    setChildren(mockKids);
    setPendingRequests(mockRequests);
    setLoading(false);
  }, []);

  const handleApprove = (id, title) => {
    toast({ title: "Berjaya Disahkan! 🎉", description: `Tuntutan untuk "${title}" telah diluluskan.` });
    setPendingRequests(prev => prev.filter(r => r.id !== id));
  };

  if (loading) return <div className="p-6 text-center text-xs text-slate-400">Memuatkan dashboard...</div>;

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-7xl mx-auto bg-slate-50/40 min-h-screen">
      
      {/* HEADER UTAMA */}
      <div className="flex justify-between items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">Pusat Kawalan Ibu Bapa 🛡️</h1>
          <p className="text-slate-500 text-xs">Aktiviti semasa, kelulusan segera, dan status ringkas anak anda.</p>
        </div>
        <Button size="sm" className="bg-indigo-600 text-white rounded-xl font-bold text-xs h-9 px-3.5 shadow-xs" onClick={() => navigate("/parent/children")}>
          <Plus className="w-3.5 h-3.5 mr-1" /> Urus Anak
        </Button>
      </div>

      {/* PINTASAN PANEL ATAS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <ShortcutCard icon={Gift} title="Ganjaran" desc="Urus kedai hadiah" gradient="from-pink-500 to-rose-400" onClick={() => navigate("/parent/rewards")} />
        <ShortcutCard icon={BarChart2} title="Analitik" desc="Prestasi penuh anak" gradient="from-blue-500 to-cyan-500" onClick={() => navigate("/parent/children")} />
        <ShortcutCard icon={Target} title="Misi Baru" desc="Beri tugasan khas" gradient="from-emerald-500 to-teal-400" onClick={() => navigate("/parent/children")} />
        <ShortcutCard icon={Settings} title="Tetapan" desc="Kawalan akaun & had" gradient="from-slate-700 to-slate-500" onClick={() => toast({ title: "Modul Tetapan" })} />
      </div>

      {/* STRUKTUR GRID BARU DASHBOARD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* LAJUR KIRI: STATUS RINGKAS & NOTIFIKASI TUGASAN (8/12) */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Kelulusan Segera */}
          <ActionRequiredFeed requests={pendingRequests} onApprove={handleApprove} />

          {/* Senarai Profil Ringkas */}
          <div className="space-y-2.5">
            <div className="flex justify-between items-center px-0.5">
              <h2 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" /> Ringkasan Aktiviti Anak
              </h2>
              <Link to="/parent/children" className="text-xs font-bold text-indigo-600 hover:underline">
                Lihat Laporan Penuh &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {children.map((child) => (
                <CompactChildCard key={child.id} child={child} />
              ))}
            </div>
          </div>

        </div>

        {/* LAJUR KANAN: UTALITI UTAMA (4/12) */}
        <div className="lg:col-span-4 space-y-4">
          <WeatherCard />
          <Card className="p-4 bg-gradient-to-r from-indigo-900 to-purple-900 text-white rounded-2xl border-0 shadow-xs">
            <Badge className="bg-white/20 text-white mb-2 text-[9px] border-0">Tips Hari Ini</Badge>
            <h4 className="text-xs font-bold mb-1">Pujian 'Growth Mindset' 🌱</h4>
            <p className="text-[11px] text-indigo-100 leading-relaxed">
              Puji usaha anak, bukan bakat semula jadinya. Contoh: *"Ibu bangga tengok kamu fokus selesaikan kuiz sukar tadi!"*
            </p>
          </Card>
        </div>

      </div>
    </div>
  );
}