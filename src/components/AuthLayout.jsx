import React from "react";

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-orange-50/40 px-4 font-sans">
      <div className="w-full max-w-md">
        
        {/* BAHAGIAN HEADER LOGO & TAJUK */}
        <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg shadow-orange-500/30 mb-6 transition-transform hover:scale-110">
            {Icon ? (
              <Icon className="w-8 h-8 text-white" aria-hidden="true" />
            ) : (
              <span className="text-3xl select-none">🦧</span>
            )}
          </div>
          <h1 className="text-3xl font-black tracking-tight text-orange-700">
            {title}
          </h1>
          {subtitle && (
            <p className="text-slate-500 mt-2 font-medium">{subtitle}</p>
          )}
        </div>

        {/* KOTAK BORANG (FORM CARD) */}
        <div className="bg-white rounded-3xl shadow-xl shadow-orange-100/50 border-4 border-orange-100 p-8 animate-in fade-in zoom-in-95 duration-500 delay-150">
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