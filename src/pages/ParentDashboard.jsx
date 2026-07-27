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
  UserPlus, Flame, Loader2, ChevronRight, Users, Crown
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import AddChildModal from "@/components/parent/AddChildModal";
import ChildSummaryCard from "@/components/parent/ChildSummaryCard";
import ChildDetailPanel from "@/components/parent/ChildDetailPanel";
import { loadChildrenWithStats, getSelectedChildId, setSelectedChildId } from "@/lib/childUtils";

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

      {/* ═══ PENDING APPROVALS ═══ */}
      <PendingApprovalsBanner
        pendingCount={pendingApprovalsCount}
        onClick={() => navigate("/parent/approvals")}
      />

      {/* ═══ SHORTCUTS ═══ */}
      <div>
        <h3 className="text-sm font-bold text-slate-700 mb-3">Tindakan Pantas</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
            icon={Crown}
            title="Pembayaran"
            desc="Status langganan & akses"
            gradient="from-amber-500 to-orange-600"
            onClick={() => navigate("/parent/billing")}
          />

        </div>
      </div>

      {/* ═══ CHILDREN OVERVIEW ═══ */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-700">Anak-Anak Anda</h3>
          {childrenList.length > 0 && (
            <button
              onClick={() => navigate("/parent/children")}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5"
            >
              Urus Semua <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {childrenList.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {childrenList.map((child) => (
                <ChildSummaryCard
                  key={child.id}
                  child={child}
                  isSelected={selectedChild?.id === child.id}
                  onClick={() => {
                    if (selectedChild?.id === child.id) {
                      setSelectedChild(null);
                    } else {
                      setSelectedChild(child);
                      setSelectedChildId(child.id);
                    }
                  }}
                />
              ))}
            </div>

            {selectedChild && (
              <div className="mt-4">
                <ChildDetailPanel
                  child={selectedChild}
                  onClose={() => setSelectedChild(null)}
                />
              </div>
            )}
          </>
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
      </div>

      {/* ═══ ADD CHILD MODAL ═══ */}
      <AddChildModal
        open={addChildModalOpen}
        onOpenChange={setAddChildModalOpen}
        onChildAdded={loadDashboardData}
      />
    </div>
  );
}