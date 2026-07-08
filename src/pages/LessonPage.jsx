import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Sparkles, Loader2, Trophy, GitFork, Youtube, Star, Volume2, HelpCircle, RefreshCw, Lock, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

import LessonContent from "@/components/lesson/LessonContent";
import MindMap from "@/components/lesson/MindMap";

// ============================================================================
// FUN AUDIO ASSISTANT (Text-to-Speech bawaan telefon/komputer untuk anak kecil)
// ============================================================================
const speakText = (text) => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel(); // Hentikan suara lama jika ada
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ms-MY'; // Set Bahasa Melayu
    utterance.rate = 0.9; // Perlahankan sedikit suara untuk kanak-kanak
    window.speechSynthesis.speak(utterance);
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

const generateDynamicQuestionsFromContent = (explanation, keywords, topicName) => {
  if (explanation && explanation.includes("Banyak dan Sedikit")) {
    return [
      { id: 1, emoji: "🍎🍎🍎🍎🍎🍎🍎🍎", text: "Cuba lihat epal ini. Adakah ia banyak atau sedikit?", options: ["Banyak", "Sedikit"], correct: "Banyak", hint: "Epal ini ada banyak!" },
      { id: 2, emoji: "🍎🍎", text: "Epal ini sikit sahaja. Kita panggil apa?", options: ["Banyak", "Sedikit"], correct: "Sedikit", hint: "Hanya ada dua, maksudnya sedikit." },
      { id: 3, emoji: "🌻🌻🌻🌻🌻🌻🌻🌻🌻🌻", text: "Bunga ini bertimbun-timbun! Banyak atau sedikit?", options: ["Banyak", "Sedikit"], correct: "Banyak", hint: "Kira sama-sama, ada banyak!" },
      { id: 4, emoji: "🦋", text: "Rama-rama ini tinggal seekor sahaja. Banyak atau sedikit?", options: ["Banyak", "Sedikit"], correct: "Sedikit", hint: "Satu sahaja bermaksud sedikit." },
      { id: 5, emoji: "🎈🎈🎈🎈🎈🎈🎈", text: "Belon pesta ini ada banyak atau sedikit?", options: ["Banyak", "Sedikit"], correct: "Banyak", hint: "Meriahnya belon! Ada banyak." },
      { id: 6, emoji: "🐱", text: "Kucing comel ini keseorangan. Banyak atau sedikit?", options: ["Banyak", "Sedikit"], correct: "Sedikit", hint: "Sikit sahaja kucing ini." },
      { id: 7, emoji: "🚗🚗🚗🚗🚗🚗", text: "Kereta mainan ini banyak atau sedikit?", options: ["Banyak", "Sedikit"], correct: "Banyak", hint: "Kereta bertumpuk-tumpuk, jadi banyak." },
      { id: 8, emoji: "🌟", text: "Bintang di langit ini ada satu sahaja. Banyak atau sedikit?", options: ["Banyak", "Sedikit"], correct: "Sedikit", hint: "Hanya satu bintang bermaksud sedikit." },
      { id: 9, emoji: "🐟🐟🐟🐟🐟🐟🐟🐟", text: "Ikan berenang di akuarium. Banyak atau sedikit?", options: ["Banyak", "Sedikit"], correct: "Banyak", hint: "Penuh ikan dalam air! Banyak." },
      { id: 10, emoji: "🍬🍬", text: "Gula-gula adik ada dua sahaja. Banyak atau sedikit?", options: ["Banyak", "Sedikit"], correct: "Sedikit", hint: "Dua biji gula-gula sahaja maksudnya sedikit." }
    ].map(q => ({ ...q, options: shuffleArray(q.options) }));
  }

  const sourceWords = Array.from(new Set([...(keywords || []), "Betul", "Pintar"]));
  return [...Array(10)].map((_, i) => {
    const correct = sourceWords[i % sourceWords.length] || "Betul";
    return {
      id: i + 1,
      emoji: "⭐",
      text: `Mari cari gambar dan perkataan yang sama! Pilih perkataan ini:`,
      options: shuffleArray([correct, "Lain"]),
      correct: correct,
      hint: `Pilih bulatan perkataan yang sama.`
    };
  });
};

