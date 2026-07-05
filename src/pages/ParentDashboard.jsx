import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Users, Flame, Target, Clock, Coins, Zap, ArrowRight } from "lucide-react";
import moment from "moment";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

const getDisplayName = (user) => {
  if (!user) return "Pelajar";
  return user.nickname || user.username || user.email || "Pelajar";
};

function MinimalChildCard({ child, onViewMore }) {
  const sessionData = child.latestSession || {};
  const progressData = child.realProgress || {};
  
  // Kiraan XP & Peratusan Level (Sama logik dengan StatsBar anak)
  const currentXP = progressData.total_xp || 0; 
  const xpForNext = progressData.level ? progressData.level * 200 : 200;
  const xpPercentage = Math.min(Math.round(((currentXP % xpForNext) / xpForNext) * 100), 100);
  
  const streakDays = progressData.streak_days || 0;
  const currentCoins = child.wallet?.balance || 0;
  const currentTopic = sessionData.topic_name || "Belum Mula"; 
  const totalStudyMinutes = sessionData.duration_minutes || 0; 

  const displayName = getDisplayName(child); 

  return (
    <Card className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm flex flex-col justify-between space-y-4">
      
      {/* Profil Ringkas */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100 text-lg shrink-0">
          👦
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <h3 className="text-sm font-black text-slate-800 uppercase truncate">{displayName}</h3>
            <Badge className="bg-indigo-50 text-indigo-600 border-0 text-[10px] font-black px-1.5 py-0 h-4 rounded shrink-0">
              Lv {progressData.level || 1}
            </Badge>
          </div>
          <p className="text-[10px] font-bold text-slate-400 mt-0.5 truncate">{child.email}</p>
        </div>
      </div>

      {/* Ringkasan XP */}
      <div className="space-y-1 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
        <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
          <span className="flex items-center gap-0.5"><Zap className="w-3 h-3 text-purple-500" /> XP Terkumpul</span>
          <span>{currentXP} XP</span>
        </div>
        <Progress value={isNaN(xpPercentage) ? 0 : xpPercentage} className="h-1.5 bg-slate-100 rounded-full" />
      </div>

      {/* 3 Status Utama */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-orange-50/60 border border-orange-100/50 p-2 rounded-xl flex flex-col items-center justify-center">
          <Flame className="w-4 h-4 text-orange-500 mb-0.5" />
          <span className="text-[8px] font-bold text-slate-400 uppercase">Streak</span>
          <span className="text-xs font-black text-slate-700 mt-0.5">{streakDays} Hari</span>
        </div>

        <div className="bg-amber-50/60 border border-amber-100/50 p-2 rounded-xl flex flex-col items-center justify-center">
          <Coins className="w-4 h-4 text-amber-500 mb-0.5" />
          <span className="text-[8px] font-bold text-slate-400 uppercase">Koin</span>
          <span className="text-xs font-black text-slate-700 mt-0.5">{currentCoins}</span>
        </div>

        <div className="bg-indigo-50/50 border border-indigo-100/40 p-2 rounded-xl flex flex-col items-center justify-center min-w-0">
          <Target className="w-4 h-4 text-indigo-500 mb-0.5" />
          <span className="text-[8px] font-bold text-slate-400 uppercase truncate w-full">Topik</span>
          <span className="text-[10px] font-black text-slate-700 mt-0.5 truncate w-full px-0.5">{currentTopic}</span>
        </div>
      </div>

      {/* Masa Sesi Terakhir */}
      <div className="bg-slate-900 text-white rounded-xl p-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-[10px] font-bold text-slate-300 uppercase">Masa Belajar Terkini</span>
        </div>
        <span className="text-xs font-black">{totalStudyMinutes} Minit</span>
      </div>

      {/* Butang Pintasan ke Laporan Penuh */}
      <Button 
        onClick={onViewMore}
        variant="ghost"
        className="w-full h-8 text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl flex items-center justify-center gap-1"
      >
        Lihat Laporan Penuh <ArrowRight className="w-3.5 h-3.5" />
      </Button>
    </Card>
  );
}

export default function ParentDashboard() {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const u = await base44.auth.me();
      const rel = await base44.entities.ParentChildRelationship.filter({ parent_id: u.id, status: "active" });
      if (!rel?.length) {
        setChildren([]);
        return setLoading(false);
      }
      
      const childIds = rel.map(r => r.child_id);
      const kids = await Promise.all(childIds.map(async (id) => {
        const [studySessionRes, progressRes, walletRes, childUser] = await Promise.all([
          base44.entities.StudySession.filter({ student_id: id }).catch(() => []),
          base44.entities.Progress.filter({ student_id: id }).catch(() => []),
          base44.entities.Wallet.filter({ student_id: id }).catch(() => []),
          base44.entities.User.get(id).catch(() => null),
        ]);

        let latestSession = {};
        if (studySessionRes && studySessionRes?.length > 0) {
          const sorted = [...studySessionRes].sort((a, b) => 
            new Date(b.updated_date || b.created_date || 0) - new Date(a.updated_date || a.created_date || 0)
          );
          latestSession = sorted[0];
        }

        let realProgress = { total_xp: 0, streak_days: 0, level: 1 };
        if (progressRes && progressRes?.length > 0) {
          const sortedProgress = [...progressRes].sort((a, b) => 
            new Date(b.updated_at || b.last_study_date || 0) - new Date(a.updated_at || a.last_study_date || 0)
          );
          realProgress = sortedProgress[0];
        }

        return { 
          id, 
          email: childUser?.email || "Tiada E-mel",
          nickname: childUser?.nickname || "",
          username: childUser?.username || "",
          wallet: walletRes?.[0] || { balance: 0 },
          latestSession,
          realProgress
        };
      }));
      setChildren(kids);
    } catch (err) {
      console.error("Ralat Dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDashboardData(); }, []);

  if (loading) {
    return <div className="p-6 text-center text-xs text-slate-400 font-medium">Memuatkan ringkasan dashboard...</div>;
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-7xl mx-auto bg-slate-50/30 min-h-screen">
      <div>
        <h1 className="text-lg font-black text-slate-800 flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-600" /> Ringkasan Aktiviti Anak
        </h1>
        <p className="text-[11px] text-slate-400 mt-0.5">Pandangan sepintas lalu untuk prestasi anak. Untuk laporan kuiz dan silibus penuh, klik "Lihat Laporan Penuh".</p>
      </div>

      {children.length === 0 ? (
        <div className="text-center p-8 bg-white border rounded-2xl text-xs text-slate-400 italic">
          Tiada profil anak yang dipautkan lagi.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {children.map((child) => (
            <MinimalChildCard 
              key={child.id} 
              child={child} 
              onViewMore={() => {
                // Navigasi ke halaman MyChildrenPage
                window.location.href = "/parent/my-children"; 
              }} 
            />
          ))}
        </div>
      )}
    </div>
  );
}