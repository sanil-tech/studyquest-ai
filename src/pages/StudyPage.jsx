// src/pages/StudyPage.jsx
import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useParams, useSearchParams, Link, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, ChevronRight, BookOpen, FolderOpen, 
  Map, Library, Leaf, TreePine, Sprout, Compass,
  Sparkles, Play, Lock, CheckCircle2, Star, ShieldAlert
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ==========================================
// STUDYQUEST SUBJECT WORLDS METADATA
// ==========================================
const SUBJECT_WORLDS_CONFIG = {
  science: {
    worldName: "Discovery Jungle",
    mascot: "Bimo Orangutan",
    emoji: "🦧",
    color: "from-emerald-500 to-green-700",
    borderColor: "border-emerald-600",
    badgeBg: "bg-emerald-100 text-emerald-800",
    btnColor: "bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-700"
  },
  math: {
    worldName: "Number Island",
    mascot: "Suku Penyu",
    emoji: "🐢",
    color: "from-blue-500 to-indigo-700",
    borderColor: "border-blue-600",
    badgeBg: "bg-blue-100 text-blue-800",
    btnColor: "bg-blue-500 hover:bg-blue-600 text-white border-blue-700"
  },
  bm: {
    worldName: "Story Village",
    mascot: "Lila Enggang",
    emoji: "🦜",
    color: "from-amber-500 to-orange-700",
    borderColor: "border-amber-600",
    badgeBg: "bg-amber-100 text-amber-800",
    btnColor: "bg-amber-500 hover:bg-amber-600 text-white border-amber-700"
  },
  english: {
    worldName: "Adventure Bay",
    mascot: "Ollie Memerang",
    emoji: "🦦",
    color: "from-cyan-500 to-teal-700",
    borderColor: "border-cyan-600",
    badgeBg: "bg-cyan-100 text-cyan-800",
    btnColor: "bg-cyan-500 hover:bg-cyan-600 text-white border-cyan-700"
  },
  history: {
    worldName: "Time Valley",
    mascot: "Gajah",
    emoji: "🐘",
    color: "from-amber-700 to-stone-800",
    borderColor: "border-amber-800",
    badgeBg: "bg-amber-100 text-amber-900",
    btnColor: "bg-amber-700 hover:bg-amber-800 text-white border-amber-900"
  },
  art: {
    worldName: "Rainbow Garden",
    mascot: "Lumi Rama-Rama",
    emoji: "🦋",
    color: "from-pink-500 to-rose-700",
    borderColor: "border-pink-600",
    badgeBg: "bg-pink-100 text-pink-800",
    btnColor: "bg-pink-500 hover:bg-pink-600 text-white border-pink-700"
  },
  ict: {
    worldName: "Tech City",
    mascot: "Byte Robot",
    emoji: "🤖",
    color: "from-purple-500 to-violet-700",
    borderColor: "border-purple-600",
    badgeBg: "bg-purple-100 text-purple-800",
    btnColor: "bg-purple-500 hover:bg-purple-600 text-white border-purple-700"
  },
  default: {
    worldName: "Hutan Ilmu",
    mascot: "Otan",
    emoji: "🦧",
    color: "from-emerald-600 to-teal-700",
    borderColor: "border-emerald-700",
    badgeBg: "bg-emerald-100 text-emerald-800",
    btnColor: "bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-700"
  }
};

