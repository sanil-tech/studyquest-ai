// src/pages/LessonPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Sparkles, Play, Loader2, Trophy, BookOpen, Layers, GitFork, Lock, HelpCircle } from "lucide-react";
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

// Helper untuk merawakkan array (Fisher-Yates Shuffle Algorithm)
const shuffleArray = (array) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

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
  const [rawBankQuestions, setRawBankQuestions] = useState([]);

  const [activeTab, setActiveTab] = useState("lesson");
  const [status, setStatus] = useState({ lesson: false, flashcards: false, mindmap: false, quiz: false });

  const studyStartRef = useRef(null);
  const sessionRef = useRef(null);

  useEffect(() => { 
    sessionRef.current = sessionId; 
  }, [sessionId]);

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
        setIsPremium(user?.is_premium || user?.profile?.is_premium || false);

        // Tarik semua data kuiz/bank soalan dari database
        const allQuizBanks = await base44.entities.Quiz.filter({});

        if (allQuizBanks && allQuizBanks.length > 0) {
          const namaTopikSemasa = top.name.toLowerCase().trim();
         
          const foundBank = allQuizBanks.find(bank => {
            const namaBankCsv = (bank.topic_name || "").toLowerCase().trim();
            return namaBankCsv.includes(namaTopikSemasa) || namaTopikSemasa.includes(namaBankCsv);
          });

          if (foundBank) {
            const parsedQs = JSON.parse(foundBank.questions_json || "[]");
            setRawBankQuestions(parsedQs);
            console.log(`🎯 Bank soalan dijumpai untuk topik ini! Sedia dengan ${parsedQs.length} soalan.`);
          }
        }

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
    try { 
      await base44.entities.StudySession.update(sessionRef.current, { duration_minutes: minutes }); 
    } catch (err) { 
      console.warn("Failed to record study time", err); 
    }
  };

  useEffect(() => { 
    return () => { recordStudyTime(); }; 
  }, []);

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
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981']
    });
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
      triggerConfetti();
    } catch (e) {
      console.error(e);
    } finally { 
      setStatus(p => ({ ...p, lesson: false })); 
    }
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
    } catch (e) {
      console.warn("Background prefetch failed", e);
    }
  };

  const loadFlashcardsOnDemand = async () => {
    if (flashcards && flashcards.length > 0) return;
    if (status.flashcards) return;
    
    setStatus(p => ({ ...p, flashcards: true }));
   
    try {
      if (rawBankQuestions && rawBankQuestions.length > 0) {
        const shuffled = shuffleArray(rawBankQuestions);
        const selectedQuestions = shuffled.slice(0, 8);

        const mappedCards = selectedQuestions.map(q => ({
          front: q.question,
          back: `${q.correct_answer}\n\n${q.explanation || ""}`
        }));

        if (sessionId) {
          try {
            await base44.entities.StudySession.update(sessionId, { flashcards_json: JSON.stringify(mappedCards) });
          } catch (dbErr) {
            console.error("Gagal mengemas kini StudySession:", dbErr);
          }
        }
        
        setFlashcards(mappedCards);
        setStatus(p => ({ ...p, flashcards: false }));
        return;
      }
      
      const konteksRujukan = metaData?.summary || topic?.name || "Matematik Tahun 1";
      const lang = getLanguageMode();

      const res = await base44.integrations.Core.InvokeLLM({
        model: "gemini_3_flash",
        prompt: `Based on the topic/summary: "${konteksRujukan}", generate exactly 5 educational flashcards for a primary school student. The language must be ${lang === 'en' ? 'English' : 'Bahasa Melayu'}. Ensure high engagement. Return JSON schema matching: [{ "front": "string", "back": "string" }]`,
      });

      if (res && Array.isArray(res) && res.length > 0) {
        if (sessionId) {
          try {
            await base44.entities.StudySession.update(sessionId, { flashcards_json: JSON.stringify(res) });
          } catch (dbErr) {
            console.error("Gagal mengemas kini StudySession:", dbErr);
          }
        }
        setFlashcards(res);
      } else {
        const fallbackCards = [
          { front: `Mari teroka topik ${topic?.name || "ini"} bersama-sama!`, back: "Hebat! Klik butang 'Seterusnya' untuk kad lain. ✨" },
          { front: "Berapakah hasil 1 + 1?", back: "2\n\nBijak! 1 digabung dengan 1 menjadi dua. 🌟" },
          { front: "Kumpulan yang mempunyai objek yang banyak dipanggil?", back: "Kumpulan Banyak\n\nSyabas! Anda memang pemenang. 🏆" }
        ];
        setFlashcards(fallbackCards);
      }
    } catch (err) {
      console.error("Ralat kritikal dalam loadFlashcardsOnDemand:", err);
      const errorFallback = [
        { front: `Jom uji kefahaman tentang ${topic?.name || "topik ini"}!`, back: "Sedia! Tekan butang Kuiz di bawah untuk mula menjawab soalan. 🎯" }
      ];
      setFlashcards(errorFallback);
    } finally {
      setStatus(p => ({ ...p, flashcards: false }));
    }
  };

  const runQuizGeneration = async (numQ) => {
    await recordStudyTime();
    setStatus(p => ({ ...p, quiz: true }));

    const determinedDifficulty = numQ >= 20 ? "hard" : numQ >= 10 ? "medium" : "easy";

    try {
      if (rawBankQuestions && rawBankQuestions.length > 0) {
        let filteredPool = [...rawBankQuestions];

        if (determinedDifficulty === "hard") {
          const hardQuestions = rawBankQuestions.filter(q =>
            q.difficulty?.toLowerCase() === "hard" || q.difficulty?.toLowerCase() === "medium"
          );
          if (hardQuestions.length >= numQ) {
            filteredPool = hardQuestions;
          }
        }

        const shuffledQuestions = shuffleArray(filteredPool);
        const selectedPool = shuffledQuestions.slice(0, Math.min(numQ, shuffledQuestions.length));

        const quiz = await base44.entities.Quiz.create({
          session_id: sessionId,
          topic_name: topic.name,
          subject_name: subject?.name || "Matematik",
          questions_json: JSON.stringify(selectedPool),
          difficulty: determinedDifficulty,
          num_questions: selectedPool.length,
        });
        
        navigate(`/quiz/${quiz.id}`);
        return;
      } else {
        const lang = getLanguageMode();
        
        const res = await base44.integrations.Core.InvokeLLM({
          model: "gemini_3_flash",
          prompt: `Based on the topic: "${topic?.name}" and Summary: "${metaData.summary}", generate exactly ${numQ} multiple-choice questions for primary school students.
          Since this is an EXAM mode, the difficulty level must be "${determinedDifficulty}". Include higher-order thinking (KBAT) questions suitable for this level.
          The language must be ${lang === 'en' ? 'English' : 'Bahasa Melayu'}.
          Return JSON schema matching: [{ "question": "string", "options": ["string"], "correct_answer": "string", "explanation": "string" }]`,
        });
        
        if (res && Array.isArray(res) && res.length > 0) {
          const finalQuestions = res.slice(0, numQ);

          const quiz = await base44.entities.Quiz.create({
            session_id: sessionId,
            topic_name: topic.name,
            subject_name: subject?.name || "Matematik",
            questions_json: JSON.stringify(finalQuestions),
            difficulty: determinedDifficulty,
            num_questions: finalQuestions.length,
          });
          navigate(`/quiz/${quiz.id}`);
        }
      }
    } catch (err) {
      console.error("Gagal menjana kuiz exam:", err);
    } finally {
      setStatus(p => ({ ...p, quiz: false }));
    }
  };

  const loadMindMapOnDemand = async () => {
    if (mindMap && mindMap.length > 0) return;
    if (status.mindmap) return;

    setStatus(p => ({ ...p, mindmap: true }));
    try {
      const lang = getLanguageMode();
      const summary = metaData?.summary || topic?.name || "";
      const keywords = metaData?.keywords || [];

      const res = await base44.integrations.Core.InvokeLLM({
        model: "gemini_3_flash",
        prompt: MINDMAP_PROMPT(summary, keywords, lang),
      });

      if (res && Array.isArray(res)) {
        if (sessionId) {
          try {
            await base44.entities.StudySession.update(sessionId, { mindmap_json: JSON.stringify(res) });
          } catch (dbErr) {
            console.error("Gagal mengemas kini StudySession untuk mindmap:", dbErr);
          }
        }
        setMindMap(res);
      }
    } catch (err) {
      console.error("Ralat dalam loadMindMapOnDemand:", err);
    } finally {
      setStatus(p => ({ ...p, mindmap: false }));
    }
  };

  const handlePremiumRedirect = () => {
    alert("Opps! Ciri eksklusif ini hanya untuk ahli Premium sahaja. Jom langgan premium sekarang untuk belajar tanpa had! 🚀");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-cyan-200 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-3 sm:px-4 py-6 max-w-md md:max-w-2xl lg:max-w-4xl mx-auto space-y-8 pb-24 font-sans bg-slate-50/50 min-h-screen relative overflow-hidden">
      
      {/* Top Header Row */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center gap-4 bg-gradient-to-r from-cyan-100 to-blue-100 p-4 sm:p-5 rounded-3xl border-2 border-cyan-200 shadow-sm"
      >
        <Link to={`/study/${subjectId}`} className="p-3 bg-white rounded-2xl shadow-sm hover:shadow-md hover:bg-cyan-50 active:scale-90 transition-all">
          <ArrowLeft className="w-6 h-6 text-cyan-600" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold truncate text-slate-800 tracking-tight">
            {topic?.name} 🌟
          </h1>
          <p className="text-cyan-700 font-medium text-xs sm:text-sm truncate">
            {subject?.icon} {subject?.name} • {topic?.form_level}
          </p>
        </div>
      </motion.div>

      {!explanation ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className="text-center py-14 px-6 bg-white border-4 border-dashed border-primary/30 rounded-[2rem] shadow-xl shadow-primary/5 max-w-md mx-auto"
        >
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Sparkles className="w-10 h-10 text-primary animate-pulse" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mb-3 text-slate-800">
            Hai {studentNickname}! 👋<br/>Sedia untuk belajar? 🚀
          </h2>
          <p className="text-slate-500 text-sm mb-8 max-w-xs mx-auto">
            Jom kita teroka ilmu baru hari ini dengan nota yang super seronok!
          </p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button onClick={generateCoreLesson} disabled={status.lesson} className="w-full h-14 rounded-full text-base font-bold shadow-lg shadow-primary/30 bg-primary hover:bg-primary/90">
              {status.lesson ? <><Loader2 className="w-5 h-5 animate-spin mr-2"/> Tunggu sekejap ya... 🪄</> : <><Sparkles className="w-5 h-5 mr-2"/> Mula Pengembaraan!</>}
            </Button>
          </motion.div>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          
          {/* Responsive Sticky Tabs */}
          <div className="sticky top-2 z-30 bg-white/80 backdrop-blur-xl p-2 rounded-full shadow-md border border-slate-200 flex gap-2 overflow-x-auto no-scrollbar md:grid md:grid-cols-3">
            <Button size="sm" variant={activeTab === "lesson" ? "default" : "ghost"} onClick={() => setActiveTab("lesson")} className={`rounded-full shrink-0 md:w-full text-sm font-semibold gap-2 py-6 transition-all ${activeTab === "lesson" ? "shadow-md bg-primary text-white" : "text-slate-500 hover:bg-slate-100"}`}>
              <BookOpen className="w-5 h-5"/> Nota Pintar 📖
            </Button>
            <Button size="sm" variant={activeTab === "flashcards" ? "default" : "ghost"} onClick={() => { setActiveTab("flashcards"); loadFlashcardsOnDemand(); }} className={`rounded-full shrink-0 md:w-full text-sm font-semibold gap-2 py-6 transition-all ${activeTab === "flashcards" ? "shadow-md bg-purple-500 hover:bg-purple-600 text-white" : "text-slate-500 hover:bg-slate-100"}`}>
              <Layers className="w-5 h-5"/> Kad Memori 🃏
            </Button>
            <Button size="sm" variant={activeTab === "mindmap" ? "default" : "ghost"} onClick={() => { setActiveTab("mindmap"); loadMindMapOnDemand(); }} className={`rounded-full shrink-0 md:w-full text-sm font-semibold gap-2 py-6 transition-all ${activeTab === "mindmap" ? "shadow-md bg-blue-500 hover:bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-100"}`}>
              <GitFork className="w-5 h-5"/> Peta Minda 🧠
            </Button>
          </div>

          {/* Dynamic Content Container */}
          {activeTab === "lesson" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-[2rem] p-5 sm:p-8 border-4 border-slate-100 shadow-lg space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-slate-100 pb-5">
                <h2 className="font-bold text-xl text-slate-800 flex items-center gap-2">✨ Nota Ringkas</h2>
                {isPremium ? (
                  <div className="bg-primary/10 rounded-full pr-2">
                     <VoicePlayer text={explanation} language={getLanguageMode() === "en" ? "en" : "ms"} />
                  </div>
                ) : (
                  <Button size="sm" variant="outline" onClick={handlePremiumRedirect} className="text-amber-600 border-amber-300 bg-amber-50 rounded-full text-xs font-bold gap-2 py-5 shadow-sm hover:bg-amber-100">
                    <Lock className="w-4 h-4 text-amber-500" /> Dengar Audio Cerita 🎧
                  </Button>
                )}
              </div>
              <div className="prose prose-sm sm:prose-base max-w-none text-slate-700 leading-loose">
                <LessonContent content={explanation} />
              </div>
            </motion.div>
          )}

          {activeTab === "flashcards" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-[250px] bg-purple-50/50 p-4 rounded-[2rem] border-2 border-purple-100">
              {status.flashcards ? (
                <div className="flex flex-col items-center justify-center py-16 text-sm text-purple-600 font-medium">
                  <Loader2 className="w-10 h-10 animate-spin mb-4 text-purple-500" /> 🎮 Menyusun kad ajaib...
                </div>
              ) : <Flashcards flashcards={flashcards || []} />}
            </motion.div>
          )}

          {activeTab === "mindmap" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-[250px] overflow-x-auto rounded-[2rem] bg-blue-50/30 border-2 border-blue-100 p-6 shadow-inner">
              {status.mindmap ? (
                <div className="flex flex-col items-center justify-center py-16 text-sm text-blue-600 font-medium">
                  <Loader2 className="w-10 h-10 animate-spin mb-4 text-blue-500" /> Melukis peta harta karun... 🗺️
                </div>
              ) : mindMap ? <MindMap mindMap={{ central_topic: topic.name, branches: mindMap }} /> : null}
            </motion.div>
          )}

          {/* Responsive Quiz Panel */}
          <div className="bg-gradient-to-br from-yellow-100 via-orange-50 to-orange-100 rounded-[2rem] p-6 sm:p-8 border-4 border-yellow-200 shadow-lg relative overflow-hidden">
            <Trophy className="absolute -bottom-6 -right-6 w-32 h-32 text-orange-200/50 rotate-12" />
            <div className="relative z-10">
              <h3 className="font-bold text-xl sm:text-2xl text-orange-900 mb-2">
                Uji Minda, {studentNickname}! 🎯
              </h3>
              <p className="text-sm sm:text-base text-orange-700 mb-6 font-medium">
                Kumpul Syiling 🪙, naik level, dan jadi juara kelas! Jom sahut cabaran!
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }}>
                  <Button onClick={() => runQuizGeneration(10)} disabled={status.quiz} size="lg" className="bg-orange-500 hover:bg-orange-600 text-white h-16 text-sm font-bold rounded-2xl w-full border-b-4 border-orange-700 active:border-b-0 active:translate-y-1 transition-all">
                    {status.quiz ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Play className="w-5 h-5 mr-2 fill-current" />} Cabaran Pantas (10 Soalan)
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }}>
                  <Button onClick={() => runQuizGeneration(20)} disabled={status.quiz} size="lg" className="bg-red-500 hover:bg-red-600 text-white h-16 text-sm font-bold rounded-2xl w-full border-b-4 border-red-700 active:border-b-0 active:translate-y-1 transition-all">
                    {status.quiz ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Trophy className="w-5 h-5 mr-2" />} Ujian Boss (20 Soalan)
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Ciri Premium */}
          {isPremium ? (
            <Button variant="ghost" size="sm" onClick={generateCoreLesson} disabled={status.lesson} className="w-full text-sm font-medium text-slate-400 hover:text-slate-600 hover:bg-slate-100 py-3 rounded-full transition-colors">
              {status.lesson ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />} Tulis semula nota ini
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={handlePremiumRedirect} className="w-full text-sm font-medium text-amber-600 bg-amber-50/50 hover:bg-amber-100 py-3 rounded-full border-2 border-dashed border-amber-200 transition-colors">
              <Lock className="w-4 h-4 mr-2 text-amber-500" /> Ciri Premium: Jana Semula Nota 🌟
            </Button>
          )}
        </motion.div>
      )}

      {/* =========================================================================
          ORANG UTAN MASCOT - Terapung di hadapan lapisan utama
          - Menggunakan z-50 untuk mengelakkan ditindih
          - Fixed position supaya kekal sewaktu menatal
      ========================================================================= */}
      <motion.div
        animate={{ y: [0, -15, 0] }}
        transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
        className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-50 flex items-end drop-shadow-2xl pointer-events-none"
      >
        <div className="bg-white p-3 md:p-4 rounded-3xl rounded-br-none shadow-xl mb-4 mr-2 border-4 border-orange-300 pointer-events-auto max-w-[160px]">
          <p className="text-xs md:text-sm font-bold text-orange-700 leading-snug">
            Ayo, jom belajar {studentNickname}! 🦧✨
          </p>
        </div>
        {/* Pastikan anda menukar path gambar ini kepada lokasi sebenar fail gambar avatar anda */}
        <img
          src="/assets/orang-utan.png" 
          alt="Mascot Orang Utan"
          className="w-24 h-24 md:w-32 md:h-32 object-contain pointer-events-auto cursor-pointer hover:scale-110 transition-transform active:scale-95"
          onClick={triggerConfetti}
        />
      </motion.div>

    </div>
  );
}