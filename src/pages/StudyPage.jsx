import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ChevronRight, BookOpen, FileText, Sparkles, GraduationCap } from "lucide-react";
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
      loading && setLoading(false);
    };
    load();
  }, [subjectId]);

  // Filter topics based on user's education level
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
          <div className="absolute inset-0 border-4 border-t-primary rounded-full animate-spin" />
        </div>
        <p className="text-sm font-medium text-muted-foreground animate-pulse">Assembling your study adventure...</p>
      </div>
    );
  }

  // --- VIEW 1: SUBJECT SELECTION ---
  if (!selectedSubject) {
    return (
      <div className="space-y-8 max-w-4xl mx-auto px-1">
        {/* Header Hero Section */}
        <div className="bg-gradient-to-r from-violet-500/10 via-primary/5 to-amber-500/10 rounded-3xl p-6 border border-primary/10 relative overflow-hidden shadow-sm">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/10 rounded-full blur-xl" />
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider bg-primary/10 px-3 py-1 rounded-full w-max mb-3">
                <Sparkles className="w-3.5 h-3.5" /> Let's Level Up Your Brain
              </div>
              <h1 className="text-3xl font-heading font-black tracking-tight text-slate-800">
                Hey {user?.name?.split(" ")[0] || "Explorer"}! 👋
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                What awesome subject are we conquering today? Pick a portal below.
              </p>
            </div>
            {user?.education_level && (
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-2xl border border-border/60 shadow-sm self-start md:self-auto">
                <GraduationCap className="w-5 h-5 text-primary" />
                <span className="text-xs font-semibold text-slate-700">{user.education_level} Target</span>
              </div>
            )}
          </div>
        </div>

        {/* Subjects Grid */}
        <div>
          <h2 className="text-lg font-heading font-bold text-slate-700 mb-4 flex items-center gap-2">
            <span>Core Subjects</span>
            <span className="h-1 w-12 bg-primary rounded-full inline-block" />
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {subjects.map((sub, i) => {
              const themeColor = sub.color || "#6366F1";
              return (
                <motion.button
                  key={sub.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 100, delay: i * 0.04 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelectSubject(sub)}
                  className="group relative p-6 rounded-2xl bg-white border border-slate-200/80 hover:border-transparent transition-all text-center flex flex-col items-center justify-center overflow-hidden shadow-sm"
                  style={{
                    "--hover-glow": `${themeColor}15`,
                  }}
                >
                  {/* Subtle hover background glow */}
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" 
                    style={{ backgroundColor: `${themeColor}08` }}
                  />
                  <div 
                    className="absolute -bottom-8 -right-8 w-24 h-24 rounded-full blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-300"
                    style={{ backgroundColor: themeColor }}
                  />

                  {/* Icon Container */}
                  <div
                    className="w-16 h-16 rounded-2xl mb-4 flex items-center justify-center text-3xl shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                    style={{ backgroundColor: `${themeColor}15` }}
                  >
                    {sub.icon || "📚"}
                  </div>
                  
                  <h3 className="font-heading font-bold text-sm text-slate-800 line-clamp-2">{sub.name}</h3>
                  
                  <span className="mt-3 text-[11px] font-bold tracking-wide text-primary uppercase opacity-0 group-hover:opacity-100 transition-all transform translate-y-1 group-hover:translate-y-0 flex items-center gap-1">
                    Start Learning <ChevronRight className="w-3 h-3" />
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Textbook Library Dashboard Section */}
        {textbooks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm relative overflow-hidden"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-rose-500" />
                </div>
                <div>
                  <h2 className="font-heading font-bold text-slate-800">Malaysian Textbook Vault 📖</h2>
                  <p className="text-xs text-muted-foreground">Quick, easy references directly synced to your official curriculum.</p>
                </div>
              </div>
              <span className="text-[11px] font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md self-start sm:self-auto">
                {textbooks.length} Available
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[340px] overflow-y-auto pr-1 subtle-scrollbar">
              {textbooks.map(book => (
                <a
                  key={book.id}
                  href={book.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-slate-50/60 hover:bg-white rounded-xl border border-transparent hover:border-rose-200 hover:shadow-sm transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center shrink-0 border border-rose-100 group-hover:scale-105 transition-transform">
                    <FileText className="w-5 h-5 text-rose-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-xs text-slate-800 truncate group-hover:text-rose-600 transition-colors">{book.title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] font-medium bg-slate-200/60 px-1.5 py-0.5 rounded text-slate-600">{book.subject_name}</span>
                      <span className="text-[10px] text-muted-foreground">{book.form_level}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    );
  }

  // --- VIEW 2: TOPICS SELECTION ---
  const subjectThemeColor = selectedSubject.color || "#6366F1";
  return (
    <div className="space-y-6 max-w-3xl mx-auto px-1">
      {/* Navigation Header */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <Link 
          to="/study" 
          className="p-2.5 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all hover:-translate-x-0.5 active:translate-x-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-2xl transition-transform duration-300 hover:scale-120">{selectedSubject.icon || "📚"}</span>
            <h1 className="text-xl font-heading font-black text-slate-800 truncate">
              {selectedSubject.name}
            </h1>
          </div>
          <p className="text-muted-foreground text-xs mt-0.5">Select a chapter roadmap element below to begin your quest</p>
        </div>
      </div>

      {filteredTopics.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-sm max-w-xl mx-auto">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">🗺️</div>
          <h3 className="font-heading font-bold text-slate-800">Uncharted Territory!</h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto mt-2 px-4">
            {topics.length === 0 
              ? "We are currently preparing study quests for this course. Check back soon!" 
              : `No custom missions found matching your level (${user?.education_level || "your level"}).`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Linked Textbooks Shortcut for selected subject */}
          {textbooks.filter(b => b.subject_id === selectedSubject.id).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-rose-500/5 to-orange-500/5 rounded-2xl border border-rose-500/10 p-4"
            >
              <div className="flex items-center gap-2 mb-2.5">
                <FileText className="w-4 h-4 text-rose-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-rose-600">Quick Reference Guides</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {textbooks.filter(b => b.subject_id === selectedSubject.id).map(book => (
                  <a
                    key={book.id}
                    href={book.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2.5 bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 hover:border-rose-200 hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-md bg-rose-50 flex items-center justify-center shrink-0">
                        <FileText className="w-3.5 h-3.5 text-rose-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-xs text-slate-800 truncate group-hover:text-rose-500 transition-colors">{book.title}</p>
                        <p className="text-[10px] text-muted-foreground">{book.form_level}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </a>
                ))}
              </div>
            </motion.div>
          )}

          {/* Topics Roadmap List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Study Roadmap</span>
              <span className="text-xs text-muted-foreground font-medium">{filteredTopics.length} chapters found</span>
            </div>

            {filteredTopics.map((topic, i) => (
              <motion.div
                key={topic.id}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: "spring", stiffness: 105, delay: i * 0.04 }}
              >
                <Link
                  to={`/study/${selectedSubject.id}/${topic.id}`}
                  className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-200 hover:border-transparent transition-all group shadow-sm hover:shadow-md relative overflow-hidden"
                >
                  {/* Dynamic side accent strip on card hover */}
                  <div 
                    className="absolute left-0 top-0 bottom-0 w-0 group-hover:w-1.5 transition-all duration-200"
                    style={{ backgroundColor: subjectThemeColor }}
                  />

                  {/* Icon Badge */}
                  <div 
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
                    style={{ backgroundColor: `${subjectThemeColor}10` }}
                  >
                    <BookOpen className="w-5 h-5 transition-colors" style={{ color: subjectThemeColor }} />
                  </div>

                  {/* Chapter Context details */}
                  <div className="flex-1 min-w-0 group-hover:translate-x-1 transition-transform duration-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Chapter {i + 1}</span>
                    <h3 className="font-bold text-sm md:text-base text-slate-800 tracking-tight leading-snug truncate mt-0.5">
                      {topic.name}
                    </h3>
                    {topic.form_level && (
                      <span className="inline-block text-[10px] font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full mt-1.5">
                        {topic.form_level}
                      </span>
                    )}
                  </div>

                  {/* Interactive Forward Marker */}
                  <div 
                    className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all transform group-hover:scale-105"
                    style={{ '--tw-hover-bg': subjectThemeColor }}
                  >
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
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