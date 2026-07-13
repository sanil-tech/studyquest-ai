import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { 
  ArrowLeft, Compass, Tv, CheckCircle2, Leaf, ChevronLeft, Loader2,
  Sparkles, Send, MessageSquare, Bot, Music, RefreshCcw, Smile, HelpCircle,
  BookOpen, Layers, Award, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

const safeBase44 = base44 || {
  entities: {
    Subject: { 
      get: async (id) => ({ id, name: id === "sains" ? "Sains" : id === "matematik" ? "Matematik" : "Sejarah" }) 
    },
    Topic: { 
      get: async (id) => ({ id, name: "Misi Ekosistem Hutan Hujan Borneo" }) 
    },
    Quiz: { 
      filter: async () => [
        {
          id: "misi-kuiz-1",
          topic_name: "Misi Ekosistem Hutan Hujan Borneo",
          video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          notes_content: "# Kitaran Hidup Hutan Hujan\n\nHutan hujan tropika Borneo mempunyai **4 lapisan utama** yang unik:\n\n## 1. Lapisan Renjong (Emergent Layer)\nLapisan paling tinggi di mana pokok-pokok gergasi seperti *pokok tualang* tumbuh melepasi kanopi utama.\n\n## 2. Lapisan Kanopi (Canopy Layer)\nBagaikan bumbung hijau yang padat. Tempat tinggal utama untuk **Oki si Orangutan 🦧** dan burung kenyalang.\n\n## 3. Lapisan Bawah (Understory Layer)\nSuasana di sini agak gelap dan lembap. Banyak tumbuhan menjalar dan paku-pakis tinggal di sini.\n\n## 4. Lantai Hutan (Forest Floor)\nTempat penguraian bahan organik. Di sinilah **bunga rafflesia** yang gergasi berkembang indah!\n\n> *Tips Kembara:* Ingat 4 dahan ilmu ini untuk mengalahkan Boss Kuiz nanti! 🏆",
          questions_json: JSON.stringify([
            { question: "Apakah lapisan tertinggi di dalam hutan hujan Borneo?", correct_answer: "Lapisan Renjong (Emergent)", explanation: "Lapisan Renjong mengandungi pokok-pokok gergasi yang tumbuh melebihi 60 meter!" },
            { question: "Siapakah maskot bagi kembara sains hutan hujan?", correct_answer: "Oki si Orangutan", explanation: "Oki ialah pakar hutan hujan yang ceria dan bijak membantu kembara kita." },
            { question: "Di manakah bunga Rafflesia yang gergasi biasanya dijumpai?", correct_answer: "Lantai Hutan", explanation: "Lantai hutan adalah zon bawah di mana kulat dan rafflesia membesar." }
          ])
        }
      ] 
    },
    StudySession: {
      filter: async () => [],
      create: async (data) => ({ id: "mock-session-id", ...data }),
      update: async (id, data) => ({ id, ...data })
    }
  },
  auth: { 
    me: async () => ({ id: "wira-kamil", name: "Wira Kamil" }) 
  },
  integrations: {
    Core: {
      InvokeLLM: async ({ prompt }) => {
        // Fallback untuk menjana peta minda sekiranya Gemini API disekat atau lambat
        return [
          { label: "Lapisan Renjong (Emergent)", children: ["Pokok Tualang Gergasi", "Burung Helang", "Ketinggian > 60m"] },
          { label: "Lapisan Kanopi (Canopy)", children: ["Orangutan Oki 🦧", "Bumbung Hijau Padat", "Burung Kenyalang"] },
          { label: "Lapisan Bawah (Understory)", children: ["Kawasan Teduh & Gelap", "Paku-Pakis", "Harimau Dahan"] },
          { label: "Lantai Hutan (Forest Floor)", children: ["Bunga Rafflesia Gergasi", "Serangga & Kulat", "Bahan Organik Reput"] }
        ];
      }
    }
  }
};

function LessonProgress({ steps, onStepClick }) {
  const progressSteps = [
    { key: "video", label: "Taklimat Misi", desc: "Tonton Video", icon: "🎬", color: "from-amber-400 to-orange-500" },
    { key: "lesson", label: "Nota Pintar", desc: "Slaid Ilmu", icon: "📖", color: "from-emerald-400 to-teal-500" },
    { key: "flashcard", label: "Kad Kilat", desc: "Uji Memori", icon: "⚡", color: "from-sky-400 to-indigo-500" },
    { key: "mindmap", label: "Peta Minda", desc: "Hub Pokok", icon: "🗺️", color: "from-purple-400 to-pink-500" },
    { key: "quiz", label: "Boss Padu", desc: "Kuiz Cabaran", icon: "⚔️", color: "from-red-400 to-rose-600" }
  ];

  return (
    <div className="bg-white rounded-3xl p-6 border-4 border-[#1B4D3E] shadow-[8px_8px_0px_#1B4D3E] mb-6">
      <h3 className="font-fredoka text-lg font-bold text-[#1B4D3E] mb-4 text-center sm:text-left flex items-center gap-2">
        🧭 Laluan Dahan Kembara Anda
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 relative">
        {progressSteps.map((step, idx) => {
          const isCompleted = steps[step.key];
          return (
            <motion.button
              key={step.key}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onStepClick(step.key)}
              className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center text-center transition-all duration-200 relative ${
                isCompleted 
                  ? "bg-stone-50 border-[#1B4D3E] shadow-[4px_4px_0px_#1B4D3E]" 
                  : "bg-stone-100/50 border-stone-200 opacity-65"
              }`}
            >
              {isCompleted && (
                <div className="absolute -top-2 -right-2 bg-emerald-500 text-white rounded-full p-1 border-2 border-white shadow-sm">
                  <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-100 text-emerald-600" />
                </div>
              )}
              <div className="text-3xl mb-1.5">{step.icon}</div>
              <span className="font-fredoka text-xs font-bold text-[#1B4D3E]">{step.label}</span>
              <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">{step.desc}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function Flashcards({ flashcards, lang }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (!flashcards || flashcards.length === 0) {
    return (
      <div className="p-8 text-center bg-stone-50 rounded-2xl border-2 border-stone-200">
        <p className="text-stone-500 font-bold text-sm">💡 Bersiap sedia! Kad kilat sedang disusun untuk kembara anda...</p>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <span className="font-fredoka text-sm font-bold text-orange-600">
          Kad {currentIndex + 1} daripada {flashcards.length}
        </span>
      </div>

      <div className="perspective-1000 h-64 w-full max-w-md mx-auto cursor-pointer" onClick={() => setFlipped(!flipped)}>
        <motion.div
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          style={{ transformStyle: "preserve-3d" }}
          className="relative w-full h-full"
        >
          {/* Front Side */}
          <div 
            style={{ backfaceVisibility: "hidden" }}
            className="absolute inset-0 bg-white border-4 border-[#1B4D3E] rounded-[2rem] p-6 flex flex-col justify-between shadow-[6px_6px_0px_#1B4D3E] items-center text-center"
          >
            <div className="bg-amber-100 text-amber-800 font-fredoka px-4 py-1 rounded-full text-xs font-bold border border-amber-200">
              SOALAN 🌟
            </div>
            <p className="font-fredoka text-lg font-bold text-[#1B4D3E] my-auto">
              {currentCard.front}
            </p>
            <span className="text-[10px] font-bold text-stone-400 uppercase">Tekan untuk pusing ➔</span>
          </div>

          {/* Back Side */}
          <div 
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
            className="absolute inset-0 bg-emerald-50 border-4 border-emerald-600 rounded-[2rem] p-6 flex flex-col justify-between shadow-[6px_6px_0px_#047857] items-center text-center"
          >
            <div className="bg-emerald-100 text-emerald-800 font-fredoka px-4 py-1 rounded-full text-xs font-bold border border-emerald-200">
              JAWAPAN JITU ✔️
            </div>
            <p className="font-fredoka text-md font-bold text-emerald-950 my-auto whitespace-pre-line">
              {currentCard.back}
            </p>
            <span className="text-[10px] font-bold text-emerald-600 uppercase">Tekan untuk kembali ➔</span>
          </div>
        </motion.div>
      </div>

      <div className="flex justify-between max-w-xs mx-auto gap-4 pt-2">
        <Button
          disabled={currentIndex === 0}
          onClick={() => { setFlipped(false); setCurrentIndex(p => p - 1); }}
          className="flex-1 bg-white hover:bg-stone-50 text-stone-700 font-bold rounded-xl border-2 border-stone-200 shadow-sm"
        >
          Sebelum
        </Button>
        <Button
          disabled={currentIndex === flashcards.length - 1}
          onClick={() => { setFlipped(false); setCurrentIndex(p => p + 1); }}
          className="flex-1 bg-[#FF7F32] hover:bg-orange-600 text-white font-bold rounded-xl shadow-md border-0"
        >
          Seterusnya
        </Button>
      </div>
    </div>
  );
}

function MindMap({ mindMap, lang }) {
  if (!mindMap || !mindMap.branches) return null;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="text-center mb-6">
        <div className="inline-block bg-[#1B4D3E] text-white font-fredoka px-6 py-2.5 rounded-2xl border-2 border-white shadow-md text-lg">
          🌳 {mindMap.central_topic}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mindMap.branches.map((branch, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white border-2 border-stone-200 rounded-2xl p-4 shadow-sm hover:border-[#1B4D3E] transition-colors"
          >
            <h4 className="font-fredoka text-sm font-bold text-emerald-700 border-b border-stone-100 pb-2 mb-2 flex items-center gap-2">
              🌿 {branch.label}
            </h4>
            <ul className="space-y-1">
              {branch.children && branch.children.map((child, cIdx) => (
                <li key={cIdx} className="text-xs font-bold text-stone-600 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-orange-400 rounded-full"></span>
                  {child}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function YouTubeLesson({ videoUrl, onCompleted, isCompleted }) {
  const getYouTubeId = (url) => {
    if (!url) return null;
    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = url.match(regExp);
    return (match && match[1].length === 11) ? match[1] : null;
  };
  const videoId = getYouTubeId(videoUrl);

  if (!videoId) {
    return (
      <div className="p-8 text-center bg-amber-50/60 border border-dashed border-amber-200 rounded-2xl">
        <p className="text-amber-800 font-bold text-xs sm:text-sm">🎬 Pautan video YouTube belum dimasukkan oleh Pentadbir untuk modul ini.</p>
        <Button onClick={onCompleted} className="bg-[#FF7F32] hover:bg-orange-600 text-white font-black rounded-xl px-5 py-2.5 text-xs mt-3 border-0 shadow-sm">Teruskan Misi 🚀</Button>
      </div>
    );
  }

  const currentOrigin = window.location.origin;
  const secureEmbedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1&enablejsapi=1&origin=${encodeURIComponent(currentOrigin)}`;

  return (
    <div className="space-y-4 w-full" key={videoId}>
      <div className="relative aspect-video w-full rounded-2xl sm:rounded-[1.5rem] overflow-hidden border-2 border-stone-800 bg-stone-950 shadow-md">
        <iframe key={videoId} src={secureEmbedUrl} className="w-full h-full border-0 absolute inset-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
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
        <div className="bg-stone-900 border border-stone-800 p-3.5 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
          <p className="text-[11px] text-stone-300 font-medium flex items-center gap-1.5"><Tv className="w-4 h-4 text-emerald-400 animate-pulse shrink-0" /> Selesai menonton video pengajaran? Klik butang di sebelah untuk menuntut ganjaran!</p>
          <Button onClick={onCompleted} size="sm" className="w-full sm:w-auto bg-[#FF7F32] hover:bg-orange-600 text-white font-black text-xs rounded-xl px-5 h-9 shrink-0 border-0 shadow-xs active:scale-95 transition-all">Selesai & Ambil +10 XP 🍃</Button>
        </div>
      )}
    </div>
  );
}

const safeJsonParse = (str, fallback = []) => {
  if (!str) return fallback; if (typeof str === "object") return str; 
  try { return JSON.parse(String(str).replace(/^```json/i, "").replace(/^```/i, "").replace(/```$/i, "").trim()); } catch (e) { return fallback; }
};

const shuffleArray = (array) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [newArr[i], newArr[j]] = [newArr[j], newArr[i]]; }
  return newArr;
};

const fetchWithBackoff = async (url, options, retries = 3, delay = 1000) => {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      if (response.status === 429 && retries > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWithBackoff(url, options, retries - 1, delay * 2);
      }
      throw new Error(`Ralat API: ${response.status}`);
    }
    return response;
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithBackoff(url, options, retries - 1, delay * 2);
    }
    throw error;
  }
};

const callGeminiAPI = async (systemInstruction, userPrompt) => {
  // Sila isi dengan kunci Gemini API anda jika ingin menggunakan akses API langsung pihak ketiga
  const apiKey = ""; 
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{ parts: [{ text: userPrompt }] }],
    systemInstruction: {
      parts: [{ text: systemInstruction }]
    }
  };

  const response = await fetchWithBackoff(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const result = await response.json();
  return result?.candidates?.[0]?.content?.parts?.[0]?.text || "Maaf wira, isyarat kembara AI terganggu seketika! Sila cuba sebentar lagi.";
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
  
  const [actualQuizId, setActualQuizId] = useState("");
  const [rawBankQuestions, setRawBankQuestions] = useState([]);

  const [videoUrl, setVideoUrl] = useState("");
  const [notesContent, setNotesContent] = useState("");
  const [notesImage, setNotesImage] = useState(""); 
  const [infographicUrl, setInfographicUrl] = useState("");

  const [activeTab, setActiveTab] = useState("map"); 
  const [progressState, setProgressState] = useState({ video_completed: false, lesson_completed: false, flashcard_completed: false, mindmap_completed: false, quiz_completed: false, current_stage: "video", xp_earned: 0 });
  const [status, setStatus] = useState({ lesson: false, flashcards: false, mindmap: false, quiz: false });
  const studyStartRef = useRef(null);
  const sessionRef = useRef(null);

  const [mascotChatOpen, setMascotChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  
  const [mnemonicPoem, setMnemonicPoem] = useState("");
  const [poemLoading, setPoemLoading] = useState(false);

  useEffect(() => { sessionRef.current = sessionId; }, [sessionId]);
  const isTopicUnlocked = progressState.quiz_completed || (progressState.video_completed && progressState.lesson_completed && progressState.flashcard_completed && progressState.mindmap_completed);

  useEffect(() => {
    if (activeTab !== "map") {
      const el = document.documentElement;
      if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
      else if (el.msRequestFullscreen) el.msRequestFullscreen();
    } else {
      if (document.fullscreenElement) {
        if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
      }
    }
  }, [activeTab]);

  const bersihkanTeksPadanan = (str) => { return str ? str.toLowerCase().replace(/dan/g, "").replace(/&/g, "").replace(/misi\s*\d+/g, "").replace(/[^a-z0-9]/g, "").trim() : ""; };

  const getMascotDetails = useCallback(() => {
    const subName = subject?.name?.toLowerCase() || "";
    if (subName.includes("sains")) {
      return { name: "Oki si Orangutan 🦧", animal: "Orangutan", power: "Pakar Flora & Fauna Borneo", quote: "Mari selamatkan Rimba Danum kita!" };
    } else if (subName.includes("matematik")) {
      return { name: "Rafi si Kenyalang 🦅", animal: "Burung Kenyalang", power: "Raja Logik & Nombor Kinabalu", quote: "Kira cepat dengan sayap pintar!" };
    } else if (subName.includes("sejarah")) {
      return { name: "Baj si Penyu 🐢", animal: "Penyu Hijau", power: "Arkib Khazanah Bajau Laut", quote: "Sejarah adalah peta masa hadapan kita." };
    }
    return { name: "Oki si Orangutan 🦧", animal: "Orangutan", power: "Pakar Kembara Borneo", quote: "Sedia belajar bersama-sama?" };
  }, [subject]);

  useEffect(() => {
    let isMounted = true;
    const initializeLesson = async () => {
      try {
        const client = base44 ? base44 : safeBase44;
        const [sub, top, user] = await Promise.all([
          client.entities.Subject.get(subjectId), 
          client.entities.Topic.get(topicId), 
          client.auth.me()
        ]);
        if (!isMounted) return;
        setSubject(sub); setTopic(top);

        try {
          const allQuizBanks = await client.entities.Quiz.filter({});
          let foundBank = null;
          if (allQuizBanks && allQuizBanks.length > 0) {
            foundBank = allQuizBanks.find(b => b.id === topicId);
            if (!foundBank) {
              const targetClean = bersihkanTeksPadanan(top.name);
              foundBank = allQuizBanks.find(b => {
                const adminClean = bersihkanTeksPadanan(b.topic_name);
                return b.id === topicId || adminClean === targetClean || targetClean.includes(adminClean) || adminClean.includes(targetClean);
              });
            }
          }

          if (foundBank && isMounted) {
            setActualQuizId(foundBank.id);
            setVideoUrl(foundBank.video_url || "");
            setInfographicUrl(foundBank.infographic_url || "");
            
            const rawNotes = foundBank.notes_content;
            if (rawNotes) {
              try {
                let cleanStr = String(rawNotes).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
                if (cleanStr.startsWith('"') && cleanStr.endsWith('"')) { cleanStr = cleanStr.substring(1, cleanStr.length - 1); }
                const parsedNotes = typeof rawNotes === "object" ? rawNotes : JSON.parse(cleanStr);
                
                if (parsedNotes && (parsedNotes.text !== undefined || parsedNotes.image !== undefined)) {
                  setNotesContent(parsedNotes.text || "");
                  setNotesImage(parsedNotes.image || "");
                } else {
                  setNotesContent(String(rawNotes)); setNotesImage("");
                }
              } catch (e) { setNotesContent(String(rawNotes)); setNotesImage(""); }
            }
            
            const parsedQuestions = safeJsonParse(foundBank.questions_json, []);
            setRawBankQuestions(parsedQuestions);
          }
        } catch (quizBankErr) {}

        try {
          let cachedSessions = await client.entities.StudySession.filter({ student_id: user.id, topic_id: topicId }, "-created_date", 1);
          let sessionWithNotes = cachedSessions[0] || null;
          if (isMounted && sessionWithNotes) {
            setProgressState({ video_completed: sessionWithNotes.video_completed || false, lesson_completed: sessionWithNotes.lesson_completed || false, flashcard_completed: sessionWithNotes.flashcard_completed || false, mindmap_completed: sessionWithNotes.mindmap_completed || false, quiz_completed: sessionWithNotes.quiz_completed || false, current_stage: sessionWithNotes.current_stage || "video", xp_earned: sessionWithNotes.xp_earned || 0 });
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
    try { 
      const client = base44 ? base44 : safeBase44;
      await client.entities.StudySession.update(sId, { duration_minutes: mins }); 
    } catch (err) {} 
  };
  useEffect(() => { return () => { recordStudyTime(); }; }, []);
  const getLanguageMode = useCallback(() => subject?.name?.toLowerCase()?.includes("english") ? "en" : "ms", [subject]);
  const triggerConfetti = () => confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });

  const updateStageProgress = useCallback(async (stageId, nextStage, xpAwarded) => {
    let currentSessionId = sessionRef.current;
    setProgressState(prev => {
      const sudahSelesai = prev[`${stageId}_completed`];
      const updatedState = { ...prev, [`${stageId}_completed`]: true, current_stage: prev[`${nextStage}_completed`] ? prev.current_stage : nextStage, xp_earned: prev.xp_earned + (sudahSelesai ? 0 : xpAwarded) };
      if (currentSessionId) {
        const client = base44 ? base44 : safeBase44;
        setTimeout(() => { client.entities.StudySession.update(currentSessionId, updatedState).catch(()=>{}); }, 0);
      }
      return updatedState;
    });
    triggerConfetti();
  }, []);

  const handleVideoStageCompleted = useCallback(async () => {
    if (progressState.video_completed) { setActiveTab("map"); return; }
    let currentId = sessionRef.current;
    const client = base44 ? base44 : safeBase44;
    if (!currentId) {
      try {
        const user = await client.auth.me();
        const newSession = await client.entities.StudySession.create({ student_id: user.id, subject_id: subjectId, topic_id: topicId, topic_name: topic.name, subject_name: subject.name, duration_minutes: 0, ...progressState, video_completed: true, current_stage: "lesson", xp_earned: 10 });
        const validId = Array.isArray(newSession) ? newSession[0]?.id : newSession?.id; setSessionId(validId); sessionRef.current = validId;
        setProgressState(p => ({ ...p, video_completed: true, current_stage: "lesson", xp_earned: 10 })); triggerConfetti(); setActiveTab("map"); return;
      } catch (err) { return; }
    }
    await updateStageProgress("video", "lesson", 10); setActiveTab("map");
  }, [progressState, subjectId, topicId, topic, subject, updateStageProgress]);

  const handleLessonStageCompleted = async () => {
    setStatus(p => ({ ...p, lesson: true }));
    try {
      let currentSessionId = sessionRef.current;
      const client = base44 ? base44 : safeBase44;
      const nextStatePayload = { ...progressState, lesson_completed: true, current_stage: progressState.flashcard_completed ? progressState.current_stage : "flashcard", xp_earned: progressState.xp_earned + (progressState.lesson_completed ? 0 : 15) };
      if (!currentSessionId) {
        const user = await client.auth.me();
        const newSession = await client.entities.StudySession.create({ student_id: user.id, subject_id: subjectId, topic_id: topicId, topic_name: topic.name, subject_name: subject.name, duration_minutes: 0, ...nextStatePayload });
        const validId = Array.isArray(newSession) ? newSession[0]?.id : newSession?.id; setSessionId(validId); sessionRef.current = validId;
      } else { await client.entities.StudySession.update(currentSessionId, nextStatePayload); }
      setProgressState(prev => ({ ...prev, ...nextStatePayload })); triggerConfetti(); setActiveTab("map");
    } catch (e) {} finally { setStatus(p => ({ ...p, lesson: false })); }
  };

  const loadFlashcardsOnDemand = async () => { 
    setActiveTab("flashcard"); 
    if (flashcards && flashcards.length > 0) return; 
    setStatus(p => ({ ...p, flashcards: true })); 
    try { 
      if (rawBankQuestions && rawBankQuestions.length > 0) { 
        setFlashcards(shuffleArray(rawBankQuestions).slice(0, 5).map(q => ({ front: q.question, back: `${q.correct_answer || q.correctAnswer}\n\n${q.explanation || ""}` }))); 
        return; 
      } 
    } catch (err) {} finally { setStatus(p => ({ ...p, flashcards: false })); } 
  };

  const loadMindMapOnDemand = async () => { 
    setActiveTab("mindmap"); 
    if (mindMap && mindMap.length > 0) return; 
    setStatus(p => ({ ...p, mindmap: true })); 
    try { 
      const client = base44 ? base44 : safeBase44;
      const res = await client.integrations.Core.InvokeLLM({ 
        model: "gemini_3_flash", 
        prompt: `Generate mindmap branches array for summary: ${topic.name}`, 
        response_json_schema: {type: "array", items: {type: "object", properties: { label: { type: "string" }, children: { type: "array", items: { type: "string" } } }, required: ["label", "children"]}} 
      }); 
      setMindMap(res); 
    } catch (e) {} finally { setStatus(p => ({ ...p, mindmap: false })); } 
  };

  const handleSendMascotMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = chatInput;
    setChatInput("");
    setChatHistory(prev => [...prev, { role: "user", text: userMsg }]);
    setChatLoading(true);

    const mascot = getMascotDetails();
    const systemPrompt = `Kamu bertindak sebagai maskot pendidikan ${mascot.name}, seekor ${mascot.animal} dari Borneo yang ceria, pintar, dan bersemangat. Kamu bercakap dengan murid sekolah rendah Malaysia (berumur 7-12 tahun) mengenai topik pengajian "${topic?.name || "Pembelajaran Borneo"}".
    Garis panduan tindak balas kamu:
    1. Sentiasa gunakan gaya bahasa yang mesra kanak-kanak, bersemangat, dan ringkas (maksimum 3 ayat).
    2. Selipkan catchphrase tempatan secara bersahaja seperti "Bah!", "Mantap wira!", "Hebat betul kamu!", "Cayalah!".
    3. Jelaskan sebarang konsep akademik dengan contoh kehidupan harian yang mudah atau cerita pendek.
    4. Elakkan daripada kelihatan terlalu formal atau serius. Jadilah sahabat belajar terbaik mereka!`;

    try {
      // Menggunakan integrasi InvokeLLM standard jika tersedia, atau lompat ke fallback API langsung
      const client = base44 ? base44 : safeBase44;
      let responseText = "";
      try {
        responseText = await client.integrations.Core.InvokeLLM({
          model: "gemini_3_flash",
          prompt: `[SYSTEM_INSTRUCTION]: ${systemPrompt}\n[USER]: ${userMsg}`
        });
      } catch (e) {
        responseText = await callGeminiAPI(systemPrompt, userMsg);
      }
      setChatHistory(prev => [...prev, { role: "mascot", text: responseText }]);
    } catch (e) {
      setChatHistory(prev => [...prev, { role: "mascot", text: "Aduh, isyarat kembara tersangkut di sebalik rimbun hutan! Sila tanya saya lagi sekali ya, wira! 🦧" }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleGenerateMnemonicPoem = async () => {
    if (poemLoading) return;
    setPoemLoading(true);
    setMnemonicPoem("");

    const systemPrompt = `Kamu adalah seorang guru pakar pantun warisan dan pendidik kreatif di Malaysia. Tugas kamu adalah untuk menukar inti pati utama topik akademik "${topic?.name || "Subjek Sila Teroka"}" menjadi sebuah PANTUN MEMORI 4 kerat (empat baris) dalam Bahasa Melayu standard yang ceria, berirama (skema rima a-b-a-b) dan sangat mudah dihafal oleh murid sekolah rendah.
    Sila bekalkan pantun tersebut dengan format yang cantik beserta ulasan pembakar semangat ringkas daripada maskot kembara di penghujung pantun.`;

    const userPrompt = `Berdasarkan nota pembelajaran ini: "${notesContent || "Sila bimbing murid tentang topik " + topic?.name}". Sila bina satu pantun memori 4 kerat yang menyeronokkan dan senang diingati!`;

    try {
      const client = base44 ? base44 : safeBase44;
      let resPoem = "";
      try {
        resPoem = await client.integrations.Core.InvokeLLM({
          model: "gemini_3_flash",
          prompt: `[SYSTEM_INSTRUCTION]: ${systemPrompt}\n[USER]: ${userPrompt}`
        });
      } catch (e) {
        resPoem = await callGeminiAPI(systemPrompt, userPrompt);
      }
      setMnemonicPoem(resPoem);
      triggerConfetti();
    } catch (err) {
      setMnemonicPoem("Gagal menjana pantun memori. Mari kita ulang baca nota kembara kita! 🌿");
    } finally {
      setPoemLoading(false);
    }
  };

  const runQuizGeneration = async (numQ) => { 
    await recordStudyTime(); 
    setStatus(p => ({ ...p, quiz: true })); 
    let currentSessionId = sessionRef.current; 

    try { 
      if (!rawBankQuestions || rawBankQuestions.length === 0 || !actualQuizId) {
        alert("⚠️ Misi Digantung: Cikgu belum merekodkan sebarang soalan kuiz untuk topik ini.");
        setStatus(p => ({ ...p, quiz: false })); 
        return;
      }

      if (currentSessionId) {
        const client = base44 ? base44 : safeBase44;
        await client.entities.StudySession.update(currentSessionId, { quiz_completed: true, current_stage: "quiz" }).catch(()=>{});
      }

      navigate(`/quiz/${actualQuizId}?limit=${numQ}`);

    } catch (e) { 
      navigate(`/quiz/${actualQuizId || topicId}?limit=${numQ}`);
    } finally { 
      setStatus(p => ({ ...p, quiz: false })); 
    } 
  };

  const parseMarkdownToHTML = (text) => {
    if (!text) return ""; const lines = text.split("\n"); let inList = false; let htmlOutput = [];
    lines.forEach((line) => {
      let trimmed = line.trim();
      if (!trimmed.startsWith("* ") && !trimmed.startsWith("- ") && inList) { htmlOutput.push("</ul>"); inList = false; }
      if (trimmed === "---") { htmlOutput.push('<hr class="my-4 border-stone-200" />'); return; }
      if (trimmed.startsWith("# ")) { htmlOutput.push(`<h1 class="text-base sm:text-lg font-black text-stone-800 border-b border-stone-200 pb-1.5 mt-4 mb-2 text-center text-purple-700">${trimmed.replace("# ", "")}</h1>`); return; }
      if (trimmed.startsWith("## ")) { htmlOutput.push(`<h2 class="text-sm sm:text-base font-black text-stone-800 mt-4 mb-2">${trimmed.replace("## ", "")}</h2>`); return; }
      if (trimmed.startsWith("### ")) { htmlOutput.push(`<h3 class="text-xs sm:text-sm font-bold text-emerald-600 mt-3 mb-1 flex items-center gap-1">${trimmed.replace("### ", "")}</h3>`); return; }
      if (trimmed.startsWith(">")) { let content = trimmed.substring(1).trim(); htmlOutput.push(`<blockquote class="border-l-4 border-amber-400 pl-3.5 italic text-stone-600 my-3 bg-amber-50/50 p-2.5 rounded-r-2xl leading-relaxed text-xs sm:text-sm">${content}</blockquote>`); return; }
      if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) { if (!inList) { htmlOutput.push('<ul class="space-y-1.5 my-2.5 pl-1.5">'); inList = true; } let content = trimmed.substring(2); htmlOutput.push(`<li class="list-disc ml-4 text-xs sm:text-sm text-stone-600 leading-relaxed font-medium">${content}</li>`); return; }
      if (trimmed === "") return;
      htmlOutput.push(`<p class="text-xs sm:text-sm text-stone-600 font-medium leading-relaxed mb-3">${trimmed}</p>`);
    });
    if (inList) htmlOutput.push("</ul>");
    let finalHtml = htmlOutput.join("\n");
    finalHtml = finalHtml.replace(/\*\*(.*?)\*\*/g, '<strong class="font-black text-stone-900 bg-yellow-100/60 px-1 rounded-sm">$1</strong>');
    finalHtml = finalHtml.replace(/\*(.*?)\*/g, '<em class="italic text-stone-700 font-semibold">$1</em>');
    return finalHtml;
  };

  if (loading) return (<div className="flex flex-col items-center justify-center min-h-[50vh] bg-[#FAFAF7]"><Loader2 className="w-10 h-10 text-emerald-500 animate-spin" /></div>);
  const videoSumberUtama = videoUrl || topic?.video_url;
  const currentMascot = getMascotDetails();

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto space-y-5 pb-24 font-sans bg-[#FAFAF7] min-h-screen relative">
      
      {/* GLOBAL HEADER BAR */}
      {activeTab === "map" ? (
        <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-xs flex items-center justify-between transition-all duration-300">
          <div className="flex items-center gap-3"><Link to={`/study/${subjectId}`} className="p-2 bg-[#F3EFE6] rounded-xl text-stone-600 hover:bg-[#E3D9C6] transition-colors"><ArrowLeft className="w-4 h-4" /></Link><div><h2 className="text-[10px] font-black text-emerald-600 uppercase tracking-wider flex items-center gap-1"><Compass className="w-3 h-3" /> {subject?.name}</h2><h1 className="text-sm font-black text-stone-800">Misi: {topic?.name}</h1></div></div>
          <div className="bg-gradient-to-r from-lime-400 to-emerald-500 px-3 py-1.5 rounded-xl text-white font-black text-xs shadow-xs"><Leaf className="w-3.5 h-3.5 fill-lime-200 inline mr-1" /> {progressState.xp_earned} XP</div>
        </div>
      ) : (
        <div className="bg-stone-950 text-stone-300 rounded-xl p-2.5 flex items-center justify-between shadow-xs transition-all duration-300 animate-in fade-in">
          <button type="button" onClick={() => setActiveTab("map")} className="flex items-center gap-1.5 text-xs font-bold text-stone-300 hover:text-white bg-stone-900/50 px-3 py-1 rounded-lg border border-stone-800 transition-colors">🚪 Keluar Mod Misi</button><span className="text-[11px] font-black uppercase tracking-wider text-emerald-400 truncate max-w-[50%]">🖥️ Skrin Fokus Penuh</span>
        </div>
      )}

      {isTopicUnlocked && activeTab === "map" && (<div className="bg-amber-50 border border-amber-200/50 p-3 rounded-xl text-[11px] font-semibold text-amber-800">🌳 Mod Ulangkaji Bebas Aktif! Semua dahan kurikulum kini terbuka untuk anda teroka.</div>)}

      {}
      <AnimatePresence mode="wait">
        {activeTab === "map" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <LessonProgress 
              steps={isTopicUnlocked ? { video: true, lesson: true, flashcard: true, mindmap: true, quiz: true } : { video: progressState.video_completed, lesson: progressState.lesson_completed, flashcard: progressState.flashcard_completed, mindmap: progressState.mindmap_completed, quiz: progressState.quiz_completed }} 
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

        {/* STAGE 1: VIDEO */}
        {activeTab === "video" && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/60 shadow-md space-y-4">
            <YouTubeLesson videoUrl={videoSumberUtama} isCompleted={progressState.video_completed} onCompleted={handleVideoStageCompleted} />
            {progressState.video_completed && (<Button onClick={() => setActiveTab("map")} className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 font-black rounded-xl text-white text-xs border-0 shadow-xs">Kembali Meneroka Pokok Ilmu 🌳</Button>)}
          </motion.div>
        )}

        {/* STAGE 2: NOTA PINTAR & AI MEMORY GENERATOR */}
        {activeTab === "lesson" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-md space-y-4">
            <div className="max-h-[60vh] overflow-y-auto p-4 border rounded-xl bg-white shadow-inner flex flex-col items-center border-stone-200/60">
              {notesImage && (<img src={notesImage} alt="Infografik Nota" className="w-full h-auto rounded-xl border border-stone-200/80 shadow-xs mb-5 bg-white" />)}
              <div className="w-full">{notesContent ? (<div dangerouslySetInnerHTML={{ __html: parseMarkdownToHTML(notesContent) }} className="text-left w-full space-y-1" />) : ((!notesImage) && <p className="text-xs text-slate-400 text-center py-4">Nota pengajian belum disediakan.</p>)}</div>
            </div>

            {/* AI MNEMONIC POEM SECTION */}
            <div className="bg-[#FAF6EE] border-2 border-[#E7D6BD] p-4 rounded-xl space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-yellow-500 fill-yellow-400" />
                  Seni Pantun Memori AI
                </span>
                <Button 
                  onClick={handleGenerateMnemonicPoem} 
                  disabled={poemLoading || !notesContent} 
                  size="xs" 
                  className="bg-yellow-500 hover:bg-yellow-600 text-amber-950 text-[10px] font-black rounded-lg h-7 px-2"
                >
                  {poemLoading ? "Menulis..." : "Bina Pantun Ajaib ✨"}
                </Button>
              </div>

              {mnemonicPoem && (
                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-white/80 rounded-lg border border-[#ECDCC4] text-xs text-stone-700 leading-relaxed font-semibold whitespace-pre-wrap font-serif italic text-center">
                  {mnemonicPoem}
                </motion.div>
              )}
            </div>

            <Button onClick={handleLessonStageCompleted} className="w-full h-12 bg-emerald-600 text-white text-xs font-black rounded-xl border-0 shadow-xs">Selesai Membaca Nota 🍃</Button>
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
            <div className="min-h-[50vh] bg-[#FAFAF7] rounded-xl p-3 border flex flex-col items-center justify-center">
              {infographicUrl ? <img src={infographicUrl} alt="Mindmap" className="w-full h-auto rounded-xl max-h-[60vh] object-contain bg-white border shadow-2xs" /> : <MindMap mindMap={{ central_topic: topic?.name || "Utama", branches: mindMap || [] }} lang={getLanguageMode()} />}
            </div>
            <Button onClick={() => updateStageProgress("mindmap", "quiz", 15).then(() => setActiveTab("map"))} className="w-full h-12 bg-emerald-600 text-white text-xs font-black rounded-xl border-0 mt-2 shadow-xs">Selesai Teroka Peta! 🗺️</Button>
          </motion.div>
        )}

        {/* STAGE 5: KUIZ */}
        {activeTab === "quiz" && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-200 shadow-md">
            <div className="space-y-4 text-center sm:text-left">
              <h3 className="text-base font-black text-amber-950">⚔️ Misi Terakhir: Kuiz Puncak Dahan</h3>
              <p className="text-xs text-amber-800 font-medium">Sedia menduduki ujian cabaran minda untuk menawan kemuncak dahan ilmu ini? 🏆</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <Button onClick={() => runQuizGeneration(10)} disabled={status.quiz} className="bg-amber-500 hover:bg-amber-600 text-white h-14 text-xs font-black rounded-xl w-full border-0 shadow-2xs">{status.quiz ? "Mencari Soalan..." : "Cabaran Pantas (10 Soalan)"}</Button>
                <Button onClick={() => runQuizGeneration(20)} disabled={status.quiz} className="bg-orange-500 hover:bg-orange-600 text-white h-14 text-xs font-black rounded-xl w-full border-0 shadow-2xs">{status.quiz ? "Mencari Soalan..." : "Ujian Boss Padu (20 Soalan)"}</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FLOATING CHAT WIDGET: TANYA MASKOT MISI (GEMINI POWERED) */}
      <div className="fixed bottom-6 right-6 z-40">
        <AnimatePresence>
          {mascotChatOpen && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, y: 50 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.8, y: 50 }}
              className="bg-white border-4 border-emerald-600 rounded-3xl w-80 sm:w-96 shadow-[0_12px_24px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden mb-4"
            >
              {/* CHAT HEADER */}
              <div className="bg-emerald-600 text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="text-2xl p-1 bg-white/20 rounded-full">{currentMascot.name.slice(-2)}</div>
                  <div>
                    <h4 className="font-bold text-xs">{currentMascot.name}</h4>
                    <span className="text-[9px] text-emerald-200 font-semibold uppercase">{currentMascot.power}</span>
                  </div>
                </div>
                <button onClick={() => setMascotChatOpen(false)} className="text-white hover:text-emerald-200 text-xs font-bold">✕</button>
              </div>

              {/* CHAT BUBBLES */}
              <div className="p-4 h-64 overflow-y-auto space-y-3 bg-[#FAF9F5] flex flex-col">
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-3 rounded-2xl rounded-tl-none text-xs font-bold leading-relaxed self-start">
                  Bah! Hai wira kembara! Saya {currentMascot.name}. {currentMascot.quote} Ada apa-apa soalan tentang topik **{topic?.name}** hari ini? 🌿
                </div>

                {chatHistory.map((msg, index) => (
                  <div 
                    key={index}
                    className={`p-3 rounded-2xl text-xs font-bold leading-relaxed max-w-[85%] ${
                      msg.role === "user" 
                        ? "bg-amber-100 border border-amber-200 text-amber-950 rounded-tr-none self-end" 
                        : "bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-tl-none self-start"
                    }`}
                  >
                    {msg.text}
                  </div>
                ))}

                {chatLoading && (
                  <div className="bg-emerald-50 text-emerald-600 p-3 rounded-2xl rounded-tl-none text-xs font-bold self-start flex items-center gap-1.5 animate-pulse">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Mencari isyarat...
                  </div>
                )}
              </div>

              {/* CHAT INPUT AREA */}
              <div className="p-3 bg-white border-t border-stone-100 flex items-center gap-2">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMascotMessage()}
                  placeholder={`Tanya ${currentMascot.name.split(" ")[0]}...`}
                  className="flex-grow bg-stone-100 border border-stone-200 rounded-xl px-3 h-10 text-xs font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <Button 
                  onClick={handleSendMascotMessage} 
                  disabled={chatLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10 w-10 p-0 flex items-center justify-center shrink-0 border-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FLOATING TRIGGER BUTTON */}
        <button 
          onClick={() => setMascotChatOpen(!mascotChatOpen)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white h-14 w-14 rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all border-4 border-white animate-bounce"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      </div>

    </div>
  );
}
