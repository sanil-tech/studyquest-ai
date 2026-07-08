import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { CheckCircle2, Play, BookOpen, Gamepad2, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import QuizComponent from "./QuizComponent"; // Komponen kuiz dari Langkah 1 sebelum ini

export default function LessonPage() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  
  // State untuk data pembelajaran
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // State untuk mengawal aliran (Langkah 1 hingga 4)
  const [currentStep, setCurrentStep] = useState(1);
  const [maxUnlockedStep, setMaxUnlockedStep] = useState(1);

  useEffect(() => {
    base44.entities.Lesson.get(lessonId).then(data => {
      setLesson(data);
      setLoading(false);
    });
  }, [lessonId]);

  // Fungsi untuk membuka langkah seterusnya
  const completeStep = (stepNumber) => {
    if (stepNumber >= maxUnlockedStep) {
      setMaxUnlockedStep(stepNumber + 1);
    }
    // Naikkan langkah semasa secara automatik
    setCurrentStep(stepNumber + 1);
  };

  const handleQuizComplete = (attemptId) => {
    // Aliran tamat, bawa ke halaman keputusan kuiz
    navigate(`/quiz-result/${attemptId}`);
  };

  if (loading) return <div className="p-10 text-center text-xs">Memuatkan modul pembelajaran...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      
      {/* ---------------- HARDWARE NAVIGATION TABS ---------------- */}
      {/* Memaparkan bar kemajuan aliran atas (Steppers Layout) */}
      <div className="grid grid-cols-4 gap-2 bg-muted/40 p-2 rounded-xl border border-border/50 text-center">
        {[
          { step: 1, label: "Tonton Video", icon: Play },
          { step: 2, label: "Nota & Infografik", icon: BookOpen },
          { step: 3, label: "Interactive Game", icon: Gamepad2 },
          { step: 4, label: "Kuiz Penilaian", icon: HelpCircle },
        ].map((item) => {
          const Icon = item.icon;
          const isUnlocked = item.step <= maxUnlockedStep;
          const isActive = item.step === currentStep;

          return (
            <button
              key={item.step}
              disabled={!isUnlocked}
              onClick={() => setCurrentStep(item.step)}
              className={`flex flex-col sm:flex-row items-center justify-center gap-2 p-3 rounded-lg text-[11px] font-medium transition-all ${
                isActive
                  ? "bg-white text-primary shadow-sm border border-border"
                  : isUnlocked
                    ? "text-muted-foreground hover:bg-white/50"
                    : "text-muted-foreground/40 cursor-not-allowed"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-primary" : ""}`} />
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* ---------------- ALIRAN KANDUNGAN UTAMA ---------------- */}
      <div className="min-h-[400px] bg-white rounded-2xl p-6 border border-border/40 shadow-sm">
        
        {/* LANGKAH 1: TONTON VIDEO */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-lg font-bold font-heading">Langkah 1: Tonton Video Sesi</h2>
              <p className="text-xs text-muted-foreground">Sila tonton video penerangan ini sepenuhnya sebelum beralih ke bahagian nota.</p>
            </div>
            <div className="aspect-video bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center text-white">
              {/* Gantikan src dengan video URL sebenar dari pangkalan data anda */}
              <iframe
                className="w-full h-full"
                src={lesson?.video_url || "https://www.youtube.com/embed/dQw4w9WgXcQ"}
                title="Learning Video"
                allowFullScreen
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={() => completeStep(1)} className="text-xs rounded-lg h-9">
                Selesai Tonton & Seterusnya ➔
              </Button>
            </div>
          </div>
        )}

        {/* LANGKAH 2: RECAP NOTA & INFOGRAFIK */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-lg font-bold font-heading">Langkah 2: Recap Nota & Infografik</h2>
              <p className="text-xs text-muted-foreground">Fahami konsep penting melalui rumusan ringkas di bawah.</p>
            </div>
            <article className="prose prose-sm max-w-none border-l-2 border-primary/30 pl-4 py-1">
              <h3>{lesson?.title} - Ringkasan</h3>
              <div dangerouslySetInnerHTML={{ __html: lesson?.content_body }} />
            </article>
            {/* Ruang letak imej infografik jika ada */}
            {lesson?.infographic_url && (
              <div className="rounded-xl overflow-hidden border border-border/60">
                <img src={lesson.infographic_url} alt="Infografik Pelajaran" className="w-full h-auto" />
              </div>
            )}
            <div className="flex justify-between items-center pt-4">
              <Button variant="outline" onClick={() => setCurrentStep(1)} className="text-xs rounded-lg h-9">
                Back to Video
              </Button>
              <Button onClick={() => completeStep(2)} className="text-xs rounded-lg h-9">
                Saya Dah Baca & Seterusnya ➔
              </Button>
            </div>
          </div>
        )}

        {/* LANGKAH 3: INTERACTIVE GAME */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-lg font-bold font-heading">Langkah 3: Permainan Interaktif 🎮</h2>
              <p className="text-xs text-muted-foreground">Mari uji refleks dan pemahaman asas anda secara santai.</p>
            </div>
            
            {/* Kawasan Kontainer Game Sandbox / Iframe Simulation */}
            <div className="h-80 bg-muted/30 border border-dashed border-border/80 rounded-xl flex flex-col items-center justify-center p-6 text-center space-y-3">
              <Gamepad2 className="w-10 h-10 text-primary animate-bounce" />
              <div className="space-y-1">
                <h4 className="text-sm font-semibold">Mini Game: Padankan Terma Penting</h4>
                <p className="text-xs text-muted-foreground max-w-sm">
                  [Komponen Game Anda/Iframe Element di sini] Selesaikan cabaran memadankan perkataan untuk mengaktifkan butang kuiz.
                </p>
              </div>
              {/* Simulasi klik tamat game, dalam projek asal anda fungsi ini dipanggil apabila game hantar score sukses */}
              <Button size="sm" variant="secondary" onClick={() => alert("Simulasi Game Berjaya Diselesaikan!")} className="text-[11px] h-8">
                Selesaikan Game (Simulasi)
              </Button>
            </div>

            <div className="flex justify-between items-center pt-4">
              <Button variant="outline" onClick={() => setCurrentStep(2)} className="text-xs rounded-lg h-9">
                Kembali ke Nota
              </Button>
              <Button onClick={() => completeStep(3)} className="text-xs rounded-lg h-9 bg-accent hover:bg-accent/90">
                Buka Butang Kuiz 🔥
              </Button>
            </div>
          </div>
        )}

        {/* LANGKAH 4: KUIZ FINAL */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-lg font-bold font-heading">Langkah 4: Cabaran Kuiz Akhir 🧠</h2>
              <p className="text-xs text-muted-foreground">Langkah terakhir! Jawab soalan penilaian ini untuk mengesahkan pemahaman penuh anda.</p>
            </div>

            {lesson?.associated_quiz_id ? (
              <QuizComponent 
                quizId={lesson.associated_quiz_id} 
                onComplete={handleQuizComplete} 
              />
            ) : (
              <div className="text-center p-6 bg-yellow-50 text-yellow-700 rounded-xl text-xs">
                Ralat: Tiada kuiz yang dikaitkan dengan modul pelajaran ini.
              </div>
            )}

            <div className="flex justify-start pt-2">
              <Button variant="ghost" onClick={() => setCurrentStep(3)} className="text-xs text-muted-foreground">
                ➔ Cuba main game semula
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}