import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";

// Pastikan import Base44 global sepadan dengan persediaan sedia ada anda
// import { base44 } from "../lib/base44"; 

// ==========================================
// FUTURE READY: HOOK PENGURUSAN SUARA (useSpeech)
// ==========================================
function useSpeech(onBoundaryChange) {
  const [voices, setVoices] = useState([]);
  const [sentences, setSentences] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  const synthRef = useRef(window.speechSynthesis);
  const utteranceRef = useRef(null);

  // 1. Muat dan tapis suara Bahasa Melayu terbaik yang tersedia pada peranti
  useEffect(() => {
    if (!synthRef.current) return;

    const updateVoices = () => {
      const allVoices = synthRef.current.getVoices();
      
      // Susunan keutamaan mengikut kualiti pembacaan natural (Keperluan 1 & 2)
      const sortedMalay = allVoices
        .filter(v => {
          const lang = v.lang.toLowerCase();
          return lang.includes("ms-my") || lang.includes("ms_my") || lang.toLowerCase() === "ms";
        })
        .sort((a, b) => {
          const nameA = a.name.toLowerCase();
          const nameB = b.name.toLowerCase();
          
          // Utamakan Google, Microsoft (Hariz/Yasmin), Siri, dan suara Wanita/Natural
          if (nameA.includes("google") && !nameB.includes("google")) return -1;
          if (!nameA.includes("google") && nameB.includes("google")) return 1;
          if (nameA.includes("hariz") || nameA.includes("yasmin") || nameA.includes("siri")) return -1;
          return 0;
        });

      // Jika tiada Bahasa Melayu, cari Brunei/Singapore atau gunakan English sebagai sandaran (fallback)
      if (sortedMalay.length === 0) {
        const regionalMalay = allVoices.filter(v => v.lang.toLowerCase().includes("ms"));
        if (regionalMalay.length > 0) {
          setVoices(regionalMalay);
        } else {
          const englishFallback = allVoices.filter(v => v.lang.toLowerCase().includes("en"));
          setVoices(englishFallback);
        }
      } else {
        setVoices(sortedMalay);
      }
    };

    updateVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }

    return () => {
      if (synthRef.current) synthRef.current.cancel();
    };
  }, []);

  // 5. Bersihkan teks daripada elemen teknikal/markdown/emoji berulang (Keperluan 5)
  const cleanTextForSpeech = (rawText) => {
    if (!rawText) return "";
    return rawText
      .replace(/[#*`_~]/g, "") // Buang simbol Markdown
      .replace(/\[.*?\]\(.*?\)/g, "") // Buang pautan URL Markdown
      .replace(/[\(\)\{\}\[\]]/g, "") // Buang tanda kurung teknikal
      .replace(/([\u2000-\u3299]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])\1+/g, "$1") // Tukar emoji berulang kepada satu sahaja
      .trim();
  };

  // 4. Pecahkan teks panjang kepada ayat demi ayat (Keperluan 4)
  const prepareText = (rawText) => {
    if (synthRef.current) synthRef.current.cancel();
    
    const cleaned = cleanTextForSpeech(rawText);
    // Pecahkan menggunakan tanda noktah, seruan, atau tanya yang diikuti oleh ruang putih
    const parsedSentences = cleaned
      .split(/(?<=[.!?])\s+/)
      .filter(s => s.trim().length > 0);

    setSentences(parsedSentences);
    setCurrentIndex(0);
    setIsPlaying(false);
    setIsPaused(false);
  };

  // Logik memainkan indeks ayat tertentu
  const playSentence = (index) => {
    if (!synthRef.current || index < 0 || index >= sentences.length) {
      stop();
      return;
    }

    synthRef.current.cancel();
    setCurrentIndex(index);
    setIsPlaying(true);
    setIsPaused(false);

    if (onBoundaryChange) {
      onBoundaryChange(index);
    }

    const currentText = sentences[index];
    const utterance = new SpeechSynthesisUtterance(currentText);
    utteranceRef.current = utterance;

    // Gunakan suara terbaik daripada senarai tapis
    if (voices.length > 0) {
      utterance.voice = voices[0];
    }

    // CARA BACAAN MESRA KANAK-KANAK: Perlahan, ceria, intonasi tinggi sedikit (Keperluan 3)
    // Laraskan kelajuan secara dinamik jika ayat terlalu panjang supaya tidak meletihkan pendengar
    utterance.rate = currentText.length > 80 ? 0.90 : 0.85; 
    utterance.pitch = 1.08; // Nada suara dinaikkan sedikit agar kedengaran lebih ceria dan ramah
    utterance.volume = 1.0;

    utterance.onend = () => {
      // Automatik bergerak ke ayat seterusnya dengan sedikit jeda masa semula jadi
      if (index + 1 < sentences.length) {
        setTimeout(() => {
          playSentence(index + 1);
        }, 350); // Jeda mesra kanak-kanak antara ayat
      } else {
        setIsPlaying(false);
        setCurrentIndex(-1);
        if (onBoundaryChange) onBoundaryChange(-1);
      }
    };

    utterance.onerror = () => {
      setIsPlaying(false);
    };

    synthRef.current.speak(utterance);
  };

  // --- KAWALAN AUDIO PLAYER UTAMA (Keperluan 7 & 9) ---
  const play = () => {
    if (sentences.length === 0) return;
    if (isPaused) {
      synthRef.current.resume();
      setIsPaused(false);
      setIsPlaying(true);
    } else {
      playSentence(currentIndex >= 0 ? currentIndex : 0);
    }
  };

  const pause = () => {
    if (synthRef.current && isPlaying) {
      synthRef.current.pause();
      setIsPaused(true);
      setIsPlaying(false);
    }
  };

  const stop = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentIndex(-1);
    if (onBoundaryChange) onBoundaryChange(-1);
  };

  const next = () => {
    if (currentIndex + 1 < sentences.length) {
      playSentence(currentIndex + 1);
    }
  };

  const previous = () => {
    if (currentIndex - 1 >= 0) {
      playSentence(currentIndex - 1);
    }
  };

  return {
    sentences,
    currentIndex,
    isPlaying,
    isPaused,
    prepareText,
    play,
    pause,
    stop,
    next,
    previous
  };
}

