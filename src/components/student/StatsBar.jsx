import React from "react";
import { Coins, Zap, Flame, Trophy } from "lucide-react";
import { motion } from "framer-motion";

export default function StatsBar({ wallet, progress }) {
  const xpForNext = progress?.level ? progress.level * 200 : 200;
  const xpProgress = progress?.total_xp ? ((progress.total_xp % xpForNext) / xpForNext) * 100 : 0;

  return (
    <div className="grid grid-cols-4 gap-2">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0 }}
        className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl p-3 text-center border border-yellow-100"
      >
        <Coins className="w-5 h-5 text-amber-500 mx-auto mb-1" />
        <p className="text-lg font-bold text-amber-700">{wallet?.balance || 0}</p>
        <p className="text-[10px] text-amber-500 font-medium">Coins</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-3 text-center border border-purple-100"
      >
        <Zap className="w-5 h-5 text-purple-500 mx-auto mb-1" />
        <p className="text-lg font-bold text-purple-700">{progress?.total_xp || 0}</p>
        <p className="text-[10px] text-purple-500 font-medium">XP</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-3 text-center border border-orange-100"
      >
        <Flame className="w-5 h-5 text-orange-500 mx-auto mb-1" />
        <p className="text-lg font-bold text-orange-700">{progress?.streak_days || 0}</p>
        <p className="text-[10px] text-orange-500 font-medium">Streak</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-3 text-center border border-emerald-100"
      >
        <Trophy className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
        <p className="text-lg font-bold text-emerald-700">Lv {progress?.level || 1}</p>
        <p className="text-[10px] text-emerald-500 font-medium">Level</p>
      </motion.div>
    </div>
  );
}