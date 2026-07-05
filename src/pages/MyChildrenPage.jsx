import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { 
  Users, Plus, Key, User, RefreshCw, Trash2, 
  GraduationCap, Award, Flame, BookOpen,
  CheckCircle2, Clock, BrainCircuit, Lock, Zap, BarChart3,
  HelpCircle
} from "lucide-react";
import { getDisplayName } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import AddChildModal from "@/components/parent/AddChildModal";
import ChildCredentialManager from "@/components/parent/ChildCredentialManager";

// ---------------- KOMPONEN KECIL: LESSON CARD (DATA SEBENAR) ----------------
function ChildLessonCard({ lesson }) {
  const stepsData = lesson.steps || {};
  const totalSteps = ["lesson", "flashcards", "mindmap", "activity"];
  const completedSteps = totalSteps.filter((key) => stepsData[key]).length;
  
  // Menggunakan durasi minit dari StudySession sebagai sandaran jika tiada objek steps
  const duration = lesson.duration_minutes || 0;
  const percent = completedSteps > 0 ? Math.round((completedSteps / totalSteps.length) * 100) : (duration > 0 ? 100 : 0);
  const isCompleted = percent === 100;

  return (
    <div className="min-w-[240px] max-w-[240px] bg-white border border-border/60 rounded-xl p-3.5 shadow-sm hover:shadow-md transition-all flex-shrink-0 flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-2">
          <div className={`p-1.5 rounded-lg ${isCompleted ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
            <BookOpen className="w-4 h-4" />
          </div>
          {isCompleted ? (
            <Badge className="bg-emerald-500/10 text-emerald-600 border-none text-[9px] font-bold py-0 h-4 rounded-md">100% Selesai</Badge>
          ) : (
            <Badge className="bg-blue-500/10 text-blue-600 border-none text-[9px] font-bold py-0 h-4 rounded-md">Aktif</Badge>
          )}
        </div>
        
        {/* Membaca topic_name daripada StudySession */}
        <h4 className="text-xs font-bold text-slate-800 line-clamp-2 mb-1 h-8" title={lesson.topic_name}>
          {lesson.topic_name || "Sesi Pembelajaran"}
        </h4>
        
        <span className="text-[10px] font-semibold bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
          {lesson.subject || "Umum"}
        </span>
      </div>

      <div className="mt-3 space-y-1">
        <div className="flex justify-between text-[8px] text-slate-400 font-bold">
          <span>Masa Belajar: {duration} minit</span>
        </div>
        <Progress value={percent || 100} className="h-1 bg-slate-100" />
      </div>
    </div>
  );
}

// ---------------- KOMPONEN KECIL: QUIZ CARD (DATA SEBENAR) ----------------
function ChildQuizCard({ quiz }) {
  // Membaca score daripada QuizAttempt
  const actualScore = quiz.score !== undefined ? quiz.score : 0;
  const scoreColor = actualScore >= 80 
    ? "text-emerald-600 bg-emerald-50 border-emerald-100" 
    : actualScore >= 50 ? "text-amber-600 bg-amber-50 border-amber-100" : "text-rose-600 bg-rose-50 border-rose-100";

  return (
    <div className="min-w-[240px] max-w-[240px] bg-white border border-border/60 rounded-xl p-3.5 shadow-sm hover:shadow-md transition-all flex-shrink-0 flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-2">
          <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${scoreColor}`}>
            Skor: {actualScore}%
          </div>
        </div>
        
        {/* Membaca topic_name daripada QuizAttempt */}
        <h4 className="text-xs font-bold text-slate-800 line-clamp-2 mb-1 h-8" title={quiz.topic_name}>
          {quiz.topic_name || "Penilaian Kuiz"}
        </h4>
      </div>
      <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2">
        <span className="font-medium bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{quiz.subject || "Subjek"}</span>
        <span>{quiz.created_date ? new Date(quiz.created_date).toLocaleDateString('ms-MY') : "Selesai"}</span>
      </div>
    </div>
  );
}

