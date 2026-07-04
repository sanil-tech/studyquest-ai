import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import {
  CloudSun,
  CheckSquare,
  Calendar,
  Heart,
  Trash2,
  MapPinOff
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import moment from "moment";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

// ---------------- WEATHER ----------------
const parseWmoCode = (code) => {
  const map = {
    0: { status: "Sunny", emoji: "☀️" },
    1: { status: "Clear", emoji: "🌤️" },
    2: { status: "Cloudy", emoji: "⛅" },
    3: { status: "Overcast", emoji: "☁️" },
    61: { status: "Rain", emoji: "🌧️" },
    95: { status: "Thunderstorm", emoji: "⛈️" },
  };
  return map[code] || { status: "Clear", emoji: "☀️" };
};

// ================= CHILD CARD =================
function ChildCard({ child, onUnlink }) {
  const [showId, setShowId] = useState(false);

  const xp = child?.progress?.total_xp || 0;
  const level = child?.progress?.level || 1;
  const nextXp = level * 200;

  return (
    <motion.div className="bg-white rounded-2xl p-4 border">
      
      {/* HEADER */}
      <div className="flex justify-between items-start">
        <div>
          <div className="font-bold text-sm">
            {child.name}
          </div>

          {/* 🔥 FIXED: student ID button */}
          <button
            onClick={() => setShowId(!showId)}
            className="text-xs text-blue-500 mt-1"
          >
            {showId ? child.id : "Show Account ID"}
          </button>

          {showId && (
            <div className="text-[10px] text-gray-400 mt-1">
              ID: {child.id}
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => onUnlink(child.id, child.name)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* XP BAR */}
      <div className="mt-3">
        <div className="text-xs">
          Level {level} • {xp}/{nextXp} XP
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500"
            style={{ width: `${Math.min((xp / nextXp) * 100, 100)}%` }}
          />
        </div>
      </div>
    </motion.div>
  );
}

// ================= MAIN DASHBOARD =================
export default function ParentDashboard() {
  const { toast } = useToast();

  const [user, setUser] = useState(null);
  const [children, setChildren] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const [weather, setWeather] = useState({
    temp: "--",
    status: "Loading...",
    emoji: "☀️",
  });

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
          const progress = await base44.entities.Progress.filter({ student_id: id });
          const user = await base44.entities.User.get(id).catch(() => null);

          return {
            id,
            name: user?.full_name || "Student",
            progress: progress?.[0] || {},
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

  // ---------------- WEATHER ----------------
  const fetchWeather = useCallback(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;

      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
      );

      const data = await res.json();
      const meta = parseWmoCode(data.current_weather.weathercode);

      setWeather({
        temp: `${Math.round(data.current_weather.temperature)}°C`,
        status: meta.status,
        emoji: meta.emoji,
      });
    });
  }, []);

  // ---------------- EFFECT ----------------
  useEffect(() => {
    loadData();
    fetchWeather();
  }, []);

  // ---------------- UNLINK ----------------
  const handleUnlink = async (childId, name) => {
    await base44.entities.ParentChildRelationship.update(childId, {
      status: "inactive",
    });

    toast({
      title: "Unlinked",
      description: `${name} removed`,
    });

    loadData();
  };

  // ================= UI =================
  if (loading) {
    return <div className="p-10 text-center">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">

      {/* WEATHER */}
      <div className="bg-white p-4 rounded-2xl border flex justify-between">
        <div>
          <div className="text-2xl font-bold">{weather.temp}</div>
          <div className="text-sm text-gray-500">{weather.status}</div>
        </div>
        <div className="text-3xl">{weather.emoji}</div>
      </div>

      {/* CHILDREN */}
      <div>
        <h2 className="font-bold mb-3">My Children</h2>

        {children.length === 0 ? (
          <div className="p-4 border rounded-xl text-gray-500">
            No student profile connected
          </div>
        ) : (
          <div className="grid gap-3">
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
        <h2 className="font-bold mb-3">Pending Requests</h2>

        {pendingRequests.length === 0 ? (
          <div className="text-gray-400 text-sm">
            No pending requests
          </div>
        ) : (
          <div className="space-y-2">
            {pendingRequests.map(r => (
              <div key={r.id} className="p-3 border rounded-xl">
                {r.reward_title}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}