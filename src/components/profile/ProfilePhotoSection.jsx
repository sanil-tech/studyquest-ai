import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Image as ImageIcon, Sparkles, Check } from "lucide-react";

// ============================================================
// DATA AVATAR 2D ANIME BERANIMASI & GEMPAK
// Menggunakan GIF/WebP animasi berkualiti tinggi yang aktif
// ============================================================
const AVATAR_THEMES = {
  warrior: {
    label: "⚔️ Warrior",
    items: [
      { id: "war_01", name: "Goku Instinct", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbW84N3B5bXp5NXF5cXF5cXF5cXF5cXF5cXF5cXF5cXF5cXF5cXF5YyZjdD1z/vA80ED9bZ8MSpA3L7V/giphy.gif" },
      { id: "war_02", name: "Flame Samurai", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3g2bnd3M3B5bXp5NXF5cXF5cXF5cXF5cXF5cXF5cXF5cXF5cXF5YyZjdD1z/l0HJBsZF6YEXS02wE/giphy.gif" },
      { id: "war_03", name: "Shadow Ninja", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHg2bnd3M3B5bXp5NXF5cXF5cXF5cXF5cXF5cXF5cXF5cXF5cXF5YyZjdD1z/3o7TKpXvDbcAUBFmP6/giphy.gif" }
    ]
  },
  mecha: {
    label: "🤖 Mecha Pilot",
    items: [
      { id: "mec_01", name: "Cyber Mech", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNng2bnd3M3B5bXp5NXF5cXF5cXF5cXF5cXF5cXF5cXF5cXF5cXF5YyZjdD1z/3o7TKSjRrfIPjeiZfG/giphy.gif" },
      { id: "mec_02", name: "Neon Core", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExN3g2bnd3M3B5bXp5NXF5cXF5cXF5cXF5cXF5cXF5cXF5cXF5cXF5YyZjdD1z/l2JhvNfXwGQ7SdfO0/giphy.gif" }
    ]
  },
  beast: {
    label: "🦊 Beast",
    items: [
      { id: "bst_01", name: "Nine-Tails Fox", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHg2bnd3M3B5bXp5NXF5cXF5cXF5cXF5cXF5cXF5cXF5cXF5cXF5YyZjdD1z/3o7TKv6MclZfA0iO88/giphy.gif" },
      { id: "bst_02", name: "Azure Dragon", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOXg2bnd3M3B5bXp5NXF5cXF5cXF5cXF5cXF5cXF5cXF5cXF5cXF5YyZjdD1z/3o7TKxPhPstBf4mP4Y/giphy.gif" }
    ]
  },
  mystic: {
    label: "🔮 Mystic Mage",
    items: [
      { id: "mys_01", name: "Chrono Sorcerer", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMTB4Nm53M3B5bXp5NXF5cXF5cXF5cXF5cXF5cXF5cXF5cXF5cXF5YyZjdD1z/3o7TKsX7w5N7bS4v2E/giphy.gif" },
      { id: "mys_02", name: "Void Astrologer", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMTF4Nm53M3B5bXp5NXF5cXF5cXF5cXF5cXF5cXF5cXF5cXF5cXF5YyZjdD1z/l0HlUxcRI99pW9Gq4/giphy.gif" }
    ]
  }
};

// CSS Animasi Halus untuk Kesan "Bernafas/Hidup"
const pulseStyle = `
  @keyframes breathe {
    0% { transform: scale(1); filter: drop-shadow(0 4px 6px rgba(99, 102, 241, 0.2)); }
    50% { transform: scale(1.04); filter: drop-shadow(0 10px 15px rgba(99, 102, 241, 0.4)); }
    100% { transform: scale(1); filter: drop-shadow(0 4px 6px rgba(99, 102, 241, 0.2)); }
  }
  .lively-avatar {
    animation: breathe 3.5s ease-in-out infinite;
  }
`;

export default function ProfilePhotoSection({ user, avatarMode, setAvatarMode, uploading, fileInputRef, handlePhotoUpload, handleSaveAvatar }) {
  const [activeTab, setActiveTab] = useState("warrior");

  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = pulseStyle;
    document.head.appendChild(styleSheet);
    return () => document.head.removeChild(styleSheet);
  }, []);

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
          
          {/* Pilihan Mod: Avatar Anime atau Gambar Sendiri */}
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

          {/* KONTEKS 1: PILIHAN AVATAR ANIME GERAKAN (GEMPAK) */}
          {avatarMode === "emoji" && (
            <div className="space-y-4">
              {/* Tab Tema Kategori */}
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

              {/* Grid Paparan Watak Bergerak */}
              <div className="grid grid-cols-3 gap-3.5 pt-1">
                {AVATAR_THEMES[activeTab].items.map((avatar) => {
                  const isSelected = user?.profile_picture_url === avatar.url;
                  return (
                    <motion.div
                      key={avatar.id}
                      onClick={() => handleSaveAvatar(avatar.url)}
                      className={`group relative cursor-pointer border-2 rounded-xl p-2.5 text-center transition-all bg-secondary/10 hover:bg-secondary/30 ${
                        isSelected ? "border-primary bg-primary/5 shadow-md" : "border-transparent"
                      }`}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 bg-primary text-white p-0.5 rounded-full z-10 shadow-md">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                      
                      {/* Paparan Gambar Beranimasi */}
                      <img
                        src={avatar.url}
                        alt={avatar.name}
                        className="w-16 h-16 sm:w-20 sm:h-20 mx-auto object-contain lively-avatar"
                        loading="lazy"
                      />
                      <p className="text-[10px] font-bold mt-2 text-foreground truncate">{avatar.name}</p>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* KONTEKS 2: UPLOAD GAMBAR MANUAL PERANTI */}
          {avatarMode === "photo" && (
            <div className="text-center py-4 space-y-4">
              {user?.profile_picture_url && !user.profile_picture_url.includes("giphy.com") ? (
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
                    {user?.profile_picture_url && !user.profile_picture_url.includes("giphy.com") ? "Ganti Gambar Fail" : "Muat Naik Gambar"}
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