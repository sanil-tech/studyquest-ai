import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Compass, BookOpen, Pencil, Calculator, Clock, Sparkles, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const STEPS = [
  {
    icon: Sparkles,
    title: "Setiap anak berbeza",
    body: "Setiap anak memulakan perjalanan pembelajaran pada tahap yang berbeza. Suku si Penyu ingin menemui kekuatan pembelajaran anak anda sebelum memilih misi yang sesuai.",
    color: "text-purple-500",
    bg: "bg-purple-50",
  },
  {
    icon: BookOpen,
    title: "📚 Membaca",
    body: "Pengenalan huruf, bacaan suku kata, dan bacaan perkataan mudah.",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    icon: Pencil,
    title: "✏️ Menulis",
    body: "Tulisan huruf, tulisan perkataan, dan kesediaan menulis ayat.",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    icon: Calculator,
    title: "🔢 Mengira",
    body: "Pengenalan nombor, kiraan, dan pengiraan asas.",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
];

export default function ParentDiagnosticIntroModal({ open, onClose, onStart, childName = "anak anda" }) {
  const [step, setStep] = useState(0);

  const handleStart = () => {
    setStep(0);
    onStart();
  };

  const handleClose = () => {
    setStep(0);
    onClose();
  };

  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
          >
            {/* Header */}
            <div className="relative bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-5 text-white">
              <button
                onClick={handleClose}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2 mb-1">
                <Compass className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-widest text-white/80">Misi Penemuan 3M</span>
              </div>
              <h2 className="text-lg font-bold leading-tight">
                Selamat datang, Ibubapa!
              </h2>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              {/* Progress dots */}
              <div className="flex items-center justify-center gap-1.5">
                {STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === step ? "w-8 bg-indigo-500" : i < step ? "w-4 bg-indigo-300" : "w-4 bg-slate-200"
                    }`}
                  />
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-3"
                >
                  <div className={`w-14 h-14 rounded-2xl ${current.bg} flex items-center justify-center mx-auto`}>
                    <current.icon className={`w-7 h-7 ${current.color}`} />
                  </div>
                  <h3 className="text-center text-base font-bold text-slate-900">
                    {current.title}
                  </h3>
                  <p className="text-center text-sm text-slate-500 leading-relaxed">
                    {current.body}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Duration note on last step */}
              {isLast && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center gap-1.5 text-xs text-slate-400"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span className="font-medium">Anggaran masa: 15–20 minit</span>
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 pb-5 flex gap-2">
              {step > 0 && (
                <Button
                  onClick={() => setStep(step - 1)}
                  variant="outline"
                  className="flex-1 border-slate-200 text-slate-500 font-medium text-sm h-10 rounded-lg"
                >
                  Kembali
                </Button>
              )}
              {isLast ? (
                <Button
                  onClick={handleStart}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm h-10 rounded-lg shadow-sm"
                >
                  <Compass className="w-4 h-4 mr-1.5" />
                  Mulakan Misi
                </Button>
              ) : (
                <Button
                  onClick={() => setStep(step + 1)}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm h-10 rounded-lg shadow-sm"
                >
                  Seterusnya <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}