// src/pages/ParentProfilePage.jsx
// 📊 PARENT PROFILE — Cool, professional, distinct from student profile.
// Design language: indigo/slate gradients, initials avatar, parent-specific fields.

import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { LogOut, Crown, Users, Loader2, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/AuthContext";

export default function ParentProfilePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { checkUserAuth } = useAuth();

  const [user, setUser] = useState(null);
  const [childrenCount, setChildrenCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);
        setFormData({
          full_name: me.full_name || "",
          phone: me.phone || "",
        });

        try {
          const res = await base44.functions.invoke("fetchParentChildren");
          if (res.data?.success && Array.isArray(res.data.children)) {
            setChildrenCount(res.data.children.length);
          }
        } catch {}
      } catch (err) {
        console.error("Error loading parent profile:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe({
        full_name: formData.full_name,
        phone: formData.phone,
      });
      const updatedMe = await base44.auth.me();
      setUser(updatedMe);
      checkUserAuth();
      setEditing(false);
      toast({ title: "Profil disimpan! ✓", description: "Maklumat profil telah dikemas kini." });
    } catch (err) {
      toast({ title: "Gagal menyimpan", description: err.message || "Ralat pelayan", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    base44.auth.logout("/login");
  };

  const isPremium = user?.subscription_tier === "premium";

  const getInitials = (name) => {
    if (!name) return "IB";
    const parts = name.trim().split(" ");
    return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <p className="mt-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Memuat turun profil...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6 font-sans text-slate-800">

      {/* ═══ HERO CARD — Cool indigo gradient for parent ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-700 p-6 md:p-8 text-white shadow-xl"
      >
        <div className="relative flex flex-col sm:flex-row items-center justify-between gap-5 z-10">
          <div className="flex items-center gap-5 text-center sm:text-left">
            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md border-4 border-white/30 flex items-center justify-center shadow-xl shrink-0">
              <span className="text-2xl font-black tracking-wider">{getInitials(user?.full_name)}</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight">
                  {user?.full_name || "Ibu Bapa"}
                </h1>
                {isPremium && (
                  <span className="bg-amber-400 text-amber-900 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                    <Crown className="w-3 h-3" /> Premium
                  </span>
                )}
              </div>
              <p className="text-indigo-100 font-medium text-sm">
                {user?.email || "Ibu Bapa StudyQuest"}
              </p>
              <span className="inline-block bg-white/15 text-white font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Ibu Bapa
              </span>
            </div>
          </div>

          <Button
            size="sm"
            variant={editing ? "secondary" : "default"}
            disabled={saving}
            onClick={() => (editing ? handleSave() : setEditing(true))}
            className={`text-xs h-9 px-5 font-bold rounded-xl transition-all shadow-sm shrink-0 ${
              editing ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "bg-white text-indigo-600 hover:bg-indigo-50"
            }`}
          >
            {saving ? "Menyimpan..." : editing ? "Simpan" : "Kemaskini"}
          </Button>
        </div>
      </motion.div>

      {/* ═══ STATS ROW ═══ */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm text-center">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center mx-auto mb-2">
            <Users className="w-5 h-5 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-slate-800">{childrenCount}</p>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Anak</p>
        </Card>
        <Card className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm text-center">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center mx-auto mb-2">
            <Crown className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-lg font-bold text-slate-800">{isPremium ? "Premium" : "Percuma"}</p>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Langganan</p>
        </Card>
        <Card className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm text-center">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center mx-auto mb-2">
            <Shield className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-sm font-bold text-slate-800">{user?.role === "admin" ? "Admin" : "Ibu Bapa"}</p>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Peranan</p>
        </Card>
      </div>

      {/* ═══ PERSONAL DETAILS FORM ═══ */}
      <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
        <CardContent className="p-6 md:p-8 space-y-5">
          <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3">
            Maklumat Peribadi
          </h3>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Nama Penuh</Label>
            <Input
              value={formData.full_name}
              onChange={(e) => setFormData((prev) => ({ ...prev, full_name: e.target.value }))}
              disabled={!editing}
              placeholder="Nama penuh anda"
              className="rounded-xl border-slate-200"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">E-mel</Label>
            <Input
              value={user?.email || ""}
              disabled
              className="rounded-xl border-slate-200 bg-slate-50 text-slate-500"
            />
            <p className="text-[11px] text-slate-400">E-mel tidak boleh diubah.</p>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Nombor Telefon</Label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
              disabled={!editing}
              placeholder="012-3456789"
              className="rounded-xl border-slate-200"
            />
          </div>
        </CardContent>
      </Card>

      {/* ═══ SUBSCRIPTION BANNER ═══ */}
      {!isPremium && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl p-5 text-white shadow-lg flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <Crown className="w-8 h-8 shrink-0" />
            <div>
              <p className="font-black text-sm">Naik ke Premium</p>
              <p className="text-xs text-amber-50">Buka AI Insight lengkap & ciri istimewa</p>
            </div>
          </div>
          <Button
            onClick={() => navigate("/premium")}
            className="bg-white text-orange-600 hover:bg-orange-50 font-bold text-xs rounded-xl shrink-0"
          >
            Langgan
          </Button>
        </motion.div>
      )}

      {/* ═══ LOGOUT ═══ */}
      <Button
        variant="outline"
        onClick={handleLogout}
        className="w-full rounded-2xl h-12 text-red-500 border-red-200 bg-red-50 hover:bg-red-100 font-bold"
      >
        <LogOut className="w-4 h-4 mr-2" /> Log Keluar Akaun
      </Button>

    </div>
  );
}