// ============================================================================
// 2. INTERACTIVE GAME COMPONENT - UI WARNA WARNI & BANTUAN AUDIO AUDIO
// ============================================================================
function Year1InteractiveGame({ explanation, keywords, topicName, studentNickname, onComplete }) {
  const [questions, setQuestions] = useState([]);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("Ketuk butang hijau bawah, seret kad kuning ke kotak jawapan comel! 🌈");

  useEffect(() => {
    if (explanation) {
      setQuestions(generateDynamicQuestionsFromContent(explanation, keywords, topicName));
      setCurrentLevel(0);
      setIsFinished(false);
    }
  }, [explanation, keywords, topicName]);

  // Sebut soalan secara automatik setiap kali level bertukar (Membantu anak tidak pandai membaca)
  useEffect(() => {
    if (questions.length > 0 && !isFinished) {
      const q = questions[currentLevel];
      speakText(`${q.text}. Pilihan jawapan ialah, ${q.options.join(' atau ')}`);
    }
  }, [currentLevel, questions, isFinished]);

  if (questions.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-purple-400" />
        Sabar ya, permainan comel sedang dibuka...
      </div>
    );
  }

  const currentQuestion = questions[currentLevel];

  const handleDragEnd = (event, info) => {
    const elementAtPoint = document.elementFromPoint(info.point.x, info.point.y);
    if (!elementAtPoint) return;

    const target = elementAtPoint.closest(".game-drop-target");
    let selectedValue = null;

    if (target) {
      selectedValue = target.getAttribute("data-value");
    }

    if (selectedValue === currentQuestion.correct) {
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
      speakText("Wah hebatnya betul!");
      setFeedbackMessage(`🎉 Betul lah ${studentNickname}! Bijak sangat!`);
      
      if (currentLevel + 1 >= questions.length) {
        setIsFinished(true);
        if (onComplete) onComplete();
      } else {
        setTimeout(() => {
          setCurrentLevel((prev) => prev + 1);
          setFeedbackMessage("Jom main pusingan seterusnya! 🚀");
        }, 1200);
      }
    } else if (selectedValue !== null) {
      speakText("Cuba lagi sayang, tengok gambar betul-betul.");
      setFeedbackMessage(`Alahai, salah sikit! 💡 Petunjuk: ${currentQuestion.hint}`);
    }
  };

  if (isFinished) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-gradient-to-b from-yellow-50 via-amber-100 to-amber-200 rounded-[2.5rem] p-6 border-4 border-amber-300 text-center space-y-4 shadow-xl">
        <div className="text-6xl animate-bounce">🏆</div>
        <h4 className="text-2xl font-black text-amber-950">HEBAT! 10 BINTANG PENUH!</h4>
        <p className="text-xs text-amber-900 font-bold">Anak pintar {studentNickname} berjaya selesaikan semua permainan! 🌈</p>
        <Button onClick={() => { setCurrentLevel(0); setIsFinished(false); }} className="rounded-full bg-emerald-500 hover:bg-emerald-600 font-black text-xs text-white px-6 py-4 shadow-md mx-auto">
          <RefreshCw className="w-4 h-4 mr-1" /> Main Semula
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-white to-purple-50 rounded-[2.5rem] p-5 border-4 border-purple-300 text-center space-y-4 shadow-md">
      
      {/* METER BINTANG GAMPANG DIFAHAMI */}
      <div className="flex items-center justify-between bg-purple-100/60 p-2 rounded-2xl">
        <span className="text-[11px] font-black text-purple-800">Pusingan {currentQuestion.id} / 10</span>
        <div className="flex gap-0.5">
          {[...Array(10)].map((_, idx) => (
            <span key={idx} className="text-sm">{idx <= currentLevel ? "⭐" : "⚫"}</span>
          ))}
        </div>
      </div>

      {/* AUDIO READ ASSISTANT BUTTON */}
      <button 
        onClick={() => speakText(`${currentQuestion.text}. Pilihan jawapan, ${currentQuestion.options.join(' atau ')}`)}
        className="w-full p-2 bg-emerald-500 text-white rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-sm border-b-4 border-emerald-700 active:transform active:scale-95 transition-all"
      >
        <Volume2 className="w-5 h-5 animate-pulse" /> DENGAR SUARA CIKGU 🔊
      </button>

      {/* EMOJI VISUAL BESAR (UTAMAKAN GAMBAR) */}
      <div className="bg-white py-4 px-2 rounded-3xl border-2 border-purple-100 shadow-inner space-y-2">
        <div className="text-6xl my-2 select-none tracking-widest p-2 bg-slate-50 rounded-2xl inline-block max-w-full overflow-x-auto min-h-[80px] leading-tight">{currentQuestion.emoji}</div>
        <p className="text-xs font-black text-slate-700 leading-snug px-1">{currentQuestion.text}</p>
      </div>

      {/* MAKLUM BALAS WARNA COLOURED */}
      <div className="bg-amber-100 text-amber-950 p-2.5 rounded-xl text-[10px] font-bold border border-amber-300">
        📢 {feedbackMessage}
      </div>

      {/* KAD UNTUK DISERET */}
      <div className="py-2 flex justify-center items-center min-h-[90px]">
        <motion.div
          key={currentQuestion.id} 
          drag 
          dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }} 
          dragElastic={0.6} 
          onDragEnd={handleDragEnd} 
          whileHover={{ scale: 1.1 }} 
          whileTap={{ scale: 0.9 }}
          className="p-4 bg-gradient-to-b from-yellow-300 to-amber-400 border-b-4 border-amber-600 rounded-3xl shadow-md cursor-grab active:cursor-grabbing inline-flex flex-col items-center justify-center min-w-[150px] touch-none"
        >
          <span className="text-3xl select-none">👆</span>
          <span className="text-[11px] font-black text-amber-950 mt-1 tracking-wider">HERET KAD INI 👋</span>
        </motion.div>
      </div>

      <div className="border-t-2 border-dashed border-purple-200 my-1" />

      {/* KOTAK JAWAPAN JATUHAN (DIBESARKAN & BERWARNA WARNI) */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-purple-400">👇 Lepaskan kad di dalam kotak betul pilihan anda:</p>
        <div className="grid grid-cols-2 gap-3">
          {currentQuestion.options.map((opt, i) => (
            <div 
              key={i} 
              data-value={opt} 
              className={`game-drop-target p-4 rounded-2xl border-4 border-dashed flex flex-col items-center justify-center min-h-[65px] transition-all ${
                opt === "Banyak" || i === 0 
                  ? "bg-cyan-50 border-cyan-300 text-cyan-900 hover:bg-cyan-100" 
                  : "bg-pink-50 border-pink-300 text-pink-900 hover:bg-pink-100"
              }`}
            >
              <span className="text-base font-black pointer-events-none">{opt === "Banyak" ? "เยอะ / Banyak 🍎" : "นิดเดียว / Sedikit 🍏"}</span>
              <span className="text-[11px] font-extrabold text-slate-500 pointer-events-none">{opt}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 3. MAIN LESSON PAGE COMPONENT WITH ADAPTIVE KIDS LAYOUT
// ============================================================================
export default function LessonPage() {
  const { subjectId, topicId } = useParams();
  const navigate = useNavigate();
  
  const [subject, setSubject] = useState(null);
  const [topic, setTopic] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [studentNickname, setStudentNickname] = useState(""); 
  const [loading, setLoading] = useState(true);

  const [explanation, setExplanation] = useState("");
  const [videoUrl, setVideoUrl] = useState(""); 
  const [metaData, setMetaData] = useState({ summary: "", keywords: [] });
  const [mindMap, setMindMap] = useState(null);

  const [currentPhase, setCurrentPhase] = useState(1); 
  const [status, setStatus] = useState({ lesson: false, mindmap: false, quiz: false });

  const [isImmersive, setIsImmersive] = useState(false);
  const [videoKey, setVideoKey] = useState(0);
  const [isVideoCompleted, setIsVideoCompleted] = useState(false);

  useEffect(() => {
    if (currentPhase === 1) {
      const timer = setTimeout(() => {
        setVideoKey(prev => prev + 1);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [currentPhase]);

  // Sebut panduan suara pembuka apabila fasa bertukar
  useEffect(() => {
    if (explanation) {
      if (currentPhase === 1) speakText("Langkah satu. Jom tengok video kartun sampai habis untuk buka pintu permainan!");
      if (currentPhase === 2) speakText("Langkah dua. Wah jom lihat gambar nota ceria ini sama-sama.");
      if (currentPhase === 3) speakText("Langkah tiga. Masa untuk main game padanan mencabar! Bersedia?");
      if (currentPhase === 4) speakText("Langkah empat. Jom serang bos besar kuiz dan kutub markah penuh!");
    }
  }, [currentPhase, explanation]);

  useEffect(() => {
    const handleVideoEndMessage = (event) => {
      if (!event.origin.includes("youtube.com")) return;

      try {
        let data = event.data;
        if (typeof data === "string") data = JSON.parse(data);

        if (data.event === "onStateChange" && data.info === 0) {
          setIsImmersive(false); 
          setIsVideoCompleted(true); 
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
          speakText("Tahniah! Video sudah habis. Jom tekan butang anak panah ungu untuk main game!");
        }
      } catch (e) {}
    };

    window.addEventListener("message", handleVideoEndMessage);
    return () => window.removeEventListener("message", handleVideoEndMessage);
  }, []);

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
        setStudentNickname(user?.nickname || user?.profile?.nickname || "Si Comel");

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
            setVideoUrl(parsed.video_url || top?.video_url || "https://www.youtube.com/embed/-8OVG1zor8w");
            if (session.mindmap_json) setMindMap(JSON.parse(session.mindmap_json));
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    initializeLesson();
  }, [subjectId, topicId]);

  const handleNextPhase = () => {
    if (currentPhase === 1 && !isVideoCompleted) {
      speakText("Sila tengok video dahulu sayang.");
      alert("🔒 Sila tengok video kartun sehingga habis dahulu ya!");
      return;
    }
    if (currentPhase === 1) loadMindMapOnDemand();
    setCurrentPhase(prev => prev + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    confetti({ particleCount: 40, spread: 30, origin: { y: 0.7 } });
  };

  const handlePrevPhase = () => {
    if (currentPhase > 1) {
      setCurrentPhase(currentPhase - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const loadMindMapOnDemand = async () => {
    if (mindMap && mindMap.length > 0) return;
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        model: "gemini_3_flash",
        prompt: `Create a simple mind map for 7yo based on "${topic?.name}". Simple keys. Schema: [{ "label": "string", "children": ["string"] }]`,
      });
      if (res && Array.isArray(res)) setMindMap(res);
    } catch (err) {}
  };

  const generateCoreLesson = async () => {
    if (status.lesson) return;
    setStatus(p => ({ ...p, lesson: true }));
    try {
      const user = await base44.auth.me();
      const dynamicTopicVideo = topic?.video_url || "https://www.youtube.com/embed/-8OVG1zor8w";

      const sampleExplanation = `
### 🌟 Jom Ingat: Banyak & Sedikit\n\n👀 **Lihat Contoh Gambar Comel:**\n* 🍎🍎🍎🍎🍎🍎 = **Banyak Kuantiti**\n* 🍎 = **Sedikit / Sikit Sahaja**\n\n⭐ **Tips Kilat:**\n* Banyak bermaksud penuh melimpah-limpah.\n* Sedikit bermaksud sunyi bersendirian.
      `;

      const session = await base44.entities.StudySession.create({
        student_id: user.id,
        subject_id: subjectId,
        topic_id: topicId,
        topic_name: topic.name,
        subject_name: subject.name,
        ai_explanation: JSON.stringify({ 
          lesson_markdown: sampleExplanation, 
          summary: "Banyak dan Sedikit", 
          keywords: ["Banyak", "Sedikit"],
          video_url: dynamicTopicVideo 
        }),
        duration_minutes: 0,
      });

      setSessionId(session.id);
      setExplanation(sampleExplanation);
      setVideoUrl(dynamicTopicVideo);
      setCurrentPhase(1);
      setIsVideoCompleted(false);
      speakText(`Selamat datang ${user.nickname || "Si Comel"}! Jom ketuk butang video besar di tengah skrin!`);
    } catch (e) {
      console.error(e);
    } finally { setStatus(p => ({ ...p, lesson: false })); }
  };

  const runQuizGeneration = async () => {
    if (status.quiz) return;
    setStatus(p => ({ ...p, quiz: true }));
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        model: "gemini_3_flash",
        prompt: `Create 10 easy questions for 7yo kids about "${topic?.name}". Simple language. JSON format: [{ "question": "string", "options": ["string"], "correct_answer": "string", "explanation": "string" }]`,
      });
      if (res && Array.isArray(res)) {
        const quiz = await base44.entities.Quiz.create({
          session_id: sessionId,
          topic_name: topic.name,
          subject_name: subject?.name || "Matematik",
          questions_json: JSON.stringify(res.slice(0, 10)),
          difficulty: "easy",
          num_questions: 10,
        });
        navigate(`/quiz/${quiz.id}`);
      }
    } catch (err) {} finally { setStatus(p => ({ ...p, quiz: false })); }
  };

  const securedVideoUrl = (() => {
    if (!videoUrl) return "";
    const cleanUrl = videoUrl.split("?")[0]; 
    return `${cleanUrl}?enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}&controls=1&modestbranding=1&rel=0`;
  })();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-purple-50 text-purple-600 gap-2">
        <Loader2 className="w-10 h-10 animate-spin" />
        <span className="text-xs font-black animate-bounce">Sabar ya comel, dunia belajar sedang bersiap... ✨</span>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 max-w-md mx-auto space-y-5 pb-28 bg-gradient-to-b from-amber-50/40 to-purple-50/40 min-h-screen select-none">
      
      {/* HEADER UTAMAKAN KANAK-KANAK */}
      <div className="flex items-center gap-3 bg-white p-3 rounded-[2rem] border-4 border-purple-200 shadow-sm">
        <Link to={`/study/${subjectId}`} className="p-2.5 bg-purple-100 hover:bg-purple-200 rounded-2xl transition-transform active:scale-90">
          <ArrowLeft className="w-5 h-5 text-purple-700" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xs font-black text-slate-800 leading-tight">Topik: {topic?.name || "Banyak & Sedikit"} 🎒</h1>
          <p className="text-[10px] text-purple-600 font-bold">{subject?.name || "Matematik"} • Peringkat Darjah 1</p>
        </div>
        <div className="text-2xl animate-spin-[spin_4s_linear_infinite]">⭐</div>
      </div>

      {!explanation ? (
        <div className="text-center py-10 px-5 bg-white border-4 border-dashed border-purple-300 rounded-[2.5rem] shadow-md space-y-4">
          <div className="text-6xl animate-bounce">🚀</div>
          <h2 className="text-lg font-black text-purple-950">Hai {studentNickname}! Ready nak main?</h2>
          <p className="text-xs text-slate-500 font-medium px-2">Ada banyak hadiah bintang menanti anda di dalam pusingan ini!</p>
          <Button onClick={generateCoreLesson} disabled={status.lesson} className="w-full h-14 rounded-3xl text-sm font-black bg-gradient-to-r from-purple-500 to-indigo-600 border-b-4 border-indigo-800 text-white shadow-lg active:transform active:scale-95 transition-all">
            {status.lesson ? "Membuka Pintu Ajaib..." : "TEKAN SINI UNTUK MULA! 🌟"}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* TRACKER VISUAL HAIWAN (Anak kecil faham gambar ikon berbanding peratusan teks) */}
          <div className="bg-white p-3 rounded-2xl border-2 border-purple-100 text-center space-y-1.5 shadow-sm">
            <div className="flex justify-around items-center text-xl">
              <span className={`p-1 rounded-full ${currentPhase === 1 ? "bg-purple-100 scale-125 border-2 border-purple-400" : "opacity-40"}`}>📺 🐥</span>
              <span className="text-xs text-slate-300">➔</span>
              <span className={`p-1 rounded-full ${currentPhase === 2 ? "bg-purple-100 scale-125 border-2 border-purple-400" : "opacity-40"}`}>📖 🐱</span>
              <span className="text-xs text-slate-300">➔</span>
              <span className={`p-1 rounded-full ${currentPhase === 3 ? "bg-purple-100 scale-125 border-2 border-purple-400" : "opacity-40"}`}>🎮 🐰</span>
              <span className="text-xs text-slate-300">➔</span>
              <span className={`p-1 rounded-full ${currentPhase === 4 ? "bg-purple-100 scale-125 border-2 border-purple-400" : "opacity-40"}`}>👑 🦁</span>
            </div>
            <p className="text-[10px] font-black text-purple-700 uppercase tracking-wider">
              {currentPhase === 1 && "Fasa 1: Kedai Wayang Gambar"}
              {currentPhase === 2 && "Fasa 2: Buku Nota Berwarna"}
              {currentPhase === 3 && "Fasa 3: Taman Mainan Padanan"}
              {currentPhase === 4 && "Fasa Kemuncak: Serangan Raja Kuiz"}
            </p>
          </div>

          {/* MAIN DYNAMIC BOX AREA */}
          <div className="min-h-[280px]">
            <AnimatePresence mode="wait">
              
              {/* PHASING 1: VIDEO ADAPTIVE */}
              {currentPhase === 1 && (
                <motion.div key="p1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-4 border shadow-sm space-y-3">
                  <button 
                    onClick={() => speakText("Sila ketuk gambar televisyen besar di bawah untuk tonton kartun sampai habis!")}
                    className="w-full text-left bg-slate-50 p-2 rounded-xl flex items-center gap-2 border"
                  >
                    <span className="text-lg">🔊</span>
                    <p className="text-[11px] font-bold text-slate-600">Ketuk televisyen di bawah untuk tonton video kartun! 🍿</p>
                  </button>

                  <div 
                    onClick={() => setIsImmersive(true)}
                    className="group relative w-full rounded-2xl overflow-hidden aspect-video bg-slate-900 border-4 border-amber-300 shadow-md cursor-pointer"
                  >
                    <iframe 
                      key={`mini-${videoKey}`}
                      className="absolute inset-0 w-full h-full pointer-events-none" 
                      src={securedVideoUrl}
                      title="Kid Player"
                    ></iframe>
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <div className="bg-amber-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-full shadow-lg animate-bounce flex items-center gap-1.5">
                        ▶️ BUKA SKRIN BESAR
                      </div>
                    </div>
                  </div>

                  <div className={`p-3 rounded-2xl border text-center font-black text-xs ${isVideoCompleted ? "bg-emerald-100 border-emerald-300 text-emerald-800" : "bg-amber-100 border-amber-300 text-amber-800"}`}>
                    {isVideoCompleted ? (
                      "🎉 Syabas! Video tamat. Jom gerak ke fasa seterusnya!"
                    ) : (
                      <div className="space-y-2">
                        <p>🔒 Tonton dahulu sehingga habis untuk buka kunci main game.</p>
                        <button onClick={() => setIsVideoCompleted(true)} className="text-[9px] text-purple-600 underline block mx-auto font-bold">
                          (Dah siap tonton? Klik sini jika tersekat)
                        </button>
                      </div>
                    )}
                  </div>

                  {/* IMMERSIVE VIDEO SCREEN LAYER */}
                  <AnimatePresence>
                    {isImmersive && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black z-[9999] flex flex-col items-center justify-center p-2">
                        <div className="w-full max-w-2xl flex justify-between p-2 text-white items-center">
                          <span className="text-[10px] font-black bg-purple-600 px-3 py-1 rounded-full text-white">📺 WAYANG KARTUN SI COMEL</span>
                          <Button onClick={() => setIsImmersive(false)} className="bg-red-500 text-white font-black h-8 px-3 rounded-xl text-xs">✕ Keluar</Button>
                        </div>
                        <div className="w-full max-w-2xl aspect-video rounded-xl overflow-hidden bg-black relative border-2 border-white/20">
                          <iframe 
                            key={`full-${videoKey}`}
                            className="absolute inset-0 w-full h-full" 
                            src={securedVideoUrl} 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          ></iframe>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* PHASING 2: VISUAL NOTES */}
              {currentPhase === 2 && (
                <motion.div key="p2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  <div className="bg-white rounded-3xl p-5 border shadow-sm space-y-2">
                    <button onClick={() => speakText("Mari lihat buku nota bergambar ini.")} className="w-full text-left bg-purple-50 p-2 rounded-xl flex items-center gap-2 border border-purple-200">
                      <span className="text-base">🔊</span>
                      <p className="text-[11px] font-black text-purple-950">Dengar bunyi penerangan buku nota bergambar 📖</p>
                    </button>
                    <div className="prose prose-sm text-slate-800 text-xs font-bold leading-relaxed border-t pt-2">
                      <LessonContent content={explanation} />
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl p-3 border shadow-sm space-y-1">
                    <h3 className="font-black text-xs text-slate-800 flex items-center gap-1">🗺️ Peta Grafik Minda</h3>
                    {mindMap ? <MindMap mindMap={{ central_topic: topic?.name || "Nota", branches: mindMap }} /> : <p className="text-center text-[10px] py-2 text-slate-400">Memuatkan gambar...</p>}
                  </div>
                </motion.div>
              )}

              {/* PHASING 3: COMPACT DRAG GAME COMPONENT */}
              {currentPhase === 3 && (
                <motion.div key="p3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Year1InteractiveGame 
                    explanation={explanation}
                    keywords={metaData.keywords}
                    topicName={topic?.name || "Topik"}
                    studentNickname={studentNickname}
                    onComplete={() => console.log("Game tamat")}
                  />
                </motion.div>
              )}

              {/* PHASING 4: BOSS BATTLE */}
              {currentPhase === 4 && (
                <motion.div key="p4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                  <div className="bg-gradient-to-br from-red-500 via-orange-500 to-yellow-400 rounded-[2.5rem] p-6 text-center text-white space-y-4 border-b-8 border-red-800 shadow-2xl">
                    <div className="text-6xl animate-bounce">🦁</div>
                    <h3 className="font-black text-xl uppercase tracking-wider">MASA SERANG RAJA KUIZ!</h3>
                    <p className="text-xs font-bold text-yellow-100 px-2 leading-relaxed">
                      Jawab 10 soalan mudah bergambar, kalahkan raksasa kuiz dan tuntut pingat emas kembara anda!
                    </p>
                    <Button onClick={runQuizGeneration} disabled={status.quiz} className="bg-yellow-300 hover:bg-yellow-400 text-slate-950 font-black rounded-2xl text-xs w-full h-14 border-b-4 border-yellow-600 shadow-md transform active:scale-95 transition-all">
                      {status.quiz ? "Menyediakan Padang Kuiz..." : "MULA KUIZ SEKARANG ⚔️💥"}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* FLOATING ACTION BOTTOM NAV BAR (BUTANG DIBESARKAN) */}
          <div className="fixed bottom-4 left-0 right-0 px-4 flex justify-between gap-4 max-w-md mx-auto z-40">
            <Button onClick={handlePrevPhase} disabled={currentPhase === 1} className="h-14 px-5 rounded-3xl font-black bg-white text-slate-700 text-xs border-2 border-slate-300 border-b-4 border-slate-400 shadow-md active:scale-95 transition-all">
              ⬅️ Kiri (Undur)
            </Button>
            
            {currentPhase < 4 ? (
              <Button 
                onClick={handleNextPhase} 
                disabled={currentPhase === 1 && !isVideoCompleted}
                className={`h-14 px-6 rounded-3xl font-black text-xs text-white shadow-lg flex items-center gap-1.5 transition-all ${
                  currentPhase === 1 && !isVideoCompleted 
                    ? "bg-slate-300 border-slate-400 text-slate-500 cursor-not-allowed opacity-70" 
                    : "bg-gradient-to-r from-purple-500 to-pink-500 border-b-4 border-pink-700 active:scale-105"
                }`}
              >
                {currentPhase === 1 && !isVideoCompleted ? "🔒 Sila Tonton" : "Seterusnya ➡️"}
              </Button>
            ) : (
              <span className="text-[10px] font-black text-red-700 bg-red-100 border-2 border-red-300 px-4 py-3 rounded-full shadow-inner animate-pulse flex items-center justify-center">
                PANTAS SERANG! 🔥
              </span>
            )}
          </div>

        </div>
      )}
    </div>
  );
}