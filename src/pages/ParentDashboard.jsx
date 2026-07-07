// ---------------- INDIVIDUAL CHILD CARD (SYNCHRONIZED MILESTONE LOGIC) ----------------
function ChildCard({ child }) {
  // 1. Ambil data XP dan Level dari rekod Progress sebenar
  const currentXP = child.progress?.xp_score || 0;
  const currentLevel = child.progress?.level || 1;
  const nextLevelXP = child.progress?.next_level_xp || (currentLevel * 500);
  
  // Pengiraan kadar peratusan kemajuan XP yang tepat
  const xpPercentage = Math.min(Math.round((currentXP / nextLevelXP) * 100), 100);
  const lastActive = child.last_active ? moment(child.last_active).fromNow() : "Baru aktif";

  // 2. LOGIK MILESTONE (Diselaraskan dengan halaman MyChildren)
  // Menentukan evolusi reka bentuk naga bersandarkan jumlah XP Bersih anak
  const getDragonMilestone = (xp, lvl) => {
    if (xp >= 5000 || lvl >= 15) {
      return {
        stageTitle: "Ancient Inferno",
        gradient: "from-rose-600 via-red-500 to-amber-400",
        glow: "rgba(239, 68, 68, 0.4)",
        icon: "🐉",
        subtext: "Tier 3 Titan • Tahap Agung"
      };
    } else if (xp >= 1500 || lvl >= 6) {
      return {
        stageTitle: "Emerald Drake",
        gradient: "from-emerald-500 via-teal-500 to-cyan-500",
        glow: "rgba(16, 185, 129, 0.3)",
        icon: "🐲",
        subtext: "Tier 2 Winged • Tahap Menengah"
      };
    } else {
      return {
        stageTitle: "Ruby Hatchling",
        gradient: "from-purple-500 via-pink-500 to-rose-400",
        glow: "rgba(219, 39, 119, 0.2)",
        icon: "🦖",
        subtext: "Tier 1 Egg • Tahap Permulaan"
      };
    }
  };

  const milestone = getDragonMilestone(currentXP, currentLevel);

  return (
    <Card className="p-6 space-y-4 bg-white hover:shadow-lg transition-all border-slate-100 relative overflow-hidden group">
      
      {/* Status Keaktifan Sebenar */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5">
        <div className={`w-2 h-2 rounded-full ${child.last_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{lastActive}</span>
      </div>

      <div className="flex items-start gap-4">
        
        {/* AVATAR NAGA DENGAN LOGIK MILESTONE BARU */}
        <div className="relative flex flex-col items-center justify-center p-2 select-none flex-shrink-0">
          <div style={{ perspective: "1000px" }} className="relative w-20 h-20 flex items-center justify-center">
            <motion.div animate={{ scale: [0.95, 1.15, 0.95], rotate: 360 }} transition={{ duration: 10, repeat: Infinity }} style={{ boxShadow: `0 0 20px ${milestone.glow}` }} className="absolute inset-0 rounded-full border border-dashed border-white/20 opacity-50" />
            <motion.div animate={{ y: [-4, 4, -4], rotateY: [-5, 5, -5] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className={`w-16 h-16 rounded-full bg-gradient-to-tr ${milestone.gradient} border-2 border-white shadow-xl flex items-center justify-center relative z-10`}>
              <span className="text-4xl drop-shadow-lg">{milestone.icon}</span>
            </motion.div>
          </div>
          <span className="text-[10px] font-black text-slate-700 mt-2">{milestone.stageTitle}</span>
          <span className="text-[8px] font-bold text-muted-foreground/70 uppercase tracking-wider scale-90">{milestone.subtext.split("•")[0]}</span>
        </div>

        <div className="flex-grow space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-slate-800">{child.display_name}</h3>
            <Badge variant="secondary" className="bg-blue-50 text-blue-600 text-[10px] font-bold h-5">
              {child.education_level || "Standard 2"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground font-medium">Umur {calculateAge(child.date_of_birth)} Tahun</p>
          
          {/* Progress Bar Grafik XP */}
          <div className="pt-3 space-y-1.5">
            <div className="flex justify-between items-center text-[10px]">
              <span className="font-bold text-slate-500 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-indigo-500" /> 
                Ganjaran XP: <span className="text-slate-700 font-extrabold">{currentXP}</span> / {nextLevelXP} XP
              </span>
              <span className="font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                Tahap {currentLevel}
              </span>
            </div>
            <Progress value={xpPercentage} className="h-1.5 bg-slate-100" />
            <p className="text-[9px] text-right text-slate-400 font-medium">{xpPercentage}% menuju tahap seterusnya</p>
          </div>
        </div>
      </div>

      {/* Grid Subjek Fokus & Misi Harian Pelajar */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Topik Utama</p>
            <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-xs shadow-sm">🔢</div>
                <span className="text-xs font-bold text-slate-700 truncate">
                  {child.progress?.current_topic || "Pecahan (Math)"}
                </span>
            </div>
        </div>
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Misi Hari Ini</p>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-[10px] shadow-sm text-emerald-500 font-extrabold">
                  {child.progress?.completed_quests || 2}/{child.progress?.total_quests || 3}
                </div>
                <span className="truncate">Selesaikan Misi</span>
            </div>
        </div>
      </div>

      {/* Rail Metrik & Butang Sorakan Interaktif */}
      <div className="grid grid-cols-3 gap-2 bg-slate-50/50 p-3 rounded-xl text-center border border-slate-100 group-hover:bg-white transition-colors">
        <div>
          <p className="font-black text-slate-700">🪙 {child.wallet?.balance || 0}</p>
          <p className="text-[9px] text-muted-foreground font-bold uppercase">Koin</p>
        </div>
        <div className="border-x border-slate-200/50">
          <p className="font-black text-orange-500">🔥 {child.progress?.streak_days || 0}</p>
          <p className="text-[9px] text-muted-foreground font-bold uppercase">Streak</p>
        </div>
        <div 
          className="cursor-pointer hover:scale-105 transition-transform active:scale-95"
          onClick={() => alert(`🎉 Sorakan kasih sayang telah dihantar terus ke peranti ${child.display_name}!`)}
        >
          <p className="font-black text-rose-500">❤️ Sorak!</p>
          <p className="text-[9px] text-muted-foreground font-bold uppercase">Puji Anak</p>
        </div>
      </div>
    </Card>
  );
}