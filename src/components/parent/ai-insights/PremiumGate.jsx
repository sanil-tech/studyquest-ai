// src/components/parent/ai-insights/PremiumGate.jsx
// Premium upsell card shown to free-tier parents.
import React from "react";
import { Crown, Sparkles, Brain, Target, AlertTriangle, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const FEATURES = [
  { icon: Sparkles, text: "Laporan Pertumbuhan AI Mingguan" },
  { icon: Brain, text: "Analisis Corak Pembelajaran" },
  { icon: Target, text: "Cadangan Misi Personal" },
  { icon: AlertTriangle, text: "Sistem Amaran Awal" },
  { icon: MessageCircle, text: "Chat AI dengan Suku" },
];

export default function PremiumGate() {
  return (
    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-5 text-white text-center space-y-4 shadow-lg">
      <div className="flex justify-center">
        <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
          <Crown className="w-6 h-6 text-amber-300" />
        </div>
      </div>
      <div>
        <h3 className="text-sm font-black flex items-center justify-center gap-1.5">
          🐢 Suku AI Learning Insights
        </h3>
        <p className="text-[11px] text-indigo-100 mt-1 leading-relaxed">
          Buka analisis pembelajaran diberkuasa AI — fahami kekuatan, kelemahan dan corak pembelajaran anak anda.
        </p>
      </div>
      <div className="bg-white/10 rounded-xl p-3 space-y-1.5 text-left">
        {FEATURES.map((f, i) => (
          <p key={i} className="text-[10px] font-bold flex items-center gap-1.5 text-indigo-50">
            <f.icon className="w-3 h-3 text-amber-300 shrink-0" /> {f.text}
          </p>
        ))}
      </div>
      <Button className="w-full bg-amber-400 hover:bg-amber-300 text-stone-900 font-black text-xs h-10 rounded-xl shadow-md">
        <Crown className="w-3.5 h-3.5 mr-1.5" /> Naik Taraf ke Premium
      </Button>
    </div>
  );
}