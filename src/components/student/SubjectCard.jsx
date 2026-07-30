import React from "react";
import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { motion } from "framer-motion";

export default function SubjectCard({ subject, index }) {
  // Tetapan warna lalai (fallback) jika subjek tiada warna spesifik
  const themeColor = subject.color || "#10B981"; 

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 100, delay: index * 0.05 }}
    >
      <Link
        to={`/study/${subject.id}`}
        className="flex items-center gap-4 p-4 bg-white rounded-[1.5rem] border border-emerald-100 hover:border-emerald-300 hover:shadow-md transition-all group relative overflow-hidden"
      >
        {/* Bar warna serlahan (accent) di tepi kiri yang muncul bila hover */}
        <div 
          className="absolute left-0 top-0 bottom-0 w-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ backgroundColor: themeColor }}
        />
        
        {/* Kotak Ikon Subjek */}
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-inner transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 border border-white/50 relative z-10"
          style={{ backgroundColor: `${themeColor}15` }}
        >
          {subject.icon || "🌿"}
        </div>
        
        {/* Tajuk & Keterangan */}
        <div className="flex-1 min-w-0 relative z-10">
          <h3 className="font-black text-base text-stone-800 truncate group-hover:text-emerald-700 transition-colors">
            {subject.name}
          </h3>
          <p className="text-xs font-bold text-stone-400 mt-1">
            Buka laluan teroka ➜
          </p>
        </div>
        
        {/* Butang Aksi (Kompas) */}
        <div className="w-10 h-10 rounded-xl bg-[#F3EFE6] flex items-center justify-center text-stone-400 group-hover:bg-emerald-500 group-hover:text-white transition-all transform group-hover:scale-110 shrink-0 relative z-10">
          <Compass className="w-5 h-5" />
        </div>
      </Link>
    </motion.div>
  );
}