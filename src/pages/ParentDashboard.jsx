import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import {
  Trash2,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";

const calculateAge = (birthDate) => {
  if (!birthDate) return "N/A";
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

// ---------------- LIVE ANIMATED DRAGON AVATAR COMPONENT ----------------
function LiveAvatar({ level }) {
  const lvl = level || 1;

  const getAvatarTheme = (l) => {
    if (l >= 15) {
      return {
        // High level: Ancient Dragon
        bg: "bg-gradient-to-br from-red-600 via-orange-500 to-yellow-500",
        auraColor: "border-orange-400",
        title: "Ancient Titan",
        accessory: "🔥", // Fire aura accessory
        model: "🐉"      // Chinese-style or full body elder dragon
      };
    } else if (l >= 6) {
      return {
        // Mid level: Growing Winged Dragon
        bg: "bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600",
        auraColor: "border-emerald-300",
        title: "Winged Drake",
        accessory: "⚡", // Lightning speed indicator
        model: "🐲"      // Dragon face/drake model
      };
    } else {
      return {
        // Base level: Dragon Hatchling/Egg
        bg: "bg-gradient-to-br from-slate-200 via-purple-300 to-pink-300",
        auraColor: "border-purple-200",
        title: "Hatchling",
        accessory: "🥚", // Egg shell item
        model: "🦖"      // Cute small dinosaur/baby monster look
      };
    }
  };

  const theme = getAvatarTheme(lvl);

  const floatTransition = {
    duration: 3,
    repeat: Infinity,
    ease: "easeInOut"
  };

  const auraPulseTransition = {
    duration: 2.5,
    repeat: Infinity,
    ease: "easeInOut",
    repeatType: "reverse"
  };

  const orbitTransition = {
    duration: 6,
    repeat: Infinity,
    ease: "linear"
  };

  return (
    <div className="relative flex flex-col items-center justify-center p-3 flex-shrink-0">
      
      {/* LIVE AURA: Continuous pulse and rotation */}
      <motion.div 
        animate={{ 
          scale: [1, 1.1, 1], 
          opacity: [0.3, 0.6, 0.3],
          rotate: [0, 360] 
        }}
        transition={{...auraPulseTransition, duration: 8}}
        className={`absolute w-28 h-28 rounded-full border-2 border-dashed ${theme.auraColor}`} 
      />
      
      {/* INNER GLOW LAYER */}
      <motion.div 
        animate={{ scale: [1.1, 1, 1.1] }}
        transition={auraPulseTransition}
        className={`absolute w-24 h-24 rounded-full border-4 ${theme.auraColor} opacity-40`} 
      />
      
      {/* MAIN LIVE CHARACTER CONTAINER */}
      <motion.div 
        whileHover={{ scale: 1.15, rotate: -5 }}
        className={`w-20 h-20 rounded-full ${theme.bg} shadow-lg border-2 border-white flex items-center justify-center relative overflow-hidden z-10`}
      >
        {/* CHARACTER MODEL: Gentle dragon breathing/floating motion */}
        <motion.span 
          animate={{ y: [-4, 4, -4], scale: [1, 1.05, 1] }}
          transition={floatTransition}
          className="text-5xl select-none filter drop-shadow-md relative z-20"
        >
          {theme.model}
        </motion.span>

        {/* ORBITING ELEMENT (Fire, Lightning, or Egg Shell) */}
        <motion.div 
          animate={{ rotate: [0, 360] }}
          transition={orbitTransition}
          className="absolute inset-0 z-10"
        >
          <motion.div 
            className="absolute top-1 right-1 text-sm bg-white/80 p-1 rounded-full shadow-sm"
          >
            {theme.accessory}
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Rarity/Rank Subtext */}
      <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mt-2 relative z-20">
        {theme.title}
      </span>
    </div>
  );
}

// ---------------- CHILD CARD ----------------
function ChildCard({ child, onUnlink }) {
  return (
    <Card className="p-0 overflow-hidden">
      <div className="flex items-center">
        <LiveAvatar level={child.progress?.level || 1} />
        <div className="flex-1 min-w-0 pr-4 py-4">
          <Link to={`/parent/children/${child.id}`} className="block">
            <h3 className="text-xl font-bold truncate hover:text-primary transition-colors">
              {child.full_name || child.username || "Unnamed Student"}
            </h3>
            <p className="text-sm text-muted-foreground">
              Age {calculateAge(child.date_of_birth)} • {child.education_level || "—"}
            </p>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 text-center text-sm border-t">
        <div className="py-3">
          <p className="font-bold text-primary">{child.progress?.level || 1}</p>
          <p className="text-muted-foreground">Level</p>
        </div>
        <div className="py-3 border-x">
          <p className="font-bold text-amber-500">{child.wallet?.balance || 0}</p>
          <p className="text-muted-foreground">Coins</p>
        </div>
        <div className="py-3">
          <p className="font-bold text-orange-500">{child.progress?.streak_days || 0}</p>
          <p className="text-muted-foreground">Streak</p>
        </div>
      </div>

      <div className="p-2 border-t bg-muted/30">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onUnlink(child.id, child.full_name || child.username || "Student")}
          className="text-rose-500 hover:bg-rose-50 w-full"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Unlink
        </Button>
      </div>
    </Card>
  );
}

