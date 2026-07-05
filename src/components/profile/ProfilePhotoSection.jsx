import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Image as ImageIcon, Sparkles, Check } from "lucide-react";

// ============================================================
// DATA ENGINE AVATAR 3D LIVE CODES (100% UNBROKEN)
// Membina kesan kad holografik 3D dengan pencahayaan neon
// ============================================================
const AVATAR_THEMES = {
  warrior: {
    label: "⚔️ Warrior",
    items: [
      { id: "war_01", name: "Cyber Ninja", emoji: "🥷", baseColor: "#ef4444", bg: "from-slate-900 via-red-950 to-red-900", glow: "rgba(239, 68, 68, 0.6)" },
      { id: "war_02", name: "Pixel Knight", emoji: "🛡️", baseColor: "#3b82f6", bg: "from-slate-900 via-blue-950 to-indigo-900", glow: "rgba(59, 130, 246, 0.6)" },
      { id: "war_03", name: "Neon Samurai", emoji: "⚔️", baseColor: "#ec4899", bg: "from-slate-900 via-pink-950 to-purple-900", glow: "rgba(236, 72, 153, 0.6)" }
    ]
  },
  mecha: {
    label: "🤖 Mecha Pilot",
    items: [
      { id: "mec_01", name: "Iron Core", emoji: "🤖", baseColor: "#64748b", bg: "from-slate-900 via-slate-800 to-zinc-900", glow: "rgba(100, 116, 138, 0.6)" },
      { id: "mec_02", name: "Glitch Robot", emoji: "👾", baseColor: "#10b981", bg: "from-slate-900 via-emerald-950 to-teal-900", glow: "rgba(16, 185, 129, 0.6)" },
      { id: "mec_03", name: "Gundam Wing", emoji: "🚀", baseColor: "#f59e0b", bg: "from-slate-900 via-amber-950 to-orange-900", glow: "rgba(245, 158, 11, 0.6)" }
    ]
  },
  beast: {
    label: "🦊 Beast",
    items: [
      { id: "bst_01", name: "Nine-Tails Fox", emoji: "🦊", baseColor: "#f97316", bg: "from-slate-900 via-orange-950 to-red-900", glow: "rgba(249, 115, 22, 0.6)" },
      { id: "bst_02", name: "Azure Dragon", emoji: "🐉", baseColor: "#06b6d4", bg: "from-slate-900 via-cyan-950 to-emerald-900", glow: "rgba(6, 182, 212, 0.6)" },
      { id: "bst_03", name: "Shadow Tiger", emoji: "🐯", baseColor: "#eab308", bg: "from-slate-900 via-yellow-950 to-amber-950", glow: "rgba(234, 179, 8, 0.6)" }
    ]
  },
  mystic: {
    label: "🔮 Mystic Mage",
    items: [
      { id: "mys_01", name: "Cosmic Orb", emoji: "🔮", baseColor: "#d946ef", bg: "from-slate-900 via-fuchsia-950 to-violet-900", glow: "rgba(217, 70, 239, 0.6)" },
      { id: "mys_02", name: "Magic Flame", emoji: "🔥", baseColor: "#f43f5e", bg: "from-slate-900 via-rose-950 to-amber-900", glow: "rgba(244, 63, 94, 0.6)" },
      { id: "mys_03", name: "Void Mage", emoji: "✨", baseColor: "#6366f1", bg: "from-slate-950 via-indigo-950 to-slate-900", glow: "rgba(99, 102, 241, 0.6)" }
    ]
  }
};

