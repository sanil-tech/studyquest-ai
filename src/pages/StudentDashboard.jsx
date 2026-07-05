import React, { useState, useEffect, useCallback, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import {
  Coins, Trophy, Flame, Star, Lock, Check, Play, ShieldAlert, UserCheck, UserX
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function DuolingoStudentPath() {
  const [user, setUser] = useState(null);
  const [progress, setProgress] = useState({ level: 3, total_xp: 450, streak_days: 5 });
  const [wallet, setWallet] = useState({ balance: 25 });
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();

  const baseLevels = useMemo(() => [
    { id: 1, title: "Basics of Learning", description: "Kickstart your brain", minXp: 0 },
    { id: 2, title: "Daily Habits", description: "Building routines", minXp: 200 },
    { id: 3, title: "Deep Focus", description: "Concentration block", minXp: 400 },
    { id: 4, title: "Critical Thinking", description: "Analyze situations", minXp: 600 },
    { id: 5, title: "Memory Palace", description: "Advanced recall tricks", minXp: 800 },
    { id: 6, title: "Problem Solver", description: "Crush complex obstacles", minXp: 1000 },
    { id: 7, title: "Speed Reader", description: "Absorb info lightning fast", minXp: 1200 },
    { id: 8, title: "Grandmaster", description: "Ultimate final challenge", minXp: 1400 },
  ], []);

  const upwardLevels = useMemo(() => [...baseLevels].reverse(), [baseLevels]);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const [progressData, walletData, pendingRels] = await Promise.all([
        base44.entities.Progress.filter({ student_id: currentUser.id }),
        base44.entities.Wallet.filter({ student_id: currentUser.id }),
        base44.entities.ParentChildRelationship.filter({ child_id: currentUser.id, status: "pending" }),
      ]);

      if (progressData?.[0]) setProgress(progressData[0]);
      if (walletData?.[0]) setWallet(walletData[0]);

      if (pendingRels && pendingRels.length > 0) {
        const hydratedRequests = await Promise.all(
          pendingRels.map(async (rel) => {
            try {
              const parentUser = await base44.entities.User.get(rel.parent_id);
              return {
                id: rel.id,
                parent_name: parentUser.full_name || parentUser.username,
                parent_email: parentUser.email || "No email",
              };
            } catch {
              return { id: rel.id, parent_name: "Parent Account", parent_email: "System pending" };
            }
          })
        );
        setPendingRequests(hydratedRequests);
      }
    } catch (err) {
      console.error("Error loading path data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleLevelClick = (levelId) => {
    toast({
      title: `Entering Level ${levelId}! 🚀`,
      description: "Let's learn and level up your brain!",
    });
    
    setTimeout(() => {
      window.location.href = `/study?level=${levelId}`;
    }, 800);
  };

  const handleLinkAction = async (relationshipId, actionType) => {
    setActionLoading(true);
    try {
      if (actionType === "approve") {
        await base44.entities.ParentChildRelationship.update(relationshipId, { status: "active" });
        toast({ title: "Connected! 🎉" });
      } else {
        await base44.entities.ParentChildRelationship.delete(relationshipId);
        toast({ title: "Dismissed" });
      }
      loadDashboardData();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const getAlternatingClass = (id) => {
    const position = id % 4;
    if (position === 1) return "md:translate-x-16 sm:translate-x-12";
    if (position === 3) return "md:-translate-x-16 sm:-translate-x-12";
    return "translate-x-0";
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 space-y-4">
        <div className="w-14 h-14 border-5 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-sm font-black text-emerald-600 animate-pulse tracking-wide uppercase">Building Your Level Track...</p>
      </div>
    );
  }

  const currentLevel = progress?.level || 1;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-32 selection:bg-emerald-200">
      
      {/* FLOATING HEADER STATUS BAR */}
      <div className="sticky top-0 z-50 w-full bg-white border-b-2 border-slate-200 shadow-xs px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500 shadow-md flex items-center justify-center text-xl text-white font-bold">
              {/* Top Nav Avatar defaults to Orangutan */}
              {user?.avatar_emoji || "🦧"}
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Current Progress</p>
              <h2 className="text-sm font-black text-slate-700 tracking-tight leading-none">
                {user?.nickname || "Explorer"} • Level {currentLevel}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-1.5 font-black text-orange-500 text-sm sm:text-base">
              <Flame className="w-5 h-5 fill-orange-500" />
              <span>{progress?.streak_days || 0} Days</span>
            </div>
            <div className="flex items-center gap-1.5 font-black text-amber-500 text-sm sm:text-base">
              <Coins className="w-5 h-5 fill-amber-500" />
              <span>{wallet?.balance || 0}</span>
            </div>
            <div className="flex items-center gap-1.5 font-black text-sky-500 text-sm sm:text-base">
              <Trophy className="w-5 h-5 fill-sky-100 stroke-[2.5]" />
              <span>{progress?.total_xp || 0} XP</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 mt-6 space-y-6">
        
        {/* FAMILY LINK BANNER */}
        <AnimatePresence>
          {pendingRequests.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 space-y-3 shadow-xs"
            >
              <div className="flex items-center gap-2 text-amber-800 font-black text-xs uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4 text-amber-600" /> Family Request
              </div>
              {pendingRequests.map(req => (
                <div key={req.id} className="flex items-center justify-between gap-4 bg-white p-3 rounded-xl border border-amber-200">
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-800 truncate">{req.parent_name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{req.parent_email}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="icon" className="h-8 w-8 bg-emerald-500 hover:bg-emerald-600" disabled={actionLoading} onClick={() => handleLinkAction(req.id, "approve")}>
                      <UserCheck className="w-4 h-4 text-white" />
                    </Button>
                    <Button size="icon" variant="outline" className="h-8 w-8 border-slate-200 text-slate-400" disabled={actionLoading} onClick={() => handleLinkAction(req.id, "reject")}>
                      <UserX className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- VERTICAL TREE PATH (CLIMBING UPWARD) --- */}
        <div className="relative flex flex-col items-center py-10">
          
          <div className="absolute top-0 bottom-0 w-3 bg-slate-200 rounded-full z-0" />

          <div className="relative w-full flex flex-col items-center space-y-16 z-10">
            {upwardLevels.map((lvl) => {
              const isCompleted = lvl.id < currentLevel;
              const isActive = lvl.id === currentLevel;
              const isLocked = lvl.id > currentLevel;

              return (
                <div 
                  key={lvl.id} 
                  className={`flex flex-col items-center transition-all duration-300 ${getAlternatingClass(lvl.id)}`}
                >
                  <div className="relative group">
                    
                    {/* 🦧 LIVELY 3D ORANGUTAN AVATAR FLOATING */}
                    {isActive && (
                      <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 z-30 flex flex-col items-center pointer-events-none drop-shadow-xl">
                        
                        {/* Bouncing Speech Bubble */}
                        <motion.div
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                          className="bg-white text-[11px] font-black px-3 py-1 rounded-full border-2 border-orange-200 text-orange-600 shadow-md mb-2 whitespace-nowrap uppercase tracking-wider relative"
                        >
                          Let's Go!
                          {/* Little triangle tail for speech bubble */}
                          <div className="absolute -bottom-1.5 left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-white" />
                        </motion.div>

                        {/* Breathing, bobbing, rotating 3D Character Avatar */}
                        <motion.div 
                          animate={{ 
                            y: [0, -12, 0], // Bobs up and down
                            rotate: [-4, 4, -4], // Sways slightly side to side
                            scale: [1, 1.05, 1] // "Breathing" scale effect
                          }}
                          transition={{ 
                            duration: 2.5, 
                            repeat: Infinity, 
                            ease: "easeInOut" 
                          }}
                          className="text-6xl sm:text-7xl filter drop-shadow-[0_12px_10px_rgba(0,0,0,0.25)]"
                        >
                          🦧
                          
                          {/* HOW TO ADD YOUR ACTUAL 3D IMAGE: */}
                          {/* Replace the 🦧 above with this image tag once you save the PNG! */}
                          {/* <img src="/assets/3d-orangutan.png" alt="Orangutan" className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-2xl" /> */}
                        </motion.div>
                      </div>
                    )}

                    {/* Active Ring Glow */}
                    {isActive && (
                      <span className="absolute inset-0 rounded-full bg-orange-400 animate-ping opacity-30 scale-125" />
                    )}

                    <button
                      disabled={isLocked}
                      onClick={() => handleLevelClick(lvl.id)}
                      className={`
                        relative w-20 h-20 sm:w-24 sm:h-24 rounded-full flex flex-col items-center justify-center 
                        transition-all active:translate-y-1 shadow-lg border-b-6 font-black text-xl select-none
                        ${isCompleted ? "bg-orange-500 border-orange-700 text-white hover:bg-orange-400 cursor-pointer" : ""}
                        ${isActive ? "bg-orange-400 border-orange-600 text-white scale-110 ring-4 ring-orange-100 cursor-pointer" : ""}
                        ${isLocked ? "bg-slate-200 border-slate-400 text-slate-400 cursor-not-allowed" : ""}
                      `}
                    >
                      {isCompleted && <Check className="w-8 h-8 stroke-[4]" />}
                      {isActive && <Star className="w-8 h-8 fill-white stroke-[2]" />}
                      {isLocked && <Lock className="w-7 h-7 stroke-[2.5]" />}
                      
                      <span className={`absolute -bottom-8 font-black text-xs uppercase tracking-widest text-center min-w-[80px] ${isActive ? "text-orange-500 scale-105" : "text-slate-400"}`}>
                        Level {lvl.id}
                      </span>
                    </button>

                    {/* Popover Bubble Card */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-4 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-30 w-44 bg-slate-800 text-white text-center p-2.5 rounded-xl text-xs shadow-xl">
                      <div className="font-extrabold text-amber-400 mb-0.5">{lvl.title}</div>
                      <div className="text-slate-200 text-[11px] leading-tight">{lvl.description}</div>
                      {isLocked && <div className="text-[10px] text-slate-400 font-bold mt-1">Locked (Clear previous levels)</div>}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
                    </div>

                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* FLOATING ACTION BOTTOM BUTTON */}
        <div className="fixed bottom-4 left-0 right-0 px-4 z-40 max-w-md mx-auto">
          <Button 
            onClick={() => handleLevelClick(currentLevel)}
            className="w-full bg-orange-500 hover:bg-orange-400 text-white font-black py-6 rounded-2xl text-base uppercase tracking-wider shadow-lg border-b-4 border-orange-700 active:border-b-0 transform active:translate-y-[4px] transition-all"
          >
            <Play className="w-5 h-5 mr-2 fill-current" />
            Start Level {currentLevel}
          </Button>
        </div>

      </div>
    </div>
  );
}