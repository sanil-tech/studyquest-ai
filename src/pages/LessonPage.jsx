// src/pages/LessonPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Sparkles, Loader2, Trophy, GitFork, Youtube, Star, HelpCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

import LessonContent from "@/components/lesson/LessonContent";
import MindMap from "@/components/lesson/MindMap";

// ============================================================================
// 1. HELPERS & FORMATTING REGISTER
// ============================================================================
const shuffleArray = (array) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

// Fungsi memproses 10 soalan game secara dinamik daripada pangkalan data / JSON nota
const generateDynamicQuestionsFromContent = (explanation, keywords, topicName) => {
  if (explanation && explanation.includes("Banyak dan Sedikit")) {
    return [
      { id: 1, emoji: "🍎🍎🍎🍎🍎🍎🍎🍎", text: "Kumpulan 8 biji epal ini dikategorikan sebagai apa?", options: ["Banyak", "Sedikit", "Sama"], correct: "Banyak", hint: "Rujuk contoh nota: 8 biji epal adalah..." },
      { id: 2, emoji: "🍎🍎", text: "Kumpulan 2 biji epal ini pula dikategorikan sebagai apa?", options: ["Banyak", "Sedikit", "Kurang Pasti"], correct: "Sedikit", hint: "Rujuk contoh nota: 2 biji epal bermaksud..." },
      { id: 3, emoji: "🌻🌻🌻🌻🌻🌻🌻🌻🌻🌻", text: "Ada 10 kuntum bunga matahari. Adakah kuantiti ini banyak atau sedikit?", options: ["Banyak", "Sedikit", "Kosong"], correct: "Banyak", hint: "Imbas kembali perbandingan antara 10 bunga matahari dengan 3 rama-rama." },
      { id: 4, emoji: "🦋🦋🦋", text: "Hanya ada 3 ekor rama-rama yang terbang. Kuantiti ini ialah...", options: ["Banyak", "Sedikit", "Lebih"], correct: "Sedikit", hint: "Antara 10 bunga dan 3 rama-rama, kumpulan yang sedikit ialah..." },
      { id: 5, emoji: "🍎 VS 🍏", text: "Apabila kita membandingkan dua kumpulan, kumpulan yang mempunyai KURANG benda disebut?", options: ["Banyak", "Sedikit", "Besar"], correct: "Sedikit", hint: "Petunjuk bahagian Cuba Ingat: Cari yang kurang!" },
      { id: 6, emoji: "🎁 VS 📦", text: "Kumpulan yang mempunyai LEBIH banyak benda pula disebut?", options: ["Banyak", "Sedikit", "Kecil"], correct: "Banyak", hint: "Imbas kembali nota bintang (⭐): Banyak bermaksud ada lebih banyak benda." },
      { id: 7, emoji: "🧺 (Bakul A: 8 Epal)", text: "Jika Bakul A ada 8 epal dan Bakul B ada 2 epal, bakul mana yang LEBIH BANYAK?", options: ["Bakul A", "Bakul B", "Kedua-duanya sama"], correct: "Bakul A", hint: "Semak soalan 2 di bahagian 'Cuba Ingat'. Cari nombor yang lebih besar." },
      { id: 8, emoji: "🧺 (Bakul B: 2 Epal)", text: "Berdasarkan situasi bakul yang sama (Bakul A: 8, Bakul B: 2), bakul mana yang SEDIKIT?", options: ["Bakul A", "Bakul B", "Sama banyak"], correct: "Bakul B", hint: "Bakul yang sedikit mempunyai bilangan epal yang kurang." },
      { id: 9, emoji: "🍦 🍦 🍦", text: "Kita membandingkan dua kumpulan benda untuk melihat mana yang 'lebih' atau...", options: ["Kurang", "Tinggi", "Panjang"], correct: "Kurang", hint: "Sila rujuk perenggan pertama di bawah tajuk 'Mari Ingat Semula!'." },
      { id: 10, emoji: "⭐✨", text: "Apakah istilah lawan atau pasangan bandingan bagi perkataan 'Banyak'?", options: ["Sedikit", "Lebih", "Sama"], correct: "Sedikit", hint: "Bila kita bandingkan, kita akan tahu kumpulan mana yang Banyak dan mana yang..." }
    ].map(q => ({ ...q, options: shuffleArray(q.options) }));
  }

  // Fallback sekiranya topik umum
  const sourceWords = Array.from(new Set([...(keywords || []), "Belajar", "Pintar", "Maju"]));
  return [...Array(10)].map((_, i) => {
    const correct = sourceWords[i % sourceWords.length] || "Betul";
    return {
      id: i + 1,
      emoji: "🌟",
      text: `Manakah perkataan utama rahsia yang kita pelajari dalam topik "${topicName}"?`,
      options: shuffleArray([correct, "Lain-lain", "Salah"]),
      correct: correct,
      hint: `Cari istilah: ${correct}`
    };
  });
};

