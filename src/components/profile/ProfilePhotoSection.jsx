import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Image as ImageIcon, Sparkles, Check } from "lucide-react";

// ============================================================
// DATA UTAMA: 30 PILIHAN AVATAR 2D PREMIUM (100% KALIS PECAH)
// Disusun kepada 5 Kategori Strategik (6 avatar setiap kategori)
// ============================================================
const AVATAR_THEMES = {
  warrior: {
    label: "⚔️ Warriors",
    items: [
      { id: "war_01", name: "Cyber Ninja", emoji: "🥷", bg: "from-red-500 via-orange-500 to-amber-500" },
      { id: "war_02", name: "Pixel Knight", emoji: "🛡️", bg: "from-blue-600 via-indigo-600 to-cyan-500" },
      { id: "war_03", name: "Neon Samurai", emoji: "⚔️", bg: "from-rose-500 via-purple-600 to-indigo-600" },
      { id: "war_04", name: "Viking Chief", emoji: "🪓", bg: "from-amber-600 via-amber-700 to-amber-900" },
      { id: "war_05", name: "Royal Archer", emoji: "🏹", bg: "from-emerald-600 via-teal-600 to-cyan-600" },
      { id: "war_06", name: "Gladiator", emoji: "🔱", bg: "from-orange-600 via-red-600 to-stone-700" }
    ]
  },
  heroes: {
    label: "🦸 Heroes",
    items: [
      { id: "her_01", name: "Super Kid", emoji: "🦸", bg: "from-blue-500 via-red-500 to-yellow-400" },
      { id: "her_02", name: "Speedster", emoji: "⚡", bg: "from-yellow-400 via-orange-500 to-red-500" },
      { id: "her_03", name: "Spy Agent", emoji: "🕶️", bg: "from-zinc-700 via-slate-800 to-zinc-900" },
      { id: "her_04", name: "Aqua Hero", emoji: "🧜‍♂️", bg: "from-cyan-500 via-blue-500 to-indigo-600" },
      { id: "her_05", name: "Bio Mutant", emoji: "🧬", bg: "from-lime-400 via-emerald-500 to-teal-700" },
      { id: "her_06", name: "Star Captain", emoji: "🛡️", bg: "from-indigo-600 via-purple-600 to-pink-500" }
    ]
  },
  cyber: {
    label: "🌐 Cyberpunk",
    items: [
      { id: "cyb_01", name: "Mecha Core", emoji: "🤖", bg: "from-slate-700 via-zinc-800 to-gray-600" },
      { id: "cyb_02", name: "Glitch Ghost", emoji: "👾", bg: "from-emerald-500 via-teal-600 to-cyan-500" },
      { id: "cyb_03", name: "Rocket Pilot", emoji: "🚀", bg: "from-amber-400 via-orange-500 to-red-600" },
      { id: "cyb_04", name: "Net Runner", emoji: "💻", bg: "from-fuchsia-500 via-purple-600 to-indigo-700" },
      { id: "cyb_05", name: "DJ Neon", emoji: "🎧", bg: "from-pink-500 via-rose-500 to-violet-600" },
      { id: "cyb_06", name: "Android X", emoji: "🦾", bg: "from-cyan-600 via-slate-700 to-blue-900" }
    ]
  },
  beast: {
    label: "🦊 Chibi Animals",
    items: [
      { id: "bst_01", name: "Kyubi Fox", emoji: "🦊", bg: "from-orange-500 via-red-500 to-yellow-400" },
      { id: "bst_02", name: "Ryu Dragon", emoji: "🐉", bg: "from-cyan-400 via-blue-500 to-emerald-500" },
      { id: "bst_03", name: "Tora Tiger", emoji: "🐯", bg: "from-amber-500 via-yellow-600 to-zinc-800" },
      { id: "bst_04", name: "Panda Monk", emoji: "🐼", bg: "from-stone-300 via-stone-500 to-stone-700" },
      { id: "bst_05", name: "Shiba Inu", emoji: "🐶", bg: "from-amber-400 via-orange-400 to-amber-600" },
      { id: "bst_06", name: "Neko Thief", emoji: "🐱", bg: "from-purple-400 via-pink-400 to-indigo-500" }
    ]
  },
  mystic: {
    label: "🔮 Mystics",
    items: [
      { id: "mys_01", name: "Cosmic Orb", emoji: "🔮", bg: "from-purple-600 via-fuchsia-600 to-pink-500" },
      { id: "mys_02", name: "Flame Mage", emoji: "🔥", bg: "from-red-600 via-rose-500 to-amber-400" },
      { id: "mys_03", name: "Void Oracle", emoji: "✨", bg: "from-indigo-900 via-purple-800 to-slate-900" },
      { id: "mys_04", name: "Phoenix", emoji: "🦅", bg: "from-amber-500 via-red-500 to-rose-600" },
      { id: "mys_05", name: "Ice Wizard", emoji: "❄️", bg: "from-sky-400 via-blue-500 to-teal-400" },
      { id: "mys_06", name: "Time Scholar", emoji: "⏳", bg: "from-emerald-600 via-teal-700 to-slate-800" }
    ]
  }
};

