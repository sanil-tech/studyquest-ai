// src/pages/StudyPage.jsx
import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useParams, Link } from "react-router-dom";
import { 
  ArrowLeft, ChevronRight, BookOpen, FolderOpen, 
  Map, Library, Leaf, TreePine, Sprout, Compass 
} from "lucide-react";
import { motion } from "framer-motion";

export default function StudyPage() {
  const { subjectId } = useParams();
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [textbooks, setTextbooks] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // State untuk laci kabinet buku teks
  const [activeLibrarySubject, setActiveLibrarySubject] = useState(null);

  useEffect(() => {
    const load = async () => {
      // PEMERKASAAN: Gunakan Promise.allSettled untuk API yang kebal ralat
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

  // Memoize filtered topics to avoid recalculation
  const filteredTopics = useMemo(() => {
    if (!topics || !user) {
      return topics || [];
    }
    const userLevel = user.education_level || user.school_year;
    if (!userLevel) {
      return topics;
    }
    
    // PEMERKASAAN: Penapisan kebal ralat huruf besar/kecil dan ruang kosong
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

  // Memoize grouped books to avoid recalculation on every render
  const booksBySubject = useMemo(() => {
    return textbooks.reduce((acc, book) => {
      if (!acc[book.subject_name]) acc[book.subject_name] = [];
      acc[book.subject_name].push(book);
      return acc;
    }, {});
  }, [textbooks]);

  const studentFirstName = user?.name ? user.name.split(" ")[0] : (user?.nickname || "Penjelajah");

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 bg-[#FAFAF7]">
        <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
          <Leaf className="w-12 h-12 text-emerald-500" />
        </motion.div>
        <p className="text-sm font-bold text-emerald-700/60 uppercase tracking-widest">Otan sedang sediakan peta...</p>
      </div>
    );
  }

  // =====================================================================
  // VIEW 1: MAIN DASHBOARD (PILIHAN SUBJEK & PERPUSTAKAAN)
  // =====================================================================
  if (!selectedSubject) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] font-sans pb-12 pt-6">
        <div className="space-y-8 max-w-5xl mx-auto px-4">
          
          {/* HEADER: Nature Explorer Theme */}
          <div className="relative bg-gradient-to-br from-emerald-600 to-green-700 rounded-[2rem] p-6 sm:p-10 border border-emerald-800/20 overflow-hidden shadow-lg">
            {/* Pantulan Cahaya Hutan */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1.5 text-lime-900 font-extrabold text-[10px] uppercase tracking-widest bg-lime-400 px-3 py-1 rounded-full w-max shadow-sm">
                  <Leaf className="w-3.5 h-3.5 fill-current" /> Peta Penjelajahan Ilmu
                </div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white drop-shadow-sm mt-2">
                  Sedia untuk teroka, {studentFirstName}? 🗺️
                </h1>
                <p className="text-emerald-50 font-medium text-sm sm:text-base mt-1 max-w-lg">
                  Pilih dahan subjek di bawah untuk capai matlamat <span className="font-bold text-lime-300">{user?.education_level || user?.school_year || "tahap anda"}</span> hari ini!
                </p>
              </div>
              
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-inner flex items-center justify-center text-5xl shrink-0 self-start">
                🦧 {/* Maskot Otan */}
              </div>
            </div>
          </div>

          {/* GRID SUBJEK */}
          <div>
            <h2 className="text-lg font-black text-stone-700 mb-4 flex items-center gap-2">
              <Compass className="w-5 h-5 text-emerald-600" />
              <span>Laluan Subjek</span>
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {subjects.map((sub, i) => {
                const themeColor = sub.color || "#10B981"; // Default Emerald
                return (
                  <motion.button
                    key={sub.id}
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 120, delay: i * 0.03 }}
                    whileHover={{ y: -6, scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={() => handleSelectSubject(sub)}
                    className="group relative p-5 rounded-[2rem] bg-white border border-emerald-100 hover:border-emerald-300 transition-all text-center flex flex-col items-center justify-center shadow-sm hover:shadow-md"
                  >
                    <div 
                      className="w-16 h-16 rounded-2xl mb-3 flex items-center justify-center text-4xl shadow-inner transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 border border-transparent"
                      style={{ backgroundColor: `${themeColor}15` }}
                    >
                      {sub.icon || "🌿"}
                    </div>
                    <h3 className="font-black text-sm sm:text-base text-stone-800 tracking-tight leading-snug">
                      {sub.name}
                    </h3>
                    <div className="mt-3 px-3 py-1 bg-[#F3EFE6] rounded-full text-[11px] font-bold text-stone-500 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      Teroka ➜
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* PERPUSTAKAAN (Library Cabinets) */}
          {textbooks.length > 0 && (
            <div className="bg-[#F3EFE6] rounded-[2rem] border border-[#E3D9C6] p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-amber-600 flex items-center justify-center text-white shadow-sm shrink-0">
                  <Library className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-black text-stone-800 text-lg">Perpustakaan Daun Tualang</h2>
                  <p className="text-xs sm:text-sm text-stone-500 font-medium">Buka folder subjek untuk membaca buku teks digital anda.</p>
                </div>
              </div>

              {/* Folder Susunan */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {Object.keys(booksBySubject).map((subjectName) => (
                  <button
                    key={subjectName}
                    onClick={() => setActiveLibrarySubject(activeLibrarySubject === subjectName ? null : subjectName)}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all text-left ${
                      activeLibrarySubject === subjectName 
                        ? "bg-amber-100/50 border-amber-300 shadow-sm" 
                        : "bg-white border-[#E3D9C6] hover:border-amber-300 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FolderOpen className={`w-5 h-5 shrink-0 ${activeLibrarySubject === subjectName ? 'text-amber-700' : 'text-stone-400'}`} />
                      <div className="min-w-0">
                        <p className="font-bold text-xs sm:text-sm text-stone-800 truncate">{subjectName}</p>
                        <p className="text-[11px] text-stone-500 font-medium">{booksBySubject[subjectName].length} Buku</p>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-stone-400 transition-transform ${activeLibrarySubject === subjectName ? "rotate-90 text-amber-700" : ""}`} />
                  </button>
                ))}
              </div>

              {/* Kandungan Folder Beranimasi */}
              {activeLibrarySubject && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-white rounded-2xl border border-amber-200/70 grid grid-cols-1 sm:grid-cols-2 gap-3"
                >
                  {booksBySubject[activeLibrarySubject].map((book) => (
                    <a
                      key={book.id}
                      href={book.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-xl bg-[#FAFAF7] border border-transparent hover:border-amber-200 hover:bg-amber-50/50 transition-colors group"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-bold text-xs sm:text-sm text-stone-800 truncate group-hover:text-amber-800">{book.title}</p>
                        <p className="text-[10px] text-stone-500 font-semibold">{book.form_level || "Umum"}</p>
                      </div>
                      <span className="text-[11px] font-bold bg-white px-3 py-1.5 rounded-lg border border-stone-200 text-stone-600 group-hover:border-amber-300 group-hover:text-amber-700 shrink-0 whitespace-nowrap">
                        Buku 📖
                      </span>
                    </a>
                  ))}
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // =====================================================================
  // VIEW 2: ROADMAP SELECTION (CHAPTERS)
  // =====================================================================
  const subjectThemeColor = selectedSubject.color || "#10B981";
  const subjectBooks = textbooks.filter(b => b.subject_id === selectedSubject.id);

  return (
    <div className="min-h-screen bg-[#FAFAF7] font-sans pb-12 pt-6">
      <div className="space-y-6 max-w-3xl mx-auto px-4">
        
        {/* Navigation Title Bar (Wooden Theme) */}
        <div className="flex items-center gap-4 bg-white p-4 rounded-[1.5rem] border border-emerald-100 shadow-sm">
          <button 
            onClick={() => setSelectedSubject(null)}
            className="p-3 rounded-xl bg-[#F3EFE6] text-stone-600 hover:bg-[#E3D9C6] transition-transform active:scale-95 shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{selectedSubject.icon || "🌿"}</span>
              <h1 className="text-xl sm:text-2xl font-black text-stone-800">
                {selectedSubject.name}
              </h1>
            </div>
            <p className="text-stone-500 text-xs font-medium">Pilih bab dari peta laluan di bawah untuk mulakan misi!</p>
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
            
            {/* Shortcut Buku Teks */}
            {subjectBooks.length > 0 && (
              <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📗</span>
                  <p className="text-sm font-bold text-amber-900">Perlukan rujukan buku teks?</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {subjectBooks.map(book => (
                    <a
                      key={book.id}
                      href={book.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-bold bg-white text-amber-800 border border-amber-300 px-3 py-1.5 rounded-lg hover:bg-amber-100 shadow-sm whitespace-nowrap"
                    >
                      Buka {book.form_level || "Buku"} ➜
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Peta Laluan (Roadmap List) */}
            <div className="space-y-3 relative">
              {/* Garis menjalar (Vine line) di belakang nombor */}
              <div className="absolute left-7 top-6 bottom-6 w-1 bg-emerald-200 rounded-full z-0 hidden sm:block" />

              <div className="flex items-center justify-between px-1 mb-2 relative z-10">
                <span className="text-xs font-black tracking-wider text-stone-400 uppercase">Peta Misi Bab</span>
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-bold">
                  {filteredTopics.length} Cabaran
                </span>
              </div>

              {filteredTopics.map((topic, i) => (
                <motion.div
                  key={topic.id}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ type: "spring", stiffness: 100, delay: i * 0.03 }}
                  className="relative z-10"
                >
                  <Link
                    to={`/study/${selectedSubject.id}/${topic.id}`}
                    className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-emerald-100 hover:border-emerald-400 transition-all group shadow-sm hover:shadow-md relative overflow-hidden"
                  >
                    {/* Left color accent block */}
                    <div 
                      className="absolute left-0 top-0 bottom-0 w-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ backgroundColor: subjectThemeColor }}
                    />

                    {/* Circle Node (Tree mark) */}
                    <div 
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full font-black text-sm sm:text-base flex items-center justify-center shrink-0 border-4 bg-white relative"
                      style={{ 
                        borderColor: `${subjectThemeColor}40`,
                        color: subjectThemeColor 
                      }}
                    >
                      {i + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm sm:text-base text-stone-800 tracking-tight truncate group-hover:text-emerald-700 transition-colors">
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
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}