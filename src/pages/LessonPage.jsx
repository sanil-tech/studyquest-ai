import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { 
  ArrowLeft, Sparkles, Loader2, Trophy, GitFork, Youtube, 
  Star, Volume2, HelpCircle, RefreshCw, Lock, Heart, 
  Tv, Layers, CheckCircle2, Award, Flame, Coins, Compass
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

import LessonContent from "@/components/lesson/LessonContent";
import MindMap from "@/components/lesson/MindMap";

// ============================================================================
// ENJIN SUARA PENYAYANG (Human-like Tone Speech Assistant)
// ============================================================================
const speakWithLove = (text) => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();

    const malayVoice = voices.find(v => v.lang.includes('ms-MY') || v.lang.includes('ms_MY'));
    const googleIdVoice = voices.find(v => v.name.includes('Google') && (v.lang.includes('id') || v.lang.includes('ms')));
    const indonesianVoice = voices.find(v => v.lang.includes('id-ID') || v.lang.includes('id_ID'));

    if (malayVoice) utterance.voice = malayVoice;
    else if (googleIdVoice) utterance.voice = googleIdVoice;
    else if (indonesianVoice) utterance.voice = indonesianVoice;

    utterance.lang = 'ms-MY';
    utterance.rate = 0.83;  
    utterance.pitch = 1.25; 
    utterance.volume = 1.0; 

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

const generateKidsQuestions = (explanation, keywords, topicName) => {
  if (explanation && (explanation.includes("Banyak") || explanation.includes("Sedikit"))) {
    return [
      { id: 1, emoji: "🍎🍎🍎🍎🍎🍎🍎🍎", text: "Tengok epal merah ini sayang. Banyak ke sikit?", options: ["Banyak", "Sedikit"], correct: "Banyak", hint: "Epal ini penuh melimpah! Maksudnya banyak." },
      { id: 2, emoji: "🍎🍎", text: "Epal ini tinggal dua ketul sahaja. Banyak ke sikit?", options: ["Banyak", "Sedikit"], correct: "Sedikit", hint: "Sikit sahaja tu sayang." },
      { id: 3, emoji: "🌻🌻🌻🌻🌻🌻🌻🌻🌻🌻", text: "Wah, cantiknya bunga matahari! Banyak ke sikit?", options: ["Banyak", "Sedikit"], correct: "Banyak", hint: "Bunga ini bertimbun-timbun! Jadi ia banyak." },
      { id: 4, emoji: "🦋", text: "Ada satu sahaja rama-rama terbang comel. Banyak ke sikit?", options: ["Banyak", "Sedikit"], correct: "Sedikit", hint: "Seekor sahaja, bermaksud sikit." },
      { id: 5, emoji: "🎈🎈🎈🎈🎈🎈🎈", text: "Belon warna-warni terbang tinggi! Banyak ke sikit?", options: ["Banyak", "Sedikit"], correct: "Banyak", hint: "Pesta belon meriah! Ada banyak." },
      { id: 6, emoji: "🐱", text: "Kucing ini kesunyian seorang diri. Banyak ke sikit?", options: ["Banyak", "Sedikit"], correct: "Sedikit", hint: "Satu ekor sahaja maksudnya sedikit." },
      { id: 7, emoji: "🚗🚗🚗🚗🚗🚗", text: "Kereta mainan adik bersepah atas lantai. Banyak ke sikit?", options: ["Banyak", "Sedikit"], correct: "Banyak", hint: "Banyak kereta abang main tu." },
      { id: 8, emoji: "🌟", text: "Bintang berkilip satu sahaja di tingkap. Banyak ke sikit?", options: ["Banyak", "Sedikit"], correct: "Sedikit", hint: "Satu bintang comel maksudnya sedikit." },
      { id: 9, emoji: "🐟🐟🐟🐟🐟🐟🐟🐟", text: "Ikan berenang gembira dalam akuarium. Banyak ke sikit?", options: ["Banyak", "Sedikit"], correct: "Banyak", hint: "Penuh ikan dalam air! Banyak sangat." },
      { id: 10, emoji: "🍬🍬", text: "Gula-gula manis dalam poket baju ada dua. Banyak ke sikit?", options: ["Banyak", "Sedikit"], correct: "Sedikit", hint: "Dua biji sahaja maksudnya sedikit." }
    ].map(q => ({ ...q, options: shuffleArray(q.options) }));
  }

  const sourceWords = Array.from(new Set([...(keywords || []), "Betul", "Pintar"]));
  return [...Array(10)].map((_, i) => {
    const correct = sourceWords[i % sourceWords.length] || "Betul";
    return {
      id: i + 1,
      emoji: "⭐",
      text: `Jom cari gambar yang sama dengan cikgu! Pilih perkataan ini:`,
      options: shuffleArray([correct, "Lain"]),
      correct: correct,
      hint: `Cari kotak yang ada tulisan huruf yang sama ya.`
    };
  });
};

// ============================================================================
// COMPONENT: ARENA PERMAINAN SERET (KAD MEMORI/PADANAN EMOJI)
// ============================================================================
function Year1InteractiveGame({ explanation, keywords, topicName, studentNickname, onComplete }) {
  const [questions, setQuestions] = useState([]);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("Ketuk butang hijau dulu untuk dengar suara cikgu, kemudian seret kad kuning di bawah ya sayang! 🥰");

  useEffect(() => {
    if (explanation) {
      setQuestions(generateKidsQuestions(explanation, keywords, topicName));
      setCurrentLevel(0);
      setIsFinished(false);
    }
  }, [explanation, keywords, topicName]);

  useEffect(() => {
    if (questions.length > 0 && !isFinished) {
      const q = questions[currentLevel];
      speakWithLove(`Pusingan nombor ${q.id}... ${q.text}... Sila pilih jawapan, banyak... atau... sedikit.`);
    }
  }, [currentLevel, questions, isFinished]);

  if (questions.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-slate-400 font-bold">
        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-purple-400" />
        Sabar ya sayang, cikgu tengah siapkan kotak mainan comel...
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
      
      const praises = [
        "Wah! Bijaknya anak bertuah ni. Betul tepat sekali!",
        "Hebatnya sayang! Betul lah jawapan tu.",
        "Pandainya dia! Cikgu bangga sangat dengan awak!"
      ];
      const randomPraise = praises[Math.floor(Math.random() * praises.length)];
      speakWithLove(randomPraise);
      setFeedbackMessage(`🎉 Betul lah ${studentNickname}! Awak memang budak pandai!`);
      
      if (currentLevel + 1 >= questions.length) {
        setIsFinished(true);
        if (onComplete) onComplete();
      } else {
        setTimeout(() => {
          setCurrentLevel((prev) => prev + 1);
          setFeedbackMessage("Jom kita main pusingan seterusnya, sayang! 🚀");
        }, 1400);
      }
    } else if (selectedValue !== null) {
      speakWithLove("Alahai, salah sikit sayang. Tak apa, jom tengok gambar betul-betul dan cuba lagi ya.");
      setFeedbackMessage(`💡 Cuba tengok petunjuk ni sayang: ${currentQuestion.hint}`);
    }
  };

  if (isFinished) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-gradient-to-b from-yellow-50 via-amber-100 to-amber-200 rounded-[2.5rem] p-6 border-4 border-amber-400 text-center space-y-4 shadow-xl">
        <div className="text-6xl animate-bounce">🏆</div>
        <h4 className="text-xl font-black text-amber-950">YAY! MISI KAD MEMORI SELESAI!</h4>
        <p className="text-xs text-amber-900 font-bold">Hebatnya wira cikgu ni, selesai semua pusingan dengan cemerlang! 😘</p>
        <Button onClick={() => { setCurrentLevel(0); setIsFinished(false); }} className="rounded-full bg-emerald-500 hover:bg-emerald-600 font-black text-xs text-white px-6 py-4 shadow-md mx-auto border-b-4 border-emerald-700 active:scale-95">
          <RefreshCw className="w-4 h-4 mr-1" /> Main Sekali Lagi
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-white to-purple-50 rounded-[2.5rem] p-5 border-4 border-purple-300 text-center space-y-4 shadow-md">
      <div className="flex items-center justify-between bg-purple-100/60 p-2 rounded-2xl">
        <span className="text-[11px] font-black text-purple-800">Pusingan {currentQuestion.id} daripada 10</span>
        <div className="flex gap-0.5">
          {[...Array(10)].map((_, idx) => (
            <span key={idx} className="text-sm">{idx <= currentLevel ? "⭐" : "⚫"}</span>
          ))}
        </div>
      </div>

      <button 
        onClick={() => speakWithLove(`${currentQuestion.text} Cuba pilih jawapan, banyak... atau... sedikit.`)}
        className="w-full p-3 bg-emerald-500 text-white rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-sm border-b-4 border-emerald-700 active:transform active:scale-95 transition-all"
      >
        <Volume2 className="w-5 h-5 animate-pulse" /> 🔊 CIKGU TOLONG BACAKAN SOALAN
      </button>

      <div className="bg-white py-4 px-2 rounded-3xl border-2 border-purple-100 shadow-inner space-y-2">
        <div className="text-5xl my-2 select-none tracking-widest p-2 bg-slate-50 rounded-2xl inline-block max-w-full min-h-[75px] leading-tight">{currentQuestion.emoji}</div>
        <p className="text-xs font-black text-slate-700 leading-snug px-1">{currentQuestion.text}</p>
      </div>

      <div className="bg-amber-100 text-amber-950 p-2.5 rounded-xl text-[10px] font-bold border border-amber-200">
        💌 {feedbackMessage}
      </div>

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
          <span className="text-3xl animate-pulse select-none">👆</span>
          <span className="text-[11px] font-black text-amber-950 mt-1">SENTUH & HERET SINI 👋</span>
        </motion.div>
      </div>

      <div className="border-t-2 border-dashed border-purple-200 my-1" />

      <div className="space-y-2">
        <p className="text-[10px] font-bold text-purple-400">👇 Jatuhkan kad kuning di dalam salah satu kotak betul di bawah:</p>
        <div className="grid grid-cols-2 gap-3">
          {currentQuestion.options.map((opt, i) => (
            <div 
              key={i} 
              data-value={opt} 
              className={`game-drop-target p-4 rounded-2xl border-4 border-dashed flex flex-col items-center justify-center min-h-[70px] transition-all ${
                opt === "Banyak" 
                  ? "bg-cyan-50 border-cyan-300 text-cyan-900 hover:bg-cyan-100" 
                  : "bg-pink-50 border-pink-300 text-pink-900 hover:bg-pink-100"
              }`}
            >
              <span className="text-base font-black pointer-events-none">{opt === "Banyak" ? "Banyak ✨" : "Sedikit 🌸"}</span>
              <span className="text-[10px] font-bold text-slate-400 pointer-events-none">Kotak {opt}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT (GAMIFIED ADVENTURE LEARNING)
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

  // Menggunakan state fasa sikit demi sikit (1=Misi Bermula, 2=Video, 3=Kad Memori, 4=Boss Quiz, 5=Selesai)
  const [currentPhase, setCurrentPhase] = useState(1); 
  const [status, setStatus] = useState({ lesson: false, mindmap: false, quiz: false });

  const [isImmersive, setIsImmersive] = useState(false);
  const [videoKey, setVideoKey] = useState(0);
  const [isVideoCompleted, setIsVideoCompleted] = useState(false);
  const [showMindMapEnd, setShowMindMapEnd] = useState(false);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  useEffect(() => {
    if (currentPhase === 2) {
      const timer = setTimeout(() => {
        setVideoKey(prev => prev + 1);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [currentPhase]);

  // Sebutan intonasi mengikut fasa baru yang telah diubahsuai susunannya
  useEffect(() => {
    if (explanation || currentPhase === 1) {
      if (currentPhase === 1) speakWithLove(`Hai wira pintar ${studentNickname || "sayang"}! Selamat datang ke Pengembaraan Ilmu baru! Sila ketuk butang Mulakan Misi sekarang!`);
      if (currentPhase === 2) speakWithLove(`Cabaran pertama sayang... Jom kita tengok video kartun seronok ini sampai habis dulu ya... nanti petunjuk rahsia akan terbuka.`);
      if (currentPhase === 3) speakWithLove(`Cabaran kedua sayang... Mari melatih kuasa ingatan kamu dengan kad memori dan gambar comel ini.`);
      if (currentPhase === 4) speakWithLove(`Cabaran ketiga... Ini pusingan Boss Besar! Jawab soalan mudah cikgu untuk kumpul markah piala emas! Kamu pasti boleh menang!`);
      if (currentPhase === 5) speakWithLove(`Horey! Tahniah wira! Kamu berjaya menyelesaikan seluruh peta pengembaraan hari ini. Cikgu bangga dengan kamu!`);
    }
  }, [currentPhase, explanation, studentNickname]);

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
          speakWithLove("Alhamdulillah tamat pun! Seronok kan? Sekarang... jom ketuk butang Misi Seterusnya untuk buka kad memori!");
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
        setStudentNickname(user?.nickname || user?.profile?.nickname || "Wira Comel");

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
    if (currentPhase === 2 && !isVideoCompleted) {
      speakWithLove("Tonton video kartun dulu sayang... jangan kalut ya.");
      alert("🔒 Sila tonton video tugasan kartun sehingga tamat dahulu ya anak pintar!");
      return;
    }
    if (currentPhase === 2) {
      // Panggil prefetch secara malas tanpa ubah fungsi asal
      loadMindMapOnDemand();
    }
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
        prompt: `Create a simple mind map suitable for 7-year-old child about topic "${topic?.name}". Focus on high visual layout and minimal text. Schema format: [{ "label": "string", "children": ["string"] }]`,
      });
      if (res && Array.isArray(res)) setMindMap(res);
    } catch (err) {}
  };

  const generateCoreLesson = async () => {
    if (status.lesson) return;
    setStatus(p => ({ ...p, lesson: true }));
    try {
      const user = await base44.auth.me();
      const dynamicTopicVideo = topic?.video_url || topic?.youtube_url || "https://www.youtube.com/embed/-8OVG1zor8w";

      const sampleExplanation = `
### 🌟 Jom Belajar: Banyak & Sedikit\n\n👀 **Mari Tengok Gambar Comel Ini:**\n* 🍎🍎🍎🍎🍎 = **Kumpulan Banyak** (Penuh Melimpah!)\n* 🍎 = **Kumpulan Sedikit** (Tinggal Satu Sahaja, Sikit Kasihan...)\n\n⭐ **Pesanan Sayang Cikgu:**\n* Perkataan Banyak bermaksud ada benda bertimbun-timbun!\n* Perkataan Sedikit bermaksud sunyi tinggal sikit sahaja.
      `;

      const session = await base44.entities.StudySession.create({
        student_id: user.id,
        subject_id: subjectId,
        topic_id: topicId,
        topic_name: topic.name,
        subject_name: subject.name,
        ai_explanation: JSON.stringify({ 
          lesson_markdown: sampleExplanation, 
          summary: topic?.name || "Banyak dan Sedikit", 
          keywords: ["Banyak", "Sedikit"],
          video_url: dynamicTopicVideo 
        }),
        duration_minutes: 0,
      });

      setSessionId(session.id);
      setExplanation(sampleExplanation);
      setVideoUrl(dynamicTopicVideo);
      
      // Jika url video kosong/tiada, skip terus ke Kad Memori (Phase 3)
      if (!dynamicTopicVideo || dynamicTopicVideo.includes("null")) {
        setIsVideoCompleted(true);
        setCurrentPhase(3);
      } else {
        setCurrentPhase(2);
      }
      setIsVideoCompleted(false);
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
        prompt: `Act as a loving preschool teacher. Create exactly 10 very easy multiple choice questions for 7-year-old Malaysian kids about "${topic?.name || "Banyak dan Sedikit"}". Keep text extremely short (under 6 words per sentence). Use multiple emojis inside the question text for kids who can't read. Format strictly as JSON array: [{ "question": "string with emojis", "options": ["string", "string"], "correct_answer": "string", "explanation": "string" }]`,
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
        
        // Pindah ke skrin Complete kembara secara interaktif
        setCurrentPhase(5);
        confetti({ particleCount: 150, spread: 80 });
        
        // Membuka navigasi kuiz sedia ada selepas delay seketika
        setTimeout(() => {
          navigate(`/quiz/${quiz.id}`);
        }, 3000);
      }
    } catch (err) {
      console.error(err);
      speakWithLove("Minta maaf sayang, pintu kuiz tersekat kejap. Boleh ketuk butang kuiz sekali lagi?");
    } finally { setStatus(p => ({ ...p, quiz: false })); }
  };

  const securedVideoUrl = (() => {
    if (!videoUrl) return "";
    const cleanUrl = videoUrl.split("?")[0]; 
    return `${cleanUrl}?enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}&controls=1&modestbranding=1&rel=0`;
  })();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-purple-50 text-purple-600 gap-2">
        <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
        <span className="text-xs font-black animate-pulse text-purple-900">Membuka Peta Kembara Rahsia... ✨</span>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 max-w-md mx-auto space-y-5 pb-28 bg-gradient-to-b from-amber-50/40 to-purple-50/40 min-h-screen select-none font-sans">
      
      {/* HEADER GAMIFICATION BAR (ALA DUOLINGO) */}
      <div className="flex items-center gap-3 bg-white p-3 rounded-[2rem] border-4 border-purple-200 shadow-sm">
        <Link to={`/study/${subjectId}`} className="p-2.5 bg-purple-100 hover:bg-purple-200 rounded-2xl transition-transform active:scale-90">
          <ArrowLeft className="w-5 h-5 text-purple-700" />
        </Link>
        <div className="flex-1">
          <h1 className="text-[11px] font-black text-slate-800 leading-tight truncate">
            🏴‍☠️ Misi: {topic?.name || "Kembara Ilmu"}
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[9px] bg-amber-400 text-amber-950 font-extrabold px-1.5 py-0.5 rounded-md">
              Level 1
            </span>
            <p className="text-[9px] text-purple-600 font-bold">{subject?.name || "Matematik"}</p>
          </div>
        </div>
        
        {/* STATS BADGES */}
        <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-full border border-slate-200">
          <div className="flex items-center text-amber-500 text-xs font-black gap-0.5">
            <Coins className="w-3.5 h-3.5 fill-amber-400" /> <span className="text-[10px]">50</span>
          </div>
          <div className="flex items-center text-red-500 text-xs font-black gap-0.5">
            <Flame className="w-3.5 h-3.5 fill-red-400" /> <span className="text-[10px]">1</span>
          </div>
        </div>
      </div>

      {/* PROGRESS TRACKER ADVENTURE PATTERN */}
      <div className="bg-white p-3 rounded-2xl border-2 border-purple-100 shadow-sm">
        <div className="flex justify-around items-center text-xl relative">
          <div className="absolute top-1/2 left-4 right-4 h-1 bg-slate-100 -translate-y-1/2 z-0 rounded-full" />
          
          <span className={`relative z-10 p-2 rounded-full transition-all ${currentPhase === 1 ? "bg-purple-500 text-white scale-110 shadow-md ring-4 ring-purple-100" : currentPhase > 1 ? "bg-emerald-500 text-white" : "bg-slate-200 opacity-40"}`}>
            {currentPhase > 1 ? <CheckCircle2 className="w-4 h-4" /> : "🏕️"}
          </span>
          <span className={`relative z-10 p-2 rounded-full transition-all ${currentPhase === 2 ? "bg-purple-500 text-white scale-110 shadow-md ring-4 ring-purple-100" : currentPhase > 2 ? "bg-emerald-500 text-white" : "bg-slate-200 opacity-40"}`}>
            {currentPhase > 2 ? <CheckCircle2 className="w-4 h-4" /> : "🎬"}
          </span>
          <span className={`relative z-10 p-2 rounded-full transition-all ${currentPhase === 3 ? "bg-purple-500 text-white scale-110 shadow-md ring-4 ring-purple-100" : currentPhase > 3 ? "bg-emerald-500 text-white" : "bg-slate-200 opacity-40"}`}>
            {currentPhase > 3 ? <CheckCircle2 className="w-4 h-4" /> : "🃏"}
          </span>
          <span className={`relative z-10 p-2 rounded-full transition-all ${currentPhase === 4 ? "bg-purple-500 text-white scale-110 shadow-md ring-4 ring-purple-100" : currentPhase > 4 ? "bg-emerald-500 text-white" : "bg-slate-200 opacity-40"}`}>
            {currentPhase > 4 ? <CheckCircle2 className="w-4 h-4" /> : "🏆"}
          </span>
          <span className={`relative z-10 p-2 rounded-full transition-all ${currentPhase === 5 ? "bg-purple-500 text-white scale-110 shadow-md ring-4 ring-purple-100" : "bg-slate-200 opacity-40"}`}>
            👑
          </span>
        </div>
        <p className="text-[10px] font-black text-center text-purple-700 uppercase tracking-wider mt-2">
          {currentPhase === 1 && "🏕️ Misi 1: Selamat Datang, Wira!"}
          {currentPhase === 2 && "🎬 Misi 2: Cabaran Video Rahsia"}
          {currentPhase === 3 && "🃏 Misi 3: Cabaran Kad Memori"}
          {currentPhase === 4 && "🏆 Misi 4: Pertempuran Boss Akhir"}
          {currentPhase === 5 && "👑 Kembara Selesai: Juara Agung!"}
        </p>
      </div>

      {/* CONTROLLER COMPONENT GRAPHICS BLOCK */}
      <div className="min-h-[320px]">
        <AnimatePresence mode="wait">
          
          {/* PHASE 1: GREETING & WELCOME */}
          {currentPhase === 1 && (
            <motion.div key="phase1" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="text-center py-8 px-5 bg-white border-4 border-purple-300 rounded-[2.5rem] shadow-md space-y-4 relative overflow-hidden">
              <div className="absolute -top-6 -right-6 w-16 h-16 bg-yellow-300 rounded-full blur-xl opacity-70" />
              <div className="text-6xl animate-bounce">🦄</div>
              <h2 className="text-lg font-black text-purple-950">Hai {studentNickname}! 🥰</h2>
              <p className="text-xs text-slate-600 font-bold px-2 leading-relaxed">
                Hari ini kamu akan memulakan satu **Pengembaraan Ilmu** yang sangat hebat. Selesaikan semua cabaran di bawah untuk raih ganjaran bertimbun!
              </p>
              
              <div className="bg-purple-50 p-3 rounded-2xl border border-purple-100 grid grid-cols-3 gap-2 text-center">
                <div className="flex flex-col items-center">
                  <span className="text-sm font-black text-amber-600">+50</span>
                  <span className="text-[9px] text-slate-400 font-bold">Syiling</span>
                </div>
                <div className="flex flex-col items-center border-x border-slate-200">
                  <span className="text-sm font-black text-purple-600">+120</span>
                  <span className="text-[9px] text-slate-400 font-bold">XP Wira</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-sm font-black text-red-500">🏅</span>
                  <span className="text-[9px] text-slate-400 font-bold">Lencana</span>
                </div>
              </div>

              <Button 
                onClick={generateCoreLesson} 
                disabled={status.lesson} 
                className="w-full h-14 rounded-3xl text-xs font-black bg-gradient-to-r from-purple-500 to-indigo-600 border-b-4 border-indigo-800 text-white shadow-lg active:transform active:scale-95 transition-all"
              >
                {status.lesson ? "Membuka Peta Dunia..." : "ROKETKAN MISI SEKARANG! 🚀"}
              </Button>
            </motion.div>
          )}

          {/* PHASE 2: SECRET CINEMA PLAYER */}
          {currentPhase === 2 && (
            <motion.div key="phase2" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="bg-white rounded-3xl p-5 border shadow-sm space-y-4">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1">
                <div className="flex items-center gap-2 text-slate-700 font-black text-xs">
                  <Tv className="w-4 h-4 text-purple-500" /> <span>Cabaran 1: Video Rahsia Guru</span>
                </div>
                <p className="text-[10px] text-slate-500 font-bold">
                  Tonton video pembelajaran ini sehingga tamat untuk mendapatkan petunjuk kod rahsia ke tahap seterusnya!
                </p>
              </div>

              <div 
                onClick={() => setIsImmersive(true)}
                className="group relative w-full rounded-2xl overflow-hidden aspect-video bg-slate-900 border-4 border-amber-300 shadow-md cursor-pointer"
              >
                <iframe 
                  key={`mini-${videoKey}`}
                  className="absolute inset-0 w-full h-full pointer-events-none" 
                  src={securedVideoUrl}
                  title="Kid Cinema Player"
                ></iframe>
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <div className="bg-amber-400 text-slate-950 font-black text-[10px] px-4 py-2.5 rounded-full shadow-lg animate-pulse">
                    ▶️ KETUK BUKA SKRIN BESAR
                  </div>
                </div>
              </div>

              <div className={`p-3 rounded-2xl border text-center font-black text-[11px] ${isVideoCompleted ? "bg-emerald-50 border-emerald-300 text-emerald-800" : "bg-amber-50 border-amber-300 text-amber-800"}`}>
                {isVideoCompleted ? (
                  "✅ Syabas! Video selesai! Jom ketuk butang ungu di bawah untuk ke Misi Flashcard!"
                ) : (
                  <div className="space-y-1">
                    <p>🔒 Sila tonton sehingga habis untuk membuka kunci kotak permainan ya sayang.</p>
                    <button onClick={() => setIsVideoCompleted(true)} className="text-[9px] text-purple-600 underline block mx-auto font-black">
                      (Dah siap tengok? Klik cepat di sini untuk langkau)
                    </button>
                  </div>
                )}
              </div>

              {/* OVERLAY LAYOUT FULLSCREEN */}
              <AnimatePresence>
                {isImmersive && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black z-[9999] flex flex-col items-center justify-center p-2">
                    <div className="w-full max-w-2xl flex justify-between p-2 text-white items-center">
                      <span className="text-[10px] font-black bg-purple-600 px-3 py-1 rounded-full text-white">📺 WAYANG KEMBARA SI COMEL</span>
                      <Button onClick={() => setIsImmersive(false)} className="bg-red-500 text-white font-black h-8 px-3 rounded-xl text-xs">✕ Tutup TV</Button>
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

              <Button 
                onClick={handleNextPhase}
                disabled={!isVideoCompleted}
                className="w-full h-12 rounded-2xl text-xs font-black bg-purple-600 hover:bg-purple-700 text-white shadow-md disabled:opacity-40"
              >
                SAYA DAH BERSEDIA! MARI KAD MEMORI ➡️
              </Button>
            </motion.div>
          )}

          {/* PHASE 3: INTERACTIVE FLASHCARDS */}
          {currentPhase === 3 && (
            <motion.div key="phase3" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-4">
              <div className="bg-white rounded-3xl p-4 border shadow-sm space-y-2">
                <div className="bg-purple-50 p-2.5 rounded-xl border border-purple-100">
                  <h4 className="text-xs font-black text-purple-950 flex items-center gap-1.5">
                    🃏 Cabaran 2: Kuasa Memori Ilmu
                  </h4>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                    Mari latih otak pintar kamu! Cuba ingat fakta penting di dalam kotak mainan emoji di bawah dengan tepat.
                  </p>
                </div>
                
                {/* Menjaga kandungan asal LessonContent di atas flashcard */}
                <div className="prose prose-sm text-slate-800 text-xs font-bold leading-relaxed border-t pt-2 bg-amber-50/50 p-3 rounded-2xl border border-amber-100">
                  <LessonContent content={explanation} />
                </div>
              </div>

              {/* Komponen Permainan Interaktif Utama */}
              <Year1InteractiveGame 
                explanation={explanation}
                keywords={metaData.keywords}
                topicName={topic?.name || "Topik"}
                studentNickname={studentNickname}
                onComplete={() => console.log("Memory cards cleared successfully!")}
              />

              <Button 
                onClick={handleNextPhase}
                className="w-full h-12 rounded-2xl text-xs font-black bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md"
              >
                💪 SAYA DAH HAFAL! JOM LAWAN BOSS
              </Button>
            </motion.div>
          )}

          {/* PHASE 4: THE BOSS BATTLE CHAMPIONSHIPS */}
          {currentPhase === 4 && (
            <motion.div key="phase4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="bg-gradient-to-br from-purple-700 via-indigo-800 to-slate-900 rounded-[2.5rem] p-6 text-center text-white space-y-4 border-4 border-purple-400 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/20 rounded-full blur-xl" />
              <div className="text-6xl animate-bounce">🦁</div>
              <h3 className="text-lg font-black tracking-wide text-yellow-300">⚔️ PERTEMPURAN BOSS AKHIR!</h3>
              <p className="text-xs text-purple-100 font-medium px-2 leading-relaxed">
                Inilah masanya untuk membuktikan kamu wira sejati! Jawab semua soalan quiz istimewa cikgu dengan berani untuk rebut mahkota juara.
              </p>

              <div className="bg-black/30 p-4 rounded-2xl border border-white/10 space-y-2 text-left">
                <p className="text-[10px] font-bold text-purple-300">Pilih Mod Serangan Wira:</p>
                <div className="grid grid-cols-1 gap-2">
                  <div className="bg-white/10 p-2.5 rounded-xl flex items-center justify-between border border-white/5">
                    <span className="text-[11px] font-black">👑 Cabaran Agung Boss</span>
                    <span className="text-[9px] bg-yellow-400 text-slate-950 px-1.5 py-0.5 rounded font-extrabold">Recomended</span>
                  </div>
                  <div className="bg-white/5 p-2.5 rounded-xl flex items-center justify-between opacity-60">
                    <span className="text-[11px] font-medium text-slate-300">⚡ Cabaran Pantas Kilat</span>
                    <Lock className="w-3 h-3" />
                  </div>
                </div>
              </div>

              <Button 
                onClick={runQuizGeneration} 
                disabled={status.quiz}
                className="w-full h-14 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black rounded-3xl text-xs border-b-4 border-amber-700 shadow-lg transition-transform active:scale-95"
              >
                {status.quiz ? "Menghidupkan Kuasa Quiz..." : "SERANG KOD BOSS SEKARANG! 🏆"}
              </Button>
            </motion.div>
          )}

          {/* PHASE 5: CELEBRATION COMPLETED SCREEN & MINDMAP OPTIONAL */}
          {currentPhase === 5 && (
            <motion.div key="phase5" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
              <div className="bg-gradient-to-b from-yellow-50 via-amber-100 to-orange-100 rounded-[2.5rem] p-6 border-4 border-amber-400 text-center space-y-4 shadow-xl">
                <div className="text-6xl animate-pulse">🎉</div>
                <h4 className="text-xl font-black text-amber-950">MISI KEMBARA TAMAT!</h4>
                <p className="text-xs text-amber-900 font-bold leading-relaxed px-2">
                  Tahniah! Kamu telah berjaya menamatkan pengembaraan **{topic?.name || "Topik Ini"}** dengan cemerlang. Kamu memang seorang wira ilmu sejati! 🏅
                </p>

                <div className="bg-white/80 p-3 rounded-2xl border border-amber-200 flex justify-around items-center max-w-xs mx-auto">
                  <div className="text-center">
                    <span className="block text-base font-black text-amber-600">+100</span>
                    <span className="text-[9px] font-bold text-slate-400">Bonus Syiling</span>
                  </div>
                  <div className="w-px h-8 bg-slate-200" />
                  <div className="text-center">
                    <span className="block text-base font-black text-purple-600">+200</span>
                    <span className="text-[9px] font-bold text-slate-400">Bonus XP</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <Button 
                    onClick={() => { setShowMindMapEnd(!showMindMapEnd); loadMindMapOnDemand(); }} 
                    className="rounded-2xl bg-purple-600 hover:bg-purple-700 font-black text-xs text-white h-12 shadow-md border-b-2 border-purple-800"
                  >
                    <Compass className="w-4 h-4 mr-1.5 animate-spin" /> {showMindMapEnd ? "Sorok Peta Minda" : "🗺️ Lihat Peta Minda Lukisan"}
                  </Button>
                </div>
              </div>

              {/* Paparan MindMap bersyarat selepas tamat pengembaraan */}
              {showMindMapEnd && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-4 border shadow-md space-y-2">
                  <h3 className="font-black text-xs text-slate-800 flex items-center gap-1">🗺️ Peta Jalan Lukisan Visual</h3>
                  {mindMap ? (
                    <MindMap mindMap={{ central_topic: topic?.name || "Nota Pintar", branches: mindMap }} />
                  ) : (
                    <p className="text-center text-[10px] py-4 text-slate-400 animate-pulse">Tengah melukis gambaran peta minda...</p>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* FOOTER NAVIGATION SYSTEM CONTROL */}
      {explanation && currentPhase < 5 && (
        <div className="flex justify-between items-center pt-2 border-t border-dashed border-slate-200">
          <Button 
            onClick={handlePrevPhase} 
            disabled={currentPhase === 1}
            className="rounded-2xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-black px-4 h-10 disabled:opacity-30 transition-all"
          >
            ⬅️ Undur Balik
          </Button>
          
          {currentPhase < 4 && (
            <Button 
              onClick={handleNextPhase}
              className="rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px] font-black px-5 h-10 border-b-2 border-indigo-900 shadow-sm transition-transform active:scale-95"
            >
              Misi Seterusnya ➡️
            </Button>
          )}
        </div>
      )}

    </div>
  );
}