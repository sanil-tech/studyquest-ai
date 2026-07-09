// src/pages/LessonPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Sparkles, Play, Loader2, Trophy, BookOpen, Layers, GitFork, Lock, HelpCircle, CheckCircle, Video, Star, Target, Crown, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

import LessonProgress from "@/components/lesson/LessonProgress";
import LessonContent from "@/components/lesson/LessonContent";
import VoicePlayer from "@/components/lesson/VoicePlayer";
import Flashcards from "@/components/lesson/Flashcards";
import MindMap from "@/components/lesson/MindMap";

// ============================================================================
// 1. HIGH-EFFICIENCY MICRO-PROMPT REGISTRY (Kekal Asal)
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

// ============================================================================
// 2. DYNAMIC RESPONSIVE MAIN COMPONENT LAYER (Gamified Edition)
// ============================================================================
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

  // ==========================================
  // NEW GAMIFICATION STATES (UI Flow Control)
  // ==========================================
  const [adventureStep, setAdventureStep] = useState("greeting"); // greeting -> video -> flashcards -> boss -> complete
  const [completedSteps, setCompletedSteps] = useState({
    greeting: false,
    video: false,
    flashcards: false,
    boss: false
  });
  const [showMindMapEnd, setShowMindMapEnd] = useState(false);

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
        
        setIsPremium(user?.is_premium || user?.profile?.is_premium || false);

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
        loadingStateCheck();
      }
    };
    initializeLesson();
  }, [subjectId, topicId]);

  const loadingStateCheck = () => {
    setLoading(false);
  };

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
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981']
    });
  };

  // ============================================================================
  // BUSINESS LOGIC WRAPPERS & MAPPER FLOWS (Tanpa Mengubah Kod Asal)
  // ============================================================================
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

      // Aliran Pengembaraan: Pindah ke video atau terus ke kad memori mengikut kewujudan URL video
      setCompletedSteps(prev => ({ ...prev, greeting: true }));
      const videoUrl = topic?.youtube_url || topic?.video_url;
      if (videoUrl) {
        setAdventureStep("video");
      } else {
        setAdventureStep("flashcards");
        loadFlashcardsOnDemand();
      }
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
        
        // Pindah ke skrin pengembaraan penamat sebelum proses navigasi kuiz standard dilakukan
        setCompletedSteps(prev => ({ ...prev, boss: true }));
        setAdventureStep("complete");
        triggerConfetti();

        setTimeout(() => {
          navigate(`/quiz/${quiz.id}`);
        }, 1500);
        return;
      } 
      else {
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

          setCompletedSteps(prev => ({ ...prev, boss: true }));
          setAdventureStep("complete");
          triggerConfetti();

          setTimeout(() => {
            navigate(`/quiz/${quiz.id}`);
          }, 1500);
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

  // Helper untuk membersihkan & mendapatkan id youtube dengan selamat
  const getYouTubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-12 h-12 border-5 border-cyan-200 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Penjanaan Tajuk Pengembaraan Dinamik Berdasarkan Nama Topik
  const getAdventureTitle = () => {
    const name = topic?.name || "Ilmu";
    if (name.toLowerCase().includes("banyak") || name.toLowerCase().includes("sedikit") || name.toLowerCase().includes("nombor")) {
      return `🕵️ Cabaran Detektif Nombor: ${name}`;
    }
    if (subject?.name?.toLowerCase().includes("matematik") || subject?.name?.toLowerCase().includes("math")) {
      return `🚀 Pengembaraan Matematik: ${name}`;
    }
    return `🏴‍☠️ Misi Harta Karun: ${name}`;
  };

  return (
    <div className="px-4 py-6 max-w-xl md:max-w-3xl lg:max-w-4xl mx-auto space-y-6 pb-24 font-sans bg-amber-50/20 min-h-screen selection:bg-cyan-200">
      
      {/* 1. GAMIFIED ADVENTURE PROGRESS MAP */}
      <div className="bg-white p-4 rounded-3xl border-4 border-slate-100 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <Link to={`/study/${subjectId}`} className="p-2.5 bg-slate-50 rounded-2xl hover:bg-cyan-50 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-black truncate text-slate-800 tracking-wide uppercase">
              {getAdventureTitle()}
            </h2>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
              <span>{subject?.icon} {subject?.name}</span>
              <span>•</span>
              <span className="text-cyan-600">{topic?.form_level}</span>
            </div>
          </div>
        </div>

        {/* Jalur Peta Duolingo Style Progress */}
        <div className="grid grid-cols-5 gap-1 relative pt-2">
          <div className="absolute top-7 left-[10%] right-[10%] h-1.5 bg-slate-100 rounded-full -z-10">
            <div 
              className="h-full bg-gradient-to-r from-cyan-400 via-purple-400 to-yellow-400 rounded-full transition-all duration-500" 
              style={{
                width: adventureStep === "greeting" ? "0%" : 
                       adventureStep === "video" ? "25%" :
                       adventureStep === "flashcards" ? "50%" :
                       adventureStep === "boss" ? "75%" : "100%"
              }}
            />
          </div>

          {/* Node 1: Misi Bermula */}
          <button 
            disabled={status.lesson}
            onClick={() => setAdventureStep("greeting")}
            className="flex flex-col items-center gap-1.5 focus:outline-none"
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-b-4 transition-all ${
              adventureStep === "greeting" ? "bg-cyan-500 border-cyan-700 text-white scale-110 shadow-lg shadow-cyan-200" :
              completedSteps.greeting ? "bg-cyan-100 border-cyan-300 text-cyan-700" : "bg-slate-50 border-slate-200 text-slate-400"
            }`}>
              🏕️
            </div>
            <span className="text-[10px] font-black text-center leading-tight tracking-tight hidden sm:block">Mula</span>
          </button>

          {/* Node 2: Video Rahsia */}
          <button 
            disabled={!explanation}
            onClick={() => {
              if (explanation) {
                const videoUrl = topic?.youtube_url || topic?.video_url;
                if (videoUrl) setAdventureStep("video");
              }
            }}
            className={`flex flex-col items-center gap-1.5 focus:outline-none ${!explanation ? "opacity-40 cursor-not-allowed" : ""}`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-b-4 transition-all ${
              adventureStep === "video" ? "bg-red-500 border-red-700 text-white scale-110 shadow-lg shadow-red-200" :
              completedSteps.video ? "bg-red-100 border-red-300 text-red-700" : "bg-slate-50 border-slate-200 text-slate-400"
            }`}>
              🎬
            </div>
            <span className="text-[10px] font-black text-center leading-tight tracking-tight hidden sm:block">Video</span>
          </button>

          {/* Node 3: Kad Memori */}
          <button 
            disabled={!explanation}
            onClick={() => {
              if (explanation) {
                setAdventureStep("flashcards");
                loadFlashcardsOnDemand();
              }
            }}
            className={`flex flex-col items-center gap-1.5 focus:outline-none ${!explanation ? "opacity-40 cursor-not-allowed" : ""}`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-b-4 transition-all ${
              adventureStep === "flashcards" ? "bg-purple-500 border-purple-700 text-white scale-110 shadow-lg shadow-purple-200" :
              completedSteps.flashcards ? "bg-purple-100 border-purple-300 text-purple-700" : "bg-slate-50 border-slate-200 text-slate-400"
            }`}>
              🃏
            </div>
            <span className="text-[10px] font-black text-center leading-tight tracking-tight hidden sm:block">Memori</span>
          </button>

          {/* Node 4: Cabaran Boss */}
          <button 
            disabled={!explanation}
            onClick={() => { if (explanation) setAdventureStep("boss"); }}
            className={`flex flex-col items-center gap-1.5 focus:outline-none ${!explanation ? "opacity-40 cursor-not-allowed" : ""}`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-b-4 transition-all ${
              adventureStep === "boss" ? "bg-orange-500 border-orange-700 text-white scale-110 shadow-lg shadow-orange-200" :
              completedSteps.boss ? "bg-orange-100 border-orange-300 text-orange-700" : "bg-slate-50 border-slate-200 text-slate-400"
            }`}>
              🏆
            </div>
            <span className="text-[10px] font-black text-center leading-tight tracking-tight hidden sm:block">Boss</span>
          </button>

          {/* Node 5: Selesai */}
          <button 
            disabled={!completedSteps.boss}
            onClick={() => { if (completedSteps.boss) setAdventureStep("complete"); }}
            className={`flex flex-col items-center gap-1.5 focus:outline-none ${!completedSteps.boss ? "opacity-40 cursor-not-allowed" : ""}`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-b-4 transition-all ${
              adventureStep === "complete" ? "bg-yellow-400 border-yellow-600 text-white scale-110 shadow-lg shadow-yellow-100" : "bg-slate-50 border-slate-200 text-slate-400"
            }`}>
              👑
            </div>
            <span className="text-[10px] font-black text-center leading-tight tracking-tight hidden sm:block">Juara</span>
          </button>
        </div>
      </div>

      {/* 2. DYNAMIC MISSION CONTENT CONTAINER LAYER */}
      <AnimatePresence mode="wait">
        
        {/* MISSION 1: GREETING SCREEN */}
        {adventureStep === "greeting" && (
          <motion.div
            key="greeting-step"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-[2.5rem] p-6 sm:p-10 border-4 border-cyan-200 shadow-xl max-w-xl mx-auto text-center relative overflow-hidden"
          >
            <div className="absolute top-4 right-4 bg-cyan-100 text-cyan-700 px-3 py-1.5 rounded-full text-xs font-black">
              MISSION 1
            </div>

            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-cyan-200 to-blue-100 flex items-center justify-center mx-auto mb-6 shadow-md">
              <Sparkles className="w-12 h-12 text-cyan-600 animate-bounce" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-black mb-3 text-slate-800 tracking-tight">
              🎉 Hai {studentNickname}!
            </h2>
            <p className="text-slate-600 font-bold text-sm sm:text-base mb-6 max-w-sm mx-auto leading-relaxed">
              Hari ini kamu akan memulakan satu Pengembaraan Ilmu yang luar biasa. Selesaikan semua cabaran untuk menjadi Juara! 🌟
            </p>

            {/* Ganjaran Grid Card */}
            <div className="bg-slate-50 rounded-2xl p-4 grid grid-cols-3 gap-2 border-2 border-slate-100 mb-8 max-w-md mx-auto">
              <div className="flex flex-col items-center">
                <span className="text-2xl mb-1">🪙</span>
                <span className="text-xs font-black text-slate-700">+50 Syiling</span>
              </div>
              <div className="flex flex-col items-center border-x-2 border-slate-200/60">
                <span className="text-2xl mb-1">⭐</span>
                <span className="text-xs font-black text-slate-700">Bonus XP</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl mb-1">🏅</span>
                <span className="text-xs font-black text-slate-700">Lencana</span>
              </div>
            </div>

            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="max-w-md mx-auto">
              <Button 
                onClick={generateCoreLesson} 
                disabled={status.lesson} 
                className="w-full h-15 rounded-2xl text-base font-black shadow-lg shadow-cyan-300 bg-cyan-500 hover:bg-cyan-600 text-white border-b-4 border-cyan-700 active:border-b-0"
              >
                {status.lesson ? (
                  <><Loader2 className="w-5 h-5 animate-spin mr-2"/> Menjana Peta Ilmu... 🪄</>
                ) : (
                  <><Sparkles className="w-5 h-5 mr-2"/> Jom Mulakan Misi! 🚀</>
                )}
              </Button>
            </motion.div>
          </motion.div>
        )}

        {/* MISSION 2: SECRET VIDEO CHALLENGE */}
        {adventureStep === "video" && (
          <motion.div
            key="video-step"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-[2.5rem] p-5 sm:p-8 border-4 border-red-200 shadow-xl space-y-6"
          >
            <div className="flex items-center justify-between border-b-2 border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="bg-red-100 p-2 rounded-xl text-red-600">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-800">🎬 Cabaran Video Rahsia</h3>
                  <p className="text-xs font-bold text-slate-400">Tonton petunjuk penting di bawah!</p>
                </div>
              </div>
              <span className="bg-red-50 text-red-600 text-xs font-black px-2.5 py-1 rounded-full">MISSION 2</span>
            </div>

            <p className="text-slate-600 font-bold text-sm bg-red-50/50 p-3.5 rounded-2xl border border-red-100">
              Guru telah meninggalkan satu video rahsia. Tonton video ini untuk mendapatkan petunjuk penting bagi misi seterusnya! 🔑
            </p>

            {/* YouTube Embed Container */}
            {getYouTubeId(topic?.youtube_url || topic?.video_url) ? (
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-md border-2 border-slate-100">
                <iframe
                  className="absolute top-0 left-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${getYouTubeId(topic?.youtube_url || topic?.video_url)}`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            ) : (
              <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed text-slate-400 font-bold text-sm">
                Tiada video dijumpai untuk misi ini. Anda boleh teruskan pengembaraan! ✨
              </div>
            )}

            <div className="bg-slate-50 p-3 rounded-xl flex items-center justify-around text-xs font-black text-slate-600 max-w-xs mx-auto border border-slate-100">
              <span>⭐ +10 XP</span>
              <span>🪙 +10 Syiling</span>
            </div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="pt-2">
              <Button 
                onClick={() => {
                  setCompletedSteps(prev => ({ ...prev, video: true }));
                  setAdventureStep("flashcards");
                  loadFlashcardsOnDemand();
                }}
                className="w-full h-14 rounded-2xl text-base font-black bg-red-500 hover:bg-red-600 text-white border-b-4 border-red-700 active:border-b-0"
              >
                ✅ Saya Dah Selesai Tonton!
              </Button>
            </motion.div>
          </motion.div>
        )}

        {/* MISSION 3: FLASHCARDS & SMART NOTES CHALLENGE */}
        {adventureStep === "flashcards" && (
          <motion.div
            key="flashcards-step"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Arahan Misi Atas */}
            <div className="bg-white rounded-[2.5rem] p-5 sm:p-6 border-4 border-purple-200 shadow-xl flex flex-col sm:flex-row items-center gap-4 justify-between">
              <div className="flex items-center gap-3 text-center sm:text-left">
                <div className="bg-purple-100 p-3 rounded-2xl text-purple-600 text-2xl hidden sm:block">🃏</div>
                <div>
                  <h3 className="font-black text-lg text-slate-800">🃏 Cabaran Kad Memori</h3>
                  <p className="text-xs font-bold text-purple-700">Latih dan kuatkan kuasa ingatan ilmu kamu!</p>
                </div>
              </div>
              <span className="bg-purple-50 text-purple-600 text-xs font-black px-2.5 py-1 rounded-full shrink-0">MISSION 3</span>
            </div>

            {/* Smart Lesson Notes Block */}
            <div className="bg-white rounded-[2.5rem] p-5 sm:p-8 border-4 border-slate-100 shadow-lg space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-slate-50 pb-4">
                <h4 className="font-black text-base text-slate-800 flex items-center gap-2">✨ Kit Kitab Nota Pintar</h4>
                {isPremium ? (
                  <div className="bg-cyan-50 rounded-full pr-2">
                    <VoicePlayer text={explanation} language={getLanguageMode() === "en" ? "en" : "ms"} />
                  </div>
                ) : (
                  <Button size="sm" variant="outline" onClick={handlePremiumRedirect} className="text-amber-600 border-amber-300 bg-amber-50 rounded-full text-xs font-black gap-1.5 py-4 shadow-sm hover:bg-amber-100">
                    <Lock className="w-3.5 h-3.5 text-amber-500" /> Dengar Audio Cerita 🎧
                  </Button>
                )}
              </div>
              <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed max-h-[250px] overflow-y-auto pr-2 border-b border-slate-100 pb-2">
                <LessonContent content={explanation} />
              </div>
            </div>

            {/* Flashcards Interactive Block */}
            <div className="bg-purple-50/60 p-4 sm:p-6 rounded-[2.5rem] border-4 border-purple-100 shadow-inner">
              {status.flashcards ? (
                <div className="flex flex-col items-center justify-center py-12 text-sm text-purple-600 font-bold">
                  <Loader2 className="w-8 h-8 animate-spin mb-3 text-purple-500" /> 🎮 Menyusun kad ajaib...
                </div>
              ) : (
                <Flashcards flashcards={flashcards || []} />
              )}
            </div>

            {/* Next Action Wrapper */}
            <div className="bg-white p-4 rounded-3xl border-2 border-slate-100 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex gap-4 text-xs font-black text-slate-500">
                <span>🪙 +20 Syiling</span>
                <span>⭐ +30 XP</span>
              </div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="w-full sm:w-auto">
                <Button
                  onClick={() => {
                    setCompletedSteps(prev => ({ ...prev, flashcards: true }));
                    setAdventureStep("boss");
                  }}
                  className="w-full sm:w-48 h-12 rounded-xl text-sm font-black bg-purple-500 hover:bg-purple-600 text-white border-b-4 border-purple-700 active:border-b-0"
                >
                  💪 Saya Dah Hafal Nota!
                </Button>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* MISSION 4: THE BIG BOSS CHALLENGE */}
        {adventureStep === "boss" && (
          <motion.div
            key="boss-step"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-gradient-to-br from-yellow-100 via-orange-50 to-orange-100 rounded-[2.5rem] p-6 sm:p-8 border-4 border-yellow-300 shadow-xl relative overflow-hidden"
          >
            <Trophy className="absolute -bottom-6 -right-6 w-36 h-36 text-orange-200/40 rotate-12 -z-0" />
            <div className="absolute top-4 right-4 bg-orange-200 text-orange-800 px-3 py-1 rounded-full text-xs font-black">
              FINAL BOSS
            </div>

            <div className="relative z-10 space-y-6">
              <div className="text-center max-w-md mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-orange-500 text-white flex items-center justify-center text-3xl font-bold mx-auto mb-3 shadow-md border-b-4 border-orange-700">
                  🏆
                </div>
                <h3 className="font-black text-2xl text-orange-950">
                  Pertempuran Akhir, {studentNickname}! 🎯
                </h3>
                <p className="text-sm text-orange-800 mt-1 font-bold leading-relaxed">
                  Inilah masa keemasan untuk membuktikan kebijaksanaan kamu! Kumpul syiling dan tewaskan cabaran boss sekarang!
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto pt-2">
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button 
                    onClick={() => runQuizGeneration(10)} 
                    disabled={status.quiz} 
                    className="bg-orange-500 hover:bg-orange-600 text-white h-16 text-sm font-black rounded-2xl w-full border-b-4 border-orange-700 active:border-b-0 transition-all shadow-md"
                  >
                    {status.quiz ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2 fill-current" />} ⚡ Cabaran Pantas (10 Soalan)
                  </Button>
                </motion.div>

                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button 
                    onClick={() => runQuizGeneration(20)} 
                    disabled={status.quiz} 
                    className="bg-red-500 hover:bg-red-600 text-white h-16 text-sm font-black rounded-2xl w-full border-b-4 border-red-700 active:border-b-0 transition-all shadow-md"
                  >
                    {status.quiz ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Trophy className="w-4 h-4 mr-2" />} 👑 Ujian Maha Juara (20 Soalan)
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}

        {/* MISSION COMPLETE: CELEBRATION SCREEN */}
        {adventureStep === "complete" && (
          <motion.div
            key="complete-step"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6 max-w-2xl mx-auto text-center"
          >
            {/* Card Juara Utama */}
            <div className="bg-white rounded-[3rem] p-6 sm:p-10 border-4 border-yellow-400 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-400" />
              
              <div className="w-24 h-24 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4 border-4 border-yellow-400 shadow-md">
                <Crown className="w-12 h-12 text-yellow-600 animate-pulse" />
              </div>

              <h2 className="text-3xl font-black text-slate-800 tracking-tight">🎉 SYABAS, KAMU JUARA! 🎉</h2>
              <p className="text-slate-500 font-bold text-sm sm:text-base mt-1">
                Kamu telah berjaya menyelesaikan keseluruhan Pengembaraan <span className="text-cyan-600 font-black">"{topic?.name}"</span>!
              </p>

              {/* Loot Chest Ganjaran Akhir */}
              <div className="my-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border-2 border-yellow-200 grid grid-cols-3 gap-2 max-w-sm mx-auto">
                <div className="text-center">
                  <div className="text-2xl">🪙</div>
                  <div className="text-xs font-black text-amber-900">+50 Syiling</div>
                </div>
                <div className="text-center border-x border-yellow-200">
                  <div className="text-2xl">⭐</div>
                  <div className="text-xs font-black text-amber-900">+120 XP</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl">🔥</div>
                  <div className="text-xs font-black text-amber-900">Streak Up!</div>
                </div>
              </div>

              {/* Pilihan Navigasi Tamat Pengembaraan */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
                <Button
                  onClick={() => {
                    setShowMindMapEnd(true);
                    loadMindMapOnDemand();
                  }}
                  className="h-13 px-6 rounded-xl text-xs font-black bg-blue-500 hover:bg-blue-600 text-white border-b-4 border-blue-700 active:border-b-0 flex items-center justify-center gap-1.5"
                >
                  <Map className="w-4 h-4" /> 🗺️ Lihat Peta Minda Sesi
                </Button>

                <Button
                  onClick={() => navigate(`/study/${subjectId}`)}
                  className="h-13 px-6 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white border-b-4 border-green-700 active:border-b-0"
                >
                  ➡ Teruskan Pengembaraan Lain
                </Button>
              </div>
            </div>

            {/* PETA MINDA CONTAINER (Hanya muncul jika dipicu/klik di penghujung misi) */}
            {showMindMapEnd && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="min-h-[250px] overflow-x-auto rounded-[2.5rem] bg-blue-50/50 border-4 border-blue-200 p-6 text-left shadow-xl"
              >
                <div className="flex items-center justify-between border-b border-blue-200 pb-3 mb-4">
                  <h4 className="font-black text-sm text-blue-900 flex items-center gap-1.5">🗺️ Peta Harta Karun Ilmu Minda</h4>
                  <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-black">MINDMAP REWARD</span>
                </div>
                {status.mindmap ? (
                  <div className="flex flex-col items-center justify-center py-12 text-sm text-blue-600 font-bold">
                    <Loader2 className="w-8 h-8 animate-spin mb-3 text-blue-500" /> Melukis kompas peta minda... 🗺️
                  </div>
                ) : mindMap ? (
                  <MindMap mindMap={{ central_topic: topic.name, branches: mindMap }} />
                ) : null}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. PREMIUM COMPONENT REGENERATION ACCORDINGLY (Kekal Asal di bahagian bawah) */}
      {explanation && (
        <div className="pt-4 max-w-md mx-auto">
          {isPremium ? (
            <Button variant="ghost" size="sm" onClick={generateCoreLesson} disabled={status.lesson} className="w-full text-xs font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-100 py-3 rounded-full transition-colors">
              {status.lesson ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-3.5 h-3.5 mr-1.5" />} Tulis semula nota pengembaraan ini
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={handlePremiumRedirect} className="w-full text-xs font-black text-amber-600 bg-amber-50/40 hover:bg-amber-100/60 py-3 rounded-full border-2 border-dashed border-amber-200/70 transition-colors">
              <Lock className="w-3.5 h-3.5 mr-1.5 text-amber-500 inline" /> Ciri Premium: Jana Semula Nota Pengembaraan 🌟
            </Button>
          )}
        </div>
      )}

    </div>
  );
}