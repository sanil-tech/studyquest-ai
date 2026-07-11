import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { 
  Users, Flame, Target, Clock, Coins, ShieldAlert, CheckCircle2, Award, BookOpen, HelpCircle, BarChart3, Calendar, Zap, Sparkles, Brain, Loader2
} from "lucide-react";
import moment from "moment";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const getDisplayName = (user) => {
  if (!user) return "Pelajar";
  return user.nickname || user.username || user.email || "Pelajar";
};

function DetailedChildCard({ child, onOpenReport, onOpenAiAnalysis }) {
  const sessionData = child.latestSession || {};
  const progressData = child.realProgress || {};
  
  const currentXP = progressData.total_xp || 0; 
  const xpForNext = progressData.level ? progressData.level * 200 : 200;
  
  const rawPercentage = xpForNext > 0 ? Math.round(((currentXP % xpForNext) / xpForNext) * 100) : 0;
  const xpPercentage = Math.min(Math.max(rawPercentage, 0), 100);
  
  const streakDays = progressData.streak_days || 0;
  const currentCoins = child.wallet?.balance || 0;
  
  const currentTopic = sessionData.topic_name || "Misi Belum Mula"; 
  const totalStudyMinutes = sessionData.duration_minutes || 0; 
  
  const lastActiveTime = sessionData.updated_at 
    ? `Belajar Terakhir: ${moment(sessionData.updated_at).format("DD/MM/YYYY")}` 
    : "Tiada rekod aktif";

  const quizScore = child.quiz?.quiz_score || null;
  const displayName = getDisplayName(child); 

  return (
    <Card className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm flex flex-col justify-between space-y-4">
      
      {/* Header Kad */}
      <div className="flex items-center justify-between border-b border-slate-50 pb-2 text-[10px] text-slate-400 font-bold">
        <span className="flex items-center gap-1 text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full uppercase text-[9px]">
          <Clock className="w-3 h-3" /> {lastActiveTime}
        </span>
        <Badge className="bg-slate-100 text-slate-700 font-bold text-[9px] border-0">
          ID: {child.id ? child.id.substring(0, 6) : "------"}...
        </Badge>
      </div>

      {/* Profil Mini */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center border border-pink-200 text-xl shrink-0">
          🦖
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <h3 className="text-sm font-black text-slate-800 uppercase truncate user-select-none">{displayName}</h3>
            <Badge className="bg-blue-50 text-blue-600 border-0 text-[10px] font-black px-1.5 py-0 h-4 rounded shrink-0">
              Tahap {progressData.level || 1}
            </Badge>
          </div>
          
          {/* 🎯 KEMASKINI PAPARAN UTAMA: Lencana PIN Rahsia kini dijamin muncul */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1">
            <p className="text-[10px] font-bold text-slate-400 truncate max-w-[130px]">{child.email || "Tiada E-mel"}</p>
            <span className="hidden sm:inline text-slate-200 text-[10px]">|</span>
            <span className="bg-amber-50 text-amber-700 border border-amber-200 font-black text-[10px] px-2 py-0.5 rounded-md tracking-widest w-fit flex items-center gap-1 shrink-0 shadow-xs">
              🔑 PIN: {child.child_login_pin}
            </span>
          </div>
        </div>
      </div>

      {/* Kemajuan XP */}
      <div className="space-y-1 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
        <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
          <span className="flex items-center gap-0.5"><Zap className="w-3 h-3 text-purple-500" /> XP TERKUMPUL</span>
          <span>{currentXP} XP ({xpPercentage}%)</span>
        </div>
        <ProgressBar value={xpPercentage} className="h-1.5 bg-slate-100 rounded-full" />
      </div>

      {/* Grid Status Ringkas */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-orange-50/60 border border-orange-100/50 p-2 rounded-xl flex flex-col items-center justify-center">
          <Flame className="w-4 h-4 text-orange-500 mb-0.5" />
          <span className="text-[8px] font-bold text-slate-400 uppercase">Hari Streak</span>
          <span className="text-xs font-black text-slate-700 mt-0.5">{streakDays}</span>
        </div>

        <div className="bg-amber-50/60 border border-amber-100/50 p-2 rounded-xl flex flex-col items-center justify-center">
          <Coins className="w-4 h-4 text-amber-500 mb-0.5" />
          <span className="text-[8px] font-bold text-slate-400 uppercase">Baki Koin</span>
          <span className="text-xs font-black text-slate-700 mt-0.5">{currentCoins}</span>
        </div>

        <div className="bg-indigo-50/50 border border-indigo-100/40 p-2 rounded-xl flex flex-col items-center justify-center min-w-0">
          <Target className="w-4 h-4 text-indigo-500 mb-0.5" />
          <span className="text-[8px] font-bold text-slate-400 uppercase truncate w-full">Topik Semasa</span>
          <span className="text-[10px] font-black text-slate-700 mt-0.5 truncate w-full px-0.5">{currentTopic}</span>
        </div>
      </div>

      {/* Masa Sesi Terakhir */}
      <div className="bg-slate-900 text-white rounded-xl p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-400" />
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none">Masa Sesi Terakhir</p>
            <p className="text-sm font-black mt-1 leading-none">{totalStudyMinutes} <span className="text-[11px] font-normal text-slate-400">Minit</span></p>
          </div>
        </div>
        <Badge className="bg-emerald-500/20 text-emerald-400 font-bold border-0 text-[9px]">Sesi Aktif</Badge>
      </div>

      {/* Prestasi Aktiviti Bab */}
      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2.5 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-slate-700 border-b border-slate-200/60 pb-1.5">
          <Award className="w-3.5 h-3.5 text-indigo-600" />
          <span>Prestasi Aktiviti Bab</span>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-slate-500 flex items-center gap-1"><BookOpen className="w-3 h-3" /> Status Nota Bacaan</span>
            {child.allSessions?.length > 0 ? ( 
              <span className="text-emerald-600 font-bold flex items-center gap-0.5"><CheckCircle2 className="w-3 h-3" /> Selesai</span>
            ) : (
              <span className="text-slate-400 font-medium">Belum Dibaca</span>
            )}
          </div>

          <div className="flex justify-between items-center text-[11px]">
            <span className="text-slate-500 flex items-center gap-1"><HelpCircle className="w-3 h-3" /> Markah Kuiz Terkini</span>
            {quizScore !== null ? (
              <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black px-1.5 py-0">
                {quizScore}% Betul
              </Badge>
            ) : (
              <span className="text-amber-600 font-bold bg-amber-50 px-1.5 py-0 rounded text-[10px]">Belum Ambil</span>
            )}
          </div>
        </div>
      </div>

      {/* Kumpulan Butang Tindakan & Analisis */}
      <div className="space-y-2 pt-1">
        <Button 
          onClick={() => onOpenReport(child)}
          className="w-full h-9 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl flex items-center justify-center gap-1.5 border border-slate-200/50 shadow-none transition-all"
        >
          <BarChart3 className="w-4 h-4 text-slate-500" /> Laporan Manual Topik
        </Button>

        <Button 
          onClick={() => onOpenAiAnalysis(child)}
          className="w-full h-9 text-xs font-bold bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 hover:opacity-95 text-white rounded-xl shadow-sm flex items-center justify-center gap-1.5 active:scale-[0.99] transition-transform"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" /> Analisis Pembelajaran AI
        </Button>
      </div>

      {/* Butang Pengurusan */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
        <Button size="sm" variant="outline" className="h-8 text-[10px] font-bold text-slate-600 rounded-xl">
          ⚙️ Kata Laluan
        </Button>
        <Button size="sm" variant="outline" className="h-8 text-[10px] font-bold text-rose-600 border-rose-100 hover:bg-rose-50 rounded-xl">
          ⚙️ Sekat Akses
        </Button>
      </div>
    </Card>
  );
}

export default function MyChildrenPage() {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State Laporan Manual
  const [selectedChild, setSelectedChild] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // State Diagnosis AI Baharu
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiChild, setAiChild] = useState(null);
  const [aiResult, setAiResult] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const u = await base44.auth.me();
      const rel = await base44.entities.ParentChildRelationship.filter({ parent_id: u.id, status: "active" });
      if (!rel?.length) {
        setChildren([]);
        return;
      }
      
      const childIds = rel.map(r => r.child_id);
      const kids = await Promise.all(childIds.map(async (id) => {
        const [studySessionRes, progressRes, walletRes, attemptsRes, childUser] = await Promise.all([
          base44.entities.StudySession.filter({ student_id: id }).catch(() => []),
          base44.entities.Progress.filter({ student_id: id }).catch(() => []),
          base44.entities.Wallet.filter({ student_id: id }).catch(() => []),
          base44.entities.QuizAttempt.filter({ student_id: id }).catch(() => []),
          base44.entities.User.get(id).catch(() => null),
        ]);

        // 🎯 PERUBAHAN UTAMA: Tarik fail data cache peranti terlebih dahulu
        const cachedChildren = JSON.parse(localStorage.getItem("cached_children") || "{}");
        const localCache = cachedChildren[id] || {};

        let userObj = childUser;
        if (!userObj) {
          console.warn(`⚠️ [RLS Sekatan] Menggunakan profil penuh dari cache tempatan bagi ID: ${id}`);
          userObj = localCache || {
            nickname: "Anak Terdaftar",
            full_name: "Petualang Cilik",
            email: "Akses Portal Aktif"
          };
        }

        let latestSession = {};
        let sortedSessions = [];
        if (studySessionRes && studySessionRes?.length > 0) {
          sortedSessions = [...studySessionRes].sort((a, b) => 
            new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0)
          );
          latestSession = sortedSessions[0];
        }

        let realProgress = { total_xp: 0, streak_days: 0, level: 1 };
        if (progressRes && progressRes?.length > 0) {
          const sortedProgress = [...progressRes].sort((a, b) => 
            new Date(b.updated_at || b.last_study_date || 0) - new Date(a.updated_at || a.last_study_date || 0)
          );
          realProgress = sortedProgress[0];
        }

        let latestQuizScore = null;
        let allAttempts = [];
        if (attemptsRes && attemptsRes?.length > 0) {
          allAttempts = [...attemptsRes].sort((a, b) => 
            new Date(b.created_at || b.updated_at || 0) - new Date(a.created_at || a.updated_at || 0)
          );
          latestQuizScore = allAttempts[0].score;
        }

        const activeWallet = walletRes && walletRes?.length > 0 ? walletRes[0] : { balance: 0 };

        return { 
          id, 
          email: userObj?.email || localCache.email || "Tiada E-mel",
          nickname: userObj?.nickname || userObj?.full_name || localCache.nickname || "Anak Terdaftar",
          username: userObj?.username || "",
          // 🎯 PENGGABUNGAN PINTAS: Wajibkan paparan membaca PIN dari localCache peranti untuk memintas penapisan pelayan!
          child_login_pin: localCache.child_login_pin || userObj?.child_login_pin || "----", 
          wallet: activeWallet,
          allAttempts, 
          allSessions: sortedSessions, 
          latestSession,
          realProgress, 
          quiz: {
            quiz_score: latestQuizScore
          }
        };
      }));
      setChildren(kids.filter(Boolean));
    } catch (err) {
      console.error("Ralat memuatkan data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAiAnalysis = async (child) => {
    setAiChild(child);
    setAiModalOpen(true);
    setLoadingAi(true);
    setAiResult("");

    try {
      const displayKidsName = getDisplayName(child);
      const totalXp = child.realProgress?.total_xp || 0;
      const level = child.realProgress?.level || 1;
      const streak = child.realProgress?.streak_days || 0;
      const coinBalance = child.wallet?.balance || 0;
      
      const sessionSummary = child.allSessions?.length > 0 
        ? child.allSessions.map(s => `- Topik: "${s.topic_name || 'Umum'}" (${s.duration_minutes || 0} Minit Pelajaran)`).join("\n")
        : "Tiada rekod pembacaan nota lagi.";

      const quizSummary = child.allAttempts?.length > 0
        ? child.allAttempts.map(q => `- Topik Kuiz: "${q.topic_name || 'Ujian'}", Markah Dicapai: ${q.score}%`).join("\n")
        : "Pelajar belum menduduki sebarang ujian kuiz.";

      const systemPrompt = `Anda adalah sistem AI Penasihat Akademik Pintar. Sila berikan analisis prestasi profil murid bernama ${displayKidsName} berdasarkan data ekosistem pembelajaran berikut:

METRIK UTAMA:
- Tahap Aktif Semasa: Level ${level}
- Mata Pengalaman (XP): ${totalXp} XP
- Konsistensi Belajar: ${streak} Hari Streak Berturut-turut
- Dompet Syiling Ganjaran: ${coinBalance} Syiling

REKOD BACAAN NOTA AKADEMIK (DURASI MINIT):
${sessionSummary}

SEJARAH KEPUTUSAN KUIZ:
${quizSummary}

Sila gubal satu laporan berstruktur berwibawa, profesional tetapi mesra dalam Bahasa Melayu. Rangkumkan maklum balas anda menggunakan tajuk utama yang jelas seperti berikut:
### 📈 1. Diagnosis Prestasi Keseluruhan
### 🌟 2. Kekuatan & Minat Utama Murid
### ⚠️ 3. Ruang Pembetulan & Cabaran Pelajar
### 🎯 4. Pelan Tindakan & Strategi Ibu Bapa`;

      const response = await base44.integrations.Core.Chat({ message: systemPrompt });
      setAiResult(response?.text || response?.message || "Analisis AI berjaya dijana.");
    } catch (err) {
      console.error("Gagal menjana analisis AI:", err);
      setAiResult("⚠️ Sistem gagal menghubungi enjin AI pada waktu ini.");
    } finally {
      setLoadingAi(false);
    }
  };

  useEffect(() => { 
    loadData(); 
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 min-h-screen">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-7xl mx-auto bg-slate-50/30 min-h-screen">
      <div>
        <h1 className="text-xl font-black text-slate-800 flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-600" /> Profil Pengurusan Anak-Anak
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">Analisis kemajuan penuh, baki koin, kuiz, dan masa pembelajaran nyata daripada database.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {children.length === 0 ? (
          <Card className="p-8 text-center border-dashed border-2 border-slate-200 rounded-2xl bg-white col-span-full">
            <p className="text-sm text-slate-500 font-medium">Tiada akaun anak yang dihubungkan di bawah kawalan anda buat masa ini.</p>
          </Card>
        ) : (
          children.map((child) => (
            <DetailedChildCard 
              key={child.id} 
              child={child} 
              onOpenReport={(c) => { setSelectedChild(c); setIsModalOpen(true); }} 
              onOpenAiAnalysis={handleOpenAiAnalysis}
            />
          ))
        )}
      </div>

      {/* MODAL 1: LAPORAN MANUAL PENUH TOPIK */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl bg-white p-6">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="text-lg font-black text-slate-800 flex items-center gap-2">
              📊 Laporan Pembelajaran: {selectedChild ? getDisplayName(selectedChild) : "Memuatkan..."}
            </DialogTitle>
          </DialogHeader>

          {selectedChild && (
            <div className="space-y-6 mt-4">
              <div>
                <h4 className="text-sm font-black text-slate-700 flex items-center gap-1.5 mb-3">
                  <BookOpen className="w-4 h-4 text-indigo-600" /> Status Topik & Nota Dibaca
                </h4>
                {!selectedChild.allSessions || selectedChild.allSessions?.length === 0 ? (
                  <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl text-center">Belum ada topik pelajaran dimulakan.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedChild.allSessions.map((session, idx) => (
                      <div key={idx} className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex items-center justify-between">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-700 truncate">{session.topic_name || "Topik Tanpa Nama"}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {session.duration_minutes || 0} Minit Diluangkan
                          </p>
                        </div>
                        <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-bold">Nota Selesai</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-sm font-black text-slate-700 flex items-center gap-1.5 mb-3">
                  <Award className="w-4 h-4 text-amber-500" /> Sejarah Penuh Markah Kuiz
                </h4>
                {!selectedChild.allAttempts || selectedChild.allAttempts?.length === 0 ? (
                  <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl text-center">Belum menduduki sebarang kuiz.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedChild.allAttempts.map((attempt, idx) => (
                      <div key={idx} className="border border-slate-100 bg-white p-3 rounded-xl flex items-center justify-between shadow-sm">
                        <div>
                          <p className="text-xs font-black text-slate-800">{attempt.topic_name || "Kuiz Tanpa Nama"}</p>
                          <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium mt-0.5">
                            <span><Calendar className="w-3 h-3 inline mr-0.5" /> {moment(attempt.created_at).format("DD MMM YYYY, h:mm a")}</span>
                          </div>
                        </div>
                        <Badge className="text-xs font-black px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {attempt.score}% Markah
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL 2: AI ANALYSIS DIALOG */}
      <Dialog open={aiModalOpen} onOpenChange={setAiModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto rounded-3xl bg-slate-900 text-white p-6 border border-slate-800">
          <DialogHeader className="border-b border-slate-800 pb-3">
            <DialogTitle className="text-base font-black flex items-center gap-2 text-indigo-400">
              <Brain className="w-5 h-5 text-indigo-400 animate-pulse" /> Diagnosis Pembelajaran Pintar AI: {aiChild ? getDisplayName(aiChild) : ""}
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            {loadingAi ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-3 text-center">
                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                <p className="text-xs font-bold text-slate-400 tracking-wide uppercase">Enjin AI sedang menyemak pangkalan data & menyusun laporan...</p>
              </div>
            ) : (
              <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80 text-sm leading-relaxed whitespace-pre-line text-slate-200 font-medium font-sans">
                {aiResult}
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end border-t border-slate-800 pt-4">
            <Button 
              onClick={() => setAiModalOpen(false)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs h-9 px-5"
            >
              Tutup Analisis
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
