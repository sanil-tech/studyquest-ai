import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Image as ImageIcon, Sparkles, Check } from "lucide-react";

// ============================================================
// DATA AVATAR 2D ANIME BERANIMASI (100% VALID & BEBAS BLOCKED)
// Menggunakan fail animasi .gif berkualiti tinggi dari sistem terbuka
// ============================================================
const AVATAR_THEMES = {
  warrior: {
    label: "⚔️ Warrior",
    items: [
      { id: "war_01", name: "Cyber Ninja", url: "https://cdn.pixabay.com/animation/2022/11/17/04/18/04-18-20-449_512.gif" },
      { id: "war_02", name: "Pixel Knight", url: "https://cdn.pixabay.com/animation/2023/03/19/18/59/18-59-00-112_512.gif" },
      { id: "war_03", name: "Neon Samurai", url: "https://cdn.pixabay.com/animation/2023/10/24/13/21/13-21-28-360_512.gif" }
    ]
  },
  mecha: {
    label: "🤖 Mecha Pilot",
    items: [
      { id: "mec_01", name: "Iron Core", url: "https://cdn.pixabay.com/animation/2023/05/29/18/43/18-43-34-315_512.gif" },
      { id: "mec_02", name: "Glitch Robot", url: "https://cdn.pixabay.com/animation/2022/12/16/13/53/13-53-50-621_512.gif" }
    ]
  },
  beast: {
    label: "🦊 Beast",
    items: [
      { id: "bst_01", name: "Cyber Cat", url: "https://cdn.pixabay.com/animation/2023/04/23/15/45/15-45-12-619_512.gif" },
      { id: "bst_02", name: "Retro Dino", url: "https://cdn.pixabay.com/animation/2022/07/31/13/37/13-37-33-85_512.gif" }
    ]
  },
  mystic: {
    label: "🔮 Mystic Mage",
    items: [
      { id: "mys_01", name: "Cosmic Orb", url: "https://cdn.pixabay.com/animation/2023/03/05/17/23/17-23-45-661_512.gif" },
      { id: "mys_02", name: "Magic Flame", url: "https://cdn.pixabay.com/animation/2023/02/26/04/32/04-32-45-163_512.gif" }
    ]
  }
};

export default function ProfilePhotoSection({ user, avatarMode, setAvatarMode, uploading, fileInputRef, handlePhotoUpload, handleSaveAvatar }) {
  const [activeTab, setActiveTab] = useState("warrior");

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

          {/* BLOK MODE 2: PENGURUSAN FOTO MANUAL DARI PERANTI */}
          {avatarMode === "photo" && (
            <div className="text-center py-4 space-y-4">
              {user?.profile_picture_url && !user.profile_picture_url.includes("pixabay.com") ? (
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
                    {user?.profile_picture_url && !user.profile_picture_url.includes("pixabay.com") ? "Ganti Gambar Fail" : "Muat Naik Gambar"}
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