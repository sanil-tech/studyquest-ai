// src/pages/LessonPage.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  ArrowLeft,
  Tv,
  CheckCircle2,
  Leaf,
  Loader2,
  Sparkles,
  Trophy,
  Play,
  Volume2,
  VolumeX,
  Compass,
  BookOpen,
  Brain,
  Zap,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

import Flashcards from "@/components/lesson/Flashcards";
import MindMap from "@/components/lesson/MindMap";
import LessonProgress from "@/components/lesson/LessonProgress";

// ==========================================
// SUBJECT WORLD THEMES & MASCOTS
// ==========================================
const WORLD_THEMES = {
  science: {
    name: "Discovery Jungle",
    mascotName: "Bimo Orangutan",
    emoji: "🦧",
    bgGradient: "bg-gradient-to-b from-emerald-900 via-green-900 to-stone-900",
    cardBg: "bg-emerald-950/80 border-emerald-500/40 text-emerald-100",
    accentColor: "bg-emerald-500 hover:bg-emerald-400 text-stone-950",
    badgeBg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
  },
  math: {
    name: "Number Island",
    mascotName: "Suku Penyu",
    emoji: "🐢",
    bgGradient: "bg-gradient-to-b from-blue-900 via-indigo-900 to-stone-900",
    cardBg: "bg-blue-950/80 border-blue-500/40 text-blue-100",
    accentColor: "bg-blue-500 hover:bg-blue-400 text-stone-950",
    badgeBg: "bg-blue-500/20 text-blue-300 border-blue-500/30"
  },
  bm: {
    name: "Story Village",
    mascotName: "Lila Enggang",
    emoji: "🦜",
    bgGradient: "bg-gradient-to-b from-amber-900 via-orange-900 to-stone-900",
    cardBg: "bg-amber-950/80 border-amber-500/40 text-amber-100",
    accentColor: "bg-amber-500 hover:bg-amber-400 text-stone-950",
    badgeBg: "bg-amber-500/20 text-amber-300 border-amber-500/30"
  },
  english: {
    name: "Adventure Bay",
    mascotName: "Ollie Memerang",
    emoji: "🦦",
    bgGradient: "bg-gradient-to-b from-cyan-900 via-teal-900 to-stone-900",
    cardBg: "bg-cyan-950/80 border-cyan-500/40 text-cyan-100",
    accentColor: "bg-cyan-400 hover:bg-cyan-300 text-stone-950",
    badgeBg: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
  },
  history: {
    name: "Time Valley",
    mascotName: "Gajah",
    emoji: "🐘",
    bgGradient: "bg-gradient-to-b from-stone-900 via-amber-950 to-stone-950",
    cardBg: "bg-stone-900/90 border-amber-600/40 text-amber-100",
    accentColor: "bg-amber-600 hover:bg-amber-500 text-stone-950",
    badgeBg: "bg-amber-600/20 text-amber-300 border-amber-600/30"
  },
  art: {
    name: "Rainbow Garden",
    mascotName: "Lumi Rama-Rama",
    emoji: "🦋",
    bgGradient: "bg-gradient-to-b from-pink-900 via-purple-900 to-stone-900",
    cardBg: "bg-pink-950/80 border-pink-500/40 text-pink-100",
    accentColor: "bg-pink-500 hover:bg-pink-400 text-stone-950",
    badgeBg: "bg-pink-500/20 text-pink-300 border-pink-500/30"
  },
  ict: {
    name: "Tech City",
    mascotName: "Byte Robot",
    emoji: "🤖",
    bgGradient: "bg-gradient-to-b from-purple-950 via-slate-900 to-stone-950",
    cardBg: "bg-purple-950/80 border-purple-500/40 text-purple-100",
    accentColor: "bg-purple-500 hover:bg-purple-400 text-stone-950",
    badgeBg: "bg-purple-500/20 text-purple-300 border-purple-500/30"
  },
  default: {
    name: "Hutan Ilmu",
    mascotName: "Otan",
    emoji: "🦧",
    bgGradient: "bg-gradient-to-b from-emerald-950 via-green-950 to-stone-950",
    cardBg: "bg-stone-900/90 border-emerald-500/40 text-emerald-100",
    accentColor: "bg-emerald-500 hover:bg-emerald-400 text-stone-950",
    badgeBg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
  }
};

