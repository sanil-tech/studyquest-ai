// src/components/lesson/MindMap.jsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Volume2, HelpCircle } from "lucide-react";

const branchColors = [
  { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700", dot: "bg-rose-400", hover: "hover:bg-rose-100/70" },
  { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", dot: "bg-blue-400", hover: "hover:bg-blue-100/70" },
  { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", dot: "bg-amber-400", hover: "hover:bg-amber-100/70" },
  { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-400", hover: "hover:bg-emerald-100/70" },
];

export default function MindMap({ mindMap, lang = "ms" }) {
  const [availableVoices, setAvailableVoices] = useState([]);

  // Muatkan senarai suara neural sistem peranti pelajar secara asinkronus
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;

    const loadVoices = () => {
      setAvailableVoices(window.speechSynthesis.getVoices());
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Memburu slang manusia Bahasa Melayu (ms-MY) atau Inggeris (en-US) gred premium
  const dapatkanSuaraTerbaik = (bahasaMisi) => {
    if (availableVoices.length === 0) return null;

    if (bahasaMisi === "en") {
      const enVoices = availableVoices.filter(v => v.lang.includes("en-US") || v.lang.includes("en-GB"));
      return enVoices.find(v => v.name.toLowerCase().includes("natural") || v.name.toLowerCase().includes("neural")) ||
             enVoices.find(v => v.name.toLowerCase().includes("google")) ||
             enVoices[0];
    } else {
      const msVoices = availableVoices.filter(v => v.lang.includes("ms-MY") || v.lang.startsWith("ms"));
      if (msVoices.length === 0) return null;

      return msVoices.find(v => v.name.toLowerCase().includes("natural") || v.name.toLowerCase().includes("neural")) ||
             msVoices.find(v => v.name.toLowerCase().includes("online")) ||
             msVoices.find(v => v.name.toLowerCase().includes("google")) ||
             msVoices.find(v => v.name.toLowerCase().includes("amira")) ||
             msVoices[0];
    }
  };

  // Enjin sebutan text-to-speech neuron
  const sebutTeks = (textToSpeak) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel(); // Hentikan sebutan lama jika bertindih
      if (!textToSpeak) return;

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      const suaraTerbaik = dapatkanSuaraTerbaik(lang);

      if (suaraTerbaik) {
        utterance.voice = suaraTerbaik;
      } else {
        utterance.lang = lang === "en" ? "en-US" : "ms-MY";
      }

      utterance.rate = lang === "en" ? 0.90 : 0.88; // Kelajuan mesra kanak-kanak
      utterance.pitch = lang === "en" ? 1.0 : 1.05;

      window.speechSynthesis.speak(utterance);
    }
  };

  // Membacakan keseluruhan dahan kecil di bawah dahan utama
  const sebutDahan = (label, children = []) => {
    let teksPenuh = label;
    if (children.length > 0) {
      // Ditambah jeda titik (.) supaya intonasi robot berhenti seketika sebelum membaca isi kandungan
      teksPenuh += lang === "en" ? ". It includes: " : ". Di bawahnya terdapat: ";
      teksPenuh += children.join(", ");
    }
    sebutTeks(teksPenuh);
  };

  if (!mindMap) return null;
  const { central_topic, branches = [] } = mindMap;

  return (
    <div className="bg-gradient-to-br from-sky-50 to-indigo-50 rounded-2xl p-5 border border-sky-100 space-y-4">
      
      {/* HEADER BAR */}
      <div className="flex items-center justify-between border-b border-indigo-100/50 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">🧠</span>
          <h3 className="font-heading font-bold text-indigo-800 text-sm sm:text-base">Gambarajah Minda (Mind Map)</h3>
        </div>
      </div>

      {/* CENTRAL TOPIC BLOCK */}
      <div className="flex flex-col items-center justify-center pt-2">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          onClick={() => sebutTeks(central_topic)}
          className="px-6 py-3 bg-gradient-to-br from-indigo-500 to-purple-500 text-white rounded-2xl font-black text-center shadow-lg cursor-pointer flex items-center gap-2 hover:from-indigo-600 hover:to-purple-600 active:scale-95 transition-all select-none group"
        >
          <span>{central_topic}</span>
          <Volume2 className="w-4 h-4 text-indigo-200 group-hover:text-white group-hover:scale-110 transition-transform shrink-0" />
        </motion.div>
        
        {/* Tali Penghubung Akar Visual */}
        <div className="w-px h-5 bg-indigo-200 mt-2" />
      </div>

      {/* GRID DAHAN MINDA INTERAKTIF */}
      <div className="grid grid-cols-2 gap-3 mt-1 select-none">
        {branches.map((branch, i) => {
          const color = branchColors[i % branchColors.length];
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => sebutDahan(branch.label, branch.children)}
              className={`${color.bg} ${color.border} ${color.hover} border-2 rounded-2xl p-3 cursor-pointer shadow-sm active:scale-98 transition-all flex flex-col justify-between group relative`}
            >
              <div>
                {/* Pembesar Suara Dahan Mini */}
                <div className="absolute top-2 right-2 opacity-40 group-hover:opacity-100 text-stone-500 transition-opacity">
                  <Volume2 className={`w-3.5 h-3.5 ${color.text}`} />
                </div>

                <div className="flex items-center gap-1.5 mb-2 pr-4">
                  <span className={`w-2.5 h-2.5 rounded-full ${color.dot} shrink-0`} />
                  <p className={`font-black text-xs sm:text-sm leading-tight ${color.text}`}>{branch.label}</p>
                </div>
                
                {branch.children && branch.children.length > 0 && (
                  <ul className="space-y-1">
                    {branch.children.map((child, ci) => (
                      <li key={ci} className="text-[11px] text-stone-600 font-medium flex items-start gap-1 leading-snug">
                        <span className={`${color.text} font-black`}>•</span>
                        <span>{child}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* INFO FOOTER BANNER */}
      <p className="text-center text-[10px] font-bold text-indigo-700/60 flex items-center justify-center gap-1 bg-indigo-500/5 py-1.5 rounded-xl border border-dashed border-indigo-400/20">
        <HelpCircle className="w-3 h-3"/> Ketik pada tajuk pusat atau kotak dahan untuk Otan bacakan isinya! 🇲🇾
      </p>
    </div>
  );
}