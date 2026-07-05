import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useParams, Link } from "react-router-dom";
import { 
  ArrowLeft, BookOpen, Sparkles, 
  Star, Flame, Heart, ChevronRight
} from "lucide-react"; 
import { motion } from "framer-motion";

// ============================================================================
// 🐵 MORRY AVATAR COMPONENT (PREMIUM & ORGANIC ANIMATION)
// ============================================================================
const MorryAvatar = ({ message, isThinking = false, className = "", size = "text-6xl sm:text-7xl" }) => {
  const bobbingDuration = isThinking ? 0.8 : 2.5; 
  const bobbingDistance = isThinking ? -12 : -8;

  return (
    <div className={`flex flex-col items-center pointer-events-none drop-shadow-xl z-30 ${className}`}>
      {message && (
        <motion.div
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="bg-white text-[11px] font-extrabold px-3 py-1.5 rounded-2xl border-2 border-orange-200 text-orange-600 shadow-sm mb-2 whitespace-nowrap uppercase tracking-wider relative"
        >
          {message}
          <div className="absolute -bottom-1.5 left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-white" />
        </motion.div>
      )}
      <motion.div
        animate={{
          y: [0, bobbingDistance, 0],
          rotate: isThinking ? [0, 8, -8, 0] : [-3, 3, -3],
          scale: [1, 1.03, 1]
        }}
        transition={{ duration: bobbingDuration, repeat: Infinity, ease: "easeInOut" }}
        className={`filter drop-shadow-[0_10px_8px_rgba(0,0,0,0.15)] ${size}`}
      >
        🦧
      </motion.div>
    </div>
  );
};

