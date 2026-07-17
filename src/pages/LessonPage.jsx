import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  ArrowLeft,
  Compass,
  Tv,
  CheckCircle2,
  Leaf,
  Loader2,
  Sparkles,
  Trophy,
  Play
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

import Flashcards from "@/components/lesson/Flashcards";
import MindMap from "@/components/lesson/MindMap";
import LessonProgress from "@/components/lesson/LessonProgress";

// ==========================================
// PURE UTILITY HELPERS
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
      htmlOutput.push('<hr class="my-6 border-emerald-200 border-dashed border-2 rounded-full" />');
      return;
    }

    // Image Extraction
    if (trimmed.startsWith("![") && trimmed.includes("](") && trimmed.endsWith(")")) {
      const imgMatch = trimmed.match(/!\[(.*?)\]\((.*?)\)/);
      if (imgMatch) {
        htmlOutput.push(
          `<div class="w-full flex justify-center my-5"><img src="${imgMatch[2]}" alt="${imgMatch[1]}" class="w-full max-w-md h-auto rounded-2xl border-4 border-stone-800 shadow-md bg-white transition-transform hover:scale-102 duration-300" /></div>`
        );
        return;
      }
    }

    // Headings
    if (trimmed.startsWith("# ")) {
      htmlOutput.push(
        `<h1 class="text-base sm:text-lg font-black text-emerald-700 border-b-4 border-emerald-200 pb-2 mt-6 mb-4 text-center bg-emerald-50/60 p-3 rounded-2xl shadow-2xs">${trimmed.replace("# ", "")}</h1>`
      );
      return;
    }
    if (trimmed.startsWith("## ")) {
      htmlOutput.push(
        `<h2 class="text-sm sm:text-base font-black text-amber-600 mt-5 mb-2.5 flex items-center gap-1">✨ ${trimmed.replace("## ", "")}</h2>`
      );
      return;
    }
    if (trimmed.startsWith("### ")) {
      htmlOutput.push(
        `<h3 class="text-xs sm:text-sm font-black text-stone-800 mt-4 mb-2 pl-2 border-l-4 border-lime-400">${trimmed.replace("### ", "")}</h3>`
      );
      return;
    }
    if (trimmed.startsWith(">")) {
      let content = trimmed.substring(1).trim();
      htmlOutput.push(
        `<blockquote class="border-l-4 border-amber-400 pl-4 italic text-amber-950 my-4 bg-amber-50 p-3.5 rounded-r-2xl leading-relaxed text-xs sm:text-sm shadow-2xs font-black">🎶 Lirik: ${content}</blockquote>`
      );
      return;
    }

    // Table Parser
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      if (trimmed.includes("---")) return;
      let columns = trimmed.split("|").map(c => c.trim()).filter((c, i, arr) => i > 0 && i < arr.length - 1);
      
      if (!inTable) {
        htmlOutput.push(
          '<div class="overflow-x-auto my-5 border-2 border-emerald-600/20 rounded-2xl bg-white shadow-xs max-w-md mx-auto w-full"><table class="w-full border-collapse text-xs sm:text-sm text-center"><thead><tr class="bg-emerald-500 text-white font-black border-b-2 border-emerald-600">'
        );
        columns.forEach(col => htmlOutput.push(`<th class="p-3 font-black tracking-wide">${col}</th>`));
        htmlOutput.push('</tr></thead><tbody>');
        inTable = true;
      } else {
        htmlOutput.push('<tr class="border-b border-stone-100 last:border-0 odd:bg-stone-50/40 hover:bg-emerald-50/40 transition-colors">');
        columns.forEach(col => htmlOutput.push(`<td class="p-3 font-bold text-stone-700">${col}</td>`));
        htmlOutput.push('</tr>');
      }
      return;
    }

    // Lists
    if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
      if (!inList) {
        htmlOutput.push('<ul class="space-y-2 my-3 pl-1">');
        inList = true;
      }
      let content = trimmed.substring(2);
      htmlOutput.push(`<li class="list-disc ml-5 text-xs sm:text-sm text-stone-600 leading-relaxed font-bold">${content}</li>`);
      return;
    }

    // Paragraphs
    htmlOutput.push(`<p class="text-xs sm:text-sm text-stone-700 font-bold leading-relaxed mb-3">${trimmed}</p>`);
  });

  if (inList) htmlOutput.push("</ul>");
  if (inTable) htmlOutput.push("</tbody></table></div>");

  let finalHtml = htmlOutput.join("\n");
  finalHtml = finalHtml.replace(/\*\*(.*?)\*\*/g, '<strong class="font-black text-emerald-950 bg-amber-200/70 px-1.5 py-0.5 rounded-md">$1</strong>');
  finalHtml = finalHtml.replace(/\*(.*?)\*/g, '<em class="italic text-stone-800 font-semibold">$1</em>');
  
  return finalHtml;
};

