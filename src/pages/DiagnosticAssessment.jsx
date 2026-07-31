import React, { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useStudentData } from "@/hooks/useStudentData";
import {
  DIAGNOSTIC_MODULES_META,
  getMasteryEmoji,
  getMasteryLabel,
} from "@/lib/diagnosticQuestionBank";
import {
  getScreeningQuestions,
  analyzeScreeningResults,
  getInvestigationQuestions,
  calculateSkillProfiles,
  generateLearningPath,
  calculateModuleResult,
} from "@/lib/adaptiveDiagnostic";
import DiagnosticQuestion from "@/components/diagnostic/DiagnosticQuestion";
import { Loader2, Trophy, X, ChevronRight, PartyPopper, Search, Brain } from "lucide-react";
import confetti from "canvas-confetti";
import { saveDiagnosticSession, getDiagnosticSession, clearDiagnosticSession } from "@/lib/sessionCache";

// Map question bank format to component-expected format
function mapQuestionForComponent(q) {
  const content = typeof q.question_content === "string"
    ? JSON.parse(q.question_content)
    : q.question_content;
  return {
    id: q.id || q.question_id,
    type: q.question_type,
    question: content.question,
    display: content.display,
    options: content.options,
    correct: content.correct,
    prompt: content.prompt,
    instruction: content.instruction,
    _meta: {
      question_id: q.id || q.question_id,
      subject: q.subject,
      skill: q.skill,
      sub_skill: q.sub_skill,
      difficulty: q.difficulty,
      layer: q.layer,
    },
  };
}

