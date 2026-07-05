import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Image as ImageIcon, Sparkles, Check } from "lucide-react";

// ============================================================
// DATA AVATAR BERTEMA MENGGUNAKAN CSS NEON TULEN (100% ANTI-PECAH)
// Setiap avatar dijana menggunakan kombinasi warna CSS & emoji 
// ============================================================
const AVATAR_THEMES = {
  warrior: {
    label: "⚔️ Warrior",
    items: [
      { id: "war_01", name: "Cyber Ninja", emoji: "🥷", bg: "from-red-500 via-orange-600 to-amber-500", glow: "shadow-red-500/50" },
      { id: "war_02", name: "Pixel Knight", emoji: "🛡️", bg: "from-blue-600 via-indigo-600 to-cyan-500", glow: "shadow-blue-500/50" },
      { id: "war_03", name: "Neon Samurai", emoji: "⚔️", bg: "from-rose-500 via-purple-600 to-indigo-600", glow: "shadow-purple-500/50" }
    ]
  },
  mecha: {
    label: "🤖 Mecha Pilot",
    items: [
      { id: "mec_01", name: "Iron Core", emoji: "🤖", bg: "from-slate-700 via-zinc-800 to-gray-600", glow: "shadow-slate-500/50" },
      { id: "mec_02", name: "Glitch Robot", emoji: "👾", bg: "from-emerald-500 via-teal-600 to-cyan-500", glow: "shadow-emerald-500/50" },
      { id: "mec_03", name: "Gundam Wing", emoji: "🚀", bg: "from-amber-400 via-orange-500 to-red-600", glow: "shadow-amber-500/50" }
    ]
  },
  beast: {
    label: "🦊 Beast",
    items: [
      { id: "bst_01", name: "Nine-Tails Fox", emoji: "🦊", bg: "from-orange-500 via-red-500 to-yellow-400", glow: "shadow-orange-500/50" },
      { id: "bst_02", name: "Azure Dragon", emoji: "🐉", bg: "from-cyan-400 via-blue-500 to-emerald-500", glow: "shadow-cyan-500/50" },
      { id: "bst_03", name: "Shadow Tiger", emoji: "🐯", bg: "from-amber-500 via-yellow-600 to-zinc-800", glow: "shadow-amber-600/50" }
    ]
  },
  mystic: {
    label: "🔮 Mystic Mage",
    items: [
      { id: "mys_01", name: "Cosmic Orb", emoji: "🔮", bg: "from-purple-600 via-fuchsia-600 to-pink-500", glow: "shadow-fuchsia-500/50" },
      { id: "mys_02", name: "Magic Flame", emoji: "🔥", bg: "from-red-600 via-rose-500 to-amber-400", glow: "shadow-rose-500/50" },
      { id: "mys_03", name: "Void Mage", emoji: "✨", bg: "from-indigo-900 via-purple-800 to-slate-900", glow: "shadow-purple-900/50" }
    ]
  }
};

export default function ProfilePhotoSection({ user, avatarMode, setAvatarMode, uploading, fileInputRef, handlePhotoUpload, handleSaveAvatar }) {
  const [activeTab, setActiveTab] = useState("warrior");

  // Fungsi untuk semak sama ada avatar tersuai ini sedang dipilih
  const checkIsSelected = (avatar) => {
    // Memandangkan kita simpan data sebagai string/URL, kita boleh simpan nilai pengecam unik
    return user?.profile_picture_url === `css-avatar:${avatar.id}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card className="border-border/60 shadow-xl overflow-hidden bg-card">
        <CardHeader className="pb-4">
          <CardTitle className="font-heading font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
            Penampilan Profil Pelajar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          
          {/* Pilihan Mod Utama Toggle */}
          <div className="flex gap-2.5 p-1 bg-secondary/30 rounded-xl border border-border/20">
            <Button
              variant={avatarMode === "emoji" ? "default" : "ghost"}
              size="sm"
              onClick={() => setAvatarMode("emoji")}
              className={`flex-1 font-bold rounded-lg transition-all ${avatarMode === "emoji" ? "shadow-md text-white bg-primary" : "text-muted-foreground"}`}
            >
              ⚡ Avatar Dinamik 2D
            </Button>
            <Button
              variant={avatarMode === "photo" ? "default" : "ghost"}
              size="sm"
              onClick={() => setAvatarMode("photo")}
              className={`flex-1 font-bold rounded-lg transition-all ${avatarMode === "photo" ? "shadow-md text-white bg-primary" : "text-muted-foreground"}`}
            >
              📷 Gambar Manual
            </Button>
          </div>

          {/* BLOK MODE 1: PILIHAN GRID AVATAR ANIME BERGERAK */}
          {avatarMode === "emoji" && (
            <div className="space-y-4">
              {/* Tab Tema Dalaman Sub-Seksyen */}
              <div className="flex flex-wrap gap-1.5 p-1 bg-muted/60 rounded-lg">
                {Object.entries(AVATAR_THEMES).map(([key, theme]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveTab(key)}
                    className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-md transition-all whitespace-nowrap capitalize ${
                      activeTab === key
                        ? "bg-card text-foreground shadow-xs border border-border/30"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {theme.label}
                  </button>
                ))}
              </div>

              {/* Grid Kandungan Utama Watak Gempak */}
              <div className="grid grid-cols-3 gap-3.5 pt-1">
                {AVATAR_THEMES[activeTab].items.map((avatar) => {
                  const isSelected = checkIsSelected(avatar);
                  return (
                    <motion.div
                      key={avatar.id}
                      onClick={() => handleSaveAvatar(`css-avatar:${avatar.id}`)}
                      className={`group relative cursor-pointer border-2 rounded-2xl p-3 text-center transition-all bg-secondary/10 hover:bg-secondary/30 flex flex-col items-center justify-center ${
                        isSelected ? "border-primary bg-primary/5 shadow-md" : "border-transparent"
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 bg-primary text-white p-0.5 rounded-full z-10 shadow-md">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                      
                      {/* LUKISAN AVATAR GRADIENT DENGAN EFEK NEON GLOW & PERGERAKAN LIVELY */}
                      <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br ${avatar.bg} shadow-lg ${avatar.glow} flex items-center justify-center text-3xl sm:text-4xl lively-avatar group-hover:rotate-6 transition-transform duration-300`}>
                        {avatar.emoji}
                      </div>

                      <p className="text-[10px] font-bold mt-2 text-foreground truncate w-full">{avatar.name}</p>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* BLOK MODE 2: PENGURUSAN FOTO MANUAL DARI PERANTI */}
          {avatarMode === "photo" && (
            <div className="text-center py-4 space-y-4">
              {user?.profile_picture_url && !user.profile_picture_url.includes("css-avatar:") ? (
                <div className="relative w-24 h-24 mx-auto group">
                  <img
                    src={user.profile_picture_url}
                    alt="Your photo"
                    className="w-24 h-24 rounded-full object-cover border-4 border-primary/20 shadow-md"
                  />
                  <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <p className="text-[10px] text-white font-semibold">Tukar Foto</p>
                  </div>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full bg-muted border border-dashed border-border/80 flex items-center justify-center mx-auto shadow-inner">
                  <ImageIcon className="w-8 h-8 text-muted-foreground/60" />
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full rounded-xl h-10 font-semibold shadow-xs"
              >
                {uploading ? (
                  <>
                    <Upload className="w-4 h-4 mr-2 animate-spin" />
                    Memuat naik...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    {user?.profile_picture_url && !user.profile_picture_url.includes("css-avatar:") ? "Ganti Gambar Fail" : "Muat Naik Gambar"}
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}