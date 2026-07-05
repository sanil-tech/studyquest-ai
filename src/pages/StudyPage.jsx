import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useParams, Link } from "react-router-dom";
import { 
  ArrowLeft, BookOpen, Sparkles, 
  Star, Flame, Heart
} from "lucide-react"; 
import { motion } from "framer-motion";

// ============================================================================
// 🐵 MORRY AVATAR COMPONENT (INLINE)
// ============================================================================
const MorryAvatar = ({ message, isThinking = false, className = "", size = "text-6xl sm:text-7xl" }) => {
  const bobbingDuration = isThinking ? 0.8 : 2.5; 
  const bobbingDistance = isThinking ? -16 : -12;

  return (
    <div className={`flex flex-col items-center pointer-events-none drop-shadow-xl z-30 ${className}`}>
      {message && (
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="bg-white text-[11px] font-black px-3 py-1 rounded-full border-2 border-orange-200 text-orange-600 shadow-md mb-2 whitespace-nowrap uppercase tracking-wider relative"
        >
          {message}
          <div className="absolute -bottom-1.5 left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-white" />
        </motion.div>
      )}
      <motion.div
        animate={{
          y: [0, bobbingDistance, 0],
          rotate: isThinking ? [0, 10, -10, 0] : [-4, 4, -4],
          scale: [1, 1.05, 1]
        }}
        transition={{ duration: bobbingDuration, repeat: Infinity, ease: "easeInOut" }}
        className={`filter drop-shadow-[0_12px_10px_rgba(0,0,0,0.25)] ${size}`}
      >
        {"\uD83E\uA7A7"} {/* Emoji Orangutan */}
      </motion.div>
    </div>
  );
};

