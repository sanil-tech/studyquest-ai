import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Users, Flame, Target, Clock, Coins, ShieldAlert } from "lucide-react";
import moment from "moment";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { getDisplayName } from "@/lib/utils";

function DetailedChildCard({ child }) {
  const currentXP = child.progress?.xp_score || 0;
  const nextLevelXP = child.progress?.next_level_xp || 500;
  const xpPercentage = Math.min(Math.round((currentXP / nextLevelXP) * 100), 100);
  
  const streakDays = child.progress?.streak_days || 0;
  const currentCoins = child.wallet?.balance || 0;
  const currentTopic = child.progress?.current_topic || "Misi Belum Mula";
  
  // 💡 MASA BELAJAR SEBENAR: Dibaca daripada field study_time dalam entiti Progress
  const totalStudyMinutes = child.progress?.study_time || 0;
  
  const lastActiveTime = child.last_active 
    ? `Aktif ${moment(child.last_active).fromNow()}` 
    : "Tiada rekod aktif";

  return (
    <Card className="p-5 bg-white border border-slate-100 rounded-2xl shadow-xs flex flex-col justify-between space-y-4">
      {/* Header Kad */}
      <div className="flex items-center justify-between border-b border-slate-50 pb-2 text-[10px] text-slate-400 font-bold">
        <span className="flex items-center gap-1 text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full uppercase text-[9px]">
          <Clock className="w-3 h-3" /> {lastActiveTime}
        </span>
        <Badge className="bg-slate-100 text-slate-700 font-bold text-[9px] border-0">
          ID: {child.id.substring(0, 6)}...
        </Badge>
      </div>

      {/* Profil Mini */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center border border-pink-200 text-xl shrink-0">
          🦖
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <h3 className="text-sm font-black text-slate-800 uppercase truncate">{child.display_name}</h3>
            <Badge className="bg-blue-50 text-blue-600 border-0 text-[10px] font-black px-1.5 py-0 h-4 rounded shrink-0">
              Tahap {child.progress?.level || 1}
            </Badge>
          </div>
          <p className="text-[10px] font-bold text-slate-400 mt-0.5">Ruby Hatchling</p>
        </div>
      </div>

      {/* Kemajuan XP */}
      <div className="space-y-1 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
        <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
          <span>XP TERKUMPUL</span>
          <span>{currentXP}/{nextLevelXP}</span>
        </div>
        <Progress value={xpPercentage} className="h-1.5 bg-slate-100 rounded-full" />
      </div>

      {/* Grid Status Maklumat */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-orange-50/60 border border-orange-100/50 p-2 rounded-xl flex flex-col items-center justify-center">
          <Flame className="w-4 h-4 text-orange-500 mb-0.5" />
          <span className="text-[8px] font-bold text-slate-400 uppercase">Hari Streak</span>
          <span className="text-xs font-black text-slate-700 mt-0.5">{streakDays}</span>
        </div>

        <div className="bg-amber-50/60 border border-amber-100/50 p-2 rounded-xl flex flex-col items-center justify-center">
          <Coins className="w-4 h-4 text-amber-500 mb-0.5" />
          <span className="text-[8px] font-bold text-slate-400 uppercase">Baki Koin</span>
          <span className="text-xs font-black text-slate-700 mt-0.5">{currentCoins}</span>
        </div>

        <div className="bg-indigo-50/50 border border-indigo-100/40 p-2 rounded-xl flex flex-col items-center justify-center min-w-0">
          <Target className="w-4 h-4 text-indigo-500 mb-0.5" />
          <span className="text-[8px] font-bold text-slate-400 uppercase truncate w-full">Topik Semasa</span>
          <span className="text-[10px] font-black text-slate-700 mt-0.5 truncate w-full px-0.5">{currentTopic}</span>
        </div>
      </div>

      {/* 💡 PAPARAN MASA BELAJAR SEBENAR */}
      <div className="bg-indigo-900 text-white rounded-xl p-3 flex items-center justify-between border border-indigo-950/20">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-300 animate-pulse" />
          <div>
            <p className="text-[9px] font-bold text-indigo-200 uppercase tracking-wider leading-none">Masa Belajar Hari Ini</p>
            <p className="text-sm font-black mt-1 leading-none">{totalStudyMinutes} <span className="text-[11px] font-normal text-indigo-200">Minit</span></p>
          </div>
        </div>
        <Badge className="bg-white/20 text-white font-bold border-0 text-[9px]">Real-Time</Badge>
      </div>

      {/* Butang Tindakan Pengurusan Ibu Bapa */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-50">
        <Button size="sm" variant="outline" className="h-8 text-[10px] font-bold text-slate-600 rounded-xl">
          ⚙️ Kata Laluan
        </Button>
        <Button size="sm" variant="outline" className="h-8 text-[10px] font-bold text-rose-600 border-rose-100 hover:bg-rose-50 rounded-xl">
          <ShieldAlert className="w-3.5 h-3.5 mr-1" /> Sekat Akses
        </Button>
      </div>
    </Card>
  );
}

export default function MyChildrenPage() {
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
        const [progress, wallet] = await Promise.all([
          base44.entities.Progress.filter({ student_id: id }),
          base44.entities.Wallet.filter({ student_id: id }),
        ]);
        const childUser = await base44.entities.User.get(id).catch(() => null);
        
        const childProgress = progress?.[0] || {};
        return { 
          id, 
          ...childUser, 
          display_name: getDisplayName(childUser), 
          progress: childProgress, 
          wallet: wallet?.[0] || { balance: 0 },
          last_active: childProgress.updated_at || childUser?.last_active || null
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

  if (loading) return <div className="p-8 text-center text-xs text-slate-400">Memuatkan laporan anak...</div>;

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-7xl mx-auto bg-slate-50/30 min-h-screen">
      <div>
        <h1 className="text-xl font-black text-slate-800 flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-600" /> Profil Pengurusan Anak-Anak
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">Analisis kemajuan penuh, baki koin dan masa pembelajaran masa nyata.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {children.map((child) => (
          <DetailedChildCard key={child.id} child={child} />
        ))}
      </div>
    </div>
  );
}