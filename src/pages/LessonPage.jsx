import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Sparkles, Play, Loader2, Trophy, BookOpen, Layers, GitFork, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

import LessonProgress from "@/components/lesson/LessonProgress";
import LessonContent from "@/components/lesson/LessonContent";
import VoicePlayer from "@/components/lesson/VoicePlayer";
import Flashcards from "@/components/lesson/Flashcards";
import MindMap from "@/components/lesson/MindMap";
import InteractiveActivity from "@/components/lesson/InteractiveActivity";

// ============================================================================
// 1. HIGH-EFFICIENCY MICRO-PROMPT REGISTRY
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
The student's personalized friendly nickname is "${studentNickname}". Address the student personally by this nickname occasionally to motivate them.
Generate a concise, highly engaging lesson (700-1000 words max). Use short paragraphs (2-3 sentences max for easy mobile reading), clear subheadings (###), and bold key terms.
Incorporate 1-2 specialized info card markers directly in text: [REMEMBER]...[/REMEMBER] or [EXAMPLE]...[/EXAMPLE].
Return JSON schema matching: { "lesson_markdown": "string", "summary": "string", "keywords": ["string"] }
`;

const FLASHCARD_PROMPT = (summary, keywords, lang) => `
${BASE_SYSTEM_PROMPT}
${FORMAT_CONSTRAINTS[lang]}
Based on this Lesson Summary: "${summary}" and Keywords: ${JSON.stringify(keywords)}, generate exactly 5 conceptual flashcards.
Return JSON schema matching: { "flashcards": [{ "front": "Question/Term + Emoji", "back": "Answer" }] }
`;

const MINDMAP_PROMPT = (summary, keywords, lang) => `
${BASE_SYSTEM_PROMPT}
${FORMAT_CONSTRAINTS[lang]}
Based on this Lesson Summary: "${summary}" and Keywords: ${JSON.stringify(keywords)}, construct a structural mind map.
Return JSON schema matching: { "mind_map": { "central_topic": "string", "branches": [{ "label": "string", "children": ["string"] }] } }
`;

const ACTIVITY_PROMPT = (summary, lang) => `
${BASE_SYSTEM_PROMPT}
${FORMAT_CONSTRAINTS[lang]}
Based on this Lesson Summary: "${summary}", create ONE interactive activity of type "matching", "fill_blank", or "true_false" containing 4 fun items.
Return JSON schema matching: { "activity": { "type": "matching"|"fill_blank"|"true_false", "title": "string", "items": [{ "sentence": "string", "answer": "string", "left": "string", "right": "string", "statement": "string", "is_true": boolean }] } }
`;

const QUIZ_PROMPT = (summary, numQuestions, lang) => `
${BASE_SYSTEM_PROMPT}
${FORMAT_CONSTRAINTS[lang]}
Based on this Lesson Summary: "${summary}", generate exactly ${numQuestions} multiple-choice questions. 
CRITICAL: Every explanation MUST be ultra-concise (maximum 40 words).
Return JSON schema matching: { "questions": [{ "question": "string", "options": ["string"], "correct_answer": "string", "explanation": "string" }] }
`;

// ============================================================================
// 2. MOBILE-OPTIMIZED MAIN COMPONENT LAYER
// ============================================================================
export default function LessonPage() {
  const { subjectId, topicId } = useParams();
  const navigate = useNavigate();
  
  const [subject, setSubject] = useState(null);
  const [topic, setTopic] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [studentNickname, setStudentNickname] = useState(""); 
  const [loading, setLoading] = useState(true);
  
  const [explanation, setExplanation] = useState("");
  const [metaData, setMetaData] = useState({ summary: "", keywords: [] });
  const [flashcards, setFlashcards] = useState(null);
  const [mindMap, setMindMap] = useState(null);
  const [activity, setActivity] = useState(null);

  const [activeTab, setActiveTab] = useState("lesson"); 
  const [status, setStatus] = useState({ lesson: false, flashcards: false, mindmap: false, activity: false, quiz: false });

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
    if (level.includes("tahun") || level.includes("standard") || level.includes("primary")) {
      return "Bintang";
    }
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

        const panggilanDinamik = tentukanPanggilanMesra(user, top?.form_level);
        setStudentNickname(panggilanDinamik);

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
            if (session.activity_json) setActivity(JSON.parse(session.activity_json));
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
      base44.integrations.Core.InvokeLLM({ model: "gemini_3_flash", prompt: FLASHCARD_PROMPT(summary, keywords, lang) })
        .then(res => { if (res?.flashcards) { base44.entities.StudySession.update(targetSessionId, { flashcards_json: JSON.stringify(res.flashcards) }); setFlashcards(res.flashcards); } });
      base44.integrations.Core.InvokeLLM({ model: "gemini_3_flash", prompt: MINDMAP_PROMPT(summary, keywords, lang) })
        .then(res => { if (res?.mind_map) { base44.entities.StudySession.update(targetSessionId, { mindmap_json: JSON.stringify(res.mind_map) }); setMindMap(res.mind_map); } });
    } catch (e) {}
  };

  const loadFlashcardsOnDemand = async () => {
    if (flashcards || status.flashcards) return;
    setStatus(p => ({ ...p, flashcards: true }));
    try {
      const res = await base44.integrations.Core.InvokeLLM({ model: "gemini_3_flash", prompt: FLASHCARD_PROMPT(metaData.summary, metaData.keywords, getLanguageMode()) });
      const data = res.flashcards || [];
      await base44.entities.StudySession.update(sessionId, { flashcards_json: JSON.stringify(data) });
      setFlashcards(data);
    } catch {} finally { setStatus(p => ({ ...p, flashcards: false })); }
  };

  const loadMindMapOnDemand = async () => {
    if (mindMap || status.mindmap) return;
    setStatus(p => ({ ...p, mindmap: true }));
    try {
      const res = await base44.integrations.Core.InvokeLLM({ model: "gemini_3_flash", prompt: MINDMAP_PROMPT(metaData.summary, metaData.keywords, getLanguageMode()) });
      const data = res.mind_map;
      await base44.entities.StudySession.update(sessionId, { mindmap_json: JSON.stringify(data) });
      setMindMap(data);
    } catch {} finally { setStatus(p => ({ ...p, mindmap: false })); }
  };

  const loadActivityOnDemand = async () => {
    if (activity || status.activity) return;
    setStatus(p => ({ ...p, activity: true }));
    try {
      const res = await base44.integrations.Core.InvokeLLM({ model: "gemini_3_flash", prompt: ACTIVITY_PROMPT(metaData.summary, getLanguageMode()) });
      const data = res.activity;
      await base44.entities.StudySession.update(sessionId, { activity_json: JSON.stringify(data) });
      setActivity(data);
    } catch {} finally { setStatus(p => ({ ...p, activity: false })); }
  };

  const runQuizGeneration = async (numQ) => {
    setStatus(p => ({ ...p, quiz: true }));
    await recordStudyTime();
    try {
      const res = await base44.integrations.Core.InvokeLLM({ model: "gemini_3_flash", prompt: QUIZ_PROMPT(metaData.summary, numQ, getLanguageMode()) });
      const quiz = await base44.entities.Quiz.create({ session_id: sessionId, topic_name: topic.name, subject_name: subject?.name || "", questions_json: JSON.stringify(res.questions), difficulty: numQ >= 20 ? "hard" : "medium", num_questions: res.questions.length });
      navigate(`/quiz/${quiz.id}`);
    } catch {} finally { setStatus(p => ({ ...p, quiz: false })); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-1 py-4 max-w-md mx-auto space-y-5 pb-24">
      {/* Header Padat - Jimat Ruang Telefon */}
      <div className="flex items-center gap-2.5 bg-muted/40 p-3 rounded-xl">
        <Link to={`/study/${subjectId}`} className="p-2 bg-white rounded-lg shadow-sm active:scale-95 transition-transform">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-heading font-bold truncate">{topic?.name}</h1>
          <p className="text-muted-foreground text-xs truncate">{subject?.icon} {subject?.name} • {topic?.form_level}</p>
        </div>
      </div>

      {!explanation ? (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="text-center py-10 px-4 bg-white border border-border rounded-2xl shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-lg font-heading font-bold mb-1.5">Hai {studentNickname}! Sedia untuk belajar? 🚀</h2>
          <p className="text-muted-foreground text-xs mb-5 max-w-xs mx-auto">Nota ringkas & padat yang dioptimumkan khas untuk skrin telefon anda.</p>
          <Button onClick={generateCoreLesson} disabled={status.lesson} className="w-full h-11 rounded-xl text-sm font-semibold active:scale-95 transition-transform">
            {status.lesson ? <><Loader2 className="w-4 h-4 animate-spin mr-2"/> Menyusun Nota... </> : <><Sparkles className="w-4 h-4 mr-2"/> Mula Belajar Sekarang</>}
          </Button>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          
          {/* 📱 OPTIMASI MOBILE: Sticky Navigation Tab Bar */}
          <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md py-2 -mx-1 px-1 border-b border-border flex gap-1.5 overflow-x-auto no-scrollbar snap-x scroll-smooth">
            <Button size="sm" variant={activeTab === "lesson" ? "default" : "outline"} onClick={() => setActiveTab("lesson")} className="rounded-xl shrink-0 text-xs gap-1 snap-center"><BookOpen className="w-3.5 h-3.5"/> Nota</Button>
            <Button size="sm" variant={activeTab === "flashcards" ? "default" : "outline"} onClick={() => { setActiveTab("flashcards"); loadFlashcardsOnDemand(); }} className="rounded-xl shrink-0 text-xs gap-1 snap-center"><Layers className="w-3.5 h-3.5"/> Kad Memori</Button>
            <Button size="sm" variant={activeTab === "mindmap" ? "default" : "outline"} onClick={() => { setActiveTab("mindmap"); loadMindMapOnDemand(); }} className="rounded-xl shrink-0 text-xs gap-1 snap-center"><GitFork className="w-3.5 h-3.5"/> Peta Minda</Button>
            <Button size="sm" variant={activeTab === "activity" ? "default" : "outline"} onClick={() => { setActiveTab("activity"); loadActivityOnDemand(); }} className="rounded-xl shrink-0 text-xs gap-1 snap-center"><Gamepad2 className="w-3.5 h-3.5"/> Game</Button>
          </div>

          {/* Window Bekas Kandungan - Tulisan Lebih Selesa Dibaca Pada Mobile */}
          {activeTab === "lesson" && (
            <div className="bg-white rounded-2xl p-4 border border-border/60 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <h2 className="font-heading font-bold text-sm text-primary flex items-center gap-1.5">📖 Nota Kompak</h2>
                <VoicePlayer text={explanation} language={getLanguageMode() === "en" ? "en" : "ms"} />
              </div>
              <div className="prose prose-sm max-w-none text-sm leading-relaxed text-slate-700">
                <LessonContent content={explanation} />
              </div>
            </div>
          )}

          {activeTab === "flashcards" && (
            <div className="min-h-[200px]">
              {status.flashcards ? (
                <div className="flex flex-col items-center justify-center py-10 text-xs text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mb-1.5 text-primary" /> Menyusun kad memori pantas...</div>
              ) : <Flashcards flashcards={flashcards || []} />}
            </div>
          )}

          {activeTab === "mindmap" && (
            <div className="min-h-[200px] overflow-x-auto rounded-2xl bg-white border p-3">
              {status.mindmap ? (
                <div className="flex flex-col items-center justify-center py-10 text-xs text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mb-1.5 text-primary" /> Melakar peta ringkas...</div>
              ) : mindMap ? <MindMap mindMap={mindMap} /> : null}
            </div>
          )}

          {activeTab === "activity" && (
            <div className="min-h-[200px]">
              {status.activity ? (
                <div className="flex flex-col items-center justify-center py-10 text-xs text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mb-1.5 text-primary" /> Menyediakan permainan...</div>
              ) : activity ? <InteractiveActivity activity={activity} /> : null}
            </div>
          )}

          {/* 📱 OPTIMASI MOBILE: Susunan Kuiz Vertikal (Selesa Tekan Dengan Ibu Jari) */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-4 border border-emerald-100 shadow-sm">
            <h3 className="font-heading font-bold text-sm text-emerald-900 mb-1">Dah sedia untuk uji kefahaman, {studentNickname}? 🎯</h3>
            <p className="text-xs text-emerald-700 mb-4.5">Jawab soalan ekspres tanpa bebanan token yang berat.</p>
            <div className="flex flex-col gap-2">
              <Button onClick={() => runQuizGeneration(10)} disabled={status.quiz} size="lg" className="bg-emerald-600 hover:bg-emerald-700 h-11 text-xs rounded-xl w-full active:scale-98 transition-transform">
                {status.quiz ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Play className="w-3.5 h-3.5 mr-1.5" />} Jawab Kuiz Pantas (10 Soalan)
              </Button>
              <Button onClick={() => runQuizGeneration(20)} disabled={status.quiz} size="lg" className="bg-amber-600 hover:bg-amber-700 h-11 text-xs rounded-xl w-full active:scale-98 transition-transform">
                {status.quiz ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Trophy className="w-3.5 h-3.5 mr-1.5" />} Cabaran Mod Exam (20 Soalan)
              </Button>
            </div>
          </div>

          <Button variant="ghost" size="sm" onClick={generateCoreLesson} disabled={status.lesson} className="w-full text-xs text-muted-foreground hover:bg-muted py-2 rounded-lg">
            {status.lesson ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />} Nota Kurang Jelas? Bina Semula Nota
          </Button>
        </motion.div>
      )}
    </div>
  );
}