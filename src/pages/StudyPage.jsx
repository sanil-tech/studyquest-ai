// src/pages/StudyPage.jsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, ChevronRight, BookOpen, FolderOpen, 
  Map, Library, Leaf, TreePine, Sprout, Compass, Clock, ShieldCheck, AlertCircle, Loader2, CheckCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";

export default function StudyPage() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [textbooks, setTextbooks] = useState([]);
  const [user, setUser] = useState(null);
  const [userProgress, setUserProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Keadaan untuk laci kabinet buku teks digital
  const [activeLibrarySubject, setActiveLibrarySubject] = useState(null);

  // 🎯 KAWALAN PAPARAN 3: Keadaan untuk pengendalian nota aktif dan pemasa keselamatan
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isTabActive, setIsTabActive] = useState(true);
  const [isAlreadyCompleted, setIsAlreadyCompleted] = useState(false);
  const [saving, setSaving] = useState(false);

  const pemasaRef = useRef(null);
  
  // Ketetapan masa minimum belajar standard (Unit: Saat)
  const MASA_MINIMUM_SAAT = 60; 

  useEffect(() => {
    const loadData = async () => {
      // Memuatkan data secara selari bagi mengelakkan ralat kebergantungan sambungan
      const results = await Promise.allSettled([
        base44.entities.Subject.list(),
        base44.entities.Textbook.list("-created_date", 50),
        base44.auth.me(),
      ]);

      const subs = results[0].status === "fulfilled" ? results[0].value : [];
      const books = results[1].status === "fulfilled" ? results[1].value : [];
      const u = results[2].status === "fulfilled" ? results[2].value : null;

      setSubjects(subs);
      setTextbooks(books);
      setUser(u);

      // Memuatkan profil kemajuan agregat murid dari pangkalan data
      if (u) {
        try {
          const progressRecords = await base44.entities.Progress.filter({ student_id: u.id });
          if (progressRecords && progressRecords.length > 0) {
            setUserProgress(progressRecords[0]);
          }
        } catch (err) {
          console.error("Gagal mengambil profil kemajuan:", err);
        }
      }

      if (subjectId) {
        const sub = subs.find(s => s.id === subjectId);
        setSelectedSubject(sub);
        try {
          const t = await base44.entities.Topic.filter({ subject_id: subjectId });
          setTopics(t);
        } catch (e) {
          console.error("Gagal memuat turun topik:", e);
        }
      }
      setLoading(false);
    };
    loadData();
  }, [subjectId]);

  // Logik pemasa keselamatan pintar mengesan fokus skrin peranti murid
  useEffect(() => {
    if (loading || !selectedTopic || isAlreadyCompleted) return;

    const kendaliPerubahanTab = () => {
      if (document.hidden) {
        setIsTabActive(false);
      } else {
        setIsTabActive(true);
      }
    };

    document.addEventListener("visibilitychange", kendaliPerubahanTab);

    if (isTabActive) {
      pemasaRef.current = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (pemasaRef.current) clearInterval(pemasaRef.current);
      document.removeEventListener("visibilitychange", kendaliPerubahanTab);
    };
  }, [loading, selectedTopic, isTabActive, isAlreadyCompleted]);

  // Menapis topik berdasarkan tahap pendidikan murid secara kebal ralat huruf
  const filteredTopics = useMemo(() => {
    if (!topics || !user) return topics || [];
    const userLevel = user.education_level || user.school_year;
    if (!userLevel) return topics;
    
    const safeUserLevel = userLevel.trim().toLowerCase();
    return topics.filter(t => {
      if (!t.form_level) return true;
      if (t.form_level.trim().toLowerCase() === "all levels") return true;
      return t.form_level.trim().toLowerCase() === safeUserLevel;
    });
  }, [topics, user]);

  // Mengendalikan pemilihan subjek utama
  const handleSelectSubject = async (sub) => {
    setSelectedSubject(sub);
    setLoading(true);
    try {
      const t = await base44.entities.Topic.filter({ subject_id: sub.id });
      setTopics(t);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  // 🎯 TINDAKAN UTAMA: Membuka Paparan 3 dan menyemak sejarah pembacaan silam
  const handleSelectTopic = async (topicItem) => {
    setLoading(true);
    setSecondsElapsed(0);
    setIsTabActive(true);
    setIsAlreadyCompleted(false);
    
    try {
      // Menyemak kewujudan data sejarah dalam StudySession untuk kelulusan pintasan pemasa
      const sessionsCheck = await base44.entities.StudySession.filter({
        student_id: user?.id,
        topic_id: topicItem.id
      });

      if (sessionsCheck && sessionsCheck.length > 0) {
        setIsAlreadyCompleted(true);
      }
      setSelectedTopic(topicItem);
    } catch (err) {
      console.error("Ralat menyemak status sesi bab:", err);
    } finally {
      setLoading(false);
    }
  };

  // Menyimpan rekod penyelesaian sesi secara kekal ke pelayan
  const kendaliSelesaiMisi = async () => {
    if (!adakahMasaCukup) return;
    setSaving(true);

    try {
      const minitBelajar = isAlreadyCompleted ? 1 : Math.max(1, Math.round(secondsElapsed / 60));

      // 1. Merekod log sesi belajar baharu mengikut format lajur CSV StudySession anda
      await base44.entities.StudySession.create({
        student_id: user.id,
        subject_id: selectedSubject.id,
        subject_name: selectedSubject.name,
        topic_id: selectedTopic.id,
        topic_name: selectedTopic.name,
        duration_minutes: minitBelajar,
        created_date: new Date().toISOString(),
      });

      // 2. Mengemas kini data agregat kemajuan mengikut format lajur CSV Progress anda
      if (userProgress && !isAlreadyCompleted) {
        await base44.entities.Progress.update(userProgress.id, {
          total_xp: (userProgress.total_xp || 0) + 25, 
          total_study_time: (userProgress.total_study_time || 0) + minitBelajar,
          last_study_date: new Date().toISOString(),
        });
      }

      toast({ title: "Misi Berjaya! 🎉", description: "Kemajuan sesi pembelajaran anda telah direkodkan." });
      setSelectedTopic(null); // Kembali ke peta bab laluan subjek
    } catch (err) {
      console.error("Ralat menyimpan rekod sesi ilmu:", err);
      toast({ title: "Ralat", description: "Gagal merekod kemajuan sesi.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Mengelompokkan buku teks mengikut nama subjek rujukan
  const booksBySubject = useMemo(() => {
    return textbooks.reduce((acc, book) => {
      if (!acc[book.subject_name]) acc[book.subject_name] = [];
      acc[book.subject_name].push(book);
      return acc;
    }, {});
  }, [textbooks]);

  const peratusanMasa = isAlreadyCompleted ? 100 : Math.min((secondsElapsed / MASA_MINIMUM_SAAT) * 100, 100);
  const bakiMasaSaat = isAlreadyCompleted ? 0 : Math.max(MASA_MINIMUM_SAAT - secondsElapsed, 0);
  const adakahMasaCukup = isAlreadyCompleted || secondsElapsed >= MASA_MINIMUM_SAAT;
  const studentFirstName = user?.name ? user.name.split(" ")[0] : (user?.nickname || "Penjelajah");

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 bg-[#FAFAF7]">
        <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
        <p className="text-sm font-bold text-emerald-700/60 uppercase tracking-widest">Otan sedang sediakan peta...</p>
      </div>
    );
  }

  // =====================================================================
  // 🏛️ VIEW 1: UTAMA (PILIHAN GRID SUBJEK & PERPUSTAKAAN DIGITAL)
  // =====================================================================
  if (!selectedSubject) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] font-sans pb-12 pt-6">
        <div className="space-y-8 max-w-5xl mx-auto px-4">
          
          <div className="relative bg-gradient-to-br from-emerald-600 to-green-700 rounded-[2rem] p-6 sm:p-10 border border-emerald-800/20 shadow-lg overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1.5 text-lime-900 font-extrabold text-[10px] uppercase tracking-widest bg-lime-400 px-3 py-1 rounded-full w-max shadow-sm">
                  <Leaf className="w-3.5 h-3.5 fill-current" /> Peta Penjelajahan Ilmu
                </div>
                <h1 className="text-3xl sm:text-4xl font-black text-white drop-shadow-sm mt-2">
                  Sedia untuk teroka, {studentFirstName}? 🗺️
                </h1>
                <p className="text-emerald-50 font-medium text-sm mt-1 max-w-lg">
                  Pilih dahan subjek di bawah untuk mencapai matlamat <span className="font-bold text-lime-300">{user?.education_level || user?.school_year || "tahap anda"}</span> hari ini!
                </p>
              </div>
              <div className="w-20 h-20 rounded-3xl bg-white/10 text-5xl flex items-center justify-center shrink-0">🦧</div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-black text-stone-700 mb-4 flex items-center gap-2">
              <Compass className="w-5 h-5 text-emerald-600" />
              <span>Laluan Dahan Subjek</span>
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {subjects.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => handleSelectSubject(sub)}
                  className="group relative p-5 rounded-[2rem] bg-white border border-emerald-100 hover:border-emerald-300 flex flex-col items-center justify-center shadow-sm hover:shadow-md transition-all"
                >
                  <div className="w-16 h-16 rounded-2xl mb-3 flex items-center justify-center text-4xl bg-emerald-50/50 group-hover:scale-110 transition-transform">
                    {sub.icon || "🌿"}
                  </div>
                  <h3 className="font-black text-sm text-stone-800 text-center">{sub.name}</h3>
                  <div className="mt-3 px-3 py-1 bg-[#F3EFE6] rounded-full text-[11px] font-bold text-stone-500 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    Teroka ➜
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* PERPUSTAKAAN DAUN TUALANG */}
          {textbooks.length > 0 && (
            <div className="bg-white rounded-[2rem] border border-stone-200/60 p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-amber-600 flex items-center justify-center text-white shrink-0">
                  <Library className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-black text-stone-800 text-lg">Perpustakaan Daun Tualang</h2>
                  <p className="text-xs text-stone-500 font-medium">Buka folder subjek untuk membaca naskah rujukan buku teks digital.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {Object.keys(booksBySubject).map((name) => (
                  <button
                    key={name}
                    onClick={() => setActiveLibrarySubject(activeLibrarySubject === name ? null : name)}
                    className={`flex items-center justify-between p-4 rounded-xl border text-left transition-all ${
                      activeLibrarySubject === name ? "bg-amber-50 border-amber-300" : "bg-white border-stone-200"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FolderOpen className="w-5 h-5 text-stone-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-stone-800 truncate">{name}</p>
                        <p className="text-[10px] text-stone-400 font-medium">{booksBySubject[name].length} Buku</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-stone-400" />
                  </button>
                ))}
              </div>

              {activeLibrarySubject && (
                <div className="mt-4 p-4 bg-[#FAFAF7] rounded-2xl border border-stone-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {booksBySubject[activeLibrarySubject].map((book) => (
                    <a
                      key={book.id} href={book.file_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-xl bg-white border border-transparent hover:border-amber-200 hover:bg-amber-50/20 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-stone-800 truncate">{book.title}</p>
                        <p className="text-[10px] text-stone-400">{book.form_level || "Umum"}</p>
                      </div>
                      <span className="text-[10px] font-bold bg-stone-50 border px-2.5 py-1 rounded-lg text-stone-600">Baca Buku 📖</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // =====================================================================
  // 🗺️ VIEW 3: BARU (PAPARAN NOTA PEMBELAJARAN AKTIF DENGAN PEMASA FOKUS)
  // =====================================================================
  if (selectedTopic) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] font-sans pb-24 text-stone-700 pt-6">
        <div className="max-w-3xl mx-auto px-4 space-y-6">
          
          {/* Bar Navigasi Kelulusan Masa Atas */}
          <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border border-stone-200/60 p-3 flex justify-between items-center rounded-2xl shadow-xs">
            <button 
              onClick={() => setSelectedTopic(null)}
              className="p-2 rounded-xl bg-stone-100 text-stone-600 hover:bg-stone-200 transition-transform"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3">
              {!isAlreadyCompleted && !isTabActive && (
                <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 animate-pulse">
                  ⚠️ Pemasa Dihentikan Sementara
                </span>
              )}
              
              <div className={`flex items-center gap-1.5 font-black text-xs px-3 py-1.5 rounded-xl border ${
                adakahMasaCukup ? "text-emerald-600 bg-emerald-50 border-emerald-200" : "text-amber-600 bg-amber-50 border-amber-200"
              }`}>
                <Clock className="w-4 h-4" />
                <span>{isAlreadyCompleted ? "Selesai Mengulang Kaji ✨" : `${secondsElapsed} / ${MASA_MINIMUM_SAAT} Saat Fokus`}</span>
              </div>
            </div>
          </div>

          {/* Lembaran Kandungan Karakter Nota */}
          <div className="bg-white rounded-[2rem] p-6 sm:p-10 border border-stone-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase">
              <BookOpen className="w-4 h-4" /> Nota Akademik Penjelajahan
            </div>
            <h1 className="text-2xl font-black text-stone-800">{selectedTopic.name}</h1>
            <div className="border-b border-stone-100 my-4" />
            <p className="text-stone-600 text-sm sm:text-base leading-relaxed whitespace-pre-line font-medium">
              {selectedTopic.content || "Tiada kandungan nota teks untuk bab ini. Sila rujuk rujukan buku teks digital."}
            </p>
          </div>

          {/* Panel Validasi Anti-Langkau Sesi Belajar */}
          <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs space-y-4">
            {isAlreadyCompleted ? (
              <div className="flex items-start gap-3 bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 text-emerald-950 text-xs font-semibold">
                <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Nota Sedia Terbuka</p>
                  <p className="text-emerald-800 mt-0.5">Anda sudah menamatkan misi bab ini sebelum ini. Sila baca untuk mengulang kaji atau terus simpan log sesi.</p>
                </div>
              </div>
            ) : !adakahMasaCukup ? (
              <div className="flex items-start gap-3 bg-amber-50/70 p-4 rounded-xl border border-amber-200 text-amber-950 text-xs font-semibold">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Sistem Keselamatan Anti-Langkau Misi</p>
                  <p className="text-amber-700 mt-0.5">Sila baca dengan teliti selama <span className="font-black text-amber-900">{bakiMasaSaat} saat lagi</span> untuk mendapatkan mata insentif XP kemajuan anda.</p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 text-emerald-950 text-xs font-semibold">
                <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Masa Pembacaan Disahkan Sempurna!</p>
                  <p className="text-emerald-800 mt-0.5">Masa fokus anda mencukupi. Anda kini boleh merekodkan tugasan ilmu ini ke dalam profil kemajuan akaun.</p>
                </div>
              </div>
            )}

            {/* Graf Bar Penunjuk Fokus Visual */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold text-stone-400 uppercase">
                <span>Indikator Fokus Murid</span>
                <span>{Math.round(peratusanMasa)}%</span>
              </div>
              <div className="h-2.5 bg-stone-100 rounded-full overflow-hidden shadow-inner">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${
                    adakahMasaCukup ? "bg-gradient-to-r from-lime-400 to-emerald-500" : "bg-gradient-to-r from-amber-400 to-orange-400"
                  }`}
                  style={{ width: `${peratusanMasa}%` }}
                />
              </div>
            </div>

            <Button
              onClick={kendaliSelesaiMisi}
              disabled={!adakahMasaCukup || saving}
              className={`w-full py-6 font-black text-sm rounded-xl border-0 shadow-xs ${
                adakahMasaCukup ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-stone-100 text-stone-400 cursor-not-allowed"
              }`}
            >
              {saving ? (
                <span className="flex items-center gap-2 justify-center"><Loader2 className="w-4 h-4 animate-spin" /> Merekod Kemajuan...</span>
              ) : adakahMasaCukup ? (
                <span className="flex items-center gap-1.5 justify-center"><CheckCircle className="w-4 h-4" /> Simpan Sesi & Tuntut XP ✨</span>
              ) : (
                `Sila Baca Terlebih Dahulu (${bakiMasaSaat}s)`
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================================
  // 🗺️ VIEW 2: MAPA LALUAN KURSUS SUBJEK (SENARAI BAB KURSUS)
  // =====================================================================
  const subjectThemeColor = selectedSubject.color || "#10B981";
  const subjectBooks = textbooks.filter(b => b.subject_id === selectedSubject.id);

  return (
    <div className="min-h-screen bg-[#FAFAF7] font-sans pb-12 pt-6">
      <div className="space-y-6 max-w-3xl mx-auto px-4">
        
        <div className="flex items-center gap-4 bg-white p-4 rounded-[1.5rem] border border-emerald-100 shadow-sm">
          <button 
            onClick={() => setSelectedSubject(null)}
            className="p-3 rounded-xl bg-[#F3EFE6] text-stone-600 hover:bg-[#E3D9C6] transition-transform shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{selectedSubject.icon || "🌿"}</span>
              <h1 className="text-xl sm:text-2xl font-black text-stone-800">{selectedSubject.name}</h1>
            </div>
            <p className="text-stone-500 text-xs font-medium">Pilih bab daripada peta laluan di bawah untuk memulakan misi!</p>
          </div>
        </div>

        {filteredTopics.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-[2rem] border border-emerald-100 max-w-md mx-auto shadow-sm">
            <span className="text-5xl block mb-4">🦧</span>
            <h3 className="font-black text-stone-800 text-lg">Misi Dalam Pembinaan!</h3>
            <p className="text-stone-500 text-sm max-w-xs mx-auto mt-2 px-4">
              Otan sedang bertungkus-lumus membina laluan untuk bab ini. Nantikan kemunculannya, {studentFirstName}!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Pintasan Buku Teks Rujukan */}
            {subjectBooks.length > 0 && (
              <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📗</span>
                  <p className="text-sm font-bold text-amber-900">Perlukan rujukan naskah buku teks?</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {subjectBooks.map(book => (
                    <a
                      key={book.id} href={book.file_url} target="_blank" rel="noopener noreferrer"
                      className="text-[11px] font-bold bg-white text-amber-800 border border-amber-300 px-3 py-1.5 rounded-lg hover:bg-amber-100 shadow-sm transition-colors"
                    >
                      Buka {book.form_level || "Buku"} ➜
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Susunan Senarai Peta Jalan Menjalar */}
            <div className="space-y-3 relative">
              <div className="absolute left-7 top-6 bottom-6 w-1 bg-emerald-200 rounded-full z-0 hidden sm:block" />

              <div className="flex items-center justify-between px-1 mb-2 relative z-10">
                <span className="text-xs font-black tracking-wider text-stone-400 uppercase">Peta Misi Bab</span>
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-bold">
                  {filteredTopics.length} Cabaran Minda
                </span>
              </div>

              {filteredTopics.map((topic, i) => (
                <div key={topic.id} className="relative z-10">
                  <button
                    onClick={() => handleSelectTopic(topic)}
                    className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl border border-emerald-100 hover:border-emerald-400 transition-all text-left group shadow-sm hover:shadow-md relative overflow-hidden"
                  >
                    <div 
                      className="absolute left-0 top-0 bottom-0 w-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ backgroundColor: subjectThemeColor }}
                    />

                    <div 
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full font-black text-sm flex items-center justify-center shrink-0 border-4 bg-white relative"
                      style={{ borderColor: `${subjectThemeColor}40`, color: subjectThemeColor }}
                    >
                      {i + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm sm:text-base text-stone-800 truncate group-hover:text-emerald-700 transition-colors">
                        {topic.name}
                      </h3>
                      {topic.form_level && (
                        <span className="inline-block text-[10px] font-extrabold bg-[#F3EFE6] text-stone-500 px-2.5 py-0.5 rounded-md mt-1.5 border border-[#E3D9C6]">
                          {topic.form_level}
                        </span>
                      )}
                    </div>

                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-all transform group-hover:scale-110 shrink-0">
                      <Map className="w-5 h-5" />
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
