// src/pages/LessonPage.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { 
  ArrowLeft, Play, Loader2, Trophy, Compass, Tv, 
  CheckCircle2, Leaf, Sprout, Info, ChevronLeft
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
// COMPONENT 1: YouTubeLesson (Versi Fokus)
// ============================================================================
function YouTubeLesson({ videoUrl, onCompleted, isCompleted }) {
  const [apiFailed, setApiFailed] = useState(false);
  const playerRef = useRef(null);
  const containerId = useRef(`yt-player-${Math.random().toString(36).substring(2, 9)}`);

  const getYouTubeId = (url) => {
    if (!url) return null;
    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = url.match(regExp);
    return (match && match[1].length === 11) ? match[1] : null;
  };

  const videoId = getYouTubeId(videoUrl);

  useEffect(() => {
    if (!videoId || apiFailed) return;
    let timer;
    const initPlayer = () => {
      const targetEl = document.getElementById(containerId.current);
      if (!targetEl || playerRef.current) return;
      try {
        playerRef.current = new window.YT.Player(containerId.current, {
          videoId: videoId,
          playerVars: { rel: 0, modestbranding: 1, playsinline: 1, autoplay: 0 },
          events: {
            onStateChange: (event) => {
              if (event.data === window.YT.PlayerState.ENDED) onCompleted();
            },
            onError: () => setApiFailed(true)
          },
        });
      } catch (error) { setApiFailed(true); }
    };

    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      window.onYouTubeIframeAPIReady = () => { initPlayer(); };
    } else {
      timer = setTimeout(initPlayer, 150);
    }

    return () => {
      clearTimeout(timer);
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        try { playerRef.current.destroy(); } catch (e) {}
        playerRef.current = null;
      }
    };
  }, [videoId, apiFailed, onCompleted]);

  if (!videoId) {
    return (
      <div className="p-8 text-center bg-amber-50/60 border border-dashed border-amber-200 rounded-2xl">
        <p className="text-amber-800 font-bold text-xs sm:text-sm">🎬 Pautan video belum dimasukkan oleh Pentadbir untuk dahan ini.</p>
        <Button onClick={onCompleted} className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black rounded-xl px-5 py-2.5 text-xs mt-3 shadow-xs border-0">Teruskan Misi 🚀</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full">
      <div className="relative aspect-video w-full rounded-2xl sm:rounded-[1.5rem] overflow-hidden border-2 border-stone-800 bg-stone-950 shadow-md">
        {apiFailed ? (
          <iframe src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`} className="w-full h-full border-0 absolute inset-0" allowFullScreen />
        ) : (
          <div id={containerId.current} className="w-full h-full absolute inset-0" />
        )}
      </div>

      {isCompleted ? (
        <div className="bg-emerald-50 border border-emerald-200/60 p-3.5 rounded-xl flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-bold text-emerald-800 text-xs">Syabas! Anda telah selesai menonton video pengajaran ini. 🍃</span>
          </div>
          <div className="bg-lime-100 px-2.5 py-1 rounded-lg text-emerald-700 font-black text-[10px] shrink-0">+10 XP</div>
        </div>
      ) : (
        <div className="bg-stone-100 border border-stone-200/60 p-3 rounded-xl flex items-center justify-between text-[11px] text-stone-600 font-medium">
          <span className="flex items-center gap-1.5"><Tv className="w-3.5 h-3.5 text-stone-500 animate-pulse" /> Tonton video pengajaran sehingga selesai untuk membuka dahan ilmu.</span>
          <button type="button" onClick={onCompleted} className="text-stone-500 font-bold underline hover:text-emerald-600 ml-2 whitespace-nowrap shrink-0">Langkau</button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT: LessonPage
// ============================================================================
const safeJsonParse = (str, fallback = []) => {
  if (!str) return fallback;
  if (typeof str === "object") return str; // 🔥 PERISAI DOUBLE-PARSE: Elak server crash
  try {
    let cleanStr = String(str).replace(/^```json/i, "").replace(/^```/i, "").replace(/```$/i, "").trim();
    return JSON.parse(cleanStr);
  } catch (e) { return fallback; }
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
  const [loading, setLoading] = useState(true);

  const [flashcards, setFlashcards] = useState(null);
  const [mindMap, setMindMap] = useState(null);
  const [rawBankQuestions, setRawBankQuestions] = useState([]);

  // DATA KUSTOM
  const [customVideoUrl, setCustomVideoUrl] = useState("");
  const [customNotes, setCustomNotes] = useState("");
  const [customInfographic, setCustomInfographic] = useState("");

  const [activeTab, setActiveTab] = useState("map"); 
  const [progressState, setProgressState] = useState({
    video_completed: false, lesson_completed: false, flashcard_completed: false,
    mindmap_completed: false, quiz_completed: false, current_stage: "video", xp_earned: 0
  });

  const [status, setStatus] = useState({ lesson: false, flashcards: false, mindmap: false, quiz: false });
  const studyStartRef = useRef(null);
  const sessionRef = useRef(null);

  useEffect(() => { sessionRef.current = sessionId; }, [sessionId]);
  const isTopicUnlocked = progressState.quiz_completed || (progressState.video_completed && progressState.lesson_completed && progressState.flashcard_completed && progressState.mindmap_completed);

  const bersihkanTeksPadanan = (str) => {
    if (!str) return "";
    return str.toLowerCase().replace(/dan/g, "").replace(/&/g, "").replace(/misi\s*\d+/g, "").replace(/[^a-z0-9]/g, "").trim();
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
        setSubject(sub); setTopic(top);

        try {
          const allQuizBanks = await base44.entities.Quiz.filter({});
          let foundBank = null;

          if (allQuizBanks && allQuizBanks.length > 0) {
            foundBank = allQuizBanks.find(b => b.id === topicId);
            if (!foundBank) {
              const targetClean = bersihkanTeksPadanan(top.name);
              foundBank = allQuizBanks.find(b => {
                if (!b.topic_name) return false;
                const adminClean = bersihkanTeksPadanan(b.topic_name);
                return b.id === topicId || adminClean === targetClean || targetClean.includes(adminClean) || adminClean.includes(targetClean);
              });
            }
          }

          if (foundBank && isMounted) {
            const parsedQuestions = safeJsonParse(foundBank.questions_json, []);
            setRawBankQuestions(parsedQuestions);
            if (foundBank.infographic_url) setCustomInfographic(foundBank.infographic_url);
            
            // 🌟 PELAN SANDARAN: Jika video_url asli masih wujud
            if (foundBank.video_url && typeof foundBank.video_url === "string") {
              setCustomVideoUrl(foundBank.video_url);
            }

            // 🌟 PROSES PEEKING (PIGGYBACK): Tulis ganti (override) jika ada data seludup JSON
            if (parsedQuestions.length > 0) {
              const itemInduk = parsedQuestions[0];
              if (itemInduk.custom_video_url) setCustomVideoUrl(itemInduk.custom_video_url);
              if (itemInduk.custom_notes) setCustomNotes(itemInduk.custom_notes);
            }
          }
        } catch (quizBankErr) { console.error(quizBankErr); }

        try {
          let cachedSessions = await base44.entities.StudySession.filter({ student_id: user.id, topic_id: topicId }, "-created_date", 1);
          let sessionWithNotes = cachedSessions[0] || null;
          if (isMounted && sessionWithNotes) {
            setProgressState({
              video_completed: sessionWithNotes.video_completed || false,
              lesson_completed: sessionWithNotes.lesson_completed || false,
              flashcard_completed: sessionWithNotes.flashcard_completed || false,
              mindmap_completed: sessionWithNotes.mindmap_completed || false,
              quiz_completed: sessionWithNotes.quiz_completed || false,
              current_stage: sessionWithNotes.current_stage || "video",
              xp_earned: sessionWithNotes.xp_earned || 0
            });
            setSessionId(sessionWithNotes.id);
          }
        } catch (sErr) {}

      } catch (err) {} finally { if (isMounted) { studyStartRef.current = Date.now(); setLoading(false); } }
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
  const getLanguageMode = useCallback(() => subject?.name?.toLowerCase()?.includes("english") ? "en" : "ms", [subject]);
  const triggerConfetti = () => confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });

  const updateStageProgress = useCallback(async (stageId, nextStage, xpAwarded) => {
    let currentSessionId = sessionRef.current;
    setProgressState(prev => {
      const sudahSelesai = prev[`${stageId}_completed`];
      const updatedState = { ...prev, [`${stageId}_completed`]: true, current_stage: prev[`${nextStage}_completed`] ? prev.current_stage : nextStage, xp_earned: prev.xp_earned + (sudahSelesai ? 0 : xpAwarded) };
      if (currentSessionId) setTimeout(() => { base44.entities.StudySession.update(currentSessionId, updatedState).catch(()=>{}); }, 0);
      return updatedState;
    });
    triggerConfetti();
  }, []);

  const handleVideoStageCompleted = useCallback(async () => {
    if (progressState.video_completed) { setActiveTab("map"); return; }
    let currentId = sessionRef.current;
    if (!currentId) {
      try {
        const user = await base44.auth.me();
        const newSession = await base44.entities.StudySession.create({
          student_id: user.id, subject_id: subjectId, topic_id: topicId, topic_name: topic.name, subject_name: subject.name, duration_minutes: 0,
          ...progressState, video_completed: true, current_stage: "lesson", xp_earned: 10
        });
        const validId = Array.isArray(newSession) ? newSession[0]?.id : newSession?.id;
        setSessionId(validId); sessionRef.current = validId;
        setProgressState(p => ({ ...p, video_completed: true, current_stage: "lesson", xp_earned: 10 }));
        triggerConfetti(); setActiveTab("map"); return;
      } catch (err) { return; }
    }
    await updateStageProgress("video", "lesson", 10);
    setActiveTab("map");
  }, [progressState, subjectId, topicId, topic, subject, updateStageProgress]);

  const handleLessonStageCompleted = async () => {
    setStatus(p => ({ ...p, lesson: true }));
    try {
      let currentSessionId = sessionRef.current;
      const nextStatePayload = { ...progressState, lesson_completed: true, current_stage: progressState.flashcard_completed ? progressState.current_stage : "flashcard", xp_earned: progressState.xp_earned + (progressState.lesson_completed ? 0 : 15) };
      if (!currentSessionId) {
        const user = await base44.auth.me();
        const newSession = await base44.entities.StudySession.create({ student_id: user.id, subject_id: subjectId, topic_id: topicId, topic_name: topic.name, subject_name: subject.name, duration_minutes: 0, ...nextStatePayload });
        const validId = Array.isArray(newSession) ? newSession[0]?.id : newSession?.id;
        setSessionId(validId); sessionRef.current = validId;
      } else { await base44.entities.StudySession.update(currentSessionId, nextStatePayload); }
      setProgressState(prev => ({ ...prev, ...nextStatePayload })); triggerConfetti(); setActiveTab("map");
    } catch (e) {} finally { setStatus(p => ({ ...p, lesson: false })); }
  };

  const loadFlashcardsOnDemand = async () => {
    setActiveTab("flashcard"); if (flashcards && flashcards.length > 0) return;
    setStatus(p => ({ ...p, flashcards: true }));
    try {
      if (rawBankQuestions && rawBankQuestions.length > 0) {
        setFlashcards(shuffleArray(rawBankQuestions).slice(0, 5).map(q => ({ front: q.question, back: `${q.correct_answer}\n\n${q.explanation || ""}` }))); return;
      }
    } catch (err) {} finally { setStatus(p => ({ ...p, flashcards: false })); }
  };

  const loadMindMapOnDemand = async () => {
    setActiveTab("mindmap"); if (customInfographic || (mindMap && mindMap.length > 0)) return;
    setStatus(p => ({ ...p, mindmap: true }));
    try {
      const res = await base44.integrations.Core.InvokeLLM({ model: "gemini_3_flash", prompt: `Generate mindmap branches array for summary: ${topic.name}`, response_json_schema: {type: "array", items: {type: "object", properties: { label: { type: "string" }, children: { type: "array", items: { type: "string" } } }, required: ["label", "children"]}} });
      setMindMap(res);
    } catch (e) {} finally { setStatus(p => ({ ...p, mindmap: false })); }
  };

  const runQuizGeneration = async (numQ) => {
    await recordStudyTime(); setStatus(p => ({ ...p, quiz: true }));
    let currentSessionId = sessionRef.current;
    try {
      if (!currentSessionId) {
        const user = await base44.auth.me();
        const newSession = await base44.entities.StudySession.create({ student_id: user.id, subject_id: subjectId, topic_id: topicId, topic_name: topic?.name || "Topik", subject_name: subject?.name || "Subjek", duration_minutes: 0, ...progressState, current_stage: "quiz" });
        currentSessionId = Array.isArray(newSession) ? newSession[0]?.id : newSession?.id;
        setSessionId(currentSessionId); sessionRef.current = currentSessionId;
      }
      const pool = shuffleArray(rawBankQuestions).slice(0, numQ);
      const quizData = await base44.entities.Quiz.create({ session_id: currentSessionId, topic_name: topic?.name || "Topik", subject_name: subject?.name || "Subjek", questions_json: JSON.stringify(pool), difficulty: numQ >= 20 ? "hard" : "medium", num_questions: pool.length });
      const finalQuizId = Array.isArray(quizData) ? quizData[0]?.id : quizData?.id;
      await base44.entities.StudySession.update(currentSessionId, { quiz_completed: true, current_stage: "quiz" });
      navigate(`/quiz/${finalQuizId}`);
    } catch (e) { } finally { setStatus(p => ({ ...p, quiz: false })); }
  };

  if (loading) return (<div className="flex flex-col items-center justify-center min-h-[50vh] bg-[#FAFAF7]"><Loader2 className="w-10 h-10 text-emerald-500 animate-spin" /></div>);

  // PILIHAN URL MUKTAMAD
  const videoSumberUtama = customVideoUrl || topic?.video_url;

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto space-y-5 pb-24 font-sans bg-[#FAFAF7] min-h-screen">
      
      {/* 🌟 GLOBAL HEADER (THEATER MODE) */}
      {activeTab === "map" ? (
        <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-xs flex items-center justify-between transition-all duration-300">
          <div className="flex items-center gap-3">
            <Link to={`/study/${subjectId}`} className="p-2 bg-[#F3EFE6] rounded-xl text-stone-600 hover:bg-[#E3D9C6] transition-colors"><ArrowLeft className="w-4 h-4" /></Link>
            <div>
              <h2 className="text-[10px] font-black text-emerald-600 uppercase tracking-wider flex items-center gap-1"><Compass className="w-3 h-3" /> {subject?.name}</h2>
              <h1 className="text-sm font-black text-stone-800">Misi: {topic?.name}</h1>
            </div>
          </div>
          <div className="bg-gradient-to-r from-lime-400 to-emerald-500 px-3 py-1.5 rounded-xl text-white font-black text-xs shadow-xs"><Leaf className="w-3.5 h-3.5 fill-lime-200 inline mr-1" /> {progressState.xp_earned} XP</div>
        </div>
      ) : (
        <div className="bg-stone-950 text-stone-300 rounded-xl p-2.5 flex items-center justify-between shadow-xs transition-all duration-300">
          <button type="button" onClick={() => setActiveTab("map")} className="flex items-center gap-1.5 text-xs font-bold text-stone-300 hover:text-white bg-stone-900/50 px-3 py-1 rounded-lg border border-stone-800 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Keluar Mod Misi
          </button>
          <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400 truncate max-w-[50%]">{topic?.name}</span>
        </div>
      )}

      {isTopicUnlocked && activeTab === "map" && (
        <div className="bg-amber-50 border border-amber-200/50 p-3 rounded-xl text-[11px] font-semibold text-amber-800">
          🌳 Mod Ulangkaji Bebas Aktif! Semua dahan kurikulum kini terbuka untuk anda teroka.
        </div>
      )}

      <AnimatePresence mode="wait">
        {activeTab === "map" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <LessonProgress 
              steps={isTopicUnlocked ? { video: true, lesson: true, flashcard: true, mindmap: true, quiz: true } : { video: progressState.video_completed, lesson: progressState.lesson_completed, flashcard: progressState.flashcard_completed, mindmap: progressState.mindmap_completed, quiz: progressState.quiz_completed }} 
              onStepClick={(key) => { if (key === "video") setActiveTab("video"); if (key === "lesson") setActiveTab("lesson"); if (key === "flashcard") loadFlashcardsOnDemand(); if (key === "mindmap") loadMindMapOnDemand(); if (key === "quiz") setActiveTab("quiz"); }}
            />
          </motion.div>
        )}

        {/* 🌟 STAGE 1: CINEMA VIDEO FOCUS LAYER */}
        {activeTab === "video" && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/60 shadow-md space-y-4">
            <YouTubeLesson videoUrl={videoSumberUtama} isCompleted={progressState.video_completed} onCompleted={handleVideoStageCompleted} />
            {progressState.video_completed && (
              <Button onClick={() => setActiveTab("map")} className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 font-black rounded-xl text-white text-xs border-0 shadow-xs">
                Kembali Meneroka Pokok Ilmu 🌳
              </Button>
            )}
          </motion.div>
        )}

        {/* STAGE 2: NOTA PINTAR */}
        {activeTab === "lesson" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-md space-y-4">
            <div className="prose prose-sm max-w-none max-h-[350px] overflow-y-auto p-4 border rounded-xl bg-[#FAFAF7] shadow-inner">
              {customNotes ? <p className="whitespace-pre-line text-xs sm:text-sm font-semibold leading-relaxed text-stone-700">{customNotes}</p> : <p className="text-xs text-slate-400">Nota belum tersedia.</p>}
            </div>
            <Button onClick={handleLessonStageCompleted} className="w-full h-12 bg-emerald-600 text-white text-xs font-black rounded-xl border-0">Selesai Membaca Nota 🍃</Button>
          </motion.div>
        )}

        {/* STAGE 3: FLASHCARD */}
        {activeTab === "flashcard" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-md space-y-4">
            <Flashcards flashcards={flashcards || []} lang={getLanguageMode()} />
            <Button onClick={() => updateStageProgress("flashcard", "mindmap", 15).then(() => setActiveTab("map"))} className="w-full h-12 bg-emerald-600 text-white text-xs font-black rounded-xl border-0 mt-2 shadow-xs">Selesai Ulangkaji Kad 🌳</Button>
          </motion.div>
        )}

        {/* STAGE 4: MINDMAP */}
        {activeTab === "mindmap" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-md space-y-4">
            <div className="min-h-[220px] bg-[#FAFAF7] rounded-xl p-3 border flex flex-col items-center justify-center">
              {customInfographic ? <img src={customInfographic} alt="Mindmap" className="w-full h-auto rounded-xl max-h-72 object-contain bg-white border shadow-2xs" /> : <MindMap mindMap={{ central_topic: topic?.name || "Utama", branches: mindMap || [] }} lang={getLanguageMode()} />}
            </div>
            <Button onClick={() => updateStageProgress("mindmap", "quiz", 15).then(() => setActiveTab("map"))} className="w-full h-12 bg-emerald-600 text-white text-xs font-black rounded-xl border-0 mt-2 shadow-xs">Selesai Teroka Peta! 🗺️</Button>
          </motion.div>
        )}

        {/* STAGE 5: FINAL BOSS CHALLENGE */}
        {activeTab === "quiz" && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-200 shadow-md">
            <div className="space-y-4 text-center sm:text-left">
              <h3 className="text-base font-black text-amber-950">⚔️ Misi Terakhir: Kuiz Puncak Dahan</h3>
              <p className="text-xs text-amber-800 font-medium">Sedia menduduki ujian cabaran minda untuk menawan kemuncak dahan ilmu ini? 🏆</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <Button onClick={() => runQuizGeneration(10)} disabled={status.quiz} className="bg-amber-500 hover:bg-amber-600 text-white h-14 text-xs font-black rounded-xl w-full border-0 shadow-2xs">{status.quiz ? "Menyusun..." : "Cabaran Pantas (10 Soalan)"}</Button>
                <Button onClick={() => runQuizGeneration(20)} disabled={status.quiz} className="bg-orange-500 hover:bg-orange-600 text-white h-14 text-xs font-black rounded-xl w-full border-0 shadow-2xs">{status.quiz ? "Menjana..." : "Ujian Boss Padu (20 Soalan)"}</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
