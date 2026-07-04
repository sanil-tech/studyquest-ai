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
import { Card } from "@/components/ui/card";

const calculateAge = (birthDate) => {
  if (!birthDate) return "N/A";
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

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

function ChildCard({ child, onUnlink }) {
  return (
    <Card className="p-6 space-y-4">
      <div>
        <h3 className="text-xl font-bold">
          {child.full_name || child.username || "Unnamed Student"}
        </h3>
        <p className="text-sm text-muted-foreground">
          Age {calculateAge(child.date_of_birth)} • {child.education_level}
        </p>
      </div>

      <div className="grid grid-cols-3 text-center text-sm">
        <div>
          <p className="font-bold">{child.progress?.level || 1}</p>
          <p>Level</p>
        </div>
        <div>
          <p className="font-bold">{child.wallet?.balance || 0}</p>
          <p>Coins</p>
        </div>
        <div>
          <p className="font-bold">{child.progress?.streak_days || 0}</p>
          <p>Streak</p>
        </div>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onUnlink(child.id, child.full_name || child.username || "Student")}
        className="text-rose-500 hover:bg-rose-50"
      >
        <Trash2 className="w-4 h-4 mr-2" />
        Unlink
      </Button>
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
          const [progress, wallet] = await Promise.all([
            base44.entities.Progress.filter({ student_id: id }),
            base44.entities.Wallet.filter({ student_id: id }),
          ]);
          const user = await base44.entities.User.get(id).catch(() => null);

          return {
            id,
            full_name: user?.full_name || "",
            username: user?.username || "",
            date_of_birth: user?.date_of_birth || "",
            education_level: user?.education_level || "",
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