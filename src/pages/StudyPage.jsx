import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useParams, Link } from "react-router-dom";
import { 
  ArrowLeft, ChevronRight, BookOpen, FolderOpen, Sparkles, 
  GraduationCap, Library, Swords, Star, Flame, Heart
} from "lucide-react";
import { motion } from "framer-motion";

export default function StudyPage() {
  // =========================================================================
  // ⚠️ LOGIK ASAL - TIDAK DIUBAH SAMA SEKALI
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
      setLoading(false);
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
    const t = await base44.entities.Topic.filter({ subject_id: sub.id });
    setTopics(t);
    setLoading(false);
  };

  const booksBySubject = textbooks.reduce((acc, book) => {
    if (!acc[book.subject_name]) acc[book.subject_name] = [];
    acc[book.subject_name].push(book);
    return acc;
  }, {});

  const studentFirstName = user?.name ? user.name.split(" ")[0] : "Explorer";

  // =========================================================================
  // ✨ HELPER UI - UNTUK SUSUNAN ZIG-ZAG DUOLINGO
  // =========================================================================
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

  // =========================================================================
  // 🎮 PAPARAN UI BERMULA DI SINI
  // =========================================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F9F2] flex flex-col items-center justify-center space-y-4">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }} 
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="w-16 h-16 border-[6px] border-green-200 border-t-green-500 rounded-full" 
        />
        <p className="text-lg font-extrabold text-green-600 tracking-wide">Loading Mission... 🚀</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F9F2] font-sans text-slate-800 pb-32">
      
      {/* 🎯 GAMIFIED HEADER DUOLINGO STYLE */}
      <div className="sticky top-0 z-50 bg-white border-b-2 border-slate-200 shadow-sm px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xl sm:text-2xl font-black text-green-500 tracking-tight">StudyQuest</span>
          </div>
          <div className="flex items-center space-x-3 sm:space-x-6 font-bold text-slate-600 text-sm sm:text-base">
            <div className="flex items-center text-orange-500">
              <Flame className="w-5 h-5 mr-1 fill-orange-500" /> 5
            </div>
            <div className="flex items-center text-blue-500">
              <Star className="w-5 h-5 mr-1 fill-blue-500" /> 120
            </div>
            <div className="flex items-center text-red-500">
              <Heart className="w-5 h-5 mr-1 fill-red-500" /> 3
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 pt-8">
        
        {/* --- VIEW 1: MAIN DASHBOARD (MISSIONS) --- */}
        {!selectedSubject ? (
          <>
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="mb-8 text-center sm:text-left"
            >
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800">
                Good Evening, {studentFirstName} 👋
              </h1>
              <p className="text-slate-500 mt-1 font-medium">
                Ready for today's learning adventure? Complete challenges to gain XP and level up!
              </p>
            </motion.div>

            {/* MISSION CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
              {subjects.map((sub, i) => (
                <motion.div
                  key={sub.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1, type: "spring", stiffness: 200 }}
                  onClick={() => handleSelectSubject(sub)}
                  className="bg-white rounded-3xl border-2 border-slate-200 border-b-[8px] p-6 cursor-pointer flex flex-col justify-between hover:border-slate-300 hover:-translate-y-1 transition-all active:border-b-2 active:translate-y-2"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shadow-inner bg-green-100/50">
                      {sub.icon || "🗺️"}
                    </div>
                    <div className="bg-yellow-100 text-yellow-600 font-bold px-3 py-1 rounded-full text-sm flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-600" /> +50 XP
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-black mb-2 text-slate-800">{sub.name} Mission</h3>
                  
                  {/* DUMMY PROGRESS BAR */}
                  <div className="w-full bg-slate-100 rounded-full h-4 mb-3 overflow-hidden border border-slate-200">
                    <div className="bg-green-400 h-full rounded-full w-1/3" />
                  </div>
                  
                  <p className="text-slate-400 font-bold text-xs mb-6 uppercase tracking-wider">
                    Next: Level 3 Challenge
                  </p>

                  <button className="w-full bg-green-500 text-white font-black py-3 rounded-2xl uppercase tracking-wider border-b-4 border-green-700 shadow-sm">
                    Start Mission
                  </button>
                </motion.div>
              ))}
            </div>

            {/* RESOURCE CHEST (LIBRARY) */}
            {textbooks.length > 0 && (
              <div className="pt-8 border-t-4 border-dashed border-slate-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500 border-b-4 border-blue-700 flex items-center justify-center text-white text-2xl shadow-sm">
                    📦
                  </div>
                  <div>
                    <h2 className="font-black text-xl text-slate-800">Resource Chest</h2>
                    <p className="text-sm text-slate-500 font-medium">Unlock items to aid your quest!</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.keys(booksBySubject).map((subjectName) => (
                    <div key={subjectName} className="flex flex-col">
                      <button
                        onClick={() => setActiveLibrarySubject(activeLibrarySubject === subjectName ? null : subjectName)}
                        className={`p-4 rounded-2xl border-2 border-b-[6px] transition-all flex items-center justify-between font-black ${
                          activeLibrarySubject === subjectName 
                            ? "bg-blue-50 border-blue-300 text-blue-700 translate-y-1 border-b-2" 
                            : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 active:translate-y-1 active:border-b-2"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <FolderOpen className="w-6 h-6 text-blue-500" />
                          <span className="truncate">{subjectName}</span>
                        </div>
                        <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded-lg text-xs">
                          {booksBySubject[subjectName].length}
                        </span>
                      </button>

                      {/* ITEMS INSIDE CHEST */}
                      {activeLibrarySubject === subjectName && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-3 flex flex-col gap-2 pl-4 border-l-4 border-blue-100"
                        >
                          {booksBySubject[subjectName].map((book) => (
                            <a
                              key={book.id}
                              href={book.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-white border-2 border-slate-200 rounded-xl p-3 flex items-center justify-between hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                            >
                              <div className="min-w-0 pr-2">
                                <p className="font-bold text-sm text-slate-700 truncate group-hover:text-blue-700">{book.title}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase">{book.form_level || "General"}</p>
                              </div>
                              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xl group-hover:bg-blue-200">
                                📚
                              </div>
                            </a>
                          ))}
                        </motion.div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          
          /* --- VIEW 2: MISSION CAMPAIGN MAP (TOPICS AS ZIG-ZAG NODES) --- */
          <div className="relative">
            
            {/* BACK BUTTON & HEADER */}
            <div className="flex items-center justify-between mb-8">
              <button 
                onClick={() => setSelectedSubject(null)}
                className="bg-white border-2 border-slate-200 border-b-4 rounded-xl px-4 py-2 font-black text-slate-500 flex items-center gap-2 hover:bg-slate-50 active:border-b-2 active:translate-y-[2px]"
              >
                <ArrowLeft className="w-5 h-5" /> Back to Map
              </button>
              <div className="bg-amber-100 border-2 border-amber-300 text-amber-700 font-black px-4 py-2 rounded-xl flex items-center gap-2">
                <Star className="w-5 h-5 fill-amber-500" />
                {filteredTopics.length} Quests
              </div>
            </div>

            <div className="text-center mb-12">
              <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight flex items-center justify-center gap-3">
                <span className="text-4xl">{selectedSubject.icon || "🗺️"}</span>
                {selectedSubject.name} Expedition
              </h1>
              <p className="text-slate-500 font-bold mt-2">Follow the path and conquer each learning node!</p>
            </div>

            {filteredTopics.length === 0 ? (
              <div className="bg-white border-2 border-slate-200 border-b-8 rounded-3xl p-8 text-center max-w-md mx-auto">
                <div className="text-6xl mb-4">🚧</div>
                <h3 className="text-xl font-black text-slate-800">Map In Progress!</h3>
                <p className="text-slate-500 font-medium mt-2">Check back soon for new quests.</p>
              </div>
            ) : (
              
              /* SUPER MARIO / DUOLINGO PATH */
              <div className="relative py-10 flex flex-col items-center">
                
                {/* Central Path Line (Garisan Belakang) */}
                <div className="absolute top-0 bottom-0 left-1/2 transform -translate-x-1/2 w-6 bg-slate-200 rounded-full z-0" />

                {/* START NODE */}
                <div className="relative z-10 bg-yellow-400 text-yellow-900 font-black px-8 py-3 rounded-full border-b-[6px] border-yellow-600 mb-8 uppercase tracking-widest shadow-md">
                  Mission Start
                </div>

                {filteredTopics.map((topic, index) => {
                  const zigZagClass = getZigZagClass(index);
                  const isCurrent = index === 0; // Simulasi: Node pertama adalah aktif

                  return (
                    <div key={topic.id} className={`relative z-10 w-full max-w-[280px] my-6 flex flex-col items-center ${zigZagClass}`}>
                      
                      {/* TOOLTIP / NAMA CABARAN */}
                      <div className="bg-white px-4 py-2 rounded-2xl border-2 border-slate-200 shadow-sm mb-3 text-center w-full relative">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Challenge {index + 1}</p>
                        <p className="font-bold text-slate-800 truncate">{topic.name}</p>
                        {/* Segitiga kecil ke bawah */}
                        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-white" />
                      </div>

                      {/* MAIN NODE CIRCLE */}
                      <div className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl border-b-[8px] transition-all relative
                        ${isCurrent 
                          ? 'bg-blue-400 border-blue-600 ring-8 ring-blue-100 shadow-xl' 
                          : 'bg-green-500 border-green-700 shadow-md'}
                      `}>
                        {isCurrent ? '🚀' : '⭐'}

                        {/* Floating Crown/Indicator for active node */}
                        {isCurrent && (
                          <motion.div 
                            animate={{ y: [0, -10, 0] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="absolute -top-8 text-3xl drop-shadow-md"
                          >
                            👑
                          </motion.div>
                        )}
                      </div>

                      {/* ACTION BUTTONS (Briefing & Quiz) Dikekalkan dari logik asal */}
                      <div className="flex gap-2 mt-4 bg-white/80 p-2 rounded-2xl backdrop-blur-sm border-2 border-slate-100">
                        {/* Step 1: Lesson/Briefing */}
                        <Link 
                          to={`/study/${selectedSubject.id}/${topic.id}/lesson`}
                          className="bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold p-3 rounded-xl border-b-4 border-blue-300 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center group"
                          title="Read Briefing"
                        >
                          <BookOpen className="w-6 h-6 group-hover:scale-110 transition-transform" />
                        </Link>
                        
                        {/* Step 2: Quiz/Challenge */}
                        <Link 
                          to={`/study/${selectedSubject.id}/${topic.id}/quiz`}
                          className="bg-orange-100 hover:bg-orange-200 text-orange-700 font-bold p-3 rounded-xl border-b-4 border-orange-300 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center group"
                          title="Start Challenge"
                        >
                          <Swords className="w-6 h-6 group-hover:scale-110 transition-transform" />
                        </Link>
                      </div>

                    </div>
                  );
                })}

                {/* FINAL NODE */}
                <div className="relative z-10 bg-orange-500 text-white font-black px-8 py-4 rounded-3xl border-b-[8px] border-orange-700 mt-8 uppercase tracking-widest text-lg shadow-xl flex items-center gap-2">
                  🏆 Final Boss
                </div>

              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}