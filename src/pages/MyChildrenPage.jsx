import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { 
  Users, Flame, Target, Clock, Coins, ShieldAlert, CheckCircle2, Award, BookOpen, HelpCircle, BarChart3, Calendar 
} from "lucide-react";
import moment from "moment";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const getDisplayName = (user) => {
  if (!user) return "Pelajar";
  return user.nickname || user.username || user.email || "Pelajar";
};

function DetailedChildCard({ child, onOpenReport }) {
  // 🛡️ Perlindungan ralat objek kosong {}
  const sessionData = child.latestSession || {};
  
  const currentXP = sessionData.total_xp || 0; 
  const nextLevelXP = 500;
  const xpPercentage = Math.min(Math.round((currentXP / nextLevelXP) * 100), 100);
  const streakDays = sessionData.streak_days || 0;
  
  const currentCoins = child.wallet?.balance || 0;
  
  // Membaca skema tulen dari StudySession anda
  const currentTopic = sessionData.topic_name || "Misi Belum Mula"; 
  const totalStudyMinutes = sessionData.duration_minutes || 0; 
  
  const lastActiveTime = sessionData.updated_date 
    ? `Belajar Terakhir: ${moment(sessionData.updated_date).format("DD/MM/YYYY")}` 
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
            <h3 className="text-sm font-black text-slate-800 uppercase truncate">{displayName}</h3>
            <Badge className="bg-blue-50 text-blue-600 border-0 text-[10px] font-black px-1.5 py-0 h-4 rounded shrink-0">
              Tahap {sessionData.level || 1}
            </Badge>
          </div>
          <p className="text-[10px] font-bold text-slate-400 mt-0.5 truncate">{child.email || "Tiada E-mel"}</p>
        </div>
      </div>

      {/* Kemajuan XP */}
      <div className="space-y-1 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
        <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
          <span>XP TERKUMPUL</span>
          <span>{currentXP}/{nextLevelXP}</span>
        </div>
        <Progress value={xpPercentage} className="h-1.5 bg-slate-100 rounded-full" />
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
            {/* 🛡️ Perlindungan ?.length digunakan di sini */}
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

      {/* Butang Lihat Laporan Penuh */}
      <Button 
        onClick={() => onOpenReport(child)}
        className="w-full h-9 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm flex items-center justify-center gap-1.5"
      >
        <BarChart3 className="w-4 h-4" /> Lihat Laporan Penuh Topik
      </Button>

      {/* Butang Tambahan */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
        <Button size="sm" variant="outline" className="h-8 text-[10px] font-bold text-slate-600 rounded-xl">
          ⚙️ Kata Laluan
        </Button>
        <Button size="sm" variant="outline" className="h-8 text-[10px] font-bold text-rose-600 border-rose-100 hover:bg-rose-50 rounded-xl">
          <ShieldAlert className="w-3.5 h-3.5 mr-1" /> Sekat Akses
        </Button>
      </div>
    </Card>
  );
}

export default function MyChildrenPage() {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const u = await base44.auth.me();
      const rel = await base44.entities.ParentChildRelationship.filter({ parent_id: u.id, status: "active" });
      if (!rel?.length) {
        setChildren([]);
        return setLoading(false);
      }
      
      const childIds = rel.map(r => r.child_id);
      const kids = await Promise.all(childIds.map(async (id) => {
        // 🛡️ Diletakkan fungsi .catch(() => []) sebagai perlindungan ralat rangkaian / DB kosong
        const [studySessionRes, walletRes, attemptsRes, childUser] = await Promise.all([
          base44.entities.StudySession.filter({ student_id: id }).catch(() => []),
          base44.entities.Wallet.filter({ student_id: id }).catch(() => []),
          base44.entities.QuizAttempt.filter({ student_id: id }).catch(() => []),
          base44.entities.User.get(id).catch(() => null),
        ]);

        let latestSession = {};
        let sortedSessions = [];
        // 🛡️ DIBAIKI: Menggunakan operator selamat ?. untuk mengelakkan ralat length
        if (studySessionRes && studySessionRes?.length > 0) {
          sortedSessions = [...studySessionRes].sort((a, b) => 
            new Date(b.updated_date || b.created_date || 0) - new Date(a.updated_date || a.created_date || 0)
          );
          latestSession = sortedSessions[0];
        }

        let latestQuizScore = null;
        let allAttempts = [];
        // 🛡️ DIBAIKI: Menggunakan operator selamat ?. untuk mengelakkan ralat length jika rekod kuiz kosong
        if (attemptsRes && attemptsRes?.length > 0) {
          allAttempts = [...attemptsRes].sort((a, b) => 
            new Date(b.created_at || b.updated_at || 0) - new Date(a.created_at || a.updated_at || 0)
          );
          latestQuizScore = allAttempts[0].score;
        }

        // 🛡️ DIBAIKI: Menggunakan operator selamat ?. untuk data dompet
        const activeWallet = walletRes && walletRes?.length > 0 ? walletRes[0] : { balance: 0 };

        return { 
          id, 
          email: childUser?.email || "Tiada E-mel",
          nickname: childUser?.nickname || "",
          username: childUser?.username || "",
          wallet: activeWallet,
          allAttempts, 
          allSessions: sortedSessions, 
          latestSession,
          quiz: {
            quiz_score: latestQuizScore
          }
        };
      }));
      setChildren(kids);
    } catch (err) {
      console.error("Ralat memuatkan data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-7xl mx-auto bg-slate-50/30 min-h-screen">
      <div>
        <h1 className="text-xl font-black text-slate-800 flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-600" /> Profil Pengurusan Anak-Anak
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">Analisis kemajuan penuh, baki koin, kuiz, dan masa pembelajaran nyata daripada database.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {children.map((child) => (
          <DetailedChildCard 
            key={child.id} 
            child={child} 
            onOpenReport={(c) => { setSelectedChild(c); setIsModalOpen(true); }} 
          />
        ))}
      </div>

      {/* MODAL POPUP: LAPORAN PENUH */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl bg-white p-6">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="text-lg font-black text-slate-800 flex items-center gap-2">
              📊 Laporan Pembelajaran: {selectedChild ? getDisplayName(selectedChild) : "Memuatkan..."}
            </DialogTitle>
          </DialogHeader>

          {selectedChild && (
            <div className="space-y-6 mt-4">
              
              {/* Seksyen 1: Nota Pelajaran dari StudySession */}
              <div>
                <h4 className="text-sm font-black text-slate-700 flex items-center gap-1.5 mb-3">
                  <BookOpen className="w-4 h-4 text-indigo-600" /> Status Topik & Nota Dibaca
                </h4>
                {/* 🛡️ Perlindungan ralat ?.length */}
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

              {/* Seksyen 2: Sejarah Kuiz */}
              <div>
                <h4 className="text-sm font-black text-slate-700 flex items-center gap-1.5 mb-3">
                  <Award className="w-4 h-4 text-amber-500" /> Sejarah Penuh Markah Kuiz
                </h4>
                {/* 🛡️ Perlindungan ralat ?.length */}
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
    </div>
  );
}