import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Sparkles, Play, Loader2, Trophy, BookOpen, Layers, GitFork, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";

import LessonProgress from "@/components/lesson/LessonProgress";
import LessonContent from "@/components/lesson/LessonContent";
import VoicePlayer from "@/components/lesson/VoicePlayer";
import Flashcards from "@/components/lesson/Flashcards";
import MindMap from "@/components/lesson/MindMap";

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

CRITICAL TONE INSTRUCTION:
The student's personalized friendly nickname is "${studentNickname}". 
Your tone must be exceptionally warm, encouraging, cheerful, and affectionate—like a loving older sibling or a favorite supportive teacher. 
Do NOT sound robotic or dry. Use words of encouragement frequently (e.g., "Wah, hebatnya!", "Bijak!", "Jom kita teroka sama-sama!").
Address the student directly and personally by their nickname "${studentNickname}" naturally throughout the lesson, especially at the start of new concepts and during encouraging remarks.

Generate a concise, highly engaging lesson (700-1000 words max). Use short paragraphs (2-3 sentences max for easy mobile reading), clear subheadings (###), and bold key terms.
Incorporate 1-2 specialized info card markers directly in text: [REMEMBER]...[/REMEMBER] or [EXAMPLE]...[/EXAMPLE].
Return JSON schema matching: { "lesson_markdown": "string", "summary": "string", "keywords": ["string"] }
`;

const MINDMAP_PROMPT = (summary, keywords, lang) => `
${BASE_SYSTEM_PROMPT}
${FORMAT_CONSTRAINTS[lang]}
Based on Summary: "${summary}" and Keywords: ${JSON.stringify(keywords)}, create a mind map structure.
Return JSON schema matching: [{ "label": "string", "children": ["string"] }]
`;

const shuffleArray = (array) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

export default function LessonPage() {
  const { subjectId, topicId } = useParams();
  const navigate = useNavigate();
  
  const [subject, setSubject] = useState(null);
  const [topic, setTopic] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [studentNickname, setStudentNickname] = useState(""); 
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  const [explanation, setExplanation] = useState("");
  const [metaData, setMetaData] = useState({ summary: "", keywords: [] });
  const [flashcards, setFlashcards] = useState(null);
  const [mindMap, setMindMap] = useState(null);
  const [rawBankQuestions, setRawBankQuestions] = useState([]);

  const [activeTab, setActiveTab] = useState("lesson"); 
  const [status, setStatus] = useState({ lesson: false, flashcards: false, mindmap: false, quiz: false });

  const studyStartRef = useRef(null);
  const sessionRef = useRef(null);
  const isUnmounted = useRef(false);

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

  // ============================================================================
  // 🔄 KOD PEMBETULAN UTAMA: ATURAN KRONOLOGI SEMAKAN CACHE YANG KETAT
  // ============================================================================
  useEffect(() => {
    isUnmounted.current = false;
    const initializeLesson = async () => {
      try {
        // 1. Ambil maklumat asas penting dahulu
        const [sub, top, user] = await Promise.all([
          base44.entities.Subject.get(subjectId),
          base44.entities.Topic.get(topicId),
          base44.auth.me(),
        ]);
        
        if (isUnmounted.current) return;

        setSubject(sub);
        setTopic(top);
        setStudentNickname(tentukanPanggilanMesra(user, top?.form_level));
        setIsPremium(user?.is_premium || user?.profile?.is_premium || false);

        // 2. SEMAK CACHE TERLEBIH DAHULU (Ubah susunan ke paling atas)
        const cachedSessions = await base44.entities.StudySession.filter(
          { student_id: user.id, topic_id: topicId },
          "-created_date",
          1
        );

        if (cachedSessions && cachedSessions.length > 0 && !isUnmounted.current) {
          const session = cachedSessions[0];
          
          if (session.ai_explanation) {
            const parsed = JSON.parse(session.ai_explanation);
            
            if (parsed && parsed.lesson_markdown) {
              setSessionId(session.id);
              setExplanation(parsed.lesson_markdown);
              setMetaData({ summary: parsed.summary || "", keywords: parsed.keywords || [] });
              
              if (session.mindmap_json) setMindMap(JSON.parse(session.mindmap_json));
              if (session.flashcards_json) setFlashcards(JSON.parse(session.flashcards_json));
              
              // ✨ Hentikan pemuatan dan skip prompt jika data cache berjaya dimuatkan
              studyStartRef.current = Date.now();
              setLoading(false);
              return; 
            }
          }
        }

        // 3. JIKA TIADA CACHE, BARU MUATKAN UTILITY LAIN (Hadkan 20 kuiz terbaharu agar tidak tersekat)
        const allQuizBanks = await base44.entities.Quiz.filter({}, "-created_date", 20);
        if (allQuizBanks && allQuizBanks.length > 0 && !isUnmounted.current) {
          const namaTopikSemasa = top.name.toLowerCase().trim();
          const foundBank = allQuizBanks.find(bank => {
            const namaBankCsv = (bank.topic_name || "").toLowerCase().trim();
            return namaBankCsv.includes(namaTopikSemasa) || namaTopikSemasa.includes(namaBankCsv);
          });
          if (foundBank) {
            const parsedQs = JSON.parse(foundBank.questions_json || "[]");
            setRawBankQuestions(parsedQs);
          }
        }

      } catch (err) {
        console.error("Cache initialization failed", err);
      } finally {
        if (!isUnmounted.current) {
          studyStartRef.current = Date.now();
          setLoading(false);
        }
      }
    };
    initializeLesson();
    return () => { isUnmounted.current = true; };
  }, [subjectId, topicId]);

  const recordStudyTime = async () => {
    if (!sessionRef.current || !studyStartRef.current) return;
    const minutes = Math.max(1, Math.round((Date.now() - studyStartRef.current) / 60000));
    try { await base44.entities.StudySession.update(sessionRef.current, { duration_minutes: minutes }); } catch (err) { console.warn("Failed to record study time", err); }
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

  const triggerConfetti = () => {
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981'] });
  };

  const generateCoreLesson = async () => {
    if (status.lesson) return;
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
      triggerConfetti();
    } catch (e) {
      console.error(e);
    } finally { setStatus(p => ({ ...p, lesson: false })); }
  };

  const triggerBackgroundPrefetch = async (summary, keywords, lang, targetSessionId) => {
    try {
      base44.integrations.Core.InvokeLLM({
        model: "gemini_3_flash",
        prompt: MINDMAP_PROMPT(summary, keywords, lang),
      }).then(res => {
        if (res && Array.isArray(res)) {
          base44.entities.StudySession.update(targetSessionId, { mindmap_json: JSON.stringify(res) });
          setMindMap(res);
        }
      });
    } catch (e) { console.warn("Background prefetch failed", e); }
  };

  const loadFlashcardsOnDemand = async () => {
    if (flashcards && flashcards.length > 0) return;
    if (status.flashcards) return;
    setStatus(p => ({ ...p, flashcards: true }));
    try {
      if (rawBankQuestions && rawBankQuestions.length > 0) {
        const shuffled = shuffleArray(rawBankQuestions);
        const selectedQuestions = shuffled.slice(0, 8);
        const mappedCards = selectedQuestions.map(q => ({ front: q.question, back: `${q.correct_answer}\n\n${q.explanation || ""}` }));
        if (sessionId) { await base44.entities.StudySession.update(sessionId, { flashcards_json: JSON.stringify(mappedCards) }); }
        setFlashcards(mappedCards);
        return; 
      } 
      const konteksRujukan = metaData?.summary || topic?.name || "Matematik";
      const lang = getLanguageMode();
      const res = await base44.integrations.Core.InvokeLLM({
        model: "gemini_3_flash",
        prompt: `Based on the topic/summary: "${konteksRujukan}", generate exactly 5 educational flashcards for a primary school student. The language must be ${lang === 'en' ? 'English' : 'Bahasa Melayu'}. Return JSON schema matching: [{ "front": "string", "back": "string" }]`,
      });
      if (res && Array.isArray(res) && res.length > 0) {
        if (sessionId) { await base44.entities.StudySession.update(sessionId, { flashcards_json: JSON.stringify(res) }); }
        setFlashcards(res);
      }
    } catch (err) {
      setFlashcards([{ front: "Mari teroka bersama!", back: "Hebat! Klik butang 'Seterusnya' ✨" }]);
    } finally { setStatus(p => ({ ...p, flashcards: false })); }
  };

  const runQuizGeneration = async (numQ) => {
    if (status.quiz) return;
    await recordStudyTime();
    setStatus(p => ({ ...p, quiz: true }));
    const determinedDifficulty = numQ >= 20 ? "hard" : numQ >= 10 ? "medium" : "easy";
    try {
      if (rawBankQuestions && rawBankQuestions.length > 0) {
        let filteredPool = [...rawBankQuestions];
        if (determinedDifficulty === "hard") {
          const hardQuestions = rawBankQuestions.filter(q => q.difficulty?.toLowerCase() === "hard" || q.difficulty?.toLowerCase() === "medium");
          if (hardQuestions.length >= numQ) filteredPool = hardQuestions;
        }
        const shuffledQuestions = shuffleArray(filteredPool);
        const selectedPool = shuffledQuestions.slice(0, Math.min(numQ, shuffledQuestions.length));
        const quiz = await base44.entities.Quiz.create({ session_id: sessionId, topic_name: topic.name, subject_name: subject?.name || "Matematik", questions_json: JSON.stringify(selectedPool), difficulty: determinedDifficulty, num_questions: selectedPool.length });
        navigate(`/quiz/${quiz.id}`);
        return;
      } else {
        const lang = getLanguageMode();
        const res = await base44.integrations.Core.InvokeLLM({
          model: "gemini_3_flash",
          prompt: `Based on the topic: "${topic?.name}" and Summary: "${metaData.summary}", generate exactly ${numQ} multiple-choice questions for primary school students. Return JSON schema matching: [{ "question": "string", "options": ["string"], "correct_answer": "string", "explanation": "string" }]`,
        });
        if (res && Array.isArray(res) && res.length > 0) {
          const quiz = await base44.entities.Quiz.create({ session_id: sessionId, topic_name: topic.name, subject_name: subject?.name || "Matematik", questions_json: JSON.stringify(res.slice(0, numQ)), difficulty: determinedDifficulty, num_questions: res.slice(0, numQ).length });
          navigate(`/quiz/${quiz.id}`);
        }
      }
    } catch (err) { console.error(err); } finally { setStatus(p => ({ ...p, quiz: false })); }
  };

  const loadMindMapOnDemand = async () => {
    if (mindMap && mindMap.length > 0) return;
    if (status.mindmap) return;
    setStatus(p => ({ ...p, mindmap: true }));
    try {
      const lang = getLanguageMode();
      const res = await base44.integrations.Core.InvokeLLM({ model: "gemini_3_flash", prompt: MINDMAP_PROMPT(metaData?.summary, metaData?.keywords, lang) });
      if (res && Array.isArray(res)) {
        if (sessionId) { await base44.entities.StudySession.update(sessionId, { mindmap_json: JSON.stringify(res) }); }
        setMindMap(res);
      }
    } catch (err) { console.error(err); } finally { setStatus(p => ({ ...p, mindmap: false })); }
  };

  const handlePremiumRedirect = () => { alert("Opps! Ciri eksklusif ini hanya untuk ahli Premium sahaja. 🚀"); };

  const getEmbedUrl = (url) => {
    if (!url) return null;
    let videoId = "";
    if (url.includes("youtube.com/watch")) {
      const urlParams = new URLSearchParams(url.split("?")[1]);
      videoId = urlParams.get("v");
    } else if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1]?.split("?")[0];
    } else if (url.includes("youtube.com/embed/")) {
      videoId = url.split("youtube.com/embed/")[1]?.split("?")[0];
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  };

  const embedVideoUrl = getEmbedUrl(topic?.video_url);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-cyan-200 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-3 sm:px-4 py-6 max-w-md md:max-w-2xl lg:max-w-4xl mx-auto space-y-8 pb-24 font-sans bg-slate-50/50 min-h-screen">
      
      {/* Header Row */}
      <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex items-center gap-4 bg-gradient-to-r from-cyan-100 to-blue-100 p-4 sm:p-5 rounded-3xl border-2 border-cyan-200 shadow-sm">
        <Link to={`/study/${subjectId}`} className="p-3 bg-white rounded-2xl shadow-sm hover:shadow-md hover:bg-cyan-50 active:scale-90 transition-all">
          <ArrowLeft className="w-6 h-6 text-cyan-600" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold truncate text-slate-800 tracking-tight">{topic?.name} 🌟</h1>
          <p className="text-cyan-700 font-medium text-xs sm:text-sm truncate">{subject?.icon} {subject?.name} • {topic?.form_level}</p>
        </div>
      </motion.div>

      {!explanation ? (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-14 px-6 bg-white border-4 border-dashed border-primary/30 rounded-[2rem] shadow-xl max-w-md mx-auto">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-10 h-10 text-primary animate-pulse" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mb-3 text-slate-800">Hai {studentNickname}! 👋<br/>Sedia untuk belajar? 🚀</h2>
          <p className="text-slate-500 text-sm mb-8 max-w-xs mx-auto">Jom kita teroka ilmu baru hari ini dengan nota yang super seronok!</p>
          <Button onClick={generateCoreLesson} disabled={status.lesson} className="w-full h-14 rounded-full text-base font-bold shadow-lg bg-primary">
            {status.lesson ? "Tunggu sekejap ya... 🪄" : "Mula Pengembaraan!"}
          </Button>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          
          {/* Navigation Tabs */}
          <div className="sticky top-2 z-30 bg-white/80 backdrop-blur-xl p-2 rounded-full shadow-md border border-slate-200 flex gap-2 overflow-x-auto md:grid md:grid-cols-3">
            <Button size="sm" variant={activeTab === "lesson" ? "default" : "ghost"} onClick={() => setActiveTab("lesson")} className={`rounded-full shrink-0 md:w-full text-sm font-semibold gap-2 py-6 transition-all ${activeTab === "lesson" ? "shadow-md bg-primary text-white" : "text-slate-500"}`}>
              <BookOpen className="w-5 h-5"/> Nota Pintar 📖
            </Button>
            <Button size="sm" variant={activeTab === "flashcards" ? "default" : "ghost"} onClick={() => { setActiveTab("flashcards"); loadFlashcardsOnDemand(); }} className={`rounded-full shrink-0 md:w-full text-sm font-semibold gap-2 py-6 transition-all ${activeTab === "flashcards" ? "shadow-md bg-purple-500 text-white" : "text-slate-500"}`}>
              <Layers className="w-5 h-5"/> Kad Memori 🃏
            </Button>
            <Button size="sm" variant={activeTab === "mindmap" ? "default" : "ghost"} onClick={() => { setActiveTab("mindmap"); loadMindMapOnDemand(); }} className={`rounded-full shrink-0 md:w-full text-sm font-semibold gap-2 py-6 transition-all ${activeTab === "mindmap" ? "shadow-md bg-blue-500 text-white" : "text-slate-500"}`}>
              <GitFork className="w-5 h-5"/> Peta Minda 🧠
            </Button>
          </div>

          {/* Tab Content */}
          {activeTab === "lesson" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-[2rem] p-5 sm:p-8 border-4 border-slate-100 shadow-lg space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-slate-100 pb-5">
                <h2 className="font-bold text-xl text-slate-800 flex items-center gap-2">✨ Nota & Video Kelas</h2>
                {isPremium ? <VoicePlayer text={explanation} language={getLanguageMode() === "en" ? "en" : "ms"} /> : <Button size="sm" variant="outline" onClick={handlePremiumRedirect} className="text-amber-600 border-amber-300 bg-amber-50 rounded-full text-xs font-bold gap-2 py-5 shadow-sm"><Lock className="w-4 h-4" /> Dengar Audio 🎧</Button>}
              </div>

              {embedVideoUrl && (
                <div className="w-full aspect-video rounded-2xl overflow-hidden border-2 border-slate-100 shadow-sm bg-black">
                  <iframe src={embedVideoUrl} title={topic?.name} className="w-full h-full" allowFullScreen></iframe>
                </div>
              )}

              <div className="prose prose-sm sm:prose-base max-w-none text-slate-700 leading-loose pt-2">
                <LessonContent content={explanation} />
              </div>
            </motion.div>
          )}

          {activeTab === "flashcards" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-[250px] bg-purple-50/50 p-4 rounded-[2rem] border-2 border-purple-100">
              {status.flashcards ? <div className="flex flex-col items-center justify-center py-16 text-sm text-purple-600 font-medium"><Loader2 className="w-10 h-10 animate-spin mb-4" /> Menyusun kad...</div> : <Flashcards flashcards={flashcards || []} />}
            </motion.div>
          )}

          {activeTab === "mindmap" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-[250px] overflow-x-auto rounded-[2rem] bg-blue-50/30 border-2 border-blue-100 p-6">
              {status.mindmap ? <div className="flex flex-col items-center justify-center py-16 text-sm text-blue-600 font-medium"><Loader2 className="w-10 h-10 animate-spin mb-4" /> Melukis peta... 🗺️</div> : mindMap ? <MindMap mindMap={{ central_topic: topic.name, branches: mindMap }} /> : null}
            </motion.div>
          )}

          {/* Quiz Generator Panel */}
          <div className="bg-gradient-to-br from-yellow-100 via-orange-50 to-orange-100 rounded-[2rem] p-6 sm:p-8 border-4 border-yellow-200 shadow-lg relative overflow-hidden">
            <Trophy className="absolute -bottom-6 -right-6 w-32 h-32 text-orange-200/50 rotate-12" />
            <div className="relative z-10">
              <h3 className="font-bold text-xl sm:text-2xl text-orange-900 mb-2">Uji Minda, {studentNickname}! 🎯</h3>
              <p className="text-sm sm:text-base text-orange-700 mb-6 font-medium">Kumpul Syiling 🪙, naik level, dan jadi juara kelas!</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button onClick={() => runQuizGeneration(10)} disabled={status.quiz} size="lg" className="bg-orange-500 text-white h-16 text-sm font-bold rounded-2xl w-full border-b-4 border-orange-700">
                  {status.quiz ? "Jana..." : "Cabaran Pantas (10 Soalan)"}
                </Button>
                <Button onClick={() => runQuizGeneration(20)} disabled={status.quiz} size="lg" className="bg-red-500 text-white h-16 text-sm font-bold rounded-2xl w-full border-b-4 border-red-700">
                  {status.quiz ? "Jana..." : "Ujian Boss (20 Soalan)"}
                </Button>
              </div>
            </div>
          </div>
             
        </motion.div>
      )}
    </div>
  );
}