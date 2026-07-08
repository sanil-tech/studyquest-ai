// src/pages/LessonPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Sparkles, Play, Loader2, Trophy, BookOpen, Layers, GitFork, Lock, Youtube, ArrowRight, CheckCircle, RefreshCw, Star, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
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

// ============================================================================
// 2. SUB-COMPONENT: UPGRADED 10-LEVEL INTERACTIVE GAME (KHUSUS TAHUN 1)
// ============================================================================
function Year1InteractiveGame({ studentNickname, onComplete }) {
  // Database 10 Soalan Interaktif bertemakan Matematik & Sains Tahun 1 KSSR (Kuantiti & Padanan Asas)
  const gameDatabase = [
    { id: 1, emoji: "🍎 🍎 🍎", name: "3 Biji Epal", options: [2, 3, 4], correct: 3 },
    { id: 2, emoji: "🐱 🐱 🐱 🐱 🐱", name: "5 Ekor Kucing", options: [3, 5, 6], correct: 5 },
    { id: 3, emoji: "🍦 🍦", name: "2 Batang Aiskrim", options: [1, 2, 3], correct: 2 },
    { id: 4, emoji: "🚗 🚗 🚗 🚗", name: "4 Buah Kereta", options: [4, 5, 2], correct: 4 },
    { id: 5, emoji: "🎈", name: "1 Biji Belon", options: [1, 2, 3], correct: 1 },
    { id: 6, emoji: "⭐️ ⭐️ ⭐️ ⭐️ ⭐️ ⭐️", name: "6 Butir Bintang", options: [5, 6, 7], correct: 6 },
    { id: 7, emoji: "🐸 🐸 🐸 🐸 🐸 🐸 🐸", name: "7 Ekor Katak", options: [6, 7, 8], correct: 7 },
    { id: 8, emoji: "🐟 🐟 🐟 🐟 🐟 🐟 🐟 🐟", name: "8 Ekor Ikan", options: [7, 8, 9], correct: 8 },
    { id: 9, emoji: "🦋 🦋 🦋 🦋 🦋 🦋 🦋 🦋 🦋", name: "9 Ekor Rama-rama", options: [8, 9, 10], correct: 9 },
    { id: 10, emoji: "🍪 🍪 🍪 🍪 🍪 🍪 🍪 🍪 🍪 🍪", name: "10 Keping Biskut", options: [7, 9, 10], correct: 10 },
  ];

  const [currentLevel, setCurrentLevel] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("Seret gambar kumpulan objek ke sarang nombor yang betul! 🎈");
  const [wrongAttempts, setWrongAttempts] = useState(0);

  const currentQuestion = gameDatabase[currentLevel];

  const handleDragEnd = (event, info) => {
    // Cari zon sasaran hantaran (Drop targets) di skrin peranti
    const dropTargets = document.querySelectorAll(".game-drop-target");
    let selectedNumberValue = null;

    dropTargets.forEach((target) => {
      const rect = target.getBoundingClientRect();
      if (
        info.point.x >= rect.left &&
        info.point.x <= rect.right &&
        info.point.y >= rect.top &&
        info.point.y <= rect.bottom
      ) {
        selectedNumberValue = parseInt(target.getAttribute("data-value"), 10);
      }
    });

    if (selectedNumberValue === currentQuestion.correct) {
      // JAWAPAN BETUL 🎉
      confetti({ particleCount: 50, spread: 50, origin: { y: 0.6 } });
      setFeedbackMessage(`Hebat ${studentNickname}! Jawapan tepat, itu adalah ${currentQuestion.name}! ✨`);
      
      // Semak jika sudah sampai soalan terakhir (Soalan ke-10)
      if (currentLevel + 1 >= gameDatabase.length) {
        setIsFinished(true);
        if (onComplete) onComplete();
      } else {
        // Melompat ke level seterusnya selepas jeda masa animasi pendek
        setTimeout(() => {
          setCurrentLevel((prev) => prev + 1);
          setFeedbackMessage("Wah, mari selesaikan cabaran seterusnya! 🚀");
          setWrongAttempts(0);
        }, 1200);
      }
    } else if (selectedNumberValue !== null) {
      // JAWAPAN SALAH 🦊
      setWrongAttempts((prev) => prev + 1);
      setFeedbackMessage("Opps! Kuantiti kurang tepat. Cuba kira semula objek di atas ya? 🌸");
    }
  };

  const restartGame = () => {
    setCurrentLevel(0);
    setIsFinished(false);
    setWrongAttempts(0);
    setFeedbackMessage("Jom cuba lagi! Seret gambar kumpulan objek ke sarang nombor yang betul! 🎈");
  };

  if (isFinished) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-b from-emerald-50 to-emerald-100/50 rounded-3xl p-6 border-2 border-emerald-200 text-center space-y-4 shadow-md"
      >
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl animate-bounce">
          🏆
        </div>
        <h4 className="text-xl font-extrabold text-emerald-900">10 / 10 Markah Penuh!</h4>
        <p className="text-sm text-emerald-700 font-medium">
          Syabas {studentNickname}! Anda berjaya menyelesaikan kesemua 10 peringkat permainan padanan interaktif KSSR dengan sangat bijak!
        </p>
        <div className="flex gap-2 justify-center pt-2">
          <Button onClick={restartGame} variant="outline" size="sm" className="rounded-xl border-emerald-300 text-emerald-700 bg-white gap-1 text-xs">
            <RefreshCw className="w-3 h-3" /> Main Semula
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-5 border-2 border-purple-200 text-center space-y-6 shadow-inner">
      {/* Penunjuk Tahap Soalan Semasa */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold text-purple-700 bg-purple-100 px-3 py-1 rounded-full">
          Soalan {currentQuestion.id} / 10
        </span>
        <div className="flex items-center gap-0.5">
          {[...Array(10)].map((_, idx) => (
            <Star 
              key={idx} 
              className={`w-3.5 h-3.5 ${idx <= currentLevel ? "text-amber-400 fill-amber-400" : "text-slate-200"}`} 
            />
          ))}
        </div>
      </div>

      {/* Bar mesej maklum balas interaktif */}
      <div className="bg-purple-50 text-purple-900 p-3 rounded-2xl text-xs sm:text-sm font-bold min-h-[44px] flex items-center justify-center border border-purple-100">
        {feedbackMessage}
      </div>

      {/* KOTAK SUBJEK GAMBAR YANG BOLEH DIALIKKAN (DRAG ITEM) */}
      <div className="py-6 flex justify-center items-center min-h-[120px]">
        <motion.div
          key={currentQuestion.id} // Memaksa pembaharuan komponen semasa pertukaran level
          drag
          dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
          dragElastic={0.5}
          onDragEnd={handleDragEnd}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          className="p-6 bg-gradient-to-br from-yellow-50 to-amber-100 border-2 border-amber-300 rounded-2xl shadow-md cursor-grab active:cursor-grabbing inline-flex flex-col items-center justify-center min-w-[140px] select-none"
        >
          <span className="text-3xl sm:text-4xl tracking-widest mb-2 filter drop-shadow-sm">
            {currentQuestion.emoji}
          </span>
          <span className="text-[11px] font-extrabold text-amber-900 tracking-wider bg-white/70 px-2 py-0.5 rounded-md">
            SORONG SAYA 👋
          </span>
        </motion.div>
      </div>

      <div className="border-t-2 border-dashed border-purple-100 my-2" />

      {/* SARANG PILIHAN JAWAPAN (DROP TARGETS) */}
      <div className="space-y-2">
        <p className="text-[11px] font-bold text-slate-400 flex items-center justify-center gap-1">
          <HelpCircle className="w-3 h-3" /> Letakkan gambar di dalam kotak nombor yang betul:
        </p>
        <div className="grid grid-cols-3 gap-3">
          {currentQuestion.options.map((opt, i) => (
            <div
              key={i}
              data-value={opt}
              className="game-drop-target h-24 rounded-2xl border-4 border-dashed border-purple-200 bg-purple-50/40 flex flex-col items-center justify-center gap-1 hover:bg-purple-100 hover:border-purple-300 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-purple-600 text-white font-extrabold flex items-center justify-center text-lg shadow-sm">
                {opt}
              </div>
              <span className="text-[10px] font-bold text-purple-700">Kotak {opt}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


// ============================================================================
// 3. MAIN COMPONENT LAYER
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

  // Cache States
  const [explanation, setExplanation] = useState("");
  const [videoUrl, setVideoUrl] = useState(""); 
  const [metaData, setMetaData] = useState({ summary: "", keywords: [] });
  const [flashcards, setFlashcards] = useState(null);
  const [mindMap, setMindMap] = useState(null);
  const [rawBankQuestions, setRawBankQuestions] = useState([]);

  // Logik Semakan Automatik Kanak-Kanak Tahun 1
  const [isYear1, setIsYear1] = useState(false);
  const [isGameCompleted, setIsGameCompleted] = useState(false);

  // URUTAN BELAJAR: 1: Video -> 2: Nota + Peta Minda -> 3: Game Flashcard/Padanan -> 4: Kuiz
  const [currentPhase, setCurrentPhase] = useState(1); 
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
    if (level.includes("tahun 1") || level.includes("standard 1") || level.includes("darjah 1")) return "Si Bijak";
    if (level.includes("tahun") || level.includes("standard") || level.includes("primary")) return "Bintang";
    return "Sahabat";
  };

  useEffect(() => {
    isUnmounted.current = false;
    const initializeLesson = async () => {
      try {
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

        const checkLevel = (top?.form_level || "").toLowerCase();
        if (checkLevel.includes("tahun 1") || checkLevel.includes("standard 1") || checkLevel.includes("darjah 1")) {
          setIsYear1(true);
        }

        const allQuizBanks = await base44.entities.Quiz.filter({});
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

        const cachedSessions = await base44.entities.StudySession.filter(
          { student_id: user.id, topic_id: topicId },
          "-created_date",
          1
        );

        if (cachedSessions.length > 0 && !isUnmounted.current) {
          const session = cachedSessions[0];
          setSessionId(session.id);
          
          if (session.ai_explanation) {
            const parsed = JSON.parse(session.ai_explanation);
            setExplanation(parsed.lesson_markdown);
            setVideoUrl(parsed.video_url || "https://www.youtube.com/embed/di6Uv7N69O8"); 
            setMetaData({ summary: parsed.summary || "", keywords: parsed.keywords || [] });
            if (session.mindmap_json) setMindMap(JSON.parse(session.mindmap_json));
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

  const handleNextPhase = () => {
    const next = currentPhase + 1;
    if (next === 2) {
      loadMindMapOnDemand();
    } else if (next === 3 && !isYear1) {
      loadFlashcardsOnDemand();
    }
    setCurrentPhase(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    triggerConfetti(); 
  };

  const handlePrevPhase = () => {
    if (currentPhase > 1) {
      setCurrentPhase(currentPhase - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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
      particleCount: 100,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#06b6d4', '#8b5cf6', '#f59e0b', '#10b981']
    });
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
      setVideoUrl("https://www.youtube.com/embed/di6Uv7N69O8"); 
      setMetaData({ summary: response.summary, keywords: response.keywords });
      setCurrentPhase(1); 
      
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
        if (sessionId) await base44.entities.StudySession.update(sessionId, { flashcards_json: JSON.stringify(mappedCards) });
        setFlashcards(mappedCards);
        return; 
      } 
      const konteksRujukan = metaData?.summary || topic?.name || "Matematik Tahun 1";
      const lang = getLanguageMode();
      const res = await base44.integrations.Core.InvokeLLM({
        model: "gemini_3_flash",
        prompt: `Based on the topic/summary: "${konteksRujukan}", generate exactly 5 educational flashcards for a primary school student. Return JSON schema matching: [{ "front": "string", "back": "string" }]`,
      });
      if (res && Array.isArray(res) && res.length > 0) {
        if (sessionId) await base44.entities.StudySession.update(sessionId, { flashcards_json: JSON.stringify(res) });
        setFlashcards(res);
      }
    } catch (err) {
      console.error(err);
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
        const quiz = await base44.entities.Quiz.create({
          session_id: sessionId,
          topic_name: topic.name,
          subject_name: subject?.name || "Matematik",
          questions_json: JSON.stringify(selectedPool),
          difficulty: determinedDifficulty,
          num_questions: selectedPool.length,
        });
        navigate(`/quiz/${quiz.id}`);
      } else {
        const lang = getLanguageMode();
        const res = await base44.integrations.Core.InvokeLLM({
          model: "gemini_3_flash",
          prompt: `Based on the topic: "${topic?.name}" and Summary: "${metaData.summary}", generate exactly ${numQ} multiple-choice questions for primary school students. Return JSON schema matching: [{ "question": "string", "options": ["string"], "correct_answer": "string", "explanation": "string" }]`,
        });
        if (res && Array.isArray(res) && res.length > 0) {
          const quiz = await base44.entities.Quiz.create({
            session_id: sessionId,
            topic_name: topic.name,
            subject_name: subject?.name || "Matematik",
            questions_json: JSON.stringify(res.slice(0, numQ)),
            difficulty: determinedDifficulty,
            num_questions: res.slice(0, numQ).length,
          });
          navigate(`/quiz/${quiz.id}`);
        }
      }
    } catch (err) {
      console.error(err);
    } finally { setStatus(p => ({ ...p, quiz: false })); }
  };

  const loadMindMapOnDemand = async () => {
    if (mindMap && mindMap.length > 0) return;
    if (status.mindmap) return;
    setStatus(p => ({ ...p, mindmap: true }));
    try {
      const lang = getLanguageMode();
      const res = await base44.integrations.Core.InvokeLLM({
        model: "gemini_3_flash",
        prompt: MINDMAP_PROMPT(metaData?.summary || topic?.name || "", metaData?.keywords || [], lang),
      });
      if (res && Array.isArray(res)) {
        if (sessionId) await base44.entities.StudySession.update(sessionId, { mindmap_json: JSON.stringify(res) });
        setMindMap(res);
      }
    } catch (err) {
      console.error(err);
    } finally { setStatus(p => ({ ...p, mindmap: false })); }
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

  const currentProgressPercent = (currentPhase / 4) * 100;

  return (
    <div className="px-3 sm:px-4 py-6 max-w-md md:max-w-2xl lg:max-w-4xl mx-auto space-y-6 pb-28 font-sans bg-slate-50/50 min-h-screen">
      
      {/* HEADER SECTION */}
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
          className="text-center py-14 px-6 bg-white border-4 border-dashed border-primary/30 rounded-[2rem] shadow-xl max-w-md mx-auto"
        >
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-10 h-10 text-primary animate-pulse" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mb-3 text-slate-800">
            Hai {studentNickname}! 👋<br/>Sedia untuk belajar? 🚀
          </h2>
          <p className="text-slate-500 text-sm mb-8 max-w-xs mx-auto">
            Jom tonton video ceria dan main game padanan kuantiti objek yang mencabar!
          </p>
          <Button onClick={generateCoreLesson} disabled={status.lesson} className="w-full h-14 rounded-full text-base font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30">
            {status.lesson ? <><Loader2 className="w-5 h-5 animate-spin mr-2"/> Menyiapkan kelas...🪄</> : <><Sparkles className="w-5 h-5 mr-2"/> Mula Pengembaraan!</>}
          </Button>
        </motion.div>
      ) : (
        <div className="space-y-6">
          
          {/* STEPPER PROGRESS TRACKER */}
          <div className="bg-white p-4 rounded-3xl border-2 border-slate-100 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-slate-600">
              <span className="bg-cyan-100 text-cyan-800 px-3 py-1 rounded-full">Fasa {currentPhase} daripada 4</span>
              <span className="text-cyan-600 font-extrabold">
                {currentPhase === 1 && "📺 Tonton Video"}
                {currentPhase === 2 && "📖 Recap Nota & Peta Minda"}
                {currentPhase === 3 && (isYear1 ? "🎮 Main Game Padanan Objek" : "🃏 Main Flashcard")}
                {currentPhase === 4 && "🎯 Kuiz Juara"}
              </span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full"
                animate={{ width: `${currentProgressPercent}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>

          {/* DYNAMIC PHASE CONTENT CONTAINER */}
          <div className="min-h-[400px]">
            <AnimatePresence mode="wait">
              
              {/* FASA 1: TONTON VIDEO (Pilihan Manual Bebas Autoplay) */}
              {currentPhase === 1 && (
                <motion.div key="p1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  {videoUrl ? (
                    <div className="bg-white rounded-[2rem] p-5 sm:p-6 border-4 border-slate-100 shadow-lg space-y-4">
                      <div className="flex items-center gap-2 border-b-2 border-slate-100 pb-3">
                        <div className="p-2 bg-red-100 rounded-xl">
                          <Youtube className="w-6 h-6 text-red-600 fill-current" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-slate-800">Langkah 1: Tonton Animasi Dahulu Yuk!</h3>
                          <p className="text-slate-400 text-xs">Tekan butang main tengah untuk memulakan video ulangkaji.</p>
                        </div>
                      </div>
                      <div className="relative w-full rounded-2xl overflow-hidden shadow-md aspect-video border border-slate-200 bg-slate-900">
                        <iframe
                          className="absolute top-0 left-0 w-full h-full"
                          src={`${videoUrl}?rel=0&controls=1`}
                          title="YouTube Video Player StudyQuest"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white text-center py-12 px-6 rounded-[2rem] border-2 border-slate-100 shadow-md">
                      <Youtube className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500 font-medium text-sm">Tiada video pembelajaran khusus untuk topik ini.</p>
                      <p className="text-xs text-slate-400 mt-1">Sila tekan 'Seterusnya' untuk melihat Infografik.</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* FASA 2: NOTA + PETA MINDA RECAP */}
              {currentPhase === 2 && (
                <motion.div key="p2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <div className="bg-white rounded-[2rem] p-5 sm:p-8 border-4 border-slate-100 shadow-lg space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-slate-100 pb-5">
                      <div>
                        <h2 className="font-bold text-xl text-slate-800 flex items-center gap-2">✨ Langkah 2: Nota Ringkas Ringkasan</h2>
                        <p className="text-slate-400 text-xs mt-0.5">Ringkasan silibus penting KPM KSSR untuk rujukan pantas.</p>
                      </div>
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
                  </div>

                  <div className="bg-white rounded-[2rem] p-5 sm:p-6 border-4 border-slate-100 shadow-lg space-y-4">
                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2 border-b-2 border-slate-100 pb-3">
                      <GitFork className="w-5 h-5 text-blue-500"/> 🧠 Peta Minda Infografik Visual
                    </h3>
                    <div className="min-h-[200px] rounded-2xl bg-blue-50/30 border-2 border-blue-50 p-4 shadow-inner overflow-x-auto">
                      {status.mindmap ? (
                        <div className="flex flex-col items-center justify-center py-10 text-xs text-blue-600 font-medium">
                          <Loader2 className="w-8 h-8 animate-spin mb-2 text-blue-500" /> Menyusun grafik...
                        </div>
                      ) : mindMap ? (
                        <MindMap mindMap={{ central_topic: topic.name, branches: mindMap }} />
                      ) : (
                        <p className="text-slate-400 text-xs text-center py-8">Tiada data infografik dijumpai.</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* FASA 3: INTERAKTIF GAME 10 LEVEL (TAHUN 1) VS FLASHCARD (TAHUN LAIN) */}
              {currentPhase === 3 && (
                <motion.div key="p3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  
                  {isYear1 ? (
                    <div className="space-y-4">
                      <div className="bg-gradient-to-r from-purple-100 to-indigo-100 p-4 rounded-3xl border-2 border-purple-200 shadow-sm">
                        <h3 className="font-extrabold text-purple-950 flex items-center gap-2 text-base">
                          🎮 Langkah 3: Super Game 10 Level Padanan Objek!
                        </h3>
                        <p className="text-xs text-purple-800 font-medium mt-1">
                          Seret gambar kumpulan emoji objek comel ke bawah dan lepaskan di dalam kotak nombor kuantiti angka yang betul. Selesaikan kesemua 10 level untuk menang!
                        </p>
                      </div>
                      
                      <Year1InteractiveGame 
                        studentNickname={studentNickname} 
                        onComplete={() => setIsGameCompleted(true)} 
                      />
                    </div>
                  ) : (
                    <>
                      <div className="bg-white rounded-3xl p-4 border-2 border-slate-100 shadow-sm">
                        <h3 className="font-bold text-base text-purple-900 flex items-center gap-2">
                          <Layers className="w-5 h-5 text-purple-500"/> Langkah 3: Kad Imbasan Memori Pintar 🃏
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">Tekan kad untuk menterbalikkan jawapan rahsia bagi menguji kefahaman minda.</p>
                      </div>

                      <div className="min-h-[250px] bg-purple-50/40 p-4 rounded-[2rem] border-4 border-purple-100 shadow-md">
                        {status.flashcards ? (
                          <div className="flex flex-col items-center justify-center py-16 text-sm text-purple-600 font-medium">
                            <Loader2 className="w-10 h-10 animate-spin mb-4 text-purple-500" /> Membuka kad imbasan...
                          </div>
                        ) : (
                          <Flashcards flashcards={flashcards || []} />
                        )}
                      </div>
                    </>
                  )}
                </motion.div>
              )}

              {/* FASA 4: KUIZ ZON JUARA */}
              {currentPhase === 4 && (
                <motion.div key="p4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div className="bg-gradient-to-br from-yellow-100 via-orange-50 to-orange-100 rounded-[2rem] p-6 sm:p-8 border-4 border-yellow-200 shadow-lg relative overflow-hidden">
                    <Trophy className="absolute -bottom-6 -right-6 w-32 h-32 text-orange-200/50 rotate-12" />
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-2">
                        <Trophy className="w-6 h-6 text-amber-500" />
                        <h3 className="font-bold text-xl sm:text-2xl text-orange-900">
                          Langkah Akhir: Zon Kuiz Juara, {studentNickname}! 🎯
                        </h3>
                      </div>
                      <p className="text-sm sm:text-base text-orange-700 mb-6 font-medium">
                        Hebatnya, semua pengembaraan fasa telah dilepasi! Jom kumpul Syiling Emas 🪙 sekarang!
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
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* FLOATING NAVIGATION CONTROL PANEL PANEL */}
          <div className="fixed bottom-4 left-0 right-0 z-40 px-4 max-w-md md:max-w-2xl lg:max-w-4xl mx-auto flex items-center justify-between gap-4">
            <Button 
              onClick={handlePrevPhase} 
              disabled={currentPhase === 1}
              variant="outline"
              className={`h-14 px-6 rounded-full font-bold shadow-md border-2 bg-white transition-all active:scale-95 ${currentPhase === 1 ? 'opacity-40 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100 border-slate-200'}`}
            >
              ⬅️ Kembali
            </Button>

            {currentPhase < 4 ? (
              <Button 
                onClick={handleNextPhase}
                className="h-14 px-8 rounded-full font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/20 transition-all active:scale-95 gap-2"
              >
                Seterusnya ➡️
              </Button>
            ) : (
              <div className="text-xs font-bold text-orange-600 bg-orange-100 px-4 py-3 rounded-full shadow-sm animate-bounce">
                🎉 Jom selesaikan kuiz terakhir!
              </div>
            )}
          </div>

          {/* Premium Customizer Options Section */}
          <div className="pt-4 opacity-70">
            {isPremium ? (
               <Button variant="ghost" size="sm" onClick={generateCoreLesson} disabled={status.lesson} className="w-full text-xs font-medium text-slate-400 hover:text-slate-600 py-2 rounded-full">
                 {status.lesson ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />} Jana semula set soalan/nota silibus AI
               </Button>
             ) : (
               <Button variant="ghost" size="sm" onClick={handlePremiumRedirect} className="w-full text-xs font-medium text-amber-600 bg-amber-50/40 py-2 rounded-full border border-dashed border-amber-200">
                 <Lock className="w-3 h-3 mr-1 text-amber-500" /> Mod Premium Dikunci 🌟
               </Button>
             )}
          </div>

        </div>
      )}
    </div>
  );
}