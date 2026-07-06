import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ChevronRight, BookOpen, FolderOpen, Sparkles, GraduationCap, Library } from "lucide-react";
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
        <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-sm font-bold text-slate-500 tracking-wide animate-pulse">Loading your learning adventure... 🚀</p>
      </div>
    );
  }

  // --- VIEW 1: MAIN DASHBOARD (SUBJECTS & SIMPLIFIED LIBRARY) ---
  if (!selectedSubject) {
    return (
      <div className="space-y-8 max-w-5xl mx-auto px-2 pb-12">
        
        {/* Deeply Personalized Greeting Header */}
        <div className="bg-gradient-to-br from-amber-400/10 via-pink-400/5 to-indigo-400/10 rounded-3xl p-6 border-2 border-slate-100 relative overflow-hidden shadow-sm">
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-1.5 text-amber-600 font-bold text-xs uppercase tracking-wider bg-amber-400/15 px-3 py-1 rounded-full w-max mb-3">
                <Sparkles className="w-3.5 h-3.5 fill-current" /> Personalized Learning Quest
              </div>
              <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-slate-800">
                Ready to study, {studentFirstName}? ✨
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                Pick a subject below to tackle your goals for <span className="font-bold text-indigo-600">{user?.education_level || user?.school_year || "your grade"}</span> today!
              </p>
            </div>
            {(user?.education_level || user?.school_year) && (
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border-2 border-slate-100 shadow-sm self-start sm:self-auto">
                <GraduationCap className="w-5 h-5 text-indigo-500" />
                <span className="text-xs font-bold text-slate-700">{user.education_level || user.school_year}</span>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Cards Grid */}
        <div>
          <h2 className="text-lg font-heading font-black text-slate-700 mb-4 flex items-center gap-2">
            <span>Your Subjects</span>
            <span className="h-1.5 w-10 bg-amber-400 rounded-full" />
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {subjects.map((sub, i) => {
              const themeColor = sub.color || "#6366F1";
              return (
                <motion.button
                  key={sub.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 120, delay: i * 0.03 }}
                  whileHover={{ y: -6, scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleSelectSubject(sub)}
                  className="group relative p-5 rounded-2xl bg-white border-2 border-slate-100 hover:border-slate-200 transition-all text-center flex flex-col items-center justify-center shadow-sm hover:shadow-md"
                >
                  <div
                    className="w-16 h-16 rounded-2xl mb-3 flex items-center justify-center text-4xl shadow-inner transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                    style={{ backgroundColor: `${themeColor}15` }}
                  >
                    {sub.icon || "📚"}
                  </div>
                  <h3 className="font-heading font-bold text-sm sm:text-base text-slate-800 tracking-tight leading-snug">{sub.name}</h3>
                  <div className="mt-3 px-3 py-1 bg-slate-50 rounded-full text-[11px] font-bold text-slate-500 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                    Let's Go ➜
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Simplified Library: Shows Subject Cabinets instead of a massive list */}
        {textbooks.length > 0 && (
          <div className="bg-slate-50 rounded-3xl border-2 border-slate-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center text-white shadow-sm">
                <Library className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-heading font-black text-slate-800 text-lg">Your Textbook Cabinets</h2>
                <p className="text-xs text-slate-500">Pick a subject to look inside your digital school books.</p>
              </div>
            </div>

            {/* Subject Folders Layout */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {Object.keys(booksBySubject).map((subjectName) => (
                <button
                  key={subjectName}
                  onClick={() => setActiveLibrarySubject(activeLibrarySubject === subjectName ? null : subjectName)}
                  className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left ${
                    activeLibrarySubject === subjectName 
                      ? "bg-indigo-50 border-indigo-200 shadow-sm" 
                      : "bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FolderOpen className={`w-5 h-5 shrink-0 ${activeLibrarySubject === subjectName ? 'text-indigo-600' : 'text-amber-500'}`} />
                    <div className="min-w-0">
                      <p className="font-bold text-xs sm:text-sm text-slate-800 truncate">{subjectName}</p>
                      <p className="text-[11px] text-slate-400 font-medium">{booksBySubject[subjectName].length} Books inside</p>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${activeLibrarySubject === subjectName ? "rotate-90 text-indigo-600" : ""}`} />
                </button>
              ))}
              </div>

            {/* Expanded Folder Contents */}
            {activeLibrarySubject && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 bg-white rounded-2xl border-2 border-indigo-100/70 grid grid-cols-1 sm:grid-cols-2 gap-2"
              >
                {booksBySubject[activeLibrarySubject].map((book) => (
                  <a
                    key={book.id}
                    href={book.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 hover:bg-indigo-50/50 hover:text-indigo-700 transition-colors group"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-bold text-xs text-slate-800 truncate group-hover:text-indigo-700">{book.title}</p>
                      <p className="text-[10px] text-slate-400 font-semibold">{book.form_level || "General Level"}</p>
                    </div>
                    <span className="text-[11px] font-bold bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 group-hover:border-indigo-200 group-hover:text-indigo-600 shrink-0">
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

  // --- VIEW 2: ROADMAP SELECTION (CHAPTERS) ---
  const subjectThemeColor = selectedSubject.color || "#6366F1";
  const subjectBooks = textbooks.filter(b => b.subject_id === selectedSubject.id);

  return (
    <div className="space-y-6 max-w-3xl mx-auto px-2 pb-12">
      {/* Navigation Title Bar */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border-2 border-slate-100 shadow-sm">
        <Link 
          to="/study" 
          className="p-2.5 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 transition-transform active:scale-95"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{selectedSubject.icon || "📚"}</span>
            <h1 className="text-xl font-heading font-black text-slate-800">
              {selectedSubject.name}
            </h1>
          </div>
          <p className="text-slate-400 text-xs font-medium">Hey {studentFirstName}, choose your chapter roadmap mission below!</p>
        </div>
      </div>

      {filteredTopics.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border-2 border-slate-100 max-w-md mx-auto">
          <span className="text-4xl block mb-3">🗺️</span>
          <h3 className="font-heading font-black text-slate-800">Quest Coming Soon!</h3>
          <p className="text-slate-400 text-xs max-w-xs mx-auto mt-1 px-4">
            Our educators are crafting amazing activities for this topic. Stay tuned, {studentFirstName}!
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Simplified Single Line Subject Book Shortcut if available */}
          {subjectBooks.length > 0 && (
            <div className="bg-amber-400/10 rounded-2xl border border-amber-400/20 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">📕</span>
                <p className="text-xs font-bold text-amber-800">Need the textbook reference for this subject?</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {subjectBooks.map(book => (
                  <a
                    key={book.id}
                    href={book.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-bold bg-white text-amber-800 border border-amber-200 px-3 py-1 rounded-lg hover:bg-amber-50 shadow-sm whitespace-nowrap"
                  >
                    {book.form_level || "View Book"} ➜
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Clean Roadmap Chapters List */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">Your Study Map</span>
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">{filteredTopics.length} Chapters</span>
            </div>

            {filteredTopics.map((topic, i) => (
              <motion.div
                key={topic.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: "spring", stiffness: 100, delay: i * 0.03 }}
              >
                <Link
                  to={`/study/${selectedSubject.id}/${topic.id}`}
                  className="flex items-center gap-4 p-4 bg-white rounded-2xl border-2 border-slate-100 hover:border-transparent transition-all group shadow-sm hover:shadow-md relative overflow-hidden"
                >
                  <div 
                    className="absolute left-0 top-0 bottom-0 w-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ backgroundColor: subjectThemeColor }}
                  />

                  {/* Level Progress Circle Badge */}
                  <div 
                    className="w-10 h-10 rounded-full font-heading font-black text-xs flex items-center justify-center shrink-0 border-2"
                    style={{ 
                      backgroundColor: `${subjectThemeColor}10`, 
                      borderColor: `${subjectThemeColor}20`,
                      color: subjectThemeColor 
                    }}
                  >
                    {i + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm sm:text-base text-slate-800 tracking-tight truncate">
                      {topic.name}
                    </h3>
                    {topic.form_level && (
                      <span className="inline-block text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md mt-1">
                        {topic.form_level}
                      </span>
                    )}
                  </div>

                  <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all transform group-hover:scale-105 shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}