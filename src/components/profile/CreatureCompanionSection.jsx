// src/components/profile/CreatureCompanionSection.jsx
// Shows the student's chosen creature companion + evolution stage (based on XP),
// and allows selecting a different creature. Used on the Profile page.

import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import {
  CREATURES, getCreatureById, getCreatureStageProgress,
} from "@/lib/avatarSystem";
import { Check, Loader2, Sparkles, Star } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent } from "@/components/ui/card";

export default function CreatureCompanionSection({ user, xp = 0, targetStudentId, onCreatureChanged }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const currentCreatureId = user?.selected_creature || "otan";
  const creature = getCreatureById(currentCreatureId);
  const stageInfo = getCreatureStageProgress(currentCreatureId, xp);
  const currentStage = stageInfo.currentStage;

  const handleSelectCreature = async (newCreatureId) => {
    if (newCreatureId === currentCreatureId || saving) return;
    setSaving(true);
    try {
      if (targetStudentId) {
        await base44.functions.invoke("updateChildProfile", {
          child_id: targetStudentId,
          selected_creature: newCreatureId,
        });
      } else {
        await base44.auth.updateMe({ selected_creature: newCreatureId });
      }
      onCreatureChanged?.(newCreatureId);
      toast({ title: "Rakan Makhluk Dipilih! 🎉", description: "Makhluk baharu kini menemani kamu!" });
    } catch (err) {
      toast({ title: "Gagal menyimpan", description: "Sila cuba lagi.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-orange-100 shadow-sm rounded-2xl overflow-hidden bg-white">
      <CardContent className="p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-500" />
          <h3 className="text-sm font-bold text-slate-700">Rakan Makhluk</h3>
        </div>

        {/* ═══ Current Creature + Evolution Stage ═══ */}
        <div className={`rounded-2xl p-4 bg-gradient-to-br ${creature.bgGradient} border-2 ${creature.borderColor}`}>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-white/60 overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
              <img src={currentStage.imageUrl} alt={creature.name} className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-lg">{creature.emoji}</span>
                <p className={`font-black text-base ${creature.textColor}`}>{creature.name}</p>
                <span className="bg-white/70 text-slate-600 font-bold text-[10px] px-2 py-0.5 rounded-full">
                  Tahap {currentStage.stage}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-600 mt-0.5">{currentStage.name}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{currentStage.description}</p>
            </div>
          </div>

          {/* Evolution Progress Bar */}
          {!stageInfo.isMaxStage ? (
            <div className="mt-3">
              <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                <span>XP: {xp}</span>
                <span>Evolution seterusnya: {stageInfo.xpToNext} XP</span>
              </div>
              <div className="h-2 bg-white/50 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stageInfo.percent}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="h-full bg-emerald-500 rounded-full"
                />
              </div>
            </div>
          ) : (
            <div className="mt-3 bg-white/70 rounded-xl px-3 py-1.5 text-center">
              <p className="text-[11px] font-black text-emerald-700 flex items-center justify-center gap-1">
                <Star className="w-3 h-3 fill-emerald-500" /> Tahap Maksimum Tercapai!
              </p>
            </div>
          )}
        </div>

        {/* ═══ Creature Selection ═══ */}
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
            Tukar Rakan Makhluk
          </p>
          <div className="grid grid-cols-3 gap-3">
            {CREATURES.map((c) => {
              const isSelected = c.id === currentCreatureId;
              return (
                <button
                  key={c.id}
                  onClick={() => handleSelectCreature(c.id)}
                  disabled={saving || isSelected}
                  className={`p-2 rounded-2xl border-4 transition-all bg-gradient-to-br ${c.bgGradient} relative ${
                    isSelected
                      ? `${c.borderColor} ring-2 ring-emerald-200`
                      : "border-transparent hover:scale-105"
                  } ${saving ? "opacity-50" : ""}`}
                >
                  <img
                    src={c.stages[0].imageUrl}
                    alt={c.name}
                    className="w-full aspect-square rounded-xl object-cover mb-1"
                  />
                  <p className={`font-black text-xs ${c.textColor}`}>{c.name}</p>
                  {isSelected && (
                    <div className="absolute top-1 right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shadow">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          {saving && (
            <div className="flex items-center justify-center gap-1.5 mt-2 text-xs text-slate-400">
              <Loader2 className="w-3 h-3 animate-spin" /> Menyimpan...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}