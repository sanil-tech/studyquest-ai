// src/pages/StudyPage.jsx
import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useParams, Link } from "react-router-dom";
import { 
  ArrowLeft, ChevronRight, BookOpen, FolderOpen, 
  Map, Library, Leaf, Compass, Sparkles, Flame, Trophy, Lock, CheckCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";

export default function StudyPage() {
  const { subjectId } = useParams();
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [textbooks, setTextbooks] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [activeLibrarySubject, setActiveLibrarySubject] = useState(null);

  useEffect(() => {
    const load = async () => {
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
    load();
  }, [subjectId]);

  const filteredTopics = useMemo(() => {
    if (!topics || !user) return topics || [];
    const userLevel = user.education_level || user.school_year;
    if (!userLevel) return topics;
    
    const safeUserLevel = userLevel.trim().toLowerCase();
    return topics.filter(t => {
      if (!t.form_level) return true;
      if (t.form_level === "All Levels") return true;
      return t.form_level.trim().toLowerCase() === safeUserLevel;
    });
  }, [topics, user]);

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

  const booksBySubject = useMemo(() => {
    return textbooks.reduce((acc, book) => {
      if (!acc[book.subject_name]) acc[book.subject_name] = [];
      acc[book.subject_name].push(book);
      return acc;
    }, {});
  }, [textbooks]);

  const studentFirstName = user?.nickname || (user?.name ? user.name.split(" ")[0] : "Penjelajah");
  
  // 💥 KUNCI UTAMA: Tentukan dwi-tema berdasarkan kumpulan umur (7-12 Kid, 13-17 Teen)
  const isKid = user?.age_group !== "teen";

  if (loading) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-screen space-y-4 ${isKid ? "bg-[#FAFAF7]" : "bg-slate-950"}`}>
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
          <Compass className={`w-12 h-12 ${isKid ? "text-emerald-600" : "text-emerald-400"}`} />
        </motion.div>
        <p className={`text-xs font-black uppercase tracking-widest ${isKid ? "text-emerald-800/60" : "text-slate-500"}`}>
          Otan sedang melakar garisan peta... 🦧
        </p>
      </div>
    );
  }

  // =====================================================================
  // VIEW 1: MAIN DASHBOARD (PILIHAN SUBJEK & KABINET BUKU TEKS)
  // =====================================================================
  if (!selectedSubject) {
    return (
      <div className={`min-h-screen font-sans pb-16 pt-6 transition-colors duration-500 ${
        isKid ? "bg-gradient-to-b from-[#F4FBF7] to-[#FFFDE7]" : "bg-slate-950 text-slate-100"
      }`}>
        <div className="space-y-8 max-w-5xl mx-auto px-4">
          
          {/* BANNER UTAMA TEMA PENGEMBARA BORNEO */}
          <div className={`relative rounded-[2.5rem] p-6 sm:p-10 border-b-[6px] overflow-hidden shadow-xl ${
            isKid 
              ? "bg-gradient-to-br from-emerald-600 to-green-700 border-green-900 text-white" 
              : "bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 border-slate-800 text-slate-100"
          }`}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className={`flex items-center gap-1.5 font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-full w-max shadow-sm ${
                  isKid ? "bg-lime-400 text-lime-950" : "bg-slate-800 text-emerald-400"
                }`}>
                  <Leaf className="w-3.5 h-3.5 fill-current" /> Peta Penjelajahan Rimba Ilmu
                </div>
                <h1 className="text-2xl sm:text-4xl font-black tracking-tight drop-shadow-sm pt-1">
                  Sedia untuk teroka, {studentFirstName}? 🗺️
                </h1>
                <p className={`text-xs sm:text-sm max-w-lg font-medium ${isKid ? "text-emerald-50" : "text-slate-400"}`}>
                  Pilih dahan subjek di bawah untuk memulakan ekspedisi ilmu bagi tahap <span className="font-bold text-lime-300 uppercase">{user?.education_level || "Pelajar"}</span> hari ini!
                </p>
              </div>
              
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 shadow-inner flex items-center justify-center text-5xl shrink-0 self-start sm:self-center transform rotate-3 animate-pulse">
                🦧
              </div>
            </div>
          </div>

          {/* GRID PILIHAN SUBJEK (DUOLINGO GAMES MENU METAPHOR) */}
          <div className="space-y-4">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
              <Compass className="w-4 h-4 text-emerald-500" /> Laluan Ekspedisi Subjek
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {subjects.map((sub, i) => {
                const themeColor = sub.color || "#10B981";
                return (
                  <motion.button
                    key={sub.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    whileHover={{ y: -6, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelectSubject(sub)}
                    className={`group relative p-6 rounded-[2.5rem] border-2 transition-all text-center flex flex-col items-center justify-center shadow-xs hover:shadow-md ${
                      isKid 
                        ? "bg-white border-emerald-100 hover:border-emerald-400" 
                        : "bg-slate-900 border-slate-800 hover:border-emerald-500/50"
                    }`}
                  >
                    <div 
                      className="w-16 h-16 rounded-2xl mb-4 flex items-center justify-center text-4xl shadow-inner transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                      style={{ backgroundColor: `${themeColor}15` }}
                    >
                      {sub.icon || "🌿"}
                    </div>
                    <h3 className={`font-black text-sm sm:text-base tracking-tight leading-snug ${!isKid && "text-white"}`}>
                      {sub.name}
                    </h3>
                    <div className={`mt-4 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors border ${
                      isKid 
                        ? "bg-slate-50 border-slate-100 text-slate-500 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-transparent" 
                        : "bg-slate-950 border-slate-800 text-slate-400 group-hover:bg-emerald-500 group-hover:text-slate-950 group-hover:border-transparent"
                    }`}>
                      Mula Teroka ➜
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* PERPUSTAKAAN DAUN TUALANG (KHAN ACADEMY LOCKER STYLE) */}
          {textbooks.length > 0 && (
            <Card className={`p-6 sm:p-8 rounded-[2.5rem] border shadow-xs ${
              isKid ? "bg-[#F4F1E9] border-[#E2DCCE]" : "bg-slate-900 border-slate-800"
            }`}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md shrink-0">
                  <Library className="w-5 h-5" />
                </div>
                <div>
                  <h2 className={`font-black text-base sm:text-lg ${!isKid && "text-white"}`}>Perpustakaan Daun Tualang</h2>
                  <p className="text-xs text-slate-400 font-medium">Klik pada subjek untuk mengeluarkan lembaran buku teks digital rasmi.</p>
                </div>
              </div>

              {/* Grid Folder Kabinet */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {Object.keys(booksBySubject).map((subjectName) => {
                  const isActive = activeLibrarySubject === subjectName;
                  return (
                    <button
                      key={subjectName}
                      onClick={() => setActiveLibrarySubject(isActive ? null : subjectName)}
                      className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left ${
                        isActive
                          ? isKid ? "bg-white border-amber-400 shadow-md" : "bg-slate-950 border-emerald-500 shadow-md"
                          : isKid ? "bg-white/80 border-[#E2DCCE] hover:border-amber-400" : "bg-slate-950/40 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <FolderOpen className={`w-5 h-5 shrink-0 ${isActive ? 'text-amber-600' : 'text-slate-400'}`} />
                        <div className="min-w-0">
                          <p className={`font-black text-xs sm:text-sm truncate ${!isKid && "text-slate-200"}`}>{subjectName}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{booksBySubject[subjectName].length} Naskah</p>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isActive ? "rotate-90 text-amber-600" : ""}`} />
                    </button>
                  );
                })}
              </div>

              {/* Paparan Dokumen Buku Di Bawah Laci */}
              <AnimatePresence>
                {activeLibrarySubject && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                    className={`mt-4 p-4 rounded-2xl border-2 grid grid-cols-1 sm:grid-cols-2 gap-3 ${
                      isKid ? "bg-white border-amber-200" : "bg-slate-950 border-slate-800"
                    }`}
                  >
                    {booksBySubject[activeLibrarySubject].map((book) => (
                      <a
                        key={book.id} href={book.file_url} target="_blank" rel="noopener noreferrer"
                        className={`flex items-center justify-between p-3.5 rounded-xl border transition-all group ${
                          isKid ? "bg-slate-50 hover:bg-amber-50/50 hover:border-amber-300 border-transparent" : "bg-slate-900 hover:bg-slate-800 border-transparent hover:border-slate-700"
                        }`}
                      >
                        <div className="min-w-0 pr-3">
                          <p className={`font-bold text-xs sm:text-sm truncate ${isKid ? "text-slate-800 group-hover:text-amber-900" : "text-slate-300 group-hover:text-white"}`}>{book.title}</p>
                          <span className="inline-block text-[9px] font-black uppercase tracking-wider text-slate-400 mt-1">{book.form_level || "Umum"}</span>
                        </div>
                        <span className={`text-[10px] font-black bg-white px-3 py-1.5 rounded-lg border text-slate-600 group-hover:scale-103 shadow-xs shrink-0 transition-transform ${!isKid && "bg-slate-800 border-slate-700 text-slate-300"}`}>
                          Buka PDF 📖
                        </span>
                      </a>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // =====================================================================
  // VIEW 2: MAP / PATHWAY BOARD (TAMPILAN STEPPING CHAPTERS ZIG-ZAG)
  // =====================================================================
  const subjectThemeColor = selectedSubject.color || "#10B981";
  const subjectBooks = textbooks.filter(b => b.subject_id === selectedSubject.id);

  return (
    <div className={`min-h-screen font-sans pb-20 pt-6 transition-colors duration-500 ${
      isKid ? "bg-gradient-to-b from-sky-50 via-[#F4FBF7] to-lime-50" : "bg-slate-950 text-slate-100"
    }`}>
      <div className="max-w-2xl mx-auto px-4 space-y-8">
        
        {/* TOP COMPASS NAVBAR BAR */}
        <div className={`flex items-center gap-4 p-4 rounded-[2rem] border transition-all shadow-sm ${
          isKid ? "bg-white border-emerald-100" : "bg-slate-900 border-slate-800"
        }`}>
          <button 
            onClick={() => setSelectedSubject(null)}
            className={`p-3 rounded-xl transition-transform active:scale-95 shrink-0 shadow-xs border ${
              isKid ? "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100" : "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900"
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-2xl shrink-0">{selectedSubject.icon || "🌿"}</span>
              <h1 className={`text-lg sm:text-xl font-black tracking-tight truncate ${!isKid && "text-white"}`}>
                {selectedSubject.name}
              </h1>
            </div>
            <p className="text-slate-400 text-[11px] font-semibold uppercase tracking-wide mt-0.5">
              Laluan Pendakian Gunung Kinabalu Ilmu ⛰️
            </p>
          </div>
        </div>

        {/* REKOD BUKU RUJUKAN PINTAS JIKA WUJUD */}
        {subjectBooks.length > 0 && (
          <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
            isKid ? "bg-amber-50/70 border-amber-200" : "bg-slate-900/40 border-slate-800"
          }`}>
            <div className="flex items-center gap-2">
              <span className="text-xl">📗</span>
              <p className={`text-xs font-black ${isKid ? "text-amber-900" : "text-slate-300"}`}>Buku Teks Rujukan Pantas Khas:</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {subjectBooks.map(book => (
                <a
                  key={book.id} href={book.file_url} target="_blank" rel="noopener noreferrer"
                  className={`text-[10px] font-black uppercase tracking-wider border px-3 py-1.5 rounded-xl shadow-xs transition-colors ${
                    isKid ? "bg-white text-amber-800 border-amber-200 hover:bg-amber-50" : "bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-900"
                  }`}
                >
                  Buka {book.form_level || "Manual"} ➜
                </a>
              ))}
            </div>
          </div>
        )}

        {/* PETA LALUAN BERLIAS DUOLINGO (ZIG-ZAG STEPPING PATHWAY) */}
        {filteredTopics.length === 0 ? (
          <Card className={`text-center py-16 rounded-[2.5rem] border max-w-sm mx-auto shadow-sm ${
            isKid ? "bg-white border-emerald-100" : "bg-slate-900 border-slate-800"
          }`}>
            <span className="text-5xl block mb-4 animate-bounce">🦧</span>
            <h3 className={`font-black text-base ${!isKid && "text-white"}`}>Misi Dalam Pembinaan!</h3>
            <p className="text-slate-400 text-xs font-medium max-w-xs mx-auto mt-2 px-6 leading-relaxed">
              Toko Otan sedang menyusun ranting-ranting kayu untuk bab ini. Sebentar ya, {studentFirstName}!
            </p>
          </Card>
        ) : (
          <div className="relative py-4 flex flex-col items-center">
            
            {/* Teras Batang Pokok / Tali Menjalar di Bahagian Tengah Belakang */}
            <div 
              className="absolute top-10 bottom-10 w-2 rounded-full z-0 pointer-events-none shadow-inner" 
              style={{ backgroundColor: `${subjectThemeColor}20` }}
            />

            <div className="w-full space-y-12 relative z-10">
              {filteredTopics.map((topic, i) => {
                // Formula matematik untuk hasilkan susunan melengkung zig-zag kiri/tengah/kanan (Duolingo Path Layout)
                const positionStyles = [
                  "sm:justify-start sm:pl-12",   // Kiri
                  "sm:justify-center",           // Tengah
                  "sm:justify-end sm:pr-12",     // Kanan
                  "sm:justify-center"            // Tengah
                ];
                const alignmentClass = positionStyles[i % 4];

                return (
                  <motion.div
                    key={topic.id}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 100, delay: i * 0.04 }}
                    className={`flex justify-center ${alignmentClass} w-full`}
                  >
                    <Link
                      to={`/study/${selectedSubject.id}/${topic.id}`}
                      className="group flex flex-col items-center text-center relative max-w-[240px]"
                    >
                      {/* STEPPING STONE NODE BUTTON */}
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 2 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-20 h-20 rounded-full border-[6px] flex flex-col items-center justify-center font-mono font-black text-lg shadow-lg relative bg-white transition-all border-b-[10px]"
                        style={{ 
                          borderColor: subjectThemeColor,
                          color: subjectThemeColor,
                          boxShadow: `0 10px 20px ${subjectThemeColor}20`
                        }}
                      >
                        {/* Hiasan Puncak Daun Kecil Di Atas Node */}
                        <Leaf className="w-3.5 h-3.5 absolute -top-3.5 text-emerald-500 fill-emerald-400 rotate-12 opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        <span className="text-xl group-hover:scale-110 transition-transform">{i + 1}</span>
                        
                        {/* Lencana Selesai / Kunci Kecil Terapung */}
                        <div className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded-full shadow-md border">
                          <Map className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                        </div>
                      </motion.div>

                      {/* PAPAN TEXT BANNER DI BAWAH NODE */}
                      <div className={`mt-3 px-4 py-2 rounded-2xl border shadow-xs group-hover:shadow-md transition-all max-w-[200px] ${
                        isKid ? "bg-white border-slate-100" : "bg-slate-900 border-slate-800"
                      }`}>
                        <h4 className={`text-xs font-black tracking-tight truncate w-full group-hover:text-emerald-500 transition-colors ${!isKid && "text-slate-200"}`}>
                          {topic.name}
                        </h4>
                        {topic.form_level && (
                          <span className="text-[9px] font-black uppercase tracking-wider opacity-60 mt-0.5 block truncate">
                            {topic.form_level}
                          </span>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
