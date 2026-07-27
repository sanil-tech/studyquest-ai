// src/pages/ParentDashboard.jsx
// 📊 PARENT EXPERIENCE — "Command Center" Theme
// Design language: cool colors, thin borders, subtle shadows, clean typography,
// data-viz elements, professional Malay, subtle animations.

import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import {
  Gift, BarChart2, CloudRain, Sun, Cloud, CloudLightning,
  MapPin, Clock, ArrowRight, Settings, UserPlus, Flame, Coins, Zap, Star,
  BookOpen, RefreshCw, Loader2, ChevronRight, Users, TrendingUp
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";

import AddChildModal from "@/components/parent/AddChildModal";
import SukuAIInsights from "@/components/parent/ai-insights/SukuAIInsights";
import {
  loadChildrenWithStats, getChildDisplayName, getChildAvatar, isAvatarUrl,
  getSelectedChildId, setSelectedChildId
} from "@/lib/childUtils";

// Maps WMO Weather Interpretation Codes (WW) to icons and language text
const getWeatherDetails = (code) => {
  if ([0, 1].includes(code)) return { label: "Cerah", icon: Sun, color: "text-amber-500" };
  if ([2, 3].includes(code)) return { label: "Berawan", icon: Cloud, color: "text-slate-400" };
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return { label: "Hujan", icon: CloudRain, color: "text-blue-500" };
  if ([95, 96, 99].includes(code)) return { label: "Ribut Petir", icon: CloudLightning, color: "text-purple-500" };
  return { label: "Cerah", icon: Sun, color: "text-amber-500" };
};

// Professional shortcut tile
function ShortcutCard({ icon: Icon, title, desc, gradient, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`bg-gradient-to-br ${gradient} p-4 rounded-xl shadow-sm flex items-center gap-3 text-white text-left w-full hover:shadow-md transition-all active:scale-95`}
    >
      <div className="bg-white/20 p-2.5 rounded-lg shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold truncate">{title}</p>
        <p className="text-[11px] text-white/80 truncate">{desc}</p>
      </div>
    </button>
  );
}