// ================= MAIN DASHBOARD =================
export default function ParentDashboard() {
  const { toast } = useToast();

  const [user, setUser] = useState(null);
  const [children, setChildren] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // ---------------- LOAD DATA ----------------
  const loadData = async () => {
    try {
      setLoading(true);

      const u = await base44.auth.me();
      setUser(u);

      const rel = await base44.entities.ParentChildRelationship.filter({
        parent_id: u.id,
        status: ["active", "pending"],
      });

      if (!rel.length) {
        setChildren([]);
        setPendingRequests([]);
        setLoading(false);
        return;
      }

      const childIds = rel.map(r => r.child_id);

      const kids = await Promise.all(
        childIds.map(async (id) => {
          const [progress, wallet] = await Promise.all([
            base44.entities.Progress.filter({ student_id: id }),
            base44.entities.Wallet.filter({ student_id: id }),
          ]);
          const childUser = await base44.entities.User.get(id).catch(() => null);

          return {
            id,
            full_name: childUser?.full_name || "",
            username: childUser?.username || "",
            date_of_birth: childUser?.date_of_birth || "",
            education_level: childUser?.education_level || "",
            progress: progress?.[0] || {},
            wallet: wallet?.[0] || { balance: 0 },
          };
        })
      );

      const pending = await base44.entities.RewardRequest.filter({
        status: "pending",
      });

      setChildren(kids);
      setPendingRequests(pending);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- EFFECT ----------------
  useEffect(() => {
    loadData();
  }, []);

  // ---------------- UNLINK ----------------
  const handleUnlink = async (childId, name) => {
    try {
      const rel = await base44.entities.ParentChildRelationship.filter({
        parent_id: user.id,
        child_id: childId,
        status: ["active", "pending"],
      });
      if (rel?.[0]) {
        await base44.entities.ParentChildRelationship.update(rel[0].id, {
          status: "inactive",
        });
      }
      toast({
        title: "Unlinked",
        description: `${name} removed`,
      });
      loadData();
    } catch (err) {
      toast({
        title: "Failed to unlink",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  // ================= UI =================
  if (loading) {
    return <div className="p-10 text-center">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold">Parent Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Monitor your children's learning progress and rewards.
        </p>
      </div>

      {/* CHILDREN */}
      <div>
        <h2 className="font-bold mb-3">My Children</h2>

        {children.length === 0 ? (
          <div className="p-4 border rounded-xl text-gray-500 text-center">
            No student profile connected yet.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {children.map(c => (
              <ChildCard
                key={c.id}
                child={c}
                onUnlink={handleUnlink}
              />
            ))}
          </div>
        )}
      </div>

      {/* PENDING */}
      <div>
        <h2 className="font-bold mb-3">Pending Reward Requests</h2>

        {pendingRequests.length === 0 ? (
          <div className="text-gray-400 text-sm">
            No pending requests
          </div>
        ) : (
          <div className="space-y-2">
            {pendingRequests.map(r => (
              <div key={r.id} className="p-3 border rounded-xl flex justify-between items-center">
                <span>{r.reward_title}</span>
                <span className="text-sm text-muted-foreground">{r.coin_cost} 🪙</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}