export default function StudyPage() {
  const { subjectId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const querySubject = searchParams.get("subject");

  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [textbooks, setTextbooks] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // State for digital library drawer
  const [activeLibrarySubject, setActiveLibrarySubject] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const results = await Promise.allSettled([
          base44.entities.Subject.list(),
          base44.entities.Textbook.list("-created_date", 50),
          base44.auth.me(),
        ]);

        const subs = results[0].status === "fulfilled" ? results[0].value : [];
        const books = results[1].status === "fulfilled" ? results[1].value : [];
        const currentUser = results[2].status === "fulfilled" ? results[2].value : null;

        // Resolve active student profile
        let studentUser = currentUser;
        if (currentUser?.app_role === "parent") {
          const activeChildId = localStorage.getItem("active_child_session") || localStorage.getItem("selected_child_id");
          if (activeChildId) {
            const cachedChildStr = localStorage.getItem("active_child");
            if (cachedChildStr) {
              try { studentUser = JSON.parse(cachedChildStr); } catch (e) {}
            }
            if (!studentUser || studentUser.id !== activeChildId) {
              try {
                const res = await base44.functions.invoke("fetchParentChildren");
                if (res.data?.success && Array.isArray(res.data?.children)) {
                  const child = res.data.children.find((c) => c.id === activeChildId);
                  if (child) studentUser = child;
                }
              } catch (e) {}
            }
          }
        }

        setSubjects(subs);
        setTextbooks(books);
        setUser(studentUser);

        // Determine active subject from URL param or query string
        const targetSubjectKey = subjectId || querySubject;
        if (targetSubjectKey) {
          const foundSubject = subs.find(s => 
            s.id === targetSubjectKey || 
            s.name.toLowerCase().includes(targetSubjectKey.toLowerCase())
          );

          if (foundSubject) {
            setSelectedSubject(foundSubject);
            const topicList = await base44.entities.Topic.filter({ subject_id: foundSubject.id });
            setTopics(topicList || []);
          }
        }
      } catch (err) {
        console.error("Ralat memuat turun peta pembelajaran:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [subjectId, querySubject]);

  // Filter topics based on student level
  const filteredTopics = useMemo(() => {
    if (!topics || !user) return topics || [];
    const userLevel = user.education_level || user.school_year || user.grade_year;
    if (!userLevel) return topics;
    
    const safeUserLevel = String(userLevel).trim().toLowerCase();
    return topics.filter(t => {
      if (!t.form_level) return true;
      if (t.form_level === "All Levels") return true;
      return String(t.form_level).trim().toLowerCase() === safeUserLevel;
    });
  }, [topics, user]);

  const handleSelectSubject = async (sub) => {
    setSelectedSubject(sub);
    setLoading(true);
    try {
      const topicList = await base44.entities.Topic.filter({ subject_id: sub.id });
      setTopics(topicList || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const booksBySubject = useMemo(() => {
    return textbooks.reduce((acc, book) => {
      const subjectName = book.subject_name || "Umum";
      if (!acc[subjectName]) acc[subjectName] = [];
      acc[subjectName].push(book);
      return acc;
    }, {});
  }, [textbooks]);

  const studentFirstName = user?.nickname || (user?.full_name ? user.full_name.split(" ")[0] : "Penjelajah");

  // Identify active world configuration
  const getWorldConfig = (subObj) => {
    if (!subObj) return SUBJECT_WORLDS_CONFIG.default;
    const key = (subObj.id || subObj.name || "").toLowerCase();
    for (const [wKey, wVal] of Object.entries(SUBJECT_WORLDS_CONFIG)) {
      if (key.includes(wKey)) return wVal;
    }
    return SUBJECT_WORLDS_CONFIG.default;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-[#F4F9F4]">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
          <Sparkles className="w-12 h-12 text-emerald-500" />
        </motion.div>
        <p className="mt-4 text-sm font-black text-emerald-800 tracking-wide">
          Otan sedang menyediakan Peta Pengembaraan...
        </p>
      </div>
    );
  }

  // =====================================================================
  // VIEW 1: SUBJECT WORLDS MAP
  // =====================================================================
  if (!selectedSubject) {
    return (
      <div className="min-h-screen bg-[#F4F9F4] font-sans pb-24 pt-6 text-stone-800">
        <div className="space-y-8 max-w-5xl mx-auto px-4">
          
          {/* BANNER HEADER */}
          <div className="relative bg-gradient-to-r from-emerald-600 via-green-600 to-teal-700 rounded-[2.5rem] p-6 sm:p-8 text-white shadow-xl border-b-8 border-green-800 overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="relative z-10 flex flex-col gap-2 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 bg-lime-400 text-green-950 font-black px-3 py-1 rounded-full text-xs uppercase tracking-wider shadow-sm self-center sm:self-start">
                <Compass className="w-4 h-4" /> Peta Penjelajahan Ilmu
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight drop-shadow-md">
                Sedia untuk teroka, {studentFirstName}?
              </h1>
              <p className="text-emerald-100 font-medium text-sm sm:text-base max-w-lg">
                Pilih Dunia Subjek di bawah untuk memulakan pengembaraan KSSR anda!
              </p>
            </div>
            
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/20 p-2 border-4 border-white/40 shadow-inner flex items-center justify-center text-5xl shrink-0">
              {user?.selected_avatar || user?.avatar_emoji || "🦧"}
            </div>
          </div>

          {/* SUBJECT WORLDS GRID */}
          <div>
            <h2 className="text-2xl font-black text-stone-800 mb-4 flex items-center gap-2">
              <TreePine className="w-7 h-7 text-emerald-600" />
              <span>Dunia Pembelajaran</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {subjects.map((sub, i) => {
                const config = getWorldConfig(sub);

                return (
                  <motion.div
                    key={sub.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ y: -6 }}
                    onClick={() => handleSelectSubject(sub)}
                    className={`bg-gradient-to-br ${config.color} rounded-3xl p-5 text-white shadow-lg border-b-8 border-black/20 flex flex-col justify-between relative overflow-hidden group cursor-pointer`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-4xl filter drop-shadow-md group-hover:scale-125 transition-transform duration-300">
                        {sub.icon || config.emoji}
                      </span>
                      <span className={`text-[11px] font-black uppercase px-2.5 py-1 rounded-full ${config.badgeBg} shadow-sm`}>
                        {config.worldName}
                      </span>
                    </div>

                    <div className="mt-6">
                      <h3 className="text-xl font-black drop-shadow-sm">{sub.name}</h3>
                      <p className="text-xs font-bold text-white/90 mt-0.5">
                        Maskot: {config.mascot}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-white/90">Buka Dunia</span>
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-stone-900 transition-colors">
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* DIGITAL TEXTBOOK LIBRARY */}
          {textbooks.length > 0 && (
            <div className="bg-white rounded-3xl border-4 border-stone-200 p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-md shrink-0 border-b-4 border-amber-700">
                  <Library className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-black text-stone-800 text-lg">Khazanah Buku Teks Digital</h2>
                  <p className="text-xs sm:text-sm text-stone-500 font-bold">Buka folder subjek untuk membaca rujukan rasmimu.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {Object.keys(booksBySubject).map((subjectName) => (
                  <button
                    key={subjectName}
                    onClick={() => setActiveLibrarySubject(activeLibrarySubject === subjectName ? null : subjectName)}
                    className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left font-extrabold text-xs sm:text-sm ${
                      activeLibrarySubject === subjectName 
                        ? "bg-amber-100 border-amber-400 text-amber-900 shadow-sm" 
                        : "bg-stone-50 border-stone-200 text-stone-700 hover:border-amber-300"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FolderOpen className={`w-5 h-5 shrink-0 ${activeLibrarySubject === subjectName ? 'text-amber-700' : 'text-stone-400'}`} />
                      <div className="min-w-0">
                        <p className="truncate">{subjectName}</p>
                        <p className="text-[10px] text-stone-400 font-bold">{booksBySubject[subjectName].length} Buku</p>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-stone-400 transition-transform ${activeLibrarySubject === subjectName ? "rotate-90 text-amber-700" : ""}`} />
                  </button>
                ))}
              </div>

              {/* DRAWER CONTENT */}
              {activeLibrarySubject && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-amber-50/60 rounded-2xl border-2 border-amber-200 grid grid-cols-1 sm:grid-cols-2 gap-3"
                >
                  {booksBySubject[activeLibrarySubject].map((book) => (
                    <a
                      key={book.id}
                      href={book.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-xl bg-white border-2 border-amber-200/80 hover:border-amber-400 transition-all group shadow-xs"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-extrabold text-xs sm:text-sm text-stone-800 truncate group-hover:text-amber-800">{book.title}</p>
                        <p className="text-[10px] text-stone-400 font-bold">{book.form_level || "Umum"}</p>
                      </div>
                      <span className="text-[11px] font-black bg-amber-100 text-amber-900 px-3 py-1.5 rounded-lg border border-amber-300 shrink-0 whitespace-nowrap">
                        Baca 📖
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
  // VIEW 2: CHAPTER ROADMAP SELECTION
  // =====================================================================
  const worldConfig = getWorldConfig(selectedSubject);
  const subjectBooks = textbooks.filter(b => b.subject_id === selectedSubject.id);

  return (
    <div className="min-h-screen bg-[#F4F9F4] font-sans pb-24 pt-6 text-stone-800">
      <div className="space-y-6 max-w-3xl mx-auto px-4">
        
        {/* HEADER BAR */}
        <div className="flex items-center gap-4 bg-white p-4 rounded-3xl border-4 border-stone-200 shadow-sm">
          <button 
            onClick={() => setSelectedSubject(null)}
            className="p-3 rounded-2xl bg-stone-100 text-stone-700 hover:bg-stone-200 transition-transform active:scale-95 shrink-0 border-b-2 border-stone-300"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${worldConfig.badgeBg}`}>
              {worldConfig.worldName}
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-stone-900 mt-0.5 flex items-center gap-2 truncate">
              <span>{selectedSubject.icon || worldConfig.emoji}</span>
              <span>{selectedSubject.name}</span>
            </h1>
          </div>
        </div>

        {/* MASCOT DIALOGUE BANNER */}
        <div className="bg-amber-50 rounded-3xl p-4 border-4 border-amber-200 flex items-center gap-4 shadow-sm">
          <span className="text-4xl filter drop-shadow-sm shrink-0">{worldConfig.emoji}</span>
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-amber-800">{worldConfig.mascot} kata:</p>
            <p className="text-xs sm:text-sm font-extrabold text-stone-700 mt-0.5">
              Pilih mana-mana bab dalam peta di bawah untuk memulakan misi pembelajaran!
            </p>
          </div>
        </div>

        {/* TOPIC CHAPTER ROADMAP */}
        {filteredTopics.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border-4 border-stone-200 max-w-md mx-auto shadow-sm p-6">
            <span className="text-5xl block mb-4">{user?.selected_avatar || user?.avatar_emoji || "🦧"}</span>
            <h3 className="font-black text-stone-800 text-lg">Misi Dalam Pembinaan!</h3>
            <p className="text-stone-500 text-xs sm:text-sm max-w-xs mx-auto mt-2 font-bold">
              Otan sedang bertungkus-lumus membina bab untuk laluan ini. Nantikan kemunculannya, {studentFirstName}!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* TEXTBOOK REFERENCE STRIP */}
            {subjectBooks.length > 0 && (
              <div className="bg-amber-100/80 rounded-2xl border-2 border-amber-300 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📗</span>
                  <p className="text-xs sm:text-sm font-black text-amber-950">Rujukan Buku Teks Digital:</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {subjectBooks.map(book => (
                    <a
                      key={book.id}
                      href={book.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-black bg-white text-amber-900 border-2 border-amber-300 px-3 py-1.5 rounded-xl hover:bg-amber-50 shadow-xs whitespace-nowrap"
                    >
                      Buka {book.form_level || "Buku"} 📖
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* STAGE PATH LIST */}
            <div className="space-y-4 relative">
              <div className="absolute left-7 top-6 bottom-6 w-1.5 bg-emerald-300/60 rounded-full z-0 hidden sm:block" />

              <div className="flex items-center justify-between px-1 mb-2 relative z-10">
                <span className="text-xs font-black tracking-wider text-stone-500 uppercase">Peta Misi Bab</span>
                <span className="text-xs bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-black border border-emerald-300">
                  {filteredTopics.length} Cabaran
                </span>
              </div>

              {filteredTopics.map((topic, i) => (
                <motion.div
                  key={topic.id}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ type: "spring", stiffness: 100, delay: i * 0.04 }}
                  className="relative z-10"
                >
                  <Link
                    to={`/study/${selectedSubject.id}/${topic.id}`}
                    className="flex items-center gap-4 p-4 bg-white rounded-3xl border-4 border-stone-200 hover:border-emerald-400 transition-all group shadow-sm hover:shadow-md relative overflow-hidden"
                  >
                    <div 
                      className="w-12 h-12 rounded-2xl font-black text-base flex items-center justify-center shrink-0 border-b-4 bg-emerald-100 text-emerald-800 border-emerald-400 relative shadow-inner"
                    >
                      {i + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-sm sm:text-base text-stone-800 tracking-tight truncate group-hover:text-emerald-700 transition-colors">
                        {topic.name}
                      </h3>
                      {topic.form_level && (
                        <span className="inline-block text-[10px] font-black bg-stone-100 text-stone-600 px-2.5 py-0.5 rounded-md mt-1 border border-stone-200">
                          {topic.form_level}
                        </span>
                      )}
                    </div>

                    <div className="px-4 py-2 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs shadow-md border-b-4 border-emerald-700 flex items-center gap-1 shrink-0 group-hover:scale-105 transition-transform">
                      <span>Mula</span>
                      <Play className="w-3.5 h-3.5 fill-current" />
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
