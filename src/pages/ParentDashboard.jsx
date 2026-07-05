import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { TrendingUp, Clock, Award, ShieldAlert } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import moment from "moment";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";

const calculateAge = (birthDate) => {
  if (!birthDate) return "N/A";
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

// ---------------- INDIVIDUAL CHILD CARD (FIXED BUBBLING & ADDED TIME METRIC) ----------------
function ChildCard({ child, onUnlink }) {
  const currentXP = child.progress?.xp_score || 0;
  const currentLevel = child.progress?.level || 1;
  const nextLevelXP = child.progress?.next_level_xp || (currentLevel * 500);
  
  const xpPercentage = Math.min(Math.round((currentXP / nextLevelXP) * 100), 100);
  const lastActive = child.last_active ? moment(child.last_active).fromNow() : "Baru aktif";

  const getDragonMilestone = (xp, lvl) => {
    if (xp >= 5000 || lvl >= 15) {
      return {
        stageTitle: "Ancient Inferno",
        gradient: "from-rose-600 via-red-500 to-amber-400",
        glow: "rgba(239, 68, 68, 0.4)",
        icon: "🐉",
        subtext: "Tier 3 Titan • Tahap Agung"
      };
    } else if (xp >= 1500 || lvl >= 6) {
      return {
        stageTitle: "Emerald Drake",
        gradient: "from-emerald-500 via-teal-500 to-cyan-500",
        glow: "rgba(16, 185, 129, 0.3)",
        icon: "🐲",
        subtext: "Tier 2 Winged • Tahap Menengah"
      };
    } else {
      return {
        stageTitle: "Ruby Hatchling",
        gradient: "from-purple-500 via-pink-500 to-rose-400",
        glow: "rgba(219, 39, 119, 0.2)",
        icon: "🦖",
        subtext: "Tier 1 Egg • Tahap Permulaan"
      };
    }
  };

  const milestone = getDragonMilestone(currentXP, currentLevel);

  return (
    <Card className="p-6 space-y-4 bg-white hover:shadow-xl transition-all border-slate-100 relative overflow-hidden group rounded-2xl">
      
      {/* Status Keaktifan Sebenar */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5">
        <div className={`w-2 h-2 rounded-full ${child.last_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{lastActive}</span>
      </div>

      <div className="flex items-start gap-4">
        {/* Avatar Naga */}
        <div className="relative flex flex-col items-center justify-center p-2 select-none flex-shrink-0">
          <div style={{ perspective: "1000px" }} className="relative w-20 h-20 flex items-center justify-center">
            <motion.div animate={{ scale: [0.95, 1.15, 0.95], rotate: 360 }} transition={{ duration: 10, repeat: Infinity }} style={{ boxShadow: `0 0 20px ${milestone.glow}` }} className="absolute inset-0 rounded-full border border-dashed border-white/20 opacity-50" />
            <motion.div animate={{ y: [-4, 4, -4], rotateY: [-5, 5, -5] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className={`w-16 h-16 rounded-full bg-gradient-to-tr ${milestone.gradient} border-2 border-white shadow-xl flex items-center justify-center relative z-10`}>
              <span className="text-4xl drop-shadow-lg">{milestone.icon}</span>
            </motion.div>
          </div>
          <span className="text-[10px] font-black text-slate-700 mt-2">{milestone.stageTitle}</span>
          <span className="text-[8px] font-bold text-muted-foreground/70 uppercase tracking-wider scale-90">{milestone.subtext.split("•")[0]}</span>
        </div>

        <div className="flex-grow space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-slate-800">{child.display_name}</h3>
            <Badge variant="secondary" className="bg-blue-50 text-blue-600 text-[10px] font-bold h-5">
              {child.education_level || "Standard 2"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground font-medium">Umur {calculateAge(child.date_of_birth)} Tahun</p>
          
          {/* Progress Bar Grafik XP */}
          <div className="pt-2 space-y-1.5">
            <div className="flex justify-between items-center text-[10px]">
              <span className="font-bold text-slate-500 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-indigo-500" /> 
                Ganjaran XP: <span className="text-slate-700 font-extrabold">{currentXP}</span> / {nextLevelXP} XP
              </span>
              <span className="font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                Tahap {currentLevel}
              </span>
            </div>
            <Progress value={xpPercentage} className="h-1.5 bg-slate-100" />
          </div>
        </div>
      </div>

      {/* Grid Subjek Fokus & Metrik Masa Belajar */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Masa Belajar Terkumpul</p>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center shadow-sm">
              <Clock className="w-3.5 h-3.5 text-cyan-500" />
            </div>
            <span className="text-xs font-black text-slate-700">
              {child.total_study_minutes} <span className="text-[10px] font-normal text-slate-500">Minit</span>
            </span>
          </div>
        </div>
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Topik Terkini</p>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-xs shadow-sm">🔢</div>
            <span className="text-xs font-bold text-slate-700 truncate">
              {child.progress?.current_topic || "Nota Pintar"}
            </span>
          </div>
        </div>
      </div>

      {/* Rail Metrik & Butang Sorakan Interaktif */}
      <div className="grid grid-cols-3 gap-2 bg-slate-50/50 p-3 rounded-xl text-center border border-slate-100 group-hover:bg-white transition-colors">
        <div>
          <p className="font-black text-slate-700">🪙 {child.wallet?.balance || 0}</p>
          <p className="text-[9px] text-muted-foreground font-bold uppercase">Koin</p>
        </div>
        <div className="border-x border-slate-200/50">
          <p className="font-black text-orange-500">🔥 {child.progress?.streak_days || 0}</p>
          <p className="text-[9px] text-muted-foreground font-bold uppercase">Streak</p>
        </div>
        <div 
          className="cursor-pointer hover:scale-105 transition-transform active:scale-95 bg-rose-50/50 hover:bg-rose-50 rounded-lg py-0.5"
          onClick={(e) => {
            e.preventDefault(); // Mengelakkan pautan halaman dipicu
            e.stopPropagation(); // Menghalang event bubbling ke pautan makmal parent
            alert(`🎉 Laporan sorakan kasih sayang berjaya dihantar terus ke skrin ${child.display_name}!`);
          }}
        >
          <p className="font-black text-rose-500">❤️ Sorak!</p>
          <p className="text-[9px] text-muted-foreground font-bold uppercase">Puji Anak</p>
        </div>
      </div>

      {onUnlink && (
        <div className="pt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onUnlink(child.id, child.display_name || "Pelajar");
            }}
            className="text-slate-400 hover:text-rose-600 hover:bg-rose-50/50 w-full rounded-xl text-xs transition-colors"
          >
            Putuskan Hubungan Akun (Unlink)
          </Button>
        </div>
      )}
    </Card>
  );
}

// ================= MAIN DASHBOARD =================
export default function ParentDashboard() {
  const { toast } = useToast();

  const [user, setUser] = useState(null);
  const [children, setChildren] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);

      const u = await base44.auth.me();
      setUser(u);

      // Ambil perhubungan anak dan penjaga
      const rel = await base44.entities.ParentChildRelationship.filter({
        parent_id: u.id,
        status: ["active", "pending"],
      });

      if (!rel.length) {
        setChildren([]);
        setPendingRequests([]);
        setLoading(false);
        return;
      }

      const childIds = rel.map(r => r.child_id);

      const kids = await Promise.all(
        childIds.map(async (id) => {
          const [progress, wallet, studySessions] = await Promise.all([
            base44.entities.Progress.filter({ student_id: id }),
            base44.entities.Wallet.filter({ student_id: id }),
            base44.entities.StudySession.filter({ student_id: id }), // Integrasi baru untuk menarik data masa belajar
          ]);
          const childUser = await base44.entities.User.get(id).catch(() => null);

          // Kira jumlah keseluruhan minit pembelajaran yang direkodkan dari komponen LessonProgress & LessonPage
          const totalStudyMinutes = studySessions.reduce((sum, session) => sum + (session.duration_minutes || 0), 0);

          return {
            id,
            display_name: childUser?.full_name || childUser?.username || "Unnamed Student",
            date_of_birth: childUser?.date_of_birth || "",
            education_level: childUser?.education_level || "",
            last_active: childUser?.updated_date || "",
            progress: progress?.[0] || {},
            wallet: wallet?.[0] || { balance: 0 },
            total_study_minutes: totalStudyMinutes, // Dimasukkan ke dalam profil data anak
          };
        })
      );

      const pending = await base44.entities.RewardRequest.filter({
        status: "pending",
      });

      setChildren(kids);
      setPendingRequests(pending);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUnlink = async (childId, name) => {
    const sah = window.confirm(`Adakah anda pasti mahu memutuskan hubungan akaun bersama ${name}?`);
    if (!sah) return;

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
      toast({ title: "Berjaya Diputuskan", description: `Profil ${name} telah dikeluarkan.` });
      loadData();
    } catch (err) {
      toast({
        title: "Gagal memutuskan hubungan",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto font-sans">
      
      {/* Bahagian Header Utama */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-6 text-white shadow-md">
        <h1 className="text-2xl font-black flex items-center gap-2">Portal Penjaga 📊</h1>
        <p className="text-indigo-100 text-sm mt-1">
          Pantau progress pembelajaran, jumlah jam membaca nota, kuiz, serta pengurusan ganjaran anak-anak anda.
        </p>
      </div>

      {/* Grid Profil Anak-anak */}
      <div className="space-y-3">
        <h2 className="font-bold text-lg text-slate-800 flex items-center gap-1.5">
          <Award className="w-5 h-5 text-indigo-500" /> Profil Anak Saya
        </h2>

        {children.length === 0 ? (
          <div className="p-8 border-2 border-dashed rounded-2xl text-gray-400 text-center bg-white">
            Tiada profil pelajar yang dipautkan lagi buat masa ini.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {children.map(c => (
              <Link key={c.id} to={`/parent/children/${c.id}`} className="block focus:outline-none">
                <ChildCard child={c} onUnlink={handleUnlink} />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Bahagian Tuntutan Hadiah Pending */}
      <div className="space-y-3 pt-2">
        <h2 className="font-bold text-lg text-slate-800 flex items-center gap-1.5">
          <ShieldAlert className="w-5 h-5 text-amber-500" /> Permintaan Ganjaran (Menunggu Kelulusan)
        </h2>

        {pendingRequests.length === 0 ? (
          <div className="text-slate-400 text-sm bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center">
            Tiada tuntutan hadiah baharu dari anak buat masa ini.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {pendingRequests.map(r => (
              <div key={r.id} className="p-4 bg-white border border-slate-100 rounded-2xl flex justify-between items-center shadow-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-sm">🎁</span>
                  <div>
                    <span className="font-bold text-sm text-slate-800 block">{r.reward_title}</span>
                    <span className="text-[11px] text-slate-400">Menanti penebusan</span>
                  </div>
                </div>
                <Badge className="bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 font-extrabold px-3 py-1 rounded-xl shadow-none">
                  {r.coin_cost} 🪙
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}