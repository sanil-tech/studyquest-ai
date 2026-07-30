import React from "react";
import { Leaf, TreePine } from "lucide-react";

export default function AuthLayout({ title, subtitle, footer, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAF7] px-4 font-sans relative overflow-hidden">
      
      {/* HIASAN ALAM LATAR BELAKANG */}
      <div className="absolute top-10 left-10 text-emerald-500/10 animate-pulse">
        <TreePine className="w-24 h-24" />
      </div>
      <div className="absolute bottom-20 right-20 text-lime-500/10 animate-pulse delay-150">
        <Leaf className="w-32 h-32" />
      </div>

      <div className="w-full max-w-md relative z-10">
        
        {/* BAHAGIAN HEADER LOGO & TAJUK DENGAN MASKOT */}
        <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/30 mb-6 transition-transform hover:scale-110 border-4 border-white">
            {/* Maskot Otan Utama */}
            <span className="text-4xl select-none transform hover:-rotate-12 transition-transform">🦧</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-stone-800">
            {title}
          </h1>
          {subtitle && (
            <p className="text-stone-500 mt-2 font-medium">{subtitle}</p>
          )}
        </div>

        {/* KOTAK BORANG (FORM CARD) DENGAN MASKOT KECIL */}
        <div className="bg-white rounded-[2rem] shadow-xl shadow-stone-200/50 border-2 border-emerald-100 p-8 sm:p-10 relative animate-in fade-in zoom-in-95 duration-500 delay-150">
          
          {/* Maskot Otan Kecil di Penjuru Kad (Tinjau dari atas) */}
          <div className="absolute -top-6 -right-6 text-4xl select-none bg-emerald-50 p-2.5 rounded-3xl border-4 border-white shadow-sm transform rotate-12 hover:rotate-0 transition-transform">
            🦧
          </div>
          
          {children}
        </div>

        {/* BAHAGIAN FOOTER (CONTOH: LINK DAFTAR/LOG MASUK) */}
        {footer && (
          <div className="text-center text-sm font-bold text-stone-500 mt-8 animate-in fade-in duration-500 delay-300">
            {footer}
          </div>
        )}
        
      </div>
    </div>
  );
}