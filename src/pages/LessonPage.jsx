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

  // Hubungkan dengan kaedah pengesahan akaun/ID pelajar aktif anda
  const [studentId] = useState("student-123"); 

  // useRef memastikan tracker masa bebas daripada isu tak-segerak (asynchronous lag) React state
  const startTimeRef = useRef(Date.now());
  const progressIdRef = useRef(null);

  // 1. MEMUATKAN DATA PROGRESS SEPADAN DENGAN SCHEMA EDITOR DB
  useEffect(() => {
    const fetchLessonAndProgress = async () => {
      try {
        setLoading(true);
        startTimeRef.current = Date.now(); // Tetapkan masa mula sebaik sahaja komponen dimuatkan

        // Contoh simulasi kandungan silibus/nota pelajaran
        setLessonData({
          title: "People & Culture (Lanjutan)",
          content: "Ini adalah kandungan teks utama untuk topik bacaan hari ini..."
        });

        // Tapis progress pelajar berdasarkan student_id
        const progressRecords = await base44.entities.Progress.filter({
          student_id: studentId,
        });

        if (progressRecords.length > 0) {
          const record = progressRecords[0];
          setCurrentProgress(record);
          progressIdRef.current = record.id; // Simpan ID unik untuk rujukan fungsi simpan masa
          
          setStepsStatus({
            lesson: record.step_lesson_done || false,
            flashcards: record.step_flashcards_done || false,
            mindmap: record.step_mindmap_done || false,
            activity: record.step_activity_done || false,
          });
        } else {
          // Jika data kosong (Anak baru buka kali pertama), cipta baris baru mengikut struktur skema
          const newRecord = await base44.entities.Progress.create({
            student_id: studentId,
            level: 1,
            total_xp: 0,
            streak_days: 0,
            total_study_time: 0, // Mengikut nama skema sebenar
            last_study_date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
            step_lesson_done: false,
            step_flashcards_done: false,
            step_mindmap_done: false,
            step_activity_done: false,
          });
          setCurrentProgress(newRecord);
          progressIdRef.current = newRecord.id;
        }
      } catch (error) {
        console.error("Gagal memuatkan rekod pembelajaran:", error);
        toast({
          variant: "destructive",
          title: "Ralat",
          description: "Gagal memuatkan progress pembelajaran.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchLessonAndProgress();
  }, [lessonId, studentId, toast]);

  // 2. FUNGSI UNTUK MENGIRA DAN MENGEMAS KINI MASA (MINIT) KE DATABASE SEBENAR
  const saveStudyTime = async () => {
    const progressId = progressIdRef.current;
    if (!progressId) return;

    // Kira durasi masa aktif pelajar dalam unit saat
    const elapsedSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
    
    // Hanya proses sekiranya pelajar meluangkan masa melebihi 10 saat (mengelakkan spam data bernilai 0)
    if (elapsedSeconds > 10) {
      const minutesEarned = Math.round(elapsedSeconds / 60) || 1;

      try {
        // Ambil data progress terkini dari database untuk elakkan isu 'override'
        const latestProgress = await base44.entities.Progress.get(progressId);
        
        // 💡 PEMBETULAN NAMA FIELD: total_study_time & last_study_date
        const currentTotalTime = latestProgress?.total_study_time || 0;
        const todayDate = new Date().toISOString().split('T')[0]; // Format standard YYYY-MM-DD

        await base44.entities.Progress.update(progressId, {
          total_study_time: currentTotalTime + minutesEarned,
          last_study_date: todayDate 
        });
        
        console.log(`[Timer] Rekod disimpan: +${minutesEarned} Minit ke total_study_time.`);
      } catch (err) {
        console.error("Ralat ketika cuba mengemas kini masa pengisian di database:", err);
      }
    }
  };

  // 3. CLEANUP EFFECT: DICETUSKAN SECARA AUTOMATIK SEBAIK SAHAJA PELAJAR KELUAR HALAMAN
  useEffect(() => {
    return () => {
      saveStudyTime();
    };
  }, []);

  // 4. MENGENDALIKAN AMALAN KLIK SETIAP TUGASAN (STEP CLICK)
  const handleStepClick = async (stepKey) => {
    if (!currentProgress) return;

    const updatedStatus = { ...stepsStatus, [stepKey]: !stepsStatus[stepKey] };
    setStepsStatus(updatedStatus);

    try {
      const fieldToUpdate = `step_${stepKey}_done`;
      const todayDate = new Date().toISOString().split('T')[0];

      await base44.entities.Progress.update(currentProgress.id, {
        [fieldToUpdate]: updatedStatus[stepKey],
        last_study_date: todayDate // Kemaskini tarikh terakhir belajar apabila ada aktiviti
      });

      toast({
        title: updatedStatus[stepKey] ? "Tugasan Selesai! 🎉" : "Status Dikemaskini",
        description: `Langkah ${stepKey} berjaya disimpan.`,
      });
    } catch (error) {
      console.error("Gagal menyimpan status langkah pelajaran:", error);
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

      {/* Tata Atur Reka Bentuk */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
        
        {/* Bahagian Teks Kandungan */}
        <div className="md:col-span-2 bg-white rounded-2xl p-5 border border-slate-100 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-slate-700 font-bold text-sm border-b pb-2 border-slate-50">
            <BookOpen className="w-4 h-4 text-indigo-500" />
            Nota & Bacaan Pelajaran
          </div>
          <div className="text-xs text-slate-600 leading-relaxed space-y-3">
            <p>{lessonData?.content}</p>
            <p className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-[11px] text-slate-500 italic">
              Tip: Sila baca keseluruhan perenggan di atas sebelum menekan butang sub-aktiviti di sebelah kanan.
            </p>
          </div>
        </div>

        {/* Bahagian Komponen Kemajuan (LessonProgress Component) */}
        <div className="md:col-span-1">
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