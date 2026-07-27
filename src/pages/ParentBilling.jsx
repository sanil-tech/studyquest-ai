// src/pages/ParentBilling.jsx
// 💳 PARENT BILLING DASHBOARD — Subscription status & premium access management.
// Cool, professional design consistent with parent UI language.

import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import {
  Crown, Check, Loader2, CreditCard, Users, Calendar, AlertCircle,
  ArrowUpRight, Sparkles, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import moment from "moment";

export default function ParentBilling() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [user, setUser] = useState(null);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const me = await base44.auth.me();
      setUser(me);

      try {
        const res = await base44.functions.invoke("fetchParentChildren");
        if (res.data?.success && Array.isArray(res.data.children)) {
          setChildren(res.data.children);
        }
      } catch (err) {
        console.warn("Error fetching children:", err);
      }
    } catch (err) {
      console.error("Error loading billing data:", err);
      toast({
        title: "Ralat",
        description: "Gagal memuatkan data langganan.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const isPremium = user?.subscription_tier === "premium";
  const isInIframe = typeof window !== "undefined" && window.self !== window.top;

  const handleManageSubscription = async () => {
    if (isInIframe || !user?.email) return;
    setPortalLoading(true);
    try {
      const res = await base44.functions.invoke("createBillingPortalSession", {
        email: user.email,
        origin: window.location.origin,
      });
      if (res.data?.url) {
        window.location.href = res.data.url;
      } else if (res.data?.error) {
        toast({
          title: "Tidak tersedia",
          description: res.data.error,
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Gagal",
        description: "Tidak dapat membuka portal bil. Sila cuba lagi.",
        variant: "destructive",
      });
    } finally {
      setPortalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <p className="mt-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
          Memuat turun data bil...
        </p>
      </div>
    );
  }

  const expiryDate = user?.premium_expires_at
    ? moment(user.premium_expires_at).format("D MMM YYYY")
    : null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6 font-sans text-slate-800">

      {/* ═══ PAGE TITLE ═══ */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Pembayaran & Langganan</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Urus langganan Premium dan akses anak-anak anda
        </p>
      </div>

      {/* ═══ SUBSCRIPTION STATUS CARD ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {isPremium ? (
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-700 p-6 md:p-8 text-white shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-400 flex items-center justify-center shrink-0 shadow-lg">
                  <Crown className="w-7 h-7 text-amber-900" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold">StudyQuest Premium</h2>
                    <span className="bg-emerald-400/30 text-emerald-50 font-bold text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" /> Aktif
                    </span>
                  </div>
                  <p className="text-indigo-100 text-sm mt-0.5">RM 19.90 / bulan</p>
                  {expiryDate && (
                    <p className="text-indigo-200 text-xs mt-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Diperbaharui pada {expiryDate}
                    </p>
                  )}
                </div>
              </div>
              <Button
                onClick={handleManageSubscription}
                disabled={portalLoading}
                className="bg-white text-indigo-600 hover:bg-indigo-50 font-bold text-xs rounded-xl px-5 shrink-0"
              >
                {portalLoading ? (
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                ) : (
                  <CreditCard className="w-4 h-4 mr-1.5" />
                )}
                Urus Langganan
              </Button>
            </div>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-3xl bg-white border-2 border-slate-200 p-6 md:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0">
                  <Shield className="w-7 h-7 text-slate-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-700">Percuma</h2>
                  <p className="text-slate-500 text-sm mt-0.5">Tiada langganan aktif</p>
                </div>
              </div>
              <Button
                onClick={() => navigate("/premium")}
                disabled={isInIframe}
                className="bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white font-bold text-xs rounded-xl px-5 shrink-0 shadow-md"
              >
                <Crown className="w-4 h-4 mr-1.5" />
                Langgan Premium
              </Button>
            </div>

            {isInIframe && (
              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 font-medium">
                  Pembayaran hanya tersedia di app yang telah diterbitkan. Sila buka app di tab baru.
                </p>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* ═══ PREMIUM BENEFITS (if free) ═══ */}
      {!isPremium && (
        <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-700">Kelebihan Premium</h3>
            </div>
            {[
              "AI Insight lengkap untuk setiap anak",
              "Kuiz dan latihan tanpa had harian",
              "Item avatar eksklusif di Kedai Avatar",
              "Makhluk avatar istimewa untuk pelajar premium",
            ].map((benefit, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-emerald-600" />
                </div>
                <p className="text-sm text-slate-600">{benefit}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ═══ CHILDREN PREMIUM ACCESS ═══ */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-500" />
            Akses Premium Anak-Anak
          </h3>
          <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
            {children.length} Anak
          </span>
        </div>

        {children.length > 0 ? (
          <div className="space-y-3">
            {children.map((child, idx) => (
              <motion.div
                key={child.id || idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className={`border shadow-sm rounded-2xl overflow-hidden bg-white ${
                  isPremium ? "border-emerald-200" : "border-slate-200"
                }`}>
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-xl ${
                        isPremium ? "bg-emerald-50" : "bg-slate-100"
                      }`}>
                        {child.selected_avatar || child.avatar_emoji || "🧒"}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 text-sm truncate">
                          {child.nickname || child.full_name || "Anak"}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                          {child.education_level || child.school_year || "Pelajar StudyQuest"}
                        </p>
                      </div>
                    </div>
                    {isPremium ? (
                      <span className="bg-emerald-100 text-emerald-700 font-bold text-[10px] px-3 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1 shrink-0">
                        <Crown className="w-3 h-3" /> Premium Aktif
                      </span>
                    ) : (
                      <span className="bg-slate-100 text-slate-500 font-bold text-[10px] px-3 py-1.5 rounded-full uppercase tracking-wider shrink-0">
                        Percuma
                      </span>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {isPremium && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
                <Check className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-emerald-800">Semua anak dilindungi</p>
                  <p className="text-xs text-emerald-600 mt-0.5">
                    Langganan Premium anda meliputi semua anak yang dipautkan dengan akaun ini.
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Card className="p-8 text-center border-dashed border-2 border-slate-200 rounded-xl bg-white">
            <p className="text-sm text-slate-500 font-medium mb-3">
              Tiada anak dipautkan lagi. Tambah anak untuk menguruskan akses mereka.
            </p>
            <Button
              onClick={() => navigate("/parent/children")}
              className="bg-indigo-600 text-white rounded-lg font-semibold text-xs px-5 h-9"
            >
              <Users className="w-4 h-4 mr-1.5" /> Tambah Anak
            </Button>
          </Card>
        )}
      </div>

      {/* ═══ PAYMENT HISTORY / INFO ═══ */}
      {isPremium && (
        <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                <CreditCard className="w-5 h-5 text-indigo-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-700">Pengurusan Pembayaran Stripe</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kemas kini kaedah pembayaran, lihat sejarah bil, atau batalkan langganan melalui portal selamat Stripe.
                </p>
                <button
                  onClick={handleManageSubscription}
                  disabled={portalLoading}
                  className="mt-3 text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  Buka Portal Bil Stripe
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══ FAQ / HELP ═══ */}
      <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
        <CardContent className="p-5 space-y-3">
          <h3 className="text-sm font-bold text-slate-700">Soalan Lazim</h3>
          <div className="space-y-2">
            <div>
              <p className="text-xs font-bold text-slate-600">Boleh saya batalkan bila-bila masa?</p>
              <p className="text-xs text-slate-400 mt-0.5">Ya, anda boleh membatalkan langganan pada bila-bila masa melalui portal bil Stripe. Akses Premium kekal aktif sehingga tamat tempoh bil semasa.</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-600">Adakah semua anak saya dapat Premium?</p>
              <p className="text-xs text-slate-400 mt-0.5">Ya, langganan Premium anda meliputi semua anak yang dipautkan dengan akaun ibu bapa anda tanpa had.</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-600">Bagaimana pembayaran diproses?</p>
              <p className="text-xs text-slate-400 mt-0.5">Semua pembayaran diproses dengan selamat oleh Stripe. Kami tidak menyimpan maklumat kad kredit anda.</p>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}