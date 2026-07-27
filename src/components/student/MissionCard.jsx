import React from "react";
import { motion } from "framer-motion";
import { Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import AvatarDisplay from "@/components/avatar/AvatarDisplay";

export default function MissionCard({ user, level, xp, todayMinutes, onStart }) {
  const hasStudiedToday = todayMinutes > 0;

  return (
    <motion.div
      initial={{ scale: 0.96, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 100 }}
      className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-500 via-green-600 to-teal-700 p-6 text-white shadow-xl border-b-4 border-green-800"
    >
      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-5">
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div className="relative shrink-0">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/20 p-1.5 border-4 border-white/40 flex items-center justify-center">
              <AvatarDisplay xp={xp} size="lg" variant="plain" />
            </div>
            <span className="absolute -bottom-1 -right-1 bg-amber-400 text-stone-900 font-black text-xs px-2.5 py-1 rounded-full border-2 border-white shadow-sm">
              Lv. {level}
            </span>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              {user?.nickname || "Penjelajah"}!
            </h1>
            <p className="text-emerald-100 font-medium mt-0.5 text-sm">
              {hasStudiedToday
                ? `Hebat! ${todayMinutes} minit hari ini 🎉`
                : "Misi hari ini menunggu kamu!"}
            </p>
          </div>
        </div>

        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
          <Button
            onClick={onStart}
            className="w-full bg-amber-400 hover:bg-amber-300 text-stone-900 font-black text-base px-6 py-4 rounded-2xl shadow-lg border-b-4 border-amber-600 flex items-center justify-center gap-2"
          >
            <Rocket className="w-5 h-5" />
            {hasStudiedToday ? "Teruskan!" : "Mula Misi!"}
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}