import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Loader2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import LessonProgress from "./LessonProgress";

export default function StudentLessonPage() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [lessonData, setLessonData] = useState(null);
  const [currentProgress, setCurrentProgress] = useState(null);
  const [stepsStatus, setStepsStatus] = useState({
    lesson: false,
    flashcards: false,
    mindmap: false,
    activity: false,
  });

  // Gantikan dengan state auth atau ID pelajar aktif sebenar dalam sistem anda
  const [studentId] = useState("student-123"); 

  // useRef digunakan untuk menyimpan data terkini masa dan ID progress 
  // supaya fungsi cleanup useEffect sentiasa mendapat nilai yang paling tepat (up-to-date)
  const startTimeRef = useRef(Date.now());
  const progressIdRef = useRef(null);

  // 1. MEMUATKAN DATA PELAJARAN DAN PROGRESS SEBENAR DARI DATABASE
  useEffect(() => {
    const fetchLessonAndProgress = async () => {
      try {
        setLoading(true);
        startTimeRef.current = Date.now(); // Reset masa mula apabila page berjaya dibuka

        // Contoh panggilan data silibus pelajaran
        // const lesson = await base44.entities.Lesson.get(lessonId);
        setLessonData({
          title: "People & Culture (Lanjutan)",
          content: "Ini adalah kandungan teks utama untuk topik bacaan hari ini..."
        });

        // Ambil progress semasa anak untuk pelajaran ini
        const progressRecords = await base44.entities.Progress.filter({
          student_id: studentId,
        });

        if (progressRecords.length > 0) {
          const record = progressRecords[0];
          setCurrentProgress(record);
          progressIdRef.current = record.id; // Simpan ID ke ref
          
          setStepsStatus({
            lesson: record.step_lesson_done || false,
            flashcards: record.step_flashcards_done || false,
            mindmap: record.step_mindmap_done || false,
            activity: record.step_activity_done || false,
          });
        } else {
          // Cipta rekod baru jika anak pertama kali masuk
          const newRecord = await base44.entities.Progress.create({
            student_id: studentId,
            current_topic: "People & Culture (Lanjutan)",
            level: 1,
            xp_score: 0,
            study_time: 0,
            step_lesson_done: false,
            step_flashcards_done: false,
            step_mindmap_done: false,
            step_activity_done: false,
            updated_at: new Date().toISOString()
          });
          setCurrentProgress(newRecord);
          progressIdRef.current = newRecord.id;
        }
      } catch (error) {
        console.error("Gagal memuatkan data:", error);
        toast({
          variant: "destructive",
          title: "Ralat Datang",
          description: "Gagal memuatkan progress pembelajaran.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchLessonAndProgress();
  }, [lessonId, studentId, toast]);

  // 2. FUNGSI UNTUK MENGIRA DAN MENGHANTAR JUMALAH MASA KE DATABASE
  const saveStudyTime = async () => {
    const progressId = progressIdRef.current;
    if (!progressId) return;

    // Kira durasi masa aktif (dalam saat) sejak halaman dibuka
    const elapsedSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
    
    // Tukar ke minit. Jika kurang dari 60 saat tetapi lebih dari 10 saat, anggap sebagai 1 minit minimum
    if (elapsedSeconds > 10) {
      const minutesEarned = Math.round(elapsedSeconds / 60) || 1;

      try {
        // Ambil data progress terkini untuk elakkan data override
        const latestProgress = await base44.entities.Progress.get(progressId);
        const currentTotalTime = latestProgress?.study_time || 0;

        // Kemaskini masa belajar terkumpul dan trigger 'updated_at' untuk paparan masa aktif di parent card
        await base44.entities.Progress.update(progressId, {
          study_time: currentTotalTime + minutesEarned,
          updated_at: new Date().toISOString()
        });
        console.log(`Berjaya menyimpan ${minutesEarned} minit masa belajar.`);
      } catch (err) {
        console.error("Ralat ketika menyimpan masa belajar:", err);
      }
    }
  };

  // 3. EFFECT UNTUK MENGENDALIKAN PENGGUNA KELUAR HALAMAN (UNMOUNT & CLOSE TAB)
  useEffect(() => {
    // Penjaga untuk senario bertukar komponen / menekan butang back dalam aplikasi
    return () => {
      saveStudyTime();
    };
  }, []);

  // 4. MENGENDALIKAN KLIK PADA SETIAP TUGASAN (STEP CLICK)
  const handleStepClick = async (stepKey) => {
    if (!currentProgress) return;

    const updatedStatus = { ...stepsStatus, [stepKey]: !stepsStatus[stepKey] };
    setStepsStatus(updatedStatus);

    try {
      const fieldToUpdate = `step_${stepKey}_done`;
      await base44.entities.Progress.update(currentProgress.id, {
        [fieldToUpdate]: updatedStatus[stepKey],
        updated_at: new Date().toISOString() // Update 'last active' setiap kali tugasan diklik
      });

      toast({
        title: updatedStatus[stepKey] ? "Tugasan Selesai! 🎉" : "Status Dikemaskini",
        description: `Langkah ${stepKey} berjaya dikemaskini.`,
      });
    } catch (error) {
      console.error("Gagal mengemas kini status:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center gap-2 text-sm text-slate-500">
        <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
        Memuatkan kandungan pelajaran...
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6 bg-slate-50 min-h-screen">
      {/* Top Navigation */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-xl">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Topik Semasa</span>
          <h1 className="text-base font-black text-slate-800 leading-tight">{lessonData?.title}</h1>
        </div>
      </div>

      {/* Rangka Reka Bentuk Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
        
        {/* Kolum Kiri: Isi Kandungan Pembelajaran */}
        <div className="md:col-span-2 bg-white rounded-2xl p-5 border border-slate-100 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-slate-700 font-bold text-sm border-b pb-2 border-slate-50">
            <BookOpen className="w-4 h-4 text-indigo-500" />
            Nota & Bacaan Pelajaran
          </div>
          <div className="text-xs text-slate-600 leading-relaxed space-y-3">
            <p>{lessonData?.content}</p>
            <p className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-[11px] text-slate-500 italic">
              Tip: Sila baca keseluruhan perenggan di atas sebelum menekan butang "Lesson Read" di sebelah kanan.
            </p>
          </div>
        </div>

        {/* Kolum Kanan: Komponen Progress */}
        <div className="md:col-span-1">
          {/* Sila pastikan anda menggunakan versi LessonProgress asal anda (tanpa timer dalaman) 
              kerana fungsi timer kini diuruskan secara berpusat oleh page level ini */}
          <LessonProgress 
            steps={stepsStatus} 
            onStepClick={handleStepClick} 
            progressId={currentProgress?.id} 
          />
        </div>

      </div>
    </div>
  );
}