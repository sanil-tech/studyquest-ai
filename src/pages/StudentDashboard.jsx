import React, { useState, useEffect, useCallback, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import {
  Coins, Trophy, Flame, Target, Star, Lock, Check, Play, ShieldAlert, UserCheck, UserX
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function DuolingoStudentPath() {
  const [user, setUser] = useState(null);
  const [progress, setProgress] = useState({ level: 3, total_xp: 450, streak_days: 5 }); // Default fake data for design safety
  const [wallet, setWallet] = useState({ balance: 25 });
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();

  // Generate 8 Duolingo-style units/milestones for the visual tree
  const pathUnits = useMemo(() => [
    { id: 1, title: "Basics of Learning", description: "Kickstart your brain", minXp: 0 },
    { id: 2, title: "Daily Habits", description: "Building routines", minXp: 200 },
    { id: 3, title: "Deep Focus", description: "Concentration block", minXp: 400 },
    { id: 4, title: "Critical Thinking", description: "Analyze situations", minXp: 600 },
    { id: 5, title: "Memory Palace", description: "Advanced recall tricks", minXp: 800 },
    { id: 6, title: "Problem Solver", description: "Crush complex obstacles", minXp: 1000 },
    { id: 7, title: "Speed Reader", description: "Absorb info lightning fast", minXp: 1200 },
    { id: 8, title: "Grandmaster", description: "Ultimate final challenge", minXp: 1400 },
  ], []);

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

  // Helper function to return alternating horizontal offset alignment positions
  const getAlternatingClass = (index) => {
    const position = index % 4;
    if (position === 1) return "md:translate-x-16 sm:translate-x-12"; // Shift Right
    if (position === 3) return "md:-translate-x-16 sm:-translate-x-12"; // Shift Left
    return "translate-x-0"; // Centered
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 space-y-4">
        <div className="w-14 h-14 border-5 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-sm font-black text-emerald-600 animate-pulse tracking-wide uppercase">Generating Learning Path...</p>
      </div>
    );
  }

  const currentLevel = progress?.level || 1;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-24 selection:bg-emerald-200">
      
      {/* FLOATING DUOLINGO STATUS HEADERS */}
      <div className="sticky top-0 z-50 w-full bg-white border-b-2 border-slate-200 shadow-xs px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 shadow-md flex items-center justify-center text-xl text-white transform -rotate-3 font-bold">
              {user?.avatar_emoji || "🚀"}
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Level {currentLevel}</p>
              <h2 className="text-sm font-black text-slate-700 tracking-tight leading-none">
                {user?.nickname || "Explorer"}
              </h2>
            </div>
          </div>

          {/* Core Widget Badges */}
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-1.5 font-black text-orange-500 text-sm sm:text-base">
              <Flame className="w-5 h-5 fill-orange-500" />
              <span>{progress?.streak_days || 0}</span>
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
        
        {/* PENDING NOTIFICATION SECTION */}
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

        {/* --- THE DUOLINGO VERTICAL PATH TREE --- */}
        <div className="relative flex flex-col items-center py-10">
          
          {/* Central Connecting Vine Backbone Line */}
          <div className="absolute top-0 bottom-0 w-3 bg-slate-200 rounded-full z-0" />

          {/* Vertical Node Blocks */}
          <div className="relative w-full flex flex-col items-center space-y-12 z-10">
            {pathUnits.map((unit, index) => {
              const isCompleted = unit.id < currentLevel;
              const isActive = unit.id === currentLevel;
              const isLocked = unit.id > currentLevel;

              return (
                <div 
                  key={unit.id} 
                  className={`flex flex-col items-center transition-all duration-300 ${getAlternatingClass(index)}`}
                >
                  {/* Skill Badge Level Node Bubble Trigger Button */}
                  <div className="relative group">
                    
                    {/* Pulsing Active Ring Base Highlight effect */}
                    {isActive && (
                      <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-40 scale-125" />
                    )}

                    <button
                      disabled={isLocked}
                      className={`
                        relative w-20 h-20 sm:w-24 sm:h-24 rounded-full flex flex-col items-center justify-center 
                        transition-transform active:scale-95 shadow-lg select-none border-b-6 font-black text-xl
                        ${isCompleted ? "bg-emerald-500 border-emerald-700 text-white hover:bg-emerald-400" : ""}
                        ${isActive ? "bg-emerald-400 border-emerald-600 text-white scale-110 ring-4 ring-emerald-100" : ""}
                        ${isLocked ? "bg-slate-200 border-slate-400 text-slate-400 cursor-not-allowed" : ""}
                      `}
                    >
                      {isCompleted && <Check className="w-8 h-8 stroke-[4]" />}
                      {isActive && <Star className="w-8 h-8 fill-white stroke-[2]" />}
                      {isLocked && <Lock className="w-7 h-7 stroke-[2.5]" />}
                      
                      {/* Under-node level indicator numbering label floating underneath */}
                      <span className={`absolute -bottom-7 font-black text-xs uppercase tracking-widest ${isActive ? "text-emerald-500 font-extrabold scale-105" : "text-slate-400"}`}>
                        Unit {unit.id}
                      </span>
                    </button>

                    {/* Popover Hover Skill Detail Bubble */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-4 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-30 w-44 bg-slate-800 text-white text-center p-2.5 rounded-xl text-xs shadow-xl">
                      <div className="font-extrabold text-amber-400 mb-0.5">{unit.title}</div>
                      <div className="text-slate-200 text-[11px] leading-tight">{unit.description}</div>
                      {isLocked && <div className="text-[10px] text-slate-400 font-bold mt-1">Requires {unit.minXp} XP</div>}
                      {/* Downward tiny popover anchor pointer caret arrow */}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
                    </div>

                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* RESUME BUTTON BAR LOCKED ALONG BOTTOM FOOTER AREA */}
        <div className="fixed bottom-4 left-0 right-0 px-4 z-40 max-w-md mx-auto">
          <Button className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-black py-6 rounded-2xl text-base uppercase tracking-wider shadow-lg border-b-4 border-emerald-700 active:border-b-0 transform active:translate-y-[4px] transition-all">
            <Play className="w-5 h-5 mr-2 fill-current" />
            Resume Unit {currentLevel}
          </Button>
        </div>

      </div>
    </div>
  );
}