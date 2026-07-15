// src/pages/StudentDashboard.jsx
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { 
  Trophy, Flame, Sparkles, LogOut, Loader2, 
  Compass, ShieldAlert, Award, User
} from "lucide-react";
import LessonProgress from "../components/lesson/LessonProgress";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [wallet, setWallet] = useState({ balance: 0 });
  const [progress, setProgress] = useState({ total_xp: 0, level: 1, total_study_time: 0 });
  const [lessonSteps, setLessonSteps] = useState({ video: false, lesson: false, flashcard: false, mindmap: false, quiz: false });
  const [loading, setLoading] = useState(true);

  // Muat turun segala data profil & akademik anak secara serentak
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const me = await base44.auth.me();
      if (!me || me.app_role !== "student") {
        await base44.auth.signOut();
        navigate("/student-login");
        return;
      }
      setStudent(me);

      // Fetch Wallet & Progres Murid menggunakan ID murid yang sah
      const [walletData, progressData] = await Promise.all([
        base44.entities.Wallet.filter({ student_id: me.id }),
        base44.entities.Progress.filter({ student_id: me.id })
      ]);

      if (walletData && walletData.length > 0) setWallet(walletData[0]);
      if (progressData && progressData.length > 0) {
        setProgress(progressData[0]);
        
        // Ciri Pintar: Buka dahan pokok berdasarkan simulasi data progres sebenar
        // Anda boleh memetakan ini daripada jadual pangkalan data Tugasan anda nanti
        setLessonSteps({
          video: progressData[0].total_study_time > 0,
          lesson: progressData[0].total_xp >= 50,
          flashcard: progressData[0].total_xp >= 100,
          mindmap: progressData[0].total_xp >= 150,
          quiz: progressData[0].total_xp >= 200,
        });
      }

    } catch (err) {
      console.error("Gagal memuatkan data papan pemuka murid:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Logik apabila anak mengetuk dahan pokok (Duolingo Path Controller)
  const handleStepClick = (stepKey) => {
    if (stepKey === "quiz") {
      // Bawa ke bilik kuiz yang telah kita bina dan amankan
      navigate(`/quiz/topik-sifir-darab`);
    } else {
      // Bawa ke ruang belajar interaktif multimedia
      navigate(`/LearningSpace?branch=${stepKey}`);
    }
  };

  const handleLogout = async () => {
    await base44.auth.signOut();
    localStorage.removeItem("active_student_id");
    localStorage.removeItem("active_student_name");
    window.location.href = "/student-login";
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-b from-sky-300 to-lime-50 flex flex-col items-center justify-center p-4">
      <Loader2 className="w-10 h-10 animate-spin text-teal-600 mb-2" />
      <p className="text-xs font-black text-teal-800 uppercase tracking-widest animate-pulse">Memanggil Maskot Otan... 🦧</p>
    </div>
  );

  // Tentukan kumpulan umur secara dinamik untuk penyesuaian UI (7-12: Kid theme, 13-17: Teen theme)
  const isKid = student?.age_group !== "teen"; 

  return (
    <div className={`min-h-screen font-sans pb-10 transition-colors duration-500 ${
      isKid ? "bg-gradient-to-b from-sky-100 via-emerald-50 to-lime-50" : "bg-slate-950 text-slate-100"
    }`}>
      
      {/* 🌟 1. BANNER DIRI DENGAN KAD IMERSIF GAME (HERO DASHBOARD) */}
      <div className={`w-full px-4 pt-6 pb-20 rounded-b-[3rem] relative overflow-hidden shadow-lg border-b-4 ${
        isKid 
          ? "bg-gradient-to-r from-teal-500 via-emerald-500 to-lime-500 border-teal-700" 
          : "bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-indigo-900"
      }`}>
        {/* SVG Hiasan Alam Gunung Kinabalu / Garisan Siber */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative z-10">
          
          {/* PROFILE CARD & TAHAP LEVEL */}
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 shadow-md transform -rotate-3 ${
              isKid ? "bg-white border-amber-300 text-teal-600" : "bg-slate-800 border-indigo-500 text-indigo-400"
            }`}>
              <User className="w-7 h-7" />
            </div>
            <div className="text-white">
              <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-white/20 inline-block`}>
                {isKid ? "🦁 Petualang Cilik" : "⚡ Apex Ranger"}
              </span>
              <h1 className="text-xl font-black tracking-tight mt-1 uppercase">Bah, Selamat Kembali, {student?.nickname || "Hero"}!</h1>
              
              {/* XP BAR METER (STYLE DUOLINGO / KHAN ACADEMY) */}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] font-mono font-black text-amber-200">LVL {progress.level}</span>
                <div className="w-32 sm:w-48 h-2.5 bg-black/30 rounded-full overflow-hidden p-0.5 border border-white/10 shadow-inner">
                  <div 
                    className="h-full bg-gradient-to-r from-yellow-300 to-amber-400 rounded-full"
                    style={{ width: `${(progress.total_xp % 1000) / 10}%` }}
                  />
                </div>
                <span className="text-[9px] font-bold opacity-80">{progress.total_xp} XP</span>
              </div>
            </div>
          </div>

          {/* PETI HARTA GANJARAN KANAN */}
          <div className="flex items-center gap-3 self-stretch sm:self-center justify-between sm:justify-start bg-black/15 backdrop-blur-md p-3 rounded-2xl border border-white/10 shadow-inner">
            <div className="text-center px-4">
              <span className="block text-[9px] font-black text-amber-200 uppercase tracking-wider">Peti Syiling</span>
              <span className="text-lg font-mono font-black text-white flex items-center justify-center gap-1 mt-0.5">
                🪙 {wallet.balance}
              </span>
            </div>
            <div className="w-[1px] h-8 bg-white/20" />
            <div className="text-center px-4">
              <span className="block text-[9px] font-black text-orange-300 uppercase tracking-wider">Streak</span>
              <span className="text-lg font-black text-white flex items-center justify-center gap-1 mt-0.5">
                <Flame className="w-4 h-4 fill-orange-500 text-orange-500 animate-pulse" /> {progress.streak_days || 0} Hari
              </span>
            </div>
            <div className="w-[1px] h-8 bg-white/20" />
            <button 
              onClick={handleLogout}
              className="p-2 text-white/70 hover:text-rose-300 hover:bg-white/10 rounded-xl transition-all"
              title="Log Keluar"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>

      {/* 🌳 2. PETA UTAMA: POHON ILMU PINTAR BORNEO */}
      <div className="max-w-xl mx-auto px-4 -mt-12 relative z-20">
        <motion.div 
          initial={{ y: 30, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100 }}
        >
          {/* PEMANGGIL KOMPONEN POKOK YANG KITA CIPTA SEBELUM INI */}
          <LessonProgress 
            steps={lessonSteps} 
            onStepClick={handleStepClick} 
          />
        </motion.div>
      </div>

      {/* FOOTER NOTIS PANDUAN PENGEMBARAAN */}
      <div className="text-center mt-8 px-4">
        <p className={`text-[10px] font-black uppercase tracking-widest ${isKid ? "text-slate-400" : "text-slate-600"}`}>
          🗺️ Petunjuk Misi: Dahan hijau = Siap • Dahan oren = Aktif • Dahan kelabu = Terkunci
        </p>
      </div>

    </div>
  );
}
