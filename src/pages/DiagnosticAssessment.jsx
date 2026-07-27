import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { getActiveStudentId } from "@/lib/rewardSystem";
import {
  DIAGNOSTIC_MODULES,
  PASS_THRESHOLD,
  getMasteryLevel,
  getResultLevel,
  getMasteryEmoji,
  getMasteryLabel,
} from "@/lib/diagnosticQuestions";
import DiagnosticQuestion from "@/components/diagnostic/DiagnosticQuestion";
import { Loader2, CheckCircle2, Trophy, X, ChevronRight, PartyPopper } from "lucide-react";
import confetti from "canvas-confetti";

export default function DiagnosticAssessment() {
  const navigate = useNavigate();

  const [phase, setPhase] = useState("module_intro");
  const [moduleIndex, setModuleIndex] = useState(0);
  const [levelIndex, setLevelIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [saving, setSaving] = useState(false);

  const [currentLevelScores, setCurrentLevelScores] = useState([]);
  const [allModuleResults, setAllModuleResults] = useState({});
  const [lastLevelScore, setLastLevelScore] = useState(null);

  const levelAnswersRef = useRef([]);
  const uploadedImagesRef = useRef([]);

  const currentModule = DIAGNOSTIC_MODULES[moduleIndex];
  const currentLevel = currentModule.levels[levelIndex];
  const currentQuestion = currentLevel.questions[questionIndex];

  const handleAnswer = (isCorrect, metadata = {}) => {
    levelAnswersRef.current.push(isCorrect);

    if (metadata.imageUrl) {
      uploadedImagesRef.current.push({
        skill: currentLevel.skill,
        skillDisplayName: currentLevel.skillDisplayName,
        category: currentModule.id,
        level: currentLevel.level,
        imageUrl: metadata.imageUrl,
        target: metadata.target || "",
        question: metadata.question || "",
      });
    }

    if (levelAnswersRef.current.length < currentLevel.questions.length) {
      setQuestionIndex((prev) => prev + 1);
    } else {
      const correctInLevel = levelAnswersRef.current.filter(Boolean).length;
      levelAnswersRef.current = [];
      handleLevelComplete(correctInLevel);
    }
  };

  const handleLevelComplete = (correctInLevel) => {
    const totalQuestions = currentLevel.questions.length;
    const scorePercent = Math.round((correctInLevel / totalQuestions) * 100);
    const passed = scorePercent >= PASS_THRESHOLD * 100;

    const levelScore = {
      level: currentLevel.level,
      skill: currentLevel.skill,
      skillDisplayName: currentLevel.skillDisplayName,
      score: scorePercent,
      mastery: getMasteryLevel(scorePercent),
      passed,
      category: currentModule.id,
    };

    const newLevelScores = [...currentLevelScores, levelScore];
    setCurrentLevelScores(newLevelScores);
    setLastLevelScore(levelScore);

    if (passed) {
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
    }

    if (passed && levelIndex + 1 < currentModule.levels.length) {
      setPhase("level_complete");
    } else {
      finalizeModule(newLevelScores);
    }
  };

  const finalizeModule = (levelScores) => {
    const levelsPassed = levelScores.filter((ls) => ls.passed).length;
    const resultLevel = getResultLevel(levelsPassed, currentModule.maxResultLevel);
    const totalCorrect = levelScores.reduce((sum, ls) => {
      const levelData = currentModule.levels.find((l) => l.level === ls.level);
      const qCount = levelData?.questions.length || 4;
      return sum + Math.round((ls.score / 100) * qCount);
    }, 0);
    const totalAnswered = levelScores.reduce((sum, ls) => {
      const levelData = currentModule.levels.find((l) => l.level === ls.level);
      return sum + (levelData?.questions.length || 4);
    }, 0);
    const avgScore = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

    const moduleResult = {
      level: resultLevel,
      mastery: getMasteryLevel(avgScore),
      levelScores,
      description: currentModule.levelDescriptions[resultLevel],
    };

    setAllModuleResults((prev) => ({
      ...prev,
      [currentModule.id]: moduleResult,
    }));

    setPhase("module_complete");
  };

  const handleContinueToNextLevel = () => {
    setLevelIndex((prev) => prev + 1);
    setQuestionIndex(0);
    setPhase("questioning");
  };

  const handleNextModule = () => {
    if (moduleIndex + 1 < DIAGNOSTIC_MODULES.length) {
      setModuleIndex((prev) => prev + 1);
      setLevelIndex(0);
      setQuestionIndex(0);
      setCurrentLevelScores([]);
      setLastLevelScore(null);
      setPhase("module_intro");
    } else {
      saveResults();
    }
  };

  const saveResults = async () => {
    setSaving(true);
    setPhase("saving");
    try {
      const studentId = await getActiveStudentId();

      const skillDetails = [];
      for (const moduleId of ["membaca", "menulis", "mengira"]) {
        const mod = DIAGNOSTIC_MODULES.find((m) => m.id === moduleId);
        const result = allModuleResults[moduleId];
        if (result) {
          result.levelScores.forEach((ls) => {
            skillDetails.push({
              category: moduleId,
              skill: ls.skill,
              skillDisplayName: ls.skillDisplayName,
              score: ls.score,
              mastery: ls.mastery,
              level: ls.level,
              recommendation: mod.levelRecommendations[ls.level] || "",
            });
          });
        }
      }

      const allScores = skillDetails.map((s) => s.score);
      const totalScore =
        allScores.length > 0
          ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
          : 0;

      const results = {
        membaca: allModuleResults.membaca || { level: 1, mastery: "developing" },
        menulis: allModuleResults.menulis || { level: 1, mastery: "developing" },
        mengira: allModuleResults.mengira || { level: 1, mastery: "developing" },
        totalScore,
        skillDetails,
        uploadedImages: uploadedImagesRef.current,
      };

      const response = await base44.functions.invoke("saveDiagnosticResult", {
        student_id: studentId,
        results,
      });

      if (response.data?.success) {
        confetti({ particleCount: 200, spread: 90, origin: { y: 0.6 } });
        setTimeout(() => {
          navigate(`/diagnostic/result/${response.data.session_id}`, {
            state: {
              analysis: response.data.analysis,
              results,
              totalScore,
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

  const moduleResult = allModuleResults[currentModule.id];

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
            {DIAGNOSTIC_MODULES.map((mod, i) => (
              <div
                key={mod.id}
                className={`h-2.5 rounded-full transition-all ${
                  i === moduleIndex ? "bg-amber-400 w-10" : i < moduleIndex ? "bg-emerald-500 w-6" : "bg-stone-700 w-4"
                }`}
              />
            ))}
          </div>
          <span className="text-xs font-black text-stone-400">
            {moduleIndex + 1}/{DIAGNOSTIC_MODULES.length}
          </span>
        </div>

        {/* Suku Mascot */}
        <div className="flex items-center gap-3 bg-stone-900/60 border-2 border-stone-700 rounded-3xl p-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-2xl shrink-0">
            🐢
          </div>
          <p className="text-xs sm:text-sm font-bold text-emerald-200 leading-snug">
            {phase === "module_intro" && `Mari kita mulakan Modul ${currentModule.title}! Suku akan bantu kamu.`}
            {phase === "questioning" && `Kamu sedang di Tahap ${currentLevel.level}: ${currentLevel.title}. Kamu boleh buat!`}
            {phase === "level_complete" && `Tabik! Kamu lulus Tahap ${currentLevel.level}! Seterusnya lebih menarik!`}
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
                <p className="text-xs font-black text-stone-400 uppercase tracking-wider">Tahap yang akan diuji:</p>
                {currentModule.levels.map((lvl) => (
                  <div key={lvl.level} className="flex items-center gap-2 text-left">
                    <span className="text-sm">{lvl.title}</span>
                    <span className="text-[10px] text-stone-500">— {lvl.description}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setPhase("questioning")}
                className={`w-full h-13 py-3.5 bg-gradient-to-r ${currentModule.id === "membaca" ? "from-emerald-500 to-green-500" : currentModule.id === "menulis" ? "from-blue-500 to-indigo-500" : "from-amber-500 to-orange-500"} text-stone-950 font-black text-base rounded-2xl border-b-4 border-black/30 active:translate-y-1 transition-all`}
              >
                Mula Modul {currentModule.title}! 🚀
              </button>
            </motion.div>
          )}

          {/* QUESTIONING */}
          {phase === "questioning" && (
            <motion.div
              key={`q-${moduleIndex}-${levelIndex}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-stone-900/80 rounded-3xl p-5 border-2 border-stone-700 shadow-xl"
            >
              <div className="mb-4 text-center">
                <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest">
                  {currentModule.icon} {currentModule.title} · Tahap {currentLevel.level}
                </span>
                <p className="text-sm font-bold text-stone-300 mt-0.5">{currentLevel.title}</p>
              </div>
              <DiagnosticQuestion
                key={currentQuestion.id}
                question={currentQuestion}
                questionNumber={questionIndex + 1}
                totalQuestions={currentLevel.questions.length}
                onAnswerNext={handleAnswer}
              />
            </motion.div>
          )}

          {/* LEVEL COMPLETE */}
          {phase === "level_complete" && (
            <motion.div
              key={`level-${moduleIndex}-${levelIndex}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-stone-900/80 rounded-3xl p-8 border-2 border-emerald-500/40 shadow-xl text-center space-y-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto" />
              </motion.div>
              <h2 className="text-xl font-black text-white">Tahap {currentLevel.level} Lulus! 🎉</h2>
              <p className="text-sm text-stone-400">
                Skor: {lastLevelScore?.score}% ({lastLevelScore?.mastery === "strong" ? "Cemerlang!" : "Bagus!"})
              </p>
              {levelIndex + 1 < currentModule.levels.length && (
                <button
                  onClick={handleContinueToNextLevel}
                  className="w-full h-13 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-base rounded-2xl border-b-4 border-emerald-700 active:translate-y-1 transition-all flex items-center justify-center gap-2"
                >
                  Teruskan ke Tahap {currentLevel.level + 1}
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </motion.div>
          )}

          {/* MODULE COMPLETE */}
          {phase === "module_complete" && moduleResult && (
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

              <div className={`bg-gradient-to-br ${currentModule.id === "membaca" ? "from-emerald-600 to-green-700" : currentModule.id === "menulis" ? "from-blue-600 to-indigo-700" : "from-amber-600 to-orange-700"} rounded-2xl p-5 text-center border-2 ${currentModule.id === "membaca" ? "border-emerald-400/40" : currentModule.id === "menulis" ? "border-blue-400/40" : "border-amber-400/40"}`}>
                <div className="text-3xl mb-1">{getMasteryEmoji(moduleResult.mastery)}</div>
                <p className="text-xs font-bold text-white/80 uppercase tracking-wider">Tahap {currentModule.title}</p>
                <p className="text-3xl font-black text-white mt-1">{moduleResult.level}/{currentModule.maxResultLevel}</p>
                <p className="text-sm font-bold text-white/90 mt-1">{moduleResult.description}</p>
                <p className="text-xs text-white/60 mt-1">{getMasteryLabel(moduleResult.mastery)}</p>
              </div>

              {/* Skill breakdown */}
              <div className="space-y-2">
                <p className="text-xs font-black text-stone-400 uppercase tracking-wider">Ringkasan Kemahiran:</p>
                {moduleResult.levelScores.map((ls, i) => (
                  <div key={i} className="flex items-center justify-between bg-stone-800/50 rounded-xl p-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{getMasteryEmoji(ls.mastery)}</span>
                      <span className="text-xs font-bold text-stone-300">{ls.skillDisplayName}</span>
                    </div>
                    <span className="text-xs font-black text-stone-400">{ls.score}%</span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleNextModule}
                className="w-full h-13 py-3.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-base rounded-2xl border-b-4 border-amber-700 active:translate-y-1 transition-all flex items-center justify-center gap-2"
              >
                {moduleIndex + 1 < DIAGNOSTIC_MODULES.length ? (
                  <>
                    Teruskan ke Modul {DIAGNOSTIC_MODULES[moduleIndex + 1].title}
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