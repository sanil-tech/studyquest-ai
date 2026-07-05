import React, { useState, useEffect, useRef } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Home, BookOpen, Trophy, Wallet, Bell, User, Users, Gift, CheckSquare, Menu, X, ChevronLeft, ChevronRight } from "lucide-react";

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
  
  // State Logik Data
  const [user, setUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // State UI Navigasi
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true); // Kawalan skrin penuh desktop
  
  // Ref untuk Kesan Bunyi (SFX Bloop)
  const sfxRef = useRef(null);

  // 1. Ambil Data Profil
  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  // 2. Ambil Jumlah Notifikasi
  useEffect(() => {
    if (!user) return;
    base44.entities.Notification.filter({ user_id: user.id, read: false })
      .then(n => setUnreadCount(n.length))
      .catch(() => {});
  }, [user, location]);

  const isParent = user?.app_role === "parent";
  const nav = isParent ? parentNav : studentNav;

  // 3. Logik Halaan Semula (Redirect)
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

  // 4. Kesan Bunyi Butang Global (Bunyi Bloop)
  useEffect(() => {
    const handleGlobalClick = (e) => {
      const isButtonOrLink = e.target.closest('button') || e.target.closest('a');
      if (isButtonOrLink && sfxRef.current) {
        sfxRef.current.currentTime = 0;
        sfxRef.current.volume = 0.7; // Kelantangan bunyi bloop
        sfxRef.current.play().catch(() => {}); 
      }
    };
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  // 5. Avatar Dinamik
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
    <div className="flex h-screen bg-orange-50/40 overflow-hidden font-sans">
      
      {/* KESAN BUNYI BLOOP (AUDIO TERSEMBUNYI) */}
      <audio ref={sfxRef} src="https://cdn.pixabay.com/download/audio/2022/03/15/audio_731671239c.mp3" preload="auto" />

      {/* ==========================================
          SIDEBAR (TAMPILAN DESKTOP)
          ========================================== */}
      <aside 
        className={`hidden md:flex bg-white border-r-4 border-orange-100 flex-col justify-between shadow-xl z-20 transition-all duration-300 ease-in-out ${
          isDesktopSidebarOpen ? "w-72" : "w-0 -translate-x-full border-r-0"
        }`}
      >
        <div className="p-6 flex-1 overflow-y-auto">
          {/* Logo & Judul */}
          <div className="flex items-center justify-between mb-10">
            <Link to={isParent ? "/parent" : "/dashboard"} className="flex items-center gap-3 group">
               <div className="text-3xl group-hover:scale-110 transition-transform">🦧</div>
               <div className="text-2xl font-black text-orange-700 tracking-tight">StudyQuest</div>
            </Link>
          </div>

          {/* Menu Navigasi Desktop */}
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

        {/* Profil Bawah Desktop */}
        <div className="p-5 border-t-2 border-orange-100 bg-orange-50/50">
          <div className="flex items-center gap-3 p-2 rounded-2xl">
            <Link to="/profile"><RenderAvatar className="w-12 h-12 hover:opacity-80 transition-opacity" /></Link>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">{user?.full_name || (isParent ? "Ibu Bapa" : "Pelajar")}</p>
              <p className="text-xs text-orange-600 font-bold uppercase tracking-wide">{user?.app_role || "User"}</p>
            </div>
            {!isParent && (
              <Link to="/notifications" className="relative p-2 rounded-full hover:bg-white transition-colors">
                <Bell className="w-5 h-5 text-slate-500" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Link>
            )}
          </div>
        </div>
      </aside>

      {/* ==========================================
          SIDEBAR (TAMPILAN MOBILE - DENGAN AUTO-HIDE SELESAI PILIH)
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
                onClick={() => setIsMobileMenuOpen(false)} // INTERAKTIF: Automatik sorok menu sisi selepas dipilih
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
          KAWASAN KANDUNGAN UTAMA (MENGALAMI FULLSCREEN)
          ========================================== */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* HEADER ATAS (Desktop & Mobile terintegrasi) */}
        <header className="p-4 bg-white border-b-2 border-orange-100 flex justify-between items-center z-30 shadow-sm relative">
          
          <div className="flex items-center gap-3">
            {/* Butang Togol Skrin Penuh (Desktop Only) */}
            <button 
              onClick={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)} 
              className="hidden md:flex p-2 text-orange-600 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors border-2 border-orange-100"
              title={isDesktopSidebarOpen ? "Tukar ke Skrin Penuh" : "Tampilkan Menu Sisi"}
            >
              {isDesktopSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Butang Menu Hamburger (Mobile Only) */}
            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 -ml-2 text-orange-600 rounded-xl hover:bg-orange-50 transition-colors">
              <Menu className="w-6 h-6" />
            </button>
            
            {/* Tajuk Logo Pendek jika Sidebar desktop tertutup */}
            {!isDesktopSidebarOpen && (
              <span className="hidden md:inline-block font-black text-xl text-orange-700 tracking-tight animate-in fade-in duration-200">
                StudyQuest 🦧
              </span>
            )}
          </div>
          
          {/* Tajuk Tengah (Mobile Only) */}
          <span className="md:hidden font-black text-xl text-orange-700 tracking-tight">StudyQuest</span>
          
          {/* Profil & Notifikasi Atas */}
          <div className="flex items-center gap-2">
            {!isParent && (
              <Link to="/notifications" className="relative p-2 rounded-full hover:bg-slate-100 transition-colors">
                <Bell className="w-5 h-5 text-slate-500" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Link>
            )}
            <Link to="/profile" className="md:hidden">
              <RenderAvatar className="w-9 h-9" />
            </Link>
            {!isDesktopSidebarOpen && (
              <div className="hidden md:flex items-center gap-2 animate-in fade-in duration-200">
                <Link to="/profile"><RenderAvatar className="w-9 h-9" /></Link>
              </div>
            )}
          </div>
        </header>

        {/* OUTLET UTAMA (Akan mengambil keseluruhan ruangan skrin penuh jika sidebar disorok) */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth transition-all duration-300">
          <div className="max-w-5xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}