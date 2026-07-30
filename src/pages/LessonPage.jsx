// src/pages/LessonPage.jsx
// Student Lesson Viewer — Powered strictly by getLearningPackage & BlockRenderer

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { getActiveStudentId } from "@/lib/rewardSystem";
import { processReward } from "@/lib/rewardEngine";
import { personalize } from "@/lib/personalize";
import {
  Leaf,
  Loader2,
  Trophy,
  Compass,
  BookOpen,
  ChevronLeft,
  MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

import LessonProgress from "@/components/lesson/LessonProgress";
import BlockRenderer, { bersihkanTeksUntukSuara } from "@/components/lesson/BlockRenderer";

// ==========================================
// SUBJECT WORLD THEMES
// ==========================================
const WORLD_THEMES = {
  science: {
    name: "Discovery Jungle",
    mascotName: "Bimo Orangutan",
    emoji: "🦧",
    bgGradient: "bg-gradient-to-b from-emerald-950 via-green-950 to-stone-950",
    cardBg: "bg-stone-900/90 border-emerald-500/40 text-emerald-100",
    accentColor: "bg-emerald-500 hover:bg-emerald-400 text-stone-950",
    badgeBg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
  },
  math: {
    name: "Number Island",
    mascotName: "Suku Penyu",
    emoji: "🐢",
    bgGradient: "bg-gradient-to-b from-blue-950 via-indigo-950 to-stone-950",
    cardBg: "bg-stone-900/90 border-blue-500/40 text-blue-100",
    accentColor: "bg-blue-500 hover:bg-blue-400 text-stone-950",
    badgeBg: "bg-blue-500/20 text-blue-300 border-blue-500/30"
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

export default function LessonPage() {
  const { subjectId, topicId } = useParams();
  const navigate = useNavigate();

  const [packageData, setPackageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("map");
  const [isSpeaking, setIsSpeaking] = useState(false);

  const [progressState, setProgressState] = useState({
    video_completed: false,
    lesson_completed: false,
    flashcard_completed: false,
    mindmap_completed: false,
    games_completed: false,
    quiz_completed: false,
    xp_earned: 0
  });

  const sessionStartRef = useRef(Date.now());
  const sessionIdRef = useRef(null);

  // 1. Fetch unified Learning Package via single API endpoint
  useEffect(() => {
    let isMounted = true;
    const loadPackage = async () => {
      try {
        setLoading(true);
        const res = await base44.functions.invoke("getLearningPackage", {
          topic_id: topicId,
          subject_id: subjectId
        });

        if (res.data?.success && isMounted) {
          setPackageData(res.data);
        }
      } catch (err) {
        console.error("Gagal memuatkan pakej pelajaran:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadPackage();
    return () => { isMounted = false; };
  }, [subjectId, topicId]);

  // Extract ordered blocks & assessments
  const sortedBlocks = useMemo(() => {
    const rawBlocks = packageData?.content_blocks || [];
    return [...rawBlocks].sort((a, b) => (a.order_number || 0) - (b.order_number || 0));
  }, [packageData]);

  const assessments = packageData?.assessments || [];
  const primaryAssessment = assessments[0] || null;
  const studentName = packageData?.student_context?.display_name || "Pengembara";

  // Session duration calculator
  const getElapsedMinutes = useCallback(() => {
    return Math.max(1, Math.round((Date.now() - sessionStartRef.current) / 60000));
  }, []);

  // Update StudySession duration every 60 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      const sId = sessionIdRef.current;
      if (!sId) return;
      try {
        await base44.entities.StudySession.update(sId, { duration_minutes: getElapsedMinutes() });
      } catch (err) {}
    }, 60000);
    return () => clearInterval(interval);
  }, [getElapsedMinutes]);

  const triggerConfetti = () => confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });

  const handleStageComplete = async (stageKey, xpAmount) => {
    if (progressState[`${stageKey}_completed`]) {
      setActiveTab("map");
      return;
    }

    const studentId = await getActiveStudentId();
    setProgressState(prev => ({
      ...prev,
      [`${stageKey}_completed`]: true,
      xp_earned: prev.xp_earned + xpAmount
    }));

    if (studentId) {
      await processReward(studentId, {
        activityType: "lesson_complete",
        referenceId: `${topicId}_${stageKey}`,
        referenceName: `${packageData?.lesson?.title || "Misi"} - ${stageKey}`,
        subjectName: packageData?.curriculum_context?.subject_name,
        reason: `Selesai ${stageKey.toUpperCase()}`
      }).catch(() => {});
    }

    triggerConfetti();
    setActiveTab("map");
  };

  const handleSpeech = (text) => {
    if (!("speechSynthesis" in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const cleanText = bersihkanTeksUntukSuara(personalize(text, studentName));
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "ms-MY";
    utterance.rate = 0.9;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-emerald-950 text-white">
        <Loader2 className="w-12 h-12 text-lime-400 animate-spin" />
        <p className="mt-4 font-black text-lime-200 text-sm">Membuka Pakej Pembelajaran...</p>
      </div>
    );
  }

  const worldTheme = WORLD_THEMES.default;

  return (
    <div className={`min-h-screen ${worldTheme.bgGradient} font-sans text-stone-100 pb-24 px-4 py-6`}>
      <div className="max-w-4xl mx-auto space-y-6">

        {/* TOP HUD BAR */}
        <div className="bg-stone-900/90 border-2 border-stone-700/80 rounded-3xl p-4 shadow-xl flex items-center justify-between backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/study/${subjectId}`)}
              className="p-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-2xl transition-all border border-stone-600 active:scale-95"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${worldTheme.badgeBg}`}>
                {packageData?.curriculum_context?.subject_name || "Subjek"}
              </span>
              <h1 className="text-sm sm:text-base font-black text-white mt-1 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-amber-400" /> {packageData?.lesson?.title || "Misi Pembelajaran"}
              </h1>
            </div>
          </div>

          <div className="bg-gradient-to-r from-amber-400 to-lime-400 px-4 py-2 rounded-2xl text-stone-950 font-black text-xs sm:text-sm shadow-md flex items-center gap-1.5">
            <Leaf className="w-4 h-4 fill-stone-950" /> {progressState.xp_earned} XP
          </div>
        </div>

        {/* DYNAMIC STAGE NAVIGATION BAR */}
        <div className="bg-stone-900/80 border border-stone-700/60 rounded-2xl p-2 flex items-center justify-around overflow-x-auto gap-1 shadow-md">
          <button
            onClick={() => setActiveTab("map")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
              activeTab === "map" ? "bg-amber-400 text-stone-950 shadow-sm" : "text-stone-300 hover:bg-stone-800"
            }`}
          >
            <MapPin className="w-3.5 h-3.5" /> Peta
          </button>

          {sortedBlocks.map((block) => (
            <button
              key={block.id}
              onClick={() => setActiveTab(block.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                activeTab === block.id ? "bg-emerald-400 text-stone-950 shadow-sm" : "text-stone-300 hover:bg-stone-800"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" /> {block.title || block.block_type}
            </button>
          ))}

          <button
            onClick={() => setActiveTab("quiz")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
              activeTab === "quiz" ? "bg-rose-400 text-stone-950 shadow-sm" : "text-stone-300 hover:bg-stone-800"
            }`}
          >
            <Trophy className="w-3.5 h-3.5" /> Ujian
          </button>
        </div>

        {/* CONTENT DYNAMIC STAGES */}
        <AnimatePresence mode="wait">
          {/* MAP ROADMAP STAGE */}
          {activeTab === "map" && (
            <motion.div key="map" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <LessonProgress
                steps={{
                  video: progressState.video_completed,
                  lesson: progressState.lesson_completed,
                  flashcard: progressState.flashcard_completed,
                  mindmap: progressState.mindmap_completed,
                  games: progressState.games_completed,
                  quiz: progressState.quiz_completed
                }}
                onStepClick={(key) => {
                  const targetBlock = sortedBlocks.find(b => b.block_type.toLowerCase().includes(key));
                  if (targetBlock) setActiveTab(targetBlock.id);
                  else if (key === "quiz") setActiveTab("quiz");
                }}
              />
            </motion.div>
          )}

          {/* DYNAMIC CONTENT BLOCK STAGES VIA BLOCKRENDERER */}
          {sortedBlocks.map((block) => {
            if (activeTab !== block.id) return null;
            return (
              <motion.div key={block.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-stone-900/90 rounded-3xl p-6 border-2 border-stone-800 shadow-xl space-y-4">
                <BlockRenderer
                  block={block}
                  studentName={studentName}
                  isSpeaking={isSpeaking}
                  onSpeak={handleSpeech}
                  onComplete={() => handleStageComplete(block.block_type.toLowerCase(), 15)}
                />
              </motion.div>
            );
          })}

          {/* QUIZ ASSESSMENT STAGE */}
          {activeTab === "quiz" && (
            <motion.div key="quiz" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-gradient-to-br from-amber-950 to-stone-900 rounded-3xl p-8 border-2 border-amber-500/40 shadow-2xl text-center space-y-4">
              <Trophy className="w-14 h-14 text-amber-400 mx-auto animate-bounce" />
              <h3 className="text-xl font-black text-amber-200">⚔️ Ujian Kemahiran Boss</h3>
              <p className="text-xs text-stone-300 font-bold">Jawab soalan penilaian untuk melengkapkan modul ini!</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto pt-2">
                <Button
                  onClick={() => navigate(`/quiz/${primaryAssessment?.id || topicId}?limit=10&mode=practice`)}
                  className="bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs py-4 rounded-xl border-b-4 border-amber-600"
                >
                  ⚡ Latihan (10 Soalan)
                </Button>
                <Button
                  onClick={() => navigate(`/quiz/${primaryAssessment?.id || topicId}?limit=20&mode=mastery`)}
                  className="bg-orange-500 hover:bg-orange-400 text-stone-950 font-black text-xs py-4 rounded-xl border-b-4 border-orange-700"
                >
                  ⚔️ Ujian Mahir (20 Soalan)
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
