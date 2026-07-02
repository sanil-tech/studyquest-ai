// src/pages/LessonPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Sparkles, Play, Loader2, Trophy, BookOpen, Layers, GitFork, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

import LessonProgress from "@/components/lesson/LessonProgress";
import LessonContent from "@/components/lesson/LessonContent";
import VoicePlayer from "@/components/lesson/VoicePlayer";
import Flashcards from "@/components/lesson/Flashcards";
import MindMap from "@/components/lesson/MindMap";

// ============================================================================
// 1. HIGH-EFFICIENCY MICRO-PROMPT REGISTRY (Disatukan di sini)
// ============================================================================
const BASE_SYSTEM_PROMPT = `You are an expert AI tutor for Malaysian school students. Strict compliance with KPM curriculum standards (KSSR for primary, KSSM for secondary) is required. Ensure all names, places, and examples reflect local Malaysian contexts (RM currency, local foods like nasi lemak, cultural festivals).`;

const FORMAT_CONSTRAINTS = {
  ms: "Tulis SELURUH kandungan dalam Bahasa Melayu sahaja. JANGAN gunakan perkataan Bahasa Inggeris.",
  en: "Write the ENTIRE content in English only."
};

const LESSON_PROMPT = (topic, subject, level, lang, studentNickname) => `
${BASE_SYSTEM_PROMPT}
${FORMAT_CONSTRAINTS[lang]}
Target: Malaysian ${level}. Subject: ${subject}. Topic: "${topic}".

CRITICAL TONE INSTRUCTION:
The student's personalized friendly nickname is "${studentNickname}". 
Your tone must be exceptionally warm, encouraging, cheerful, and affectionate—like a loving older sibling or a favorite supportive teacher. 
Do NOT sound robotic or dry. Use words of encouragement frequently (e.g., "Wah, hebatnya!", "Bijak!", "Jom kita teroka sama-sama!").
Address the student directly and personally by their nickname "${studentNickname}" naturally throughout the lesson, especially at the start of new concepts and during encouraging remarks.

Generate a concise, highly engaging lesson (700-1000 words max). Use short paragraphs (2-3 sentences max for easy mobile reading), clear subheadings (###), and bold key terms.
Incorporate 1-2 specialized info card markers directly in text: [REMEMBER]...[/REMEMBER] or [EXAMPLE]...[/EXAMPLE].
Return JSON schema matching: { "lesson_markdown": "string", "summary": "string", "keywords": ["string"] }
`;

const FLASHCARD_PROMPT = (summary, keywords, lang) => `
${BASE_SYSTEM_PROMPT}
${FORMAT_CONSTRAINTS[lang]}
Based on Summary: "${summary}" and Keywords: ${JSON.stringify(keywords)}, generate exactly 5 flashcards.
Return JSON schema matching: [{ "front": "string", "back": "string" }]
`;

const MINDMAP_PROMPT = (summary, keywords, lang) => `
${BASE_SYSTEM_PROMPT}
${FORMAT_CONSTRAINTS[lang]}
Based on Summary: "${summary}" and Keywords: ${JSON.stringify(keywords)}, create a mind map structure.
Return JSON schema matching: [{ "label": "string", "children": ["string"] }]
`;

const QUIZ_PROMPT = (summary, numQuestions, lang) => `
${BASE_SYSTEM_PROMPT}
${FORMAT_CONSTRAINTS[lang]}
Based on Summary: "${summary}", generate exactly ${numQuestions} multiple-choice questions. CRITICAL: Every explanation MUST be ultra-concise (maximum 40 words).
Return JSON schema matching: [{ "question": "string", "options": ["string"], "correct_answer": "string", "explanation": "string" }]
`;

