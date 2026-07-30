import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { AVATAR_ITEMS } from "@/lib/avatarSystem";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Coins, Check, Lock } from "lucide-react";

const SLOTS = ["hat", "glasses", "accessory"];
const SLOT_LABELS = { hat: "👒 Topi", glasses: "👓 Cermin", accessory: "🎒 Aksesori" };
const SLOT_EMOJIS = { hat: "👒", glasses: "👓", accessory: "🎒" };

export default function AvatarShop({
  walletBalance = 0,
  ownedItems = [],
  equippedItems = {},
  onBuy,
  onEquip,
  onClose,
}) {
  const [activeSlot, setActiveSlot] = useState("hat");
  const [busy, setBusy] = useState(null);

  const itemsBySlot = useMemo(() => {
    const grouped = {};
    for (const slot of SLOTS) {
      grouped[slot] = AVATAR_ITEMS.filter((i) => i.slot === slot);
    }
    return grouped;
  }, []);

  const handleBuy = async (item) => {
    setBusy(item.id);
    try {
      await onBuy(item);
    } finally {
      setBusy(null);
    }
  };

  const handleEquip = async (item) => {
    setBusy(item.id);
    try {
      await onEquip(item);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between text-lg font-black text-stone-800">
            <span>🛍️ Kedai Avatar</span>
            <span className="flex items-center gap-1.5 bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full text-sm font-black">
              <Coins className="w-4 h-4" />
              {walletBalance} Syiling
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* Slot Tabs */}
        <div className="flex gap-2 mb-3">
          {SLOTS.map((slot) => (
            <button
              key={slot}
              onClick={() => setActiveSlot(slot)}
              className={`flex-1 py-2.5 rounded-xl font-black text-sm transition-all ${
                activeSlot === slot
                  ? "bg-emerald-500 text-white shadow-md"
                  : "bg-stone-100 text-stone-500"
              }`}
            >
              {SLOT_LABELS[slot]}
            </button>
          ))}
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-3 gap-3 max-h-[380px] overflow-y-auto pr-1">
          {itemsBySlot[activeSlot].map((item) => {
            const owned = ownedItems.includes(item.id);
            const equipped = equippedItems[item.slot] === item.id;
            const canAfford = walletBalance >= item.price;

            return (
              <motion.div
                key={item.id}
                whileHover={{ scale: 1.03 }}
                className={`p-3 rounded-2xl border-2 text-center transition-all ${
                  equipped
                    ? "border-emerald-400 bg-emerald-50"
                    : owned
                      ? "border-blue-200 bg-blue-50"
                      : "border-stone-200 bg-white"
                }`}
              >
                <div className="text-4xl mb-1.5">{item.emoji}</div>
                <p className="text-xs font-black text-stone-800 leading-tight">
                  {item.name}
                </p>
                <p className="text-[9px] text-stone-400 mb-2 leading-tight">
                  {item.description}
                </p>

                {equipped ? (
                  <Button
                    onClick={() => handleEquip(item)}
                    disabled={busy === item.id}
                    size="sm"
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black"
                  >
                    <Check className="w-3 h-3 mr-1" /> Dipakai
                  </Button>
                ) : owned ? (
                  <Button
                    onClick={() => handleEquip(item)}
                    disabled={busy === item.id}
                    size="sm"
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white text-xs font-black"
                  >
                    {busy === item.id ? "..." : "Pakai"}
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleBuy(item)}
                    disabled={!canAfford || busy === item.id}
                    size="sm"
                    className={`w-full text-xs font-black ${
                      canAfford
                        ? "bg-amber-400 hover:bg-amber-300 text-stone-900"
                        : "bg-stone-200 text-stone-400"
                    }`}
                  >
                    {busy === item.id ? (
                      "..."
                    ) : canAfford ? (
                      <span className="flex items-center justify-center gap-1">
                        <Coins className="w-3 h-3" /> {item.price}
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-1">
                        <Lock className="w-3 h-3" /> {item.price}
                      </span>
                    )}
                  </Button>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Footer hint */}
        <p className="text-[10px] text-center text-stone-400 font-bold mt-2">
          Beli item guna Syiling Emas, lepas tu pakai pada avatar kamu! 💚
        </p>
      </DialogContent>
    </Dialog>
  );
}