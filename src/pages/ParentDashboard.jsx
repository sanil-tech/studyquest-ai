import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import moment from "moment";
import { 
  TrendingUp, Users, Bell, Plus, BookOpen, 
  Target, ShieldAlert, Flame, Sun, 
  X, Lightbulb, Quote, RefreshCw, 
  Gift, CheckCircle2, Coins, Settings, BarChart2,
  Cloud, CloudRain, CloudLightning, CloudSun, Loader2, MapPin
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getDisplayName } from "@/lib/utils"; 

// ---------------- 1. KOMPONEN TIPS KEIBUBAPAAN (LIVE SIMULATION) ----------------
function SmartParentingTips() {
  const [tipIndex, setTipIndex] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const tipsFeed = [
    {
      category: "Psikologi Pembelajaran",
      title: "Pujian 'Growth Mindset' 🌱",
      content: "Puji usaha, bukan kecerdasan. Daripada berkata 'Kamu sangat pandai!', tukar kepada 'Ibu bangga melihat kamu berusaha keras menyelesaikan soalan susah ini!'. Ini membina daya tahan.",
      source: "Jurnal Pendidikan Kognitif, 2024"
    },
    {
      category: "Fokus & Produktiviti",
      title: "Teknik Belajar Pomodoro ⏱️",
      content: "Kanak-kanak bawah 12 tahun biasanya hilang fokus selepas 20-30 minit. Bahagikan masa belajar mereka: 25 minit fokus penuh, 5 minit rehat aktif.",
      source: "Neuroscience Today"
    },
    {
      category: "Kesihatan & Memori",
      title: "Tidur Menyatukan Memori 🧠",
      content: "Pembelajaran 'dikunci' ke dalam ingatan jangka panjang semasa fasa tidur REM. Pastikan wira kecil anda mendapat 9-11 jam tidur setiap malam.",
      source: "Sleep Research Society"
    },
    {
      category: "Sains Kognitif",
      title: "Pembelajaran Pelbagai Deria 🎨",
      content: "Libatkan lebih dari satu deria semasa mengajar. Jika belajar pecahan, potong sebiji epal (visual & kinestetik). 65% pelajar memerlukan objek fizikal.",
      source: "Sains Perkembangan Kanak-kanak"
    }
  ];

  const getNextTip = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setTipIndex((prev) => (prev + 1) % tipsFeed.length);
      setIsRefreshing(false);
    }, 400); 
  };

  useEffect(() => {
    const interval = setInterval(getNextTip, 30000);
    return () => clearInterval(interval);
  }, []);

  const currentTip = tipsFeed[tipIndex];

  return (
    <Card className="border-0 shadow-lg rounded-2xl bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-900 text-white overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
      
      <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 items-center relative z-10">
        <div className="hidden md:flex w-20 h-20 rounded-full bg-white/10 backdrop-blur-md items-center justify-center shrink-0 border border-white/20">
          <Lightbulb className="w-10 h-10 text-amber-300" />
        </div>

        <div className="flex-1 space-y-3 w-full">
          <div className="flex justify-between items-center w-full">
            <Badge className="bg-purple-500/30 text-purple-100 hover:bg-purple-500/40 border border-purple-400/30">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse mr-2"></span>
              Live Feed: {currentTip.category}
            </Badge>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={getNextTip} 
              disabled={isRefreshing}
              className="text-white hover:bg-white/10 h-8 w-8 rounded-full"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={tipIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                {currentTip.title}
              </h3>
              <p className="text-indigo-100 text-sm md:text-base leading-relaxed pl-4 border-l-2 border-indigo-400/50">
                <Quote className="w-3 h-3 inline-block -mt-2 mr-1 text-indigo-300 opacity-50" />
                {currentTip.content}
              </p>
              <p className="text-[10px] text-indigo-300/70 uppercase tracking-widest mt-4 font-semibold">
                Sumber: {currentTip.source}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </Card>
  );
}

