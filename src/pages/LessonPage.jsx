// src/pages/LessonPage.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { 
  ArrowLeft, Play, Loader2, Trophy, Lock, Award, Compass, Tv, 
  CheckCircle2, AlertCircle, Leaf, Sprout 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

import LessonContent from "@/components/lesson/LessonContent";
import VoicePlayer from "@/components/lesson/VoicePlayer";
import Flashcards from "@/components/lesson/Flashcards";
import MindMap from "@/components/lesson/MindMap";
import LessonProgress from "@/components/lesson/LessonProgress";

// ============================================================================
// COMPONENT 1: YouTubeLesson 
// ============================================================================
function YouTubeLesson({ videoUrl, onCompleted, isCompleted, xpEarned }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const playerRef = useRef(null);
  const checkIntervalRef = useRef(null);

  const getYouTubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = getYouTubeId(videoUrl);

  useEffect(() => {
    if (!videoId) return;
    const handleAPIReady = () => { initPlayer(); };

    if (!window.YT) {
      const scriptId = "youtube-iframe-api-script";
      let scriptTag = document.getElementById(scriptId);
      
      if (!scriptTag) {
        const tag = document.createElement("script");
        tag.id = scriptId;
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName("script")[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      }
      
      const oldReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (oldReady) oldReady();
        window.dispatchEvent(new Event('YTAPIReady'));
      };
      
      window.addEventListener('YTAPIReady', handleAPIReady);
    } else if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.addEventListener('YTAPIReady', handleAPIReady);
    }

    return () => {
      clearInterval(checkIntervalRef.current);
      window.removeEventListener('YTAPIReady', handleAPIReady);
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [videoId]);

  const initPlayer = () => {
    if (!videoId || playerRef.current) return;
    try {
      playerRef.current = new window.YT.Player(`yt-player-${videoId}`, {
        videoId: videoId,
        events: { onStateChange: handlePlayerStateChange },
      });
    } catch (error) {
      console.error("Gagal memulakan YT Player:", error);
    }
  };

  const handlePlayerStateChange = (event) => {
    if (event.data === window.YT.PlayerState.PLAYING) {
      setIsPlaying(true);
      startProgressCheck();
    } else {
      setIsPlaying(false);
      clearInterval(checkIntervalRef.current);
    }
    if (event.data === window.YT.PlayerState.ENDED) {
      handleVideoComplete();
    }
  };

  const startProgressCheck = () => {
    clearInterval(checkIntervalRef.current);
    checkIntervalRef.current = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        const currentTime = playerRef.current.getCurrentTime();
        const duration = playerRef.current.getDuration();
        if (duration > 0 && (currentTime / duration) >= 0.9) {
          handleVideoComplete();
        }
      }
    }, 2000);
  };

  const handleVideoComplete = () => {
    clearInterval(checkIntervalRef.current);
    if (!isCompleted) onCompleted();
  };

  if (!videoId) {
    return (
      <div className="p-6 text-center bg-amber-50 border border-amber-200 rounded-3xl">
        <p className="text-amber-700 font-bold text-sm">
          🎬 Tiada video dijumpai. Sila klik butang di bawah untuk melangkau dan membuka misi seterusnya!
        </p>
        <Button onClick={onCompleted} className="mt-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black rounded-xl shadow-sm px-6 py-5 border-0">
          Selesai Tonton & Panjat Pokok 🚀
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="relative aspect-video rounded-[2rem] overflow-hidden border-4 border-[#5C3A21] shadow-xl bg-stone-900">
        <div id={`yt-player-${videoId}`} className="w-full h-full" />
      </div>

      {isCompleted ? (
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-emerald-50 border border-emerald-200 p-5 rounded-[1.5rem] flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-emerald-500 rounded-2xl text-white"><CheckCircle2 className="w-6 h-6" /></div>
          <div className="flex-1">
            <h4 className="font-bold text-emerald-800 text-base">Syabas, Video Selesai! 🍃</h4>
            <p className="text-emerald-600 text-xs font-medium">Misi tontonan video telah diselesaikan.</p>
          </div>
          <div className="bg-lime-100 border border-lime-200 px-4 py-2 rounded-xl text-lime-700 font-black text-sm shadow-sm flex items-center gap-1.5 animate-bounce">
            <Leaf className="w-4 h-4 fill-lime-500" /> +{xpEarned || 10} XP
          </div>
        </motion.div>
      ) : (
        <div className="bg-sky-50 border border-sky-100 p-4 rounded-2xl flex items-center gap-3">
          <Tv className="w-5 h-5 text-sky-600 animate-pulse shrink-0" />
          <p className="text-sky-800 text-xs sm:text-sm font-medium">
            Tonton video ini sehingga tamat untuk membuka kunci dahan misi yang seterusnya! 🌿
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT: LessonPage
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
Your tone must be exceptionally warm, encouraging, cheerful, and affectionate. Use words of encouragement frequently.
Address the student directly and personally by their nickname "${studentNickname}" naturally throughout the lesson.

Generate a concise, highly engaging lesson (700-1000 words max). Use short paragraphs, clear subheadings (###), and bold key terms.
Return JSON schema matching: { "lesson_markdown": "string", "summary": "string", "keywords": ["string"] }
`;

const MINDMAP_PROMPT = (summary, keywords, lang) => `
${BASE_SYSTEM_PROMPT}
${FORMAT_CONSTRAINTS[lang]}
Based on Summary: "${summary}" and Keywords: ${JSON.stringify(keywords)}, create a mind map structure.
Return JSON schema matching: [{ "label": "string", "children": ["string"] }]
`;

const MINDMAP_SCHEMA = {
  type: "array",
  items: {
    type: "object",
    properties: { label: { type: "string" }, children: { type: "array", items: { type: "string" } } },
    required: ["label", "children"]
  }
};

const FLASHCARD_SCHEMA = {
  type: "array",
  items: {
    type: "object",
    properties: { front: { type: "string" }, back: { type: "string" } },
    required: ["front", "back"]
  }
};

const QUIZ_SCHEMA = {
  type: "array",
  items: {
    type: "object",
    properties: {
      question: { type: "string" },
      options: { type: "array", items: { type: "string" } },
      correct_answer: { type: "string" },
      explanation: { type: "string" }
    },
    required: ["question", "options", "correct_answer", "explanation"]
  }
};

const safeJsonParse = (str, fallback = []) => {
  if (!str) return fallback;
  try {
    let cleanStr = str;
    if (typeof str === "string") {
      cleanStr = str.replace(/^```json/i, "").replace(/^```/i, "").replace(/```$/i, "").trim();
    }
    return JSON.parse(cleanStr);
  } catch (e) {
    console.error("Gagal parse JSON:", e, "Raw data:", str);
    return fallback;
  }
};

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

  const [uiError, setUiError] = useState(null);

  const [explanation, setExplanation] = useState("");
  const [metaData, setMetaData] = useState({ summary: "", keywords: [] });
  const [flashcards, setFlashcards] = useState(null);
  const [mindMap, setMindMap] = useState(null);
  const [rawBankQuestions, setRawBankQuestions] = useState([]);

  const [activeTab, setActiveTab] = useState("map"); 
  const [progressState, setProgressState] = useState({
    video_completed: false,
    lesson_completed: false,
    flashcard_completed: false,
    mindmap_completed: false,
    quiz_completed: false,
    current_stage: "video",
    xp_earned: 0
  });

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
    return "Sahabat";
  };

  useEffect(() => {
    let isMounted = true;
    const initializeLesson = async () => {
      try {
        const [sub, top, user] = await Promise.all([
          base44.entities.Subject.get(subjectId),
          base44.entities.Topic.get(topicId),
          base44.auth.me(),
        ]);
        
        if (!isMounted) return;
        setSubject(sub);
        setTopic(top);
        setStudentNickname(tentukanPanggilanMesra(user, top?.form_level));
        setIsPremium(user?.is_premium || user?.profile?.is_premium || false);

        const allQuizBanks = await base44.entities.Quiz.filter({});
        if (isMounted && allQuizBanks?.length > 0) {
          const namaTopikSemasa = top.name.toLowerCase().trim();
          const foundBank = allQuizBanks.find(b => {
            const nameCsv = (b.topic_name || "").toLowerCase().trim();
            return nameCsv.includes(namaTopikSemasa) || namaTopikSemasa.includes(nameCsv);
          });
          if (foundBank) {
            setRawBankQuestions(safeJsonParse(foundBank.questions_json, []));
          }
        }

        const cachedSessions = await base44.entities.StudySession.filter(
          { student_id: user.id, topic_id: topicId },
          "-created_date",
          1
        );

        if (isMounted && cachedSessions.length > 0) {
          const session = cachedSessions[0];
          setSessionId(session.id);
          sessionRef.current = session.id;
          
          setProgressState({
            video_completed: session.video_completed || false,
            lesson_completed: session.lesson_completed || false,
            flashcard_completed: session.flashcard_completed || false,
            mindmap_completed: session.mindmap_completed || false,
            quiz_completed: session.quiz_completed || false,
            current_stage: session.current_stage || "video",
            xp_earned: session.xp_earned || 0
          });

          if (session.ai_explanation) {
            const parsed = safeJsonParse(session.ai_explanation, null);
            if (parsed) {
              setExplanation(parsed.lesson_markdown || "");
              setMetaData({ summary: parsed.summary || "", keywords: parsed.keywords || [] });
            }
            if (session.mindmap_json) setMindMap(safeJsonParse(session.mindmap_json, null));
          }
        }
      } catch (err) {
        console.error("Gagal memulihkan progress", err);
        if (isMounted) setUiError("Gagal memuat turun data topik. Sila muat semula halaman.");
      } finally {
        if (isMounted) {
          studyStartRef.current = Date.now();
          setLoading(false);
        }
      }
    };

    initializeLesson();
    return () => { isMounted = false; };
  }, [subjectId, topicId]);

  const recordStudyTime = async () => {
    const sId = sessionRef.current;
    if (!sId || !studyStartRef.current) return;
    const mins = Math.max(1, Math.round((Date.now() - studyStartRef.current) / 60000));
    try { await base44.entities.StudySession.update(sId, { duration_minutes: mins }); } catch (err) {}
  };

  useEffect(() => { return () => { recordStudyTime(); }; }, []);

  const getLanguageMode = useCallback(() => subject?.name?.toLowerCase().includes("english") ? "en" : "ms", [subject]);
  
  const triggerConfetti = () => {
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ["#10b981", "#84cc16", "#f59e0b", "#d97706"] });
  };

  const updateStageProgress = useCallback(async (stageId, nextStage, xpAwarded) => {
    let currentSessionId = sessionRef.current;
    
    setProgressState(prev => {
      const updatedState = {
        ...prev,
        [`${stageId}_completed`]: true,
        current_stage: prev[`${nextStage}_completed`] ? prev.current_stage : nextStage,
        xp_earned: prev.xp_earned + xpAwarded
      };
      
      if (currentSessionId) {
        base44.entities.StudySession.update(currentSessionId, updatedState).catch(console.error);
      }
      return updatedState;
    });
    triggerConfetti();
  }, []);

  const handleVideoStageCompleted = useCallback(async () => {
    if (progressState.video_completed) {
      setActiveTab("map");
      return;
    }

    let currentId = sessionRef.current;
    if (!currentId) {
      try {
        const user = await base44.auth.me();
        const newSession = await base44.entities.StudySession.create({
          student_id: user.id, subject_id: subjectId, topic_id: topicId,
          topic_name: topic.name, subject_name: subject.name, duration_minutes: 0,
          ...progressState, video_completed: true, current_stage: "lesson", xp_earned: 10
        });
        
        setSessionId(newSession.id);
        sessionRef.current = newSession.id;
        setProgressState(p => ({ ...p, video_completed: true, current_stage: "lesson", xp_earned: 10 }));
        triggerConfetti();
        setActiveTab("map");
        return;
      } catch (err) { 
        setUiError("Ralat semasa menyimpan kemajuan. Cuba sebentar lagi.");
        return;
      }
    }
    await updateStageProgress("video", "lesson", 10);
    setActiveTab("map");
  }, [progressState, subjectId, topicId, topic, subject, updateStageProgress]);

  const generateCoreLesson = async () => {
    if (explanation) {
      await updateStageProgress("lesson", "flashcard", 15);
      setActiveTab("map");
      return;
    }
    setStatus(p => ({ ...p, lesson: true }));
    setUiError(null);
    try {
      const lang = getLanguageMode();
      const response = await base44.integrations.Core.InvokeLLM({
        model: "gemini_3_flash", add_context_from_internet: true,
        prompt: LESSON_PROMPT(topic.name, subject.name, topic.form_level, lang, studentNickname),
        response_json_schema: {
          type: "object",
          properties: { lesson_markdown: { type: "string" }, summary: { type: "string" }, keywords: { type: "array", items: { type: "string" } } },
          required: ["lesson_markdown", "summary", "keywords"]
        }
      });

      if (!response || !response.lesson_markdown) throw new Error("AI gagal memulangkan teks nota.");

      setExplanation(response.lesson_markdown);
      setMetaData({ summary: response.summary, keywords: response.keywords });

      const nextStatePayload = {
        ...progressState, lesson_completed: true, current_stage: "flashcard",
        xp_earned: progressState.xp_earned + 15, ai_explanation: JSON.stringify(response)
      };

      const currentSessionId = sessionRef.current;
      if (currentSessionId) {
        await base44.entities.StudySession.update(currentSessionId, nextStatePayload);
      }
      setProgressState(nextStatePayload);
      
      base44.integrations.Core.InvokeLLM({
        model: "gemini_3_flash", prompt: MINDMAP_PROMPT(response.summary, response.keywords, lang),
        response_json_schema: MINDMAP_SCHEMA
      }).then(res => {
        if (res && Array.isArray(res)) {
          if (currentSessionId) base44.entities.StudySession.update(currentSessionId, { mindmap_json: JSON.stringify(res) });
          setMindMap(res);
        }
      }).catch(err => console.error("Ralat membina MindMap latar", err));

      triggerConfetti();
      setActiveTab("map");
    } catch (e) { 
      setUiError("Aduh! Otan kepenatan. Sila cuba tekan butang jana sekali lagi. 🦧");
    } finally { setStatus(p => ({ ...p, lesson: false })); }
  };

  const handleFlashcardStageCompleted = async () => {
    await updateStageProgress("flashcard", "mindmap", 15);
    setActiveTab("map");
  };

  const handleMindMapStageCompleted = async () => {
    await updateStageProgress("mindmap", "quiz", 15);
    setActiveTab("map");
  };

  const loadFlashcardsOnDemand = async () => {
    setActiveTab("flashcard");
    if (flashcards && flashcards.length > 0) return;
    setStatus(p => ({ ...p, flashcards: true }));
    setUiError(null);
    try {
      if (rawBankQuestions && rawBankQuestions.length > 0) {
        const mapped = shuffleArray(rawBankQuestions).slice(0, 5).map(q => ({
          front: q.question, back: `${q.correct_answer}\n\n${q.explanation || ""}`
        }));
        setFlashcards(mapped);
        return;
      }
      const lang = getLanguageMode();
      const res = await base44.integrations.Core.InvokeLLM({
        model: "gemini_3_flash",
        prompt: `Based on summary: "${metaData.summary || topic.name}", generate 5 primary flashcards in ${lang === 'en' ? 'English' : 'Bahasa Melayu'}.`,
        response_json_schema: FLASHCARD_SCHEMA
      });
      if (!res || !Array.isArray(res)) throw new Error("Format kad memori salah.");
      setFlashcards(res);
    } catch (err) {
      setUiError("Gagal menyusun kad sakti. Sistem menyediakan kad sandaran.");
      setFlashcards([{ front: "Jom mulakan kuiz?", back: "Tekan sedia!" }]);
    } finally { setStatus(p => ({ ...p, flashcards: false })); }
  };

  const loadMindMapOnDemand = async () => {
    setActiveTab("mindmap");
    if (mindMap && mindMap.length > 0) return;
    setStatus(p => ({ ...p, mindmap: true }));
    setUiError(null);
    try {
      const lang = getLanguageMode();
      const res = await base44.integrations.Core.InvokeLLM({
        model: "gemini_3_flash", 
        prompt: MINDMAP_PROMPT(metaData.summary || topic.name, metaData.keywords, lang),
        response_json_schema: MINDMAP_SCHEMA
      });
      if (!res || !Array.isArray(res)) throw new Error("Gagal melukis peta minda.");
      setMindMap(res);
    } catch (e) {
      setUiError("Ops! Peta minda gagal dijana. Sila cuba sekali lagi.");
    } finally { setStatus(p => ({ ...p, mindmap: false })); }
  };

  const runQuizGeneration = async (numQ) => {
    await recordStudyTime();
    setStatus(p => ({ ...p, quiz: true }));
    setUiError(null);
    const diff = numQ >= 20 ? "hard" : "medium";
    
    let currentSessionId = sessionRef.current;

    try {
      // PENCEGAHAN SEKATAN: Jika session belum ada, kita jana session on-the-fly untuk mengelakkan ralat kekunci asing DB
      if (!currentSessionId) {
        const user = await base44.auth.me();
        const newSession = await base44.entities.StudySession.create({
          student_id: user.id, 
          subject_id: subjectId, 
          topic_id: topicId,
          topic_name: topic.name, 
          subject_name: subject.name, 
          duration_minutes: 0,
          ...progressState, 
          current_stage: "quiz"
        });
        currentSessionId = newSession.id;
        setSessionId(newSession.id);
        sessionRef.current = newSession.id;
      }

      if (rawBankQuestions && rawBankQuestions.length > 0) {
        const pool = shuffleArray(rawBankQuestions).slice(0, numQ);
        const quiz = await base44.entities.Quiz.create({
          session_id: currentSessionId, 
          topic_name: topic.name, 
          subject_name: subject?.name,
          questions_json: JSON.stringify(pool), 
          difficulty: diff, 
          num_questions: pool.length
        });
        
        await base44.entities.StudySession.update(currentSessionId, { quiz_completed: true, current_stage: "quiz" });
        navigate(`/quiz/${quiz.id}`);
        return;
      }
      
      const lang = getLanguageMode();
      const res = await base44.integrations.Core.InvokeLLM({
        model: "gemini_3_flash",
        prompt: `Based on topic: "${topic.name}", generate ${numQ} MCQs in ${lang === 'en' ? 'English' : 'Bahasa Melayu'}.`,
        response_json_schema: QUIZ_SCHEMA
      });
      
      if (res && Array.isArray(res)) {
        const quiz = await base44.entities.Quiz.create({
          session_id: currentSessionId, 
          topic_name: topic.name, 
          subject_name: subject?.name,
          questions_json: JSON.stringify(res.slice(0, numQ)), 
          difficulty: diff, 
          num_questions: res.length
        });
        
        await base44.entities.StudySession.update(currentSessionId, { quiz_completed: true, current_stage: "quiz" });
        navigate(`/quiz/${quiz.id}`);
      } else {
        throw new Error("Soalan kuiz gagal dijana oleh LLM.");
      }
    } catch (e) { 
      console.error("🚨 Otan Error Log -> Kegagalan Penjanaan Kuiz:", e);
      setUiError("Kuiz Boss gagal diseru! Sila tarik nafas dan cuba lagi.");
    } finally { 
      setStatus(p => ({ ...p, quiz: false })); 
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 bg-[#FAFAF7]">
        <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
          <Leaf className="w-12 h-12 text-emerald-500" />
        </motion.div>
        <p className="text-sm font-bold text-emerald-700/60 uppercase tracking-widest">Merintis laluan misi...</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-md md:max-w-2xl lg:max-w-4xl mx-auto space-y-6 pb-28 font-sans bg-[#FAFAF7] min-h-screen">
      
      {/* HEADER BAR (Nature Aesthetic) */}
      <div className="bg-white rounded-[1.5rem] p-4 border border-emerald-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-2 z-40 backdrop-blur-md bg-white/90">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link to={`/study/${subjectId}`} className="p-2.5 bg-[#F3EFE6] rounded-xl text-stone-600 hover:bg-[#E3D9C6] transition-transform active:scale-95 shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="min-w-0">
            <h2 className="text-xs font-black text-emerald-600 uppercase tracking-wider flex items-center gap-1">
              <Compass className="w-3.5 h-3.5" /> {subject?.name}
            </h2>
            <h1 className="text-sm sm:text-base font-black truncate text-stone-800">Misi: {topic?.name}</h1>
          </div>
        </div>

        <div className="bg-gradient-to-r from-lime-400 to-emerald-500 px-4 py-2 rounded-xl text-white font-black text-xs sm:text-sm shadow-sm flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
          <Leaf className="w-4 h-4 fill-lime-200 text-lime-200" /> {progressState.xp_earned} XP
        </div>
      </div>

      {/* ERROR TOAST NOTIFICATION */}
      <AnimatePresence>
        {uiError && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} 
            className="bg-red-50 border border-red-200 p-4 rounded-[1.5rem] flex items-start gap-3 shadow-sm">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-bold text-red-800">Alamak, ada masalah teknikal!</p>
              <p className="text-xs text-red-600 font-medium">{uiError}</p>
            </div>
            <button onClick={() => setUiError(null)} className="text-red-400 hover:text-red-600 font-bold text-xs">Tutup</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* STAGE CONTAINER LAYER */}
      <AnimatePresence mode="wait">
        
        {/* VIEW 1: MAP (LessonProgress Tree) */}
        {activeTab === "map" && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}>
            <LessonProgress 
              steps={{
                video: progressState.video_completed,
                lesson: progressState.lesson_completed,
                flashcard: progressState.flashcard_completed,
                mindmap: progressState.mindmap_completed,
                quiz: progressState.quiz_completed,
              }} 
              onStepClick={(stepKey) => {
                if (stepKey === "video") setActiveTab("video");
                if (stepKey === "lesson") setActiveTab("lesson");
                if (stepKey === "flashcard") loadFlashcardsOnDemand();
                if (stepKey === "mindmap") loadMindMapOnDemand();
                if (stepKey === "quiz") setActiveTab("quiz");
              }}
            />
          </motion.div>
        )}

        {/* STAGE 1: VIDEO */}
        {activeTab === "video" && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="bg-white rounded-[2rem] p-6 border border-emerald-100 shadow-lg space-y-6">
            <div className="flex justify-between items-center border-b border-stone-100 pb-4">
              <h3 className="text-lg font-black text-stone-800 flex items-center gap-2">🎬 Dahan 1: Video Guru</h3>
              <Button size="sm" variant="ghost" onClick={() => setActiveTab("map")} className="rounded-xl text-xs font-bold text-stone-500 hover:bg-stone-50">Tutup ✖</Button>
            </div>
            <YouTubeLesson videoUrl={topic?.video_url} isCompleted={progressState.video_completed} xpEarned={10} onCompleted={handleVideoStageCompleted} />
            {progressState.video_completed && (
              <Button onClick={() => setActiveTab("map")} className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 font-black rounded-xl shadow-md text-white border-0 transition-colors">
                Kembali Memanjat Pokok 🌳
              </Button>
            )}
          </motion.div>
        )}

        {/* STAGE 2: NOTA AI */}
        {activeTab === "lesson" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-[2rem] p-6 border border-emerald-100 shadow-lg space-y-6">
            <div className="flex justify-between items-center border-b border-stone-100 pb-4">
              <h3 className="text-lg font-black text-stone-800 flex items-center gap-2">📖 Dahan 2: Nota Pintar AI</h3>
              <Button size="sm" variant="ghost" onClick={() => setActiveTab("map")} className="rounded-xl text-xs font-bold text-stone-500 hover:bg-stone-50">Tutup ✖</Button>
            </div>
            <div className="flex items-center justify-between bg-stone-50 p-3 rounded-2xl border border-stone-100">
              <span className="text-xs font-bold text-stone-600">Dengar penceritaan Otan:</span>
              {isPremium ? (
                <VoicePlayer text={explanation || "Sila jana nota dahulu"} language={getLanguageMode() === "en" ? "en" : "ms"} />
              ) : (
                <span className="text-[10px] text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg font-bold border border-amber-200">🔒 Audio Premium</span>
              )}
            </div>
            <div className="prose prose-sm max-w-none text-stone-700 max-h-[400px] overflow-y-auto p-4 border border-emerald-50 rounded-2xl bg-[#FAFAF7] leading-relaxed shadow-inner">
              {explanation ? <LessonContent content={explanation} /> : (
                <div className="text-center py-12 font-bold text-stone-400 text-xs">Sila klik butang di bawah untuk membuka kunci Jurnal Ilmu Otan!</div>
              )}
            </div>
            <Button onClick={generateCoreLesson} disabled={status.lesson} className="w-full h-14 bg-gradient-to-r from-lime-500 to-emerald-600 font-black text-white rounded-xl shadow-sm border-0">
              {status.lesson ? <><Loader2 className="w-5 h-5 animate-spin mr-2"/> Otan sedang menulis... 🦧</> : explanation ? "Tanda Selesai & Ambil +15 XP! 🍃" : "Buka Misi Nota Pintar ✨"}
            </Button>
          </motion.div>
        )}

        {/* STAGE 3: FLASHCARD */}
        {activeTab === "flashcard" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-[2rem] p-6 border border-emerald-100 shadow-lg space-y-6">
            <div className="flex justify-between items-center border-b border-stone-100 pb-4">
              <h3 className="text-lg font-black text-stone-800 flex items-center gap-2">🃏 Dahan 3: Kad Memori</h3>
              <Button size="sm" variant="ghost" onClick={() => setActiveTab("map")} className="rounded-xl text-xs font-bold text-stone-500 hover:bg-stone-50">Tutup ✖</Button>
            </div>
            {status.flashcards ? (
              <div className="text-center py-12 text-xs font-bold text-emerald-600"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-emerald-400" /> Otan menyusun kad daun...</div>
            ) : (
              <>
                <Flashcards flashcards={flashcards || []} />
                <Button onClick={handleFlashcardStageCompleted} className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl border-0 shadow-sm transition-colors">
                  Selesai Main Kad & Memanjat! 🌳
                </Button>
              </>
            )}
          </motion.div>
        )}

        {/* STAGE 4: MINDMAP */}
        {activeTab === "mindmap" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-[2rem] p-6 border border-emerald-100 shadow-lg space-y-6">
            <div className="flex justify-between items-center border-b border-stone-100 pb-4">
              <h3 className="text-lg font-black text-stone-800 flex items-center gap-2">🧠 Dahan 4: Peta Minda</h3>
              <Button size="sm" variant="ghost" onClick={() => setActiveTab("map")} className="rounded-xl text-xs font-bold text-stone-500 hover:bg-stone-50">Tutup ✖</Button>
            </div>
            {status.mindmap ? (
              <div className="text-center py-12 text-xs font-bold text-emerald-600"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-emerald-400" /> Melukis peta hutan...</div>
            ) : (
              <>
                <div className="min-h-[250px] bg-[#FAFAF7] rounded-2xl p-4 border border-emerald-50 shadow-inner overflow-x-auto">
                  <MindMap mindMap={{ central_topic: topic?.name || "Topik Utama", branches: mindMap || [] }} />
                </div>
                <Button onClick={handleMindMapStageCompleted} className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl border-0 shadow-sm transition-colors">
                  Selesai Teroka Peta! 🗺️
                </Button>
              </>
            )}
          </motion.div>
        )}

        {/* STAGE 5: FINAL BOSS CHALLENGE */}
        {activeTab === "quiz" && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-gradient-to-br from-amber-100 via-orange-50 to-amber-100 rounded-[2rem] p-6 border border-amber-200 shadow-xl relative overflow-hidden">
            <Sprout className="absolute -bottom-6 -right-6 w-32 h-32 text-amber-500/10 rotate-12 -z-0" />
            <div className="relative z-10 space-y-5">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-amber-950 flex items-center gap-2">⚔️ Puncak Pokok: Kuiz Boss!</h3>
                <Button size="sm" variant="ghost" onClick={() => setActiveTab("map")} className="rounded-xl text-xs font-bold text-amber-800 hover:bg-amber-200/50">Tutup ✖</Button>
              </div>
              <p className="text-xs sm:text-sm text-amber-800 font-medium leading-relaxed">
                Hebatnya {studentNickname}! Anda hampir sampai di kemuncak pokok ilmu ini. Sekarang, jom tewaskan cabaran terakhir ini untuk menawan dahan ini! 🏆
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3">
                <Button onClick={() => runQuizGeneration(10)} disabled={status.quiz} className="bg-amber-500 hover:bg-amber-600 text-white h-16 text-sm font-black rounded-xl w-full border-0 shadow-sm transition-colors">
                  {status.quiz ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Play className="w-4 h-4 mr-1 fill-current" />} Cabaran Pantas (10 Soalan)
                </Button>
                <Button onClick={() => runQuizGeneration(20)} disabled={status.quiz} className="bg-orange-500 hover:bg-orange-600 text-white h-16 text-sm font-black rounded-xl w-full border-0 shadow-sm transition-colors">
                  {status.quiz ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Trophy className="w-4 h-4 mr-1" />} Ujian Boss Padu (20 Soalan)
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}