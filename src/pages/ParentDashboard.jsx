// ---------------- KOMPONEN KAD CUACA (DIPERTINGKATKAN DENGAN FALLBACK) ----------------
function WeatherCard() {
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [location, setLocation] = useState("Mencari lokasi...");
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

      // Jika tiada nama lokasi diberi, kita cari guna Reverse Geocoding
      if (!finalLocationName) {
        const locRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=ms`);
        const locData = await locRes.json();
        finalLocationName = locData.city || locData.locality || "Lokasi Anda";
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
          // FALLBACK: Jika ditolak, guna lokasi lalai (Contoh: Kuala Lumpur)
          setErrorMsg("GPS ditolak. Memaparkan cuaca lalai (Kuala Lumpur).");
          fetchWeatherData(3.1390, 101.6869, "Kuala Lumpur"); 
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
       setErrorMsg("Pelayar anda tidak menyokong GPS.");
       fetchWeatherData(3.1390, 101.6869, "Kuala Lumpur");
    }
  };

  useEffect(() => {
    requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <Card className="p-5 rounded-2xl shadow-sm border-sky-100 bg-gradient-to-br from-blue-50 to-sky-100 relative overflow-hidden">
      <div className="absolute -top-6 -right-6 opacity-10">
        <MainIcon className="w-28 h-28 text-sky-900" />
      </div>
      
      <div className="flex justify-between items-start relative z-10">
        <div>
          <div className="flex items-center gap-1 mb-1.5 text-sky-600">
            <MapPin className="w-3 h-3" />
            <p className="text-[9px] font-bold uppercase tracking-wider line-clamp-1">{location}</p>
          </div>
          <div className="flex items-end gap-2">
            <h3 className="text-4xl font-black text-slate-800 leading-none">{weather.temp}°<span className="text-xl">C</span></h3>
          </div>
          <p className={`text-xs font-bold mt-1.5 ${currentDetails.color}`}>{currentDetails.label}</p>
        </div>
        <div className="w-14 h-14 bg-white/60 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-sm border border-white flex-col">
          <MainIcon className={`w-7 h-7 ${currentDetails.color}`} />
        </div>
      </div>

      <p className="text-[10px] text-sky-800/80 font-medium leading-relaxed mt-3 relative z-10 italic border-l-2 border-sky-300 pl-2">
        "{currentDetails.advice}"
      </p>

      {errorMsg && (
        <p className="text-[8px] text-orange-500 mt-2 font-semibold">⚠️ {errorMsg}</p>
      )}

      {/* RAMALAN 5 JAM AKAN DATANG */}
      <div className="mt-4 pt-4 border-t border-sky-200/60 relative z-10">
        <p className="text-[9px] font-bold text-sky-600 uppercase tracking-wider mb-3">Ramalan Seterusnya</p>
        <div className="flex justify-between items-center gap-1">
          {forecast.map((f, i) => {
             const hourlyDetail = getWeatherDetails(f.code);
             const HourIcon = hourlyDetail.Icon;
             const timeStr = new Date(f.time).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
             
             return (
               <div key={i} className="flex flex-col items-center text-center">
                 <span className="text-[9px] text-slate-500 font-bold mb-1.5">{timeStr}</span>
                 <HourIcon className={`w-4 h-4 ${hourlyDetail.color} mb-1.5`} />
                 <span className="text-[11px] font-black text-slate-700">{f.temp}°</span>
               </div>
             )
          })}
        </div>
      </div>
    </Card>
  );
}