// ============================================================================
// 2. INTERACTIVE GAME COMPONENT (10 LEVELS)
// ============================================================================
function Year1InteractiveGame({ explanation, keywords, topicName, studentNickname, onComplete }) {
  const [questions, setQuestions] = useState([]);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("Seret elemen ke kotak jawapan padanan yang betul! 🧠✨");

  useEffect(() => {
    if (explanation) {
      setQuestions(generateDynamicQuestionsFromContent(explanation, keywords, topicName));
      setCurrentLevel(0);
      setIsFinished(false);
    }
  }, [explanation, keywords, topicName]);

  if (questions.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-purple-400" />
        Menyusun arena cabaran berasaskan nota topik...
      </div>
    );
  }

  const currentQuestion = questions[currentLevel];

  const handleDragEnd = (event, info) => {
    const dropTargets = document.querySelectorAll(".game-drop-target");
    let selectedValue = null;

    dropTargets.forEach((target) => {
      const rect = target.getBoundingClientRect();
      if (
        info.point.x >= rect.left && info.point.x <= rect.right &&
        info.point.y >= rect.top && info.point.y <= rect.bottom
      ) {
        selectedValue = target.getAttribute("data-value");
      }
    });

    if (selectedValue === currentQuestion.correct) {
      confetti({ particleCount: 30, spread: 40, origin: { y: 0.6 } });
      setFeedbackMessage(`Syabas ${studentNickname}! Tepat sekali, jawapannya ialah "${currentQuestion.correct}"! 🌈`);
      
      if (currentLevel + 1 >= questions.length) {
        setIsFinished(true);
        if (onComplete) onComplete();
      } else {
        setTimeout(() => {
          setCurrentLevel((prev) => prev + 1);
          setFeedbackMessage("Hebat! Jom selesaikan cabaran peringkat seterusnya! 🚀");
        }, 1300);
      }
    } else if (selectedValue !== null) {
      setFeedbackMessage(`Opps! Mari semak petunjuk ini: "${currentQuestion.hint}" 💡`);
    }
  };

  if (isFinished) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-gradient-to-b from-emerald-50 to-emerald-100/50 rounded-3xl p-6 border-2 border-emerald-200 text-center space-y-4 shadow-md">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl animate-bounce">🏆</div>
        <h4 className="text-xl font-extrabold text-emerald-900">10/10 Markah Penuh!</h4>
        <p className="text-sm text-emerald-700 font-medium">Bijaknya ${studentNickname}! Anda berjaya melepas 10 peringkat perlawanan padanan nota dengan cemerlang!</p>
        <Button onClick={() => { setCurrentLevel(0); setIsFinished(false); }} variant="outline" size="sm" className="rounded-xl border-emerald-300 text-emerald-700 bg-white gap-1 text-xs mx-auto">
          <RefreshCw className="w-3 h-3" /> Main Semula
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-5 border-2 border-purple-200 text-center space-y-5 shadow-inner">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold text-purple-700 bg-purple-100 px-3 py-1 rounded-full">Peringkat Game {currentQuestion.id} / 10</span>
        <div className="flex items-center gap-0.5">
          {[...Array(10)].map((_, idx) => (
            <Star key={idx} className={`w-3.5 h-3.5 ${idx <= currentLevel ? "text-amber-400 fill-amber-400" : "text-slate-200"}`} />
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-4xl my-1">{currentQuestion.emoji}</div>
        <p className="text-sm font-extrabold text-slate-700 px-2 leading-relaxed">{currentQuestion.text}</p>
      </div>

      <div className="bg-purple-50 text-purple-900 p-2.5 rounded-2xl text-xs font-bold min-h-[40px] flex items-center justify-center border border-purple-100">
        {feedbackMessage}
      </div>

      <div className="py-2 flex justify-center items-center min-h-[80px]">
        <motion.div
          key={currentQuestion.id} drag dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }} dragElastic={0.6} onDragEnd={handleDragEnd} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          className="p-4 bg-gradient-to-br from-yellow-50 to-amber-100 border-2 border-amber-300 rounded-2xl shadow-sm cursor-grab active:cursor-grabbing inline-flex flex-col items-center justify-center min-w-[130px]"
        >
          <span className="text-[10px] font-black text-amber-900 tracking-wider">ANGKAT & LEPAS 👋</span>
        </motion.div>
      </div>

      <div className="border-t border-dashed border-slate-200 my-1" />

      <div className="space-y-2">
        <p className="text-[10px] font-bold text-slate-400 flex items-center justify-center gap-1">
          <HelpCircle className="w-3 h-3" /> Jatuhkan di dalam petak jawapan nota yang betul:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {currentQuestion.options.map((opt, i) => (
            <div key={i} data-value={opt} className="game-drop-target p-3 rounded-xl border-2 border-dashed border-purple-200 bg-purple-50/40 flex items-center justify-center min-h-[50px] hover:bg-purple-100 hover:border-purple-400 transition-colors">
              <span className="text-xs font-extrabold text-purple-900">{opt}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 3. MAIN COMPONENT LAYER (MISSION-BASED LEARNING FLOW)
// ============================================================================
export default function LessonPage() {
  const { subjectId, topicId } = useParams();
  const navigate = useNavigate();
  
  const [subject, setSubject] = useState(null);
  const [topic, setTopic] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [studentNickname, setStudentNickname] = useState(""); 
  const [loading, setLoading] = useState(true);

  // Content States
  const [explanation, setExplanation] = useState("");
  const [videoUrl, setVideoUrl] = useState(""); 
  const [metaData, setMetaData] = useState({ summary: "", keywords: [] });
  const [mindMap, setMindMap] = useState(null);

  // Fasa Mengikut Misi Pembelajaran Kembara
  const [currentPhase, setCurrentPhase] = useState(1); 
  const [status, setStatus] = useState({ lesson: false, mindmap: false, quiz: false });

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
        setStudentNickname(user?.nickname || user?.profile?.nickname || "Si Bijak");

        // Semak pangkalan data bagi sesi pengajian sedia ada (cache)
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
            
            // 🌟 LOGIK PENGESANAN VIDEO DINAMIK BERLAPIS (Video ikut topik secara automatik)
            const detectedVideo = parsed.video_url || top?.video_url || "https://www.youtube.com/embed/-8OVG1zor8w?si=CEcDsctK57fTa39x";
            setVideoUrl(detectedVideo);
            
            if (session.mindmap_json) setMindMap(JSON.parse(session.mindmap_json));
          }
        }
      } catch (err) {
        console.error("Gagal memuatkan misi kembara:", err);
      } finally {
        setLoading(false);
      }
    };
    initializeLesson();
  }, [subjectId, topicId]);

  const handleNextPhase = () => {
    if (currentPhase === 1) loadMindMapOnDemand();
    setCurrentPhase(prev => prev + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    confetti({ particleCount: 50, spread: 30, origin: { y: 0.7 } });
  };

  const handlePrevPhase = () => {
    if (currentPhase > 1) {
      setCurrentPhase(currentPhase - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // YouTube iframe auto-detect: advance to Phase 2 when video ends
  useEffect(() => {
    const handleEmbedVideoStatus = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.event === "infoDelivery" && data.info && data.info.playerState === 0) {
          confetti({ particleCount: 80, spread: 60 });
          alert(`🎉 Hebat ${studentNickname}! Anda telah selesai menonton video kembara ini. Jom kita ke cabaran seterusnya!`);
          handleNextPhase();
        }
      } catch (e) {
        // Ignore non-YouTube messages
      }
    };

    window.addEventListener("message", handleEmbedVideoStatus);
    return () => window.removeEventListener("message", handleEmbedVideoStatus);
  }, [videoUrl, studentNickname]);
  

  const loadMindMapOnDemand = async () => {
    if (mindMap && mindMap.length > 0) return;
    if (status.mindmap) return;
    setStatus(p => ({ ...p, mindmap: true }));
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        model: "gemini_3_flash",
        prompt: `Create a simple mind map based on summary "${metaData.summary || topic?.name}". Return schema matching: [{ "label": "string", "children": ["string"] }]`,
      });
      if (res && Array.isArray(res)) setMindMap(res);
    } catch (err) { console.error(err); } finally { setStatus(p => ({ ...p, mindmap: false })); }
  };

  const generateCoreLesson = async () => {
    if (status.lesson) return;
    setStatus(p => ({ ...p, lesson: true }));
    try {
      const user = await base44.auth.me();
      
      // Auto-detect video mengikut pautan yang diletakkan dalam entiti topik asal
      const dynamicTopicVideo = topic?.video_url || "https://www.youtube.com/embed/-8OVG1zor8w?si=CEcDsctK57fTa39x";

      const sampleExplanation = `
### 🌟 Recap: Banyak dan Sedikit\n\n🧠 **Mari Ingat Semula!**\nKita membandingkan dua kumpulan benda untuk melihat mana yang \"lebih\" atau \"kurang\".\n\n👀 **Lihat Contoh**\n* 🍎🍎🍎🍎🍎🍎🍎🍎 = **Banyak epal** (ada 8 biji)\n* 🍎🍎 = **Sedikit epal** (ada 2 biji)\n* 🌻🌻🌻🌻🌻🌻🌻🌻🌻🌻 = **Banyak bunga matahari** (ada 10 kuntum)\n* 🦋🦋🦋 = **Sedikit rama-rama** (ada 3 ekor)\n\n⭐ **Ingat!**\n* Banyak bermaksud ada lebih banyak benda.\n* Sedikit bermaksud ada kurang benda.
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
        prompt: `Based on topic: "${topic?.name || "Banyak dan Sedikit"}", generate exactly 10 MCQs. Return JSON: [{ "question": "string", "options": ["string"], "correct_answer": "string", "explanation": "string" }]`,
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
    } catch (err) { console.error(err); } finally { setStatus(p => ({ ...p, quiz: false })); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-3 py-6 max-w-md mx-auto space-y-6 pb-28 bg-slate-50 min-h-screen">
      
      {/* HEADER BAR */}
      <div className="flex items-center gap-4 bg-gradient-to-r from-purple-100 via-indigo-50 to-cyan-100 p-4 rounded-3xl border shadow-sm">
        <Link to={`/study/${subjectId}`} className="p-2.5 bg-white rounded-xl shadow-sm">
          <ArrowLeft className="w-5 h-5 text-purple-600" />
        </Link>
        <div>
          <h1 className="text-sm font-bold text-slate-800">{topic?.name || "Banyak dan Sedikit"} 🌟</h1>
          <p className="text-purple-700 font-medium text-xs">{subject?.name || "Matematik"} • {topic?.form_level || "Tahun 1"}</p>
        </div>
      </div>

      {!explanation ? (
        <div className="text-center py-12 px-4 bg-white border-2 border-dashed rounded-3xl shadow-md space-y-4">
          <Sparkles className="w-8 h-8 text-purple-500 animate-pulse mx-auto" />
          <h2 className="text-base font-black text-slate-800">Sedia Mulakan Kembara, {studentNickname}? 🚀</h2>
          <p className="text-xs text-slate-500">Selesaikan setiap cabaran untuk membuka kunci perlawanan Boss Besar!</p>
          <Button onClick={generateCoreLesson} disabled={status.lesson} className="w-full h-11 rounded-full font-bold bg-purple-600 hover:bg-purple-700 text-white">
            {status.lesson ? "Membuka Gerbang Misi..." : "Mula Selesaikan Misi!"}
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          
          {/* TRACKER PROGRESS MISI BERULANG */}
          <div className="bg-white p-4 rounded-2xl border text-xs space-y-2.5 font-black text-slate-700 shadow-sm">
            <div className="flex justify-between items-center">
              <span>Misi Semasa: Peringkat {currentPhase} / 4</span>
              <span className="text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-100 animate-pulse text-[10px]">
                {currentPhase === 1 && "📺 Cabaran 1: Pawagam Minda"}
                {currentPhase === 2 && "📖 Cabaran 2: Jejak Nota Bijak"}
                {currentPhase === 3 && "🎮 Cabaran 3: Arena Padanan"}
                {currentPhase === 4 && "🔥 Cabaran Akhir: Boss Besar Kuiz"}
              </span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border p-0.5">
              <div className="h-full bg-gradient-to-r from-purple-400 to-cyan-500 rounded-full transition-all duration-300" style={{ width: `${(currentPhase / 4) * 100}%` }} />
            </div>
          </div>

          {/* DYNAMIC CONTENT SWITCHER BASED ON MISSION */}
          <div className="min-h-[300px]">
            <AnimatePresence mode="wait">
              
{/* CABARAN 1: WATCH VIDEO (IN-APP EXCLUSIVE + AUTO FULLSCREEN MODAL) */}
{currentPhase === 1 && (
  <motion.div key="m1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-white rounded-3xl p-4 border shadow-sm space-y-3">
    
    {/* State Pengurusan Skrin Penuh Dinamik */}
    {(() => {
      const [isImmersive, setIsImmersive] = useState(false);
      const [videoKey, setVideoKey] = useState(0);

      // Seterusnya, kita pasang pengesan mesej YouTube API
      useEffect(() => {
        const handleVideoEndMessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            // playerState === 0 bermaksud video TELAH SELESAI dimainkan (ENDED)
            if (data.event === "infoDelivery" && data.info && data.info.playerState === 0) {
              setIsImmersive(false); // 🌟 AUTO CLOSE: Tutup mod skrin penuh serta-merta
              confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
              
              // Keluar notifikasi kejayaan comel untuk kanak-kanak
              setTimeout(() => {
                alert(`🎉 Tahniah ${studentNickname}! Misi menonton selesai. Jom kita terus ke Cabaran 2!`);
                handleNextPhase(); // Auto-bawa ke peringkat seterusnya
              }, 400);
            }
          } catch (e) {
            // Abaikan mesej ralat rujukan luar
          }
        };

        window.addEventListener("message", handleVideoEndMessage);
        return () => window.removeEventListener("message", handleVideoEndMessage);
      }, [studentNickname]);

      // URL Video yang dikunci ketat (In-App Only: menyekat pautan luar & logo keluar)
      const securedVideoUrl = `${videoUrl}${videoUrl.includes('?') ? '&' : '?'}enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}&controls=1&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1`;

      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-xs text-slate-700 flex items-center gap-1.5">
                🍿 Cabaran 1: Pengendali Pawagam Minda!
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">Klik pada video untuk mula menonton dalam mod skrin besar pintar!</p>
            </div>
          </div>

          {/* PORTAL IFRAME BIASA (PANDANGAN KECIL) */}
          <div 
            onClick={() => setIsImmersive(true)} // 🌟 CLICK TO FULLSCREEN: Aktifkan mod penuh
            className="group relative w-full rounded-2xl overflow-hidden aspect-video bg-slate-950 border-2 border-purple-100 shadow-md cursor-zoom-in hover:border-purple-400 transition-all duration-300"
          >
            <iframe 
              key={`mini-${videoKey}`}
              className="absolute top-0 left-0 w-full h-full pointer-events-none select-none" // Disekat daripada klik biasa untuk paksa mod skrin besar
              src={securedVideoUrl}
              title="Mini Player"
              referrerPolicy="strict-origin-when-cross-origin"
            ></iframe>
            
            {/* Hover Overlay Effect */}
            <div className="absolute inset-0 bg-purple-950/20 group-hover:bg-purple-950/40 flex flex-col items-center justify-center opacity-100 transition-all duration-300">
              <div className="bg-white/95 text-purple-700 font-black text-[11px] px-3 py-2 rounded-full shadow-md flex items-center gap-1.5 transform group-hover:scale-110 transition-transform">
                <Youtube className="w-4 h-4 fill-red-500 text-red-500 animate-pulse" />
                KETUK UNTUK SKRIN PENUH 🚀
              </div>
            </div>
          </div>

          {/* 🌟 IMMERSIVE FULL SCREEN OVERLAY MODAL (KUNCI DALAM APPS SAJA) */}
          <AnimatePresence>
            {isImmersive && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-950 z-[9999] flex flex-col items-center justify-center p-2 sm:p-6"
              >
                {/* Pengepala Kawalan Atas Skrin Penuh */}
                <div className="w-full max-w-4xl flex items-center justify-between p-3 text-white">
                  <span className="text-xs font-black tracking-wide text-purple-300 animate-pulse bg-purple-950/50 px-3 py-1 rounded-full border border-purple-800">
                    📺 MOD KEMBARA MINDA SELESA: JANGAN KELUAR YA!
                  </span>
                  <Button 
                    onClick={() => setIsImmersive(false)}
                    className="bg-white/10 hover:bg-white/20 text-white rounded-full font-bold text-xs h-8 px-4 border border-white/20"
                  >
                    Tutup Skrin ✕
                  </Button>
                </div>

                {/* Bekas Video Gergasi (Maksimum Paparan Telefon/Tablet) */}
                <div className="w-full max-w-4xl aspect-video rounded-2xl overflow-hidden shadow-2xl border-2 border-white/10 bg-black relative">
                  <iframe 
                    key={`full-${videoKey}`}
                    id="yt-player-immersive"
                    className="absolute top-0 left-0 w-full h-full" 
                    src={securedVideoUrl} 
                    title="Immersive Video Player" 
                    referrerPolicy="strict-origin-when-cross-origin"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>

                <p className="text-[10px] text-slate-400 mt-4 text-center font-medium">
                  *Video dimainkan dengan selamat di dalam aplikasi. Sebaik sahaja tamat, skrin akan ditutup sendiri secara automatik!
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    })()}
  </motion.div>
)}

              {/* CABARAN 2: READ NOTES */}
              {currentPhase === 2 && (
                <motion.div key="m2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                  <div className="bg-white rounded-3xl p-5 border shadow-sm space-y-3">
                    <h2 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                      🔍 Cabaran 2: Imbas Semula Nota Kebijaksanaan
                    </h2>
                    <p className="text-[11px] text-slate-500 font-medium">Baca perkataan penting dengan teliti. Ini adalah kunci rahsia kemenangan game anda!</p>
                    <div className="prose prose-sm text-slate-700 text-xs leading-relaxed border-t pt-2">
                      <LessonContent content={explanation} />
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl p-4 border shadow-sm space-y-2">
                    <h3 className="font-bold text-xs text-slate-800 flex items-center gap-1">
                      <GitFork className="w-3.5 h-3.5 text-blue-500"/> Infografik Struktur Visual Minda
                    </h3>
                    <div className="p-2 bg-blue-50/20 rounded-xl border">
                      {mindMap ? <MindMap mindMap={{ central_topic: topic?.name || "Topik", branches: mindMap }} /> : <p className="text-xs text-center text-slate-400 py-3">Menyediakan grafik...</p>}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* CABARAN 3: INTERACTIVE MATCHING GAME (10 LEVELS) */}
              {currentPhase === 3 && (
                <motion.div key="m3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-xl border border-purple-200 text-center space-y-1">
                    <h3 className="font-black text-purple-950 text-xs">⚡ Cabaran 3: Arena Pahlawan Padanan (10 Level)</h3>
                    <p className="text-[10px] text-purple-800 font-medium">
                      Hebat! Selesaikan kesemua 10 peringkat padanan objek terus daripada nota anda untuk membuka laluan gerbang Boss Besar!
                    </p>
                  </div>
                  <Year1InteractiveGame 
                    explanation={explanation}
                    keywords={metaData.keywords}
                    topicName={topic?.name || "Topik"}
                    studentNickname={studentNickname}
                    onComplete={() => console.log("Misi 3 selesai!")}
                  />
                </motion.div>
              )}

              {/* CABARAN 4: BOSS BESAR KUIZ JUARA */}
              {currentPhase === 4 && (
                <motion.div key="m4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                  <div className="bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 rounded-[2rem] p-6 border-4 border-orange-200 shadow-lg text-center space-y-4">
                    <Trophy className="w-12 h-12 text-amber-500 mx-auto animate-bounce" />
                    <h3 className="font-black text-base text-red-950 uppercase tracking-wide">🏆 Cabaran Akhir: Lawan Boss Besar Kuiz Juara!</h3>
                    <p className="text-xs text-orange-800 max-w-xs mx-auto font-medium">
                      Masa untuk serangan terakhir, {studentNickname}! Jawab soalan gempak ini dengan tepat, buktikan kehebatan anda dan tewaskan Boss Besar!
                    </p>
                    <Button onClick={runQuizGeneration} disabled={status.quiz} className="bg-gradient-to-r from-orange-500 to-red-600 text-white font-black shadow-md rounded-xl text-xs w-full h-12 tracking-wider">
                      {status.quiz ? "Menyediakan Medan Pertempuran..." : "SERANG BOSS BESAR ⚔️"}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* FLOATING ACTION CONTROL MISSION BUTTONS */}
          <div className="fixed bottom-4 left-0 right-0 px-4 flex justify-between gap-4 max-w-md mx-auto z-40">
            <Button onClick={handlePrevPhase} disabled={currentPhase === 1} variant="outline" className="h-11 px-5 rounded-full font-bold bg-white text-xs border-slate-200 shadow-sm">
              ⬅️ Patah Balik
            </Button>
            {currentPhase < 4 ? (
              <Button onClick={handleNextPhase} className="h-11 px-6 rounded-full font-black bg-gradient-to-r from-purple-600 to-cyan-600 text-white text-xs shadow-md">
                Misi Seterusnya ➡️
              </Button>
            ) : (
              <span className="text-[10px] font-black text-orange-700 bg-orange-100 border border-orange-200 px-4 py-2 rounded-full animate-bounce">
                PERLAWANAN KEMUNCAK! 🔥
              </span>
            )}
          </div>

        </div>
      )}
    </div>
  );
}