// ==========================================
// UTILITY HELPERS
// ==========================================
const safeJsonParse = (str, fallback = []) => {
  if (!str) return fallback;
  if (typeof str === "object") return str;
  try {
    return JSON.parse(
      String(str)
        .replace(/^```json/i, "")
        .replace(/^```/i, "")
        .replace(/```$/i, "")
        .trim()
    );
  } catch (e) {
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

const bersihkanTeksPadanan = (str) => {
  return str
    ? str
        .toLowerCase()
        .replace(/dan/g, "")
        .replace(/&/g, "")
        .replace(/misi\s*\d+/g, "")
        .replace(/[^a-z0-9]/g, "")
        .trim()
    : "";
};

const bersihkanTeksUntukSuara = (text) => {
  if (!text) return "";
  const normalizedText = String(text).replace(/\\n/g, "\n");
  return normalizedText
    .split("\n")
    .filter((line) => !line.trim().startsWith("|"))
    .filter((line) => !line.trim().startsWith("!["))
    .join(" ")
    .replace(/[#*>\-_`🔸]/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

const parseMarkdownToHTML = (text) => {
  if (!text) return "";
  const cleanText = String(text).replace(/\\n/g, "\n");
  const lines = cleanText.split("\n");
  let inList = false;
  let inTable = false;
  let htmlOutput = [];

  lines.forEach((line) => {
    let trimmed = line.trim();

    if (!trimmed.startsWith("* ") && !trimmed.startsWith("- ") && inList) {
      htmlOutput.push("</ul>");
      inList = false;
    }
    if (!(trimmed.startsWith("|") && trimmed.endsWith("|")) && inTable) {
      htmlOutput.push("</tbody></table></div>");
      inTable = false;
    }
    if (trimmed === "") return;
    if (trimmed === "---") {
      htmlOutput.push('<hr class="my-6 border-emerald-500/30 border-dashed border-2 rounded-full" />');
      return;
    }

    if (trimmed.startsWith("![") && trimmed.includes("](") && trimmed.endsWith(")")) {
      const imgMatch = trimmed.match(/!\[(.*?)\]\((.*?)\)/);
      if (imgMatch) {
        htmlOutput.push(
          `<div class="w-full flex justify-center my-5"><img src="${imgMatch[2]}" alt="${imgMatch[1]}" class="w-full max-w-md h-auto rounded-2xl border-4 border-stone-800 shadow-md bg-white transition-transform hover:scale-102 duration-300" /></div>`
        );
        return;
      }
    }

    if (trimmed.startsWith("# ")) {
      htmlOutput.push(
        `<h1 class="text-base sm:text-lg font-black text-amber-300 border-b-2 border-amber-500/30 pb-2 mt-6 mb-4 text-center bg-amber-500/10 p-3 rounded-2xl">${trimmed.replace("# ", "")}</h1>`
      );
      return;
    }
    if (trimmed.startsWith("## ")) {
      htmlOutput.push(
        `<h2 class="text-sm sm:text-base font-black text-lime-400 mt-5 mb-2.5 flex items-center gap-1">✨ ${trimmed.replace("## ", "")}</h2>`
      );
      return;
    }
    if (trimmed.startsWith("### ")) {
      htmlOutput.push(
        `<h3 class="text-xs sm:text-sm font-black text-stone-200 mt-4 mb-2 pl-2 border-l-4 border-emerald-400">${trimmed.replace("### ", "")}</h3>`
      );
      return;
    }
    if (trimmed.startsWith(">")) {
      let content = trimmed.substring(1).trim();
      htmlOutput.push(
        `<blockquote class="border-l-4 border-amber-400 pl-4 italic text-amber-200 my-4 bg-amber-500/10 p-3.5 rounded-r-2xl text-xs sm:text-sm font-black">🎶 Nota: ${content}</blockquote>`
      );
      return;
    }

    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      if (trimmed.includes("---")) return;
      let columns = trimmed.split("|").map(c => c.trim()).filter((c, i, arr) => i > 0 && i < arr.length - 1);
      
      if (!inTable) {
        htmlOutput.push(
          '<div class="overflow-x-auto my-5 border-2 border-emerald-500/30 rounded-2xl bg-stone-900/80 shadow-xs max-w-md mx-auto w-full"><table class="w-full border-collapse text-xs sm:text-sm text-center"><thead><tr class="bg-emerald-600 text-white font-black border-b-2 border-emerald-700">'
        );
        columns.forEach(col => htmlOutput.push(`<th class="p-3 font-black tracking-wide">${col}</th>`));
        htmlOutput.push('</tr></thead><tbody>');
        inTable = true;
      } else {
        htmlOutput.push('<tr class="border-b border-stone-800 last:border-0 odd:bg-stone-800/40 hover:bg-emerald-500/10 transition-colors">');
        columns.forEach(col => htmlOutput.push(`<td class="p-3 font-bold text-stone-300">${col}</td>`));
        htmlOutput.push('</tr>');
      }
      return;
    }

    if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
      if (!inList) {
        htmlOutput.push('<ul class="space-y-2 my-3 pl-1">');
        inList = true;
      }
      let content = trimmed.substring(2);
      htmlOutput.push(`<li class="list-disc ml-5 text-xs sm:text-sm text-stone-300 font-bold">${content}</li>`);
      return;
    }

    htmlOutput.push(`<p class="text-xs sm:text-sm text-stone-200 font-bold leading-relaxed mb-3">${trimmed}</p>`);
  });

  if (inList) htmlOutput.push("</ul>");
  if (inTable) htmlOutput.push("</tbody></table></div>");

  let finalHtml = htmlOutput.join("\n");
  finalHtml = finalHtml.replace(/\*\*(.*?)\*\*/g, '<strong class="font-black text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded-md">$1</strong>');
  finalHtml = finalHtml.replace(/\*(.*?)\*/g, '<em class="italic text-stone-300 font-semibold">$1</em>');
  
  return finalHtml;
};

// ==========================================
// YOUTUBE VIDEO COMPONENT
// ==========================================
function YouTubeLesson({ videoUrl, onCompleted, isCompleted }) {
  const videoId = useMemo(() => {
    if (!videoUrl) return null;
    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = videoUrl.match(regExp);
    return (match && match[1].length === 11) ? match[1] : null;
  }, [videoUrl]);

  if (!videoId) {
    return (
      <div className="p-8 text-center bg-stone-900/80 border-4 border-dashed border-amber-500/40 rounded-3xl">
        <p className="text-amber-200 font-black text-sm">🎬 Video taklimat belum disediakan untuk topik ini.</p>
        <Button className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-black rounded-2xl px-6 py-3 text-sm mt-4 border-b-4 border-amber-700 active:translate-y-1 transition-all" onClick="{onCompleted}">
          Teruskan Misi! 🚀
        </Button>
      </div>
    );
  }

  const secureEmbedUrl = `[https://www.youtube.com/embed/$](https://www.youtube.com/embed/$){videoId}?rel=0&modestbranding=1&playsinline=1&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`;

  return (
    <div className="space-y-4 w-full">
      <div className="relative aspect-video w-full rounded-3xl overflow-hidden border-4 border-stone-700 bg-black shadow-2xl">
        <iframe 
          src={secureEmbedUrl} 
          className="w-full h-full border-0 absolute inset-0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
          allowFullScreen 
        />
      </div>

      {isCompleted ? (
        <div className="bg-emerald-950/80 border-2 border-emerald-500/40 p-4 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0"/>
            <span className="font-black text-emerald-200 text-sm">Taklimat video selesai! 🍃</span>
          </div>
          <div className="bg-lime-400 px-3 py-1.5 rounded-xl text-stone-950 font-black text-xs border-b-2 border-emerald-600">+10 XP</div>
        </div>
      ) : (
        <div className="bg-stone-900 border-2 border-stone-800 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
          <p className="text-xs text-stone-300 font-bold flex items-center gap-2">
            <Tv className="w-5 h-5 text-emerald-400 animate-pulse shrink-0"/> 
            Tonton video dan tekan butang untuk mengutip +10 XP!
          </p>
          <Button className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-xs rounded-xl px-5 h-11 border-b-4 border-emerald-700 active:translate-y-1 transition-all" onClick="{onCompleted}">
            Selesai & Ambil +10 XP 🔥
          </Button>
        </div>
      )}
    </div>
  );
}

// ==========================================
// MAIN LESSON PAGE COMPONENT
// ==========================================
export default function LessonPage() {
  const { subjectId, topicId } = useParams();
  const navigate = useNavigate();
  
  const [subject, setSubject] = useState(null);
  const [topic, setTopic] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(true);

  const [flashcards, setFlashcards] = useState(null);
  const [mindMap, setMindMap] = useState(null);
  
  const [actualQuizId, setActualQuizId] = useState("");
  const [rawBankQuestions, setRawBankQuestions] = useState([]);

  const [videoUrl, setVideoUrl] = useState("");
  const [notesContent, setNotesContent] = useState("");
  const [notesImage, setNotesImage] = useState(""); 
  const [infographicUrl, setInfographicUrl] = useState("");

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
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [savedQuizProgress, setSavedQuizProgress] = useState(null);
  
  const studyStartRef = useRef(null);
  const sessionRef = useRef(null);

  useEffect(() => { 
    sessionRef.current = sessionId; 
  }, [sessionId]);

  // Identify world theme & mascot info
  const worldTheme = useMemo(() => {
    if (!subjectId && !subject?.name) return WORLD_THEMES.default;
    const key = (subjectId || subject?.name || "").toLowerCase();
    for (const [wKey, wVal] of Object.entries(WORLD_THEMES)) {
      if (key.includes(wKey)) return wVal;
    }
    return WORLD_THEMES.default;
  }, [subjectId, subject]);

  // Resolve student ID
  const getActiveStudentId = useCallback(async () => {
    const currentUser = await base44.auth.me().catch(() => null);
    if (!currentUser) return null;

    const activeChildId = currentUser.app_role === "parent"
      ? (localStorage.getItem("active_child_session") || localStorage.getItem("selected_child_id"))
      : null;

    return activeChildId || currentUser.id;
  }, []);

  // Fetch initial topic & lesson data
  useEffect(() => {
    let isMounted = true;
    const initializeLesson = async () => {
      try {
        const studentId = await getActiveStudentId();
        const [sub, top] = await Promise.all([
          base44.entities.Subject.get(subjectId),
          base44.entities.Topic.get(topicId)
        ]);

        if (!isMounted) return;
        setSubject(sub); 
        setTopic(top);

        const checkpointKey = `studyquest_checkpoint_${studentId}_${topicId}`;
        const savedData = localStorage.getItem(checkpointKey);
        if (savedData) {
          try { setSavedQuizProgress(JSON.parse(savedData)); } catch(e) {}
        }

        const allQuizBanks = await base44.entities.Quiz.filter({});
        let foundBank = allQuizBanks.find(b => b.id === topicId);
        if (!foundBank) {
          const targetClean = bersihkanTeksPadanan(top.name);
          foundBank = allQuizBanks.find(b => bersihkanTeksPadanan(b.topic_name) === targetClean);
        }

        if (foundBank && isMounted) {
          setActualQuizId(foundBank.id);
          setVideoUrl(foundBank.video_url || "");
          setInfographicUrl(foundBank.infographic_url || "");
          
          let rawNotes = foundBank.notes_content;
          if (rawNotes) {
            try {
              let parsed = typeof rawNotes === "object" ? rawNotes : JSON.parse(String(rawNotes).trim());
              setNotesContent(parsed.text || String(rawNotes));
              setNotesImage(parsed.image || "");
            } catch (e) {
              setNotesContent(String(rawNotes));
            }
          }
          setRawBankQuestions(safeJsonParse(foundBank.questions_json, []));
        }

        // Fetch user study session
        const cachedSessions = await base44.entities.StudySession.filter(
          { student_id: studentId, topic_id: topicId }, 
          "-created_date", 
          1
        );

        if (isMounted && cachedSessions[0]) {
          const session = cachedSessions[0];
          const savedStage = session.current_stage || "video";
          setProgressState({ 
            video_completed: session.video_completed || false, 
            lesson_completed: session.lesson_completed || false, 
            flashcard_completed: session.flashcard_completed || false, 
            mindmap_completed: session.mindmap_completed || false, 
            quiz_completed: session.quiz_completed || false, 
            current_stage: savedStage, 
            xp_earned: session.xp_earned || 0 
          });
          setSessionId(session.id);
          if (!session.quiz_completed) setActiveTab(savedStage);
        }
      } catch (err) {
        console.error("Gagal memuat turun data:", err);
      } finally { 
        if (isMounted) { 
          studyStartRef.current = Date.now(); 
          setLoading(false); 
        } 
      }
    };

    initializeLesson();
    return () => { isMounted = false; };
  }, [subjectId, topicId, getActiveStudentId]);

  const recordStudyTime = async () => { 
    const sId = sessionRef.current; 
    if (!sId || !studyStartRef.current) return; 
    const mins = Math.max(1, Math.round((Date.now() - studyStartRef.current) / 60000)); 
    try { await base44.entities.StudySession.update(sId, { duration_minutes: mins }); } catch (err) {} 
  };

  const triggerConfetti = () => confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });

  const updateStageProgress = useCallback(async (stageId, nextStage, xpAwarded) => {
    let currentSessionId = sessionRef.current;
    let nextState;

    setProgressState(prev => {
      const isCompletedBefore = prev[`${stageId}_completed`];
      nextState = { 
        ...prev, 
        [`${stageId}_completed`]: true, 
        current_stage: prev[`${nextStage}_completed`] ? prev.current_stage : nextStage, 
        xp_earned: prev.xp_earned + (isCompletedBefore ? 0 : xpAwarded) 
      };
      return nextState;
    });

    triggerConfetti();

    if (currentSessionId && nextState) {
      try {
        await base44.entities.StudySession.update(currentSessionId, nextState);
      } catch (error) {
        console.error("Gagal mengemaskini pangkalan data:", error);
      }
    }
  }, []);

  const handleVideoStageCompleted = useCallback(async () => {
    if (progressState.video_completed) { 
      setActiveTab("map"); 
      return; 
    }
    
    let currentId = sessionRef.current;
    if (!currentId) {
      try {
        const studentId = await getActiveStudentId();
        const payload = {
          student_id: studentId, 
          subject_id: subjectId, 
          topic_id: topicId, 
          topic_name: topic?.name, 
          subject_name: subject?.name, 
          duration_minutes: 0, 
          ...progressState, 
          video_completed: true, 
          current_stage: "lesson", 
          xp_earned: 10
        };
        const newSession = await base44.entities.StudySession.create(payload);
        const validId = Array.isArray(newSession) ? newSession[0]?.id : newSession?.id; 
        setSessionId(validId); 
        setProgressState(p => ({ ...p, video_completed: true, current_stage: "lesson", xp_earned: 10 })); 
        triggerConfetti(); 
        setActiveTab("map"); 
        return;
      } catch (err) { return; }
    }
    await updateStageProgress("video", "lesson", 10); 
    setActiveTab("map");
  }, [progressState, subjectId, topicId, topic, subject, updateStageProgress, getActiveStudentId]);

  const handleLessonStageCompleted = async () => {
    setStatus(p => ({ ...p, lesson: true }));
    try {
      let currentSessionId = sessionRef.current;
      const nextStatePayload = { 
        ...progressState, 
        lesson_completed: true, 
        current_stage: progressState.flashcard_completed ? progressState.current_stage : "flashcard", 
        xp_earned: progressState.xp_earned + (progressState.lesson_completed ? 0 : 15) 
      };
      
      if (!currentSessionId) {
        const studentId = await getActiveStudentId();
        const newSession = await base44.entities.StudySession.create({ 
          student_id: studentId, 
          subject_id: subjectId, 
          topic_id: topicId, 
          topic_name: topic?.name, 
          subject_name: subject?.name, 
          duration_minutes: 0, 
          ...nextStatePayload 
        });
        const validId = Array.isArray(newSession) ? newSession[0]?.id : newSession?.id; 
        setSessionId(validId); 
      } else { 
        await base44.entities.StudySession.update(currentSessionId, nextStatePayload); 
      }
      setProgressState(nextStatePayload); 
      triggerConfetti(); 
      setActiveTab("map");
    } catch (e) {
      console.error(e);
    } finally { 
      setStatus(p => ({ ...p, lesson: false })); 
    }
  };

  const loadFlashcardsOnDemand = async () => { 
    setActiveTab("flashcard"); 
    if (flashcards?.length > 0) return; 
    if (rawBankQuestions?.length > 0) { 
      setFlashcards(
        shuffleArray(rawBankQuestions)
          .slice(0, 5)
          .map(q => ({ 
            front: q.question, 
            back: `${q.correct_answer || q.correctAnswer}\n\n${q.explanation || ""}` 
          }))
      ); 
    }
  };

  const loadMindMapOnDemand = async () => { 
    setActiveTab("mindmap"); 
    if (mindMap?.length > 0 || infographicUrl) return; 
    setStatus(p => ({ ...p, mindmap: true })); 
    try { 
      const res = await base44.integrations.Core.InvokeLLM({ 
        model: "gemini_3_flash", 
        prompt: `Generate mindmap branches array for summary: ${topic?.name}`, 
        response_json_schema: {
          type: "array", 
          items: {
            type: "object", 
            properties: { 
              label: { type: "string" }, 
              children: { type: "array", items: { type: "string" } } 
            }, 
            required: ["label", "children"]
          }
        } 
      }); 
      setMindMap(res); 
    } catch (e) {
      console.error(e);
    } finally { 
      setStatus(p => ({ ...p, mindmap: false })); 
    } 
  };

  const runQuizGeneration = async (numQ, isResume = false) => { 
    await recordStudyTime(); 
    setStatus(p => ({ ...p, quiz: true })); 
    try { 
      if (!rawBankQuestions?.length || !actualQuizId) {
        alert("⚠️ Soalan kuiz belum disediakan untuk topik ini.");
        setStatus(p => ({ ...p, quiz: false })); 
        return;
      }
      if (sessionId) {
        await base44.entities.StudySession.update(sessionId, { quiz_completed: true, current_stage: "quiz" }).catch(()=>{});
      }
      if (isResume && savedQuizProgress) {
        navigate(`/quiz/${actualQuizId}?limit=${savedQuizProgress.limit}&resume=true`);
      } else {
        navigate(`/quiz/${actualQuizId}?limit=${numQ}`);
      }
    } catch (e) { 
      navigate(`/quiz/${actualQuizId || topicId}?limit=${numQ}`);
    } finally { 
      setStatus(p => ({ ...p, quiz: false })); 
    } 
  };

  const urusSuaraNota = (teksNota) => {
    if (!window.speechSynthesis) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const teksBersih = bersihkanTeksUntukSuara(teksNota);
    const sebutan = new SpeechSynthesisUtterance(teksBersih);
    const isEnglish = subject?.name?.toLowerCase()?.includes("english");
    sebutan.lang = isEnglish ? "en-MY" : "ms-MY";
    sebutan.rate = 0.9;  
    sebutan.onstart = () => setIsSpeaking(true);
    sebutan.onend = () => setIsSpeaking(false);
    sebutan.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(sebutan);
  };

  if (loading) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-screen ${worldTheme.bgGradient} text-white`}>
        <Loader2 className="w-12 h-12 text-lime-400 animate-spin"/>
        <p className="mt-4 font-black text-lime-200 text-sm">Membuka Pentas {worldTheme.name}...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${worldTheme.bgGradient} font-sans text-stone-100 pb-24 px-4 py-6 selection:bg-amber-400 selection:text-stone-900`}>
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* GAME STAGE HUD TOPBAR */}
        <div className="bg-stone-900/90 border-2 border-stone-700/80 rounded-3xl p-4 shadow-xl flex items-center justify-between backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(`/study/${subjectId}`)} 
              className="p-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-2xl transition-all border border-stone-600 active:scale-95"
            >
              <X className="w-5 h-5"/>
            </button>
            <div>
              <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${worldTheme.badgeBg}`}>
                {worldTheme.name}
              </span>
              <h1 className="text-sm sm:text-base font-black text-white mt-1 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-amber-400"/> {topic?.name}
              </h1>
            </div>
          </div>

          <div className="bg-gradient-to-r from-amber-400 to-lime-400 px-4 py-2 rounded-2xl text-stone-950 font-black text-xs sm:text-sm shadow-md border-b-2 border-amber-600 flex items-center gap-1.5">
            <Leaf className="w-4 h-4 fill-stone-950"/> {progressState.xp_earned} XP
          </div>
        </div>

        {/* MASCOT DIALOGUE BANNER */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-3xl p-4 border-2 ${worldTheme.cardBg} flex items-center gap-4 shadow-lg backdrop-blur-sm`}
        >
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-4xl shrink-0 border border-white/20 shadow-inner">
            {worldTheme.emoji}
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-amber-400">{worldTheme.mascotName} Kata:</p>
            <p className="text-xs sm:text-sm font-extrabold text-stone-200 mt-0.5 leading-relaxed">
              {activeTab === "map" && "Pilih mana-mana ikon dalam Peta Misi di bawah untuk memulakan cabaran!"}
              {activeTab === "video" && "Tonton taklimat video ini untuk memahami konsep asas terlebih dahulu."}
              {activeTab === "lesson" && "Baca nota khazanah ini. Tekan butang pembesar suara untuk mendengar sebutan!"}
              {activeTab === "flashcard" && "Uji ingatan pantas anda dengan kad kilat di bawah."}
              {activeTab === "mindmap" && "Ini gambaran keseluruhan topik menerusi Peta Minda!"}
              {activeTab === "quiz" && "Sedia untuk bertarung dalam Cabaran Boss untuk mengutip XP penuh?"}
            </p>
          </div>
        </motion.div>

        {/* DYNAMIC GAME CANVAS */}
        <AnimatePresence mode="wait">
          {activeTab === "map" && (
            <motion.div key="map" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="bg-stone-900/80 rounded-3xl p-6 border-2 border-stone-800 shadow-xl">
                <LessonProgress flashcard: lesson: mindmap: onStepClick="{(key)" progressState.flashcard_completed, progressState.lesson_completed, progressState.mindmap_completed, progressState.quiz_completed, progressState.video_completed, quiz: steps="{{" video: }}> {
                    if (key === "video") setActiveTab("video");
                    if (key === "lesson") setActiveTab("lesson");
                    if (key === "flashcard") loadFlashcardsOnDemand();
                    if (key === "mindmap") loadMindMapOnDemand();
                    if (key === "quiz") setActiveTab("quiz");
                  }}
                />
              </div>
            </motion.div>
          )}

          {/* STAGE 1: VIDEO */}
          {activeTab === "video" && (
            <motion.div key="video" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-stone-900/90 rounded-3xl p-6 border-2 border-stone-800 shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <h3 className="text-base font-black text-amber-300 flex items-center gap-2">
                  <Tv className="w-5 h-5 text-emerald-400"/> Langkah 1: Taklimat Video
                </h3>
                <Button onClick="{()"> setActiveTab("map")} variant="outline" className="border-stone-700 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold rounded-xl text-xs">
                  Kembali ke Peta 🗺️
                </Button>
              </div>

              <YouTubeLesson isCompleted="{progressState.video_completed}" onCompleted="{handleVideoStageCompleted}" topic?.video_url} videoUrl="{videoUrl" ||/>
            </motion.div>
          )}

          {/* STAGE 2: LESSON NOTES */}
          {activeTab === "lesson" && (
            <motion.div key="lesson" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-stone-900/90 rounded-3xl p-6 border-2 border-stone-800 shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <h3 className="text-base font-black text-amber-300 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-amber-400"/> Langkah 2: Nota Khazanah
                </h3>
                
                <div className="flex items-center gap-2">
                  {notesContent && (
                    <Button onClick="{()"> urusSuaraNota(notesContent)} 
                      className={`h-10 px-4 rounded-xl font-black text-xs ${
                        isSpeaking ? "bg-rose-500 hover:bg-rose-600 text-white" : "bg-amber-400 hover:bg-amber-300 text-stone-950"
                      }`}
                    >
                      {isSpeaking ? <VolumeX className="w-4 h-4 mr-1"/> : <Volume2 className="w-4 h-4 mr-1"/>}
                      {isSpeaking ? "Berhenti" : "Baca Nota"}
                    </Button>
                  )}
                  <Button onClick="{()"> setActiveTab("map")} variant="outline" className="border-stone-700 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold rounded-xl text-xs">
                    Peta 🗺️
                  </Button>
                </div>
              </div>

              <div className="max-h-[60vh] overflow-y-auto p-5 border border-stone-800 rounded-2xl bg-black/40 leading-relaxed">
                {notesImage && <img src={notesImage} className="w-full max-w-md mx-auto rounded-2xl mb-5 shadow-md border border-stone-700" alt="Nota" />}
                <div dangerouslySetInnerHTML={{ __html: parseMarkdownToHTML(notesContent) }} />
              </div>

              <Button ${worldTheme.accentColor} active:translate-y-1 border-b-4 border-black/40 className="{`w-full" font-black h-14 onClick="{handleLessonStageCompleted}" rounded-2xl text-base transition-all`}>
                Selesai Hadam Nota! 🎒
              </Button>
            </motion.div>
          )}

          {/* STAGE 3: FLASHCARDS */}
          {activeTab === "flashcard" && (
            <motion.div key="flashcard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-stone-900/90 rounded-3xl p-6 border-2 border-stone-800 shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <h3 className="text-base font-black text-amber-300 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-400"/> Langkah 3: Kad Kilat Ingatan
                </h3>
                <Button onClick="{()"> setActiveTab("map")} variant="outline" className="border-stone-700 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold rounded-xl text-xs">
                  Peta 🗺️
                </Button>
              </div>

              <Flashcards []} flashcards="{flashcards" ||/>

              <Button onClick="{()"> updateStageProgress("flashcard", "mindmap", 15).then(() => setActiveTab("map"))} 
                className={`w-full h-14 ${worldTheme.accentColor} font-black text-base rounded-2xl border-b-4 border-black/40 active:translate-y-1 transition-all`}
              >
                Selesai Ulangkaji Kad Kilat! 🚀
              </Button>
            </motion.div>
          )}

          {/* STAGE 4: MIND MAP */}
          {activeTab === "mindmap" && (
            <motion.div key="mindmap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-stone-900/90 rounded-3xl p-6 border-2 border-stone-800 shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <h3 className="text-base font-black text-amber-300 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-400"/> Langkah 4: Peta Minda
                </h3>
                <Button onClick="{()"> setActiveTab("map")} variant="outline" className="border-stone-700 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold rounded-xl text-xs">
                  Peta 🗺️
                </Button>
              </div>

              <div className="min-h-[40vh] bg-black/40 rounded-2xl p-4 border border-stone-800 flex items-center justify-center">
                {infographicUrl ? (
                  <img src={infographicUrl} alt="Mindmap" className="max-h-[50vh] object-contain rounded-xl shadow-md" />
                ) : (
                  <MindMap "Topik Utama", [] branches: central_topic: mindMap topic?.name || }}/>
                )}
              </div>

              <Button onClick="{()"> updateStageProgress("mindmap", "quiz", 15).then(() => setActiveTab("map"))} 
                className={`w-full h-14 ${worldTheme.accentColor} font-black text-base rounded-2xl border-b-4 border-black/40 active:translate-y-1 transition-all`}
              >
                Teruskan ke Cabaran Boss! ⚔️
              </Button>
            </motion.div>
          )}

          {/* STAGE 5: BOSS QUIZ */}
          {activeTab === "quiz" && (
            <motion.div key="quiz" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-gradient-to-br from-amber-950 via-stone-900 to-amber-900 rounded-3xl p-8 border-4 border-amber-500/40 shadow-2xl text-center">
              <Trophy className="w-14 h-14 text-amber-400 mx-auto mb-3 animate-bounce"/>
              <h3 className="text-2xl font-black text-amber-200 mb-1">⚔️ Cabaran Boss Padu</h3>
              <p className="text-xs sm:text-sm text-stone-300 font-bold mb-6">Masa untuk membuktikan ilmu anda! Pilih tahap cabaran anda.</p>
              
              {savedQuizProgress && (
                <div className="mb-6 p-4 bg-stone-900/80 border-2 border-emerald-400/40 border-dashed rounded-2xl">
                  <p className="text-xs font-black text-emerald-300 mb-2">Misi cabaran terdahulu dikesan!</p>
                  <Button onClick="{()"> runQuizGeneration(savedQuizProgress.limit, true)} 
                    className="w-full h-12 bg-teal-500 hover:bg-teal-400 text-stone-950 font-black rounded-xl flex items-center justify-center gap-2 border-b-4 border-teal-700"
                  >
                    <Play className="w-4 h-4 fill-stone-950"/> Sambung Misi (Soalan {savedQuizProgress.questionIndex + 1})
                  </Button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto">
                <Button onClick="{()"> runQuizGeneration(10)} 
                  disabled={status.quiz} 
                  className="h-16 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-base rounded-2xl shadow-lg border-b-4 border-amber-700 active:translate-y-1 transition-all"
                >
                  {status.quiz ? "Menyediakan..." : "⚡ Misi Kilat (10 Soalan)"}
                </Button>
                <Button onClick="{()"> runQuizGeneration(20)} 
                  disabled={status.quiz} 
                  className="h-16 bg-orange-500 hover:bg-orange-400 text-stone-950 font-black text-base rounded-2xl shadow-lg border-b-4 border-orange-700 active:translate-y-1 transition-all"
                >
                  {status.quiz ? "Menyediakan..." : "⚔️ Lawan Boss (20 Soalan)"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