// ==========================================
// SUB-COMPONENTS
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
      <div className="p-8 text-center bg-amber-50/60 border-2 border-dashed border-amber-300 rounded-2xl shadow-sm">
        <p className="text-amber-900 font-black text-xs sm:text-sm">🎬 Pautan video YouTube belum disediakan untuk modul ini.</p>
        <Button 
          onClick={onCompleted} 
          className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black rounded-xl px-5 py-2.5 text-xs mt-4 shadow-[0_4px_0_#b45309] active:translate-y-1 active:shadow-none transition-all"
        >
          Teruskan Misi Kembara! 🚀
        </Button>
      </div>
    );
  }

  const secureEmbedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`;

  return (
    <div className="space-y-4 w-full">
      <div className="relative aspect-video w-full rounded-2xl sm:rounded-[1.5rem] overflow-hidden border-4 border-stone-800 bg-stone-950 shadow-md">
        <iframe 
          src={secureEmbedUrl} 
          className="w-full h-full border-0 absolute inset-0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
          allowFullScreen 
        />
      </div>

      {isCompleted ? (
        <div className="bg-emerald-50 border-2 border-emerald-200 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-black text-emerald-900 text-xs sm:text-sm">Anda telah menonton video taklimat ini! 🍃</span>
          </div>
          <div className="bg-lime-400 px-3 py-1.5 rounded-lg text-emerald-950 font-black text-xs shrink-0 border border-emerald-500">+10 XP Padu! 🔥</div>
        </div>
      ) : (
        <div className="bg-stone-900 border-2 border-stone-800 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
          <p className="text-xs text-stone-200 font-bold flex items-center gap-2">
            <Tv className="w-5 h-5 text-emerald-400 animate-pulse shrink-0" /> 
            Klik butang untuk tuntut ganjaran setelah selesai menonton!
          </p>
          <Button 
            onClick={onCompleted} 
            className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs rounded-xl px-5 h-11 shadow-[0_4px_0_#047857] active:translate-y-1 active:shadow-none transition-all"
          >
            Selesai & Ambil +10 XP 🔥
          </Button>
        </div>
      )}
    </div>
  );
}

// ==========================================
// MAIN PAGE COMPONENT
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

  const isTopicUnlocked = useMemo(() => (
    progressState.quiz_completed || (
      progressState.video_completed && 
      progressState.lesson_completed && 
      progressState.flashcard_completed && 
      progressState.mindmap_completed
    )
  ), [progressState]);

  // Handle Fullscreen focus mode
  useEffect(() => {
    if (activeTab !== "map") {
      const el = document.documentElement;
      const requestFullscreen = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
      if (requestFullscreen) {
        requestFullscreen.call(el).catch(() => {});
      }
    } else if (document.fullscreenElement) {
      const exitFullscreen = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
      if (exitFullscreen) {
        exitFullscreen.call(document).catch(() => {});
      }
    }
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, [activeTab]);

  // Initial Data Fetching
  useEffect(() => {
    let isMounted = true;
    const initializeLesson = async () => {
      try {
        const [sub, top, user] = await Promise.all([
          base44.entities.Subject.get(subjectId),
          base44.entities.Topic.get(topicId),
          base44.auth.me()
        ]);
        if (!isMounted) return;
        setSubject(sub); 
        setTopic(top);

        const checkpointKey = `studyquest_checkpoint_${user.id}_${topicId}`;
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

        const cachedSessions = await base44.entities.StudySession.filter({ student_id: user.id, topic_id: topicId }, "-created_date", 1);
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
        console.error("Initialization failed:", err);
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

  const triggerConfetti = () => confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });

  // FIXED: updateStageProgress now handles side-effects outside state reducer
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
        console.error("Database update failed:", error);
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
        const user = await base44.auth.me();
        const payload = {
          student_id: user.id, 
          subject_id: subjectId, 
          topic_id: topicId, 
          topic_name: topic.name, 
          subject_name: subject.name, 
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
  }, [progressState, subjectId, topicId, topic, subject, updateStageProgress]);

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
        const user = await base44.auth.me();
        const newSession = await base44.entities.StudySession.create({ 
          student_id: user.id, 
          subject_id: subjectId, 
          topic_id: topicId, 
          topic_name: topic.name, 
          subject_name: subject.name, 
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
        prompt: `Generate mindmap branches array for summary: ${topic.name}`, 
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
      <div className="flex flex-col items-center justify-center min-h-[50vh] bg-[#FAF8F5]">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto space-y-5 pb-24 font-sans bg-[#FAF8F5] min-h-screen">
      {activeTab === "map" ? (
        <div className="bg-white rounded-2xl p-4 border-2 border-emerald-600/30 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={`/study/${subjectId}`} className="p-2.5 bg-[#F3EFE6] rounded-xl text-stone-700 hover:bg-[#E3D9C6] transition-all">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h2 className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">{subject?.name}</h2>
              <h1 className="text-sm font-black text-stone-800">🗺️ Misi: {topic?.name}</h1>
            </div>
          </div>
          <div className="bg-gradient-to-r from-amber-400 to-emerald-500 px-4 py-2 rounded-xl text-white font-black text-xs shadow-sm">
            <Leaf className="w-4 h-4 inline mr-1" /> {progressState.xp_earned} XP
          </div>
        </div>
      ) : (
        <div className="bg-stone-950 text-stone-200 rounded-xl p-3 flex items-center justify-between shadow-md">
          <button 
            onClick={() => setActiveTab("map")} 
            className="text-xs font-black bg-stone-900 px-4 py-1.5 rounded-xl border border-stone-700 hover:bg-stone-800 transition-all"
          >
            🚪 Keluar Mod Fokus
          </button>
          <span className="text-[11px] font-black uppercase text-amber-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Mod Fokus Aktif
          </span>
        </div>
      )}

      <AnimatePresence mode="wait">
        {activeTab === "map" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <LessonProgress 
              steps={{ 
                video: progressState.video_completed, 
                lesson: progressState.lesson_completed, 
                flashcard: progressState.flashcard_completed, 
                mindmap: progressState.mindmap_completed, 
                quiz: progressState.quiz_completed 
              }} 
              onStepClick={(key) => { 
                if (key === "video") setActiveTab("video"); 
                if (key === "lesson") setActiveTab("lesson"); 
                if (key === "flashcard") loadFlashcardsOnDemand(); 
                if (key === "mindmap") loadMindMapOnDemand(); 
                if (key === "quiz") setActiveTab("quiz"); 
              }}
            />
          </motion.div>
        )}

        {activeTab === "video" && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl p-5 border-2 border-stone-200 shadow-md space-y-4">
            <h3 className="text-sm font-black text-stone-800">🎬 Langkah 1: Taklimat Video</h3>
            <YouTubeLesson videoUrl={videoUrl || topic?.video_url} isCompleted={progressState.video_completed} onCompleted={handleVideoStageCompleted} />
            {progressState.video_completed && (
              <Button onClick={() => setActiveTab("map")} className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl">
                Kembali ke Peta 🗺️
              </Button>
            )}
          </motion.div>
        )}

        {activeTab === "lesson" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl p-5 border-2 border-stone-200 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-stone-800">📜 Langkah 2: Nota Khazanah</h3>
              {notesContent && (
                <Button onClick={() => urusSuaraNota(notesContent)} className={`h-9 px-4 rounded-xl font-black text-xs ${isSpeaking ? "bg-red-500 text-white" : "bg-amber-400 text-stone-900"}`}>
                  {isSpeaking ? "🛑 Berhenti" : "🔊 Baca Nota"}
                </Button>
              )}
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-4 border-2 border-stone-100 rounded-2xl bg-stone-50/50">
              {notesImage && <img src={notesImage} className="w-full max-w-sm mx-auto rounded-xl mb-5 shadow-sm" alt="Nota" />}
              <div dangerouslySetInnerHTML={{ __html: parseMarkdownToHTML(notesContent) }} />
            </div>
            <Button onClick={handleLessonStageCompleted} className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl">
              Selesai Hadam Nota! 🎒
            </Button>
          </motion.div>
        )}

        {activeTab === "flashcard" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl p-5 border-2 border-stone-200 shadow-md space-y-4">
            <h3 className="text-sm font-black text-stone-800">⚡ Langkah 3: Kad Kilat</h3>
            <Flashcards flashcards={flashcards || []} />
            <Button onClick={() => updateStageProgress("flashcard", "mindmap", 15).then(() => setActiveTab("map"))} className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl">
              Selesai Ulangkaji! 🚀
            </Button>
          </motion.div>
        )}

        {activeTab === "mindmap" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl p-5 border-2 border-stone-200 shadow-md space-y-4">
            <h3 className="text-sm font-black text-stone-800">🗺️ Langkah 4: Peta Minda</h3>
            <div className="min-h-[40vh] bg-[#FAF8F5] rounded-xl p-3 border-2 border-stone-100 flex items-center justify-center">
              {infographicUrl ? (
                <img src={infographicUrl} alt="Mindmap" className="max-h-[50vh] object-contain rounded-lg" />
              ) : (
                <MindMap mindMap={{ central_topic: topic?.name || "Utama", branches: mindMap || [] }} />
              )}
            </div>
            <Button onClick={() => updateStageProgress("mindmap", "quiz", 15).then(() => setActiveTab("map"))} className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl">
              Teruskan ke Kuiz! ⚔️
            </Button>
          </motion.div>
        )}

        {activeTab === "quiz" && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-gradient-to-br from-amber-50 to-orange-100 rounded-2xl p-6 border-2 border-amber-300 shadow-md text-center">
            <Trophy className="w-10 h-10 text-orange-500 mx-auto mb-4 animate-bounce" />
            <h3 className="text-lg font-black text-stone-900 mb-2">⚔️ Cabaran Boss Padu</h3>
            <p className="text-xs text-stone-700 font-bold mb-6">Sedia membuktikan ilmu anda? Pilih tahap cabaran anda!</p>
            
            {savedQuizProgress && (
              <div className="mb-6 p-4 bg-white/60 border-2 border-emerald-400 border-dashed rounded-xl">
                <p className="text-xs font-black text-emerald-800 mb-3">Misi sebelumnya dikesan!</p>
                <Button onClick={() => runQuizGeneration(savedQuizProgress.limit, true)} className="w-full h-12 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-xl flex items-center justify-center gap-2">
                  <Play className="w-4 h-4 fill-white" /> Sambung Misi (Soalan {savedQuizProgress.questionIndex + 1})
                </Button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button onClick={() => runQuizGeneration(10)} disabled={status.quiz} className="h-14 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl shadow-md transition-transform active:scale-95">
                {status.quiz ? "Menyediakan..." : "⚡ Misi Kilat (10 Soalan)"}
              </Button>
              <Button onClick={() => runQuizGeneration(20)} disabled={status.quiz} className="h-14 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-xl shadow-md transition-transform active:scale-95">
                {status.quiz ? "Menyediakan..." : "⚔️ Lawan Boss (20 Soalan)"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
