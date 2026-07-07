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

  const [studentId] = useState("student-123"); 

  const startTimeRef = useRef(Date.now());
  const progressIdRef = useRef(null);

  // 1. MEMUATKAN DATA PROGRESS SEPADAN DENGAN SCHEMA DB
  useEffect(() => {
    const fetchLessonAndProgress = async () => {
      try {
        setLoading(true);
        startTimeRef.current = Date.now(); 

        setLessonData({
          title: "People & Culture (Lanjutan)",
          content: "Ini adalah kandungan teks utama untuk topik bacaan hari ini..."
        });

        const progressRecords = await base44.entities.Progress.filter({
          student_id: studentId,
        });

        if (progressRecords.length > 0) {
          const record = progressRecords[0];
          setCurrentProgress(record);
          progressIdRef.current = record.id; 
          
          setStepsStatus({
            lesson: record.step_lesson_done || false,
            flashcards: record.step_flashcards_done || false,
            mindmap: record.step_mindmap_done || false,
            activity: record.step_activity_done || false,
          });
        } else {
          const newRecord = await base44.entities.Progress.create({
            student_id: studentId,
            level: 1,
            total_xp: 0,
            streak_days: 0,
            total_study_time: 0, 
            last_study_date: new Date().toISOString().split('T')[0], 
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

  // 2. MENGIRA DAN MENGEMAS KINI MASA (MINIT) KETIKA KELUAR HALAMAN
  const saveStudyTime = async () => {
    const progressId = progressIdRef.current;
    if (!progressId) return;

    const elapsedSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
    
    if (elapsedSeconds > 10) {
      const minutesEarned = Math.max(Math.round(elapsedSeconds / 60), 1);

      try {
        const latestProgress = await base44.entities.Progress.get(progressId);
        const currentTotalTime = latestProgress?.total_study_time || 0;
        const todayDate = new Date().toISOString().split('T')[0];

        await base44.entities.Progress.update(progressId, {
          total_study_time: currentTotalTime + minutesEarned,
          last_study_date: todayDate 
        });
        
        console.log(`[Timer] Rekod disimpan: +${minutesEarned} Minit ke total_study_time.`);
      } catch (err) {
        console.error("Ralat ketika mengemas kini masa di database:", err);
      }
    }
  };

  // 3. CLEANUP EFFECT (Ketiksa Pelajar Keluar Halaman)
  useEffect(() => {
    return () => {
      saveStudyTime();
    };
  }, []);

  // 4. MENGENDALIKAN KLIK TUGASAN
  const handleStepClick = async (stepKey) => {
    if (!currentProgress) return;

    const updatedStatus = { ...stepsStatus, [stepKey]: !stepsStatus[stepKey] };
    setStepsStatus(updatedStatus);

    try {
      const fieldToUpdate = `step_${stepKey}_done`;
      const todayDate = new Date().toISOString().split('T')[0];

      await base44.entities.Progress.update(currentProgress.id, {
        [fieldToUpdate]: updatedStatus[stepKey],
        last_study_date: todayDate 
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
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-xl">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Topik Semasa</span>
          <h1 className="text-base font-black text-slate-800 leading-tight">{lessonData?.title}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
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

        <div className="md:col-span-1">
          <LessonProgress 
            steps={stepsStatus} 
            onStepClick={handleStepClick} 
          />
        </div>
      </div>
    </div>
  );
}