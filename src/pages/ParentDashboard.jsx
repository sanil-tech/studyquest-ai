import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import moment from "moment";
import { 
  TrendingUp, Users, Bell, Plus, BookOpen, 
  Target, ShieldAlert, Download, Flame, Sun, Coins
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getDisplayName } from "@/lib/utils"; 

// ---------------- KOMPONEN KAD CUACA ----------------
function WeatherCard() {
  return (
    <Card className="p-5 rounded-2xl shadow-sm border-sky-100 bg-gradient-to-br from-blue-50 to-sky-100 relative overflow-hidden">
      <div className="absolute -top-6 -right-6 opacity-20">
        <Sun className="w-24 h-24 text-amber-500" />
      </div>
      <div className="flex justify-between items-center relative z-10">
        <div>
          <p className="text-[10px] font-bold text-sky-600 uppercase tracking-wider mb-1">Cuaca Semasa</p>
          <div className="flex items-end gap-2">
            <h3 className="text-3xl font-black text-slate-800 leading-none">32°C</h3>
          </div>
          <p className="text-xs font-bold text-slate-600 mt-1.5">Cerah & Panas</p>
        </div>
        <div className="w-12 h-12 bg-white/60 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm">
          <Sun className="w-7 h-7 text-amber-500" />
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-sky-200/50 relative z-10">
        <p className="text-[11px] text-sky-800 font-medium leading-relaxed">
          Cuaca agak panas di luar. Ini adalah waktu yang sesuai untuk anak-anak berehat di rumah sambil menyiapkan misi <strong>StudyQuest</strong>! 🏡✨
        </p>
      </div>
    </Card>
  );
}

