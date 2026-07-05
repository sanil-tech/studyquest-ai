import React, { useState, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Home, BookOpen, Trophy, User, Menu, X } from "lucide-react";

export default function AppLayout() {
  const [user, setUser] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Ambil data profil penuh setiap kali layout dimuatkan
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  // Logik Avatar: Semak Gambar Preset/Upload -> Semak Emoji -> Guna Maskot 🦧
  const RenderAvatar = ({ className = "w-10 h-10" }) => (
    <div className={`${className} rounded-full overflow-hidden border-2 border-orange-400 bg-orange-100 flex items-center justify-center shadow-sm shrink-0`}>
      {user?.profile_picture_url ? (
        <img 
          src={user.profile_picture_url} 
          alt="Profile" 
          className="w-full h-full object-cover bg-white" 
        />
      ) : user?.avatar_emoji ? (
        <span className="text-xl select-none">{user.avatar_emoji}</span>
      ) : (
        <span className="text-xl select-none">🦧</span>
      )}
    </div>
  );

  // Senarai Navigasi Utama (Boleh disesuaikan mengikut keperluan)
  const navItems = [
    { name: "Papan Pemuka", path: "/dashboard", icon: Home },
    { name: "Pembelajaran", path: "/learn", icon: BookOpen },
    { name: "Ganjaran", path: "/rewards", icon: Trophy },
    { name: "Profil Saya", path: "/profile", icon: User },
  ];

  return (
    <div className="flex h-screen bg-orange-50/40 overflow-hidden font-sans">
      
      {/* ==========================================
          SIDEBAR (PANDANGAN DESKTOP)
          ========================================== */}
      <aside className="hidden md:flex w-72 bg-white border-r-4 border-orange-100 flex-col justify-between shadow-xl z-20">
        <div className="p-6 flex-1 overflow-y-auto">
          {/* Logo Aplikasi */}
          <Link to="/dashboard" className="flex items-center gap-3 mb-10 group">
             <div className="text-3xl group-hover:scale-110 transition-transform">🦧</div>
             <div className="text-2xl font-black text-orange-700 tracking-tight">StudyQuest</div>
          </Link>

          {/* Menu Navigasi */}
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.includes(item.path);
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-4 px-4 py-3 rounded-2xl font-bold transition-all ${
                    isActive 
                      ? "bg-orange-500 text-white shadow-md shadow-orange-500/20" 
                      : "text-slate-500 hover:bg-orange-50 hover:text-orange-600"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-400"}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Profil Mini di bawah Sidebar */}
        <div className="p-5 border-t-2 border-orange-100 bg-orange-50/50">
          <Link to="/profile" className="flex items-center gap-3 hover:opacity-80 transition-opacity p-2 rounded-2xl hover:bg-white">
            <RenderAvatar className="w-12 h-12" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">
                {user?.full_name || "Pelajar Hebat"}
              </p>
              <p className="text-xs text-orange-600 font-bold uppercase tracking-wide">
                {user?.app_role || "Student"}
              </p>
            </div>
          </Link>
        </div>
      </aside>

      {/* ==========================================
          MAIN CONTENT & HEADER MOBILE
          ========================================== */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* HEADER MOBILE */}
        <header className="md:hidden p-4 bg-white border-b-2 border-orange-100 flex justify-between items-center z-30 shadow-sm relative">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 -ml-2 text-orange-600 rounded-xl hover:bg-orange-50"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          
          <span className="font-black text-xl text-orange-700 tracking-tight">StudyQuest 🦧</span>
          
          <Link to="/profile">
            <RenderAvatar className="w-9 h-9" />
          </Link>
        </header>

        {/* MENU DROPDOWN MOBILE */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-[72px] left-0 right-0 bg-white border-b-4 border-orange-100 shadow-xl z-40 p-4 space-y-2 flex flex-col animate-in slide-in-from-top-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.includes(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-4 px-4 py-3 rounded-2xl font-bold transition-all ${
                    isActive 
                      ? "bg-orange-500 text-white shadow-md shadow-orange-500/20" 
                      : "text-slate-600 hover:bg-orange-50 hover:text-orange-600"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        )}

        {/* OUTLET (Kandungan Halaman) */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          <Outlet />
        </main>
      </div>
    </div>
  );
}