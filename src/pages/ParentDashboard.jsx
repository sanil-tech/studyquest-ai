import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import moment from "moment";
import { 
  TrendingUp, Users, Bell, Plus, BookOpen, 
  Target, ShieldAlert, Flame, Sun, 
  X, Lightbulb, Quote, RefreshCw, 
  Gift, CheckCircle2, Coins, Settings, BarChart2,
  Cloud, CloudRain, CloudLightning, CloudSun, Loader2, MapPin, Clock
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getDisplayName } from "@/lib/utils"; 

// ---------------- 1. KOMPONEN TIPS KEIBUBAPAAN ----------------
function SmartParentingTips() {
  const [tipIndex, setTipIndex] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const tipsFeed = [
    {
      category: "Psikologi Pembelajaran",
      title: "Pujian 'Growth Mindset' 🌱",
      content: "Puji usaha, bukan kecerdasan. Daripada berkata 'Kamu sangat pandai!', tukar kepada 'Ibu bangga melihat kamu berusaha keras menyelesaikan soalan susah ini!'. Ini membina daya tahan.",
      source: "Jurnal Pendidikan Kognitif, 2024"
    },
    {
      category: "Fokus & Produktiviti",
      title: "Teknik Belajar Pomodoro ⏱️",
      content: "Kanak-kanak bawah 12 tahun biasanya hilang fokus selepas 20-30 minit. Bahagikan masa belajar mereka: 25 minit fokus penuh, 5 minit rehat aktif.",
      source: "Neuroscience Today"
    }
  ];

  const getNextTip = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setTipIndex((prev) => (prev + 1) % tipsFeed.length);
      setIsRefreshing(false);
    }, 400); 
  };

  const currentTip = tipsFeed[tipIndex];

  return (
    <Card className="border-0 shadow-lg rounded-2xl bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-900 text-white overflow-hidden relative">
      <div className="p-5 flex flex-col gap-4 relative z-10">
        <div className="flex justify-between items-center w-full">
          <Badge className="bg-purple-500/30 text-purple-100 border border-purple-400/30 text-[10px]">
            Live Feed: {currentTip.category}
          </Badge>
          <Button variant="ghost" size="icon" onClick={getNextTip} disabled={isRefreshing} className="text-white hover:bg-white/10 h-7 w-7 rounded-full">
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
        <div>
          <h3 className="text-sm font-bold text-white mb-1">{currentTip.title}</h3>
          <p className="text-indigo-100 text-xs leading-relaxed line-clamp-3">{currentTip.content}</p>
        </div>
      </div>
    </Card>
  );
}

// ---------------- 2. KOMPONEN KAD CUACA ----------------
function WeatherCard() {
  return (
    <Card className="p-5 rounded-2xl shadow-sm border-sky-100 bg-gradient-to-br from-blue-50 to-sky-100 relative overflow-hidden">
      <div className="flex justify-between items-start gap-4 relative z-10">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-1 text-sky-600">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <p className="text-[10px] font-bold uppercase tracking-wider truncate">Kota Kinabalu</p>
          </div>
          <h3 className="text-3xl font-black text-slate-800 leading-none">30°<span className="text-xl">C</span></h3>
          <p className="text-xs font-bold mt-1 text-blue-500">Hujan</p>
        </div>
        <div className="w-12 h-12 bg-white/80 rounded-xl flex items-center justify-center shadow-sm shrink-0">
          <CloudRain className="w-6 h-6 text-blue-500" />
        </div>
      </div>
      <p className="text-[11px] text-sky-800 font-medium leading-relaxed mt-3 border-l-2 border-sky-300 pl-2">
        Hujan di luar. Waktu terbaik untuk berehat di rumah sambil buat misi! 🏡
      </p>
    </Card>
  );
}

// ---------------- 3. KOMPONEN PINTASAN PANTAS ----------------
function ShortcutCard({ icon: Icon, title, desc, gradient, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`bg-gradient-to-br ${gradient} p-3.5 rounded-xl shadow-sm flex items-center gap-3 text-white justify-start w-full border border-white/10`}
    >
      <div className="bg-white/20 p-2 rounded-lg shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div className="text-left flex-1 min-w-0">
        <p className="text-xs font-bold truncate">{title}</p>
        <p className="text-[10px] text-white/80 truncate">{desc}</p>
      </div>
    </motion.button>
  );
}

