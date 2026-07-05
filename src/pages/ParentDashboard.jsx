import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link, useNavigate } from "react-router-dom";
import moment from "moment";
import { 
  Users, Plus, Target, Gift, BarChart2, CloudRain, MapPin, Clock, ArrowRight, Settings
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

// 💡 FUNGSI SOKONGAN UNTUK NAMA PAPARAN
const getDisplayName = (user) => {
  if (!user) return "Pelajar";
  return user.name || user.username || user.email || "Pelajar";
};

function CompactChildCard({ child }) {
  const navigate = useNavigate();
  
  const currentXP = child.progress?.total_xp || 0;
  const nextLevelXP = 500; 
  const xpPercentage = Math.min(Math.round((currentXP / nextLevelXP) * 100), 100);
  const displayName = getDisplayName(child); // 💡 Digunakan di sini
  
  const lastActiveTime = child.progress?.last_study_date 
    ? `Belajar Terakhir: ${moment(child.progress.last_study_date).format("DD/MM/YYYY")}` 
    : "Tiada rekod aktif";
    
  const currentTopic = child.progress?.current_topic || "Misi Belum Mula";

  return (
    <Card 
      onClick={() => navigate(`/parent/children`)} 
      className="p-4 bg-white border border-slate-100 hover:border-indigo-200 shadow-sm hover:shadow-md transition-all rounded-2xl cursor-pointer flex flex-col justify-between group"
    >
      <div className="space-y-3">
        <div className="flex justify-between items-center text-[10px]">
          <span className="flex items-center gap-1 text-slate-400 font-bold uppercase tracking-tight">
            <Clock className="w-3 h-3 text-indigo-500" /> {lastActiveTime}
          </span>
          <span className="text-indigo-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
            Lihat Detail <ArrowRight className="w-3 h-3" />
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100 text-xl shrink-0">
            🦖
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-black text-slate-800 uppercase truncate">{displayName}</h3>
            <p className="text-[11px] text-slate-500 font-bold truncate mt-0.5">
              📚 {currentTopic}
            </p>
          </div>
        </div>

        <div className="space-y-1 pt-1">
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
            <span>TAHAP {child.progress?.level || 1}</span>
            <span className="text-slate-600">{xpPercentage}%</span>
          </div>
          <Progress value={xpPercentage} className="h-1.5 bg-slate-100 rounded-full" />
        </div>
      </div>
    </Card>
  );
}

export default function ParentDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const u = await base44.auth.me();
      const rel = await base44.entities.ParentChildRelationship.filter({ parent_id: u.id, status: "active" });
      if (!rel.length) return setLoading(false);
      
      const childIds = rel.map(r => r.child_id);
      const kids = await Promise.all(childIds.map(async (id) => {
        const progress = await base44.entities.Progress.filter({ student_id: id });
        const childUser = await base44.entities.User.get(id).catch(() => null);
        
        return { 
          id, 
          ...childUser, 
          progress: progress?.[0] || {}, 
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

  if (loading) return <div className="p-6 text-center text-xs text-slate-400">Memuatkan dashboard...</div>;

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-7xl mx-auto bg-slate-50/40 min-h-screen">
      <div className="flex justify-between items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">Pusat Kawalan Ibu Bapa 🛡️</h1>
          <p className="text-slate-500 text-xs">Aktiviti semasa, kelulusan segera, dan status ringkas anak anda.</p>
        </div>
        <Button size="sm" className="bg-indigo-600 text-white rounded-xl font-bold text-xs h-9 px-3.5" onClick={() => navigate("/parent/children")}>
          <Plus className="w-3.5 h-3.5 mr-1" /> Urus Anak
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <ShortcutCard icon={Gift} title="Ganjaran" desc="Urus kedai hadiah" gradient="from-pink-500 to-rose-400" onClick={() => navigate("/parent/rewards")} />
        <ShortcutCard icon={BarChart2} title="Analitik" desc="Prestasi penuh anak" gradient="from-blue-500 to-cyan-500" onClick={() => navigate("/parent/children")} />
        <ShortcutCard icon={Target} title="Misi Baru" desc="Beri tugasan khas" gradient="from-emerald-500 to-teal-400" onClick={() => navigate("/parent/children")} />
        <ShortcutCard icon={Settings} title="Tetapan" desc="Kawalan akaun & had" gradient="from-slate-700 to-slate-500" onClick={() => toast({ title: "Modul Tetapan" })} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-8 space-y-4">
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

        <div className="lg:col-span-4 space-y-4">
          <Card className="p-4 rounded-2xl border-sky-100 bg-gradient-to-br from-blue-50 to-sky-100 flex justify-between items-center">
            <div>
              <div className="flex items-center gap-1 text-sky-600 text-[10px] font-bold uppercase tracking-wider mb-0.5"><MapPin className="w-3 h-3" /> Kota Kinabalu</div>
              <h3 className="text-2xl font-black text-slate-800">30°c <span className="text-xs font-bold text-blue-500 ml-1">Hujan</span></h3>
            </div>
            <CloudRain className="w-6 h-6 text-blue-500" />
          </Card>
        </div>
      </div>
    </div>
  );
}

function ShortcutCard({ icon: Icon, title, desc, gradient, onClick }) {
  return (
    <button onClick={onClick} className={`bg-gradient-to-br ${gradient} p-3 rounded-xl shadow-xs flex items-center gap-3 text-white text-left w-full border border-white/5`}>
      <div className="bg-white/20 p-2 rounded-lg"><Icon className="w-4 h-4" /></div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold truncate">{title}</p>
        <p className="text-[9px] text-white/80 truncate">{desc}</p>
      </div>
    </button>
  );
}