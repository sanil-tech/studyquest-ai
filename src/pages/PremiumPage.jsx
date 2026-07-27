import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Crown, Check, Sparkles, Brain, Zap, ShoppingBag, Star, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

const PREMIUM_FEATURES = [
  { icon: Brain, title: "AI Insight Lengkap", description: "Laporan mingguan AI tentang perkembangan pembelajaran anak kamu." },
  { icon: Zap, title: "Kuiz Tanpa Had", description: "Akses semua kuiz dan latihan tanpa had harian." },
  { icon: ShoppingBag, title: "Item Avatar Eksklusif", description: "Buka item avatar premium yang istimewa di Kedai Avatar." },
  { icon: Star, title: "Makhluk Istimewa", description: "Akses makhluk avatar eksklusif untuk pelajar premium." },
];

export default function PremiumPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get("status");
    if (s === "success") setStatus("success");
    else if (s === "cancelled") setStatus("cancelled");
  }, []);

  const isPremium = user?.subscription_tier === "premium";
  const isInIframe = typeof window !== "undefined" && window.self !== window.top;

  const handleSubscribe = async () => {
    if (isInIframe || !user?.email) return;
    setLoading(true);
    try {
      const res = await base44.functions.invoke("createCheckoutSession", {
        email: user.email,
        origin: window.location.origin,
      });
      if (res.data?.url) {
        window.location.href = res.data.url;
      } else if (res.data?.error) {
        alert(res.data.error);
      }
    } catch (err) {
      console.error("Checkout error:", err);
      alert("Gagal memulakan pembayaran. Sila cuba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg mb-4">
            <Crown className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black text-stone-800 mb-2">StudyQuest Premium</h1>
          <p className="text-stone-500 font-medium">
            Buka potensi penuh pembelajaran anak kamu!
          </p>
        </motion.div>

        {/* Status Messages */}
        {status === "success" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-4 mb-6 text-center"
          >
            <Check className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
            <p className="font-black text-emerald-700">Pembayaran Berjaya! 🎉</p>
            <p className="text-xs text-emerald-600 mt-1">Akaun kamu kini Premium. Nikmati semua ciri istimewa!</p>
          </motion.div>
        )}
        {status === "cancelled" && (
          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 mb-6 text-center">
            <p className="font-black text-amber-700">Langganan Dibatalkan</p>
            <p className="text-xs text-amber-600 mt-1">Tiada caj dikenakan. Kamu boleh cuba lagi bila-bila masa.</p>
          </div>
        )}

        {/* Already Premium */}
        {isPremium ? (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl p-8 text-center text-white shadow-xl"
          >
            <Crown className="w-12 h-12 mx-auto mb-3" />
            <h2 className="text-2xl font-black mb-1">Kamu Adalah Premium! 👑</h2>
            <p className="text-amber-50 text-sm">
              Nikmati semua ciri istimewa StudyQuest tanpa had.
            </p>
          </motion.div>
        ) : (
          <>
            {/* Features List */}
            <div className="bg-white rounded-3xl shadow-lg border border-stone-100 p-6 mb-6 space-y-4">
              {PREMIUM_FEATURES.map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-4"
                >
                  <div className="shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                    <feature.icon className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-black text-stone-800 text-sm">{feature.title}</h3>
                    <p className="text-xs text-stone-500">{feature.description}</p>
                  </div>
                  <Check className="w-5 h-5 text-emerald-500 shrink-0 ml-auto" />
                </motion.div>
              ))}
            </div>

            {/* Pricing Card */}
            <div className="bg-white rounded-3xl shadow-lg border-2 border-amber-200 p-6 text-center mb-6">
              <div className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-3">
                <Sparkles className="w-3 h-3" /> Tawaran Istimewa
              </div>
              <div className="flex items-end justify-center gap-1 mb-1">
                <span className="text-4xl font-black text-stone-800">RM 19.90</span>
                <span className="text-stone-400 font-bold text-sm mb-1">/bulan</span>
              </div>
              <p className="text-xs text-stone-400">Batal bila-bila masa, tanpa komitmen jangka panjang.</p>
            </div>

            {/* Iframe Warning or Subscribe Button */}
            {isInIframe ? (
              <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5 text-center">
                <AlertCircle className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                <p className="font-black text-amber-800 text-sm">Pembayaran hanya tersedia di app yang telah diterbitkan.</p>
                <p className="text-xs text-amber-600 mt-1">Sila buka app di tab baru untuk melanggan Premium.</p>
              </div>
            ) : (
              <Button
                onClick={handleSubscribe}
                disabled={loading || !user?.email}
                className="w-full bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white font-black text-lg py-6 rounded-2xl shadow-lg border-b-4 border-orange-600 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  >
                    <Sparkles className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <>
                    <Crown className="w-5 h-5" />
                    Langgan Premium Sekarang
                  </>
                )}
              </Button>
            )}

            <p className="text-center text-[10px] text-stone-400 mt-4">
              Pembayaran selamat diproses oleh Stripe. Ciri Premium akan diaktifkan selepas pembayaran berjaya.
            </p>
          </>
        )}
      </div>
    </div>
  );
}