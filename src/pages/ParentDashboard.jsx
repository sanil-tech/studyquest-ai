import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import {
  Coins, Trophy, Clock, CheckSquare, BookOpen,
  Trash2, Calendar, Award, Flame, Target, CloudSun, Heart, MapPinOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import moment from "moment";
import { getDisplayName } from "@/lib/utils";

// ================= WEATHER MAP =================
const parseWmoCode = (code) => {
  const map = {
    0: { status: "Sunny", emoji: "☀️", tip: "Perfect day for study." },
    1: { status: "Mainly Clear", emoji: "🌤️", tip: "Good commute conditions." },
    2: { status: "Partly Cloudy", emoji: "⛅", tip: "Balanced weather today." },
    3: { status: "Overcast", emoji: "☁️", tip: "Cloudy but stable." },
    61: { status: "Rain", emoji: "🌧️", tip: "Bring umbrella." },
    63: { status: "Moderate Rain", emoji: "🌧️", tip: "Expect wet roads." },
    65: { status: "Heavy Rain", emoji: "⛈️", tip: "Be cautious." }
  };
  return map[code] || { status: "Clear", emoji: "☀️", tip: "Good day." };
};

export default function ParentDashboard() {
  const [user, setUser] = useState(null);
  const [children, setChildren] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const [weather, setWeather] = useState({
    temp: "--",
    status: "Loading...",
    emoji: "☀️",
    tip: ""
  });

  const [hourlyForecast, setHourlyForecast] = useState([]);
  const [weatherLoading, setWeatherLoading] = useState(false);

  const { toast } = useToast();

  // ================= WEATHER =================
  const fetchWeather = useCallback(() => {
    if (!navigator.geolocation) return;

    setWeatherLoading(true);

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;

      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m,weathercode`
        );

        const data = await res.json();

        const meta = parseWmoCode(data.current_weather.weathercode);

        setWeather({
          temp: `${Math.round(data.current_weather.temperature)}°C`,
          status: meta.status,
          emoji: meta.emoji,
          tip: meta.tip
        });

        const now = moment().hour();
        const forecast = [];

        for (let i = 0; i < 5; i++) {
          const idx = now + i;
          if (data.hourly?.time?.[idx]) {
            forecast.push({
              time: moment(data.hourly.time[idx]).format("h A"),
              temp: `${Math.round(data.hourly.temperature_2m[idx])}°C`,
              emoji: parseWmoCode(data.hourly.weathercode[idx]).emoji
            });
          }
        }

        setHourlyForecast(forecast);
      } catch (e) {
        console.log(e);
      } finally {
        setWeatherLoading(false);
      }
    });
  }, []);

  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  // ================= LOAD DATA =================
  const loadData = async () => {
    try {
      setLoading(true);

      const userRes = await base44.auth.me();
      setUser(userRes);

      const rel = await base44.entities.ParentChildRelationship.filter({
        parent_id: userRes.id,
        status: ["active"]
      });

      const ids = rel.map(r => r.child_id);

      if (!ids.length) {
        setChildren([]);
        setPendingRequests([]);
        setLoading(false);
        return;
      }

      const childrenData = await Promise.all(
        ids.map(async (id) => {
          const [progress, wallet, sessions, quizzes] = await Promise.all([
            base44.entities.Progress.filter({ student_id: id }),
            base44.entities.Wallet.filter({ student_id: id }),
            base44.entities.StudySession.filter({ student_id: id }),
            base44.entities.QuizAttempt.filter({ student_id: id })
          ]);

          const userProfile = await base44.entities.User.get(id);

          return {
            id,
            name: getDisplayName(userProfile),
            avatar_emoji: userProfile?.avatar_emoji || "👦",
            progress: progress?.[0] || { level: 1, total_xp: 0, streak_days: 0 },
            wallet: wallet?.[0] || { balance: 0 },
            sessions: sessions || [],
            quizzes: quizzes || []
          };
        })
      );

      setChildren(childrenData);

      const requests = await Promise.all(
        ids.map(id =>
          base44.entities.RewardRequest.filter({
            student_id: id,
            status: "pending"
          })
        )
      );

      setPendingRequests(requests.flat());
    } catch (err) {
      console.error("LOAD ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ================= FIX UNLINK =================
  const handleUnlinkChild = async (childId, name) => {
    try {
      const rel = await base44.entities.ParentChildRelationship.filter({
        parent_id: user.id,
        child_id: childId
      });

      if (rel?.[0]) {
        await base44.entities.ParentChildRelationship.update(rel[0].id, {
          status: "inactive"
        });
      }

      toast({
        title: "Success",
        description: `${name} unlinked`
      });

      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const triggerKudos = (name) => {
    toast({
      title: "Kudos Sent ✨",
      description: `Sent to ${name}`
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        Loading...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}
      <div>
        <h1 className="text-xl font-bold">
          Welcome {user?.full_name}
        </h1>
      </div>

      {/* WEATHER */}
      <div className="p-4 bg-white rounded-xl border">
        <div className="flex justify-between">
          <div>
            <p className="text-2xl font-bold">{weather.temp}</p>
            <p>{weather.status}</p>
          </div>
          <span className="text-3xl">{weather.emoji}</span>
        </div>
      </div>

      {/* CHILDREN */}
      <div className="space-y-4">
        {children.length === 0 ? (
          <div className="p-6 border rounded-xl text-center">
            No Student Profile Connected
          </div>
        ) : (
          children.map(child => (
            <ChildCard
              key={child.id}
              child={child}
              onUnlink={handleUnlinkChild}
              onSendKudos={triggerKudos}
            />
          ))
        )}
      </div>

      {/* REQUESTS */}
      <div className="p-4 bg-white border rounded-xl">
        <h2 className="font-bold">Pending Requests ({pendingRequests.length})</h2>
      </div>

    </div>
  );
}

// ================= CHILD CARD =================
function ChildCard({ child, onUnlink, onSendKudos }) {
  return (
    <div className="p-4 border rounded-xl bg-white">
      <div className="flex justify-between">
        <div>
          <h2 className="font-bold">
            {child.avatar_emoji} {child.name}
          </h2>
          <p className="text-xs text-gray-400">
            ID: ...{child.id?.slice(-6)}
          </p>
        </div>

        <div className="flex gap-2">
          <button onClick={() => onSendKudos(child.name)}>
            ❤️
          </button>

          <button onClick={() => onUnlink(child.id, child.name)}>
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}