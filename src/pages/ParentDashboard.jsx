import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Link, useNavigate } from "react-router-dom";
import moment from "moment";
import {
  Target, Gift, BarChart2, CloudRain, Sun, Cloud, CloudLightning,
  MapPin, Clock, ArrowRight, Settings, UserPlus, Flame, Coins, Zap, Star,
  BookOpen, RefreshCw, Loader2
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";

import AddChildModal from "@/components/parent/AddChildModal";
import {
  loadChildrenWithStats, getChildDisplayName, getChildAvatar, isAvatarUrl,
  getSelectedChildId, setSelectedChildId
} from "@/lib/childUtils";

// Maps WMO Weather Interpretation Codes (WW) to icons and language text
const getWeatherDetails = (code) => {
  if ([0, 1].includes(code)) return { label: "Cerah", icon: Sun, color: "text-amber-500" };
  if ([2, 3].includes(code)) return { label: "Berawan", icon: Cloud, color: "text-slate-400" };
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return { label: "Hujan", icon: CloudRain, color: "text-blue-500" };
  if ([95, 96, 99].includes(code)) return { label: "Ribut Petir", icon: CloudLightning, color: "text-purple-500" };
  return { label: "Cerah", icon: Sun, color: "text-amber-500" };
};

function ShortcutCard({ icon: Icon, title, desc, gradient, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`bg-gradient-to-br ${gradient} p-3 rounded-xl shadow-sm flex items-center gap-3 text-white text-left w-full border border-white/5 hover:opacity-95 transition-opacity active:scale-95`}
    >
      <div className="bg-white/20 p-2 rounded-lg shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold truncate">{title}</p>
        <p className="text-[9px] text-white/80 truncate">{desc}</p>
      </div>
    </button>
  );
}

