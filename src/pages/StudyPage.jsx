import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useParams, Link } from "react-router-dom";
import { 
  ArrowLeft, ChevronRight, BookOpen, FolderOpen, Sparkles, 
  GraduationCap, Library, Swords, Star 
} from "lucide-react";
import { motion } from "framer-motion";

export default function StudyPage() {
  const { subjectId } = useParams();
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [filteredTopics, setFilteredTopics] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [textbooks, setTextbooks] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // State to track which subject's textbooks are being viewed in the library drawer
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

  // Group books by subject name for a simplified visual display
  const booksBySubject = textbooks.reduce((acc, book) => {
    if (!acc[book.subject_name]) acc[book.subject_name] = [];
    acc[book.subject_name].push(book);
    return acc;
  }, {});

  // Extract the student's first name, or fallback if not available
  const studentFirstName = user?.name ? user.name.split(" ")[0] : "Explorer";

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin" />
        <p className="text-sm font-bold text-slate-500 tracking-wide animate-pulse">Loading your learning adventure... 🚀</p>
      </div>
    );
  }

  // --- VIEW 1: MAIN DASHBOARD (SUBJECTS & SIMPLIFIED LIBRARY) ---
  if (!selectedSubject) {
    return (
      <div className="space-y-8 max-w-5xl mx-auto px-2 pb-12">
        
        {/* Deeply Personalized Greeting Header with Mascot */}
        <div className="bg-gradient-to-br from-amber-400/10 via-orange-400/5 to-amber-500/10 rounded-3xl p-6 sm:p-8 border-2 border-amber-100/50 relative overflow-hidden shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="relative z-10 flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-amber-600 font-bold text-xs uppercase tracking-wider bg-amber-400/15 px-3 py-1 rounded-full w-max mx-auto sm:mx-0 mb-3">
              <Sparkles className="w-3.5 h-3.5 fill-current" /> Personalized Learning Quest
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-slate-800">
              Ready to study, {studentFirstName}? ✨
            </h1>
            <p className="text-slate-500 text-sm mt-2 max-w-sm mx-auto sm:mx-0">
              Pick a mission below to tackle your goals for <span className="font-bold text-amber-600">{user?.education_level || user?.school_year || "your grade"}</span> today!
            </p>
            
            {(user?.education_level || user?.school_year) && (
              <div className="flex items-center justify-center sm:justify-start gap-2 bg-white px-4 py-2 rounded-2xl border-2 border-amber-100 shadow-sm mt-4 w-max mx-auto sm:mx-0">
                <GraduationCap className="w-5 h-5 text-amber-500" />
                <span className="text-xs font-bold text-slate-700">{user.education_level || user.school_year}</span>
              </div>
            )}
          </div>

          <div className="relative z-10 shrink-0 mt-8 sm:mt-0">
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-6 -left-4 sm:-left-8 bg-white text-[10px] font-black px-3 py-1.5 rounded-2xl border-2 border-orange-200 text-orange-600 shadow-md whitespace-nowrap uppercase tracking-wider z-20"
            >
              Let's Go! 📚
              <div className="absolute -bottom-1.5 right-4 transform border-4 border-transparent border-t-white" />
            </motion.div>

            <motion.div 
              animate={{ y: [0, -8, 0], rotate: [-2, 4, -2], scale: [1, 1.02, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="text-7xl sm:text-8xl filter drop-shadow-[0_12px_15px_rgba(245,158,11,0.25)]"
            >
              🦧
            </motion.div>
          </div>
          
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-amber-400/20 rounded-full blur-3xl" />
        </div>

        {/* Dynamic Cards Grid */}
        <div>
          <h2 className="text-lg font-heading font-black text-slate-700 mb-4 flex items-center gap-2">
            <span>Your Missions</span>
            <span className="h-1.5 w-10 bg-orange-400 rounded-full" />
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {subjects.map((sub, i) => {
              const themeColor = sub.color || "#F59E0B";
              return (
                <motion.button
                  key={sub.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 120, delay: i * 0.03 }}
                  whileHover={{ y: -6, scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleSelectSubject(sub)}
                  className="group relative p-5 rounded-2xl bg-white border-2 border-slate-100 hover:border-orange-200 transition-all text-center flex flex-col items-center justify-center shadow-sm hover:shadow-md"
                >
                  <div
                    className="w-16 h-16 rounded-2xl mb-3 flex items-center justify-center text-4xl shadow-inner transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                    style={{ backgroundColor: `${themeColor}15` }}
                  >
                    {sub.icon || "🗺️"}
                  </div>
                  <h3 className="font-heading font-bold text-sm sm:text-base text-slate-800 tracking-tight leading-snug">{sub.name}</h3>
                  <div className="mt-3 px-3 py-1 bg-slate-50 rounded-full text-[11px] font-bold text-slate-500 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                    Start Campaign ➜
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Simplified Library */}
        {textbooks.length > 0 && (
          <div className="bg-slate-50 rounded-3xl border-2 border-slate-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-sm">
                <Library className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-heading font-black text-slate-800 text-lg">Your Textbook Cabinets</h2>
                <p className="text-xs text-slate-500">Pick a subject to look inside your digital school books.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {Object.keys(booksBySubject).map((subjectName) => (
                <button
                  key={subjectName}
                  onClick={() => setActiveLibrarySubject(activeLibrarySubject === subjectName ? null : subjectName)}
                  className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left ${
                    activeLibrarySubject === subjectName 
                      ? "bg-orange-50 border-orange-200 shadow-sm" 
                      : "bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FolderOpen className={`w-5 h-5 shrink-0 ${activeLibrarySubject === subjectName ? 'text-orange-600' : 'text-amber-500'}`} />
                    <div className="min-w-0">
                      <p className="font-bold text-xs sm:text-sm text-slate-800 truncate">{subjectName}</p>
                      <p className="text-[11px] text-slate-400 font-medium">{booksBySubject[subjectName].length} Books inside</p>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${activeLibrarySubject === subjectName ? "rotate-90 text-orange-600" : ""}`} />
                </button>
              ))}
            </div>

            {activeLibrarySubject && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 bg-white rounded-2xl border-2 border-orange-100/70 grid grid-cols-1 sm:grid-cols-2 gap-2"
              >
                {booksBySubject[activeLibrarySubject].map((book) => (
                  <a
                    key={book.id}
                    href={book.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 hover:bg-orange-50/50 hover:text-orange-700 transition-colors group"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-bold text-xs text-slate-800 truncate group-hover:text-orange-700">{book.title}</p>
                      <p className="text-[10px] text-slate-400 font-semibold">{book.form_level || "General Level"}</p>
                    </div>
                    <span className="text-[11px] font-bold bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 group-hover:border-orange-200 group-hover:text-orange-600 shrink-0">
                      Open Book 📖
                    </span>
                  </a>
                ))}
              </motion.div>
            )}
          </div>
        )}
      </div>
    );
  }

  // --- VIEW 2: MISSION CAMPAIGN MAP (TOPICS) ---
  const subjectBooks = textbooks.filter(b => b.subject_id === selectedSubject.id);

  return (
    <div className="min-h-screen font-sans pb-24 bg-slate-50 -mx-4 px-4 sm:mx-0 sm:px-0">
      
      {/* 🚀 Mission Header */}
      <div className="bg-white border-b-2 border-slate-200 sticky top-0 z-40 shadow-sm -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="max-w-3xl mx-auto py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link 
              to="/study" 
              onClick={() => setSelectedSubject(null)}
              className="p-2.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors active:scale-95"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">{selectedSubject.icon || "🗺️"}</span>
                <h1 className="text-lg font-heading font-black text-slate-800 uppercase tracking-tight truncate max-w-[200px] sm:max-w-xs">
                  {selectedSubject.name}
                </h1>
              </div>
              <p className="text-slate-400 text-[11px] font-bold tracking-wider uppercase">
                Active Campaign
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-amber-100 border-2 border-amber-200 px-3 py-1.5 rounded-xl shrink-0">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span className="text-sm font-black text-amber-700">{filteredTopics.length} Stages</span>
          </div>
        </div>
      </div>

      {filteredTopics.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border-2 border-slate-100 max-w-md mx-auto mt-12">
          <span className="text-4xl block mb-3">🚧</span>
          <h3 className="font-heading font-black text-slate-800">Campaign Under Construction</h3>
          <p className="text-slate-400 text-xs max-w-xs mx-auto mt-1 px-4">
            Our educators are still mapping out this territory. Check back soon, {studentFirstName}!
          </p>
        </div>
      ) : (
        <>
          {/* 🦧 Mascot Encouragement Area */}
          <div className="max-w-3xl mx-auto pt-8 pb-4 relative z-10 flex flex-col items-center">
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="bg-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-2xl border-2 border-slate-200 text-slate-600 shadow-sm mb-3 text-center max-w-sm relative z-20 mx-4 sm:mx-0"
            >
              Welcome to the {selectedSubject.name} campaign! Read the briefing, then beat the challenge! 🍌
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-white" />
            </motion.div>
            
            <motion.div 
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="text-6xl sm:text-7xl drop-shadow-xl"
            >
              🦧
            </motion.div>

            {/* Quick Textbook Reference */}
            {subjectBooks.length > 0 && (
              <div className="mt-6 bg-amber-400/10 rounded-2xl border border-amber-400/20 p-3 flex flex-col sm:flex-row items-center gap-3 w-full max-w-md">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📕</span>
                  <p className="text-xs font-bold text-amber-800">Textbook Reference:</p>
                </div>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {subjectBooks.map(book => (
                    <a
                      key={book.id}
                      href={book.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-bold bg-white text-amber-800 border border-amber-200 px-2.5 py-1 rounded-lg hover:bg-amber-50 shadow-sm whitespace-nowrap"
                    >
                      {book.form_level || "View"} ➜
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 🗺️ The Path / Roadmap */}
          <div className="max-w-2xl mx-auto mt-8 space-y-6 relative px-2 sm:px-0">
            
            {/* Visual Line connecting the stages */}
            <div className="absolute left-[38px] sm:left-6 top-8 bottom-12 w-1.5 bg-slate-200 rounded-full z-0" />

            {filteredTopics.map((topic, index) => {
              // Since we don't have user progress from the DB yet, we set all to visually 'unlocked'
              // so students can click any chapter they want to study.
              const isUnlocked = true; 

              return (
                <div key={topic.id} className="relative z-10 flex gap-4 sm:gap-6 w-full">
                  
                  {/* Path Node Indicator */}
                  <div className="shrink-0 flex flex-col items-center mt-2 pl-2 sm:pl-0">
                    <div className="w-10 h-10 rounded-full border-4 flex items-center justify-center bg-white z-10 shadow-sm border-amber-500 text-amber-500 ring-4 ring-amber-100">
                      <span className="font-black text-sm">{index + 1}</span>
                    </div>
                  </div>

                  {/* Stage Card */}
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="flex-1 rounded-3xl border-2 p-4 sm:p-5 transition-all bg-white border-amber-300 shadow-md"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="min-w-0 pr-2">
                        <h3 className="font-heading font-black text-base sm:text-lg text-slate-800 truncate">
                          {topic.name}
                        </h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                          Stage {index + 1} {topic.form_level && `• ${topic.form_level}`}
                        </p>
                      </div>
                      <span className="flex h-3 w-3 relative shrink-0 mt-1">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                      </span>
                    </div>

                    {/* Two-Step Mission Actions */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                      
                      {/* Step 1: The Lesson */}
                      <Link 
                        to={`/study/${selectedSubject.id}/${topic.id}/lesson`}
                        className="flex items-center gap-3 p-3 rounded-2xl border-2 transition-all group bg-blue-50 border-blue-200 hover:bg-blue-100 hover:border-blue-300 cursor-pointer text-blue-700"
                      >
                        <div className="p-2 rounded-xl bg-blue-200/50 group-hover:scale-110 transition-transform">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <div className="text-left min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">Step 1</p>
                          <p className="font-black text-sm truncate">Briefing</p>
                        </div>
                      </Link>

                      {/* Step 2: The Quiz/Challenge */}
                      <Link 
                        to={`/study/${selectedSubject.id}/${topic.id}/quiz`}
                        className="flex items-center gap-3 p-3 rounded-2xl border-2 transition-all group bg-orange-50 border-orange-200 hover:bg-orange-100 hover:border-orange-300 cursor-pointer text-orange-700"
                      >
                        <div className="p-2 rounded-xl bg-orange-200/50 group-hover:scale-110 transition-transform">
                          <Swords className="w-5 h-5" />
                        </div>
                        <div className="text-left min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">Step 2</p>
                          <p className="font-black text-sm truncate">Challenge</p>
                        </div>
                      </Link>

                    </div>
                  </motion.div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}