import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowLeft, BookOpen, Swords, Lock, CheckCircle2, Star, Map, Sparkles
} from "lucide-react";

// MOCK DATA: Simulating our loaded Subject and Topics
const activeMission = {
  id: "math-101",
  name: "Jungle Mathematics",
  icon: "🧮",
  color: "#F59E0B"
};

const missionStages = [
  { id: "t1", name: "Fractions of the Forest", status: "completed" },
  { id: "t2", name: "Decimals in the Dark", status: "unlocked" },
  { id: "t3", name: "Geometry of the Canopy", status: "locked" },
  { id: "t4", name: "Algebraic Vines", status: "locked" },
];

export default function MissionCampaignPage() {
  const [studentFirstName] = useState("Explorer");

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24">
      
      {/* 🚀 Mission Header */}
      <div className="bg-white border-b-2 border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link 
              to="/study" 
              className="p-2.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors active:scale-95"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">{activeMission.icon}</span>
                <h1 className="text-lg font-heading font-black text-slate-800 uppercase tracking-tight">
                  {activeMission.name}
                </h1>
              </div>
              <p className="text-slate-400 text-[11px] font-bold tracking-wider uppercase">
                Active Campaign
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-amber-100 border-2 border-amber-200 px-3 py-1.5 rounded-xl">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span className="text-sm font-black text-amber-700">1/4</span>
          </div>
        </div>
      </div>

      {/* 🦧 Mascot Encouragement Area */}
      <div className="max-w-3xl mx-auto px-4 pt-8 pb-4 relative z-10 flex flex-col items-center">
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="bg-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-2xl border-2 border-slate-200 text-slate-600 shadow-sm mb-3 text-center max-w-sm relative z-20"
        >
          Welcome to the {activeMission.name} campaign, {studentFirstName}! Read the briefing, then beat the challenge! 🍌
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-white" />
        </motion.div>
        
        <motion.div 
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="text-6xl sm:text-7xl drop-shadow-xl"
        >
          🦧
        </motion.div>
      </div>

      {/* 🗺️ The Path / Roadmap */}
      <div className="max-w-2xl mx-auto px-4 mt-8 space-y-6 relative">
        
        {/* Visual Line connecting the stages */}
        <div className="absolute left-8 sm:left-12 top-8 bottom-12 w-1.5 bg-slate-200 rounded-full z-0" />

        {missionStages.map((stage, index) => {
          const isCompleted = stage.status === "completed";
          const isUnlocked = stage.status === "unlocked";
          const isLocked = stage.status === "locked";

          return (
            <div key={stage.id} className="relative z-10 flex gap-4 sm:gap-6 w-full">
              
              {/* Path Node Indicator */}
              <div className="shrink-0 flex flex-col items-center mt-2">
                <div className={`w-10 h-10 rounded-full border-4 flex items-center justify-center bg-white z-10 shadow-sm
                  ${isCompleted ? 'border-emerald-500 text-emerald-500' : 
                    isUnlocked ? 'border-amber-500 text-amber-500 ring-4 ring-amber-100' : 
                    'border-slate-300 text-slate-300'}`}
                >
                  {isCompleted ? <CheckCircle2 className="w-5 h-5 fill-current text-white" /> : 
                   isLocked ? <Lock className="w-4 h-4" /> : 
                   <span className="font-black text-sm">{index + 1}</span>}
                </div>
              </div>

              {/* Stage Card */}
              <motion.div 
                whileHover={!isLocked ? { scale: 1.02 } : {}}
                className={`flex-1 rounded-3xl border-2 p-5 transition-all ${
                  isCompleted ? "bg-white border-emerald-200 opacity-80" :
                  isUnlocked ? "bg-white border-amber-300 shadow-md" :
                  "bg-slate-100 border-slate-200 opacity-60 grayscale-[0.5]"
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className={`font-heading font-black text-lg ${isLocked ? 'text-slate-500' : 'text-slate-800'}`}>
                      {stage.name}
                    </h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                      Stage {index + 1}
                    </p>
                  </div>
                  {isUnlocked && (
                    <span className="flex h-3 w-3 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                    </span>
                  )}
                </div>

                {/* Two-Step Mission Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  
                  {/* Step 1: The Lesson */}
                  <Link 
                    to={isLocked ? "#" : `/study/${activeMission.id}/${stage.id}/lesson`}
                    className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all group ${
                      isLocked ? "bg-slate-50 border-slate-200 pointer-events-none" : 
                      isCompleted ? "bg-emerald-50 border-emerald-100 text-emerald-700" :
                      "bg-blue-50 border-blue-200 hover:bg-blue-100 hover:border-blue-300 cursor-pointer text-blue-700"
                    }`}
                  >
                    <div className={`p-2 rounded-xl ${isLocked ? 'bg-slate-200' : isCompleted ? 'bg-emerald-200/50' : 'bg-blue-200/50 group-hover:scale-110 transition-transform'}`}>
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">Step 1</p>
                      <p className="font-black text-sm">Mission Briefing</p>
                    </div>
                  </Link>

                  {/* Step 2: The Quiz/Challenge */}
                  <Link 
                    to={isLocked ? "#" : `/study/${activeMission.id}/${stage.id}/quiz`}
                    className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all group ${
                      isLocked ? "bg-slate-50 border-slate-200 pointer-events-none" : 
                      isCompleted ? "bg-emerald-50 border-emerald-100 text-emerald-700" :
                      "bg-orange-50 border-orange-200 hover:bg-orange-100 hover:border-orange-300 cursor-pointer text-orange-700"
                    }`}
                  >
                    <div className={`p-2 rounded-xl ${isLocked ? 'bg-slate-200' : isCompleted ? 'bg-emerald-200/50' : 'bg-orange-200/50 group-hover:scale-110 transition-transform'}`}>
                      <Swords className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">Step 2</p>
                      <p className="font-black text-sm">The Challenge</p>
                    </div>
                  </Link>

                </div>
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
}