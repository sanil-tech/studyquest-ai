// src/pages/LessonPage.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { 
  ArrowLeft, Compass, Tv, CheckCircle2, Leaf, Loader2, Sparkles, Trophy, Play
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

import Flashcards from "@/components/lesson/Flashcards";
import MindMap from "@/components/lesson/MindMap";
import LessonProgress from "@/components/lesson/LessonProgress";
import JungleMemory from "@/components/lesson/JungleMemory";

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
      <div className="p-8 text-center bg-amber-50/60 border-2 border-dashed border-amber-300 rounded-2xl shadow-sm">
        <p className="text-amber-900 font-black text-xs sm:text-sm">🎬 Pautan video YouTube belum dimasukkan oleh Pentadbir untuk modul ini.</p>
        <Button 
          onClick={onCompleted} 
          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black rounded-xl px-5 py-2.5 text-xs mt-4 shadow-[0_4px_0_#b45309] active:translate-y-1 active:shadow-none transition-all border-0"
        >
          Teruskan Misi Kembara! 🚀
        </Button>
      </div>
    );
  }

  const currentOrigin = window.location.origin;
  const secureEmbedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1&enablejsapi=1&origin=${encodeURIComponent(currentOrigin)}`;

  return (
    <div className="space-y-4 w-full" key={videoId}>
      <div className="relative aspect-video w-full rounded-2xl sm:rounded-[1.5rem] overflow-hidden border-4 border-stone-800 bg-stone-950 shadow-md">
        <iframe 
          key={videoId} 
          src={secureEmbedUrl} 
          className="w-full h-full border-0 absolute inset-0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
          allowFullScreen 
        />
      </div>

      {isCompleted ? (
        <div className="bg-emerald-50 border-2 border-emerald-200 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-black text-emerald-900 text-xs sm:text-sm">Cayalah! Anda selesai menonton video taklimat kembara ini. 🍃</span>
          </div>
          <div className="bg-lime-400 px-3 py-1.5 rounded-lg text-emerald-950 font-black text-xs shrink-0 border border-emerald-500 shadow-xs">+10 XP Padu! 🔥</div>
        </div>
      ) : (
        <div className="bg-stone-900 border-2 border-stone-800 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
          <p className="text-xs text-stone-200 font-bold flex items-center gap-2">
            <Tv className="w-5 h-5 text-emerald-400 animate-pulse shrink-0" /> 
            Dah selesai tonton taklimat? Klik butang untuk tuntut ganjaran rimba anda!
          </p>
          <Button 
            onClick={onCompleted} 
            className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs rounded-xl px-5 h-11 shrink-0 shadow-[0_4px_0_#047857] active:translate-y-1 active:shadow-none border-0 transition-all"
          >
            Selesai & Ambil +10 XP 🔥
          </Button>
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
  
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [savedQuizProgress, setSavedQuizProgress] = useState(null);
  
  const studyStartRef = useRef(null);
  const sessionRef = useRef(null);

  useEffect(() => { sessionRef.current = sessionId; }, [sessionId]);
  const isTopicUnlocked = progressState.quiz_completed || (progressState.video_completed && progressState.lesson_completed && progressState.flashcard_completed && progressState.mindmap_completed);

  // 🌟 SUIS AUTOMATIK FULLSCREEN
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

  useEffect(() => {
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, [activeTab]);

  const bersihkanTeksPadanan = (str) => { return str ? str.toLowerCase().replace(/dan/g, "").replace(/&/g, "").replace(/misi\s*\d+/g, "").replace(/[^a-z0-9]/g, "").trim() : ""; };

  // 🌟 DATA INITIALIZATION & PARSING SEPENUHNYA KALIS RALAT
  useEffect(() => {
    let isMounted = true;
    const initializeLesson = async () => {
      try {
        const [sub, top, user] = await Promise.all([base44.entities.Subject.get(subjectId), base44.entities.Topic.get(topicId), base44.auth.me()]);
        if (!isMounted) return;
        setSubject(sub); setTopic(top);

        const checkpointKey = `studyquest_checkpoint_${user.id}_${topicId}`;
        const dataTerpelihara = localStorage.getItem(checkpointKey);
        if (dataTerpelihara) {
          try { setSavedQuizProgress(JSON.parse(dataTerpelihara)); } catch(e) {}
        }

        try {
          const allQuizBanks = await base44.entities.Quiz.filter({});
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
              let textData = "";
              let imageData = "";
              
              // 🛠️ EKSTRAKSI JADUAL & MARKTXT DARIPADA STRUKTUR JSON MENTAH DENGAN KUAT
              try {
                let parsed = typeof rawNotes === "object" ? rawNotes : JSON.parse(String(rawNotes).trim());
                if (parsed && (parsed.text !== undefined || parsed.image !== undefined)) {
                  textData = parsed.text || "";
                  imageData = parsed.image || "";
                } else {
                  textData = String(rawNotes);
                }
              } catch (jsonErr) {
                textData = String(rawNotes);
              }

              // Kebal-Ralat Sekiranya Objek Masih Terperangkap Sebagai String JSON Mentah
              if (typeof textData === "string" && textData.trim().startsWith("{")) {
                try {
                  const secondaryParse = JSON.parse(textData.trim());
                  textData = secondaryParse.text || textData;
                  imageData = secondaryParse.image || imageData;
                } catch (e) {}
              }

              setNotesContent(textData);
              setNotesImage(imageData || "");
            }
            
            const parsedQuestions = safeJsonParse(foundBank.questions_json, []);
            setRawBankQuestions(parsedQuestions);
          }
        } catch (quizBankErr) {}

        try {
          let cachedSessions = await base44.entities.StudySession.filter({ student_id: user.id, topic_id: topicId }, "-created_date", 1);
          let sessionWithNotes = cachedSessions[0] || null;
          if (isMounted && sessionWithNotes) {
            const savedStage = sessionWithNotes.current_stage || "video";
            setProgressState({ 
              video_completed: sessionWithNotes.video_completed || false, 
              lesson_completed: sessionWithNotes.lesson_completed || false, 
              flashcard_completed: sessionWithNotes.flashcard_completed || false, 
              mindmap_completed: sessionWithNotes.mindmap_completed || false, 
              quiz_completed: sessionWithNotes.quiz_completed || false, 
              current_stage: savedStage, 
              xp_earned: sessionWithNotes.xp_earned || 0 
            });
            setSessionId(sessionWithNotes.id);

            if (!sessionWithNotes.quiz_completed) {
              setActiveTab(savedStage);
            }
          }
        } catch (sErr) {}
      } catch (err) {} finally { if (isMounted) { studyStartRef.current = Date.now(); setLoading(false); } }
    };
    initializeLesson();
    return () => { isMounted = false; };
  }, [subjectId, topicId]);

  const recordStudyTime = async () => { const sId = sessionRef.current; if (!sId || !studyStartRef.current) return; const mins = Math.max(1, Math.round((Date.now() - studyStartRef.current) / 60000)); try { await base44.entities.StudySession.update(sId, { duration_minutes: mins }); } catch (err) {} };
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
        const newSession = await base44.entities.StudySession.create({ student_id: user.id, subject_id: subjectId, topic_id: topicId, topic_name: topic.name, subject_name: subject.name, duration_minutes: 0, ...progressState, video_completed: true, current_stage: "lesson", xp_earned: 10 });
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
      const nextStatePayload = { ...progressState, lesson_completed: true, current_stage: progressState.flashcard_completed ? progressState.current_stage : "flashcard", xp_earned: progressState.xp_earned + (progressState.lesson_completed ? 0 : 15) };
      if (!currentSessionId) {
        const user = await base44.auth.me();
        const newSession = await base44.entities.StudySession.create({ student_id: user.id, subject_id: subjectId, topic_id: topicId, topic_name: topic.name, subject_name: subject.name, duration_minutes: 0, ...nextStatePayload });
        const validId = Array.isArray(newSession) ? newSession[0]?.id : newSession?.id; setSessionId(validId); sessionRef.current = validId;
      } else { await base44.entities.StudySession.update(currentSessionId, nextStatePayload); }
      setProgressState(prev => ({ ...prev, ...nextStatePayload })); triggerConfetti(); setActiveTab("map");
    } catch (e) {} finally { setStatus(p => ({ ...p, lesson: false })); }
  };

  const loadFlashcardsOnDemand = async () => { setActiveTab("flashcard"); if (flashcards && flashcards.length > 0) return; setStatus(p => ({ ...p, flashcards: true })); try { if (rawBankQuestions && rawBankQuestions.length > 0) { setFlashcards(shuffleArray(rawBankQuestions).slice(0, 5).map(q => ({ front: q.question, back: `${q.correct_answer || q.correctAnswer}\n\n${q.explanation || ""}` }))); return; } } catch (err) {} finally { setStatus(p => ({ ...p, flashcards: false })); } };
  const loadMindMapOnDemand = async () => { setActiveTab("mindmap"); if (mindMap && mindMap.length > 0) return; setStatus(p => ({ ...p, mindmap: true })); try { const res = await base44.integrations.Core.InvokeLLM({ model: "gemini_3_flash", prompt: `Generate mindmap branches array for summary: ${topic.name}`, response_json_schema: {type: "array", items: {type: "object", properties: { label: { type: "string" }, children: { type: "array", items: { type: "string" } } }, required: ["label", "children"]}} }); setMindMap(res); } catch (e) {} finally { setStatus(p => ({ ...p, mindmap: false })); } };

  const runQuizGeneration = async (numQ, isResume = false) => { 
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
        await base44.entities.StudySession.update(currentSessionId, { quiz_completed: true, current_stage: "quiz" }).catch(()=>{});
      }

      if (isResume && savedQuizProgress) {
        navigate(`/quiz/${actualQuizId}?limit=${savedQuizProgress.limit}&resume=true`);
      } else {
        navigate(`/quiz/${actualQuizId}?limit=${numQ}`);
      }

    } catch (e) { 
      navigate(`/quiz/${actualQuizId || topicId}?limit=${numQ}`);
    } finally { 
      setStatus(p => ({ ...p, quiz: false })); 
    } 
  };

  // 🔊 FILTER SUARA OKI (MENAPIS STRUKTUR JADUAL & BANNER GAMBAR UNTUK BACAAN NATURAL)
  const bersihkanTeksUntukSuara = (text) => {
    if (!text) return "";
    // Tukar literal "\n" teks kepada baris baharu
    const normalizedText = String(text).replace(/\\n/g, "\n");
    return normalizedText
      .split("\n")
      .filter(line => !line.trim().startsWith("|"))  
      .filter(line => !line.trim().startsWith("![")) 
      .join(" ")
      .replace(/[#*>\-_`🔸]/g, "") 
      .replace(/\s+/g, " ")       
      .trim();
  };

  const urusSuaraNota = (teksNota) => {
    if (!window.speechSynthesis) {
      alert("⚠️ Peranti anda tidak menyokong fungsi audio pembaca.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const teksBersih = bersihkanTeksUntukSuara(teksNota);
    const sebutan = new SpeechSynthesisUtterance(teksBersih);
    const modBahasa = getLanguageMode();
    
    sebutan.lang = modBahasa === "en" ? "en-MY" : "ms-MY";
    sebutan.rate = 0.85;  
    sebutan.pitch = 1.25; 

    const senaraiSuara = window.speechSynthesis.getVoices();
    const suaraTerbaik = senaraiSuara.find(v => v.lang.startsWith(modBahasa === "en" ? "en" : "ms"));
    if (suaraTerbaik) sebutan.voice = suaraTerbaik;

    sebutan.onstart = () => setIsSpeaking(true);
    sebutan.onend = () => setIsSpeaking(false);
    sebutan.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(sebutan);
  };

  // 📊 FILTER PAPARAN TULISAN JADUAL & GAMBAR MARKDOWN (HTML PARSER SEBENAR)
  const parseMarkdownToHTML = (text) => {
    if (!text) return ""; 
    // 🛠️ LANGKAH UTAMA: Tukar tulisan "\n" jenis teks kepada baris baharu sistem
    const cleanText = String(text).replace(/\\n/g, "\n");
    const lines = cleanText.split("\n"); 
    let inList = false; 
    let inTable = false;
    let htmlOutput = [];

    lines.forEach((line) => {
      let trimmed = line.trim();
      
      if (!trimmed.startsWith("* ") && !trimmed.startsWith("- ") && inList) { htmlOutput.push("</ul>"); inList = false; }
      if (!(trimmed.startsWith("|") && trimmed.endsWith("|")) && inTable) { htmlOutput.push("</tbody></table></div>"); inTable = false; }
      if (trimmed === "") return;
      if (trimmed === "---") { htmlOutput.push('<hr class="my-6 border-emerald-200 border-dashed border-2 rounded-full" />'); return; }

      // 🖼️ PENAPIS UTAMA ELEMEN GAMBAR MARKDOWN
      if (trimmed.startsWith("![") && trimmed.includes("](") && trimmed.endsWith(")")) {
        const imgMatch = trimmed.match(/!\[(.*?)\]\((.*?)\)/);
        if (imgMatch) {
          htmlOutput.push(`<div class="w-full flex justify-center my-5"><img src="${imgMatch[2]}" alt="${imgMatch[1]}" class="w-full max-w-md h-auto rounded-2xl border-4 border-stone-800 shadow-md bg-white transition-transform hover:scale-102 duration-300" /></div>`);
          return;
        }
      }

      // Headings
      if (trimmed.startsWith("# ")) { htmlOutput.push(`<h1 class="text-base sm:text-lg font-black text-emerald-700 border-b-4 border-emerald-200 pb-2 mt-6 mb-4 text-center bg-emerald-50/60 p-3 rounded-2xl shadow-2xs">${trimmed.replace("# ", "")}</h1>`); return; }
      if (trimmed.startsWith("## ")) { htmlOutput.push(`<h2 class="text-sm sm:text-base font-black text-amber-600 mt-5 mb-2.5 flex items-center gap-1">✨ ${trimmed.replace("## ", "")}</h2>`); return; }
      if (trimmed.startsWith("### ")) { htmlOutput.push(`<h3 class="text-xs sm:text-sm font-black text-stone-800 mt-4 mb-2 pl-2 border-l-4 border-lime-400">${trimmed.replace("### ", "")}</h3>`); return; }
      if (trimmed.startsWith(">")) { let content = trimmed.substring(1).trim(); htmlOutput.push(`<blockquote class="border-l-4 border-amber-400 pl-4 italic text-amber-950 my-4 bg-amber-50 p-3.5 rounded-r-2xl leading-relaxed text-xs sm:text-sm shadow-2xs font-black">🎶 Lirik: ${content}</blockquote>`); return; }

      // 📊 PENAPIS JADUAL STRUKTUR 0 HINGGA 10
      if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
        if (trimmed.includes("---")) return; 
        let columns = trimmed.split("|").map(c => c.trim()).filter((c, i, arr) => i > 0 && i < arr.length - 1);
        
        if (!inTable) {
          htmlOutput.push('<div class="overflow-x-auto my-5 border-2 border-emerald-600/20 rounded-2xl bg-white shadow-xs max-w-md mx-auto w-full"><table class="w-full border-collapse text-xs sm:text-sm text-center"><thead><tr class="bg-emerald-500 text-white font-black border-b-2 border-emerald-600">');
          columns.forEach(col => htmlOutput.push(`<th class="p-3 font-black tracking-wide">${col}</th>`));
          htmlOutput.push('</tr></thead><tbody>');
          inTable = true;
        } else {
          htmlOutput.push('<tr class="border-b border-stone-100 last:border-0 odd:bg-stone-50/40 hover:bg-emerald-50/40 transition-colors">');
          columns.forEach(col => htmlOutput.push(`<td class="p-3 font-bold text-stone-700">${col}</td>`));
          htmlOutput.push('</tr>');
        }
        return;
      }

      if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
        if (!inList) { htmlOutput.push('<ul class="space-y-2 my-3 pl-1">'); inList = true; }
        let content = trimmed.substring(2); htmlOutput.push(`<li class="list-disc ml-5 text-xs sm:text-sm text-stone-600 leading-relaxed font-bold">${content}</li>`); return;
      }

      htmlOutput.push(`<p class="text-xs sm:text-sm text-stone-700 font-bold leading-relaxed mb-3">${trimmed}</p>`);
    });

    if (inList) htmlOutput.push("</ul>");
    if (inTable) htmlOutput.push("</tbody></table></div>");

    let finalHtml = htmlOutput.join("\n");
    // 🎯 PENAPIS TULISAN BOLD YANG SEBENARNYA (DIBAIKI)
    finalHtml = finalHtml.replace(/\*\*(.*?)\*\*/g, '<strong class="font-black text-emerald-950 bg-amber-200/70 px-1.5 py-0.5 rounded-md">$1</strong>');
    finalHtml = finalHtml.replace(/\*(.*?)\*/g, '<em class="italic text-stone-800 font-semibold">$1</em>');
    return finalHtml;
  };

  if (loading) return (<div className="flex flex-col items-center justify-center min-h-[50vh] bg-[#FAF8F5]"><Loader2 className="w-10 h-10 text-emerald-500 animate-spin" /></div>);
  const videoSumberUtama = videoUrl || topic?.video_url;

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto space-y-5 pb-24 font-sans bg-[#FAF8F5] min-h-screen selection:bg-emerald-200">
      {/* GLOBAL HEADER BAR */}
      {activeTab === "map" ? (
        <div className="bg-white rounded-2xl p-4 border-2 border-emerald-600/30 shadow-[0_4px_0_rgba(16,185,129,0.1)] flex items-center justify-between transition-all duration-300">
          <div className="flex items-center gap-3">
            <Link to={`/study/${subjectId}`} className="p-2.5 bg-[#F3EFE6] rounded-xl text-stone-700 hover:bg-[#E3D9C6] shadow-2xs transition-all active:scale-95">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h2 className="text-[10px] font-black text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                <Compass className="w-3 h-3 animate-spin-slow" /> {subject?.name || "Dunia Kembara"}
              </h2>
              <h1 className="text-sm font-black text-stone-800 flex items-center gap-1.5">
                🗺️ Misi Rimba: {topic?.name}
              </h1>
            </div>
          </div>
          <div className="bg-gradient-to-r from-amber-400 to-emerald-500 px-4 py-2 rounded-xl text-white font-black text-xs shadow-sm border border-emerald-600/20">
            <Leaf className="w-4 h-4 fill-amber-200 inline mr-1 animate-pulse" /> {progressState.xp_earned} XP Padu!
          </div>
        </div>
      ) : (
        <div className="bg-stone-950 text-stone-200 rounded-xl p-3 flex items-center justify-between shadow-md transition-all duration-300 animate-in fade-in">
          <button 
            type="button" 
            onClick={() => {
              if (window.speechSynthesis) window.speechSynthesis.cancel();
              setIsSpeaking(false);
              setActiveTab("map");
            }} 
            className="flex items-center gap-1.5 text-xs font-black text-stone-200 hover:text-white bg-stone-900/80 px-4 py-1.5 rounded-xl border border-stone-700 shadow-xs transition-all active:scale-95"
          >
            🚪 Keluar Skrin Fokus
          </button>
          <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 truncate max-w-[50%] flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-400" /> Mod Fokus Kalis Gangguan
          </span>
        </div>
      )}

      {isTopicUnlocked && activeTab === "map" && (
        <div className="bg-emerald-50 border-2 border-emerald-200 p-3.5 rounded-xl text-xs font-bold text-emerald-900 shadow-2xs flex items-center gap-2">
          🌳 <span><b>Mod Jelajah Bebas Aktif!</b> Semua laluan rimba kini terbuka luas untuk anda teroka kembali, Bah!</span>
        </div>
      )}

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

        {/* STAGE 1: TAKLIMAT VIDEO */}
        {activeTab === "video" && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-stone-200 shadow-md space-y-4">
            <div className="border-b-2 border-stone-100 pb-2">
              <h3 className="text-sm font-black text-stone-800 flex items-center gap-1.5">🎬 Langkah 1: Taklimat Awal Kembara</h3>
            </div>
            <YouTubeLesson videoUrl={videoSumberUtama} isCompleted={progressState.video_completed} onCompleted={handleVideoStageCompleted} />
            {progressState.video_completed && (
              <Button 
                onClick={() => setActiveTab("map")} 
                className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 font-black rounded-xl text-white text-xs shadow-[0_4px_0_#047857] active:translate-y-1 active:shadow-none border-0 transition-all"
              >
                Kembali ke Peta Rimba Ilmu 🗺️
              </Button>
            )}
          </motion.div>
        )}

        {/* STAGE 2: KIT NOTA KHAZANAH */}
        {activeTab === "lesson" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl p-5 border-2 border-stone-200 shadow-md space-y-4">
            <div className="border-b-2 border-stone-100 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-sm font-black text-stone-800 flex items-center gap-1.5">📜 Langkah 2: Kit Nota Khazanah</h3>
              {notesContent && (
                <Button
                  onClick={() => urusSuaraNota(notesContent)}
                  className={`h-9 text-xs font-black rounded-xl border-0 transition-all shadow-xs flex items-center gap-2 px-4 ${
                    isSpeaking ? "bg-red-500 hover:bg-red-600 text-white animate-pulse" : "bg-amber-400 hover:bg-amber-500 text-stone-900 shadow-[0_3px_0_#d97706]"
                  }`}
                >
                  {isSpeaking ? "🛑 Berhenti" : "🔊 Dengar Suara Oki"}
                </Button>
              )}
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-4 border-2 border-stone-200/80 rounded-2xl bg-stone-50/50 shadow-inner flex flex-col items-center">
              {notesImage && (<img src={notesImage} alt="Infografik Nota" className="w-full max-w-sm h-auto rounded-xl border border-stone-200 shadow-xs mb-5 bg-white" />)}
              <div className="w-full text-left">
                {notesContent ? (
                  <div dangerouslySetInnerHTML={{ __html: parseMarkdownToHTML(notesContent) }} className="space-y-1 w-full" />
                ) : (
                  (!notesImage) && <p className="text-xs text-stone-400 text-center py-6 font-bold">Nota khazanah belum disediakan.</p>
                )}
              </div>
            </div>
            <Button 
              onClick={() => {
                if (window.speechSynthesis) window.speechSynthesis.cancel();
                setIsSpeaking(false);
                handleLessonStageCompleted();
              }} 
              className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black rounded-xl shadow-[0_4px_0_#047857] active:translate-y-1 active:shadow-none border-0 transition-all"
            >
              Selesai Hadam Nota! Simpan dalam Beg 🎒
            </Button>
          </motion.div>
        )}

        {/* STAGE 3: KAD KILAT */}
        {activeTab === "flashcard" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl p-5 border-2 border-stone-200 shadow-md space-y-4">
            <div className="border-b-2 border-stone-100 pb-2">
              <h3 className="text-sm font-black text-stone-800 flex items-center gap-1.5">⚡ Langkah 3: Ujian Kad Kilat</h3>
            </div>
            <Flashcards flashcards={flashcards || []} lang={getLanguageMode()} />
            <Button 
              onClick={() => updateStageProgress("flashcard", "mindmap", 15).then(() => setActiveTab("map"))} 
              className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black rounded-xl shadow-[0_4px_0_#047857] active:translate-y-1 active:shadow-none border-0 mt-2 transition-all"
            >
              Ulangkaji Selesai! Teruskan Kembara 🚀
            </Button>
          </motion.div>
        )}

        {/* STAGE 4: PETA MINDA */}
        {activeTab === "mindmap" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl p-5 border-2 border-stone-200 shadow-md space-y-4">
            <div className="border-b-2 border-stone-100 pb-2">
              <h3 className="text-sm font-black text-stone-800 flex items-center gap-1.5">🗺️ Langkah 4: Peta Minda Terbang Tinggi</h3>
            </div>
            <div className="min-h-[50vh] bg-[#FAF8F5] rounded-xl p-3 border-2 border-stone-200 flex flex-col items-center justify-center">
              {infographicUrl ? (
                <img src={infographicUrl} alt="Mindmap" className="w-full h-auto rounded-xl max-h-[60vh] object-contain bg-white border shadow-2xs" />
              ) : (
                <MindMap mindMap={{ central_topic: topic?.name || "Utama", branches: mindMap || [] }} lang={getLanguageMode()} />
              )}
            </div>
            <Button 
              onClick={() => updateStageProgress("mindmap", "quiz", 15).then(() => setActiveTab("map"))} 
              className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black rounded-xl shadow-[0_4px_0_#047857] active:translate-y-1 active:shadow-none border-0 mt-2 transition-all"
            >
              Selesai Teroka Peta Ilmu! Jom Cari Boss ⚔️
            </Button>
          </motion.div>
        )}
        {/* STAGE 3.5: MISI MEMORI RIMBA */}
{activeTab === "memory" && (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl p-5 border-2 border-stone-200 shadow-md space-y-4">
    <JungleMemory 
      questions={rawBankQuestions} 
      onComplete={() => updateStageProgress("flashcard", "mindmap", 15).then(() => setActiveTab("map"))} 
    />
  </motion.div>
)}

        {/* STAGE 5: KUIZ BOSS PADU */}
        {activeTab === "quiz" && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-gradient-to-br from-amber-50 to-orange-100/70 rounded-2xl p-5 border-2 border-amber-300 shadow-md">
            <div className="space-y-4 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center gap-2 justify-center sm:justify-start">
                <Trophy className="w-6 h-6 text-orange-500 animate-bounce" />
                <h3 className="text-base font-black text-stone-900">⚔️ Peringkat Akhir: Ujian Boss Padu</h3>
              </div>
              
              <p className="text-xs text-stone-700 font-bold leading-relaxed">
                Anda sudah sampai di kemuncak gunung ilmu ini! Sedia menewaskan Boss Padu untuk menawan lencana subjek dan membuktikan kebijaksanaan anda? 🏆
              </p>

              {savedQuizProgress && (
                <div className="p-3 bg-emerald-50 border-2 border-emerald-400/50 rounded-2xl shadow-sm text-left border-dashed">
                  <p className="text-[11px] text-emerald-950 font-black mb-2 flex items-center gap-1">
                    ⚡ Sistem mengesan perlawanan tergantung!
                  </p>
                  <Button 
                    onClick={() => runQuizGeneration(savedQuizProgress.limit, true)}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white h-12 text-xs font-black rounded-xl border-0 shadow-[0_4px_0_#047857] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-white" /> Sambung Pertempuran (Soalan Ke-{savedQuizProgress.questionIndex + 1})
                  </Button>
                </div>
              )}

              <div className="border-t border-stone-200/60 pt-3">
                <p className="text-[10px] text-stone-500 font-black mb-2 uppercase tracking-wide text-center sm:text-left">Atau Mulakan Misi Baharu:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Button 
                    onClick={() => runQuizGeneration(10)} 
                    disabled={status.quiz} 
                    className="bg-amber-500 hover:bg-amber-600 text-white h-14 text-xs font-black rounded-xl w-full border-0 shadow-[0_4px_0_#d97706] active:translate-y-1 active:shadow-none transition-all disabled:opacity-50"
                  >
                    {status.quiz ? "Menyeru Boss..." : "⚡ Misi Kilat Baru (10 Soalan)"}
                  </Button>
                  <Button 
                    onClick={() => runQuizGeneration(20)} 
                    disabled={status.quiz} 
                    className="bg-orange-500 hover:bg-orange-600 text-white h-14 text-xs font-black rounded-xl w-full border-0 shadow-[0_4px_0_#c2410c] active:translate-y-1 active:shadow-none transition-all disabled:opacity-50"
                  >
                    {status.quiz ? "Menyeru Boss..." : "⚔️ Lawan Boss Padu Baru (20 Soalan)"}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}