// Quick Child Switcher Bar
function ChildSelectorBar({ childrenList, selectedChildId, onSelectChild }) {
  if (!childrenList || childrenList.length <= 1) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
        Pilih Profil Anak
      </p>
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {childrenList.map((child) => {
          const isSelected = child.id === selectedChildId;
          const displayName = getChildDisplayName(child);
          const avatar = getChildAvatar(child);
          const avatarIsUrl = isAvatarUrl(avatar);

          return (
            <button
              key={child.id}
              onClick={() => onSelectChild(child.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all border shrink-0 ${
                isSelected
                  ? "bg-slate-800 text-white border-slate-800 shadow-md"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden text-sm shrink-0">
                {avatarIsUrl ? (
                  <img src={avatar} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  <span className="select-none">{avatar}</span>
                )}
              </div>
              <span className="truncate max-w-[100px]">{displayName}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Pending Reward Approvals Banner
function PendingApprovalsBanner({ pendingCount, onClick }) {
  if (!pendingCount || pendingCount === 0) return null;

  return (
    <div
      onClick={onClick}
      className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4 shadow-sm flex items-center justify-between cursor-pointer hover:bg-amber-100/50 transition-all active:scale-[0.99]"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
          <Gift className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h4 className="text-sm font-bold tracking-tight">
            {pendingCount} Permohonan Ganjaran Menunggu
          </h4>
          <p className="text-xs text-amber-700 font-medium mt-0.5">
            Anak anda telah menebus ganjaran. Sila semak dan sahkan.
          </p>
        </div>
      </div>
      <Button
        size="sm"
        className="bg-amber-600 text-white hover:bg-amber-700 font-semibold text-xs h-8 px-4 rounded-lg shrink-0"
      >
        Semak <ChevronRight className="w-3 h-3 ml-0.5" />
      </Button>
    </div>
  );
}

function SelectedChildPanel({ child, onSwitch, hasMultiple }) {
  const navigate = useNavigate();
  const displayName = getChildDisplayName(child);
  const avatar = getChildAvatar(child);
  const avatarIsUrl = isAvatarUrl(avatar);

  const currentXP = child.realProgress?.total_xp || 0;
  const currentLevel = child.realProgress?.level || 1;
  const xpForNext = currentLevel ? currentLevel * 200 : 200;
  const calculatedPercentage = Math.min(Math.round((currentXP / xpForNext) * 100), 100);
  const xpPercentage = isNaN(calculatedPercentage) ? 0 : calculatedPercentage;

  const streakDays = child.realProgress?.streak_days || 0;
  const coins = child.wallet?.balance || 0;
  const currentTopic = child.latestSession?.topic_name || "Misi Belum Mula";
  const totalStudyMinutes = child.latestSession?.duration_minutes || 0;

  const lastActiveTime = child.realProgress?.last_study_date
    ? moment(child.realProgress.last_study_date).format("DD/MM/YYYY")
    : "Tiada rekod aktif";

  return (
    <Card className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-4">
      {/* Profile Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0 overflow-hidden">
          {avatarIsUrl ? (
            <img src={avatar} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-xl select-none">{avatar}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-slate-800 truncate">{displayName}</h2>
          {child.full_name && child.full_name !== displayName && (
            <p className="text-xs text-slate-400 font-medium truncate">{child.full_name}</p>
          )}
          <div className="flex items-center gap-2 mt-1">
            <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
              <Clock className="w-3 h-3 text-slate-400" /> {lastActiveTime}
            </span>
            {child.education_level && (
              <span className="text-[11px] text-slate-500 font-medium bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                {child.education_level}
              </span>
            )}
          </div>
        </div>
        {hasMultiple && (
          <Button
            onClick={onSwitch}
            className="shrink-0 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg font-medium text-xs h-8 px-3 border-0"
          >
            <RefreshCw className="w-3 h-3 mr-1" /> Tukar
          </Button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-100">
        <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
          <span className="flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5 text-indigo-500" /> Kemajuan Tahap</span>
          <span>{currentXP} / {xpForNext} XP ({xpPercentage}%)</span>
        </div>
        <Progress value={xpPercentage} className="h-2 bg-slate-200 rounded-full" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-lg flex flex-col items-center justify-center text-center">
          <Star className="w-4 h-4 text-indigo-500 mb-1" />
          <span className="text-[10px] font-semibold text-slate-400 uppercase">Tahap</span>
          <span className="text-sm font-bold text-slate-700">{currentLevel}</span>
        </div>
        <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-lg flex flex-col items-center justify-center text-center">
          <Zap className="w-4 h-4 text-purple-500 mb-1" />
          <span className="text-[10px] font-semibold text-slate-400 uppercase">XP</span>
          <span className="text-sm font-bold text-slate-700">{currentXP}</span>
        </div>
        <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-lg flex flex-col items-center justify-center text-center">
          <Coins className="w-4 h-4 text-amber-500 mb-1" />
          <span className="text-[10px] font-semibold text-slate-400 uppercase">Koin</span>
          <span className="text-sm font-bold text-slate-700">{coins}</span>
        </div>
        <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-lg flex flex-col items-center justify-center text-center">
          <Flame className="w-4 h-4 text-orange-500 mb-1" />
          <span className="text-[10px] font-semibold text-slate-400 uppercase">Streak</span>
          <span className="text-sm font-bold text-slate-700">{streakDays}</span>
        </div>
      </div>

      {/* Mission Footer Info */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-indigo-50/50 border border-indigo-100 p-3 rounded-lg flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-500 shrink-0" />
          <div className="min-w-0">
            <span className="block text-[10px] font-semibold text-slate-400 uppercase">Topik Semasa</span>
            <span className="text-xs font-bold text-slate-700 truncate block">{currentTopic}</span>
          </div>
        </div>
        <div className="bg-slate-800 p-3 rounded-lg flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
          <div className="min-w-0">
            <span className="block text-[10px] font-semibold text-slate-400 uppercase">Sesi Terakhir</span>
            <span className="text-xs font-bold text-white">{totalStudyMinutes} minit</span>
          </div>
        </div>
      </div>

      <button
        onClick={() => navigate("/parent/children")}
        className="w-full flex items-center justify-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700 py-2"
      >
        Lihat Laporan Penuh Anak <ArrowRight className="w-4 h-4" />
      </button>
    </Card>
  );
}

export default function ParentDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [childrenList, setChildrenList] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [addChildModalOpen, setAddChildModalOpen] = useState(false);

  const [weather] = useState({ code: 0, temp: 28, city: "Kota Kinabalu" });

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      // 1. Fetch children profiles with stats
      const kids = await loadChildrenWithStats();
      setChildrenList(kids);

      // 2. Fetch pending reward requests across linked children
      const me = await base44.auth.me();
      if (me?.id) {
        const pendingRequests = await base44.entities.RewardRequest.filter({
          status: "pending"
        }).catch(() => []);

        setPendingApprovalsCount(pendingRequests.length);
      }

      // 3. Select active child persistence
      if (kids.length > 0) {
        const savedId = getSelectedChildId();
        const initial = kids.find((k) => k.id === savedId) || kids[0];
        setSelectedChild(initial);
      }
    } catch (err) {
      console.error("Ralat memuatkan dashboard:", err);
      toast({
        title: "Ralat Memuatkan Data",
        description: "Gagal memuatkan maklumat anak-anak.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
      </div>
    );
  }

  const weatherInfo = getWeatherDetails(weather.code);
  const WeatherIcon = weatherInfo.icon;

  // Derived summary stats from existing data
  const totalStreaks = childrenList.reduce((sum, c) => sum + (c.realProgress?.streak_days || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 space-y-6">

      {/* ═══ HEADER ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Dashboard Ibu Bapa
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {moment().format("dddd, D MMM YYYY")} · Pantau perkembangan anak-anak anda
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setAddChildModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-9 px-4 rounded-lg shadow-sm"
          >
            <UserPlus className="w-4 h-4 mr-1.5" /> Tambah Anak
          </Button>
        </div>
      </div>

      {/* ═══ QUICK STATS SUMMARY ═══ */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Users className="w-4 h-4 text-indigo-500" />
            </div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Anak</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{childrenList.length}</p>
        </Card>
        <Card className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <Gift className="w-4 h-4 text-amber-500" />
            </div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Menunggu</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{pendingApprovalsCount}</p>
        </Card>
        <Card className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
              <Flame className="w-4 h-4 text-orange-500" />
            </div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Streak Aktif</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{totalStreaks}</p>
        </Card>
      </div>

      {/* ═══ WEATHER WIDGET ═══ */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2.5">
          <WeatherIcon className={`w-5 h-5 ${weatherInfo.color}`} />
          <div>
            <span className="text-sm font-bold text-slate-700">{weatherInfo.label}, {weather.temp}°C</span>
            <span className="text-xs text-slate-400 flex items-center gap-0.5">
              <MapPin className="w-3 h-3" /> {weather.city}
            </span>
          </div>
        </div>
        <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-3 py-1 rounded-lg">
          {moment().format("D MMM")}
        </span>
      </div>

      {/* ═══ PENDING APPROVALS ═══ */}
      <PendingApprovalsBanner
        pendingCount={pendingApprovalsCount}
        onClick={() => navigate("/parent/approvals")}
      />

      {/* ═══ SHORTCUTS ═══ */}
      <div>
        <h3 className="text-sm font-bold text-slate-700 mb-3">Tindakan Pantas</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <ShortcutCard
            icon={Users}
            title="Pengurusan Anak"
            desc="Semak semua profil"
            gradient="from-indigo-600 to-blue-600"
            onClick={() => navigate("/parent/children")}
          />
          <ShortcutCard
            icon={Gift}
            title="Kedai Ganjaran"
            desc="Tetapkan hadiah"
            gradient="from-amber-500 to-orange-500"
            onClick={() => navigate("/parent/rewards")}
          />
          <ShortcutCard
            icon={BarChart2}
            title="Kelulusan"
            desc="Sahkan ganjaran"
            gradient="from-emerald-600 to-teal-600"
            onClick={() => navigate("/parent/approvals")}
          />
          <ShortcutCard
            icon={Settings}
            title="Pilih Profil"
            desc="Tukar modul anak"
            gradient="from-slate-700 to-slate-900"
            onClick={() => navigate("/parent/select-child")}
          />
        </div>
      </div>

      {/* ═══ CHILD SELECTOR ═══ */}
      <ChildSelectorBar
        childrenList={childrenList}
        selectedChildId={selectedChild?.id}
        onSelectChild={(childId) => {
          const matched = childrenList.find((c) => c.id === childId);
          if (matched) {
            setSelectedChild(matched);
            setSelectedChildId(childId);
          }
        }}
      />

      {/* ═══ ACTIVE CHILD PANEL ═══ */}
      {selectedChild ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <SelectedChildPanel
            child={selectedChild}
            onSwitch={() => navigate("/parent/select-child")}
            hasMultiple={childrenList.length > 1}
          />
        </motion.div>
      ) : (
        <Card className="p-8 text-center border-dashed border-2 border-slate-200 rounded-xl bg-white">
          <p className="text-sm text-slate-500 font-medium mb-3">
            Tiada profil anak dijumpai. Tambah profil anak pertama anda untuk bermula.
          </p>
          <Button
            onClick={() => setAddChildModalOpen(true)}
            className="bg-indigo-600 text-white rounded-lg font-semibold text-xs px-5 h-9"
          >
            <UserPlus className="w-4 h-4 mr-1.5" /> Tambah Profil Anak
          </Button>
        </Card>
      )}

      {/* ═══ SUKU AI LEARNING INSIGHTS ═══ */}
      {selectedChild && <SukuAIInsights childId={selectedChild.id} />}

      {/* ═══ ADD CHILD MODAL ═══ */}
      <AddChildModal
        open={addChildModalOpen}
        onOpenChange={setAddChildModalOpen}
        onChildAdded={loadDashboardData}
      />
    </div>
  );
}