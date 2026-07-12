// src/pages/LessonPage.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { 
  ArrowLeft, Play, Loader2, Trophy, Lock, Award, Compass, Tv, 
  CheckCircle2, AlertCircle, Leaf, Sprout, Sparkles, HelpCircle, Info
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
// COMPONENT 1: YouTubeLesson (Regex Diperkukuh & Stabil)
// ============================================================================
function YouTubeLesson({ videoUrl, onCompleted, isCompleted, xpEarned }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const playerRef = useRef(null);
  const checkIntervalRef = useRef(null);

  const getYouTubeId = (url) => {
    if (!url) return null;
    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = url.match(regExp);
    return (match && match[1].length === 11) ? match[1] : null;
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
      <div className="p-6 text-center bg-amber-50 border border-amber-200 rounded-3xl space-y-3">
        <p className="text-amber-700 font-bold text-sm">
          🎬 Tiada video pengajaran kustom dikesan untuk dahan ini. Klik butang di bawah untuk terus memanjat!
        </p>
        <Button onClick={onCompleted} className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black rounded-xl shadow-sm px-6 py-4 border-0">
          Selesai Tonton & Teruskan Misi 🚀
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
const safeJsonParse = (str, fallback = []) => {
  if (!str) return fallback;
  try {
    let cleanStr = str;
    if (typeof str === "string") cleanStr = str.replace(/^```json/i, "").replace(/^```/i, "").replace(/```$/i, "").trim();
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
  const [studentNickname, setStudentNickname] = useState(""); 
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [uiError, setUiError] = useState(null);

  const [explanation, setExplanation] = useState("");
  const [metaData, setMetaData] = useState({ summary: "", keywords: [] });
  const [flashcards, setFlashcards] = useState(null);
  const [mindMap, setMindMap] = useState(null);
  const [rawBankQuestions, setRawBankQuestions] = useState([]);

  // KANDUNGAN DATA KUSTOM PENTADBIR
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

  const isTopicUnlocked = progressState.quiz_completed || (
                          progressState.video_completed && progressState.lesson_completed && 
                          progressState.flashcard_completed && progressState.mindmap_completed);

  // 🎯 PEMBERSIH STRING UNTUK PADANAN AGRESIF (Bypass salah ejaan/emoji/imbuhan)
  const bersihkanTeksPadanan = (str) => {
    if (!str) return "";
    return str
      .toLowerCase()
      .replace(/dan/g, "")
      .replace(/&/g, "")
      .replace(/misi\s*\d+/g, "")
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E6}-\u{1F1FF}]/gu, "") 
      .replace(/[^a-z0-9]/g, "") 
      .trim();
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
        setStudentNickname(user?.nickname || "Sahabat");
        setIsPremium(user?.is_premium || false);

        // 🎯 ALGORITMA PENGIKATAN (DATA LINK BRIDGE) DIKEMASKINI 100% PINTAR
        try {
          const allQuizBanks = await base44.entities.Quiz.filter({});
          let foundBank = null;

          if (allQuizBanks && allQuizBanks.length > 0) {
            // Langkah 1: Cuba cari persamaan ID tulen
            foundBank = allQuizBanks.find(b => b.id === topicId);

            // Langkah 2: Jika gagal, tapis guna pembersihan kata kunci tajuk yang dipendam
            if (!foundBank) {
              const targetSiri = bersihkanTeksPadanan(top.name); // cth: "bandingbanyaksedikit"
              foundBank = allQuizBanks.find(b => {
                const adminSiri = bersihkanTeksPadanan(b.topic_name); // cth: "cabaranbanyaksedikit"
                
                // Cari jika ada perkataan penting bergolak yang bertindih
                return adminSiri.includes("banyak") && targetSiri.includes("banyak") ||
                       adminSiri.includes("sedikit") && targetSiri.includes("sedikit") ||
                       adminSiri === targetSiri;
              });
            }
          }

          if (foundBank && isMounted) {
            console.log("🎯 Jambatan Sukses! Data Admin Dikunci:", foundBank);
            setRawBankQuestions(safeJsonParse(foundBank.questions_json, []));
            if (foundBank.video_url) setCustomVideoUrl(foundBank.video_url);
            if (foundBank.infographic_url) setCustomInfographic(foundBank.infographic_url);
            if (foundBank.notes_json) {
              try { setCustomNotes(JSON.parse(foundBank.notes_json)); } 
              catch (e) { setCustomNotes(foundBank.notes_json); }
            }
          }
        } catch (quizBankErr) {
          console.error("Gagal merangkum data resources admin:", quizBankErr);
        }

        // Muat kemajuan sesi pelajar
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

      } catch (err) {
        if (isMounted) setUiError("Gagal memuat turun data kurikulum.");
      } finally {
        if (isMounted) { studyStartRef.current = Date.now(); setLoading(false); }
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

  if (loading) return (<div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 bg-[#FAFAF7]"><Loader2 className="w-12 h-12 text-emerald-500 animate-spin" /><p className="text-sm font-bold text-emerald-700/60 uppercase">Membuka laluan dahan...</p></div>);

  return (
    <div className="px-4 py-6 max-w-md md:max-w-2xl lg:max-w-4xl mx-auto space-y-6 pb-28 font-sans bg-[#FAFAF7] min-h-screen">
      
      {/* HEADER BAR */}
      <div className="bg-white rounded-[1.5rem] p-4 border border-emerald-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-2 z-40 backdrop-blur-md bg-white/90">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link to={`/study/${subjectId}`} className="p-2.5 bg-[#F3EFE6] rounded-xl text-stone-600 hover:bg-[#E3D9C6] shrink-0"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="min-w-0">
            <h2 className="text-xs font-black text-emerald-600 uppercase tracking-wider flex items-center gap-1"><Compass className="w-3.5 h-3.5" /> {subject?.name}</h2>
            <h1 className="text-sm sm:text-base font-black truncate text-stone-800">Misi: {topic?.name}</h1>
          </div>
        </div>
        <div className="bg-gradient-to-r from-lime-400 to-emerald-500 px-4 py-2 rounded-xl text-white font-black text-xs shadow-sm flex items-center gap-1.5"><Leaf className="w-4 h-4 fill-lime-200 text-lime-200" /> {progressState.xp_earned} XP</div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "map" && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}>
            <LessonProgress 
              steps={isTopicUnlocked ? { video: true, lesson: true, flashcard: true, mindmap: true, quiz: true } : { video: progressState.video_completed, lesson: progressState.lesson_completed, flashcard: progressState.flashcard_completed, mindmap: progressState.mindmap_completed, quiz: progressState.quiz_completed }} 
              onStepClick={(key) => { if (key === "video") setActiveTab("video"); if (key === "lesson") setActiveTab("lesson"); if (key === "flashcard") loadFlashcardsOnDemand(); if (key === "mindmap") loadMindMapOnDemand(); if (key === "quiz") setActiveTab("quiz"); }}
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
            
            {/* 🖥️ MEMAPARKAN VIDEO KUSTOM ADMIN SECARA STRUCTURAL */}
            <YouTubeLesson videoUrl={customVideoUrl} isCompleted={progressState.video_completed} xpEarned={progressState.video_completed ? 0 : 10} onCompleted={handleVideoStageCompleted} />
            
            {/* 🎯 PANEL DIAGNOSTIK AUTOMATIK (Akan keluar HANYA jika video gagal dikesan) */}
            {!customVideoUrl && (
              <div className="mt-4 p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 font-black text-amber-800 uppercase text-[10px] tracking-wider">
                  <Info className="w-4 h-4 text-amber-600" /> Bantuan Hubungan Admin (Diagnostics)
                </div>
                <p className="font-medium">Data Admin tidak terpapar kerana sistem gagal memadankan nama kurikulum pelajar dengan fail JSON anda. Sila ikuti langkah penyelesaian ini:</p>
                <div className="bg-white p-2.5 rounded-xl border border-amber-100 space-y-1 font-mono text-[11px] text-slate-700">
                  <div>1. Pergi ke borang Admin <span className="font-bold text-indigo-600">LessonResources</span></div>
                  <div>2. Cipta Topik Baru dengan menaruh nilai ini:</div>
                  <div className="p-1.5 bg-slate-100 rounded-md mt-1">
                    <div>• ID Unik Topik: <span className="font-black text-rose-600 select-all">{topicId}</span></div>
                    <div>• Tajuk Utama: <span className="font-black text-rose-600 select-all">{topic?.name}</span></div>
                  </div>
                </div>
                <p className="text-[10px] text-amber-600/80">Apabila anda menaruh ID dan Tajuk Utama yang tepat seperti di atas, video kustom dan fail JSON anda akan terus masuk ke dahan murid serta merta! ✨</p>
              </div>
            )}

            {progressState.video_completed && (
              <Button onClick={() => setActiveTab("map")} className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 font-black rounded-xl text-white border-0">
                Kembali Ke Peta Pokok 🌳
              </Button>
            )}
          </motion.div>
        )}

        {/* ... Dahan Nota, Flashcard & Quiz (Fungsi Asal Dipertahankan Sepenuhnya) ... */}
        {activeTab === "lesson" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-[2rem] p-6 border border-emerald-100 shadow-lg space-y-6">
            <div className="flex justify-between items-center border-b border-stone-100 pb-4"><h3 className="text-lg font-black text-stone-800 flex items-center gap-2">📖 Dahan 2: Nota Pintar</h3><Button size="sm" variant="ghost" onClick={() => setActiveTab("map")}>Tutup ✖</Button></div>
            <div className="prose prose-sm max-w-none text-stone-700 max-h-[400px] overflow-y-auto p-4 border border-emerald-50 rounded-2xl bg-[#FAFAF7] shadow-inner">
              {customNotes ? <p className="whitespace-pre-line text-sm font-semibold">{customNotes}</p> : <p className="text-xs text-slate-400">Sila muat nota menggunakan butang peta.</p>}
            </div>
            <Button onClick={handleLessonStageCompleted} className="w-full h-14 bg-emerald-600 text-white font-black rounded-xl">Selesai Baca Nota 🍃</Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