function SelectedChildPanel({ child, onSwitch, hasMultiple }) {
  const navigate = useNavigate();
  const displayName = getChildDisplayName(child);
  const avatar = getChildAvatar(child);
  const avatarIsUrl = isAvatarUrl(avatar);

  const currentXP = child.realProgress?.total_xp || 0;
  const currentLevel = child.realProgress?.level || 1;
  const xpForNext = currentLevel ? currentLevel * 200 : 200;
  const calculatedPercentage = Math.min(Math.round((currentXP / xpForNext) * 100), 100);
  const xpPercentage = isNaN(calculatedPercentage) ? 0 : calculatedPercentage;

  const streakDays = child.realProgress?.streak_days || 0;
  const coins = child.wallet?.balance || 0;
  const currentTopic = child.latestSession?.topic_name || "Misi Belum Mula";
  const totalStudyMinutes = child.latestSession?.duration_minutes || 0;

  const lastActiveTime = child.realProgress?.last_study_date
    ? moment(child.realProgress.last_study_date).format("DD/MM/YYYY")
    : "Tiada rekod aktif";

  return (
    <Card className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-4">
      {/* Profil Header */}
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center border-2 border-indigo-100 shrink-0 overflow-hidden">
          {avatarIsUrl ? (
            <img src={avatar} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl select-none">{avatar}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-black text-slate-800 truncate">{displayName}</h2>
          {child.full_name && child.full_name !== displayName && (
            <p className="text-[10px] text-slate-400 font-medium truncate">{child.full_name}</p>
          )}
          <div className="flex items-center gap-1.5 mt-1">
            <span className="flex items-center gap-0.5 text-[9px] text-slate-400 font-bold">
              <Clock className="w-2.5 h-2.5 text-indigo-500" /> {lastActiveTime}
            </span>
            {child.education_level && (
              <span className="text-[9px] text-slate-400 font-bold bg-slate-50 px-1.5 py-0.5 rounded-full">
                {child.education_level}
              </span>
            )}
          </div>
        </div>
        {hasMultiple && (
          <Button
            onClick={onSwitch}
            className="shrink-0 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl font-bold text-[10px] h-8 px-3 border-0"
          >
            <RefreshCw className="w-3 h-3 mr-1" /> Tukar
          </Button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-1 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
        <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
          <span className="flex items-center gap-0.5"><Zap className="w-3 h-3 text-purple-500" /> XP TERKUMPUL</span>
          <span>{currentXP} XP ({xpPercentage}%)</span>
        </div>
        <Progress value={xpPercentage} className="h-1.5 bg-slate-100 rounded-full" />
      </div>

      {/* Stats Table Elements Alternative */}
      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="bg-amber-50/60 border border-amber-100/50 p-2 rounded-xl flex flex-col items-center justify-center">
          <Star className="w-4 h-4 text-amber-500 mb-0.5" />
          <span className="text-[8px] font-bold text-slate-400 uppercase">Tahap</span>
          <span className="text-xs font-black text-slate-700 mt-0.5">{currentLevel}</span>
        </div>
        <div className="bg-purple-50/60 border border-purple-100/50 p-2 rounded-xl flex flex-col items-center justify-center">
          <Zap className="w-4 h-4 text-purple-500 mb-0.5" />
          <span className="text-[8px] font-bold text-slate-400 uppercase">XP</span>
          <span className="text-xs font-black text-slate-700 mt-0.5">{currentXP}</span>
        </div>
        <div className="bg-amber-50/60 border border-amber-100/50 p-2 rounded-xl flex flex-col items-center justify-center">
          <Coins className="w-4 h-4 text-amber-500 mb-0.5" />
          <span className="text-[8px] font-bold text-slate-400 uppercase">Koin</span>
          <span className="text-xs font-black text-slate-700 mt-0.5">{coins}</span>
        </div>
        <div className="bg-orange-50/60 border border-orange-100/50 p-2 rounded-xl flex flex-col items-center justify-center">
          <Flame className="w-4 h-4 text-orange-500 mb-0.5" />
          <span className="text-[8px] font-bold text-slate-400 uppercase">Streak</span>
          <span className="text-xs font-black text-slate-700 mt-0.5">{streakDays}</span>
        </div>
      </div>

      {/* Mission Footer Info */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-indigo-50/50 border border-indigo-100/40 p-2.5 rounded-xl flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-500 shrink-0" />
          <div className="min-w-0">
            <span className="block text-[8px] font-bold text-slate-400 uppercase">Topik Semasa</span>
            <span className="text-[10px] font-black text-slate-700 truncate block">{currentTopic}</span>
          </div>
        </div>
        <div className="bg-slate-900 p-2.5 rounded-xl flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
          <div className="min-w-0">
            <span className="block text-[8px] font-bold text-slate-400 uppercase">Sesi Terakhir</span>
            <span className="text-[10px] font-black text-white">{totalStudyMinutes} minit</span>
          </div>
        </div>
      </div>

      <button
        onClick={() => navigate("/parent/children")}
        className="w-full flex items-center justify-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 py-2"
      >
        Lihat Laporan Penuh <ArrowRight className="w-3 h-3" />
      </button>
    </Card>
  );
}

export default function ParentDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [currentWeather, setCurrentWeather] = useState({ temp: 31, code: 0, locationName: "Kota Kinabalu" });
  const [hourlyForecast, setHourlyForecast] = useState([]);
  const [loadingWeather, setLoadingWeather] = useState(true);

  const fetchWeatherAndForecast = useCallback(async (lat, lon, name) => {
    try {
      setLoadingWeather(true);
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,weathercode&timezone=auto`
      );
      const data = await res.json();
      
      if (data?.current_weather) {
        setCurrentWeather({
          temp: Math.round(data.current_weather.temperature),
          code: data.current_weather.weathercode,
          locationName: name,
        });
      }
      
      if (data?.hourly?.time) {
        const now = moment();
        const forecastList = [];
        
        for (let i = 0; i < data.hourly.time.length; i++) {
          const forecastTime = moment(data.hourly.time[i]);
          
          if (forecastTime.isSameOrAfter(now, "hour") && forecastList.length < 5) {
            forecastList.push({
              time: forecastTime.format("h a"),
              temp: Math.round(data.hourly.temperature_2m?.[i] ?? 0),
              code: data.hourly.weathercode?.[i] ?? 0,
            });
          }
        }
        setHourlyForecast(forecastList);
      }
    } catch (error) {
      console.error("Gagal memuatkan ramalan cuaca:", error);
    } finally {
      setLoadingWeather(false);
    }
  }, []);

  const handleLocationDetection = useCallback(() => {
    if (!navigator.geolocation) {
      fetchWeatherAndForecast(5.9804, 116.0735, "Kota Kinabalu");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => fetchWeatherAndForecast(position.coords.latitude, position.coords.longitude, "Lokasi Semasa"),
      () => fetchWeatherAndForecast(5.9804, 116.0735, "Kota Kinabalu")
    );
  }, [fetchWeatherAndForecast]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const kids = await loadChildrenWithStats();
      setChildren(kids);

      if (kids.length === 0) {
        setSelectedChild(null);
        return;
      }

      if (kids.length === 1) {
        setSelectedChildId(kids[0].id);
        setSelectedChild(kids[0]);
        return;
      }

      const selectedId = getSelectedChildId();
      const found = kids.find((k) => k.id === selectedId);
      if (found) {
        setSelectedChild(found);
      } else {
        navigate("/parent/select-child");
      }
    } catch (err) {
      console.error("Gagal memuatkan data dashboard:", err);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    handleLocationDetection();
  }, [handleLocationDetection]);

  const currentDetails = getWeatherDetails(currentWeather.code);
  const CurrentIcon = currentDetails.icon;

  const handleSwitchChild = () => navigate("/parent/select-child");

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-xs text-slate-400 font-bold mt-2">Memuatkan dashboard...</p>
      </div>
    );
  }

  const greetingName = selectedChild ? getChildDisplayName(selectedChild) : "";

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-7xl mx-auto bg-slate-50/40 min-h-screen">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          {selectedChild ? (
            <>
              <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                Selamat datang kembali, {greetingName}! 🎒
              </h1>
              <p className="text-slate-500 text-xs">Pantau progres pembelajaran dan urus ganjaran.</p>
            </>
          ) : (
            <>
              <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">Pusat Kawalan Ibu Bapa 🛡️</h1>
              <p className="text-slate-500 text-xs">Tambah profil anak untuk mula mengikuti progres mereka.</p>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs h-10 px-4 shadow-sm transition-all active:scale-95"
            onClick={() => setIsAddModalOpen(true)}
          >
            <UserPlus className="w-4 h-4 mr-2" /> Tambah Anak
          </Button>
          <Button
            variant="outline"
            className="sm:flex-none border-slate-200 text-slate-600 rounded-xl font-bold text-xs h-10 px-4 hover:bg-slate-50"
            onClick={() => navigate("/parent/children")}
          >
            <Settings className="w-3.5 h-3.5 mr-2" /> Urus
          </Button>
        </div>
      </div>

      {/* Grid Links Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <ShortcutCard icon={Gift} title="Ganjaran" desc="Urus kedai hadiah" gradient="from-pink-500 to-rose-400" onClick={() => navigate("/parent/rewards")} />
        <ShortcutCard icon={BarChart2} title="Analitik" desc="Prestasi penuh anak" gradient="from-blue-500 to-cyan-500" onClick={() => navigate("/parent/children")} />
        <ShortcutCard icon={Target} title="Misi Baru" desc="Beri tugasan khas" gradient="from-emerald-500 to-teal-400" onClick={() => navigate("/parent/children")} />
        <ShortcutCard icon={Settings} title="Tetapan" desc="Kawalan akaun & had" gradient="from-slate-700 to-slate-500" onClick={() => toast({ title: "Modul Tetapan", description: "Fungsi ini akan hadir segera!" })} />
      </div>

      {/* Main Core View Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-8 space-y-4">
          {selectedChild ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <SelectedChildPanel
                child={selectedChild}
                onSwitch={handleSwitchChild}
                hasMultiple={children.length > 1}
              />
            </motion.div>
          ) : (
            <Card className="p-8 text-center border-dashed border-2 border-slate-200 rounded-2xl bg-white">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <UserPlus className="w-6 h-6 text-slate-300" />
              </div>
              <p className="text-sm text-slate-500 font-medium mb-4">Tiada profil anak yang dihubungkan lagi.</p>
              <Button
                size="sm"
                className="bg-indigo-600 text-white rounded-xl font-bold text-xs px-6"
                onClick={() => setIsAddModalOpen(true)}
              >
                Hubungkan Akaun Anak Sekarang
              </Button>
            </Card>
          )}
        </div>

        {/* Forecast Sidebar Panel */}
        <div className="lg:col-span-4 space-y-3">
          <Card className="p-4 rounded-2xl border-sky-100 bg-gradient-to-br from-blue-50 to-sky-100/60 flex flex-col justify-between space-y-4 shadow-sm">
            {loadingWeather ? (
              <div className="text-[11px] font-medium text-slate-400 animate-pulse py-6 text-center w-full">
                Menyinkronkan ramalan cuaca...
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center w-full">
                  <div>
                    <div className="flex items-center gap-1 text-sky-600 text-[10px] font-bold uppercase tracking-wider mb-0.5">
                      <MapPin className="w-3 h-3" /> {currentWeather.locationName}
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 leading-tight">
                      {currentWeather.temp}°C
                      <span className={`text-xs font-bold ml-1.5 ${currentDetails.color}`}>{currentDetails.label}</span>
                    </h3>
                  </div>
                  <CurrentIcon className={`w-8 h-8 ${currentDetails.color}`} />
                </div>
                <div className="border-t border-sky-200/40 w-full" />
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-sky-500" /> Ramalan 5 Jam Akan Datang
                  </p>
                  <div className="grid grid-cols-5 gap-1 text-center w-full">
                    {hourlyForecast.map((hourData, idx) => {
                      const hourDetails = getWeatherDetails(hourData.code);
                      const HourIcon = hourDetails.icon;
                      return (
                        <div key={idx} className="bg-white/40 p-1.5 rounded-xl border border-white/40 flex flex-col items-center justify-between min-w-0">
                          <span className="text-[9px] text-slate-400 font-bold uppercase">{hourData.time}</span>
                          <HourIcon className={`w-4 h-4 my-1 ${hourDetails.color}`} />
                          <span className="text-xs font-black text-slate-700">{hourData.temp}°C</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>

      <AddChildModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onChildAdded={loadData}
      />
    </div>
  );
}