// ==========================================
// KOMPONEN UTAMA LESSON PAGE
// ==========================================
export default function LessonPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  // --- STATE PERNIAGAAN ASAL ---
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [topic, setTopic] = useState(null);
  const [subject, setSubject] = useState(null);
  
  const [lessonContent, setLessonContent] = useState("");
  const [isAiGenerated, setIsAiGenerated] = useState(false);
  const [rawBankQuestions, setRawBankQuestions] = useState([]);

  // --- STATE GAMIFIKASI & PERMAINAN ---
  const [currentMission, setCurrentMission] = useState(1);
  const [unlockedMission, setUnlockedMission] = useState(1);
  const [cluesFound, setCluesFound] = useState([]);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [xp, setXp] = useState(0);
  const [coins, setCoins] = useState(0);
  const [showUnlockAnimation, setShowUnlockAnimation] = useState(false);

  const [cards, setCards] = useState([]);
  const [flippedCards, setFlippedCards] = useState([]);
  const [matchedCards, setMatchedCards] = useState([]);

  // State luaran untuk memantau ayat aktif bagi tujuan penandaan (highlight) UI
  const [activeSentenceIdx, setActiveSentenceIdx] = useState(-1);

  // Integrasi Custom Hook Pembaca Suara Pintar
  const speech = useSpeech((idx) => {
    setActiveSentenceIdx(idx);
  });

  // Ambil data dan semak keutamaan nota pembelajaran
  useEffect(() => {
    async function loadAdventureData() {
      try {
        setLoading(true);
        const sessionData = await base44.entities.StudySession.get(sessionId);
        setSession(sessionData);

        if (sessionData?.lesson_id) {
          const lessonData = await base44.entities.Lesson.get(sessionData.lesson_id);
          setLesson(lessonData);

          if (lessonData?.topic_id) {
            const topicData = await base44.entities.Topic.get(lessonData.topic_id);
            setTopic(topicData);

            if (topicData?.subject_id) {
              const subjData = await base44.entities.Subject.get(topicData.subject_id);
              setSubject(subjData);
            }
          }

          const existingNotes = lessonData.notes || sessionData.custom_notes || "";
          let contentToLoad = "";
          
          if (existingNotes.trim().length > 10) {
            contentToLoad = existingNotes;
            setIsAiGenerated(false);
          } else {
            setIsAiGenerated(true);
            const aiPrompt = `Sila hasilkan nota pembelajaran ringkas untuk kanak-kanak berumur 7-12 tahun tentang topik: "${topicData?.name || "Sains"}". 
            Maksimum 250 patah perkataan. Gunakan ayat pendek, banyak emoji, dan nada seorang guru yang sangat penyayang. 
            Mesti mengandungi: Ringkasan topik, 3 Isi penting, 1 Fakta Utama, dan 1 Tips Mengingati yang seronok.`;
            
            const generatedText = await base44.ai.generateText({ prompt: aiPrompt });
            contentToLoad = generatedText || "Wah hebat! Jom kita mulakan misi pembelajaran hari ini! 🌟";
          }

          setLessonContent(contentToLoad);

          // Sediakan text-to-speech sebaik sahaja teks dimuatkan (Misi Selamat Datang / Greeting awal)
          speech.prepareText(contentToLoad);

          if (topicData?.name) {
            const allBanks = await base44.entities.QuizBank.list();
            const foundBank = allBanks.find(b => b.topic_name === topicData.name);
            if (foundBank) {
              const parsedQs = JSON.parse(foundBank.questions_json || "[]");
              setRawBankQuestions(parsedQs);
            }
          }
        }
      } catch (error) {
        console.error("Gagal memuatkan misi pengembaraan:", error);
      } finally {
        setLoading(false);
      }
    }

    loadAdventureData();
  }, [sessionId]);

  // Pastikan audio berhenti sepenuhnya jika murid menukar tab atau keluar dari halaman (Keperluan 9 & 10)
  useEffect(() => {
    return () => {
      speech.stop();
    };
  }, []);

  // Automatik sediakan pembacaan audio baharu mengikut konteks misi yang sedang dibuka oleh murid (Keperluan 6)
  useEffect(() => {
    speech.stop();
    
    let missionInstructions = "";
    if (currentMission === 1) {
      missionInstructions = "Misi Pertama. Tonton Video Rahsia. Professor StudyQuest telah meninggalkan satu video rahsia. Tonton video ini untuk mendapatkan petunjuk pertama.";
      speech.prepareText(missionInstructions);
    } else if (currentMission === 2) {
      // Misi 2 membaca keseluruhan nota ringkas yang disediakan
      speech.prepareText(lessonContent);
    } else if (currentMission === 3) {
      missionInstructions = "Misi Ketiga. Padanan Memori. Sentuh dan cari sepasang simbol misteri yang serupa di bawah untuk mengaktifkan portal kuiz.";
      speech.prepareText(missionInstructions);
    } else if (currentMission === 4) {
      missionInstructions = "Misi Keempat. Cabaran Boss Besar. Sedia wira? Kita ada dua puluh soalan penting untuk diselesaikan. Tujuh soalan mudah, tujuh soalan sederhana, dan enam soalan sukar.";
      speech.prepareText(missionInstructions);
    }
  }, [currentMission, lessonContent]);

  // Membaca URL Embed YouTube secara dinamik
  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
  };

  const videoUrl = lesson?.video_url || session?.video_url || null;
  const embedUrl = getYouTubeEmbedUrl(videoUrl);

  const handleMissionComplete = (missionNumber, xpReward, coinReward) => {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 }
    });

    setXp(prev => prev + xpReward);
    setCoins(prev => prev + coinReward);
    
    if (missionNumber === unlockedMission && unlockedMission < 4) {
      const nextMission = unlockedMission + 1;
      setUnlockedMission(nextMission);
      setShowUnlockAnimation(true);
      setTimeout(() => {
        setShowUnlockAnimation(false);
        setCurrentMission(nextMission);
      }, 1200);
    } else if (missionNumber < 4) {
      setCurrentMission(missionNumber + 1);
    }
  };

  // Persediaan Permainan Mini Misi 3
  useEffect(() => {
    if (currentMission === 3) {
      const baseElements = ["🧠", "⭐", "🔮", "🚀", "💎", "🍀"];
      const shuffledElements = [...baseElements, ...baseElements]
        .sort(() => Math.random() - 0.5)
        .map((element, index) => ({ id: index, val: element }));
      
      setCards(shuffledElements);
      setFlippedCards([]);
      setMatchedCards([]);
      setGameCompleted(false);
    }
  }, [currentMission]);

  const handleCardClick = (id) => {
    if (flippedCards.length === 2 || matchedCards.includes(id) || flippedCards.includes(id)) return;
    
    const newFlipped = [...flippedCards, id];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      const firstCard = cards.find(c => c.id === newFlipped[0]);
      const secondCard = cards.find(c => c.id === newFlipped[1]);

      if (firstCard.val === secondCard.val) {
        setMatchedCards(prev => [...prev, newFlipped[0], newFlipped[1]]);
        setFlippedCards([]);
        if (matchedCards.length + 2 === cards.length) {
          setGameCompleted(true);
        }
      } else {
        setTimeout(() => setFlippedCards([]), 1000);
      }
    }
  };

  // Misi 4: Cabaran Boss
  const startBossChallenge = async () => {
    try {
      setLoading(true);
      let selectedPool = [];
      const easyQs = rawBankQuestions.filter(q => q.difficulty?.toLowerCase() === "easy" || q.difficulty?.toLowerCase() === "mudah" || !q.difficulty);
      const mediumQs = rawBankQuestions.filter(q => q.difficulty?.toLowerCase() === "medium" || q.difficulty?.toLowerCase() === "sederhana");
      const hardQs = rawBankQuestions.filter(q => q.difficulty?.toLowerCase() === "hard" || q.difficulty?.toLowerCase() === "sukar");

      selectedPool = [
        ...easyQs.sort(() => 0.5 - Math.random()).slice(0, 7),
        ...mediumQs.sort(() => 0.5 - Math.random()).slice(0, 7),
        ...hardQs.sort(() => 0.5 - Math.random()).slice(0, 6)
      ];

      if (selectedPool.length < 20) {
        const remaining = rawBankQuestions.filter(q => !selectedPool.includes(q));
        selectedPool = [...selectedPool, ...remaining.slice(0, 20 - selectedPool.length)];
      }

      if (selectedPool.length === 0) {
        selectedPool = rawBankQuestions.slice(0, 20);
      }

      const quizInstance = await base44.entities.Quiz.create({
        session_id: sessionId,
        topic_name: topic?.name || "Misi Pengembaraan",
        subject_name: subject?.name || "Matematik",
        questions_json: JSON.stringify(selectedPool),
        difficulty: "Campuran (Misi Boss)",
        num_questions: selectedPool.length,
      });

      navigate(`/quiz/${quizInstance.id}`);
    } catch (err) {
      console.error("Gagal melancarkan Cabaran Boss:", err);
      alert("Alamak! Gagal bersedia untuk Cabaran Boss. Sila cuba lagi ya!");
    } finally {
      setLoading(false);
    }
  };

  // 8. Menjana paparan ayat dengan fungsi highlight pintar (Keperluan 8)
  const renderHighlightedContent = useMemo(() => {
    if (currentMission !== 2) return null;
    if (speech.sentences.length === 0) return <p>{lessonContent}</p>;

    return (
      <div className="space-y-2">
        {speech.sentences.map((sentence, idx) => {
          const isCurrentActive = activeSentenceIdx === idx;
          return (
            <span
              key={idx}
              className={`inline-block mx-0.5 px-1 py-0.5 rounded transition-all duration-300 font-medium text-sm leading-relaxed
                ${isCurrentActive 
                  ? "bg-yellow-300 text-yellow-950 font-black scale-[1.01] shadow-sm border-b-2 border-yellow-500" 
                  : "text-slate-800"}`}
            >
              {sentence}{" "}
            </span>
          );
        })}
      </div>
    );
  }, [currentMission, speech.sentences, activeSentenceIdx, lessonContent]);

  if (loading) {
    return (
      <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center p-6">
        <div className="animate-bounce text-6xl mb-4">🏕️</div>
        <h2 className="text-2xl font-bold text-amber-900 text-center animate-pulse font-sans">
          Membuka Peta Pengembaraan...
        </h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 via-emerald-50 to-amber-50 font-sans pb-12 selection:bg-yellow-200">
      
      {/* PAPARAN METER ATAS (HUD) */}
      <div className="bg-white border-b-4 border-slate-200 sticky top-0 z-50 px-4 py-3 shadow-sm">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)} 
            className="text-2xl p-1 hover:bg-slate-100 rounded-full transition-transform active:scale-95"
            title="Kembali"
          >
            🔙
          </button>
          
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 border-2 border-amber-400 px-3 py-1 rounded-full flex items-center gap-1 font-bold text-amber-800 text-sm">
              ⭐ <span>{xp} XP</span>
            </div>
            <div className="bg-yellow-100 border-2 border-yellow-400 px-3 py-1 rounded-full flex items-center gap-1 font-bold text-yellow-800 text-sm">
              🪙 <span>{coins} Syiling</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 mt-6">
        
        {/* SEPANDUK UTAMA TOPIK */}
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-3xl p-5 text-white shadow-lg text-center mb-6 border-b-8 border-indigo-800">
          <span className="text-xs font-black tracking-widest uppercase bg-purple-700 bg-opacity-50 px-3 py-1 rounded-full">
            {subject?.name || "Wira Ilmu"}
          </span>
          <h1 className="text-2xl font-black mt-2 tracking-tight">
            {topic?.name || "Misi Pembelajaran"}
          </h1>
          <p className="text-purple-100 text-xs mt-1 font-medium">
            Selesaikan 4 misi untuk menewaskan Boss! 👑
          </p>
        </div>

        {/* PETA KEMAJUAN MISI */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border-2 border-slate-200 mb-6">
          <div className="flex items-center justify-between relative px-2">
            <div className="absolute left-6 right-6 top-1/2 h-2 bg-slate-200 -translate-y-1/2 z-0"></div>
            <div 
              className="absolute left-6 top-1/2 h-2 bg-gradient-to-r from-emerald-400 to-emerald-500 -translate-y-1/2 z-0 transition-all duration-500"
              style={{ width: `${((unlockedMission - 1) / 3) * 100}%` }}
            ></div>

            {[
              { num: 1, icon: "🎬", label: "Video" },
              { num: 2, icon: "🔎", label: "Klu" },
              { num: 3, icon: "🎮", label: "Game" },
              { num: 4, icon: "👑", label: "Boss" }
            ].map((m) => {
              const isCurrent = currentMission === m.num;
              const isLocked = m.num > unlockedMission;
              
              return (
                <button
                  key={m.num}
                  disabled={m.num > unlockedMission}
                  onClick={() => setCurrentMission(m.num)}
                  className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all font-bold shadow-md
                    ${isCurrent ? "bg-amber-400 border-4 border-white ring-4 ring-amber-400 scale-110" : ""}
                    ${!isCurrent && !isLocked ? "bg-emerald-400 text-white hover:bg-emerald-500" : ""}
                    ${isLocked ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none" : ""}
                  `}
                >
                  {isLocked ? "🔒" : m.icon}
                  <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                    {m.label}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="h-4"></div>
        </div>

        {showUnlockAnimation && (
          <div className="bg-emerald-500 text-white p-4 rounded-xl text-center font-bold text-sm mb-4 animate-bounce border-b-4 border-emerald-700">
            🎉 Misi Seterusnya Berjaya Dibuka! Jom Maju! 🚀
          </div>
        )}

        {/* --- PAPARAN KANDUNGAN MISI AKTIF --- */}
        <div className="bg-white rounded-3xl p-6 shadow-md border-4 border-slate-200 min-h-[360px] flex flex-col justify-between transition-all">
          
          {/* ==========================================
              ACCESSIBILITY: AUDIO SPEECH CONTROLLER PLAYER 
              ========================================== */}
          <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-3 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black tracking-wide text-slate-500 uppercase flex items-center gap-1">
                {speech.isPlaying && "🔊 Sedang Membaca..."}
                {speech.isPaused && "⏸️ Pembacaan Dijeda"}
                {!speech.isPlaying && !speech.isPaused && "✅ Sedia Membaca"}
              </span>
              
              {speech.sentences.length > 0 && (
                <span className="text-[10px] font-bold text-slate-400 bg-slate-200 px-2 py-0.5 rounded-full">
                  Ayat {speech.currentIndex >= 0 ? speech.currentIndex + 1 : 0} / {speech.sentences.length}
                </span>
              )}
            </div>

            {/* Butang Kawalan Besar untuk Kanak-kanak (Keperluan 7 & 11) */}
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={speech.previous}
                disabled={speech.currentIndex <= 0}
                className="w-10 h-10 rounded-xl bg-white border-2 border-slate-200 text-sm flex items-center justify-center font-bold text-slate-700 active:bg-slate-100 disabled:opacity-40"
                title="Ayat Sebelumnya"
              >
                ⏮️
              </button>

              {!speech.isPlaying ? (
                <button
                  onClick={speech.play}
                  className="px-4 h-10 rounded-xl bg-blue-500 border-b-4 border-blue-700 text-white font-black text-xs flex items-center gap-1 active:translate-y-0.5 active:border-b-0"
                >
                  ▶️ Main
                </button>
              ) : (
                <button
                  onClick={speech.pause}
                  className="px-4 h-10 rounded-xl bg-amber-500 border-b-4 border-amber-700 text-white font-black text-xs flex items-center gap-1 active:translate-y-0.5 active:border-b-0"
                >
                  ⏸️ Jeda
                </button>
              )}

              <button
                onClick={speech.stop}
                className="w-10 h-10 rounded-xl bg-white border-2 border-slate-200 text-sm flex items-center justify-center font-bold text-slate-700 active:bg-slate-100"
                title="Henti"
              >
                ⏹️
              </button>

              <button
                onClick={speech.next}
                disabled={speech.currentIndex >= speech.sentences.length - 1}
                className="w-10 h-10 rounded-xl bg-white border-2 border-slate-200 text-sm flex items-center justify-center font-bold text-slate-700 active:bg-slate-100 disabled:opacity-40"
                title="Ayat Seterusnya"
              >
                ⏭️
              </button>
            </div>
          </div>

          {/* MISI 1: TONTON VIDEO */}
          {currentMission === 1 && (
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-800 mb-2 flex items-center gap-2">
                  <span>🎬</span> Misi 1: Video Rahsia
                </h3>
                <p className="text-slate-600 text-sm font-medium leading-relaxed mb-4">
                  Professor StudyQuest telah meninggalkan satu video rahsia. Tonton video ini untuk mendapatkan petunjuk pertama. ✨
                </p>

                {embedUrl ? (
                  <div className="w-full aspect-video rounded-2xl overflow-hidden border-2 border-slate-200 shadow-inner mb-4">
                    <iframe
                      src={embedUrl}
                      title="Video misi rahsia YouTube"
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                ) : (
                  <div className="bg-blue-50 border-2 border-dashed border-blue-300 p-6 rounded-2xl text-center text-sm text-blue-700 font-bold mb-4">
                    🔍 Tiada video rahsia dikesan. Misi ini diluluskan secara automatik oleh Professor!
                  </div>
                )}
              </div>

              <button
                onClick={() => handleMissionComplete(1, 50, 10)}
                className="w-full bg-emerald-400 hover:bg-emerald-500 text-white font-black py-4 rounded-2xl text-lg shadow-md border-b-4 border-emerald-600 transition-all active:translate-y-1 active:border-b-0 mt-2"
              >
                Saya Dah Tonton! 👍
              </button>
            </div>
          )}

          {/* MISI 2: MENCARI KLU NOTA (DENGAN HIGHLIGHT AYAT AKTIF) */}
          {currentMission === 2 && (
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-800 mb-2 flex items-center gap-2">
                  <span>🔎</span> Misi 2: Klu Tersembunyi
                </h3>
                <p className="text-slate-600 text-sm font-medium leading-relaxed mb-4">
                  Sebelum meneruskan misi, cuba cari 3 petunjuk tersembunyi di dalam nota di bawah dengan menekan butang klu!
                </p>

                <div className="flex gap-2 mb-4 overflow-x-auto py-1">
                  {[1, 2, 3].map((num) => (
                    <span 
                      key={num} 
                      className={`text-xs px-2.5 py-1 rounded-full font-bold border transition-all shrink-0
                        ${cluesFound.includes(num) 
                          ? "bg-yellow-400 border-yellow-500 text-yellow-950 animate-bounce" 
                          : "bg-slate-100 border-slate-200 text-slate-400"}`}
                    >
                      {cluesFound.includes(num) ? "🔍 Klu Dijumpai!" : `❓ Klu ${num}`}
                    </span>
                  ))}
                </div>

                {/* RUANGAN NOTA: Memaparkan teks biasa atau teks highlight mengikut status audio (Keperluan 8) */}
                <div className="bg-amber-50 rounded-2xl p-4 border-2 border-amber-200 text-slate-800 text-sm leading-relaxed max-h-48 overflow-y-auto mb-4 whitespace-pre-line prose font-medium">
                  {activeSentenceIdx >= 0 ? renderHighlightedContent : lessonContent}
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[1, 2, 3].map((i) => (
                    <button
                      key={i}
                      disabled={cluesFound.includes(i)}
                      onClick={() => setCluesFound(p => [...p, i])}
                      className={`p-2.5 text-xs font-bold rounded-xl border transition-all text-center
                        ${cluesFound.includes(i) 
                          ? "bg-emerald-100 border-emerald-300 text-emerald-700" 
                          : "bg-orange-50 border-orange-200 text-orange-700 hover:scale-105 active:scale-95"}`}
                    >
                      {cluesFound.includes(i) ? "✅ Siap" : `Cari Klu ${i}`}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  if (cluesFound.length < 3) {
                    alert("Sila cari ketiga-tiga klu rahsia dalam nota terlebih dahulu ya!");
                    return;
                  }
                  handleMissionComplete(2, 60, 15);
                }}
                className={`w-full font-black py-4 rounded-2xl text-lg shadow-md border-b-4 transition-all mt-2
                  ${cluesFound.length === 3 
                    ? "bg-emerald-400 hover:bg-emerald-500 text-white border-emerald-600 active:translate-y-1 active:border-b-0" 
                    : "bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed"}`}
              >
                Saya Jumpa Semua Klu! 🎒
              </button>
            </div>
          )}

          {/* MISI 3: PERMAINAN MINI */}
          {currentMission === 3 && (
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-800 mb-1 flex items-center gap-2">
                  <span>🎮</span> Misi 3: Padanan Memori
                </h3>
                <p className="text-slate-600 text-xs font-medium leading-relaxed mb-4">
                  Sentuh dan cari sepasang simbol misteri yang serupa di bawah untuk mengaktifkan portal kuiz! ⚡
                </p>

                <div className="grid grid-cols-4 gap-2 mb-4">
                  {cards.map((card) => {
                    const isFlipped = flippedCards.includes(card.id) || matchedCards.includes(card.id);
                    return (
                      <button
                        key={card.id}
                        onClick={() => handleCardClick(card.id)}
                        className={`aspect-square rounded-xl text-xl font-bold flex items-center justify-center transition-all shadow-sm border-2
                          ${isFlipped ? "bg-yellow-100 border-yellow-400 scale-95" : "bg-indigo-500 border-indigo-700 text-indigo-500 hover:bg-indigo-600"}`}
                      >
                        {isFlipped ? card.val : "❓"}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={() => {
                  if (!gameCompleted) {
                    alert("Selesaikan permainan padanan kad dahulu untuk meneruskan misi!");
                    return;
                  }
                  handleMissionComplete(3, 80, 20);
                }}
                className={`w-full font-black py-4 rounded-2xl text-lg shadow-md border-b-4 transition-all mt-2
                  ${gameCompleted 
                    ? "bg-emerald-400 hover:bg-emerald-500 text-white border-emerald-600 active:translate-y-1 active:border-b-0" 
                    : "bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed"}`}
              >
                {gameCompleted ? "Permainan Selesai! Maju ➡️" : "Padankan Semua Kad 🧩"}
              </button>
            </div>
          )}

          {/* MISI 4: CABARAN BOSS */}
          {currentMission === 4 && (
            <div className="flex-1 flex flex-col justify-between text-center py-4">
              <div>
                <div className="text-6xl mb-3 animate-pulse">👑</div>
                <h3 className="text-2xl font-black text-red-600 mb-2">
                  Misi 4: Cabaran Boss Besar!
                </h3>
                <p className="text-slate-700 text-sm font-semibold max-w-xs mx-auto leading-relaxed mb-6">
                  Sedia wira? Kita ada 20 soalan penting untuk diselesaikan (7 Mudah, 7 Sederhana, dan 6 Sukar)! 🔥
                </p>
                
                <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-3 inline-flex items-center gap-3 text-xs font-bold text-red-800 mb-6">
                  <span>🟢 x7 Mudah</span>
                  <span>🟡 x7 Sederhana</span>
                  <span>🔴 x6 Sukar</span>
                </div>
              </div>

              <button
                onClick={startBossChallenge}
                className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-black py-4 rounded-2xl text-xl shadow-lg border-b-4 border-red-700 transition-all active:translate-y-1 active:border-b-0"
              >
                MASUK CABARAN BOSS ⚔️
              </button>
            </div>
          )}

        </div>

        {/* MASKOT / NASIHAT BAWAH */}
        <div className="mt-6 bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-slate-200">
          <div className="text-4xl">🦉</div>
          <div className="flex-1">
            <p className="text-slate-800 text-xs font-black">Pesanan Professor StudyQuest:</p>
            <p className="text-slate-500 text-[11px] font-medium leading-tight mt-0.5">
              {currentMission === 1 && "Tonton video dengan fokus untuk mengumpulkan klu awal!"}
              {currentMission === 2 && "Dengar sebutan atau lihat perkataan yang disorot kuning di atas!"}
              {currentMission === 3 && "Latihan padanan kad ini sangat bagus untuk mengasah minda tajam anda!"}
              {currentMission === 4 && "Bertenang dan baca soalan dengan teliti. Selamat berjaya wira!"}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}