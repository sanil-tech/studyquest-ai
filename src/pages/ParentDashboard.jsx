import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link, useNavigate } from "react-router-dom";
import moment from "moment";
import { 
  Users, Plus, Target, Gift, BarChart2, CloudRain, Sun, Cloud, CloudLightning, MapPin, Clock, ArrowRight, Settings
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

// 💡 Pembantu: Mengutamakan nickname, kemudian e-mel
const getDisplayName = (user) => {
  if (!user) return "Pelajar";
  return user.nickname || user.username || user.email || "Pelajar";
};

// Fungsi memetakan kod cuaca Open-Meteo kepada Icon & Teks Bahasa Melayu
const getWeatherDetails = (code) => {
  if ([0, 1].includes(code)) return { label: "Cerah", icon: Sun, color: "text-amber-500" };
  if ([2, 3].includes(code)) return { label: "Berawan", icon: Cloud, color: "text-slate-400" };
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return { label: "Hujan", icon: CloudRain, color: "text-blue-500" };
  if ([95, 96, 99].includes(code)) return { label: "Ribut Petir", icon: CloudLightning, color: "text-purple-500" };
  return { label: "Cerah", icon: Sun, color: "text-amber-500" };
};

// 1. Komponen Pintasan (Shortcut Card)
function ShortcutCard({ icon: Icon, title, desc, gradient, onClick }) {
  return (
    <button 
      onClick={onClick} 
      className={`bg-gradient-to-br ${gradient} p-3 rounded-xl shadow-xs flex items-center gap-3 text-white text-left w-full border border-white/5 hover:opacity-95 transition-opacity active:scale-[0.98]`}
    >
      <div className="bg-white/20 p-2 rounded-lg shrink-0"><Icon className="w-4 h-4" /></div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold truncate">{title}</p>
        <p className="text-[9px] text-white/80 truncate">{desc}</p>
      </div>
    </button>
  );
}

// 2. Komponen Kad Anak Ringkas (Compact Child Card)
function CompactChildCard({ child }) {
  const navigate = useNavigate();
  
  const currentXP = child.progress?.total_xp || 0;
  const currentLevel = child.progress?.level || 1;
  const xpForNext = currentLevel ? currentLevel * 200 : 200;
  const xpPercentage = Math.min(Math.round(((currentXP % xpForNext) / xpForNext) * 100), 100);
  
  const displayName = getDisplayName(child); 
  
  const lastActiveTime = child.progress?.last_study_date 
    ? `Belajar Terakhir: ${moment(child.progress.last_study_date).format("DD/MM/YYYY")}` 
    : "Tiada rekod aktif";
    
  const currentTopic = child.progress?.current_topic || "Misi Belum Mula";

  return (
    <Card 
      onClick={() => navigate(`/parent/children`)} 
      className="p-4 bg-white border border-slate-100 hover:border-indigo-200 shadow-sm hover:shadow-md transition-all rounded-2xl cursor-pointer flex flex-col justify-between group"
    >
      <div className="space-y-3">
        <div className="flex justify-between items-center text-[10px]">
          <span className="flex items-center gap-1 text-slate-400 font-bold uppercase tracking-tight">
            <Clock className="w-3 h-3 text-indigo-500" /> {lastActiveTime}
          </span>
          <span className="text-indigo-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
            Lihat Detail <ArrowRight className="w-3 h-3" />
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100 text-xl shrink-0">
            🦖
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-black text-slate-800 uppercase truncate">{displayName}</h3>
            <p className="text-[10px] text-slate-400 truncate leading-none">{child.email || "Tiada emel"}</p>
            <p className="text-[11px] text-slate-500 font-bold truncate mt-1.5">
              📚 {currentTopic}
            </p>
          </div>
        </div>

        <div className="space-y-1 pt-1">
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
            <span>TAHAP {currentLevel}</span>
            <span className="text-slate-600">{isNaN(xpPercentage) ? 0 : xpPercentage}%</span>
          </div>
          <Progress value={isNaN(xpPercentage) ? 0 : xpPercentage} className="h-1.5 bg-slate-100 rounded-full" />
        </div>
      </div>
    </Card>
  );
}

// 3. Komponen Utama Dashboard
export default function ParentDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mengurus keadaan cuaca semasa dan senarai ramalan 5 jam
  const [currentWeather, setCurrentWeather] = useState({ temp: 31, code: 0, locationName: "Kota Kinabalu" });
  const [hourlyForecast, setHourlyForecast] = useState([]);
  const [loadingWeather, setLoadingWeather] = useState(true);

  // Fungsi memanggil API Cuaca & Ramalan Jam
  const fetchWeatherAndForecast = async (lat, lon, name) => {
    try {
      setLoadingWeather(true);
      // Memohon data cuaca semasa DAN ramalan jam (hourly) sekali gus
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,weathercode`
      );
      const data = await res.json();
      
      if (data?.current_weather) {
        setCurrentWeather({
          temp: Math.round(data.current_weather.temperature),
          code: data.current_weather.weathercode,
          locationName: name
        });
      }

      if (data?.hourly?.time) {
        const now = moment();
        const forecastList = [];
        
        // Cari indeks masa yang sepadan atau terdekat dengan waktu sekarang
        for (let i = 0; i < data.hourly.time.length; i++) {
          const forecastTime = moment(data.hourly.time[i]);
          
          // Ambil waktu bermula dari jam semasa dan 5 jam ke hadapan
          if (forecastTime.isSameOrAfter(now, "hour") && forecastList.length < 5) {
            forecastList.push({
              time: forecastTime.format("h a"), // format: "1 pm", "2 pm"
              temp: Math.round(data.hourly.temperature_2m[i]),
              code: data.hourly.weathercode[i]
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
  };

  const handleLocationDetection = () => {
    if (!navigator.geolocation) {
      fetchWeatherAndForecast(5.9804, 116.0735, "Kota Kinabalu");
      return;
    }

    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        fetchWeatherAndForecast(position.coords.latitude, position.coords.longitude, "Lokasi Semasa");
      },
      (error) => {
        console.warn("Akses lokasi disekat. Default ke Kota Kinabalu.");
        fetchWeatherAndForecast(5.9804, 116.0735, "Kota Kinabalu");
      },
      geoOptions
    );
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const u = await base44.auth.me();
      const rel = await base44.entities.ParentChildRelationship.filter({ parent_id: u.id, status: "active" });
      
      if (!rel || !rel.length) {
        setChildren([]);
        return;
      }
      
      const childIds = rel.map(r => r.child_id);
      const kids = await Promise.all(childIds.map(async (id) => {
        const progressPromise = base44.entities.Progress.filter({ student_id: id }).catch(() => []);
        const childUserPromise = base44.entities.User.get(id).catch(() => null);
        const [progress, childUser] = await Promise.all([progressPromise, childUserPromise]);
        
        return { id, ...childUser, progress: progress?.[0] || {} };
      }));
      
      setChildren(kids);
    } catch (err) {
      console.error("Gagal memuatkan data dashboard:", err);
    } finally { 
      setLoading(false);
    }
  };

  useEffect(() => { 
    loadData(); 
    handleLocationDetection(); 
  }, []);

  const currentDetails = getWeatherDetails(currentWeather.code);
  const CurrentIcon = currentDetails.icon;

  if (loading) {
    return (
      <div className="p-6 text-center text-xs font-medium text-slate-400 min-h-screen flex items-center justify-center">
        Memuatkan dashboard...
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-7xl mx-auto bg-slate-50/40 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">Pusat Kawalan Ibu Bapa 🛡️</h1>
          <p className="text-slate-500 text-xs">Aktiviti semasa, kelulusan segera, dan status ringkas anak anda.</p>
        </div>
        <Button size="sm" className="bg-indigo-600 text-white rounded-xl font-bold text-xs h-9 px-3.5 hover:bg-indigo-700" onClick={() => navigate("/parent/children")}>
          <Plus className="w-3.5 h-3.5 mr-1" /> Urus Anak
        </Button>
      </div>

      {/* Kad Pintasan */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <ShortcutCard icon={Gift} title="Ganjaran" desc="Urus kedai hadiah" gradient="from-pink-500 to-rose-400" onClick={() => navigate("/parent/rewards")} />
        <ShortcutCard icon={BarChart2} title="Analitik" desc="Prestasi penuh anak" gradient="from-blue-500 to-cyan-500" onClick={() => navigate("/parent/children")} />
        <ShortcutCard icon={Target} title="Misi Baru" desc="Beri tugasan khas" gradient="from-emerald-500 to-teal-400" onClick={() => navigate("/parent/children")} />
        <ShortcutCard icon={Settings} title="Tetapan" desc="Kawalan akaun & had" gradient="from-slate-700 to-slate-500" onClick={() => toast({ title: "Modul Tetapan", description: "Fungsi ini akan tersedia tidak lama lagi." })} />
      </div>

      {/* Konten Utama */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-8 space-y-4">
          <div className="space-y-2.5">
            <div className="flex justify-between items-center px-0.5">
              <h2 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" /> Ringkasan Aktiviti Anak
              </h2>
              <Link to="/parent/children" className="text-xs font-bold text-indigo-600 hover:underline">
                Lihat Laporan Penuh &rarr;
              </Link>
            </div>
            
            {children.length === 0 ? (
              <Card className="p-8 text-center border-dashed border-2 border-slate-200 rounded-2xl bg-white">
                <p className="text-sm text-slate-500 font-medium mb-3">Tiada profil anak yang dihubungkan lagi.</p>
                <Button size="sm" variant="outline" className="rounded-xl font-bold text-xs" onClick={() => navigate("/parent/children")}>
                  Hubungkan Akaun Anak
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {children.map((child) => (
                  <CompactChildCard key={child.id} child={child} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 🌤️ WIDGET CUACA KINI & RAMALAN 5 JAM */}
        <div className="lg:col-span-4 space-y-3">
          <Card className="p-4 rounded-2xl border-sky-100 bg-gradient-to-br from-blue-50 to-sky-100/60 flex flex-col justify-between space-y-4 shadow-xs">
            {loadingWeather ? (
              <div className="text-[11px] font-medium text-slate-400 animate-pulse py-6 text-center w-full">
                Menyinkronkan ramalan cuaca semasa...
              </div>
            ) : (
              <>
                {/* Cuaca Semasa */}
                <div className="flex justify-between items-center w-full">
                  <div>
                    <div className="flex items-center gap-1 text-sky-600 text-[10px] font-bold uppercase tracking-wider mb-0.5">
                      <MapPin className="w-3 h-3" /> {currentWeather.locationName}
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 leading-tight">
                      {currentWeather.temp}°C 
                      <span className={`text-xs font-bold ml-1.5 ${currentDetails.color}`}>
                        {currentDetails.label}
                      </span>
                    </h3>
                  </div>
                  <CurrentIcon className={`w-8 h-8 ${currentDetails.color}`} />
                </div>

                {/* Garis Pemisah Visual */}
                <div className="border-t border-sky-200/40 w-full" />

                {/* Bar Grid: Ramalan 5 Jam ke Hadapan */}
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
    </div>
  );
}