export default function StudyPage() {
  // =========================================================================
  // 🎯 STATE & LOGIK DATA SEBENAR
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

  // Grouping buku ikut subjek secara dinamik
  const booksBySubject = textbooks.reduce((acc, book) => {
    if (!book.subject_name) return acc;
    if (!acc[book.subject_name]) acc[book.subject_name] = [];
    acc[book.subject_name].push(book);
    return acc;
  }, {});

  const studentFirstName = user?.name ? user.name.split(" ")[0] : "Explorer";

  // Dynamic Zig-Zag Path
  const getZigZagClass = (index) => {
    const positions = [
      "translate-x-0",
      "translate-x-[40px] sm:translate-x-[60px]",
      "translate-x-[60px] sm:translate-x-[100px]",
      "translate-x-[40px] sm:translate-x-[60px]",
      "translate-x-0",
      "-translate-x-[40px] sm:-translate-x-[60px]",
      "-translate-x-[60px] sm:-translate-x-[100px]",
      "-translate-x-[40px] sm:-translate-x-[60px]"
    ];
    return positions[index % positions.length];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F9F2] flex flex-col items-center justify-center space-y-4">
        <MorryAvatar message="Morry tengah cari map..." isThinking={true} />
        <p className="text-lg font-extrabold text-green-600 tracking-wide mt-4">Loading Expedition... 🚀</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F9F2] font-sans text-slate-800 pb-32">
      
      {/* 🎯 HEADER DIKUT DATA SEBENAR USER */}
      <div className="sticky top-0 z-50 bg-white border-b-2 border-slate-200 shadow-sm px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xl sm:text-2xl font-black text-green-500 tracking-tight">StudyQuest</span>
          </div>
          <div className="flex items-center space-x-3 sm:space-x-6 font-bold text-slate-600 text-sm sm:text-base">
            {/* Streak Semasa */}
            <div className="flex items-center text-orange-500" title="Streak Hari">
              <Flame className="w-5 h-5 mr-1" /> {user?.streak ?? 0}
            </div>
            {/* Total XP */}
            <div className="flex items-center text-blue-500" title="Total XP">
              <Star className="w-5 h-5 mr-1" /> {user?.xp ?? 0}
            </div>
            {/* Nyawa / Hearts */}
            <div className="flex items-center text-red-500" title="Hearts / Nyawa">
              <Heart className="w-5 h-5 mr-1" /> {user?.hearts ?? 3}
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 pt-8">
        
        {/* --- VIEW 1: DASHBOARD --- */}
        {!selectedSubject ? (
          <>
            <div className="flex flex-col sm:flex-row items-center gap-6 mb-12 bg-white p-8 rounded-[2rem] border-2 border-b-8 border-slate-200">
              <MorryAvatar message="Jom pilih misi!" size="text-7xl sm:text-8xl" />
              <div className="text-center sm:text-left">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800">
                  Ready to Study, {studentFirstName}? 👋
                </h1>
                <p className="text-slate-500 mt-1 font-medium italic">
                  "Satu pengembaraan besar bermula dengan satu langkah kecil!"
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
              {subjects.map((sub) => (
                <motion.div
                  key={sub.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelectSubject(sub)}
                  className="bg-white rounded-3xl border-2 border-slate-200 border-b-[8px] p-6 cursor-pointer flex flex-col justify-between active:border-b-2 active:translate-y-2 transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shadow-inner bg-green-50">
                      {sub.icon || "🗺️"}
                    </div>
                    {/* XP Ganjaran Dinamik dari Database Subjek */}
                    <div className="bg-yellow-100 text-yellow-600 font-bold px-3 py-1 rounded-full text-xs">
                      +{sub.xp_reward || sub.xp || 50} XP
                    </div>
                  </div>
                  <h3 className="text-xl font-black mb-4">{sub.name} Mission</h3>
                  <button className="w-full bg-green-500 text-white font-black py-3 rounded-2xl uppercase tracking-wider border-b-4 border-green-700">
                    Start Mission
                  </button>
                </motion.div>
              ))}
            </div>

            {/* RESOURCE CHEST (LIBRARY YANG BERFUNGSI) */}
            {textbooks.length > 0 && (
              <div className="pt-8 border-t-4 border-dashed border-slate-200">
                <h2 className="font-black text-xl mb-6 flex items-center gap-2">📦 Resource Chest</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {Object.keys(booksBySubject).map((subjectName) => (
                    <button
                      key={subjectName}
                      onClick={() => setActiveLibrarySubject(activeLibrarySubject === subjectName ? null : subjectName)}
                      className={`p-4 rounded-2xl border-2 border-b-4 transition-all flex flex-col items-center gap-2 font-black ${
                        activeLibrarySubject === subjectName 
                          ? "bg-blue-50 border-blue-400 text-blue-700 translate-y-1 border-b-2" 
                          : "bg-white border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <span className="text-3xl">📚</span>
                      <span className="text-sm truncate w-full text-center">{subjectName}</span>
                    </button>
                  ))}
                </div>

                {/* Paparan Buku Sebenar Apabila Kategori Diklik */}
                {activeLibrarySubject && booksBySubject[activeLibrarySubject] && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-6 bg-white rounded-3xl border-2 border-slate-200 border-b-4"
                  >
                    <h3 className="font-black text-slate-700 mb-4 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-yellow-500" /> Books for {activeLibrarySubject}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {booksBySubject[activeLibrarySubject].map((book) => (
                        <div key={book.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                          <span className="text-xl">📖</span>
                          <span className="font-bold text-sm text-slate-700 truncate">{book.name || book.title || "Untitled Textbook"}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </>
        ) : (
          
          /* --- VIEW 2: MISSION MAP --- */
          <div className="relative">
            <div className="flex items-center justify-between mb-12">
              <button 
                onClick={() => setSelectedSubject(null)}
                className="bg-white border-2 border-slate-200 border-b-4 rounded-xl px-4 py-2 font-black text-slate-500 flex items-center gap-2 hover:bg-slate-50"
              >
                <ArrowLeft className="w-5 h-5" /> Back to Map
              </button>
              <h1 className="text-xl font-black uppercase text-green-600">{selectedSubject.name} Expedition</h1>
            </div>

            <div className="relative py-10 flex flex-col items-center">
              {/* Path Line */}
              <div className="absolute top-0 bottom-0 left-1/2 transform -translate-x-1/2 w-6 bg-slate-200 rounded-full z-0" />

              <div className="bg-yellow-400 text-yellow-900 font-black px-8 py-3 rounded-full border-b-[6px] border-yellow-600 mb-12 z-10">
                START
              </div>

              {filteredTopics.map((topic, index) => {
                const zigZagClass = getZigZagClass(index);
                const isFirst = index === 0;

                return (
                  <div key={topic.id} className={`relative z-10 w-full max-w-[280px] my-6 flex flex-col items-center ${zigZagClass}`}>
                    
                    {/* Morry on Active Node */}
                    {isFirst && (
                      <div className="absolute -top-24">
                        <MorryAvatar message="Laluan ini mencabar!" size="text-6xl" />
                      </div>
                    )}

                    <div className="bg-white px-4 py-2 rounded-2xl border-2 border-slate-200 shadow-sm mb-3 text-center w-full relative">
                      <p className="text-[10px] font-black text-slate-400 uppercase">Quest {index + 1}</p>
                      <p className="font-bold text-slate-800 truncate">{topic.name}</p>
                    </div>

                    <div className="w-20 h-20 rounded-full bg-green-500 border-b-8 border-green-700 flex items-center justify-center text-3xl shadow-lg">
                      ⭐
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Link 
                        to={`/study/${selectedSubject.id}/${topic.id}/lesson`}
                        className="bg-blue-500 text-white p-3 rounded-xl border-b-4 border-blue-700 active:border-b-0 active:translate-y-1"
                        title="Briefing"
                      >
                        <BookOpen className="w-6 h-6" />
                      </Link>
                      <Link 
                        to={`/study/${selectedSubject.id}/${topic.id}/quiz`}
                        className="bg-orange-500 text-white p-3 rounded-xl border-b-4 border-orange-700 active:border-b-0 active:translate-y-1"
                        title="Challenge"
                      >
                        {/* Gantikan Swords dengan emoji atau icon sedia ada jika lucide-react versi anda tiada Swords */}
                        <span className="text-xl px-0.5">⚔️</span>
                      </Link>
                    </div>
                  </div>
                );
              })}

              <div className="bg-orange-500 text-white font-black px-10 py-5 rounded-3xl border-b-8 border-orange-700 mt-12 text-xl z-10 shadow-2xl">
                🏆 FINAL BOSS
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}