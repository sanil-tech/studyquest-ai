import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useParams, Link } from "react-router-dom";
import { 
  ArrowLeft, ChevronRight, BookOpen, FolderOpen, 
  Sparkles, GraduationCap, Library, Star, Flame, Heart, Play
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

  // --- PLAYFUL LOADING STATE ---
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-sky-50 space-y-6">
        <motion.div 
          animate={{ y: [0, -30, 0], rotate: [0, 10, -10, 0] }} 
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="text-7xl"
        >
          🦉
        </motion.div>
        <div className="flex flex-col items-center space-y-2">
          <h2 className="text-2xl font-black text-sky-600 tracking-wide">
            Packing your backpack...
          </h2>
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                className="w-3 h-3 bg-amber-400 rounded-full"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --- VIEW 1: MAIN DASHBOARD (WORLD MAP SELECTION) ---
  if (!selectedSubject) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] font-sans selection:bg-amber-200">
        
        {/* Sticky Gamified Header */}
        <div className="sticky top-0 z-50 bg-white border-b-4 border-slate-200 p-4 shadow-sm">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center text-2xl border-2 border-sky-300">
                👦
              </div>
              <div>
                <h1 className="font-black text-slate-800 text-lg leading-tight">Level 8 {studentFirstName}</h1>
                <div className="flex items-center gap-1">
                  <div className="w-24 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="w-4/5 h-full bg-amber-400 rounded-full" />
                  </div>
                  <span className="text-xs font-bold text-slate-400">80%</span>
                </div>
              </div>
            </div>
            {/* Visual Gamification Stats */}
            <div className="flex items-center gap-3 sm:gap-6">
              <div className="flex items-center gap-1 text-orange-500 font-bold">
                <Flame className="w-5 h-5 fill-current" /> <span className="hidden sm:inline">12</span>
              </div>
              <div className="flex items-center gap-1 text-amber-400 font-bold">
                <span className="text-xl leading-none">🪙</span> <span className="hidden sm:inline">240</span>
              </div>
              <div className="flex items-center gap-1 text-pink-500 font-bold">
                <Heart className="w-5 h-5 fill-current" /> <span className="hidden sm:inline">5</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8 space-y-12 pb-24">
          
          {/* Welcome Banner */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-sky-400 to-indigo-500 rounded-[2rem] p-6 sm:p-8 text-white shadow-[0_8px_0_rgb(56,189,248,0.5)] relative overflow-hidden"
          >
            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
              <div>
                <h2 className="text-3xl sm:text-4xl font-black mb-2 flex items-center justify-center sm:justify-start gap-2">
                  <Star className="w-8 h-8 fill-amber-300 text-amber-300" />
                  Choose Your World!
                </h2>
                <p className="text-sky-100 font-bold text-lg">
                  Which adventure are we going on today?
                </p>
              </div>
              <div className="text-7xl">🗺️</div>
            </div>
            {/* Decorative background shapes */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white opacity-10 rounded-full translate-y-1/3 -translate-x-1/4" />
          </motion.div>

          {/* Subjects Grid (Game Levels) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {subjects.map((sub, i) => {
              const themeColor = sub.color || "#38BDF8"; // default sky blue
              return (
                <motion.button
                  key={sub.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", bounce: 0.5, delay: i * 0.1 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  whileTap={{ scale: 0.95, y: 2 }}
                  onClick={() => handleSelectSubject(sub)}
                  className="relative group bg-white rounded-3xl p-6 flex flex-col items-center justify-center border-4 border-slate-100 shadow-[0_6px_0_rgb(241,245,249)] hover:border-slate-200 hover:shadow-[0_6px_0_rgb(226,232,240)] transition-all"
                >
                  <div 
                    className="w-24 h-24 rounded-[1.5rem] mb-4 flex items-center justify-center text-5xl shadow-inner border-4 border-white/50"
                    style={{ backgroundColor: `${themeColor}20` }}
                  >
                    {sub.icon || "🏰"}
                  </div>
                  <h3 className="font-black text-xl text-slate-800 mb-1">{sub.name}</h3>
                  <div 
                    className="mt-3 w-full py-3 rounded-2xl font-bold text-white text-lg tracking-wide uppercase shadow-[0_4px_0_rgba(0,0,0,0.15)] active:shadow-none active:translate-y-1 transition-all"
                    style={{ backgroundColor: themeColor }}
                  >
                    Play
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Magic Backpack (Library) */}
          {textbooks.length > 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-[2rem] border-4 border-slate-100 shadow-[0_8px_0_rgb(241,245,249)] p-6 sm:p-8"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center text-3xl border-4 border-amber-200">
                  🎒
                </div>
                <div>
                  <h2 className="font-black text-2xl text-slate-800">Magic Backpack</h2>
                  <p className="text-slate-500 font-bold">Your special items and spellbooks!</p>
                </div>
              </div>

              <div className="space-y-4">
                {Object.keys(booksBySubject).map((subjectName) => (
                  <div key={subjectName} className="bg-slate-50 rounded-2xl border-2 border-slate-200 overflow-hidden">
                    <button
                      onClick={() => setActiveLibrarySubject(activeLibrarySubject === subjectName ? null : subjectName)}
                      className="w-full flex items-center justify-between p-4 hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <FolderOpen className={`w-6 h-6 ${activeLibrarySubject === subjectName ? 'text-sky-500' : 'text-amber-500'}`} />
                        <span className="font-black text-slate-700 text-lg">{subjectName}</span>
                        <span className="bg-sky-100 text-sky-600 font-bold text-xs px-2 py-1 rounded-lg">
                          {booksBySubject[subjectName].length} items
                        </span>
                      </div>
                      <ChevronRight className={`w-6 h-6 text-slate-400 transition-transform ${activeLibrarySubject === subjectName ? "rotate-90 text-sky-500" : ""}`} />
                    </button>
                    
                    {activeLibrarySubject === subjectName && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t-2 border-slate-100 pt-4"
                      >
                        {booksBySubject[activeLibrarySubject].map((book) => (
                          <a
                            key={book.id}
                            href={book.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-3 bg-white rounded-xl border-2 border-slate-200 hover:border-sky-400 hover:bg-sky-50 transition-all group"
                          >
                            <div className="flex items-center gap-2 min-w-0 pr-2">
                              <span className="text-xl">📜</span>
                              <div>
                                <p className="font-bold text-slate-700 truncate group-hover:text-sky-600">{book.title}</p>
                                <p className="text-[11px] text-slate-400 font-bold">{book.form_level || "Any Level"}</p>
                              </div>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-sky-500 group-hover:text-white transition-colors shrink-0">
                              <BookOpen className="w-4 h-4" />
                            </div>
                          </a>
                        ))}
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  // --- VIEW 2: ADVENTURE MAP (TOPICS/CHAPTERS) ---
  const subjectThemeColor = selectedSubject.color || "#38BDF8";
  const subjectBooks = textbooks.filter(b => b.subject_id === selectedSubject.id);

  return (
    <div className="min-h-screen bg-[#F7F9FC] font-sans pb-24 overflow-x-hidden">
      
      {/* Sticky Navigation Bar */}
      <div className="sticky top-0 z-50 bg-white border-b-4 border-slate-200 p-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4 max-w-4xl mx-auto w-full">
          <Link 
            to="/study" 
            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-90 transition-all text-slate-600 border-b-4 border-slate-300"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div className="flex items-center gap-3 flex-1">
            <span className="text-3xl bg-slate-100 w-12 h-12 flex items-center justify-center rounded-2xl border-2 border-slate-200">
              {selectedSubject.icon || "📚"}
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-800 uppercase tracking-tight">
                {selectedSubject.name} Map
              </h1>
              <p className="text-slate-400 font-bold text-sm">Progress: 0 / {filteredTopics.length} Missions</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 mt-8">
        
        {/* Textbook Shortcuts */}
        {subjectBooks.length > 0 && (
          <div className="bg-amber-100 border-4 border-amber-300 rounded-[2rem] p-4 mb-10 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-4xl">🗺️</span>
              <p className="font-black text-amber-800 text-sm sm:text-base leading-tight">Need your treasure map?<br/><span className="text-amber-600">Open your guides here!</span></p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {subjectBooks.map(book => (
                <a
                  key={book.id}
                  href={book.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-sm bg-white text-amber-700 border-b-4 border-amber-200 px-4 py-2 rounded-xl hover:bg-amber-50 active:translate-y-1 active:border-b-0 transition-all"
                >
                  {book.form_level || "View"} 📖
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredTopics.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-20 bg-white rounded-[3rem] border-4 border-slate-100 shadow-[0_8px_0_rgb(241,245,249)]">
            <motion.div 
              animate={{ y: [0, -15, 0] }} 
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-7xl mb-6"
            >
              🚧
            </motion.div>
            <h3 className="text-3xl font-black text-slate-800 mb-2">Under Construction!</h3>
            <p className="text-slate-500 font-bold max-w-xs text-lg">
              The builders are still creating this part of the map. Come back soon!
            </p>
          </div>
        ) : (
          /* The Vertical Adventure Path */
          <div className="relative py-10 flex flex-col items-center w-full">
            
            {/* The Background Winding Path Line */}
            <div className="absolute top-0 bottom-0 w-4 bg-slate-200 rounded-full left-1/2 -translate-x-1/2 z-0" />

            <div className="space-y-12 w-full">
              {filteredTopics.map((topic, i) => {
                const isEven = i % 2 === 0;
                // For visual gamification, make the first item "current" (bouncing), others accessible
                const isCurrent = i === 0; 
                const isBoss = i === filteredTopics.length - 1;

                return (
                  <div key={topic.id} className="relative z-10 w-full flex justify-center">
                    {/* Alternate left and right for winding effect */}
                    <motion.div 
                      className={`flex flex-col items-center ${isEven ? 'mr-32 sm:mr-48' : 'ml-32 sm:ml-48'}`}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: "spring", bounce: 0.6, delay: i * 0.15 }}
                    >
                      
                      {/* Topic Name Tooltip */}
                      <div className={`mb-3 bg-white px-4 py-2 rounded-2xl border-2 border-slate-200 shadow-sm relative ${isEven ? 'origin-bottom-right' : 'origin-bottom-left'}`}>
                        <h3 className="font-black text-slate-700 text-sm sm:text-base text-center max-w-[150px] sm:max-w-[200px] leading-tight">
                          {topic.name}
                        </h3>
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-b-2 border-r-2 border-slate-200 rotate-45" />
                      </div>

                      {/* Large Clickable Node Button */}
                      <Link to={`/study/${selectedSubject.id}/${topic.id}`} className="group relative block">
                        <motion.div
                          animate={isCurrent ? { y: [0, -8, 0] } : {}}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          className={`
                            w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center text-3xl sm:text-4xl border-[6px] shadow-[0_8px_0_rgba(0,0,0,0.15)]
                            ${isBoss 
                                ? 'bg-purple-500 border-purple-700 text-white' 
                                : 'bg-green-400 border-green-600 text-white'}
                          `}
                        >
                          {isBoss ? "👑" : (isCurrent ? "⭐" : "📖")}
                        </motion.div>
                        
                        {/* Gamification Badge (XP/Coins) */}
                        <div className="absolute -bottom-2 -right-4 bg-amber-400 text-amber-900 font-black text-xs px-3 py-1 rounded-full border-2 border-white shadow-sm flex items-center gap-1">
                          {isBoss ? '🎁 +50' : '🪙 +10'}
                        </div>
                      </Link>

                    </motion.div>
                  </div>
                );
              })}
            </div>
            
            {/* End of Path Trophy */}
            <div className="relative z-10 mt-16 w-full flex justify-center">
              <motion.div 
                animate={{ rotate: [0, -5, 5, -5, 5, 0] }}
                transition={{ repeat: Infinity, duration: 2, delay: 1 }}
                className="w-28 h-28 bg-amber-200 border-8 border-amber-400 rounded-full flex items-center justify-center text-6xl shadow-xl"
              >
                🏆
              </motion.div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}