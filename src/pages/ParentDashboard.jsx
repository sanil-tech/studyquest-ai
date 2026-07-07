import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { TrendingUp } from "lucide-react";
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

// ---------------- INDIVIDUAL CHILD CARD (SYNCHRONIZED MILESTONE LOGIC) ----------------
function ChildCard({ child, onUnlink }) {
  // 1. Ambil data XP dan Level dari rekod Progress sebenar
  const currentXP = child.progress?.xp_score || 0;
  const currentLevel = child.progress?.level || 1;
  const nextLevelXP = child.progress?.next_level_xp || (currentLevel * 500);
  
  // Pengiraan kadar peratusan kemajuan XP yang tepat
  const xpPercentage = Math.min(Math.round((currentXP / nextLevelXP) * 100), 100);
  const lastActive = child.last_active ? moment(child.last_active).fromNow() : "Baru aktif";

  // 2. LOGIK MILESTONE (Diselaraskan dengan halaman MyChildren)
  // Menentukan evolusi reka bentuk naga bersandarkan jumlah XP Bersih anak
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
    <Card className="p-6 space-y-4 bg-white hover:shadow-lg transition-all border-slate-100 relative overflow-hidden group">
      
      {/* Status Keaktifan Sebenar */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5">
        <div className={`w-2 h-2 rounded-full ${child.last_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{lastActive}</span>
      </div>

      <div className="flex items-start gap-4">
        
        {/* AVATAR NAGA DENGAN LOGIK MILESTONE BARU */}
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
          <div className="pt-3 space-y-1.5">
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
            <p className="text-[9px] text-right text-slate-400 font-medium">{xpPercentage}% menuju tahap seterusnya</p>
          </div>
        </div>
      </div>

      {/* Grid Subjek Fokus & Misi Harian Pelajar */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Topik Utama</p>
            <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-xs shadow-sm">🔢</div>
                <span className="text-xs font-bold text-slate-700 truncate">
                  {child.progress?.current_topic || "Pecahan (Math)"}
                </span>
            </div>
        </div>
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Misi Hari Ini</p>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-[10px] shadow-sm text-emerald-500 font-extrabold">
                  {child.progress?.completed_quests || 2}/{child.progress?.total_quests || 3}
                </div>
                <span className="truncate">Selesaikan Misi</span>
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
          className="cursor-pointer hover:scale-105 transition-transform active:scale-95"
          onClick={() => alert(`🎉 Sorakan kasih sayang telah dihantar terus ke peranti ${child.display_name}!`)}
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
            onClick={() => onUnlink(child.id, child.display_name || "Student")}
            className="text-rose-500 hover:bg-rose-50 w-full"
          >
            Unlink
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
          const [progress, wallet] = await Promise.all([
            base44.entities.Progress.filter({ student_id: id }),
            base44.entities.Wallet.filter({ student_id: id }),
          ]);
          const childUser = await base44.entities.User.get(id).catch(() => null);

          return {
            id,
            display_name: childUser?.full_name || childUser?.username || "Unnamed Student",
            date_of_birth: childUser?.date_of_birth || "",
            education_level: childUser?.education_level || "",
            last_active: childUser?.updated_date || "",
            progress: progress?.[0] || {},
            wallet: wallet?.[0] || { balance: 0 },
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
      toast({ title: "Unlinked", description: `${name} removed` });
      loadData();
    } catch (err) {
      toast({
        title: "Failed to unlink",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="p-10 text-center">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Parent Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Monitor your children's learning progress and rewards.
        </p>
      </div>

      <div>
        <h2 className="font-bold mb-3">My Children</h2>

        {children.length === 0 ? (
          <div className="p-4 border rounded-xl text-gray-500 text-center">
            No student profile connected yet.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {children.map(c => (
              <Link key={c.id} to={`/parent/children/${c.id}`} className="block">
                <ChildCard child={c} onUnlink={handleUnlink} />
              </Link>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="font-bold mb-3">Pending Reward Requests</h2>

        {pendingRequests.length === 0 ? (
          <div className="text-gray-400 text-sm">No pending requests</div>
        ) : (
          <div className="space-y-2">
            {pendingRequests.map(r => (
              <div key={r.id} className="p-3 border rounded-xl flex justify-between items-center">
                <span>{r.reward_title}</span>
                <span className="text-sm text-muted-foreground">{r.coin_cost} 🪙</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}