export default function DiagnosticAssessment() {
  const navigate = useNavigate();
  const { studentId } = useStudentData();

  const [phase, setPhase] = useState("module_intro");
  const [moduleIndex, setModuleIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [saving, setSaving] = useState(false);

  const [currentQuestions, setCurrentQuestions] = useState([]);
  const [currentLayer, setCurrentLayer] = useState("screening");

  const allResponsesRef = useRef([]);
  const uploadedImagesRef = useRef([]);
  const voiceAnalysesRef = useRef([]);
  const handwritingAnalysesRef = useRef([]);
  const [moduleResults, setModuleResults] = useState({});
  const [lastModuleResult, setLastModuleResult] = useState(null);
  const [weakSkillCount, setWeakSkillCount] = useState(0);

  const currentModule = DIAGNOSTIC_MODULES_META[moduleIndex];
  const currentQuestion = currentQuestions[questionIndex];

  // ✅ Pulihkan sesi diagnostik dari cache pada mount pertama
  const restoredRef = useRef(false);
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    const cached = getDiagnosticSession();
    if (!cached) return;

    if (typeof cached.moduleIndex === "number") setModuleIndex(cached.moduleIndex);
    if (typeof cached.questionIndex === "number") setQuestionIndex(cached.questionIndex);
    if (cached.phase) setPhase(cached.phase);
    if (cached.currentLayer) setCurrentLayer(cached.currentLayer);
    if (cached.moduleResults) setModuleResults(cached.moduleResults);
    if (typeof cached.weakSkillCount === "number") setWeakSkillCount(cached.weakSkillCount);
    if (Array.isArray(cached.allResponses)) allResponsesRef.current = cached.allResponses;
    if (Array.isArray(cached.uploadedImages)) uploadedImagesRef.current = cached.uploadedImages;
    if (Array.isArray(cached.voiceAnalyses)) voiceAnalysesRef.current = cached.voiceAnalyses;
    if (Array.isArray(cached.handwritingAnalyses)) handwritingAnalysesRef.current = cached.handwritingAnalyses;

    // Jika ada sesi aktif dengan modul & layer, jana semula soalan untuk modul/layer tersebut
    if (cached.phase === "questioning" && cached.currentLayer) {
      const mod = DIAGNOSTIC_MODULES_META[cached.moduleIndex || 0];
      if (mod) {
        if (cached.currentLayer === "screening") {
          const screening = getScreeningQuestions(mod.id);
          setCurrentQuestions(screening.map(mapQuestionForComponent));
        } else if (cached.currentLayer === "investigation" && Array.isArray(cached.investigationQuestions)) {
          setCurrentQuestions(cached.investigationQuestions.map(mapQuestionForComponent));
        }
      }
    }
  }, []);

  // ✅ Auto-simpan sesi ke cache setiap kali state penting berubah
  useEffect(() => {
    if (phase === "saving") return; // jangan simpan semasa submitting
    saveDiagnosticSession({
      moduleIndex,
      questionIndex,
      phase,
      currentLayer,
      moduleResults,
      weakSkillCount,
      allResponses: allResponsesRef.current,
      uploadedImages: uploadedImagesRef.current,
      voiceAnalyses: voiceAnalysesRef.current,
      handwritingAnalyses: handwritingAnalysesRef.current,
      investigationQuestions: currentLayer === "investigation" ? currentQuestions : [],
    });
  }, [moduleIndex, questionIndex, phase, currentLayer, moduleResults, weakSkillCount, currentQuestions]);

  // ==========================================
  // ADAPTIVE FLOW LOGIC
  // ==========================================

  const startModule = useCallback(() => {
    const screening = getScreeningQuestions(currentModule.id);
    const mapped = screening.map(mapQuestionForComponent);
    setCurrentQuestions(mapped);
    setCurrentLayer("screening");
    setQuestionIndex(0);
    setPhase("questioning");
  }, [currentModule]);

  const handleAnswer = (isCorrect, metadata = {}) => {
    const qMeta = currentQuestion?._meta || {};

    allResponsesRef.current.push({
      question_id: qMeta.question_id,
      subject: qMeta.subject,
      skill: qMeta.skill,
      sub_skill: qMeta.sub_skill,
      is_correct: isCorrect,
      answer: metadata.answer || "",
      layer: currentLayer,
      image_url: metadata.imageUrl || null,
    });

    if (metadata.imageUrl) {
      uploadedImagesRef.current.push({
        skill: qMeta.skill,
        subject: qMeta.subject,
        layer: currentLayer,
        imageUrl: metadata.imageUrl,
        target: metadata.target || "",
        question: metadata.question || currentQuestion?.question || "",
      });
    }

    // Collect multimodal AI analyses
    if (metadata.ai_analysis) {
      if (metadata.audio_url || metadata.transcript) {
        voiceAnalysesRef.current.push({
          question_id: qMeta.question_id,
          subject: qMeta.subject,
          skill: qMeta.skill,
          sub_skill: qMeta.sub_skill,
          target_text: metadata.target || "",
          transcript: metadata.transcript || "",
          audio_url: metadata.audio_url || null,
          pronunciation_accuracy: metadata.ai_analysis.pronunciation_accuracy || 0,
          fluency_score: metadata.ai_analysis.fluency_score || 0,
          confidence: metadata.ai_analysis.confidence || 0,
          is_correct: metadata.ai_analysis.is_correct ?? isCorrect,
          strength: metadata.ai_analysis.strength || "",
          needs_practice: metadata.ai_analysis.needs_practice || "",
          educational_feedback: metadata.ai_analysis.educational_feedback || "",
        });
      } else if (metadata.imageUrl) {
        handwritingAnalysesRef.current.push({
          question_id: qMeta.question_id,
          subject: qMeta.subject,
          skill: qMeta.skill,
          sub_skill: qMeta.sub_skill,
          target_text: metadata.target || "",
          image_url: metadata.imageUrl,
          letter_recognition: metadata.ai_analysis.letter_recognition || 0,
          writing_accuracy: metadata.ai_analysis.writing_accuracy || 0,
          spacing: metadata.ai_analysis.spacing || 0,
          alignment: metadata.ai_analysis.alignment || 0,
          completeness: metadata.ai_analysis.completeness || 0,
          overall_score: metadata.ai_analysis.overall_score || 0,
          is_correct: metadata.ai_analysis.is_correct ?? isCorrect,
          strength: metadata.ai_analysis.strength || "",
          needs_practice: metadata.ai_analysis.needs_practice || "",
          educational_feedback: metadata.ai_analysis.educational_feedback || "",
        });
      }
    }

    if (questionIndex + 1 < currentQuestions.length) {
      setQuestionIndex(questionIndex + 1);
    } else {
      handleLayerComplete();
    }
  };

  const handleLayerComplete = () => {
    if (currentLayer === "screening") {
      const moduleResponses = allResponsesRef.current.filter(
        (r) => r.subject === currentModule.id && r.layer === "screening"
      );
      const analysis = analyzeScreeningResults(moduleResponses, currentModule.id);

      if (analysis.weakSkills.length > 0) {
        setWeakSkillCount(analysis.weakSkills.length);
        const investigation = getInvestigationQuestions(analysis.weakSkills, currentModule.id);

        if (investigation.length > 0) {
          const mapped = investigation.map(mapQuestionForComponent);
          setCurrentQuestions(mapped);
          setCurrentLayer("investigation");
          setQuestionIndex(0);
          setPhase("investigation_intro");
          return;
        }
      }

      finalizeModule();
    } else {
      finalizeModule();
    }
  };

  const startInvestigation = () => {
    setPhase("questioning");
  };

  const finalizeModule = () => {
    const moduleResponses = allResponsesRef.current.filter(
      (r) => r.subject === currentModule.id
    );
    const moduleProfiles = calculateSkillProfiles(moduleResponses);
    const result = calculateModuleResult(currentModule.id, moduleProfiles);

    setModuleResults((prev) => ({ ...prev, [currentModule.id]: result }));
    setLastModuleResult(result);
    setPhase("module_complete");

    if (result.mastery === "strong" || result.score >= 75) {
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
    }
  };

  const handleNextModule = () => {
    if (moduleIndex + 1 < DIAGNOSTIC_MODULES_META.length) {
      setModuleIndex(moduleIndex + 1);
      setQuestionIndex(0);
      setCurrentQuestions([]);
      setWeakSkillCount(0);
      setPhase("module_intro");
    } else {
      saveResults();
    }
  };

  const saveResults = async () => {
    setSaving(true);
    setPhase("saving");
    try {
      const allResponses = allResponsesRef.current;
      const skillProfiles = calculateSkillProfiles(allResponses);
      const learningPath = generateLearningPath(skillProfiles);

      const finalModuleResults = {};
      for (const mod of DIAGNOSTIC_MODULES_META) {
        finalModuleResults[mod.id] = calculateModuleResult(mod.id, skillProfiles);
      }

      const response = await base44.functions.invoke("runDiagnosticAnalysis", {
        student_id: studentId,
        responses: allResponses,
        skill_profiles: skillProfiles,
        learning_path: learningPath,
        uploaded_images: uploadedImagesRef.current,
        module_results: finalModuleResults,
        voice_analyses: voiceAnalysesRef.current,
        handwriting_analyses: handwritingAnalysesRef.current,
      });

      if (response.data?.success) {
        clearDiagnosticSession();
        confetti({ particleCount: 200, spread: 90, origin: { y: 0.6 } });
        setTimeout(() => {
          navigate(`/diagnostic/result/${response.data.session_id}`, {
            state: {
              analysis: response.data.analysis,
              learningPath: response.data.learning_path,
              skillProfiles: response.data.skill_profiles,
              moduleResults: response.data.module_results,
              overallScore: response.data.overall_score,
            },
          });
        }, 1500);
      } else {
        throw new Error(response.data?.error || "Gagal menyimpan keputusan.");
      }
    } catch (err) {
      console.error("Save error:", err);
      navigate("/dashboard");
    }
  };

  // ==========================================
  // RENDER
  // ==========================================

  if (phase === "saving") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-900 via-green-900 to-stone-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          {saving ? (
            <>
              <Loader2 className="w-12 h-12 text-amber-400 animate-spin mx-auto" />
              <p className="text-sm font-black text-emerald-200">
                Suku sedang menyimpan keputusan kamu...
              </p>
            </>
          ) : (
            <>
              <PartyPopper className="w-16 h-16 text-amber-400 mx-auto" />
              <p className="text-lg font-black text-white">Misi Selesai! 🎉</p>
            </>
          )}
        </div>
      </div>
    );
  }

  const moduleGradient = currentModule.id === "membaca"
    ? "from-emerald-500 to-green-500"
    : currentModule.id === "menulis"
    ? "from-blue-500 to-indigo-500"
    : "from-amber-500 to-orange-500";

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-900 via-green-900 to-stone-950 font-body text-stone-100 pb-24">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Top Bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/dashboard")}
            className="p-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-2xl transition-all border border-stone-600 active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            {DIAGNOSTIC_MODULES_META.map((mod, i) => (
              <div
                key={mod.id}
                className={`h-2.5 rounded-full transition-all ${
                  i === moduleIndex ? "bg-amber-400 w-10" : i < moduleIndex ? "bg-emerald-500 w-6" : "bg-stone-700 w-4"
                }`}
              />
            ))}
          </div>
          <span className="text-xs font-black text-stone-400">
            {moduleIndex + 1}/{DIAGNOSTIC_MODULES_META.length}
          </span>
        </div>

        {/* Suku Mascot */}
        <div className="flex items-center gap-3 bg-stone-900/60 border-2 border-stone-700 rounded-3xl p-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-2xl shrink-0">
            🐢
          </div>
          <p className="text-xs sm:text-sm font-bold text-emerald-200 leading-snug">
            {phase === "module_intro" && `Mari kita mulakan Modul ${currentModule.title}! Suku akan bantu kamu.`}
            {phase === "questioning" && currentLayer === "screening" && `Saringan Kemahiran! Jawab soalan dengan tenang ya.`}
            {phase === "investigation_intro" && `Suku jumpa beberapa kemahiran yang perlu diterokai! Mari siasat bersama!`}
            {phase === "questioning" && currentLayer === "investigation" && `Siasatan Kemahiran! Suku beri soalan yang lebih khusus.`}
            {phase === "module_complete" && `Bagus! Kamu dah selesaikan Modul ${currentModule.title}.`}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {/* MODULE INTRO */}
          {phase === "module_intro" && (
            <motion.div
              key={`intro-${moduleIndex}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-stone-900/80 rounded-3xl p-6 border-2 border-stone-700 shadow-xl text-center space-y-4"
            >
              <div className="text-6xl">{currentModule.icon}</div>
              <div>
                <h2 className="text-xl font-black text-white">{currentModule.title}</h2>
                <p className="text-sm text-stone-400 mt-1">{currentModule.subtitle}</p>
              </div>
              <div className="bg-stone-800/60 rounded-2xl p-4 space-y-2">
                <p className="text-xs font-black text-stone-400 uppercase tracking-wider">Kemahiran yang akan diterokai:</p>
                {currentModule.skills.map((skill) => (
                  <div key={skill} className="flex items-center gap-2 text-left">
                    <span className="text-sm">{currentModule.skillDisplayNames[skill]}</span>
                  </div>
                ))}
              </div>
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3">
                <p className="text-[11px] text-amber-200 font-bold">
                  🧠 Suku akan mulakan dengan Saringan ringkas, kemudian beri soalan khas jika perlu!
                </p>
              </div>
              <button
                onClick={startModule}
                className={`w-full py-3.5 bg-gradient-to-r ${moduleGradient} text-stone-950 font-black text-base rounded-2xl border-b-4 border-black/30 active:translate-y-1 transition-all`}
              >
                Mula Modul {currentModule.title}! 🚀
              </button>
            </motion.div>
          )}

          {/* INVESTIGATION INTRO */}
          {phase === "investigation_intro" && (
            <motion.div
              key={`inv-${moduleIndex}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-stone-900/80 rounded-3xl p-6 border-2 border-amber-500/40 shadow-xl text-center space-y-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/20 border-2 border-amber-400/40 flex items-center justify-center">
                  <Search className="w-8 h-8 text-amber-400" />
                </div>
              </motion.div>
              <div>
                <h2 className="text-lg font-black text-white">Siasatan Kemahiran</h2>
                <p className="text-sm text-stone-400 mt-1">
                  Suku jumpa {weakSkillCount} kemahiran yang perlu diterokai lebih mendalam.
                  Mari buat beberapa soalan khusus!
                </p>
              </div>
              <button
                onClick={startInvestigation}
                className={`w-full py-3.5 bg-gradient-to-r ${moduleGradient} text-stone-950 font-black text-base rounded-2xl border-b-4 border-black/30 active:translate-y-1 transition-all flex items-center justify-center gap-2`}
              >
                <Brain className="w-5 h-5" />
                Mula Siasatan!
              </button>
            </motion.div>
          )}

          {/* QUESTIONING */}
          {phase === "questioning" && currentQuestion && (
            <motion.div
              key={`q-${moduleIndex}-${questionIndex}-${currentLayer}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-stone-900/80 rounded-3xl p-5 border-2 border-stone-700 shadow-xl"
            >
              <div className="mb-4 text-center">
                <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest">
                  {currentModule.icon} {currentModule.title} · {currentLayer === "screening" ? "Saringan" : "Siasatan"}
                </span>
                <p className="text-sm font-bold text-stone-300 mt-0.5">
                  Soalan {questionIndex + 1} / {currentQuestions.length}
                </p>
              </div>
              {/* Progress bar */}
              <div className="h-1.5 bg-stone-800 rounded-full mb-4 overflow-hidden">
                <motion.div
                  className={`h-full bg-gradient-to-r ${moduleGradient}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${((questionIndex + 1) / currentQuestions.length) * 100}%` }}
                />
              </div>
              <DiagnosticQuestion
                key={currentQuestion.id}
                question={currentQuestion}
                questionNumber={questionIndex + 1}
                totalQuestions={currentQuestions.length}
                onAnswerNext={handleAnswer}
              />
            </motion.div>
          )}

          {/* MODULE COMPLETE */}
          {phase === "module_complete" && lastModuleResult && (
            <motion.div
              key={`module-${moduleIndex}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-stone-900/80 rounded-3xl p-6 border-2 border-stone-700 shadow-xl space-y-5"
            >
              <div className="text-center space-y-2">
                <Trophy className="w-14 h-14 text-amber-400 mx-auto" />
                <h2 className="text-xl font-black text-white">Modul {currentModule.title} Selesai!</h2>
              </div>

              <div className={`bg-gradient-to-br ${moduleGradient} rounded-2xl p-5 text-center border-2 ${currentModule.borderColor}`}>
                <div className="text-3xl mb-1">{getMasteryEmoji(lastModuleResult.mastery)}</div>
                <p className="text-xs font-bold text-white/80 uppercase tracking-wider">Tahap {currentModule.title}</p>
                <p className="text-3xl font-black text-white mt-1">{lastModuleResult.level}/{currentModule.levelMax}</p>
                <p className="text-sm font-bold text-white/90 mt-1">{getMasteryLabel(lastModuleResult.mastery)}</p>
                <p className="text-xs text-white/60 mt-1">Skor: {lastModuleResult.score}%</p>
              </div>

              {weakSkillCount > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 flex items-center gap-2">
                  <Search className="w-4 h-4 text-amber-400 shrink-0" />
                  <p className="text-[11px] text-amber-200 font-bold">
                    Suku beri {weakSkillCount} soalan siasatan untuk kenal pasti kemahiran kamu dengan lebih tepat!
                  </p>
                </div>
              )}

              <button
                onClick={handleNextModule}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-base rounded-2xl border-b-4 border-amber-700 active:translate-y-1 transition-all flex items-center justify-center gap-2"
              >
                {moduleIndex + 1 < DIAGNOSTIC_MODULES_META.length ? (
                  <>
                    Teruskan ke Modul {DIAGNOSTIC_MODULES_META[moduleIndex + 1].title}
                    <ChevronRight className="w-5 h-5" />
                  </>
                ) : (
                  <>
                    <Trophy className="w-5 h-5" />
                    Lihat Keputusan Saya!
                  </>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}