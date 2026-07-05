import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { 
  Users, Plus, Eye, Key, User, RefreshCw, Trash2, 
  GraduationCap, Award, Flame, ShieldAlert, Sparkles, 
  TrendingUp, Calendar, ArrowRight, Settings, BookOpen,
  CheckCircle2, Clock, BrainCircuit, Lock, Zap, BarChart3
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

// ---------------- KOMPONEN KECIL: LESSON CARD ----------------
function ChildLessonCard({ lesson }) {
  const isCompleted = lesson.status === "completed";
  
  return (
    <div className="min-w-[200px] bg-white border border-border/50 rounded-xl p-3 shadow-sm hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-2">
        <div className={`p-1.5 rounded-lg ${isCompleted ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
          <BookOpen className="w-4 h-4" />
        </div>
        {isCompleted ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        ) : (
          <span className="text-[10px] font-bold text-blue-500 uppercase">Dalam Proses</span>
        )}
      </div>
      <h4 className="text-xs font-bold text-slate-800 line-clamp-1 mb-1">{lesson.title || "Pelajaran Tanpa Tajuk"}</h4>
      <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
        <Clock className="w-3 h-3" />
        <span>{lesson.duration || "15 min"}</span>
        <span>•</span>
        <span>{lesson.subject || "Umum"}</span>
      </div>
    </div>
  );
}

// ---------------- KOMPONEN UTAMA: AI ANALYTIC PANEL (PREMIUM) ----------------
function AiAnalyticPanel({ child, isPremium }) {
  if (!isPremium) {
    return (
      <div className="relative mt-4 overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/50 to-white p-6">
        {/* Overlay Blur untuk Non-Premium */}
        <div className="absolute inset-0 z-10 backdrop-blur-[2px] bg-white/30 flex flex-col items-center justify-center text-center p-6">
          <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg mb-3">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h4 className="text-lg font-black text-slate-800 mb-1">AI Lesson Analytic</h4>
          <p className="text-xs text-slate-600 max-w-[250px] mb-4">
            Dapatkan analisis mendalam tentang corak pembelajaran, kekuatan kognitif, dan ramalan prestasi anak anda.
          </p>
          <Button size="sm" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold gap-2 rounded-full shadow-md transition-transform hover:scale-105">
            <Zap className="w-3.5 h-3.5 fill-current" /> Naik Taraf Premium
          </Button>
        </div>

        {/* Dummy Background Content (Nampak tapi blur) */}
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
    <div className="mt-4 rounded-2xl border border-indigo-200 bg-white p-5 shadow-sm">
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
            {child.display_name} menunjukkan minat tinggi dalam subjek <strong>Sains</strong>. Fokus 15 minit pertama adalah yang paling optimum.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function MyChildrenPage() {
  const [user, setUser] = useState(null);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCredentialManager, setShowCredentialManager] = useState(false);
  const [selectedChild, setSelectedChild] = useState(null);
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

            try {
              // Menarik data progress, wallet, dan lesson khusus anak ini
              const [p, w, l] = await Promise.all([
                base44.entities.Progress.filter({ student_id: child.id }).then((r) => r[0] || null),
                base44.entities.Wallet.filter({ student_id: child.id }).then((r) => r[0] || null),
                base44.entities.Lesson.filter({ student_id: child.id, _limit: 5 }), // Ambil 5 lesson terbaru
              ]);
              progress = p;
              wallet = w;
              lessons = l;
            } catch (metaErr) {
              console.error(`Metadata error for ${child.id}:`, metaErr);
            }

            return {
              ...child,
              display_name: getDisplayName(child),
              progress,
              wallet,
              lessons: lessons.length > 0 ? lessons : [
                { id: 1, title: "Asas Nombor & Operasi", status: "completed", subject: "Math" },
                { id: 2, title: "Mengenal Haiwan Mamalia", status: "in_progress", subject: "Science" }
              ], // Mock data jika database kosong
              relationshipId: rel.id,
              is_premium: false // Tukar ke true untuk test paparan Premium
            };
          } catch (childErr) {
            return null;
          }
        })
      );

      setChildren(childDetails.filter(Boolean));
    } catch (err) {
      toast({ title: "Error", description: "Gagal memuatkan profil anak", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadChildren();
  }, [loadChildren]);

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
        <RefreshCw className="w-10 h-10 text-primary animate-spin" />
        <p className="text-sm font-medium text-muted-foreground">Menyelaras data wira kecil...</p>
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
            <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-none font-bold">
              {children.length} Aktif
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Pantau perkembangan pelajaran, urus akaun, dan lihat analisis AI.
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
            {children.map((child, index) => (
              <motion.div
                key={child.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="overflow-hidden border-border/80 shadow-md">
                  <div className="p-6 md:p-8">
                    {/* Atas: Profil Singkat */}
                    <div className="flex flex-col lg:flex-row justify-between gap-6 mb-8">
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
                      {/* Kiri: Lesson Progress */}
                      <div className="lg:col-span-7 space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-indigo-600" /> Pelajaran Terkini
                          </h3>
                          <Link to={`/parent/children/${child.id}`} className="text-[10px] font-bold text-indigo-600 hover:underline">LIHAT SEMUA</Link>
                        </div>
                        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                          {child.lessons.map((lesson) => (
                            <ChildLessonCard key={lesson.id} lesson={lesson} />
                          ))}
                        </div>
                      </div>

                      {/* Kanan: AI Analytics & Controls */}
                      <div className="lg:col-span-5 space-y-4">
                        <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-purple-600" /> Analitik & Kawalan
                        </h3>
                        
                        {/* Ciri Premium AI Analytic */}
                        <AiAnalyticPanel child={child} isPremium={child.is_premium} />

                        <div className="flex items-center gap-2 pt-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1 font-bold text-xs"
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
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 font-bold text-xs"
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
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modals */}
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