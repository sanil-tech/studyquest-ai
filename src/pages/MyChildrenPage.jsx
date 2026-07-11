import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { 
  Users, Flame, Target, Clock, Coins, CheckCircle2, Award, BookOpen, HelpCircle, BarChart3, Calendar, Zap, Sparkles, Brain, Loader2, Eye, EyeOff, Edit3
} from "lucide-react";
import moment from "moment";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

// ================= 1. KOMPONEN KAD DETEIL ANAK =================
function DetailedChildCard({ child, onOpenReport, onOpenAiAnalysis, onDataUpdated }) {
  const { toast } = useToast();
  const [showPin, setShowPin] = useState(false);
  
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [inputPin, setInputPin] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [inputName, setInputName] = useState(child.nickname || "");
  const [updating, setUpdating] = useState(false);

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

  const handleSaveName = async () => {
    if (!inputName.trim()) {
      toast({ title: "Medan Wajib", description: "Nama panggilan tidak boleh kosong.", variant: "destructive" });
      return;
    }
    setUpdating(true);
    try {
      await base44.entities.User.update(child.id, { nickname: inputName.trim() });
      
      // Kemaskini juga cache peranti sebagai backup kekal
      const cachedChildren = JSON.parse(localStorage.getItem("cached_children") || "{}");
      cachedChildren[child.id] = { ...cachedChildren[child.id], nickname: inputName.trim() };
      localStorage.setItem("cached_children", JSON.stringify(cachedChildren));

      toast({ title: "Berjaya Dikemaskini 🦖", description: "Nama panggilan anak berjaya disimpan." });
      setIsEditingName(false);
      if (onDataUpdated) onDataUpdated();
    } catch (err) {
      toast({ title: "Gagal menukar nama", description: err.message, variant: "destructive" });
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveNewPin = async () => {
    if (inputPin.length !== 4) {
      toast({ title: "Format Salah", description: "PIN mestilah tepat 4 digit.", variant: "destructive" });
      return;
    }
    setUpdating(true);
    try {
      await base44.entities.User.update(child.id, {
        pin_hash: inputPin,
        pin_enabled: true,
        login_method: "pin"
      });

      const cachedChildren = JSON.parse(localStorage.getItem("cached_children") || "{}");
      cachedChildren[child.id] = { ...cachedChildren[child.id], child_login_pin: inputPin };
      localStorage.setItem("cached_children", JSON.stringify(cachedChildren));

      toast({ title: "PIN Dikunci Kekal! 🔑", description: "PIN baharu disimpan terus ke pelayan." });
      setIsSettingPin(false);
      if (onDataUpdated) onDataUpdated();
    } catch (err) {
      toast({ title: "Gagal menyimpan PIN", description: err.message, variant: "destructive" });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Card className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm flex flex-col justify-between space-y-4">
      
      <div className="flex items-center justify-between border-b border-slate-50 pb-2 text-[10px] text-slate-400 font-bold">
        <span className="flex items-center gap-1 text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full uppercase text-[9px]">
          <Clock className="w-3 h-3" /> {lastActiveTime}
        </span>
        <Badge className="bg-slate-100 text-slate-700 font-bold text-[9px] border-0">
          ID: {child.id ? child.id.substring(0, 6) : "------"}...
        </Badge>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center border border-pink-200 text-xl shrink-0">
          🦖
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            {isEditingName ? (
              <div className="flex items-center gap-1 w-full">
                <input 
                  type="text"
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  className="px-2 py-0.5 text-xs border rounded-md font-bold text-slate-700 w-full focus:outline-indigo-500"
                />
                <button onClick={handleSaveName} disabled={updating} className="text-[10px] font-bold text-emerald-600 shrink-0">Set</button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 min-w-0 group cursor-pointer" onClick={() => { setInputName(child.nickname); setIsEditingName(true); }}>
                <h3 className="text-sm font-black text-slate-800 uppercase truncate">
                  {child.nickname || "Tiada Nama"}
                </h3>
                <Edit3 className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </div>
            )}
            
            <Badge className="bg-blue-50 text-blue-600 border-0 text-[10px] font-black px-1.5 py-0 h-4 rounded shrink-0">
              Tahap {progressData.level || 1}
            </Badge>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 mt-1">
            <p className="text-[10px] font-bold text-slate-400 truncate max-w-[125px] leading-none">Username: {child.username || "student"}</p>
            <span className="hidden sm:inline text-slate-200 text-[10px]">|</span>
            
            {isSettingPin ? (
              <div className="flex items-center gap-1 mt-0.5">
                <input 
                  type="password" 
                  maxLength={4}
                  placeholder="PIN"
                  value={inputPin}
                  onChange={(e) => setInputPin(e.target.value.replace(/\D/g, ""))}
                  className="w-12 px-1.5 py-0.5 text-center text-xs border rounded-md text-slate-700 font-bold focus:outline-indigo-500"
                />
                <button onClick={handleSaveNewPin} disabled={updating} className="text-[9px] font-bold text-emerald-600">Set</button>
                <button onClick={() => setIsSettingPin(false)} className="text-[9px] font-bold text-slate-400">Batal</button>
              </div>
            ) : (
              <button 
                onClick={() => {
                  if (!child.child_login_pin || child.child_login_pin === "----") {
                    setIsSettingPin(true);
                  } else {
                    setShowPin(!showPin);
                  }
                }}
                className="bg-amber-50 text-amber-700 hover:bg-amber-100/80 border border-amber-200 font-black text-[10px] px-2 py-0.5 rounded-md tracking-wider w-fit flex items-center gap-1 shrink-0 shadow-xs transition-all active:scale-95"
              >
                <span>🔑 PIN: {!child.child_login_pin || child.child_login_pin === "----" ? "Set PIN" : (showPin ? child.child_login_pin : "••••")}</span>
                {child.child_login_pin && child.child_login_pin !== "----" ? (
                  showPin ? <EyeOff className="w-3 h-3 text-amber-600" /> : <Eye className="w-3 h-3 text-amber-600" />
                ) : <Edit3 className="w-2.5 h-2.5 text-amber-500" />}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-1 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
        <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
          <span className="flex items-center gap-0.5"><Zap className="w-3 h-3 text-purple-500" /> XP TERKUMPUL</span>
          <span>{currentXP} XP ({xpPercentage}%)</span>
        </div>
        <ProgressBar value={xpPercentage} className="h-1.5 bg-slate-100 rounded-full" />
      </div>

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

      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
        <Button size="sm" variant="outline" onClick={() => setIsSettingPin(true)} className="h-8 text-[10px] font-bold text-slate-600 rounded-xl">
          ⚙️ Tukar PIN
        </Button>
        <Button size="sm" variant="outline" className="h-8 text-[10px] font-bold text-rose-600 border-rose-100 hover:bg-rose-50 rounded-xl">
          ⚙️ Sekat Akses
        </Button>
      </div>
    </Card>
  );
}

// ================= 2. KOMPONEN UTAMA HALAMAN =================
export default function MyChildrenPage() {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedChild, setSelectedChild] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiChild, setAiChild] = useState(null);
  const [aiResult, setAiResult] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const u = await base44.auth.me();
      if (!u?.id) return;

      // 🎯 TRIPLE-STRATEGI PENCARI ID (Anti-RLS Blockade):
      let childIds = [];

      // Strategi A: Baca tatasusunan linked_student_ids dari profil Parent sendiri (Sangat selamat)
      if (u.linked_student_ids && Array.isArray(u.linked_student_ids)) {
        childIds = [...u.linked_student_ids];
      }

      // Strategi B: Tapis dari jadual perantara ParentChildRelationship (Pelan backup asal)
      try {
        const rel = await base44.entities.ParentChildRelationship.filter({ parent_id: u.id, status: "active" });
        if (rel && rel.length > 0) {
          const fetchedIds = rel.map(r => r.child_id);
          childIds = [...new Set([...childIds, ...fetchedIds])]; // Buang ID bertindih
        }
      } catch (e) {
        console.warn("RLS menyekat jadual perantara, beralih ke strategi seterusnya.");
      }

      // Strategi C: Backup dari memori peranti peranti tempatan
      const cachedChildren = JSON.parse(localStorage.getItem("cached_children") || "{}");
      if (childIds.length === 0 && Object.keys(cachedChildren).length > 0) {
        childIds = Object.keys(cachedChildren);
      }

      // Jika langsung tiada sebarang ID, hentikan proses
      if (childIds.length === 0) {
        setChildren([]);
        return;
      }
      
      // 🎯 PROSES LIVE FETCH DATA BERDASARKAN ID SPESIFIK (Dibenarkan oleh RLS)
      const kids = await Promise.all(childIds.map(async (id) => {
        try {
          const [studySessionRes, progressRes, walletRes, attemptsRes, childUser] = await Promise.all([
            base44.entities.StudySession.filter({ student_id: id }).catch(() => []),
            base44.entities.Progress.filter({ student_id: id }).catch(() => []),
            base44.entities.Wallet.filter({ student_id: id }).catch(() => []),
            base44.entities.QuizAttempt.filter({ student_id: id }).catch(() => []),
            base44.entities.User.get(id).catch(() => null), // Memanggil direct ID (Laju & Kalis RLS)
          ]);

          const localCache = cachedChildren[id] || {};

          // Penyatuan data profil sekiranya pelayan memulangkan kosongan
          const nicknameReal = childUser?.nickname || childUser?.full_name || localCache.nickname || localCache.full_name || "Petualang Cilik";
          const usernameReal = childUser?.username || localCache.username || "student";
          const pinReal = childUser?.pin_hash || localCache.child_login_pin || "----";

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
            email: childUser?.email || localCache.email || "Akses Portal Aktif",
            nickname: nicknameReal,
            username: usernameReal,
            child_login_pin: pinReal, 
            wallet: activeWallet,
            allAttempts, 
            allSessions: sortedSessions, 
            latestSession,
            realProgress, 
            quiz: {
              quiz_score: latestQuizScore
            }
          };
        } catch (err) {
          console.error(`Gagal memuatkan sub-data id anak ${id}:`, err);
          return null;
        }
      }));

      setChildren(kids.filter(Boolean));
    } catch (err) {
      console.error("Ralat memuatkan data:", err);
    } file {
      setLoading(false);
    }
  };

  const handleOpenAiAnalysis = async (child) => {
    setAiChild(child);
    setAiModalOpen(true);
    setLoadingAi(true);
    setAiResult("");

    try {
      const displayKidsName = child.nickname || "Pelajar";
      const totalXp = child.realProgress?.total_xp || 0;
      const level = child.realProgress?.level || 1;
      
      const systemPrompt = `Anda adalah sistem AI Penasihat Akademik Pintar. Sila berikan analisis maklumbalas ringkas untuk murid bernama ${displayKidsName} Tahap ${level} dengan XP ${totalXp}.`;

      const response = await base44.integrations.Core.Chat({ message: systemPrompt });
      setAiResult(response?.text || response?.message || "Analisis AI berjaya dijana.");
    } catch (err) {
      console.error("Gagal menjana analisis AI:", err);
      setAiResult("⚠️ Sistem gagal menghubungi enjin AI.");
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
              onDataUpdated={loadData}
              onOpenReport={(c) => { setSelectedChild(c); setIsModalOpen(true); }} 
              onOpenAiAnalysis={handleOpenAiAnalysis}
            />
          ))
        )}
      </div>

      {/* MODAL 1: LAPORAN MANUAL */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl bg-white p-6">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="text-lg font-black text-slate-800 flex items-center gap-2">
              📊 Laporan Pembelajaran: {selectedChild ? selectedChild.nickname : "Memuatkan..."}
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

      {/* MODAL 2: AI ANALYSIS */}
      <Dialog open={aiModalOpen} onOpenChange={setAiModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto rounded-3xl bg-slate-900 text-white p-6 border border-slate-800">
          <DialogHeader className="border-b border-slate-800 pb-3">
            <DialogTitle className="text-base font-black flex items-center gap-2 text-indigo-400">
              <Brain className="w-5 h-5 text-indigo-400 animate-pulse" /> Diagnosis Pembelajaran AI: {aiChild ? aiChild.nickname : ""}
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            {loadingAi ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-3 text-center">
                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                <p className="text-xs font-bold text-slate-400 tracking-wide">AI sedang menganalisis...</p>
              </div>
            ) : (
              <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80 text-sm leading-relaxed whitespace-pre-line text-slate-200 font-medium">
                {aiResult}
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end border-t border-slate-800 pt-4">
            <Button onClick={() => setAiModalOpen(false)} className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs h-9 px-5">Tutup</Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