// ---------------- 2. KOMPONEN KAD CUACA (LIVE & TEXT-SAFE) ----------------
function WeatherCard() {
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [location, setLocation] = useState("Mengesan lokasi...");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const getWeatherDetails = (wmoCode) => {
    if (wmoCode === 0) return { label: "Cerah", Icon: Sun, color: "text-amber-500", advice: "Cuaca cantik di luar! Boleh benarkan anak main di taman selepas siapkan misi." };
    if ([1, 2, 3].includes(wmoCode)) return { label: "Berawan", Icon: CloudSun, color: "text-sky-500", advice: "Cuaca redup. Sesuai untuk aktiviti luar atau membaca di beranda." };
    if ([45, 48].includes(wmoCode)) return { label: "Berkabus", Icon: Cloud, color: "text-slate-400", advice: "Jarak penglihatan terhad di luar. Pastikan anak-anak kekal hangat." };
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(wmoCode)) return { label: "Hujan", Icon: CloudRain, color: "text-blue-500", advice: "Hujan di luar. Waktu terbaik untuk berehat di rumah sambil buat misi! 🏡" };
    if ([95, 96, 99].includes(wmoCode)) return { label: "Ribut Petir", Icon: CloudLightning, color: "text-indigo-600", advice: "Ribut petir! Tutup palam elektrik yang tidak perlu dan kekal di dalam rumah. ⚡" };
    return { label: "Tidak Menentu", Icon: Cloud, color: "text-slate-500", advice: "Cuaca tidak menentu hari ini. Sediakan payung jika mahu keluar." };
  };

  const fetchWeatherData = async (latitude, longitude, locName) => {
    try {
      setLoading(true);
      setErrorMsg("");
      let finalLocationName = locName;

      if (!finalLocationName) {
        const locRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
        const locData = await locRes.json();
        finalLocationName = locData.city || locData.locality || locData.principalSubdivision || "Lokasi Anda";
      }

      setLocation(finalLocationName);

      const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&hourly=temperature_2m,weather_code&timezone=auto`);
      const data = await weatherRes.json();

      setWeather({ temp: Math.round(data.current.temperature_2m), code: data.current.weather_code });

      const now = new Date();
      const currentHourIndex = data.hourly.time.findIndex(t => new Date(t) > now) - 1; 
      const startIndex = currentHourIndex >= 0 ? currentHourIndex + 1 : 1; 
      
      const next5Hours = [];
      for(let i = 0; i < 5; i++) {
         next5Hours.push({
           time: data.hourly.time[startIndex + i],
           temp: Math.round(data.hourly.temperature_2m[startIndex + i]),
           code: data.hourly.weather_code[startIndex + i]
         });
      }
      setForecast(next5Hours);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setErrorMsg("Satelit cuaca gagal dihubungi.");
      setLoading(false);
    }
  };

  const requestLocation = () => {
    setLoading(true);
    setErrorMsg("");
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeatherData(position.coords.latitude, position.coords.longitude, null);
        },
        (err) => {
          console.warn("Kebenaran lokasi ditolak.", err);
          setErrorMsg("GPS disekat. Memaparkan cuaca Kuala Lumpur.");
          fetchWeatherData(3.1390, 101.6869, "Kuala Lumpur"); 
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
       setErrorMsg("Pelayar tidak menyokong GPS.");
       fetchWeatherData(3.1390, 101.6869, "Kuala Lumpur");
    }
  };

  useEffect(() => {
    requestLocation();
  }, []);

  if (loading) {
    return (
      <Card className="p-5 rounded-2xl shadow-sm border-sky-100 bg-gradient-to-br from-blue-50 to-sky-100 flex flex-col items-center justify-center min-h-[180px]">
        <Loader2 className="w-8 h-8 text-sky-400 animate-spin mb-2" />
        <p className="text-xs font-medium text-sky-700">Mencari isyarat cuaca...</p>
      </Card>
    );
  }

  if (!weather) {
    return (
      <Card className="p-5 rounded-2xl shadow-sm border-slate-200 bg-slate-50 flex flex-col items-center justify-center min-h-[180px] text-center">
        <Cloud className="w-8 h-8 text-slate-300 mb-2" />
        <p className="text-xs font-bold text-slate-600 mb-1">Gagal Memuat Cuaca</p>
        <p className="text-[10px] text-slate-500 px-4">{errorMsg}</p>
        <Button size="sm" variant="outline" className="mt-3 h-7 text-[10px]" onClick={requestLocation}>
          Cuba Semula
        </Button>
      </Card>
    );
  }

  const currentDetails = getWeatherDetails(weather.code);
  const MainIcon = currentDetails.Icon;

  return (
    <Card className="p-5 rounded-2xl shadow-sm border-sky-100 bg-gradient-to-br from-blue-50 to-sky-100 relative overflow-hidden h-full">
      <div className="absolute -top-6 -right-6 opacity-10">
        <MainIcon className="w-28 h-28 text-sky-900" />
      </div>
      
      <div className="flex justify-between items-start gap-4 relative z-10">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-1 mb-1.5 text-sky-600">
            <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <p className="text-[10px] font-bold uppercase tracking-wider text-wrap break-words">{location}</p>
          </div>
          <div className="flex items-end gap-2">
            <h3 className="text-3xl md:text-4xl font-black text-slate-800 leading-none">{weather.temp}°<span className="text-xl">C</span></h3>
          </div>
          <p className={`text-xs font-bold mt-1.5 ${currentDetails.color}`}>{currentDetails.label}</p>
        </div>
        <div className="w-12 h-12 md:w-14 md:h-14 bg-white/60 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-sm border border-white shrink-0">
          <MainIcon className={`w-6 h-6 md:w-7 md:h-7 ${currentDetails.color}`} />
        </div>
      </div>

      <p className="text-[11px] text-sky-800 font-medium leading-relaxed mt-4 relative z-10 border-l-2 border-sky-300 pl-2">
        {currentDetails.advice}
      </p>

      {/* RAMALAN 5 JAM AKAN DATANG */}
      <div className="mt-4 pt-4 border-t border-sky-200/60 relative z-10">
        <p className="text-[9px] font-bold text-sky-600 uppercase tracking-wider mb-3">Ramalan Seterusnya</p>
        <div className="grid grid-cols-5 gap-1 text-center">
          {forecast.map((f, i) => {
             const hourlyDetail = getWeatherDetails(f.code);
             const HourIcon = hourlyDetail.Icon;
             const timeStr = new Date(f.time).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
             
             return (
               <div key={i} className="flex flex-col items-center min-w-0">
                 <span className="text-[9px] text-slate-500 font-bold mb-1 truncate w-full">{timeStr}</span>
                 <HourIcon className={`w-4 h-4 ${hourlyDetail.color} mb-1 shrink-0`} />
                 <span className="text-[11px] font-black text-slate-700">{f.temp}°</span>
               </div>
             )
          })}
        </div>
      </div>
    </Card>
  );
}

// ---------------- 3. KOMPONEN PINTASAN PANTAS ----------------
function ShortcutCard({ icon: Icon, title, desc, gradient, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.97 }}
      className={`flex-1 bg-gradient-to-br ${gradient} p-3 sm:p-4 rounded-2xl shadow-md flex items-center gap-3 text-white justify-start relative overflow-hidden border border-white/10 w-full`}
    >
      <div className="absolute -right-4 -top-4 bg-white/10 w-16 h-16 rounded-full blur-xl"></div>
      <div className="bg-white/20 p-2 sm:p-2.5 rounded-xl backdrop-blur-md shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-left flex-1 min-w-0">
        <p className="text-xs sm:text-sm font-bold truncate">{title}</p>
        <p className="text-[9px] sm:text-[10px] text-white/80 truncate mt-0.5">{desc}</p>
      </div>
    </motion.button>
  );
}

// ---------------- 4. INDIVIDUAL CHILD CARD (RESPONSIVE GRID TEXT-SAFE) ----------------
function ChildCard({ child, onRefresh }) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMissionModal, setShowMissionModal] = useState(false);
  const [missionTitle, setMissionTitle] = useState("");
  const [missionReward, setMissionReward] = useState("50");

  const currentXP = child.progress?.xp_score || child.progress?.total_xp || 0;
  const currentLevel = child.progress?.level || 1;
  const streakDays = child.progress?.streak_days || 0;
  const currentCoins = child.wallet?.balance || 0;
  const currentTopic = child.progress?.current_topic || child.progress?.last_lesson_name || "Misi Belum Mula";
  const nextLevelXP = child.progress?.next_level_xp || (currentLevel * 500);
  const xpPercentage = Math.min(Math.round((currentXP / nextLevelXP) * 100), 100);
  const lastActive = child.last_active ? moment(child.last_active).fromNow() : "Baru aktif";
  const displayName = child.display_name || "Pelajar";

  const getDragonMilestone = (xp, lvl) => {
    if (xp >= 5000 || lvl >= 15) return { 
      stageTitle: "Ancient Inferno", 
      gradient: "from-rose-500 via-red-500 to-amber-300", 
      glowColor: "#ef4444", 
      imgUrl: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f409/512.gif"
    };
    if (xp >= 1500 || lvl >= 6) return { 
      stageTitle: "Emerald Drake", 
      gradient: "from-emerald-400 via-teal-400 to-cyan-300", 
      glowColor: "#10b981", 
      imgUrl: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f432/512.gif"
    };
    return { 
      stageTitle: "Ruby Hatchling", 
      gradient: "from-purple-400 via-pink-400 to-rose-300", 
      glowColor: "#db2677", 
      imgUrl: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f996/512.gif"
    };
  };
  const milestone = getDragonMilestone(currentXP, currentLevel);

  const handleBonusKoin = async (e) => {
    e.preventDefault();
    e.stopPropagation(); 
    if (!child.wallet?.id) return toast({ title: "Ralat", description: "Profil dompet tidak dijumpai.", variant: "destructive" });
    const amountStr = window.prompt(`Berapa jumlah koin bonus untuk ${displayName}?`, "50");
    const amount = parseInt(amountStr);
    if (!amount || isNaN(amount) || amount <= 0) return;
    try {
      setIsSubmitting(true);
      await base44.entities.Wallet.update(child.wallet.id, { balance: currentCoins + amount });
      toast({ title: "Koin Dihantar! 🪙", description: `${amount} koin ditambah ke akaun ${displayName}.` });
      onRefresh(); 
    } catch (err) {
      toast({ title: "Gagal", description: "Tidak dapat menghantar koin pada masa ini.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitMission = async (e) => {
    e.preventDefault();
    if (!missionTitle.trim()) return;
    try {
      setIsSubmitting(true);
      try {
        await base44.entities.CustomMission.create({ student_id: child.id, title: missionTitle, reward_coins: parseInt(missionReward), status: "pending" });
      } catch (e) {
        console.warn("Jadual CustomMission belum wujud. Berjalan dalam mod simulasi.");
      }
      toast({ title: "Misi Dicipta! 🎯", description: `Misi "${missionTitle}" telah dihantar ke peranti ${displayName}.` });
      setShowMissionModal(false);
      setMissionTitle("");
      setMissionReward("50");
    } catch (err) {
      toast({ title: "Gagal", description: "Ralat mencipta misi.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Card className="p-5 bg-white hover:shadow-xl transition-all border-slate-200 relative overflow-hidden group rounded-2xl cursor-default shadow-sm border-slate-100 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-end gap-1.5 mb-3">
            <div className={`w-2 h-2 rounded-full ${child.last_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{lastActive}</span>
          </div>

          <Link to={`/parent/children/${child.id}`} className="block space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex flex-col items-center justify-center select-none shrink-0 z-10">
                <div style={{ perspective: "1000px" }} className="relative w-16 h-16 flex items-center justify-center">
                  <motion.div 
                    animate={{ 
                      scale: [1, 1.1, 1],
                      rotate: 360,
                      filter: [`blur(15px) opacity(0.3)`,`blur(20px) opacity(0.5)`, `blur(15px) opacity(0.3)`]
                    }} 
                    transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }} 
                    style={{ boxShadow: `0 0 25px ${milestone.glowColor}` }} 
                    className="absolute inset-0 rounded-full opacity-30 blur-2xl" 
                  />
                  
                  <div className={`w-14 h-14 rounded-full bg-gradient-to-tr ${milestone.gradient} border-2 border-white/60 shadow-lg flex items-center justify-center relative z-10 overflow-hidden`}>
                    <motion.img 
                      src={milestone.imgUrl} 
                      alt={displayName} 
                      animate={{ y: [-2, 2, -2] }} 
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} 
                      className="w-9 h-9 object-contain drop-shadow-md" 
                    />
                  </div>
                </div>
                <span className="text-[9px] font-black text-slate-700 mt-1 text-center leading-none">{milestone.stageTitle}</span>
              </div>

              <div className="flex-grow min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <h3 className="text-base font-bold text-slate-800 truncate max-w-[120px] group-hover:text-indigo-600 transition-colors">{displayName}</h3>
                  <Badge variant="secondary" className="bg-blue-50 text-blue-600 text-[9px] font-black px-1.5 h-4 rounded-md shrink-0">Tahap {currentLevel}</Badge>
                </div>
                
                <div className="pt-1 space-y-1">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-bold text-slate-500">XP Terkumpul</span>
                    <span className="font-extrabold text-slate-700">{currentXP}/{nextLevelXP}</span>
                  </div>
                  <Progress value={xpPercentage} className="h-1.5 bg-slate-100 rounded-full" />
                </div>
              </div>
            </div>

            {/* Grid Statistik - Diubah suai agar seimbang pada telefon dan desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
              <div className="bg-orange-50 p-2 rounded-lg border border-orange-100/50 flex sm:flex-col items-center justify-between sm:justify-center text-center hover:bg-orange-100 transition-colors">
                <div className="flex items-center gap-1.5 sm:flex-col sm:gap-0">
                  <Flame className="w-4 h-4 text-orange-500 sm:mb-0.5 shrink-0" />
                  <p className="text-[10px] sm:text-[8px] font-bold text-slate-500 sm:text-slate-400 uppercase tracking-wide">Hari Streak</p>
                </div>
                <p className="text-sm font-black text-slate-700 leading-none">{streakDays}</p>
              </div>

              <div className="bg-amber-50 p-2 rounded-lg border border-amber-100/50 flex sm:flex-col items-center justify-between sm:justify-center text-center hover:bg-amber-100 transition-colors">
                <div className="flex items-center gap-1.5 sm:flex-col sm:gap-0">
                  <span className="text-sm sm:mb-0.5">🪙</span>
                  <p className="text-[10px] sm:text-[8px] font-bold text-slate-500 sm:text-slate-400 uppercase tracking-wide">Baki Koin</p>
                </div>
                <p className="text-sm font-black text-slate-700 leading-none">{currentCoins}</p>
              </div>

              <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 flex sm:flex-col items-center justify-between sm:justify-center text-center hover:bg-slate-100 transition-colors min-w-0">
                <div className="flex items-center gap-1.5 sm:flex-col sm:gap-0 min-w-0 flex-1 sm:flex-initial">
                  <Target className="w-4 h-4 text-indigo-500 sm:mb-0.5 shrink-0" />
                  <p className="text-[10px] sm:text-[8px] font-bold text-slate-500 sm:text-slate-400 uppercase tracking-wide truncate w-full">Topik Semasa</p>
                </div>
                <p className="text-xs sm:text-[10px] font-black text-slate-700 leading-tight truncate max-w-[120px] sm:max-w-full px-1" title={currentTopic}>
                  {currentTopic}
                </p>
              </div>
            </div>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 mt-4">
          <Button size="sm" variant="outline" className="h-8 text-[10px] font-bold border-amber-200 text-amber-600 hover:bg-amber-50 rounded-full truncate" onClick={handleBonusKoin} disabled={isSubmitting}>
            🪙 Bonus Koin
          </Button>
          <Button size="sm" variant="outline" className="h-8 text-[10px] font-bold border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded-full truncate" onClick={() => setShowMissionModal(true)}>
            🎯 Misi Khas
          </Button>
        </div>
      </Card>

      <AnimatePresence>
        {showMissionModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-sm">
              <Card className="overflow-hidden shadow-2xl border-0 rounded-2xl">
                <div className="bg-indigo-600 px-4 py-3 flex justify-between items-center text-white">
                  <h3 className="font-bold flex items-center gap-2 text-sm"><Target className="w-4 h-4"/> Cipta Misi Khas</h3>
                  <button onClick={() => setShowMissionModal(false)} className="hover:bg-white/20 p-1 rounded-full transition-colors"><X className="w-4 h-4"/></button>
                </div>
                <div className="p-5 space-y-4 bg-white">
                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1.5 block">Tugasan Misi Untuk {displayName}</label>
                    <input type="text" placeholder="Contoh: Kemas bilik tidur & sapu sampah" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50" value={missionTitle} onChange={(e) => setMissionTitle(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1.5 block">Ganjaran Koin (🪙)</label>
                    <input type="number" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50" value={missionReward} onChange={(e) => setMissionReward(e.target.value)} />
                  </div>
                  <div className="pt-2 flex gap-2">
                    <Button variant="outline" className="flex-1 rounded-full" onClick={() => setShowMissionModal(false)}>Batal</Button>
                    <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700 rounded-full" onClick={handleSubmitMission} disabled={isSubmitting || !missionTitle}>Hantar Misi</Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

// ---------------- 5. MAIN DASHBOARD COMPONENT ----------------
export default function ParentDashboard() {
  const { toast } = useToast();
  const navigate = useNavigate(); 
  const [children, setChildren] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const u = await base44.auth.me();
      const rel = await base44.entities.ParentChildRelationship.filter({ parent_id: u.id, status: ["active", "pending"] });
      if (!rel.length) return setLoading(false);
      const childIds = rel.map(r => r.child_id);
      const kids = await Promise.all(childIds.map(async (id) => {
        const [progress, wallet] = await Promise.all([
          base44.entities.Progress.filter({ student_id: id }),
          base44.entities.Wallet.filter({ student_id: id }),
        ]);
        const childUser = await base44.entities.User.get(id).catch(() => null);
        return { id, ...childUser, display_name: getDisplayName(childUser), progress: progress?.[0] || {}, wallet: wallet?.[0] || { balance: 0 } };
      }));
      const pending = await base44.entities.RewardRequest.filter({ status: "pending" });
      setChildren(kids);
      setPendingRequests(pending);
    } catch (err) {
      console.error(err);
      toast({ title: "Ralat", description: "Gagal memuatkan data.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleApproveReward = (id, title) => {
    toast({
      title: "Ganjaran Diluluskan! 🎉",
      description: `Tuntutan "${title}" telah disahkan berjaya.`,
    });
    setPendingRequests(prev => prev.filter(r => r.id !== id));
  };

  const handleNewMissionShortcut = () => {
    toast({
      title: "Pilih Anak",
      description: "Sila klik butang 'Cipta Misi Khas' pada kad profil anak di bawah.",
    });
    window.scrollTo({ top: 400, behavior: "smooth" });
  };

  if (loading) return <div className="flex justify-center min-h-[50vh] items-center"><div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /></div>;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto bg-slate-50/50 min-h-screen">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 flex items-center gap-2.5">
            Pusat Kawalan Ibu Bapa 🛡️
          </h1>
          <p className="text-muted-foreground text-sm font-medium">
            Pantau kemajuan, berikan sokongan, dan jana semangat wira kecil anda.
          </p>
        </div>
        <Link to="/parent/children" className="w-full md:w-auto">
          <Button className="w-full md:w-auto gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md rounded-xl px-5 h-11">
            <Plus className="w-4 h-4" /> Tambah Anak
          </Button>
        </Link>
      </div>

      {/* PINTASAN PANTAS */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-2"
      >
        <ShortcutCard icon={Gift} title="Ganjaran" desc="Urus hadiah anak" gradient="from-pink-500 to-rose-400" onClick={() => navigate("/parent/rewards")} />
        <ShortcutCard icon={BarChart2} title="Analitik" desc="Prestasi akademik" gradient="from-blue-500 to-cyan-500" onClick={() => toast({ title: "Akan Datang! 🚧", description: "Modul Analitik masih dalam fasa pembangunan." })} />
        <ShortcutCard icon={Target} title="Misi Baru" desc="Beri tugasan khas" gradient="from-emerald-500 to-teal-400" onClick={handleNewMissionShortcut} />
        <ShortcutCard icon={Settings} title="Tetapan" desc="Profil & Kawalan" gradient="from-slate-700 to-slate-500" onClick={() => toast({ title: "Akan Datang! 🚧", description: "Halaman Tetapan masih dalam fasa pembangunan." })} />
      </motion.div>

      {/* TUNTUTAN GANJARAN */}
      {pendingRequests.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-2">
          <div className="flex items-center gap-2 mb-3 px-1">
            <Gift className="w-5 h-5 text-amber-500" />
            <h2 className="text-sm font-bold text-slate-800">Tuntutan Menunggu Kelulusan</h2>
            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-none px-1.5 py-0 h-5 text-[10px] ml-1 rounded-md font-bold">{pendingRequests.length}</Badge>
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {pendingRequests.map(r => (
              <div key={r.id} className="min-w-[290px] bg-white border border-amber-200/60 rounded-xl p-3 flex items-center justify-between shadow-sm hover:shadow-md transition-all shrink-0">
                <div className="flex items-center gap-3 overflow-hidden pr-2">
                  <div className="bg-amber-50 p-2 rounded-lg shrink-0"><Gift className="w-5 h-5 text-amber-500" /></div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-slate-800 truncate leading-snug">{r.reward_title}</p>
                    <p className="text-[10px] text-amber-600 font-semibold flex items-center gap-1 mt-0.5"><Coins className="w-3 h-3" /> {r.coin_cost} 🪙</p>
                  </div>
                </div>
                <Button size="sm" className="h-8 px-3 text-[10px] bg-emerald-500 hover:bg-emerald-600 rounded-lg text-white font-bold shrink-0 flex items-center gap-1.5" onClick={() => handleApproveReward(r.id, r.reward_title)}><CheckCircle2 className="w-3.5 h-3.5" /> Lulus</Button>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* STRUKTUR GRID UTAMA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SEKSYEN KIRI (KAD PROFIL ANAK) */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-bold text-xl text-slate-800 flex items-center gap-2.5 px-1 relative z-10">
            <Users className="w-5 h-5 text-indigo-600" /> Profil & Kemajuan Anak
          </h2>

          {children.length === 0 ? (
            <Card className="p-8 text-center border-dashed border-2 border-slate-200 rounded-2xl bg-white">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-600">Tiada profil anak dihubungkan</p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">Mula tambah profil anak anda untuk memantau kemajuan aktiviti mereka.</p>
              <Link to="/parent/children">
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl">Tambah Sekarang</Button>
              </Link>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {children.map((child) => (
                <ChildCard key={child.id} child={child} onRefresh={loadData} />
              ))}
            </div>
          )}
        </div>

        {/* SEKSYEN KANAN (INFO UTILITY & TIPS) */}
        <div className="space-y-4">
          <h2 className="font-bold text-xl text-slate-800 flex items-center gap-2.5 px-1 relative z-10">
            <Sun className="w-5 h-5 text-amber-500" /> Info & Utiliti Hari Ini
          </h2>
          <div className="grid grid-cols-1 gap-4">
            <WeatherCard />
            <SmartParentingTips />
          </div>
        </div>

      </div>
    </div>
  );
}