// src/pages/LessonPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Sparkles, Play, Loader2, Trophy, BookOpen, Layers, GitFork, Lock, Award, Compass, Tv, Check, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

import LessonContent from "@/components/lesson/LessonContent";
import VoicePlayer from "@/components/lesson/VoicePlayer";
import Flashcards from "@/components/lesson/Flashcards";
import MindMap from "@/components/lesson/MindMap";

// ============================================================================
// MOCKUP COMPONENT 1: YouTubeLesson (Disatukan di dalam fail utama)
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
    // Memuat turun YouTube API secara dinamik
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    window.onYouTubeIframeAPIReady = () => { initPlayer(); };
    if (window.YT && window.YT.Player) { initPlayer(); }

    return () => { clearInterval(checkIntervalRef.current); };
  }, [videoId]);

  const initPlayer = () => {
    if (!videoId || playerRef.current) return;
    playerRef.current = new window.YT.Player(`yt-player-${videoId}`, {
      videoId: videoId,
      events: { onStateChange: handlePlayerStateChange },
    });
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
      <div className="p-6 text-center bg-amber-50 border-2 border-dashed border-amber-200 rounded-3xl">
        <p className="text-amber-700 font-bold text-sm">
          🎬 Jom mulakan pengembaraan! Sila klik butang di bawah untuk melangkau video mockup dan membuka Nota Pintar!
        </p>
        <Button onClick={onCompleted} className="mt-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black rounded-full shadow-md px-6 py-5 border-b-4 border-orange-700">
          Selesai Tonton & Unlock Nota 🚀
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="relative aspect-video rounded-[2rem] overflow-hidden border-4 border-cyan-400 shadow-xl bg-slate-900">
        <div id={`yt-player-${videoId}`} className="w-full h-full" />
      </div>

      {isCompleted ? (
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-emerald-50 border-2 border-emerald-200 p-5 rounded-3xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-emerald-500 rounded-2xl text-white"><CheckCircle2 className="w-6 h-6" /></div>
          <div className="flex-1">
            <h4 className="font-bold text-emerald-800 text-base">Syabas, Tugasan Selesai! 🎉</h4>
            <p className="text-emerald-600 text-xs font-medium">Misi tontonan video telah diselesaikan.</p>
          </div>
          <div className="bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-2 rounded-2xl text-white font-bold text-sm shadow-md flex items-center gap-1.5 animate-bounce">
            <Award className="w-4 h-4" /> +{xpEarned || 10} XP
          </div>
        </motion.div>
      ) : (
        <div className="bg-cyan-50 border-2 border-cyan-100 p-4 rounded-2xl flex items-center gap-3">
          <Tv className="w-5 h-5 text-cyan-600 animate-pulse shrink-0" />
          <p className="text-cyan-800 text-xs sm:text-sm font-medium">
            Tonton video pembelajaran ini sehingga 90% atau klik butang selesaikan di atas untuk membuka peringkat Nota Pintar! 🌟
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MOCKUP COMPONENT 2: LearningPath (Duolingo Style Zigzag Path)
// ============================================================================
function LearningPath({ stages, currentStage, progressState, activeTab, onSelectStage }) {
  const getStageStatus = (stageId) => {
    if (stageId === "video") return "unlocked";
    if (stageId === "lesson") return progressState.video_completed ? "unlocked" : "locked";
    if (stageId === "flashcard") return progressState.lesson_completed ? "unlocked" : "locked";
    if (stageId === "mindmap") return progressState.flashcard_completed ? "unlocked" : "locked";
    if (stageId === "quiz") {
      return (progressState.video_completed && progressState.lesson_completed && progressState.flashcard_completed && progressState.mindmap_completed) ? "unlocked" : "locked";
    }
    return "locked";
  };

  return (
    <div className="relative flex flex-col items-center py-8 max-w-md mx-auto">
      {/* Garis Vertikal Latar Belakang Laluan Misi */}
      <div className="absolute top-12 bottom-12 w-3 bg-gradient-to-b from-cyan-200 via-purple-200 to-orange-200 rounded-full -z-10" />

      {stages.map((stage, index) => {
        const status = getStageStatus(stage.id);
        const isCompleted = progressState[`${stage.id}_completed`] || false;
        const isCurrentActiveStage = currentStage === stage.id;
        const sideOffset = index % 2 === 0 ? "sm:translate-x-12" : "sm:-translate-x-12";

        const themeColors = {
          video: "from-cyan-400 to-blue-500 border-cyan-600 shadow-cyan-200",
          lesson: "from-emerald-400 to-teal-500 border-emerald-600 shadow-emerald-200",
          flashcard: "from-purple-400 to-indigo-500 border-purple-600 shadow-purple-200",
          mindmap: "from-pink-400 to-rose-500 border-pink-600 shadow-pink-200",
          quiz: "from-amber-400 to-orange-500 border-amber-600 shadow-amber-200",
        };

        return (
          <div key={stage.id} className={`w-full flex flex-col items-center my-6 relative ${sideOffset}`}>
            {isCurrentActiveStage && status === "unlocked" && !isCompleted && (
              <motion.div animate={{ y: [-5, 3, -5] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }} className="absolute -top-10 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-md z-20 border border-orange-300 tracking-wider whitespace-nowrap">
                MISI BARU! 🎯
              </motion.div>
            )}

            <motion.button
              whileHover={status === "unlocked" ? { scale: 1.1, y: -4 } : {}}
              whileTap={status === "unlocked" ? { scale: 0.95 } : {}}
              onClick={() => status === "unlocked" && onSelectStage(stage.id)}
              disabled={status === "locked"}
              className={`
                w-20 h-20 rounded-full flex flex-col items-center justify-center border-b-8 relative transition-all duration-300 shadow-xl
                ${status === "unlocked" 
                  ? `bg-gradient-to-b ${themeColors[stage.id]} text-white active:border-b-0 active:translate-y-[6px]` 
                  : "bg-slate-200 border-slate-400 text-slate-400 cursor-not-allowed shadow-none"
                }
              `}
            >
              {status === "locked" ? (
                <Lock className="w-6 h-6" />
              ) : isCompleted ? (
                <div className="absolute -top-1 -right-1 bg-emerald-500 text-white p-1 rounded-full border-2 border-white shadow-md">
                  <Check className="w-3.5 h-3.5 stroke-[4]" />
                </div>
              ) : null}

              {status !== "locked" && <span className="text-3xl filter drop-shadow-sm">{stage.icon}</span>}
            </motion.button>

            <div className="text-center mt-2 bg-white/90 backdrop-blur-sm py-1 px-4 rounded-2xl border border-slate-100 shadow-sm max-w-[150px]">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Stage {index + 1}</p>
              <p className={`text-xs font-black truncate ${status === 'locked' ? 'text-slate-400' : 'text-slate-800'}`}>
                {stage.title}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// 3. MAIN COMPONENT LAYER: LessonPage
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

const safeJsonParse = (str, fallback = []) => {
  try { return str ? JSON.parse(str) : fallback; } catch (e) { return fallback; }
};

const shuffleArray = (array) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

const STAGES = [
  { id: "video", title: "Video Guru", icon: "🎬" },
  { id: "lesson", title: "Nota Pintar", icon: "📖" },
  { id: "flashcard", title: "Kad Memori", icon: "🃏" },
  { id: "mindmap", title: "Peta Minda", icon: "🧠" },
  { id: "quiz", title: "Boss Quiz", icon: "⚔️" }
];

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

  // GAMIFICATION TRACKING LAYER
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

  const getLanguageMode = () => subject?.name?.toLowerCase().includes("english") ? "en" : "ms";
  
  const triggerConfetti = () => {
    confetti({ particleCount: 140, spread: 70, origin: { y: 0.6 }, colors: ["#06b6d4", "#10b981", "#fbbf24", "#f43f5e"] });
  };

  const updateStageProgress = async (stageId, nextStage, xpAwarded) => {
    const updatedState = {
      ...progressState,
      [`${stageId}_completed`]: true,
      current_stage: progressState[`${nextStage}_completed`] ? progressState.current_stage : nextStage,
      xp_earned: progressState.xp_earned + xpAwarded
    };

    setProgressState(updatedState);
    triggerConfetti();

    if (sessionId) {
      try { await base44.entities.StudySession.update(sessionId, updatedState); } catch (e) { console.error(e); }
    }
  };

  const handleVideoStageCompleted = async () => {
    if (progressState.video_completed) {
      setActiveTab("map");
      return;
    }

    let currentId = sessionId;
    if (!currentId) {
      try {
        const user = await base44.auth.me();
        const newSession = await base44.entities.StudySession.create({
          student_id: user.id, subject_id: subjectId, topic_id: topicId,
          topic_name: topic.name, subject_name: subject.name, duration_minutes: 0,
          ...progressState, video_completed: true, current_stage: "lesson", xp_earned: 10
        });
        setSessionId(newSession.id);
        setProgressState(p => ({ ...p, video_completed: true, current_stage: "lesson", xp_earned: 10 }));
        triggerConfetti();
        setActiveTab("map");
        return;
      } catch (err) { console.error(err); }
    }

    await updateStageProgress("video", "lesson", 10);
    setActiveTab("map");
  };

  const generateCoreLesson = async () => {
    if (explanation) {
      await updateStageProgress("lesson", "flashcard", 15);
      setActiveTab("map");
      return;
    }

    setStatus(p => ({ ...p, lesson: true }));
    try {
      const lang = getLanguageMode();
      const response = await base44.integrations.Core.InvokeLLM({
        model: "gemini_3_flash", 
        add_context_from_internet: true,
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

      setExplanation(response.lesson_markdown);
      setMetaData({ summary: response.summary, keywords: response.keywords });

      const nextStatePayload = {
        ...progressState, lesson_completed: true, current_stage: "flashcard",
        xp_earned: progressState.xp_earned + 15, ai_explanation: JSON.stringify(response)
      };

      await base44.entities.StudySession.update(sessionId, nextStatePayload);
      setProgressState(nextStatePayload);
      
      base44.integrations.Core.InvokeLLM({
        model: "gemini_3_flash", prompt: MINDMAP_PROMPT(response.summary, response.keywords, lang),
      }).then(res => {
        if (res && Array.isArray(res)) {
          base44.entities.StudySession.update(sessionId, { mindmap_json: JSON.stringify(res) });
          setMindMap(res);
        }
      });

      triggerConfetti();
      setActiveTab("map");
    } catch (e) { console.error(e); } finally { setStatus(p => ({ ...p, lesson: false })); }
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
        prompt: `Based on summary: "${metaData.summary || topic.name}", generate 5 primary flashcards in ${lang === 'en' ? 'English' : 'Bahasa Melayu'}. Return JSON: [{ "front": "string", "back": "string" }]`,
      });
      setFlashcards(res && Array.isArray(res) ? res : []);
    } catch (err) {
      setFlashcards([{ front: "Jom mulakan kuiz?", back: "Tekan sedia!" }]);
    } finally { setStatus(p => ({ ...p, flashcards: false })); }
  };

  const loadMindMapOnDemand = async () => {
    setActiveTab("mindmap");
    if (mindMap && mindMap.length > 0) return;
    setStatus(p => ({ ...p, mindmap: true }));
    try {
      const lang = getLanguageMode();
      const res = await base44.integrations.Core.InvokeLLM({
        model: "gemini_3_flash", prompt: MINDMAP_PROMPT(metaData.summary || topic.name, metaData.keywords, lang),
      });
      if (res && Array.isArray(res)) setMindMap(res);
    } catch (e) {} finally { setStatus(p => ({ ...p, mindmap: false })); }
  };

  const runQuizGeneration = async (numQ) => {
    await recordStudyTime();
    setStatus(p => ({ ...p, quiz: true }));
    const diff = numQ >= 20 ? "hard" : "medium";

    try {
      if (rawBankQuestions && rawBankQuestions.length > 0) {
        const pool = shuffleArray(rawBankQuestions).slice(0, numQ);
        const quiz = await base44.entities.Quiz.create({
          session_id: sessionId, topic_name: topic.name, subject_name: subject?.name,
          questions_json: JSON.stringify(pool), difficulty: diff, num_questions: pool.length
        });
        await base44.entities.StudySession.update(sessionId, { quiz_completed: true, current_stage: "quiz" });
        navigate(`/quiz/${quiz.id}`);
        return;
      }
      
      const lang = getLanguageMode();
      const res = await base44.integrations.Core.InvokeLLM({
        model: "gemini_3_flash",
        prompt: `Based on topic: "${topic.name}", generate ${numQ} MCQs in ${lang === 'en' ? 'English' : 'Bahasa Melayu'}. Return JSON: [{ "question": "string", "options": ["string"], "correct_answer": "string", "explanation": "string" }]`,
      });
      
      if (res && Array.isArray(res)) {
        const quiz = await base44.entities.Quiz.create({
          session_id: sessionId, topic_name: topic.name, subject_name: subject?.name,
          questions_json: JSON.stringify(res.slice(0, numQ)), difficulty: diff, num_questions: res.length
        });
        await base44.entities.StudySession.update(sessionId, { quiz_completed: true, current_stage: "quiz" });
        navigate(`/quiz/${quiz.id}`);
      }
    } catch (e) { console.error(e); } finally { setStatus(p => ({ ...p, quiz: false })); }
  };

  const hitungProgressPeratusan = () => {
    const total = STAGES.length;
    let completedCount = 0;
    STAGES.forEach(s => { if (progressState[`${s.id}_completed`]) completedCount++; });
    return Math.round((completedCount / total) * 100);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="w-12 h-12 border-4 text-cyan-500 animate-spin mb-3" />
        <p className="text-slate-500 text-sm font-bold">Membuka Gerbang Dunia Pembelajaran... 🗺️</p>
      </div>
    );
  }

  const progressPercent = hitungProgressPeratusan();

  return (
    <div className="px-4 py-6 max-w-md md:max-w-2xl lg:max-w-4xl mx-auto space-y-6 pb-28 font-sans bg-slate-50/30 min-h-screen">
      
      {/* DUOLINGO STYLE HEADER BAR */}
      <div className="bg-white rounded-[2rem] p-4 border-4 border-slate-100 shadow-sm flex items-center justify-between gap-4 sticky top-2 z-40 backdrop-blur-md bg-white/90">
        <div className="flex items-center gap-3">
          <Link to={`/study/${subjectId}`} className="p-2.5 bg-slate-50 rounded-2xl border border-slate-200 hover:bg-slate-100 transition-all active:scale-95">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div className="min-w-0">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-wide flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-cyan-500" /> {subject?.name}
            </h2>
            <h1 className="text-base sm:text-lg font-black truncate text-slate-800">Misi: {topic?.name} 🌟</h1>
          </div>
        </div>

        <div className="bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-2 rounded-2xl text-white font-black text-xs sm:text-sm shadow-md flex items-center gap-1.5 border-b-4 border-orange-600">
          <Trophy className="w-4 h-4 fill-amber-200 text-amber-200" /> {progressState.xp_earned} XP
        </div>
      </div>

      {/* ADVENTURE PROGRESS SYSTEM BAR */}
      <div className="bg-white rounded-[2.5rem] p-6 border-4 border-slate-100 shadow-sm space-y-2">
        <div className="flex justify-between items-center text-xs font-black text-slate-500 uppercase tracking-wide">
          <span>Kemajuan Misi</span>
          <span className="text-cyan-600 font-extrabold text-sm">{progressPercent}% Selesai</span>
        </div>
        <div className="w-full bg-slate-100 h-5 rounded-full overflow-hidden p-1 border border-slate-200/60 shadow-inner">
          <motion.div initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 rounded-full" />
        </div>
      </div>

      {/* STAGE CONTAINER LAYER */}
      <AnimatePresence mode="wait">
        {activeTab === "map" && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}>
            <LearningPath 
              stages={STAGES} currentStage={progressState.current_stage} progressState={progressState} activeTab={activeTab}
              onSelectStage={(id) => {
                if (id === "video") setActiveTab("video");
                if (id === "lesson") setActiveTab("lesson");
                if (id === "flashcard") loadFlashcardsOnDemand();
                if (id === "mindmap") loadMindMapOnDemand();
                if (id === "quiz") setActiveTab("quiz");
              }}
            />
          </motion.div>
        )}

        {/* STAGE 1 INTERFACE: VIDEO */}
        {activeTab === "video" && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="bg-white rounded-[2.5rem] p-6 border-4 border-slate-100 shadow-xl space-y-6">
            <div className="flex justify-between items-center border-b-2 border-slate-100 pb-4">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">🎬 Stage 1: Video Pembelajaran</h3>
              <Button size="sm" variant="ghost" onClick={() => setActiveTab("map")} className="rounded-full text-xs font-bold text-slate-500">Peta Misi ✖</Button>
            </div>
            <YouTubeLesson videoUrl={topic?.video_url} isCompleted={progressState.video_completed} xpEarned={10} onCompleted={handleVideoStageCompleted} />
            {progressState.video_completed && (
              <Button onClick={() => setActiveTab("map")} className="w-full h-14 bg-gradient-to-r from-cyan-500 to-blue-600 font-black rounded-2xl shadow-lg border-b-4 border-blue-800 text-white">
                Kembali ke Laluan Misi 🚀
              </Button>
            )}
          </motion.div>
        )}

        {/* STAGE 2 INTERFACE: NOTA AI */}
        {activeTab === "lesson" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-[2.5rem] p-6 border-4 border-slate-100 shadow-xl space-y-6">
            <div className="flex justify-between items-center border-b-2 border-slate-100 pb-4">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">📖 Stage 2: Nota Pintar AI</h3>
              <Button size="sm" variant="ghost" onClick={() => setActiveTab("map")} className="rounded-full text-xs font-bold text-slate-500">Peta Misi ✖</Button>
            </div>
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <span className="text-xs font-bold text-slate-600">Dengar audio penceritaan:</span>
              {isPremium ? (
                <VoicePlayer text={explanation || "Sila jana nota dahulu"} language={getLanguageMode() === "en" ? "en" : "ms"} />
              ) : (
                <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-1 rounded-md font-bold">🔒 Premium Audio</span>
              )}
            </div>
            <div className="prose prose-sm max-w-none text-slate-700 max-h-[350px] overflow-y-auto p-3 border border-slate-100 rounded-xl bg-slate-50/50 leading-relaxed">
              {explanation ? <LessonContent content={explanation} /> : (
                <div className="text-center py-10 font-bold text-slate-400 text-xs">Sila klik butang di bawah untuk membuka kunci Nota Pintar daripada AI Tutor!</div>
              )}
            </div>
            <Button onClick={generateCoreLesson} disabled={status.lesson} className="w-full h-14 bg-gradient-to-r from-emerald-500 to-teal-600 font-black text-white rounded-2xl shadow-md border-b-4 border-teal-800">
              {status.lesson ? <><Loader2 className="w-5 h-5 animate-spin mr-2"/> Menulis Nota Ajaib... 🪄</> : explanation ? "Tanda Selesai & Ambil +15 XP! 🏆" : "Buka Misi Nota Pintar ✨"}
            </Button>
          </motion.div>
        )}

        {/* STAGE 3 INTERFACE: FLASHCARD */}
        {activeTab === "flashcard" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-[2.5rem] p-6 border-4 border-slate-100 shadow-xl space-y-6">
            <div className="flex justify-between items-center border-b-2 border-slate-100 pb-4">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">🃏 Stage 3: Kad Memori</h3>
              <Button size="sm" variant="ghost" onClick={() => setActiveTab("map")} className="rounded-full text-xs font-bold text-slate-500">Peta Misi ✖</Button>
            </div>
            {status.flashcards ? (
              <div className="text-center py-12 text-xs font-bold text-purple-600"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-purple-400" /> Menyusun kad sakti...</div>
            ) : (
              <>
                <Flashcards flashcards={flashcards || []} />
                <Button onClick={handleFlashcardStageCompleted} className="w-full h-14 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-black rounded-2xl border-b-4 border-indigo-800 shadow-md">
                  Selesai Main Kad & Seterusnya! 🚀
                </Button>
              </>
            )}
          </motion.div>
        )}

        {/* STAGE 4 INTERFACE: MINDMAP */}
        {activeTab === "mindmap" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-[2.5rem] p-6 border-4 border-slate-100 shadow-xl space-y-6">
            <div className="flex justify-between items-center border-b-2 border-slate-100 pb-4">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">🧠 Stage 4: Peta Minda</h3>
              <Button size="sm" variant="ghost" onClick={() => setActiveTab("map")} className="rounded-full text-xs font-bold text-slate-500">Peta Misi ✖</Button>
            </div>
            {status.mindmap ? (
              <div className="text-center py-12 text-xs font-bold text-blue-600"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-400" /> Melukis peta minda...</div>
            ) : (
              <>
                <div className="min-h-[220px] bg-slate-50 rounded-2xl p-4 border shadow-inner overflow-x-auto">
                  <MindMap mindMap={{ central_topic: topic?.name || "Topik Utama", branches: mindMap || [] }} />
                </div>
                <Button onClick={handleMindMapStageCompleted} className="w-full h-14 bg-gradient-to-r from-pink-500 to-rose-600 text-white font-black rounded-2xl border-b-4 border-rose-800 shadow-md">
                  Selesai Teroka & Seterusnya! 🚀
                </Button>
              </>
            )}
          </motion.div>
        )}

        {/* STAGE 5 INTERFACE: FINAL BOSS CHALLENGE */}
        {activeTab === "quiz" && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-gradient-to-br from-yellow-100 via-orange-50 to-orange-100 rounded-[2.5rem] p-6 border-4 border-yellow-200 shadow-xl relative overflow-hidden">
            <Trophy className="absolute -bottom-6 -right-6 w-32 h-32 text-orange-200/40 rotate-12 -z-0" />
            <div className="relative z-10 space-y-5">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-orange-950 flex items-center gap-2">⚔️ Stage 5: Final Boss Quiz!</h3>
                <Button size="sm" variant="ghost" onClick={() => setActiveTab("map")} className="rounded-full text-xs font-bold text-orange-800 hover:bg-orange-200/50">Peta Misi ✖</Button>
              </div>
              <p className="text-xs sm:text-sm text-orange-800 font-medium leading-relaxed">
                Hebatnya {studentNickname}! Anda telah berjaya melepasi semua cabaran video dan nota dengan cemerlang. Sekarang, jom tewaskan cabaran terakhir ini untuk menawan topik ini! 🏆
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <Button onClick={() => runQuizGeneration(10)} disabled={status.quiz} className="bg-orange-500 hover:bg-orange-600 text-white h-16 text-sm font-black rounded-2xl w-full border-b-4 border-orange-700 active:border-b-0 active:translate-y-1 transition-all">
                  {status.quiz ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Play className="w-4 h-4 mr-1 fill-current" />} Cabaran Pantas (10 Soalan)
                </Button>
                <Button onClick={() => runQuizGeneration(20)} disabled={status.quiz} className="bg-red-500 hover:bg-red-600 text-white h-16 text-sm font-black rounded-2xl w-full border-b-4 border-red-700 active:border-b-0 active:translate-y-1 transition-all">
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