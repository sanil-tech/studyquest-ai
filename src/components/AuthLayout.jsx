import React from "react";

export default function AuthLayout({ title, subtitle, footer, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-orange-50/40 px-4 font-sans relative overflow-hidden">
      
      {/* MASKOT ORANGUTAN LATAR BELAKANG (Optional: hiasan visual kecil) */}
      <div className="absolute top-10 left-10 text-6xl opacity-10 select-none animate-pulse">🦧</div>
      <div className="absolute bottom-20 right-20 text-6xl opacity-10 select-none animate-pulse delay-150">🦧</div>

      <div className="w-full max-w-md relative z-10">
        
        {/* BAHAGIAN HEADER LOGO & TAJUK DENGAN MASKOT */}
        <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg shadow-orange-500/30 mb-6 transition-transform hover:scale-110">
            {/* Maskot Orangutan Utama */}
            <span className="text-4xl select-none">🦧</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-orange-700">
            {title}
          </h1>
          {subtitle && (
            <p className="text-slate-500 mt-2 font-medium">{subtitle}</p>
          )}
        </div>

        {/* KOTAK BORANG (FORM CARD) DENGAN MASKOT KECIL */}
        <div className="bg-white rounded-3xl shadow-xl shadow-orange-100/50 border-4 border-orange-100 p-8 relative animate-in fade-in zoom-in-95 duration-500 delay-150">
          
          {/* Maskot Orangutan Kecil di Penjuru Kad (Opional: untuk sentuhan tambahan) */}
          <div className="absolute -top-6 -right-6 text-4xl select-none bg-orange-100 p-2 rounded-full border-4 border-orange-100 shadow-inner">🦧</div>
          
          {children}
        </div>

        {/* BAHAGIAN FOOTER (CONTOH: LINK DAFTAR/LOG MASUK) */}
        {footer && (
          <div className="text-center text-sm font-bold text-slate-500 mt-8 animate-in fade-in duration-500 delay-300">
            {footer}
          </div>
        )}
        
      </div>
    </div>
  );
}