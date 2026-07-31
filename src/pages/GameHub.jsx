// src/pages/GameHub.jsx
// Game selection and play page — students pick a game, play it, earn rewards.
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { getActiveStudentId } from "@/lib/rewardSystem";
import { getGamesForTopic, processGameReward, getGameProgress } from "@/lib/gameEngine";
import GameRouter from "@/components/games/GameRouter";
import {
  ArrowLeft,
  Gamepad2,
  Star,
  Loader2,
  CheckCircle2,
  Coins,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";

const GAME_ICONS = {
  matching: "🔗",
  memory: "🧠",
  sorting: "📦",
  word_builder: "🔤",
  flashcard: "🎴",
  sequence: "🔢",
  time_challenge: "⏱️",
  simulation: "🎭",
  puzzle: "🧩",
  adventure: "🗺️",
};

const DIFFICULTY_COLORS = {
  easy: "bg-emerald-100 text-emerald-700 border-emerald-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  hard: "bg-rose-100 text-rose-700 border-rose-200",
};

export default function GameHub() {
  const { subjectId, topicId } = useParams();
  const navigate = useNavigate();

  const [subject, setSubject] = useState(null);
  const [topic, setTopic] = useState(null);
  const [games, setGames] = useState([]);
  const [progressMap, setProgressMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeGame, setActiveGame] = useState(null);
  const [gameResult, setGameResult] = useState(null);
  const [processingReward, setProcessingReward] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const studentId = await getActiveStudentId();
        const [sub, top] = await Promise.all([
          base44.entities.Subject.get(subjectId),
          base44.entities.Topic.get(topicId),
        ]);
        setSubject(sub);
        setTopic(top);

        const gameList = await getGamesForTopic(sub?.name, sub?.form_level, topicId, top?.name);
        setGames(gameList);

        // Load progress for each game
        const pMap = {};
        for (const g of gameList) {
          if (!g.is_fallback) {
            const prog = await getGameProgress(studentId, g.id);
            if (prog) pMap[g.id] = prog;
          }
        }
        setProgressMap(pMap);
      } catch (e) {
        console.error("Failed to load games:", e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [subjectId, topicId]);

  const handleGameComplete = async (score) => {
    if (!activeGame) return;
    setProcessingReward(true);

    try {
      const studentId = await getActiveStudentId();
      const reward = await processGameReward(studentId, activeGame, score);
      setGameResult({ score, reward });

      if (reward.xp > 0 || reward.coins > 0) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }
    } catch (e) {
      console.error("Reward processing failed:", e);
      setGameResult({ score, reward: null });
    } finally {
      setProcessingReward(false);
    }
  };

  const handleExitGame = () => {
    setActiveGame(null);
    setGameResult(null);
  };

  const handlePlayAgain = () => {
    setGameResult(null);
    // Re-mount the game component by toggling activeGame
    const game = activeGame;
    setActiveGame(null);
    setTimeout(() => setActiveGame(game), 100);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#FAFAF7] space-y-3">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-xs font-bold text-stone-500">Menyediakan permainan... 🎮</p>
      </div>
    );
  }

  // Active game view
  if (activeGame) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
            <button
              onClick={handleExitGame}
              className="p-2 rounded-xl bg-stone-100 text-stone-600 hover:bg-stone-200"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="text-center">
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                {GAME_ICONS[activeGame.game_type]} {activeGame.game_type.replace("_", " ")}
              </span>
              <h1 className="text-sm font-black text-stone-800">{activeGame.game_name}</h1>
            </div>
            <div className="w-8" />
          </div>

          {/* Instructions */}
          {!gameResult && (
            <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-3 flex items-start gap-2">
              <span className="text-lg">🐢</span>
              <p className="text-xs text-stone-700 font-medium pt-0.5">{activeGame.instructions}</p>
            </div>
          )}

          {/* Game or Result */}
          {gameResult ? (
            <GameResultView
              result={gameResult}
              game={activeGame}
              onPlayAgain={handlePlayAgain}
              onExit={handleExitGame}
              processing={processingReward}
            />
          ) : (
            <div className="bg-white p-5 rounded-3xl border-2 border-stone-200 shadow-sm">
              <GameRouter game={activeGame} onComplete={handleGameComplete} />
            </div>
          )}

          {processingReward && (
            <div className="flex items-center justify-center gap-2 text-xs text-emerald-600 font-bold">
              <Loader2 className="w-4 h-4 animate-spin" /> Mengira ganjaran anda...
            </div>
          )}
        </div>
      </div>
    );
  }

  // Game selection view
  return (
    <div className="min-h-screen bg-[#FAFAF7] px-4 py-6">
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-stone-100 text-stone-600 hover:bg-stone-200"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="text-center">
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
              🎮 Pusat Permainan
            </span>
            <h1 className="text-sm font-black text-stone-800">{topic?.name || "Permainan"}</h1>
          </div>
          <div className="w-8" />
        </div>

        {/* Mascot banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl p-4 flex items-center gap-3 text-white shadow-lg"
        >
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-3xl shrink-0">
            🐢
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-emerald-100">Suku Kata:</p>
            <p className="text-xs font-bold text-white mt-0.5">
              Bermain sambil belajar, Pengembara Muda! Pilih permainan untuk berlatih. 🌟
            </p>
          </div>
        </motion.div>

        {/* Games grid */}
        {games.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-stone-200">
            <Gamepad2 className="w-10 h-10 text-stone-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-stone-500">Permainan akan datang tidak lama lagi!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {games.map((game, idx) => {
              const prog = progressMap[game.id];
              const masteryStars =
                prog?.mastery_level === "mastered" ? 3 :
                prog?.mastery_level === "proficient" ? 2 :
                prog ? 1 : 0;

              return (
                <button
                  key={`${game.id || idx}`}
                  onClick={() => { setActiveGame(game); setGameResult(null); }}
                  className="text-left bg-white p-4 rounded-2xl border-2 border-stone-200 hover:border-emerald-300 hover:shadow-md transition-all active:scale-[0.98] space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-3xl">{GAME_ICONS[game.game_type] || "🎮"}</span>
                    {prog && (
                      <div className="flex gap-0.5">
                        {[1, 2, 3].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${s <= masteryStars ? "fill-amber-400 text-amber-400" : "text-stone-200"}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <h3 className="text-sm font-black text-stone-800">{game.game_name}</h3>
                  <p className="text-[11px] text-stone-500 font-medium leading-snug">{game.instructions}</p>
                  <div className="flex items-center gap-2 pt-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${DIFFICULTY_COLORS[game.difficulty] || DIFFICULTY_COLORS.easy}`}>
                      {game.difficulty}
                    </span>
                    {prog && (
                      <span className="text-[10px] font-bold text-stone-400">
                        Skor: {prog.highest_score}% • {prog.attempts}x
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Back to lesson button */}
        <Button
          onClick={() => navigate(-1)}
          variant="outline"
          className="w-full h-11 rounded-xl text-xs font-bold border-stone-300 text-stone-600 hover:bg-stone-100"
        >
          Kembali ke Pelajaran 📚
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// GAME RESULT VIEW
// ============================================================
function GameResultView({ result, game, onPlayAgain, onExit, processing }) {
  const { score, reward } = result;

  const feedbackMessage =
    score >= 80 ? "Hebat Pengembara! Kamu semakin mahir! 🌟" :
    score >= 50 ? "Bagus! Teruskan berlatih untuk lebih mahir! 💪" :
    "Cuba lagi! Mari lihat petunjuk Suku. 🐢";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white p-6 rounded-3xl border-2 border-stone-200 shadow-sm space-y-5 text-center"
    >
      {/* Score circle */}
      <div className="flex flex-col items-center gap-2">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-black border-4 ${
          score >= 80 ? "bg-emerald-50 border-emerald-400 text-emerald-600" :
          score >= 50 ? "bg-amber-50 border-amber-400 text-amber-600" :
          "bg-rose-50 border-rose-400 text-rose-600"
        }`}>
          {score}%
        </div>
        <p className="text-sm font-black text-stone-800">{feedbackMessage}</p>
      </div>

      {/* Rewards */}
      {reward && !processing && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-2xl p-3">
            <div className="flex items-center justify-center gap-1">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span className="text-xl font-black text-emerald-700">+{reward.xp}</span>
            </div>
            <p className="text-[10px] font-bold text-emerald-600 mt-0.5">XP</p>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-3">
            <div className="flex items-center justify-center gap-1">
              <Coins className="w-4 h-4 text-amber-500" />
              <span className="text-xl font-black text-amber-700">+{reward.coins}</span>
            </div>
            <p className="text-[10px] font-bold text-amber-600 mt-0.5">Koin</p>
          </div>
        </div>
      )}

      {/* Reward type badge */}
      {reward && !processing && (
        <div className="flex justify-center">
          {reward.isFirstCompletion && (
            <span className="text-xs font-black bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
              🎉 Selesai Pertama!
            </span>
          )}
          {reward.badgeEarned && (
            <span className="text-xs font-black bg-amber-100 text-amber-700 px-3 py-1 rounded-full">
              {reward.badgeEarned.icon} {reward.badgeEarned.name}
            </span>
          )}
          {reward.improved && !reward.isFirstCompletion && !reward.badgeEarned && (
            <span className="text-xs font-black bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
              📈 Peningkatan!
            </span>
          )}
          {!reward.isFirstCompletion && !reward.improved && !reward.badgeEarned && (
            <span className="text-xs font-black bg-stone-100 text-stone-500 px-3 py-1 rounded-full">
              🔄 Latihan Sahaja
            </span>
          )}
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={onPlayAgain}
          variant="outline"
          className="flex-1 h-11 rounded-xl text-xs font-bold border-stone-300 text-stone-600"
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1" /> Main Lagi
        </Button>
        <Button
          onClick={onExit}
          className="flex-1 h-11 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Selesai
        </Button>
      </div>
    </motion.div>
  );
}