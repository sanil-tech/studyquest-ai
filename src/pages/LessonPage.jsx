// src/pages/LessonPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Sparkles, Play, Loader2, Trophy, BookOpen, Layers, GitFork, Lock, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";

import LessonProgress from "@/components/lesson/LessonProgress";
import LessonContent from "@/components/lesson/LessonContent";
import VoicePlayer from "@/components/lesson/VoicePlayer";
import Flashcards from "@/components/lesson/Flashcards";
import MindMap from "@/components/lesson/MindMap";

const BASE_SYSTEM_PROMPT = `You are an expert AI tutor for Malaysian school students. Strict compliance with KPM curriculum standards (KSSR for primary, KSSM for secondary) is required. Ensure all names, places, and examples reflect local Malaysian contexts (RM currency, local foods like nasi lemak, cultural festivals).`;

const FORMAT_CONSTRAINTS = {
  ms: "Tulis SELURUH kandungan dalam Bahasa Melayu sahaja. JANGAN gunakan perkataan Bahasa Inggeris.",
  en: "Write the ENTIRE content in English only."
};

const LESSON_PROMPT = (topic, subject, level, lang, studentNickname) => `
${BASE_SYSTEM_PROMPT}
${FORMAT_CONSTRAINTS[lang]}
Target: Malaysian ${level}. Subject: ${subject}. Topic: "${topic}".
CRITICAL TONE INSTRUCTION: The student's personalized friendly nickname is "${studentNickname}". Tone must be exceptionally warm and encouraging.
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

const getMalaysianISOString = () => {
  const tzoffset = (new Date()).getTimezoneOffset() * 60000;
  return (new Date(Date.now() - tzoffset)).toISOString();
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
  const [currentUserId, setCurrentUserId] = useState(null);

  const [explanation, setExplanation] = useState("");
  const [metaData, setMetaData] = useState({ summary: "", keywords: [] });
  const [flashcards, setFlashcards] = useState(null);
  const [mindMap, setMindMap] = useState(null);
  const [rawBankQuestions, setRawBankQuestions] = useState([]);

  const [activeTab, setActiveTab] = useState("lesson"); 
  const [status, setStatus] = useState({ lesson: false, flashcards: false, mindmap: false, quiz: false });

  const studyStartRef = useRef(null);
  const sessionRef = useRef(null);

  useEffect(() => { sessionRef.current = sessionId; }, [sessionId]);

  const tentukanPanggilanMesra = (userObj, formLevel) => {
    const customNickname = userObj?.nickname || userObj?.profile?.nickname;
    if (customNickname?.trim()) return customNickname.trim();
    const namaPenuh = userObj?.name || userObj?.display_name || userObj?.profile?.name;
    if (namaPenuh?.trim()) {
      const namaPertama = namaPenuh.trim().split(" ")[0];
      if (namaPertama && !namaPertama.includes("@")) return namaPertama;
    }
    return "Bintang";
  };

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
        setCurrentUserId(user.id);
        setStudentNickname(tentukanPanggilanMesra(user, top?.form_level));
        setIsPremium(user?.is_premium || user?.profile?.is_premium || false);

        // 🛠️ PERBAIKAN PADANAN: Cari bank soalan induk secara fleksibel
        const allQuizBanks = await base44.entities.Quiz.filter({});
        if (allQuizBanks && allQuizBanks.length > 0) {
          const namaTopikSemasa = top.name.toLowerCase().replace(/[^a-zA-Z0-9]/g, "").trim();
          
          const foundBank = allQuizBanks.find(bank => {
            if (bank.session_id) return false; // Abaikan kuiz dinamik pelajar
            const namaBank = (bank.topic_name || "").toLowerCase().replace(/[^a-zA-Z0-9]/g, "").trim();
            return namaBank.includes(namaTopikSemasa) || namaTopikSemasa.includes(namaBank);
          });

          if (foundBank) {
            let parsedQs = [];
            if (typeof foundBank.questions_json === "string") {
              parsedQs = JSON.parse(foundBank.questions_json || "[]");
            } else if (Array.isArray(foundBank.questions_json)) {
              parsedQs = foundBank.questions_json;
            }
            setRawBankQuestions(parsedQs);
            console.log(`🎯 Bank soalan induk dipadankan! Sedia dengan ${parsedQs.length} soalan.`);
          }
        }

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
            
            if (session.mindmap_json) setMindMap(JSON.parse(session.mindmap_json));
            if (session.flashcards_json) setFlashcards(JSON.parse(session.flashcards_json));
          }
        }
      } catch (err) {
        console.error("Initialization failed", err);
      } finally {
        studyStartRef.current = Date.now();
        setLoading(false);
      }
    };
    initializeLesson();
  }, [subjectId, topicId]);

  const ensureActiveSession = async () => {
    if (sessionRef.current) return sessionRef.current;
    try {
      console.log("⚠️ Mengaktifkan Sesi Pembelajaran Segera...");
      const session = await base44.entities.StudySession.create({
        student_id: currentUserId,
        subject_id: subjectId,
        topic_id: topicId,
        topic_name: topic?.name || "Topik Pelajaran",
        subject_name: subject?.name || "Subjek",
        duration_minutes: 1,
        created_date: getMalaysianISOString()
      });
      setSessionId(session.id);
      return session.id;
    } catch (err) {
      console.error("Gagal mencipta sesi kecemasan", err);
      return null;
    }
  };

  const recordStudyTime = async () => {
    if (!sessionRef.current || !studyStartRef.current) return;
    const minutes = Math.max(1, Math.round((Date.now() - studyStartRef.current) / 60000));
    try { 
      await base44.entities.StudySession.update(sessionRef.current, { duration_minutes: minutes }); 
    } catch (err) { 
      console.warn(err); 
    }
  };

  useEffect(() => { return () => { recordStudyTime(); }; }, []);

  const getLanguageMode = () => subject?.name?.toLowerCase().includes("english") ? "en" : "ms";

  const generateCoreLesson = async () => {
    setStatus(p => ({ ...p, lesson: true }));
    try {
      const config = await getContextConfiguration();
      const lang = getLanguageMode();

      const response = await base44.integrations.Core.InvokeLLM({
        model: "gemini_3_flash", 
        add_context_from_internet: !!config.useInternet,
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
        student_id: currentUserId,
        subject_id: subjectId,
        topic_id: topicId,
        topic_name: topic.name,
        subject_name: subject.name,
        ai_explanation: JSON.stringify(response),
        duration_minutes: 0,
        created_date: getMalaysianISOString() 
      });

      setSessionId(session.id);
      studyStartRef.current = Date.now(); 
      setExplanation(response.lesson_markdown);
      setMetaData({ summary: response.summary, keywords: response.keywords });
      
      confetti({ particleCount: 100, spread: 60 });
    } catch (e) {
      console.error(e);
    } finally { 
      setStatus(p => ({ ...p, lesson: false })); 
    }
  };

  const loadFlashcardsOnDemand = async () => {
    if (flashcards && flashcards.length > 0) return;
    if (status.flashcards) return;
    setStatus(p => ({ ...p, flashcards: true }));
    
    const validSessionId = await ensureActiveSession();

    try {
      if (rawBankQuestions && rawBankQuestions.length > 0) {
        const shuffled = shuffleArray(rawBankQuestions);
        const selectedQuestions = shuffled.slice(0, 8);
        const mappedCards = selectedQuestions.map(q => ({
          front: q.question || "Sila jawab soalan ini:",
          back: `${q.correct_answer || "Tiada jawapan"}\n\n${q.explanation || ""}`
        }));
        setFlashcards(mappedCards);
        if (validSessionId) await base44.entities.StudySession.update(validSessionId, { flashcards_json: JSON.stringify(mappedCards) });
        setStatus(p => ({ ...p, flashcards: false }));
        return; 
      } 
      
      const res = await base44.integrations.Core.InvokeLLM({
        model: "gemini_3_flash",
        prompt: `Based on the topic: "${topic?.name || "Pelajaran"}", generate exactly 5 educational flashcards. Return JSON schema matching: [{ "front": "string", "back": "string" }]`,
      });

      if (res && Array.isArray(res) && res.length > 0) {
        setFlashcards(res);
        if (validSessionId) await base44.entities.StudySession.update(validSessionId, { flashcards_json: JSON.stringify(res) });
      }
    } catch (err) {
      console.error(err);
    } finally { setStatus(p => ({ ...p, flashcards: false })); }
  };

  const runQuizGeneration = async (mode) => {
    if (status.quiz) return;
    setStatus(p => ({ ...p, quiz: true }));
    await recordStudyTime();

    // 🛠️ PERBAIKAN HILANG SESI: Pastikan session_id wujud sebelum mencipta rekod kuiz
    const validSessionId = await ensureActiveSession();
    if (!validSessionId) {
      alert("Gagal memulakan sesi kuiz. Sila muatkan semula halaman.");
      setStatus(p => ({ ...p, quiz: false }));
      return;
    }

    const isBossMode = mode === "boss";
    const targetNumQuestions = isBossMode ? 20 : 10;
    const determinedDifficulty = isBossMode ? "hard" : "medium";

    try {
      // KATEGORI 1: GUNA BANK SOALAN (UTAMA)
      if (rawBankQuestions && rawBankQuestions.length > 0) {
        let filteredPool = [...rawBankQuestions];

        if (isBossMode) {
          const hardQuestions = rawBankQuestions.filter(q => 
            q.difficulty?.toLowerCase() === "hard" || 
            q.difficulty?.toLowerCase() === "medium" || 
            q.difficulty?.toLowerCase() === "kbat"
          );
          if (hardQuestions.length > 0) filteredPool = hardQuestions;
        }

        const shuffledQuestions = shuffleArray(filteredPool);
        const selectedPool = shuffledQuestions.slice(0, Math.min(targetNumQuestions, shuffledQuestions.length));

        const validatedQuestions = selectedPool.map(q => ({
          question: q.question,
          options: Array.isArray(q.options) ? q.options : [q.option_a, q.option_b, q.option_c, q.option_d].filter(Boolean),
          correct_answer: q.correct_answer,
          explanation: q.explanation || ""
        }));

        const quiz = await base44.entities.Quiz.create({
          session_id: validSessionId,
          topic_name: topic.name,
          subject_name: subject?.name || "Subjek",
          questions_json: JSON.stringify(validatedQuestions),
          difficulty: determinedDifficulty,
          num_questions: validatedQuestions.length,
          created_date: getMalaysianISOString()
        });
        
        navigate(`/quiz/${quiz.id}`, { state: { fromSessionId: validSessionId, studyStartTime: Date.now() } });
        return;
      } 
      
      // KATEGORI 2: KOSONG? BARU GUNAKAN AI (BACKUP)
      else {
        const lang = getLanguageMode();
        let aiPrompt = isBossMode 
          ? `Based on the topic: "${topic?.name}", generate exactly 10 premium KBAT (High-Order Thinking) multiple-choice questions for Malaysian primary school. Difficulty: HARD. Language: ${lang === 'en' ? 'English' : 'Bahasa Melayu'}. Return JSON: [{ "question": "string", "options": ["string"], "correct_answer": "string", "explanation": "string" }]`
          : `Based on the topic: "${topic?.name}", generate exactly 10 multiple-choice questions. Difficulty: EASY/MEDIUM. Language: ${lang === 'en' ? 'English' : 'Bahasa Melayu'}. Return JSON: [{ "question": "string", "options": ["string"], "correct_answer": "string", "explanation": "string" }]`;
        
        const res = await base44.integrations.Core.InvokeLLM({
          model: "gemini_3_flash",
          prompt: aiPrompt,
        });
        
        if (res && Array.isArray(res) && res.length > 0) {
          const quiz = await base44.entities.Quiz.create({
            session_id: validSessionId,
            topic_name: isBossMode ? `${topic.name} [UJIAN BOSS 👑]` : topic.name,
            subject_name: subject?.name || "Subjek",
            questions_json: JSON.stringify(res.slice(0, 10)),
            difficulty: determinedDifficulty,
            num_questions: res.slice(0, 10).length,
            created_date: getMalaysianISOString()
          });
          
          navigate(`/quiz/${quiz.id}`, { state: { fromSessionId: validSessionId, studyStartTime: Date.now() } });
        } else {
          alert("Sistem AI sibuk sekejap, jom klik sekali lagi! ✨");
        }
      }
    } catch (err) {
      console.error(err);
      alert("Ada gangguan rangkaian kecil. Jom cuba lagi!");
    } finally {
      setStatus(p => ({ ...p, quiz: false }));
    }
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
        setMindMap(res);
        if (sessionId) await base44.entities.StudySession.update(sessionId, { mindmap_json: JSON.stringify(res) });
      }
    } catch (err) { console.error(err); } finally { setStatus(p => ({ ...p, mindmap: false })); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-cyan-200 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-3 sm:px-4 py-6 max-w-md md:max-w-2xl lg:max-w-4xl mx-auto space-y-8 pb-24 bg-slate-50/50 min-h-screen">
      <div className="flex items-center gap-4 bg-gradient-to-r from-cyan-100 to-blue-100 p-4 sm:p-5 rounded-3xl border-2 border-cyan-200 shadow-sm">
        <Link to={`/study/${subjectId}`} className="p-3 bg-white rounded-2xl shadow-sm hover:bg-cyan-50 active:scale-90 transition-all">
          <ArrowLeft className="w-6 h-6 text-cyan-600" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold truncate text-slate-800">{topic?.name} 🌟</h1>
          <p className="text-cyan-700 font-medium text-xs sm:text-sm">{subject?.icon} {subject?.name} • {topic?.form_level}</p>
        </div>
      </div>

      {!explanation ? (
        <div className="text-center py-14 px-6 bg-white border-4 border-dashed border-primary/30 rounded-[2rem] max-w-md mx-auto">
          <Sparkles className="w-10 h-10 text-primary animate-pulse mx-auto mb-6" />
          <h2 className="text-xl font-bold mb-3">Hai {studentNickname}! 👋<br/>Sedia untuk belajar?</h2>
          <Button onClick={generateCoreLesson} disabled={status.lesson} className="w-full h-14 rounded-full font-bold bg-primary text-white">
            {status.lesson ? "Tunggu sekejap ya... 🪄" : "Mula Pengembaraan! 🚀"}
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="sticky top-2 z-30 bg-white/80 backdrop-blur-xl p-2 rounded-full shadow-md border flex gap-2 overflow-x-auto md:grid md:grid-cols-3">
            <Button size="sm" variant={activeTab === "lesson" ? "default" : "ghost"} onClick={() => setActiveTab("lesson")} className={`rounded-full py-6 md:w-full ${activeTab === "lesson" ? "bg-primary text-white" : ""}`}>Nota Pintar 📖</Button>
            <Button size="sm" variant={activeTab === "flashcards" ? "default" : "ghost"} onClick={() => { setActiveTab("flashcards"); loadFlashcardsOnDemand(); }} className={`rounded-full py-6 md:w-full ${activeTab === "flashcards" ? "bg-purple-500 text-white" : ""}`}>Kad Memori 🃏</Button>
            <Button size="sm" variant={activeTab === "mindmap" ? "default" : "ghost"} onClick={() => { setActiveTab("mindmap"); loadMindMapOnDemand(); }} className={`rounded-full py-6 md:w-full ${activeTab === "mindmap" ? "bg-blue-500 text-white" : ""}`}>Peta Minda 🧠</Button>
          </div>

          {activeTab === "lesson" && (
            <div className="bg-white rounded-[2rem] p-5 sm:p-8 border shadow-lg space-y-5">
              <h2 className="font-bold text-xl">✨ Nota Ringkas</h2>
              <LessonContent content={explanation} />
            </div>
          )}

          {activeTab === "flashcards" && (
            <div className="min-h-[250px] bg-purple-50/50 p-4 rounded-[2rem] border">
              {status.flashcards ? <div className="text-center py-16 text-purple-600"><Loader2 className="animate-spin mx-auto mb-4"/>Menyusun kad...</div> : <Flashcards flashcards={flashcards || []} />}
            </div>
          )}

          {activeTab === "mindmap" && (
            <div className="min-h-[250px] rounded-[2rem] bg-blue-50/30 border p-6">
              {status.mindmap ? <div className="text-center py-16 text-blue-600"><Loader2 className="animate-spin mx-auto mb-4"/>Melukis peta...</div> : mindMap ? <MindMap mindMap={{ central_topic: topic.name, branches: mindMap }} /> : null}
            </div>
          )}

          <div className="bg-gradient-to-br from-yellow-100 to-orange-100 rounded-[2rem] p-6 sm:p-8 border shadow-lg relative overflow-hidden">
            <h3 className="font-bold text-xl text-orange-900 mb-2">Uji Minda, {studentNickname}! 🎯</h3>
            <p className="text-sm text-orange-700 mb-6 font-medium">Jom uji kefahaman anak sekarang!</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button onClick={() => runQuizGeneration("quick")} disabled={status.quiz} size="lg" className="bg-orange-500 hover:bg-orange-600 text-white h-16 font-bold rounded-2xl w-full">
                {status.quiz ? <Loader2 className="animate-spin mr-2" /> : <Play className="w-5 h-5 mr-2" />} Cabaran Pantas (10 Soalan)
              </Button>
              <Button onClick={() => runQuizGeneration("boss")} disabled={status.quiz} size="lg" className="bg-red-500 hover:bg-red-600 text-white h-16 font-bold rounded-2xl w-full">
                {status.quiz ? <Loader2 className="animate-spin mr-2" /> : <Trophy className="w-5 h-5 mr-2" />} Ujian Boss (Aras Tinggi 🔥)
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}