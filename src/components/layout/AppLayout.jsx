import React, { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Home, BookOpen, Trophy, Wallet, Bell, Users, Gift, CheckSquare, Menu, X, ChevronLeft } from "lucide-react";

const studentNav = [
  { path: "/dashboard", icon: Home, label: "Home" },
  { path: "/study", icon: BookOpen, label: "Study" },
  { path: "/wallet", icon: Wallet, label: "Wallet" },
  { path: "/rewards", icon: Trophy, label: "Rewards" },
];

const parentNav = [
  { path: "/parent", icon: Home, label: "Home" },
  { path: "/parent/children", icon: Users, label: "Children" },
  { path: "/parent/rewards", icon: Gift, label: "Rewards" },
  { path: "/parent/approvals", icon: CheckSquare, label: "Approvals" },
];

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [user, setUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true); 

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

  // Fungsi Penjana Bunyi Bloop 
  const playCuteBloop = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return; 
      
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.1);

      gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {
      console.error("Audio API error", e);
    }
  };

  const handleAppClick = (e) => {
    const isClickable = e.target.closest('button') || e.target.closest('a') || e.target.closest('[role="button"]');
    if (isClickable) {
      playCuteBloop();
    }
  };

  const RenderAvatar = ({ className = "w-10 h-10" }) => (
    <div className={`${className} rounded-full overflow-hidden border-2 border-orange-400 bg-orange-100 flex items-center justify-center shadow-sm shrink-0`}>
      {user?.profile_picture_url ? (
        <img src={user.profile_picture_url} alt="Profile" className="w-full h-full object-cover bg-white" />
      ) : user?.avatar_emoji ? (
        <span className="text-xl select-none">{user.avatar_emoji}</span>
      ) : (
        <span className="text-xl select-none">🦧</span>
      )}
    </div>
  );

  return (
    <div className="flex h-screen bg-orange-50/40 overflow-hidden font-sans" onMouseDownCapture={handleAppClick}>
      
      {/* ==========================================
          SIDEBAR DESKTOP & TABLET
          ========================================== */}
      <aside 
        className={`hidden md:flex bg-white border-r-4 border-orange-100 flex-col shadow-xl z-20 transition-all duration-300 ease-in-out ${
          isDesktopSidebarOpen ? "w-64 lg:w-72" : "w-0 -translate-x-full border-r-0"
        }`}
      >
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-10">
            <Link to={isParent ? "/parent" : "/dashboard"} className="flex items-center gap-3 group">
               <div className="text-3xl group-hover:scale-110 transition-transform">🦧</div>
               <div className="text-xl lg:text-2xl font-black text-orange-700 tracking-tight">StudyQuest</div>
            </Link>
          </div>

          <nav className="space-y-2">
            {nav.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== "/dashboard" && item.path !== "/parent" && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-4 px-4 py-3 rounded-2xl font-bold transition-all ${isActive ? "bg-orange-500 text-white shadow-md shadow-orange-500/20" : "text-slate-500 hover:bg-orange-50 hover:text-orange-600"}`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-400"}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        {/* PROFIL DI SINI TELAH DIBUANG */}
      </aside>

      {/* ==========================================
          SIDEBAR MOBILE (Laci)
          ========================================== */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity" onClick={() => setIsMobileMenuOpen(false)} />
      )}
      
      <aside className={`md:hidden fixed inset-y-0 left-0 w-64 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b-2 border-orange-100 flex items-center justify-between bg-orange-50/50">
          <span className="font-black text-xl text-orange-700 flex items-center gap-2">🦧 StudyQuest</span>
          <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-orange-600 rounded-xl hover:bg-orange-100 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          {nav.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== "/dashboard" && item.path !== "/parent" && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-4 px-4 py-3 rounded-2xl font-bold transition-all ${isActive ? "bg-orange-500 text-white shadow-md shadow-orange-500/20" : "text-slate-500 hover:bg-orange-50 hover:text-orange-600"}`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-400"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* ==========================================
          KAWASAN KANDUNGAN UTAMA (DENGAN TOP BAR BARU)
          ========================================== */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header className="p-4 bg-white border-b-2 border-orange-100 flex justify-between items-center z-30 shadow-sm relative min-h-[72px]">
          
          {/* BAHAGIAN KIRI: Butang Togol & Tajuk */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)} 
              className="hidden md:flex p-2 text-orange-600 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors border-2 border-orange-100"
            >
              {isDesktopSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 -ml-2 text-orange-600 rounded-xl hover:bg-orange-50 transition-colors">
              <Menu className="w-6 h-6" />
            </button>
            
            {/* Tunjuk tajuk di Top Bar jika sidebar tertutup ATAU pada paparan mobile */}
            <span className={`font-black text-xl text-orange-700 tracking-tight transition-opacity ${!isDesktopSidebarOpen || 'md:hidden'} block`}>
              StudyQuest <span className="hidden md:inline">🦧</span>
            </span>
          </div>
          
          {/* BAHAGIAN KANAN: Notifikasi & Profil Penuh (Responsive) */}
          <div className="flex items-center gap-2 md:gap-4">
            {!isParent && (
              <Link to="/notifications" className="relative p-2 rounded-full hover:bg-orange-50 text-slate-400 hover:text-orange-500 transition-colors">
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Link>
            )}
            
            {/* PROFIL LENGKAP DIPINDAHKAN KE SINI */}
            <Link to="/profile" className="flex items-center gap-3 group md:hover:bg-orange-50 md:p-1.5 md:pr-4 md:rounded-full transition-colors">
              <RenderAvatar className="w-9 h-9 md:w-10 md:h-10 transition-transform group-hover:scale-105" />
              
              {/* Nama & Role hanya dipaparkan di skrin Tablet/Desktop (md ke atas) */}
              <div className="hidden md:block text-left">
                <p className="text-sm font-bold text-slate-800 leading-tight group-hover:text-orange-600 transition-colors max-w-[140px] truncate">
                  {user?.full_name || (isParent ? "Ibu Bapa" : "Pelajar")}
                </p>
                <p className="text-[10px] text-orange-600 font-bold uppercase tracking-wide">
                  {user?.app_role || "User"}
                </p>
              </div>
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 scroll-smooth transition-all duration-300">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}