export default function ProfilePhotoSection({ user, avatarMode, setAvatarMode, uploading, fileInputRef, handlePhotoUpload, handleSaveAvatar }) {
  const [activeTab, setActiveTab] = useState("warrior");

  // State untuk menyimpan koordinat tilt mouse bagi kesan 3D Real-time
  const [rotateX, setRotateX] = useState({});
  const [rotateY, setRotateY] = useState({});

  const checkIsSelected = (avatar) => {
    return user?.profile_picture_url === `css-avatar:${avatar.id}`;
  };

  // Fungsi mengira pergerakan 3D Live mengikut tetikus pelajar
  const handleMouseMove = (id, e) => {
    const card = e.currentTarget;
    const box = card.getBoundingClientRect();
    const x = e.clientX - box.left - box.width / 2;
    const y = e.clientY - box.top - box.height / 2;
    
    // Formula sudut kecondongan 3D
    setRotateX(prev => ({ ...prev, [id]: -y / 3 }));
    setRotateY(prev => ({ ...prev, [id]: x / 3 }));
  };

  const handleMouseLeave = (id) => {
    setRotateX(prev => ({ ...prev, [id]: 0 }));
    setRotateY(prev => ({ ...prev, [id]: 0 }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card className="border-border/60 shadow-2xl overflow-hidden bg-card">
        <CardHeader className="pb-4">
          <CardTitle className="font-heading font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
            Arena Avatar 3D Live & Interaktif
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
              🚀 Avatar 3D Live
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

          {/* BLOK MODE 1: PILIHAN GRID AVATAR 3D INTERAKTIF */}
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

              {/* Grid Arena 3D */}
              <div className="grid grid-cols-3 gap-4 pt-1" style={{ perspective: "1000px" }}>
                {AVATAR_THEMES[activeTab].items.map((avatar) => {
                  const isSelected = checkIsSelected(avatar);
                  const rX = rotateX[avatar.id] || 0;
                  const rY = rotateY[avatar.id] || 0;

                  return (
                    <div
                      key={avatar.id}
                      onMouseMove={(e) => handleMouseMove(avatar.id, e)}
                      onMouseLeave={() => handleMouseLeave(avatar.id)}
                      onClick={() => handleSaveAvatar(`css-avatar:${avatar.id}`)}
                      className="relative group cursor-pointer"
                      style={{ perspective: "600px" }}
                    >
                      {/* KAD MATRIKS 3D YANG BERTINDAK BALAS DENGAN MOUSE */}
                      <motion.div
                        animate={{ rotateX: rX, rotateY: rY }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        style={{ transformStyle: "preserve-3d" }}
                        className={`relative rounded-2xl p-4 text-center border-2 bg-gradient-to-br ${avatar.bg} flex flex-col items-center justify-center min-h-[140px] transition-all duration-150 ${
                          isSelected 
                            ? "border-white shadow-2xl" 
                            : "border-border/40 hover:border-white/50"
                        }`}
                        style={{
                          boxShadow: isSelected ? `0 20px 30px -5px ${avatar.glow}` : "none",
                        }}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2 bg-white text-slate-900 p-0.5 rounded-full z-20 shadow-lg" style={{ transform: "translateZ(30px)" }}>
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                        
                        {/* EFEK PUSAT BULATAN TENGAH (3D LAYER 1) */}
                        <div 
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-4xl sm:text-5xl transition-all bg-white/5 border border-white/10 backdrop-blur-xs shadow-inner"
                          style={{ 
                            transform: "translateZ(40px)",
                            boxShadow: `0 10px 20px ${avatar.glow.replace('0.6', '0.3')}`
                          }}
                        >
                          {/* KARAKTER UTAMA (3D LAYER 2 - TERAPUNG KELUAR) */}
                          <span className="block drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform duration-300">
                            {avatar.emoji}
                          </span>
                        </div>

                        {/* TEKS TEPAT (3D LAYER 1) */}
                        <p 
                          className="text-[10px] sm:text-xs font-black mt-3 text-white/90 uppercase tracking-wider truncate w-full"
                          style={{ transform: "translateZ(25px)" }}
                        >
                          {avatar.name}
                        </p>

                        {/* Lapisan Kilatan Cahaya (Hologram Specular Layer) */}
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                      </motion.div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* BLOK MODE 2: GAMBAR MANUAL */}
          {avatarMode === "photo" && (
            <div className="text-center py-4 space-y-4">
              {user?.profile_picture_url && !user.profile_picture_url.includes("css-avatar:") ? (
                <div className="relative w-24 h-24 mx-auto group">
                  <img
                    src={user.profile_picture_url}
                    alt="Your photo"
                    className="w-24 h-24 rounded-full object-cover border-4 border-primary/20 shadow-md"
                  />
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
                {uploading ? "Memuat naik..." : "Muat Naik Gambar Manual"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}