// src/pages/LearningSpace.jsx
import React, { useState } from "react";
import { 
  Tv, BookOpen, Network, CheckCircle2, ChevronRight, Award, 
  Sparkles, Flame, Volume2, Moon, Sun, ArrowLeft, Trophy 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function LearningSpace({ 
  ageGroup = "kid", // 'kid' (7-12) atau 'teen' (13-17)
  lessonData = {
    id: "sifir-mudah",
    topic_name: "Formula Sifir Darab Ekspres! 🎯",
    subject_name: "Matematik Borneo",
    video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Embed URL format
    notes_content: JSON.stringify({
      text: "Bah, ingat formula ni! Sifir 5 senang jak, macam kita kira jari tangan kawan kita. Setiap lompatan tambah 5. Aram gait, jangan takut silap, sikit lagi kita sampai puncak Gunung Kinabalu!",
      image: "https://images.unsplash.com/photo-1590005354167-6da97870c913?w=600"
    }),
    infographic_url: "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=800"
  },
  onCompleteBranch
}) {
  const [activeBranch, setActiveBranch] = useState("video"); // video -> lesson -> mindmap
  const [completedBranches, setCompletedBranches] = useState({ video: false, lesson: false, mindmap: false });
  const [showCelebration, setShowCelebration] = useState(false);

  // Parse nota pengajian secara selamat
  let noteText = "";
  let noteImg = "";
  try {
    const parsed = JSON.parse(lessonData.notes_content);
    noteText = parsed.text || "";
    noteImg = parsed.image || "";
  } catch(e) {
    noteText = lessonData.notes_content;
  }

  // Pengendali Klik Selesai Dahan (Duolingo-Style Reward Trigger)
  const handleMarkComplete = (branchKey) => {
    setCompletedBranches(prev => ({ ...prev, [branchKey]: true }));
    setShowCelebration(true);
    
    // Suara pop gembira jika dalam mod kanak-kanak
    if (ageGroup === "kid") {
      try { new Audio("https://assets.mixkit.co/active_storage/sfx/2019/2019-84.wav").play(); } catch(e){}
    }

    setTimeout(() => {
      setShowCelebration(false);
      // Auto-advance ke dahan seterusnya ala Duolingo
      if (branchKey === "video") setActiveBranch("lesson");
      else if (branchKey === "lesson") setActiveBranch("mindmap");
    }, 2000);
  };

  // Konfigurasi visual bertema mengikut umur & lokaliti Borneo
  const isKid = ageGroup === "kid";
  
  return (
    <div className={`min-h-screen font-sans transition-colors duration-500 ${
      isKid 
        ? "bg-gradient-to-b from-emerald-50 via-teal-50 to-amber-50 text-slate-700" 
        : "bg-slate-950 text-slate-100 selection:bg-emerald-500/30"
    }`}>
      
      {/* 1. TOP NAVBAR: KEMAS & BERPANDUKAN KHAN ACADEMY */}
      <div className={`border-b backdrop-blur-md sticky top-0 z-50 px-4 py-3 flex items-center justify-between ${
        isKid ? "bg-white/80 border-teal-100 shadow-xs" : "bg-slate-900/80 border-slate-800"
      }`}>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className={`rounded-xl ${isKid ? "hover:bg-teal-50 text-teal-700" : "text-slate-400 hover:bg-slate-800"}`}>
            <ArrowLeft className="w-4 h-4 mr-1" /> {isKid ? "Kembali Balik" : "Keluar"}
          </Button>
          <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800" />
          <div>
            <h2 className={`text-xs font-black uppercase tracking-widest ${isKid ? "text-teal-600" : "text-emerald-400"}`}>
              {lessonData.subject_name}
            </h2>
            <h1 className={`text-sm sm:text-base font-black truncate max-w-[200px] sm:max-w-[400px] ${!isKid && "text-white"}`}>
              {lessonData.topic_name}
            </h1>
          </div>
        </div>

        {/* METRIK STREAK & COINS (DUOLINGO LOOK) */}
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-black text-xs shadow-xs border ${
            isKid ? "bg-orange-50 border-orange-100 text-orange-600" : "bg-orange-950/40 border-orange-900/50 text-orange-400"
          }`}>
            <Flame className="w-4 h-4 fill-current animate-pulse" /> 3 Hari Streak!
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-black text-xs shadow-xs border ${
            isKid ? "bg-amber-50 border-amber-100 text-amber-600" : "bg-slate-800 border-slate-700 text-amber-400"
          }`}>
            🪙 +140
          </div>
        </div>
      </div>

      {/* PANORAMA UTAMA: PEMBAHAGIAN KANDUNGAN (SPLIT-VIEW LAYOUT) */}
      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* LEADING SIDEBAR: DAHAN NAVIGATION (DUOLINGO PATH METAPHOR) */}
        <div className="lg:col-span-1 space-y-3">
          <p className={`text-[10px] font-black uppercase tracking-widest px-2 ${isKid ? "text-slate-400" : "text-slate-500"}`}>
            {isKid ? "Dahan Misi Anda 🌳" : "Modul Pembelajaran"}
          </p>
          
          <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
            {[
              { id: "video", label: isKid ? "Dahan 1: Video Guru" : "1. Video Kuliah", icon: Tv, color: "from-blue-400 to-indigo-500" },
              { id: "lesson", label: isKid ? "Dahan 2: Nota Pintar" : "2. Nota Interaktif", icon: BookOpen, color: "from-emerald-400 to-teal-500" },
              { id: "mindmap", label: isKid ? "Dahan 4: Peta Minda" : "3. Peta Sinopsis", icon: Network, color: "from-purple-400 to-pink-500" },
            ].map((branch) => {
              const BranchIcon = branch.icon;
              const isActive = activeBranch === branch.id;
              const isDone = completedBranches[branch.id];

              return (
                <button
                  key={branch.id}
                  onClick={() => setActiveBranch(branch.id)}
                  className={`w-full text-left p-3.5 rounded-2xl font-black text-xs flex items-center justify-between border-2 transition-all shrink-0 min-w-[150px] lg:min-w-0 ${
                    isActive
                      ? isKid 
                        ? "bg-white border-teal-500 text-teal-900 shadow-md translate-x-1"
                        : "bg-slate-900 border-emerald-500 text-white translate-x-1"
                      : isKid
                      ? "bg-slate-100/60 border-transparent text-slate-500 hover:bg-white"
                      : "bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-inner ${
                      isActive ? `bg-gradient-to-br ${branch.color} text-white` : isKid ? "bg-white" : "bg-slate-800"
                    }`}>
                      <BranchIcon className="w-4 h-4" />
                    </div>
                    <span>{branch.label}</span>
                  </div>
                  {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>

          {/* KAD KATA SEMANGAT DARI OTAN MASKOT LOKAL BORNEO */}
          {isKid && (
            <div className="hidden lg:block bg-gradient-to-br from-amber-400 via-orange-400 to-yellow-500 p-4 rounded-[2rem] border-b-[6px] border-orange-700 text-white relative overflow-hidden shadow-md mt-6">
              <div className="absolute -right-6 -bottom-6 text-7xl opacity-15 select-none rotate-12">🦧</div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="bg-white/20 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider">Sorakan Otan</span>
              </div>
              <p className="text-[11px] font-black leading-relaxed drop-shadow-xs">
                "Mantap bossku! Sikit lagi kita mau sampai puncak dahan ni. Sedia untuk terbang macam Burung Kenyalang? Jom!"
              </p>
            </div>
          )}
        </div>

        {/* MAIN DISPLAY WINDOW: FOKUS UTAMA MATANG ALA KHAN ACADEMY */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeBranch}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className={`rounded-[2.5rem] border p-6 min-h-[480px] flex flex-col justify-between shadow-xl relative overflow-hidden ${
                isKid ? "bg-white border-teal-100/50" : "bg-slate-950 border-slate-800/80"
              }`}
            >
              
              {/* KANDUNGAN BERIKUTAN PILIHAN DAHAN */}
              <div className="flex-1">
                
                {/* DAHAN 1: VIDEO DISPLAY PANEL */}
                {activeBranch === "video" && (
                  <div className="space-y-4">
                    <div className={`aspect-video w-full rounded-2xl overflow-hidden border shadow-inner ${isKid ? "bg-slate-100 border-teal-50" : "bg-slate-900 border-slate-800"}`}>
                      <iframe 
                        className="w-full h-full"
                        src={lessonData.video_url} 
                        title="Video Kandungan Guru"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                    <div>
                      <h3 className={`text-base font-black ${!isKid && "text-white"}`}>{isKid ? "Tonton Filem Ilmu 🎬" : "Sesi Rakaman Pembelajaran"}</h3>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">Fokus pada video di atas untuk membuka dahan cabaran seterusnya.</p>
                    </div>
                  </div>
                )}

                {/* DAHAN 2: NOTA PINTAR & GAMBAR */}
                {activeBranch === "lesson" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    {noteImg && (
                      <div className={`w-full rounded-2xl overflow-hidden border shadow-xs p-1 ${isKid ? "bg-amber-50/50 border-amber-100" : "bg-slate-900 border-slate-800"}`}>
                        <img src={noteImg} alt="Nota Visual" className="w-full h-auto object-cover max-h-64 rounded-xl" />
                      </div>
                    )}
                    <div className="space-y-4">
                      <div className={`p-5 rounded-2xl border leading-relaxed text-xs sm:text-sm shadow-inner ${
                        isKid ? "bg-gradient-to-br from-teal-50/30 to-amber-50/20 border-teal-100 text-slate-700 font-bold" : "bg-slate-900/50 border-slate-800 text-slate-300 font-medium"
                      }`}>
                        {noteText}
                      </div>
                    </div>
                  </div>
                )}

                {/* DAHAN 4: PETA MINDA ZOOM VIEW */}
                {activeBranch === "mindmap" && (
                  <div className="space-y-4">
                    <h3 className={`text-base font-black ${!isKid && "text-white"}`}>{isKid ? "Peta Minda Harta Karun 🗺️" : "Peta Sinopsis Struktur Modul"}</h3>
                    <div className={`w-full rounded-2xl border p-2 flex items-center justify-center bg-white ${isKid ? "border-purple-200" : "border-slate-800 bg-slate-900"}`}>
                      {lessonData.infographic_url ? (
                        <img src={lessonData.infographic_url} alt="Peta Minda" className="max-w-full h-auto object-contain max-h-[350px] rounded-xl shadow-xs" />
                      ) : (
                        <div className="py-12 text-center text-xs text-slate-400 font-bold">⚠️ Fail gambar peta minda belum dimasukkan oleh guru.</div>
                      )}
                    </div>
                  </div>
                )}

              </div>

              {/* ACTION FOOTER BAR (DUOLINGO CELEBRATION FLOATING LAYOUT) */}
              <div className={`mt-6 pt-4 border-t flex items-center justify-between gap-4 ${isKid ? "border-slate-100" : "border-slate-900"}`}>
                <div className="text-left hidden sm:block">
                  <span className={`text-[10px] font-black uppercase tracking-wider block ${isKid ? "text-teal-600" : "text-emerald-400"}`}>Ganjaran Misi Ini</span>
                  <span className="text-xs font-mono font-black">🎁 +50 XP • 🪙 +10 Syiling</span>
                </div>
                
                <Button
                  onClick={() => handleMarkComplete(activeBranch)}
                  disabled={completedBranches[activeBranch]}
                  className={`font-black text-xs rounded-xl shadow-md px-6 h-11 border-b-4 transition-all ${
                    completedBranches[activeBranch]
                      ? "bg-slate-200 border-slate-400 text-slate-400 cursor-not-allowed border-b-0"
                      : isKid 
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500 border-emerald-800 text-white hover:brightness-110 active:border-b-0 active:translate-y-1"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-900 active:border-b-0 active:translate-y-1"
                  }`}
                >
                  {completedBranches[activeBranch] ? "Dahan Telah Diterokai ✓" : isKid ? "Saya Faham Dah, Bossku! 🚀" : "Selesai Bah & Teruskan"}
                </Button>
              </div>

            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* OVERLAY POPUP LEVEL UP/CELEBRATION (DUOLINGO-STYLE BOUNCY PANEL) */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 font-sans"
          >
            <motion.div 
              initial={{ scale: 0.8, y: 50 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.8, y: 50 }}
              className={`p-6 sm:p-8 rounded-[2.5rem] text-center max-w-sm w-full shadow-2xl border-b-[8px] relative ${
                isKid 
                  ? "bg-white border-teal-700 text-slate-800" 
                  : "bg-slate-900 border-emerald-800 text-white"
              }`}
            >
              <div className="text-6xl animate-bounce mb-3">🦧🎉</div>
              <h2 className="text-xl font-black tracking-tight">{isKid ? "Mantap, Terbaiklah! 🎉" : "Dahan Selesai!"}</h2>
              <p className={`text-xs font-medium mt-1 mb-4 ${isKid ? "text-slate-500" : "text-slate-400"}`}>
                {isKid ? "Ganjaran harta karun berjaya dimasukkan ke dalam beg anda." : "Kredit ganjaran akademik diproses berjaya."}
              </p>
              
              <div className="flex justify-center gap-4 bg-slate-100 dark:bg-slate-950/50 p-3 rounded-2xl border shadow-inner">
                <div>
                  <span className="block text-[9px] font-black uppercase text-indigo-500">XP</span>
                  <span className="text-sm font-black text-emerald-500">+50 XP</span>
                </div>
                <div className="w-[1px] bg-slate-300 dark:bg-slate-800" />
                <div>
                  <span className="block text-[9px] font-black uppercase text-amber-500">Syiling</span>
                  <span className="text-sm font-black text-amber-500">+10 Gold</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