// ============================================================================
// 2. DYNAMIC RESPONSIVE MAIN COMPONENT LAYER
// ============================================================================
export default function LessonPage() {
  const { subjectId, topicId } = useParams();
  const navigate = useNavigate();
  
  const [subject, setSubject] = useState(null);
  const [topic, setTopic] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [studentNickname, setStudentNickname] = useState(""); 
  const [loading, setLoading] = useState(true);
  
  // Logik Premium Status
  const [isPremium, setIsPremium] = useState(false);

  // Cache States
  const [explanation, setExplanation] = useState("");
  const [metaData, setMetaData] = useState({ summary: "", keywords: [] });
  const [flashcards, setFlashcards] = useState(null);
  const [mindMap, setMindMap] = useState(null);

  const [activeTab, setActiveTab] = useState("lesson"); 
  const [status, setStatus] = useState({ lesson: false, flashcards: false, mindmap: false, quiz: false });

  const studyStartRef = useRef(null);
  const sessionRef = useRef(null);

  useEffect(() => { sessionRef.current = sessionId; }, [sessionId]);

  const tentukanPanggilanMesra = (userObj, formLevel) => {
    const customNickname = userObj?.nickname || userObj?.profile?.nickname;
    if (customNickname?.trim()) return customNickname.trim();
    const namaPenuh = userObj?.name || userObj?.display_name || userObj?.profile?.name;
    if (namaPenuh?.trim()) {
      const namaPertama = namaPenuh.trim().split(" ")[0];
      if (namaPertama && !namaPertama.includes("@")) return namaPertama;
    }
    if (!formLevel) return "Kawan";
    const level = formLevel.toLowerCase();
    if (level.includes("tahun") || level.includes("standard") || level.includes("primary")) return "Bintang";
    return "Sahabat";
  };

  useEffect(() => {
    const initializeLesson = async () => {
      try {
        const [sub, top, user] = await Promise.all([
          base44.entities.Subject.get(subjectId),
          base44.entities.Topic.get(topicId),
          base44.auth.me(),
        ]);
        setSubject(sub);
        setTopic(top);
        setStudentNickname(tentukanPanggilanMesra(user, top?.form_level));
        
        // Semakan status Premium daripada database user
        setIsPremium(user?.is_premium || user?.profile?.is_premium || false);

        const cachedSessions = await base44.entities.StudySession.filter(
          { student_id: user.id, topic_id: topicId },
          "-created_date",
          1
        );

        if (cachedSessions.length > 0) {
          const session = cachedSessions[0];
          setSessionId(session.id);
          
          if (session.ai_explanation) {
            const parsed = JSON.parse(session.ai_explanation);
            setExplanation(parsed.lesson_markdown);
            setMetaData({ summary: parsed.summary || "", keywords: parsed.keywords || [] });
            
            if (session.flashcards_json) setFlashcards(JSON.parse(session.flashcards_json));
            if (session.mindmap_json) setMindMap(JSON.parse(session.mindmap_json));
          }
        }
      } catch (err) {
        console.error("Cache initialization failed", err);
      } finally {
        studyStartRef.current = Date.now();
        setLoading(false);
      }
    };
    initializeLesson();
  }, [subjectId, topicId]);

  const recordStudyTime = async () => {
    if (!sessionRef.current || !studyStartRef.current) return;
    const minutes = Math.max(1, Math.round((Date.now() - studyStartRef.current) / 60000));
    try { await base44.entities.StudySession.update(sessionRef.current, { duration_minutes: minutes }); } catch {}
  };

  useEffect(() => { return () => { recordStudyTime(); }; }, []);

  const getLanguageMode = () => subject?.name?.toLowerCase().includes("english") ? "en" : "ms";

  const getContextConfiguration = async () => {
    const textbooks = await base44.entities.Textbook.filter({ subject_id: subjectId });
    const matchingBook = textbooks.find(t => t.form_level === topic.form_level);
    if (matchingBook && (!matchingBook.file_size || matchingBook.file_size <= 10 * 1024 * 1024)) {
      return { urls: [matchingBook.file_url], useInternet: false };
    }
    return { urls: undefined, useInternet: true };
  };

  const generateCoreLesson = async () => {
    setStatus(p => ({ ...p, lesson: true }));
    try {
      const user = await base44.auth.me();
      const config = await getContextConfiguration();
      const lang = getLanguageMode();

      const response = await base44.integrations.Core.InvokeLLM({
        model: "gemini_3_flash", 
        add_context_from_internet: config.useInternet,
        file_urls: config.urls,
        prompt: LESSON_PROMPT(topic.name, subject.name, topic.form_level, lang, studentNickname),
        response_json_schema: {
          type: "object",
          properties: {
            lesson_markdown: { type: "string" },
            summary: { type: "string" },
            keywords: { type: "array", items: { type: "string" } }
          },
          required: ["lesson_markdown", "summary", "keywords"]
        }
      });

      const session = await base44.entities.StudySession.create({
        student_id: user.id,
        subject_id: subjectId,
        topic_id: topicId,
        topic_name: topic.name,
        subject_name: subject.name,
        ai_explanation: JSON.stringify(response),
        duration_minutes: 0,
      });

      setSessionId(session.id);
      setExplanation(response.lesson_markdown);
      setMetaData({ summary: response.summary, keywords: response.keywords });
      
      triggerBackgroundPrefetch(response.summary, response.keywords, lang, session.id);
    } catch (e) {
      console.error(e);
    } finally { setStatus(p => ({ ...p, lesson: false })); }
  };

  const triggerBackgroundPrefetch = async (summary, keywords, lang, targetSessionId) => {
    try {
      base44.integrations.Core.InvokeLLM({
        model: "gemini_3_flash",
        prompt: FLASHCARD_PROMPT(summary, keywords, lang),
      }).then(res => {
        if (res && Array.isArray(res)) {
          base44.entities.StudySession.update(targetSessionId, { flashcards_json: JSON.stringify(res) });
          setFlashcards(res);
        }
      });

      base44.integrations.Core.InvokeLLM({
        model: "gemini_3_flash",
        prompt: MINDMAP_PROMPT(summary, keywords, lang),
      }).then(res => {
        if (res && Array.isArray(res)) {
          base44.entities.StudySession.update(targetSessionId, { mindmap_json: JSON.stringify(res) });
          setMindMap(res);
        }
      });
    } catch (e) {}
  };

  const loadFlashcardsOnDemand = async () => {
    if (flashcards || status.flashcards) return;
    setStatus(p => ({ ...p, flashcards: true }));
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        model: "gemini_3_flash",
        prompt: FLASHCARD_PROMPT(metaData.summary, metaData.keywords, getLanguageMode()),
      });
      if (res && Array.isArray(res)) {
        await base44.entities.StudySession.update(sessionId, { flashcards_json: JSON.stringify(res) });
        setFlashcards(res);
      }
    } catch {} finally { setStatus(p => ({ ...p, flashcards: false })); }
  };

  const loadMindMapOnDemand = async () => {
    if (mindMap || status.mindmap) return;
    setStatus(p => ({ ...p, mindmap: true }));
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        model: "gemini_3_flash",
        prompt: MINDMAP_PROMPT(metaData.summary, metaData.keywords, getLanguageMode()),
      });
      if (res && Array.isArray(res)) {
        await base44.entities.StudySession.update(sessionId, { mindmap_json: JSON.stringify(res) });
        setMindMap(res);
      }
    } catch {} finally { setStatus(p => ({ ...p, mindmap: false })); }
  };

  const runQuizGeneration = async (numQ) => {
    setStatus(p => ({ ...p, quiz: true }));
    await recordStudyTime();
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        model: "gemini_3_flash",
        prompt: QUIZ_PROMPT(metaData.summary, numQ, getLanguageMode()),
      });
      if (res && Array.isArray(res)) {
        const quiz = await base44.entities.Quiz.create({
          session_id: sessionId,
          topic_name: topic.name,
          subject_name: subject?.name || "",
          questions_json: JSON.stringify(res),
          difficulty: numQ >= 20 ? "hard" : "medium",
          num_questions: res.length,
        });
        navigate(`/quiz/${quiz.id}`);
      }
    } catch {} finally { setStatus(p => ({ ...p, quiz: false })); }
  };

  const handlePremiumRedirect = () => {
    alert("Opps! Ciri eksklusif ini hanya untuk ahli Premium sahaja. Jom langgan premium sekarang untuk belajar tanpa had! 🚀");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-9 h-9 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-2 sm:px-4 py-4 max-w-md md:max-w-2xl lg:max-w-4xl mx-auto space-y-6 pb-24">
      
      {/* Top Header Row */}
      <div className="flex items-center gap-3 bg-muted/40 p-3 sm:p-4 rounded-2xl border border-border/50 shadow-sm">
        <Link to={`/study/${subjectId}`} className="p-2 bg-white rounded-xl shadow-sm hover:bg-slate-50 active:scale-95 transition-all">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-base sm:text-lg lg:text-xl font-heading font-bold truncate text-slate-900">{topic?.name}</h1>
          <p className="text-muted-foreground text-xs sm:text-sm truncate">{subject?.icon} {subject?.name} • {topic?.form_level}</p>
        </div>
      </div>

      {!explanation ? (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="text-center py-12 px-5 bg-white border border-border rounded-3xl shadow-sm max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-lg sm:text-xl font-heading font-bold mb-2">Hai {studentNickname}! Sedia untuk belajar? 🚀</h2>
          <p className="text-muted-foreground text-xs sm:text-sm mb-6 max-w-xs mx-auto">Siri nota padat KPM kini sedia dijana.</p>
          <Button onClick={generateCoreLesson} disabled={status.lesson} className="w-full h-12 rounded-xl text-sm font-semibold active:scale-95 transition-transform shadow-md shadow-primary/10">
            {status.lesson ? <><Loader2 className="w-4 h-4 animate-spin mr-2"/> Menjana Nota... </> : <><Sparkles className="w-4 h-4 mr-2"/> Mula Belajar</>}
          </Button>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          
          {/* Responsive Sticky Tabs */}
          <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md py-2.5 -mx-2 px-2 border-b border-border flex gap-2 overflow-x-auto md:overflow-x-visible no-scrollbar snap-x scroll-smooth md:grid md:grid-cols-3">
            <Button size="sm" variant={activeTab === "lesson" ? "default" : "outline"} onClick={() => setActiveTab("lesson")} className="rounded-xl shrink-0 md:w-full text-xs sm:text-sm gap-1.5 snap-center py-5"><BookOpen className="w-4 h-4"/> Nota</Button>
            <Button size="sm" variant={activeTab === "flashcards" ? "default" : "outline"} onClick={() => { setActiveTab("flashcards"); loadFlashcardsOnDemand(); }} className="rounded-xl shrink-0 md:w-full text-xs sm:text-sm gap-1.5 snap-center py-5"><Layers className="w-4 h-4"/> Kad Memori</Button>
            <Button size="sm" variant={activeTab === "mindmap" ? "default" : "outline"} onClick={() => { setActiveTab("mindmap"); loadMindMapOnDemand(); }} className="rounded-xl shrink-0 md:w-full text-xs sm:text-sm gap-1.5 snap-center py-5"><GitFork className="w-4 h-4"/> Peta Minda</Button>
          </div>

          {/* Dynamic Content Container */}
          {activeTab === "lesson" && (
            <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8 border border-border/60 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h2 className="font-heading font-bold text-base sm:text-lg text-primary flex items-center gap-2">📖 Nota Ringkas</h2>
                
                {/* 🔒 KUNCI AUDIO VOICE PLAYER */}
                {isPremium ? (
                  <VoicePlayer text={explanation} language={getLanguageMode() === "en" ? "en" : "ms"} />
                ) : (
                  <Button size="sm" variant="outline" onClick={handlePremiumRedirect} className="text-amber-600 border-amber-200 bg-amber-50/50 rounded-xl text-xs gap-1 py-4">
                    <Lock className="w-3.5 h-3.5 text-amber-500" /> Dengar Audio
                  </Button>
                )}
              </div>
              <div className="prose prose-sm sm:prose-base max-w-none text-slate-700 leading-relaxed sm:leading-loose">
                <LessonContent content={explanation} />
              </div>
            </div>
          )}

          {activeTab === "flashcards" && (
            <div className="min-h-[220px]">
              {status.flashcards ? (
                <div className="flex flex-col items-center justify-center py-12 text-sm text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mb-2 text-primary" /> Menyusun kad memori...</div>
              ) : <Flashcards flashcards={flashcards || []} />}
            </div>
          )}

          {activeTab === "mindmap" && (
            <div className="min-h-[220px] overflow-x-auto rounded-2xl bg-white border p-4 shadow-sm">
              {status.mindmap ? (
                <div className="flex flex-col items-center justify-center py-12 text-sm text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mb-2 text-primary" /> Melakar peta visual...</div>
              ) : mindMap ? <MindMap mindMap={{ central_topic: topic.name, branches: mindMap }} /> : null}
            </div>
          )}

          {/* Responsive Quiz Panel */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-4 sm:p-6 border border-emerald-100 shadow-sm">
            <h3 className="font-heading font-bold text-base sm:text-lg text-emerald-900 mb-1">Dah sedia untuk uji kefahaman, {studentNickname}? 🎯</h3>
            <p className="text-xs sm:text-sm text-emerald-700 mb-5">Jawab soalan penilaian ekspres yang dijana khas mengikut rumusan nota.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button onClick={() => runQuizGeneration(10)} disabled={status.quiz} size="lg" className="bg-emerald-600 hover:bg-emerald-700 h-12 text-xs sm:text-sm font-medium rounded-xl w-full shadow-sm active:scale-98 transition-transform">
                {status.quiz ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />} Kuiz (10 Soalan)
              </Button>
              <Button onClick={() => runQuizGeneration(20)} disabled={status.quiz} size="lg" className="bg-amber-600 hover:bg-amber-700 h-12 text-xs sm:text-sm font-medium rounded-xl w-full shadow-sm active:scale-98 transition-transform">
                {status.quiz ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trophy className="w-4 h-4 mr-2" />} Mod Peperiksaan (20 Soalan)
              </Button>
            </div>
          </div>

          {/* 🔒 KUNCI BUTANG BINA SEMULA NOTA */}
          {isPremium ? (
            <Button variant="ghost" size="sm" onClick={generateCoreLesson} disabled={status.lesson} className="w-full text-xs text-muted-foreground hover:bg-muted py-2.5 rounded-xl transition-colors">
              {status.lesson ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />} Penyusunan Kurang Sesuai? Bina Semula Nota
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={handlePremiumRedirect} className="w-full text-xs text-amber-600 bg-amber-50/30 hover:bg-amber-50 py-2.5 rounded-xl border border-dashed border-amber-200 transition-colors">
              <Lock className="w-3 h-3 mr-1 text-amber-500" /> Ciri Premium: Bina Semula Nota Baru
            </Button>
          )}
          
        </motion.div>
      )}
    </div>
  );
}