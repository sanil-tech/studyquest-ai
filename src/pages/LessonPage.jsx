import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";

// Pastikan import Base44 global sepadan dengan persediaan sedia ada anda
// import { base44 } from "../lib/base44"; 

export default function LessonPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  // --- SISTEM STATE (MENGEKALKAN LOGIK PERNIAGAAN ASAL) ---
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [topic, setTopic] = useState(null);
  const [subject, setSubject] = useState(null);
  
  // State Kandungan
  const [lessonContent, setLessonContent] = useState("");
  const [isAiGenerated, setIsAiGenerated] = useState(false);
  const [rawBankQuestions, setRawBankQuestions] = useState([]);

  // State Kemajuan Misi & Gamifikasi
  const [currentMission, setCurrentMission] = useState(1); // 1 hingga 4
  const [unlockedMission, setUnlockedMission] = useState(1);
  const [cluesFound, setCluesFound] = useState([]);
  const [gameScore, setGameScore] = useState(0);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [xp, setXp] = useState(0);
  const [coins, setCoins] = useState(0);
  const [showUnlockAnimation, setShowUnlockAnimation] = useState(false);

  // State Audio / Ucapan
  const [isSpeaking, setIsSpeaking] = useState(false);
  const synthRef = useRef(window.speechSynthesis);

  // --- STATE PERMAINAN PADANAN MEMORI (MISI 3) ---
  const [cards, setCards] = useState([]);
  const [flippedCards, setFlippedCards] = useState([]);
  const [matchedCards, setMatchedCards] = useState([]);

  // --- 1. AMBIL DATA AWAL & SEMAKAN KEUTAMAAN ---
  useEffect(() => {
    async function loadAdventureData() {
      try {
        setLoading(true);
        // Ambil data StudySession sedia ada
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

          // KEUTAMAAN 1: Semak nota sedia ada dalam Lesson atau StudySession
          const existingNotes = lessonData.notes || sessionData.custom_notes || "";
          
          if (existingNotes.trim().length > 10) {
            // Guna nota sedia ada, elakkan panggilan AI
            setLessonContent(existingNotes);
            setIsAiGenerated(false);
          } else {
            // KEUTAMAAN 2: Tiada nota, panggil AI Sandaran (Ringkas & Mesra Kanak-kanak)
            setIsAiGenerated(true);
            const aiPrompt = `Sila hasilkan nota pembelajaran ringkas untuk kanak-kanak berumur 7-12 tahun tentang topik: "${topicData?.name || "Sains"}". 
            Maksimum 250 patah perkataan. Gunakan ayat pendek, banyak emoji, dan nada seorang guru yang sangat penyayang. 
            Mesti mengandungi: Ringkasan topik, 3 Isi penting, 1 Fakta Utama, dan 1 Tips Mengingati yang seronok.`;
            
            const generatedText = await base44.ai.generateText({ prompt: aiPrompt });
            setLessonContent(generatedText || "Wah hebat! Jom kita mulakan misi pembelajaran hari ini! 🌟");
          }

          // Muat Bank Soalan untuk Misi 4 (Cabaran Boss) tanpa ubah logik asal
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

  // Bersihkan audio jika menukar halaman
  useEffect(() => {
    return () => {
      if (synthRef.current) synthRef.current.cancel();
    };
  }, []);

  // --- 2. PENUKAR TEKS KEPADA UCAPAN (WEB SPEECH API) ---
  const speakText = (textToRead) => {
    if (!synthRef.current) return;

    if (isSpeaking) {
      synthRef.current.cancel();
      setIsSpeaking(false);
      return;
    }

    // Bersihkan sebarang simbol markdown untuk pembacaan lancar
    const cleanText = textToRead.replace(/[#*`]/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Cari suara Bahasa Melayu (ms-MY) terbaik, sandaran kepada Bahasa Inggeris
    const voices = synthRef.current.getVoices();
    const malayVoice = voices.find(v => v.lang.includes("ms") || v.lang.includes("MY")) || voices.find(v => v.lang.includes("en"));
    
    if (malayVoice) {
      utterance.voice = malayVoice;
    }
    
    utterance.rate = 0.95; // Diperlahankan sedikit untuk pemahaman kanak-kanak
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    synthRef.current.speak(utterance);
  };

  // --- 3. PENGESANAN & ANALISIS URL YOUTUBE ---
  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
  };

  const videoUrl = lesson?.video_url || session?.video_url || null;
  const embedUrl = getYouTubeEmbedUrl(videoUrl);

  // --- 4. Ganjaran Kemajuan Misi ---
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

  // --- 5. PERSEDIAAN PERMAINAN MINI (MISI 3) ---
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

  // --- 6. MISI 4: CABARAN BOSS (MENGEKALKAN RUNQUIZGENERATION Sedia ada) ---
  const startBossChallenge = async () => {
    try {
      setLoading(true);
      
      // Pembahagian kesukaran: 7 Mudah, 7 Sederhana, 6 Sukar (Jumlah 20 Soalan)
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

      // Pendaftaran Pusingan Kuiz ke Base44
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
            
            {/* Garisan Latar Belakang */}
            <div className="absolute left-6 right-6 top-1/2 h-2 bg-slate-200 -translate-y-1/2 z-0"></div>
            <div 
              className="absolute left-6 top-1/2 h-2 bg-gradient-to-r from-emerald-400 to-emerald-500 -translate-y-1/2 z-0 transition-all duration-500"
              style={{ width: `${((unlockedMission - 1) / 3) * 100}%` }}
            ></div>

            {/* Butang Misi */}
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
                  onClick={() => {
                    if (synthRef.current) synthRef.current.cancel();
                    setIsSpeaking(false);
                    setCurrentMission(m.num);
                  }}
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

        {/* ANIMASI BUKA MISI BARU */}
        {showUnlockAnimation && (
          <div className="bg-emerald-500 text-white p-4 rounded-xl text-center font-bold text-sm mb-4 animate-bounce border-b-4 border-emerald-700">
            🎉 Misi Seterusnya Berjaya Dibuka! Jom Maju! 🚀
          </div>
        )}

        {/* --- PAPARAN KANDUNGAN MISI AKTIF --- */}
        <div className="bg-white rounded-3xl p-6 shadow-md border-4 border-slate-200 min-h-[360px] flex flex-col justify-between transition-all">
          
          {/* BUTANG BANTUAN SUARA */}
          <div className="flex justify-end mb-2">
            <button
              onClick={() => {
                let textContent = "";
                if (currentMission === 1) textContent = "Professor StudyQuest telah meninggalkan satu video rahsia. Tonton video ini untuk mendapatkan petunjuk pertama.";
                if (currentMission === 2) textContent = lessonContent;
                if (currentMission === 3) textContent = "Misi Tiga: Permainan Mini Interaktif. Padankan simbol misteri yang serupa di bawah untuk mengaktifkan portal ilmu.";
                if (currentMission === 4) textContent = "Misi Terakhir: Cabaran Boss! Sedia wira? Kita ada dua puluh soalan penting untuk diselesaikan.";
                speakText(textContent);
              }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full font-bold text-xs shadow-sm transition-all border
                ${isSpeaking ? "bg-red-100 border-red-300 text-red-600 animate-pulse" : "bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100"}`}
            >
              <span>{isSpeaking ? "⏹️ Henti" : "🔊 Dengar"}</span>
            </button>
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

          {/* MISI 2: MENCARI KLU NOTA */}
          {currentMission === 2 && (
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-800 mb-2 flex items-center gap-2">
                  <span>🔎</span> Misi 2: Klu Tersembunyi
                </h3>
                <p className="text-slate-600 text-sm font-medium leading-relaxed mb-4">
                  Sebelum meneruskan misi, cuba cari 3 petunjuk tersembunyi di dalam nota di bawah. Tekan bahagian butang klu!
                </p>

                {/* Barisan Lencana Klu */}
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

                {/* Ruangan Kandungan Nota */}
                <div className="bg-amber-50 rounded-2xl p-4 border-2 border-amber-200 text-slate-800 text-sm leading-relaxed max-h-48 overflow-y-auto mb-4 whitespace-pre-line prose font-medium">
                  {lessonContent}
                </div>

                {/* Butang Interaktif Mengumpul Klu */}
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

                {/* Grid Kad Permainan */}
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
              {currentMission === 1 && "Pastikan bunyi pembesar suara gajet anda dibuka ya!"}
              {currentMission === 2 && "Baca dengan teliti, klu rahsia boleh berada di mana-mana!"}
              {currentMission === 3 && "Latihan memori membantu otak anda menjadi lebih cerdas!"}
              {currentMission === 4 && "Jangan gopoh semasa menjawab nanti. Awak pasti boleh buat!"}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}