// ---------------- KOMPONEN UTAMA: AI ANALYTIC PANEL (PREMIUM) ----------------
function AiAnalyticPanel({ child, isPremium }) {
  if (!isPremium) {
    return (
      <div className="relative mt-2 overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/50 to-white p-6">
        <div className="absolute inset-0 z-10 backdrop-blur-[2px] bg-white/30 flex flex-col items-center justify-center text-center p-6">
          <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg mb-3">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h4 className="text-sm font-black text-slate-800 mb-1">AI Lesson Analytic</h4>
          <p className="text-[11px] text-slate-600 max-w-[250px] mb-4">
            Dapatkan analisis mendalam tentang corak pembelajaran, kekuatan kognitif, dan ramalan prestasi anak anda.
          </p>
          <Button size="sm" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold gap-2 rounded-full shadow-md text-xs">
            <Zap className="w-3.5 h-3.5 fill-current" /> Naik Taraf Premium
          </Button>
        </div>
        <div className="opacity-20 select-none">
          <div className="h-4 w-32 bg-slate-200 rounded mb-4" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-20 bg-slate-100 rounded-xl" />
            <div className="h-20 bg-slate-100 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2 rounded-2xl border border-indigo-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">AI Pembelajaran Pintar</h4>
            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Status: Aktif & Menganalisis</p>
          </div>
        </div>
        <Badge className="bg-indigo-600 text-white border-none text-[10px]">PREMIUM</Badge>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Kekuatan Kognitif</p>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-700">Logik & Matematik</span>
              <span className="font-bold text-indigo-600">88%</span>
            </div>
            <Progress value={88} className="h-1.5 bg-slate-200" />
          </div>
        </div>
        <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
          <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Rumusan AI</p>
          <p className="text-xs text-slate-700 leading-relaxed">
            {child.display_name} menunjukkan minat yang tinggi. Prestasi tugasan setakat ini amat memberangsangkan.
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------- MAIN PORTAL COMPONENT ----------------
export default function MyChildrenPage() {
  const [user, setUser] = useState(null);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCredentialManager, setShowCredentialManager] = useState(false);
  const [selectedChild, setSelectedChild] = useState(null);
  const [activeTabs, setActiveTabs] = useState({}); 
  const { toast } = useToast();

  const calculateAge = (birthDate) => {
    if (!birthDate) return "N/A";
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const loadChildren = useCallback(async () => {
    try {
      setLoading(true);
      const u = await base44.auth.me();
      setUser(u);

      const relationships = await base44.entities.ParentChildRelationship.filter({
        parent_id: u.id,
        status: "active",
      });

      const childDetails = await Promise.all(
        relationships.map(async (rel) => {
          try {
            const child = await base44.entities.User.get(rel.child_id);
            let progress = null;
            let wallet = null;
            let lessons = [];
            let quizzes = [];

            try {
              // PENGAMBILAN DATA SEBENAR: Menyelaras entiti dengan StudentDashboard
              const [p, w, l, q] = await Promise.all([
                base44.entities.Progress.filter({ student_id: child.id }).then((r) => r[0] || null),
                base44.entities.Wallet.filter({ student_id: child.id }).then((r) => r[0] || null),
                base44.entities.StudySession.filter({ student_id: child.id }, "-created_date", 5).catch(() => []),
                base44.entities.QuizAttempt.filter({ student_id: child.id }, "-created_date", 5).catch(() => []), 
              ]);
              progress = p;
              wallet = w;
              lessons = l;
              quizzes = q;
            } catch (metaErr) {
              console.error(`Gagal mendapatkan data untuk anak ${child.id}:`, metaErr);
            }

            return {
              ...child,
              display_name: getDisplayName(child),
              progress,
              wallet,
              lessons: lessons || [], 
              quizzes: quizzes || [],
              relationshipId: rel.id,
              is_premium: child.is_premium || false 
            };
          } catch (childErr) {
            return null;
          }
        })
      );

      const validChildren = childDetails.filter(Boolean);
      setChildren(validChildren);
      
      const initialTabs = {};
      validChildren.forEach(c => {
        initialTabs[c.id] = "lessons";
      });
      setActiveTabs(initialTabs);

    } catch (err) {
      toast({ title: "Error", description: "Gagal memuatkan profil anak", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadChildren();
  }, [loadChildren]);

  const setTabForChild = (childId, tabName) => {
    setActiveTabs(prev => ({ ...prev, [childId]: tabName }));
  };

  const handleRemoveLink = async (child) => {
    if (!confirm(`Padam pautan profil ${child.display_name}?`)) return;
    try {
      await base44.entities.ParentChildRelationship.update(child.relationshipId, { status: "inactive" });
      setChildren((prev) => prev.filter((c) => c.id !== child.id));
      toast({ title: "Berjaya", description: "Pautan profil telah dipadam." });
    } catch (err) {
      toast({ title: "Gagal", description: err.message, variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-sm font-medium text-muted-foreground">Menyelaras data akademik wira kecil...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-6 pb-16">
      
      {/* Header Portal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-border/60 p-6 rounded-2xl shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-800">Urusan Keluarga</h1>
            <Badge className="bg-indigo-100 text-indigo-700 border-none font-bold">
              {children.length} Aktif
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Pantau perkembangan pelajaran, urus akaun, and lihat analisis AI secara langsung.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadChildren} size="sm" className="h-10">
            <RefreshCw className="w-4 h-4 mr-2" /> Segarkan
          </Button>
          <Button onClick={() => setShowAddModal(true)} className="h-10 bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" /> Sambung Profil Baru
          </Button>
        </div>
      </div>

      {children.length === 0 ? (
        <Card className="border-dashed border-2 bg-slate-50/50">
          <CardContent className="py-20 text-center max-w-md mx-auto">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-800 mb-2">Tiada profil disambungkan</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Sambungkan akaun StudyQuest anak anda untuk mula memantau prestasi mereka secara langsung.
            </p>
            <Button onClick={() => setShowAddModal(true)} className="bg-indigo-600">Hubungkan Sekarang</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          <AnimatePresence>
            {children.map((child, index) => {
              const currentTab = activeTabs[child.id] || "lessons";

              return (
                <motion.div
                  key={child.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="overflow-hidden border-border/80 shadow-md">
                    <div className="p-6 md:p-8">
                      
                      {/* Atas: Profil Singkat */}
                      <div className="flex flex-col lg:flex-row justify-between gap-6 mb-6">
                        <div className="flex items-center gap-5">
                          <div className="relative">
                            <div className="w-20 h-20 rounded-2xl bg-indigo-50 border-2 border-white shadow-md flex items-center justify-center overflow-hidden">
                              {child.profile_picture_url ? (
                                <img src={child.profile_picture_url} className="w-full h-full object-cover" />
                              ) : (
                                <User className="w-10 h-10 text-indigo-300" />
                              )}
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-emerald-500 w-5 h-5 rounded-full border-2 border-white" />
                          </div>
                          <div>
                            <h2 className="text-2xl font-black text-slate-800">{child.display_name}</h2>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 rounded-md text-slate-600">Umur {calculateAge(child.date_of_birth)}</span>
                              <span className="text-xs font-bold text-indigo-600 flex items-center gap-1">
                                <GraduationCap className="w-3.5 h-3.5" /> {child.education_level || "Tahun 1"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center p-3 bg-orange-50 rounded-xl border border-orange-100">
                            <Flame className="w-5 h-5 text-orange-500 mx-auto mb-1" />
                            <p className="text-xs font-black text-slate-800">{child.progress?.streak_days || 0} Hari</p>
                          </div>
                          <div className="text-center p-3 bg-amber-50 rounded-xl border border-amber-100">
                            <span className="text-lg block mb-0.5">🪙</span>
                            <p className="text-xs font-black text-slate-800">{child.wallet?.balance || 0}</p>
                          </div>
                          <div className="text-center p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                            <Award className="w-5 h-5 text-indigo-600 mx-auto mb-1" />
                            <p className="text-xs font-black text-slate-800">Tahap {child.progress?.level || 1}</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6 border-t border-slate-100">
                        
                        {/* Kiri: Real Lesson & Quizzes List */}
                        <div className="lg:col-span-7 space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                            <div className="flex gap-2">
                              <button 
                                onClick={() => setTabForChild(child.id, "lessons")}
                                className={`text-xs font-black px-3 py-1.5 rounded-lg transition-colors ${currentTab === "lessons" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                              >
                                📚 Pelajaran ({child.lessons?.length || 0})
                              </button>
                              <button 
                                onClick={() => setTabForChild(child.id, "quizzes")}
                                className={`text-xs font-black px-3 py-1.5 rounded-lg transition-colors ${currentTab === "quizzes" ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                              >
                                📝 Rekod Kuiz ({child.quizzes?.length || 0})
                              </button>
                            </div>
                            <Link to={`/parent/children/${child.id}`} className="text-[10px] font-bold text-indigo-600 hover:underline self-end sm:self-auto">LIHAT LAPORAN PENUH →</Link>
                          </div>

                          <div className="flex gap-4 overflow-x-auto pb-4 pt-1 scrollbar-hide min-h-[120px]">
                            {currentTab === "lessons" ? (
                              child.lessons && child.lessons.length > 0 ? (
                                child.lessons.map((lesson) => (
                                  <ChildLessonCard key={lesson.id} lesson={lesson} />
                                ))
                              ) : (
                                <p className="text-xs text-slate-400 font-medium italic py-6">Anak anda belum memulakan sebarang pelajaran lagi.</p>
                              )
                            ) : (
                              child.quizzes && child.quizzes.length > 0 ? (
                                child.quizzes.map((quiz) => (
                                  <ChildQuizCard key={quiz.id} quiz={quiz} />
                                ))
                              ) : (
                                <p className="text-xs text-slate-400 font-medium italic py-6">Belum ada rekod kuiz yang diselesaikan.</p>
                              )
                            )}
                          </div>
                        </div>

                        {/* Kanan: AI Analytics & Controls */}
                        <div className="lg:col-span-5 space-y-4">
                          <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-purple-600" /> Analitik & Kawalan
                          </h3>
                          
                          <AiAnalyticPanel child={child} isPremium={child.is_premium} />

                          <div className="flex items-center gap-2 pt-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1 font-bold text-xs rounded-xl"
                              onClick={() => {
                                setSelectedChild(child);
                                setShowCredentialManager(true);
                              }}
                            >
                              <Key className="w-3.5 h-3.5 mr-2" /> Kata Laluan
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-500 hover:text-red-600 hover:bg-red-50 font-bold text-xs rounded-xl"
                              onClick={() => handleRemoveLink(child)}
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-2" /> Putuskan
                            </Button>
                          </div>
                        </div>
                      </div>

                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <AddChildModal 
        open={showAddModal} 
        onOpenChange={setShowAddModal} 
        onChildAdded={loadChildren} 
      />
      {selectedChild && (
        <ChildCredentialManager
          child={selectedChild}
          open={showCredentialManager}
          onOpenChange={(open) => {
            setShowCredentialManager(open);
            if (!open) setSelectedChild(null);
          }}
        />
      )}
    </div>
  );
}