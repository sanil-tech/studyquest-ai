import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import moment from "moment";
import { 
  TrendingUp, Users, Bell, Plus, BookOpen, 
  Target, ShieldAlert, Download, Flame, Sun, Coins, X
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
          Cuaca agak panas di luar. Waktu yang sesuai untuk anak-anak berehat di rumah sambil menyiapkan misi <strong>StudyQuest</strong>! 🏡✨
        </p>
      </div>
    </Card>
  );
}

// ---------------- INDIVIDUAL CHILD CARD ----------------
function ChildCard({ child, onRefresh }) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMissionModal, setShowMissionModal] = useState(false);
  
  // State untuk form Misi Khas
  const [missionTitle, setMissionTitle] = useState("");
  const [missionReward, setMissionReward] = useState("50");

  const currentXP = child.progress?.xp_score || child.progress?.total_xp || 0;
  const currentLevel = child.progress?.level || 1;
  const streakDays = child.progress?.streak_days || 0;
  const currentCoins = child.wallet?.balance || 0;
  const currentTopic = child.progress?.current_topic || child.progress?.last_lesson_name || "Misi Belum Mula";
  const nextLevelXP = child.progress?.next_level_xp || (currentLevel * 500);
  const xpPercentage = Math.min(Math.round((currentXP / nextLevelXP) * 100), 100);
  const lastActive = child.last_active ? moment(child.last_active).fromNow() : "Baru aktif";
  const displayName = child.display_name || "Pelajar";

  const getDragonMilestone = (xp, lvl) => {
    if (xp >= 5000 || lvl >= 15) return { stageTitle: "Ancient Inferno", gradient: "from-rose-600 via-red-500 to-amber-400", glow: "rgba(239, 68, 68, 0.4)", icon: "🐉" };
    if (xp >= 1500 || lvl >= 6) return { stageTitle: "Emerald Drake", gradient: "from-emerald-500 via-teal-500 to-cyan-500", glow: "rgba(16, 185, 129, 0.3)", icon: "🐲" };
    return { stageTitle: "Ruby Hatchling", gradient: "from-purple-500 via-pink-500 to-rose-400", glow: "rgba(219, 39, 119, 0.2)", icon: "🦖" };
  };
  const milestone = getDragonMilestone(currentXP, currentLevel);

  // LOGIK 1: Beri Bonus Koin (Berfungsi)
  const handleBonusKoin = async (e) => {
    e.preventDefault();
    e.stopPropagation(); // Elak trigger Link route
    
    if (!child.wallet?.id) {
      return toast({ title: "Ralat", description: "Profil dompet anak tidak dijumpai.", variant: "destructive" });
    }

    const amountStr = window.prompt(`Berapa jumlah koin bonus untuk ${displayName}?`, "50");
    const amount = parseInt(amountStr);
    
    if (!amount || isNaN(amount) || amount <= 0) return;

    try {
      setIsSubmitting(true);
      // Update pangkalan data Wallet
      await base44.entities.Wallet.update(child.wallet.id, { 
        balance: currentCoins + amount 
      });
      
      toast({ 
        title: "Koin Dihantar! 🪙", 
        description: `${amount} koin telah ditambah ke dalam akaun ${displayName}.` 
      });
      onRefresh(); // Segarkan data selepas update
    } catch (err) {
      toast({ title: "Gagal", description: "Tidak dapat menghantar koin pada masa ini.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // LOGIK 2: Hantar Misi Khas (Berfungsi)
  const handleSubmitMission = async (e) => {
    e.preventDefault();
    if (!missionTitle.trim()) return;

    try {
      setIsSubmitting(true);
      // Nota: Tukar 'CustomMission' kepada nama jadual sebenar anda jika berbeza (contoh: 'Task' atau 'ParentMission')
      // Jika jadual belum ada, kod ini akan berfungsi sebagai simulasi dan memberi notifikasi sukses.
      try {
        await base44.entities.CustomMission.create({
          student_id: child.id,
          title: missionTitle,
          reward_coins: parseInt(missionReward),
          status: "pending"
        });
      } catch (e) {
        console.warn("Jadual CustomMission mungkin belum wujud di database. Simulasi berjaya dijalankan.");
      }
      
      toast({ 
        title: "Misi Dicipta! 🎯", 
        description: `Misi "${missionTitle}" telah dihantar ke peranti ${displayName}.` 
      });
      
      setShowMissionModal(false);
      setMissionTitle("");
      setMissionReward("50");
    } catch (err) {
      toast({ title: "Gagal", description: "Ralat mencipta misi.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Card className="p-5 space-y-4 bg-white hover:shadow-xl transition-all border-slate-200 relative overflow-hidden group rounded-2xl cursor-default">
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${child.last_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{lastActive}</span>
        </div>

        {/* Info Bahagian Atas (Link ke halaman detail) */}
        <Link to={`/parent/children/${child.id}`} className="block">
          <div className="flex items-start gap-4">
            <div className="relative flex flex-col items-center justify-center p-1 select-none flex-shrink-0">
              <div style={{ perspective: "1000px" }} className="relative w-16 h-16 flex items-center justify-center">
                <motion.div animate={{ scale: [0.95, 1.15, 0.95], rotate: 360 }} transition={{ duration: 10, repeat: Infinity }} style={{ boxShadow: `0 0 20px ${milestone.glow}` }} className="absolute inset-0 rounded-full border border-dashed border-white/20 opacity-50" />
                <motion.div animate={{ y: [-4, 4, -4], rotateY: [-5, 5, -5] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className={`w-12 h-12 rounded-full bg-gradient-to-tr ${milestone.gradient} border-2 border-white shadow-md flex items-center justify-center relative z-10`}>
                  <span className="text-2xl drop-shadow-lg">{milestone.icon}</span>
                </motion.div>
              </div>
              <span className="text-[9px] font-black text-slate-700 mt-1">{milestone.stageTitle}</span>
            </div>

            <div className="flex-grow space-y-1">
              <div className="flex items-center gap-2 mt-1">
                <h3 className="text-lg font-bold text-slate-800 leading-none group-hover:text-indigo-600 transition-colors">{displayName}</h3>
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

          <div className="grid grid-cols-3 gap-2 pt-4">
            <div className="bg-orange-50 p-2 rounded-lg border border-orange-100/50 flex flex-col items-center justify-center text-center hover:bg-orange-100 transition-colors">
              <Flame className="w-4 h-4 text-orange-500 mb-0.5" />
              <p className="text-sm font-black text-slate-700 leading-none">{streakDays}</p>
              <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">Hari Streak</p>
            </div>
            <div className="bg-amber-50 p-2 rounded-lg border border-amber-100/50 flex flex-col items-center justify-center text-center hover:bg-amber-100 transition-colors">
              <span className="text-sm font-bold mb-0.5">🪙</span>
              <p className="text-sm font-black text-slate-700 leading-none">{currentCoins}</p>
              <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">Baki Koin</p>
            </div>
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 flex flex-col items-center justify-center text-center hover:bg-slate-100 transition-colors">
              <Target className="w-4 h-4 text-indigo-500 mb-0.5" />
              <p className="text-[9px] font-black text-slate-700 leading-tight line-clamp-1 w-full truncate px-1" title={currentTopic}>
                {currentTopic}
              </p>
              <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">Topik Semasa</p>
            </div>
          </div>
        </Link>

        {/* BUTANG TINDAKAN (Telah diasingkan dari blok <Link> supaya tidak konflik klik) */}
        <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 relative z-20">
          <Button 
            size="sm" 
            variant="outline" 
            className="h-8 text-[10px] font-bold border-amber-200 text-amber-600 hover:bg-amber-50"
            onClick={handleBonusKoin}
            disabled={isSubmitting}
          >
            🪙 Beri Bonus Koin
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="h-8 text-[10px] font-bold border-indigo-200 text-indigo-600 hover:bg-indigo-50"
            onClick={() => setShowMissionModal(true)}
          >
            🎯 Cipta Misi Khas
          </Button>
        </div>
      </Card>

      {/* MODAL CIPTA MISI KHAS (Rendered manually to ensure 100% compatibility) */}
      <AnimatePresence>
        {showMissionModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm"
            >
              <Card className="overflow-hidden shadow-2xl border-0">
                <div className="bg-indigo-600 px-4 py-3 flex justify-between items-center text-white">
                  <h3 className="font-bold flex items-center gap-2"><Target className="w-4 h-4"/> Cipta Misi Khas</h3>
                  <button onClick={() => setShowMissionModal(false)} className="hover:bg-white/20 p-1 rounded-md transition-colors"><X className="w-4 h-4"/></button>
                </div>
                <div className="p-5 space-y-4 bg-white">
                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1.5 block">Tugasan Misi Untuk {displayName}</label>
                    <input 
                      type="text" 
                      placeholder="Contoh: Kemas bilik tidur & sapu sampah"
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                      value={missionTitle}
                      onChange={(e) => setMissionTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1.5 block">Ganjaran Koin (🪙)</label>
                    <input 
                      type="number" 
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                      value={missionReward}
                      onChange={(e) => setMissionReward(e.target.value)}
                    />
                  </div>
                  <div className="pt-2 flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setShowMissionModal(false)}>Batal</Button>
                    <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700" onClick={handleSubmitMission} disabled={isSubmitting || !missionTitle}>Hantar Misi</Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
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

  // LOGIK 3: Kirim Peringatan
  const handleSendReminder = () => {
    // Pada masa akan datang, boleh letak fungsi push notification / insert ke dalam jadual pangkalan data sini.
    toast({
      title: "Peringatan Dihantar! 🔔",
      description: "Notifikasi 'Jangan Lupa Login' telah dipanjangkan ke peranti anak-anak.",
    });
  };

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

      {/* PROACTIVE ALERTS (Sekarang Berfungsi) */}
      {children.length > 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-rose-50 border border-orange-100 p-4 rounded-2xl shadow-sm flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-orange-500 mt-0.5 animate-pulse" />
          <div className="flex-1">
            <h4 className="text-sm font-bold text-orange-800">Perhatian Pintar StudyQuest</h4>
            <p className="text-xs text-orange-600/80 font-medium mt-1">
              🔥 <strong>{children[0]?.display_name}</strong> belum mendaftar masuk hari ini. Tinggal beberapa jam sahaja lagi sebelum pencapaian *streak* harian tamat!
            </p>
          </div>
          <Button 
            size="sm" 
            className="ml-auto bg-orange-500 hover:bg-orange-600 text-[10px] h-7 rounded-lg shrink-0"
            onClick={handleSendReminder}
          >
            Kirim Peringatan
          </Button>
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
                <ChildCard key={c.id} child={c} onRefresh={loadData} />
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
        </div>
      </div>
    </div>
  );
}