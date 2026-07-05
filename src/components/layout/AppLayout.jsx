import React, { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Home, BookOpen, Trophy, Wallet, Bell, User, Users, Gift, CheckSquare } from "lucide-react";

const studentNav = [
  { path: "/dashboard", icon: Home, label: "Utama" },
  { path: "/study", icon: BookOpen, label: "Belajar" },
  { path: "/wallet", icon: Wallet, label: "Dompet" },
  { path: "/rewards", icon: Trophy, label: "Ganjaran" },
];

const parentNav = [
  { path: "/parent", icon: Home, label: "Utama" },
  { path: "/parent/children", icon: Users, label: "Anak-anak" },
  { path: "/parent/rewards", icon: Gift, label: "Ganjaran" },
  { path: "/parent/approvals", icon: CheckSquare, label: "Kelulusan" },
];

// Kita letakkan enjin audio di luar supaya ia boleh diguna semula tanpa sela masa (lag)
let audioCtx = null;

const mainkanBunyiPop = () => {
  try {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext();
    }
    
    // Resume jika audio terhenti (polisi browser)
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = 'sine';
    
    oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.05);

    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.1);
  } catch (e) {
    console.warn("Audio disekat:", e);
  }
};

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  useEffect(() => {
    if (!user) return;
    base44.entities.Notification.filter({ user_id: user.id, read: false })
      .then(n => setUnreadCount(n.length))
      .catch(() => {});
  }, [user, location]);

  const isParent = user?.app_role === "parent";
  const nav = isParent ? parentNav : studentNav;

  useEffect(() => {
    if (!user) return;
    const studentPaths = ["/dashboard", "/study", "/quiz", "/wallet", "/rewards"];
    const parentPaths = ["/parent", "/parent/children", "/parent/rewards", "/parent/approvals"];

    const onStudentPath = studentPaths.some(p => location.pathname.startsWith(p));
    const onParentPath = parentPaths.some(p => location.pathname.startsWith(p));

    if (isParent && onStudentPath) {
      navigate("/parent", { replace: true });
    } else if (!isParent && onParentPath) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, isParent, location.pathname, navigate]);

  // ==========================================
  // PENDENGAR ACARA GLOBAL (Global Event Listener)
  // ==========================================
  useEffect(() => {
    const handleGlobalClick = (e) => {
      // Periksa jika elemen yang ditekan adalah butang, pautan <a>, atau elemen dengan peranan 'button'
      const isInteractive = e.target.closest(
        'button, a, [role="button"], input[type="submit"], input[type="button"]'
      );
      
      // Jika ia adalah elemen interaktif, mainkan bunyi
      if (isInteractive) {
        mainkanBunyiPop();
      }
    };

    // Pasang 'telinga' pada keseluruhan dokumen web
    document.addEventListener('click', handleGlobalClick);

    // Cabut 'telinga' apabila pengguna keluar dari halaman (untuk elak memori bocor)
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  return (
    <div className="flex h-screen bg-orange-50/40 font-sans overflow-hidden">
      
      {/* SIDEBAR (Desktop) */}
      <aside className="hidden md:flex w-72 bg-white border-r-4 border-orange-100 flex-col justify-between shadow-xl z-20">
        <div className="p-6">
          <Link to={isParent ? "/parent" : "/dashboard"} className="flex items-center gap-3 mb-10 hover:scale-105 transition-transform">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30 border-2 border-white">
              <span className="text-2xl">🦧</span>
            </div>
            <div>
              <h1 className="font-extrabold text-2xl text-orange-700 tracking-tight">StudyQuest</h1>
              <p className="text-xs text-orange-500 font-semibold">{isParent ? "Mod Ibu Bapa" : "Jom Belajar!"}</p>
            </div>
          </Link>

          <nav className="space-y-3">
            {nav.map(item => {
              const isActive = location.pathname === item.path ||
                (item.path !== "/dashboard" && item.path !== "/parent" && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all relative font-semibold ${
                    isActive
                      ? "bg-orange-100 text-orange-700 shadow-inner border-l-4 border-orange-500"
                      : "text-slate-500 hover:bg-orange-50 hover:text-orange-600"
                  }`}
                >
                  <item.icon className={`w-6 h-6 ${isActive ? "text-orange-600" : ""}`} />
                  <span className="text-base">{item.label}</span>
                  {item.path === "/notifications" && unreadCount > 0 && (
                    <span className="absolute right-4 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-sm">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-6 border-t-2 border-orange-100 bg-orange-50/50">
          <div className="flex items-center gap-3">
            <Link to="/profile" className="w-10 h-10 bg-orange-200 rounded-full flex items-center justify-center border-2 border-orange-400 hover:scale-110 transition-transform">
              <User className="w-5 h-5 text-orange-700" />
            </Link>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-700 truncate">{user?.name || "Kawan Baru"}</p>
              <p className="text-xs text-slate-500 truncate">Lihat Profil</p>
            </div>
            {!isParent && (
              <Link to="/notifications" className="relative p-2 rounded-full hover:bg-orange-200 transition-colors bg-white shadow-sm border border-orange-100">
                <Bell className="w-5 h-5 text-orange-600" />
                {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{unreadCount}</span>}
              </Link>
            )}
          </div>
        </div>
      </aside>

      {/* HEADER UTAMA & MOBILE */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header className="md:hidden sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b-2 border-orange-100 px-4 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🦧</span>
            <span className="font-extrabold text-lg text-orange-700">StudyQuest</span>
          </div>
          <div className="flex items-center gap-2">
            {!isParent && (
              <Link to="/notifications" className="relative p-2 rounded-full hover:bg-orange-50">
                <Bell className="w-5 h-5 text-orange-600" />
                {unreadCount > 0 && <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />}
              </Link>
            )}
            <Link to="/profile" className="p-2 rounded-full bg-orange-100">
              <User className="w-5 h-5 text-orange-700" />
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
          <div className="max-w-4xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* BOTTOM NAV (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-orange-100 pb-safe pt-2 px-2 shadow-[0_-4px_20px_rgba(251,146,60,0.1)]">
        <div className="flex items-center justify-around">
          {nav.map(item => {
            const isActive = location.pathname === item.path ||
              (item.path !== "/dashboard" && item.path !== "/parent" && location.pathname.startsWith(item.path));
            return (
              <Link key={item.path} to={item.path} className="flex flex-col items-center gap-1 p-2 min-w-[64px] relative">
                <div className={`p-1.5 rounded-xl transition-all ${isActive ? "bg-orange-100 text-orange-600" : "text-slate-400"}`}>
                  <item.icon className={`w-6 h-6 ${isActive ? "stroke-[2.5]" : ""}`} />
                </div>
                <span className={`text-[10px] font-bold transition-all ${isActive ? "text-orange-700" : "text-slate-400"}`}>{item.label}</span>
                {isActive && <div className="w-1 h-1 rounded-full bg-orange-500 absolute bottom-1" />}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}