// ---------------- 4. INDIVIDUAL CHILD CARD (WITH TIME & REDIRECT) ----------------
function ChildCard({ child, onRefresh }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMissionModal, setShowMissionModal] = useState(false);
  const [missionTitle, setMissionTitle] = useState("");

  const currentXP = child.progress?.xp_score || child.progress?.total_xp || 0;
  const currentLevel = child.progress?.level || 1;
  const streakDays = child.progress?.streak_days || 0;
  const currentCoins = child.wallet?.balance || 0;
  const currentTopic = child.progress?.current_topic || child.progress?.last_lesson_name || "Misi Belum Mula";
  const nextLevelXP = child.progress?.next_level_xp || (currentLevel * 500);
  const xpPercentage = Math.min(Math.round((currentXP / nextLevelXP) * 100), 100);
  
  // Ambil data masa terakhir belajar sebenar daripada database (last_active)
  const lastActiveTime = child.last_active 
    ? `Aktif ${moment(child.last_active).fromNow()}` 
    : "Tiada rekod aktif";

  const displayName = child.display_name || "Pelajar";

  const handleCardClick = () => {
    // Navigasi terus ke halaman profil maklumat anak
    navigate(`/parent/children/${child.id}`);
  };

  const handleBonusKoin = (e) => {
    e.stopPropagation(); // Elak trigger navigasi kad
    toast({ title: "Bonus Koin", description: "Fungsi tambah koin dipanggil." });
  };

  const handleMisiKhas = (e) => {
    e.stopPropagation(); // Elak trigger navigasi kad
    setShowMissionModal(true);
  };

  return (
    <>
      <motion.div 
        whileHover={{ scale: 1.01, y: -2 }}
        onClick={handleCardClick}
        className="cursor-pointer h-full"
      >
        <Card className="p-4 bg-white border border-slate-100 hover:border-indigo-200 transition-all rounded-2xl shadow-sm hover:shadow-md flex flex-col justify-between h-full min-h-[300px]">
          <div className="space-y-3.5">
            
            {/* 1. MASA TERAKHIR BELAJAR (SEBENAR) */}
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold border-b border-slate-50 pb-2">
              <span className="flex items-center gap-1 text-indigo-500 bg-indigo-50/60 px-2 py-0.5 rounded-full uppercase tracking-tight text-[9px]">
                <Clock className="w-3 h-3" /> {lastActiveTime}
              </span>
              <span className="text-[9px] text-slate-400 uppercase tracking-wider">Lihat Profil &rarr;</span>
            </div>

            {/* Header Profil */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center border border-pink-200 shrink-0">
                <span className="text-xl">🦖</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h3 className="text-sm font-black text-slate-800 uppercase truncate">{displayName}</h3>
                  <Badge className="bg-blue-50 text-blue-600 border-0 text-[9px] font-black px-1.5 py-0 h-4 rounded shrink-0">
                    Tahap {currentLevel}
                  </Badge>
                </div>
                <p className="text-[9px] font-bold text-slate-400 mt-0.5">Ruby Hatchling</p>
              </div>
            </div>

            {/* Skor XP */}
            <div className="space-y-1 bg-slate-50/50 p-2 rounded-xl border border-slate-100">
              <div className="flex justify-between items-center text-[10px] px-0.5">
                <span className="font-bold text-slate-500">XP Terkumpul</span>
                <span className="font-black text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-100 shadow-2xs">
                  {currentXP}/{nextLevelXP}
                </span>
              </div>
              <Progress value={xpPercentage} className="h-1.5 bg-slate-100 rounded-full" />
            </div>

            {/* Kotak Statistik Grid */}
            <div className="grid grid-cols-3 gap-1.5">
              <div className="bg-orange-50/60 border border-orange-100/50 p-2 rounded-xl flex flex-col items-center justify-center text-center min-h-[62px]">
                <Flame className="w-3.5 h-3.5 text-orange-500 mb-0.5 shrink-0" />
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tight leading-none">Hari Streak</p>
                <p className="text-xs font-black text-slate-700 mt-1 leading-none">{streakDays}</p>
              </div>

              <div className="bg-amber-50/60 border border-amber-100/50 p-2 rounded-xl flex flex-col items-center justify-center text-center min-h-[62px]">
                <span className="text-xs mb-0.5">🪙</span>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tight leading-none">Baki Koin</p>
                <p className="text-xs font-black text-slate-700 mt-1 leading-none">{currentCoins}</p>
              </div>

              <div className="bg-indigo-50/40 border border-indigo-100/30 p-2 rounded-xl flex flex-col items-center justify-center text-center min-h-[62px] min-w-0">
                <Target className="w-3.5 h-3.5 text-indigo-500 mb-0.5 shrink-0" />
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tight leading-none truncate w-full">Topik Semasa</p>
                <p className="text-[10px] font-extrabold text-slate-700 mt-1 leading-tight truncate w-full px-0.5">
                  {currentTopic}
                </p>
              </div>
            </div>
          </div>

          {/* Butang Tindakan */}
          <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 mt-3">
            <Button size="sm" variant="outline" className="h-7 text-[9px] font-black border-amber-200 text-amber-600 hover:bg-amber-50 rounded-lg shadow-2xs" onClick={handleBonusKoin}>
              🪙 Bonus Koin
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-[9px] font-black border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded-lg shadow-2xs" onClick={handleMisiKhas}>
              🎯 Misi Khas
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* Modal Misi */}
      <AnimatePresence>
        {showMissionModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs" onClick={(e)=>e.stopPropagation()}>
            <Card className="w-full max-w-xs p-4 bg-white rounded-xl shadow-xl">
              <h4 className="text-xs font-bold mb-2">Cipta Misi Baru</h4>
              <input type="text" className="w-full text-xs border p-2 rounded mb-3" placeholder="Nama misi..." value={missionTitle} onChange={(e)=>setMissionTitle(e.target.value)}/>
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="ghost" onClick={()=>setShowMissionModal(false)}>Batal</Button>
                <Button size="sm" className="bg-indigo-600 text-white" onClick={()=>{setShowMissionModal(false); toast({title:"Misi Dihantar!"})}}>Hantar</Button>
              </div>
            </Card>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

// ---------------- 5. MAIN PARENT DASHBOARD COMPONENT ----------------
export default function ParentDashboard() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const u = await base44.auth.me();
      const rel = await base44.entities.ParentChildRelationship.filter({ parent_id: u.id, status: ["active", "pending"] });
      if (!rel.length) return setLoading(false);
      
      const childIds = rel.map(r => r.child_id);
      const kids = await Promise.all(childIds.map(async (id) => {
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
          wallet: wallet?.[0] || { balance: 0 },
          last_active: childUser?.last_active || progress?.[0]?.updated_at || null // fallback data sebenar
        };
      }));
      setChildren(kids);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  if (loading) return <div className="p-8 text-center text-xs">Memuatkan panel kawalan...</div>;

  return (
    <div className="p-4 sm:p-5 lg:p-6 space-y-5 max-w-7xl mx-auto bg-slate-50/30 min-h-screen">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">Pusat Kawalan Ibu Bapa 🛡️</h1>
          <p className="text-slate-500 text-xs font-medium">Urus, pantau kemajuan, dan sahkan tugasan harian anak-anak anda.</p>
        </div>
        <Link to="/parent/children">
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs px-4 h-9 shadow-sm shrink-0">
            <Plus className="w-3.5 h-3.5 mr-1" /> Tambah Anak
          </Button>
        </Link>
      </div>

      {/* PINTASAN PANTAS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <ShortcutCard icon={Gift} title="Ganjaran" desc="Urus senarai hadiah" gradient="from-pink-500 to-rose-400" onClick={() => navigate("/parent/rewards")} />
        <ShortcutCard icon={BarChart2} title="Analitik" desc="Semak perkembangan" gradient="from-blue-500 to-cyan-500" onClick={() => navigate("/parent/children")} />
        <ShortcutCard icon={Target} title="Misi Baru" desc="Beri tugasan khas" gradient="from-emerald-500 to-teal-400" onClick={() => window.scrollTo({ top: 300, behavior: "smooth" })} />
        <ShortcutCard icon={Settings} title="Tetapan" desc="Akaun & Sekatan" gradient="from-slate-700 to-slate-500" onClick={() => toast({ title: "Modul Tetapan" })} />
      </div>

      {/* GRID UTAMA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* KOLUM KIRI - SENARAI PROFIL ANAK */}
        <div className="lg:col-span-8 space-y-3.5">
          <div className="flex items-center justify-between px-0.5">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <h2 className="font-bold text-sm text-slate-800">Profil & Kemajuan Anak</h2>
            </div>
            {/* Butang Pintasan Tambahan ke Halaman Anak-Anak */}
            <Link to="/parent/children" className="text-xs text-indigo-600 font-bold hover:underline">
              Urus Semua Anak &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {children.map((child) => (
              <ChildCard key={child.id} child={child} onRefresh={loadData} />
            ))}
          </div>
        </div>

        {/* KOLUM KANAN */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center gap-2 px-0.5">
            <Sun className="w-4 h-4 text-amber-500" />
            <h2 className="font-bold text-sm text-slate-800">Info & Utiliti Hari Ini</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
            <WeatherCard />
            <SmartParentingTips />
          </div>
        </div>

      </div>
    </div>
  );
}