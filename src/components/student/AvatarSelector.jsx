import React, { useState } from "react";
import { motion } from "framer-motion";
import { CREATURES } from "@/lib/avatarSystem";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function AvatarSelector({
  currentCreature = "otan",
  onSelect,
  onClose,
}) {
  const [selected, setSelected] = useState(currentCreature);
  const [saving, setSaving] = useState(false);

  const selectedCreature = CREATURES.find((c) => c.id === selected) || CREATURES[0];

  const handleConfirm = async () => {
    setSaving(true);
    try {
      await onSelect(selected);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-black text-stone-800">
            🐾 Pilih Rakan Avatar Kamu!
          </DialogTitle>
          <DialogDescription className="text-center text-stone-500">
            Setiap makhluk membesar bersama kamu melalui XP. Pilih dengan bijak!
          </DialogDescription>
        </DialogHeader>

        {/* Creature Grid */}
        <div className="grid grid-cols-3 gap-3 mt-2">
          {CREATURES.map((creature) => {
            const isSelected = selected === creature.id;
            return (
              <motion.button
                key={creature.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelected(creature.id)}
                className={`p-2 rounded-2xl border-4 transition-all bg-gradient-to-br ${creature.bgGradient} ${
                  isSelected
                    ? `${creature.borderColor} ring-4 ring-emerald-200`
                    : "border-stone-200"
                }`}
              >
                <img
                  src={creature.stages[0].imageUrl}
                  alt={creature.name}
                  className="w-full aspect-square rounded-xl object-cover mb-2"
                />
                <p className={`font-black text-sm ${creature.textColor}`}>
                  {creature.name}
                </p>
                <p className="text-[9px] text-stone-500">{creature.title}</p>
              </motion.button>
            );
          })}
        </div>

        {/* Selected Creature Description */}
        <div className="mt-3 p-3 bg-stone-50 rounded-xl border border-stone-200">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{selectedCreature.emoji}</span>
            <p className={`font-black text-sm ${selectedCreature.textColor}`}>
              {selectedCreature.name} — {selectedCreature.title}
            </p>
          </div>
          <p className="text-xs text-stone-500">{selectedCreature.description}</p>
        </div>

        {/* Confirm Button */}
        <Button
          onClick={handleConfirm}
          disabled={saving}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-3"
        >
          {saving ? "Menyimpan..." : "Sahkan Pilihan! 🎉"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}