export default function ProfilePhotoSection({ user, avatarMode, setAvatarMode, uploading, fileInputRef, handlePhotoUpload, handleSaveAvatar }) {
  const [activeTab, setActiveTab] = useState("warrior");

  const checkIsSelected = (avatar) => {
    return user?.profile_picture_url === `css-avatar:${avatar.id}`;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border shadow-lg bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="font-heading font-bold flex items-center gap-2 text-base md:text-lg">
            <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
            Pilih Karakter Avatar Anda ({Object.values(AVATAR_THEMES).reduce((acc, curr) => acc + curr.items.length, 0)} Pilihan)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Toggle Tab Utama (Avatar vs Upload) */}
          <div className="flex gap-2 p-1 bg-secondary/30 rounded-xl border">
            <Button
              variant={avatarMode === "emoji" ? "default" : "ghost"}
              size="sm"
              onClick={() => setAvatarMode("emoji")}
              className="flex-1 font-bold text-xs sm:text-sm"
            >
              ⚡ Galeri Avatar 2D
            </Button>
            <Button
              variant={avatarMode === "photo" ? "default" : "ghost"}
              size="sm"
              onClick={() => setAvatarMode("photo")}
              className="flex-1 font-bold text-xs sm:text-sm"
            >
              📷 Muat Naik Manual
            </Button>
          </div>

          {/* MODE GALERI AVATAR */}
          {avatarMode === "emoji" && (
            <div className="space-y-4">
              {/* Kategori Tab Menu */}
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-1 p-1 bg-muted rounded-xl">
                {Object.entries(AVATAR_THEMES).map(([key, theme]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveTab(key)}
                    className={`flex-1 py-2 px-2 text-[11px] font-bold rounded-lg transition-all whitespace-nowrap ${
                      activeTab === key ? "bg-card text-foreground border shadow-xs" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {theme.label}
                  </button>
                ))}
              </div>

              {/* Grid Paparan Avatar (6 Pilihan Per Kategori) */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {AVATAR_THEMES[activeTab].items.map((avatar) => {
                  const isSelected = checkIsSelected(avatar);
                  return (
                    <motion.div
                      key={avatar.id}
                      onClick={() => handleSaveAvatar(`css-avatar:${avatar.id}`)}
                      className={`relative cursor-pointer border rounded-xl p-2.5 text-center transition-all bg-secondary/10 flex flex-col items-center justify-center ${
                        isSelected ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border/60 hover:border-border"
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {isSelected && (
                        <div className="absolute top-1 right-1 bg-primary text-white p-0.5 rounded-full z-10 shadow-xs">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                      <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br ${avatar.bg} flex items-center justify-center text-2xl sm:text-3xl shadow-md transition-transform group-hover:scale-105`}>
                        <span className="select-none drop-shadow-md">{avatar.emoji}</span>
                      </div>
                      <p className="text-[9px] font-bold mt-2 truncate w-full text-muted-foreground text-center">{avatar.name}</p>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* MODE UNGGAH FOTO */}
          {avatarMode === "photo" && (
            <div className="text-center py-6 space-y-4">
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              <div className="w-20 h-20 rounded-full bg-muted border border-dashed flex items-center justify-center mx-auto shadow-inner">
                <ImageIcon className="w-6 h-6 text-muted-foreground/60" />
              </div>
              <Button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="w-full max-w-xs mx-auto rounded-xl">
                {uploading ? "Mengunggah..." : "Pilih Fail Imej"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}