// ---------------- INDIVIDUAL CHILD CARD (DIKEMAS KINI DENGAN DATA SEBENAR) ----------------
function ChildCard({ child }) {
  // Mengambil metrik sebenar dari database
  const currentXP = child.progress?.xp_score || child.progress?.total_xp || 0;
  const currentLevel = child.progress?.level || 1;
  const streakDays = child.progress?.streak_days || 0;
  const currentCoins = child.wallet?.balance || 0;
  const currentTopic = child.progress?.current_topic || child.progress?.last_lesson_name || "Misi Belum Mula";
  
  const nextLevelXP = child.progress?.next_level_xp || (currentLevel * 500);
  const xpPercentage = Math.min(Math.round((currentXP / nextLevelXP) * 100), 100);
  const lastActive = child.last_active ? moment(child.last_active).fromNow() : "Baru aktif";

  const getDragonMilestone = (xp, lvl) => {
    if (xp >= 5000 || lvl >= 15) return { stageTitle: "Ancient Inferno", gradient: "from-rose-600 via-red-500 to-amber-400", glow: "rgba(239, 68, 68, 0.4)", icon: "🐉" };
    if (xp >= 1500 || lvl >= 6) return { stageTitle: "Emerald Drake", gradient: "from-emerald-500 via-teal-500 to-cyan-500", glow: "rgba(16, 185, 129, 0.3)", icon: "🐲" };
    return { stageTitle: "Ruby Hatchling", gradient: "from-purple-500 via-pink-500 to-rose-400", glow: "rgba(219, 39, 119, 0.2)", icon: "🦖" };
  };

  const milestone = getDragonMilestone(currentXP, currentLevel);
  const displayName = child.display_name || "Pelajar";

  return (
    <Card className="p-5 space-y-4 bg-white hover:shadow-xl transition-all border-slate-200 relative overflow-hidden group rounded-2xl">
      <div className="absolute top-3 right-3 flex items-center gap-1.5">
        <div className={`w-2 h-2 rounded-full ${child.last_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{lastActive}</span>
      </div>

      <div className="flex items-start gap-4">
        {/* AVATAR NAGA */}
        <div className="relative flex flex-col items-center justify-center p-1 select-none flex-shrink-0">
          <div style={{ perspective: "1000px" }} className="relative w-16 h-16 flex items-center justify-center">
            <motion.div animate={{ scale: [0.95, 1.15, 0.95], rotate: 360 }} transition={{ duration: 10, repeat: Infinity }} style={{ boxShadow: `0 0 20px ${milestone.glow}` }} className="absolute inset-0 rounded-full border border-dashed border-white/20 opacity-50" />
            <motion.div animate={{ y: [-4, 4, -4], rotateY: [-5, 5, -5] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className={`w-12 h-12 rounded-full bg-gradient-to-tr ${milestone.gradient} border-2 border-white shadow-md flex items-center justify-center relative z-10`}>
              <span className="text-2xl drop-shadow-lg">{milestone.icon}</span>
            </motion.div>
          </div>
          <span className="text-[9px] font-black text-slate-700 mt-1">{milestone.stageTitle}</span>
        </div>

        {/* INFO UTAMA & PROGRESS XP */}
        <div className="flex-grow space-y-1">
          <div className="flex items-center gap-2 mt-1">
            <h3 className="text-lg font-bold text-slate-800 leading-none">{displayName}</h3>
            <Badge variant="secondary" className="bg-blue-50 text-blue-600 text-[9px] font-bold px-1.5 py-0 h-4">Tahap {currentLevel}</Badge>
          </div>
          
          <div className="pt-2 space-y-1">
            <div className="flex justify-between items-center text-[10px]">
              <span className="font-bold text-slate-500">XP Terkumpul</span>
              <span className="font-extrabold text-slate-700">{currentXP} / {nextLevelXP}</span>
            </div>
            <Progress value={xpPercentage} className="h-1.5 bg-slate-100" />
          </div>
        </div>
      </div>

      {/* ANALISIS PINTAR (MENGGUNAKAN DATA SEBENAR) */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        <div className="bg-orange-50 p-2 rounded-lg border border-orange-100/50 flex flex-col items-center justify-center text-center">
          <Flame className="w-4 h-4 text-orange-500 mb-0.5" />
          <p className="text-sm font-black text-slate-700 leading-none">{streakDays}</p>
          <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">Hari Streak</p>
        </div>
        <div className="bg-amber-50 p-2 rounded-lg border border-amber-100/50 flex flex-col items-center justify-center text-center">
          <span className="text-sm font-bold mb-0.5">🪙</span>
          <p className="text-sm font-black text-slate-700 leading-none">{currentCoins}</p>
          <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">Baki Koin</p>
        </div>
        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 flex flex-col items-center justify-center text-center">
          <Target className="w-4 h-4 text-indigo-500 mb-0.5" />
          <p className="text-[9px] font-black text-slate-700 leading-tight line-clamp-1 w-full truncate px-1" title={currentTopic}>
            {currentTopic}
          </p>
          <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">Topik Semasa</p>
        </div>
      </div>

      {/* PARENTAL SUPERPOWERS */}
      <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
        <Button 
          size="sm" 
          variant="outline" 
          className="h-8 text-[10px] font-bold border-amber-200 text-amber-600 hover:bg-amber-50"
          onClick={(e) => { 
            e.preventDefault(); 
            alert(`🪙 Bonus koin sedia dihantar kepada ${displayName}!`); 
          }}
        >
          🪙 Beri Bonus Koin
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          className="h-8 text-[10px] font-bold border-indigo-200 text-indigo-600 hover:bg-indigo-50"
          onClick={(e) => { 
            e.preventDefault(); 
            alert(`🎯 Borang misi khas dunia sebenar untuk ${displayName} dibuka!`); 
          }}
        >
          🎯 Cipta Misi Khas
        </Button>
      </div>
    </Card>
  );
}

// ================= MAIN DASHBOARD =================
export default function ParentDashboard() {
  const { toast } = useToast();
  const [children, setChildren] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // ---------------- LOAD DATA SINKRONISASI ----------------
  const loadData = async () => {
    try {
      setLoading(true);
      const u = await base44.auth.me();
      
      const rel = await base44.entities.ParentChildRelationship.filter({ 
        parent_id: u.id, 
        status: ["active", "pending"] 
      });
      
      if (!rel.length) return setLoading(false);

      const childIds = rel.map(r => r.child_id);
      const kids = await Promise.all(
        childIds.map(async (id) => {
          const [progress, wallet] = await Promise.all([
            base44.entities.Progress.filter({ student_id: id }),
            base44.entities.Wallet.filter({ student_id: id }),
          ]);
          
          const childUser = await base44.entities.User.get(id).catch(() => null);
          
          return { 
            id, 
            ...childUser, 
            display_name: getDisplayName(childUser),
            progress: progress?.[0] || {}, 
            wallet: wallet?.[0] || { balance: 0 } 
          };
        })
      );

      const pending = await base44.entities.RewardRequest.filter({ status: "pending" });
      setChildren(kids);
      setPendingRequests(pending);
    } catch (err) {
      console.error(err);
      toast({ title: "Ralat", description: "Gagal memuatkan data.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  if (loading) return <div className="flex justify-center min-h-[50vh] items-center"><div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /></div>;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto bg-slate-50/50 min-h-screen">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            Pusat Kawalan Ibu Bapa 🛡️
          </h1>
          <p className="text-muted-foreground text-sm font-medium">
            Pantau, sokong, dan beri ganjaran kepada wira kecil anda.
          </p>
        </div>
        <Link to="/parent/children">
          <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md rounded-xl">
            <Plus className="w-4 h-4" /> Tambah Anak
          </Button>
        </Link>
      </div>

      {/* PROACTIVE ALERTS */}
      {children.length > 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-rose-50 border border-orange-100 p-4 rounded-2xl shadow-sm flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-orange-500 mt-0.5 animate-pulse" />
          <div>
            <h4 className="text-sm font-bold text-orange-800">Perhatian Pintar StudyQuest</h4>
            <p className="text-xs text-orange-600/80 font-medium mt-1">
              🔥 <strong>{children[0]?.display_name}</strong> belum mendaftar masuk hari ini. Tinggal beberapa jam sahaja lagi sebelum pencapaian *streak* harian tamat!
            </p>
          </div>
          <Button size="sm" className="ml-auto bg-orange-500 hover:bg-orange-600 text-[10px] h-7 rounded-lg">Kirim Peringatan</Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SEKSYEN KAD ANAK-ANAK (KIRI) */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
            Anak-anak Saya
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {children.length === 0 ? (
              <Card className="p-8 text-center text-slate-400 col-span-2 rounded-2xl border-dashed">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium">Belum ada profil pelajar yang disambungkan.</p>
              </Card>
            ) : (
              children.map(c => (
                <Link key={c.id} to={`/parent/children/${c.id}`} className="block">
                  <ChildCard child={c} />
                </Link>
              ))
            )}
          </div>
        </div>

        {/* SEKSYEN SISI (KANAN) */}
        <div className="space-y-6">
          
          <WeatherCard />
          
          <Card className="p-5 rounded-2xl shadow-sm border-slate-200">
            <h2 className="font-bold text-sm text-slate-800 mb-4 flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-500" /> Tuntutan Ganjaran Belum Semak
              {pendingRequests.length > 0 && <Badge className="bg-amber-100 text-amber-700 text-[10px] ml-auto">{pendingRequests.length}</Badge>}
            </h2>
            {pendingRequests.length === 0 ? (
              <p className="text-slate-400 text-xs text-center p-4 border border-dashed rounded-xl">Tiada permintaan tertunggak.</p>
            ) : (
              <div className="space-y-2">
                {pendingRequests.map(r => (
                  <div key={r.id} className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-slate-700">{r.reward_title}</p>
                      <p className="text-[10px] text-amber-600 font-medium">Kos: {r.coin_cost} 🪙</p>
                    </div>
                    <Button size="sm" className="h-7 text-[10px] bg-emerald-500 hover:bg-emerald-600">Lulus</Button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-5 rounded-2xl shadow-sm border-indigo-100 bg-gradient-to-b from-white to-indigo-50/30">
            <h2 className="font-bold text-sm text-indigo-900 mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-500" /> Sudut Bantuan Ibu Bapa
            </h2>
            <div className="space-y-3">
              <div className="bg-white p-3 rounded-xl border border-indigo-50 shadow-sm">
                <p className="text-[10px] font-bold text-indigo-400 uppercase mb-1">Tips Topik Semasa</p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Cuba kaitkan pembelajaran terkini anak anda dengan persekitaran harian (seperti ketika memasak atau membeli-belah) untuk menguatkan memori praktikal mereka.
                </p>
              </div>
              <Button variant="outline" className="w-full text-xs font-bold text-indigo-600 border-indigo-200 hover:bg-indigo-50 gap-2 h-9">
                <Download className="w-3.5 h-3.5" /> Muat Turun Lembaran Kerja
              </Button>
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
}