export default function StudyPage() {
  // =========================================================================
  // 🎯 STATE & LOGIK DATA
  // =========================================================================
  const { subjectId } = useParams();
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [filteredTopics, setFilteredTopics] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [textbooks, setTextbooks] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeLibrarySubject, setActiveLibrarySubject] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [subs, books, u] = await Promise.all([
          base44.entities.Subject.list(),
          base44.entities.Textbook.list("-created_date", 50),
          base44.auth.me(),
        ]);
        setSubjects(subs);
        setTextbooks(books);
        setUser(u);

        if (subjectId) {
          const sub = subs.find(s => s.id === subjectId);
          setSelectedSubject(sub);
          const t = await base44.entities.Topic.filter({ subject_id: subjectId });
          setTopics(t);
        }
      } catch (error) {
        console.error("Gagal memuatkan data pengembaraan:", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [subjectId]);

  useEffect(() => {
    if (!topics || !user) {
      setFilteredTopics(topics);
      return;
    }
    const userLevel = user.education_level || user.school_year;
    if (!userLevel) {
      setFilteredTopics(topics);
      return;
    }
    const filtered = topics.filter(t => {
      if (!t.form_level) return true;
      if (t.form_level === "All Levels") return true;
      return t.form_level === userLevel;
    });
    setFilteredTopics(filtered);
  }, [topics, user]);

  const handleSelectSubject = async (sub) => {
    setSelectedSubject(sub);
    setLoading(true);
    try {
      const t = await base44.entities.Topic.filter({ subject_id: sub.id });
      setTopics(t);
    } catch (error) {
      console.error("Gagal memuatkan topik:", error);
    } finally {
      setLoading(false);
    }
  };

  const booksBySubject = textbooks.reduce((acc, book) => {
    if (!book.subject_name) return acc;
    if (!acc[book.subject_name]) acc[book.subject_name] = [];
    acc[book.subject_name].push(book);
    return acc;
  }, {});

  const studentFirstName = user?.name ? user.name.split(" ")[0] : "Explorer";

  // Penyelarasan Posisi Zig-Zag (Lebih Smooth untuk Kad Kompak)
  const getZigZagClass = (index) => {
    const positions = [
      "translate-x-0",
      "translate-x-[30px] sm:translate-x-[50px]",
      "translate-x-[50px] sm:translate-x-[80px]",
      "translate-x-[30px] sm:translate-x-[50px]",
      "translate-x-0",
      "-translate-x-[30px] sm:-translate-x-[50px]",
      "-translate-x-[50px] sm:-translate-x-[80px]",
      "-translate-x-[30px] sm:-translate-x-[50px]"
    ];
    return positions[index % positions.length];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F9F2] flex flex-col items-center justify-center space-y-4">
        <MorryAvatar message="Morry tengah sedia map..." isThinking={true} />
        <p className="text-base font-black text-green-600 tracking-wide mt-4 uppercase">Loading Expedition... 🚀</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F9F2] font-sans text-slate-800 pb-32 selection:bg-green-200">
      
      {/* 🎯 HEADER STATUS BAR */}
      <div className="sticky top-0 z-50 bg-white border-b-4 border-slate-200 px-4 py-3 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <span className="text-xl sm:text-2xl font-black text-green-500 tracking-tight">StudyQuest</span>
          <div className="flex items-center space-x-4 font-black text-slate-600 text-sm sm:text-base">
            <div className="flex items-center text-orange-500 bg-orange-50 px-2.5 py-1 rounded-xl border border-orange-100" title="Streak Hari">
              <Flame className="w-5 h-5 mr-1 fill-current" /> {user?.streak ?? 0}
            </div>
            <div className="flex items-center text-blue-500 bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-100" title="Total XP">
              <Star className="w-5 h-5 mr-1 fill-current" /> {user?.xp ?? 0}
            </div>
            <div className="flex items-center text-red-500 bg-red-50 px-2.5 py-1 rounded-xl border border-red-100" title="Hearts / Nyawa">
              <Heart className="w-5 h-5 mr-1 fill-current" /> {user?.hearts ?? 3}
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 pt-8">
        
        {/* --- VIEW 1: DASHBOARD --- */}
        {!selectedSubject ? (
          <>
            <div className="flex flex-col sm:flex-row items-center gap-6 mb-10 bg-white p-6 sm:p-8 rounded-[2rem] border-2 border-b-[8px] border-slate-200">
              <MorryAvatar message="Jom mulakan misi!" size="text-7xl sm:text-8xl" />
              <div className="text-center sm:text-left">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
                  Ready to Study, {studentFirstName}? 👋
                </h1>
                <p className="text-slate-400 mt-1 font-bold text-sm sm:text-base italic">
                  "Setiap langkah kecil membina empayar ilmu yang besar."
                </p>
              </div>
            </div>

            <h2 className="font-black text-xl text-slate-700 mb-4 uppercase tracking-wider">🗺️ Select Your Mission</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
              {subjects.map((sub) => (
                <motion.div
                  key={sub.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleSelectSubject(sub)}
                  className="bg-white rounded-3xl border-2 border-slate-200 border-b-[8px] p-5 cursor-pointer flex flex-col justify-between hover:border-green-400 active:border-b-2 active:translate-y-[6px] transition-all duration-700"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-inner bg-slate-50 border border-slate-100">
                      {sub.icon || "🗺️"}
                    </div>
                    <div className="bg-yellow-100 text-yellow-700 font-extrabold px-3 py-1 rounded-xl text-xs uppercase tracking-wide border border-yellow-200">
                      +{sub.xp_reward || sub.xp || 50} XP
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800 mb-3">{sub.name}</h3>
                    <button className="w-full bg-green-500 text-white font-black py-3 rounded-2xl uppercase tracking-wider border-b-[4px] border-green-700 hover:bg-green-400 active:border-b-0 transition-all text-sm">
                      Start Expedition
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* RESOURCE CHEST */}
            {textbooks.length > 0 && (
              <div className="pt-8 border-t-4 border-dashed border-slate-200">
                <h2 className="font-black text-xl text-slate-700 mb-4 uppercase tracking-wider">📦 Resource Chest</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {Object.keys(booksBySubject).map((subjectName) => (
                    <button
                      key={subjectName}
                      onClick={() => setActiveLibrarySubject(activeLibrarySubject === subjectName ? null : subjectName)}
                      className={`p-4 rounded-2xl border-2 border-b-[4px] transition-all flex flex-col items-center gap-2 font-black text-sm ${
                        activeLibrarySubject === subjectName 
                          ? "bg-blue-50 border-blue-400 text-blue-700 translate-y-[2px] border-b-2" 
                          : "bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300 active:translate-y-[2px] active:border-b-2"
                      }`}
                    >
                      <span className="text-3xl">📚</span>
                      <span className="truncate w-full text-center text-slate-700">{subjectName}</span>
                    </button>
                  ))}
                </div>

                {activeLibrarySubject && booksBySubject[activeLibrarySubject] && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-5 bg-white rounded-3xl border-2 border-slate-200 border-b-[6px]"
                  >
                    <h3 className="font-black text-slate-700 mb-3 text-sm flex items-center gap-2 uppercase tracking-wide">
                      <Sparkles className="w-4 h-4 text-yellow-500 fill-current" /> References for {activeLibrarySubject}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {booksBySubject[activeLibrarySubject].map((book) => (
                        <div key={book.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2.5">
                          <span className="text-lg">📖</span>
                          <span className="font-bold text-xs text-slate-600 truncate">{book.name || book.title || "Untitled Textbook"}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </>
        ) : (
          
          /* --- VIEW 2: MISSION MAP (PREMIUM DIALED-IN DESIGN) --- */
          <div className="relative">
            <div className="flex items-center justify-between mb-16 bg-white p-4 rounded-2xl border-2 border-b-4 border-slate-200">
              <button 
                onClick={() => setSelectedSubject(null)}
                className="bg-white border-2 border-slate-200 border-b-[4px] rounded-xl px-3 py-1.5 font-black text-xs text-slate-500 flex items-center gap-1.5 hover:bg-slate-50 active:translate-y-[2px] active:border-b-2 transition-all uppercase"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <h1 className="text-base font-black uppercase text-green-600 tracking-wider">{selectedSubject.name} Expedition</h1>
            </div>

            <div className="relative py-6 flex flex-col items-center">
              {/* Vertical Path Line */}
              <div className="absolute top-0 bottom-0 left-1/2 transform -translate-x-1/2 w-4 bg-slate-200 rounded-full z-0" />

              <div className="bg-yellow-400 text-yellow-900 font-black px-6 py-2 rounded-full border-b-[4px] border-yellow-600 mb-14 z-10 text-xs tracking-widest shadow-md">
                STARTING POINT
              </div>

              {filteredTopics.map((topic, index) => {
                const zigZagClass = getZigZagClass(index);
                const isFirst = index === 0;

                return (
                  <div key={topic.id} className={`relative z-10 w-full max-w-[320px] my-6 flex flex-col items-center ${zigZagClass}`}>
                    
                    {/* Morry Float Indicator */}
                    {isFirst && (
                      <div className="absolute -top-[76px] left-1/2 transform -translate-x-1/2">
                        <MorryAvatar message="Sini dulu!" size="text-5xl" />
                      </div>
                    )}

                    {/* 🎯 UNIFIED MAP NODE (KAD 3D INTERAKTIF SEPENUHNYA) */}
                    <Link 
                      to={`/study/${selectedSubject.id}/${topic.id}/lesson`}
                      className={`group w-full bg-white p-4 rounded-2xl border-2 border-b-[6px] transition-all flex items-center gap-4 active:translate-y-[4px] active:border-b-2 shadow-sm ${
                        isFirst 
                          ? "border-green-500 hover:bg-green-50/20" 
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                      }`}
                    >
                      {/* Node Icon Circle */}
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-black flex-shrink-0 border-b-4 ${
                        isFirst 
                          ? "bg-green-500 text-white border-green-700" 
                          : "bg-slate-100 text-slate-400 border-slate-300"
                      }`}>
                        {isFirst ? <Star className="w-5 h-5 fill-current animate-pulse" /> : index + 1}
                      </div>

                      {/* Content Info */}
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Quest {index + 1}</p>
                        <p className="font-black text-sm text-slate-700 truncate group-hover:text-green-600 transition-colors">{topic.name}</p>
                        <span className="inline-flex items-center text-[10px] font-black text-blue-500 mt-0.5 uppercase tracking-wide gap-0.5">
                          <BookOpen className="w-3 h-3" /> Start Quest <ChevronRight className="w-3 h-3 transform group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </Link>

                  </div>
                );
              })}

              <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white font-black px-8 py-4 rounded-3xl border-b-[6px] border-red-700 mt-14 text-base z-10 shadow-xl tracking-wider uppercase flex items-center gap-2">
                👑 Final Challenge
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}