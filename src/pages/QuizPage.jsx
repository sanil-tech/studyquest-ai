// src/pages/QuizPage.jsx
// Quiz Evaluation Page — Powered strictly by getLearningPackage

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import QuizRunner from "@/components/quiz/QuizRunner";
import { ChevronLeft, Loader2, Compass } from "lucide-react";

export default function QuizPage() {
  const { quizId, assessmentId } = useParams();
  const targetAssessmentId = assessmentId || quizId;
  const navigate = useNavigate();

  const [packageData, setPackageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const loadPackage = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await base44.functions.invoke("getLearningPackage", {
          assessment_id: targetAssessmentId
        });

        if (res.data?.success && isMounted) {
          setPackageData(res.data);
        } else if (isMounted) {
          setError(res.data?.error || "Gagal memuatkan soalan ujian.");
        }
      } catch (err) {
        if (isMounted) setError("Ralat rangkaian semasa memuatkan ujian.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (targetAssessmentId) {
      loadPackage();
    } else {
      setLoading(false);
      setError("ID Penilaian tidak sah.");
    }

    return () => { isMounted = false; };
  }, [targetAssessmentId]);

  const activeAssessment = packageData?.assessments?.[0] || null;
  const studentName = packageData?.student_context?.display_name || "Pengembara";

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-stone-950 text-white p-4">
        <Loader2 className="w-10 h-10 text-amber-400 animate-spin" />
        <p className="mt-3 font-black text-stone-300 text-xs">Membuka Soalan Ujian...</p>
      </div>
    );
  }

  if (error || !activeAssessment) {
    return (
      <div className="min-h-screen bg-stone-950 text-white p-6 flex flex-col items-center justify-center text-center">
        <div className="p-6 bg-stone-900 border border-stone-800 rounded-3xl max-w-sm space-y-4">
          <p className="text-xs font-bold text-rose-300">{error || "Ujian tidak ditemui."}</p>
          <button
            onClick={() => navigate(-1)}
            className="w-full py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-black rounded-xl border border-stone-700"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-950/40 via-stone-950 to-stone-950 text-stone-100 px-4 py-6 pb-24">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* TOP HUD HEADER */}
        <div className="bg-stone-900/90 border-2 border-stone-700/80 rounded-3xl p-4 shadow-xl flex items-center justify-between backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-2xl border border-stone-600 transition-all active:scale-95"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 px-2.5 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/20">
                {packageData?.curriculum_context?.subject_name || "Ujian Minda"}
              </span>
              <h1 className="text-sm sm:text-base font-black text-white mt-1 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-amber-400" /> {activeAssessment.title || "Penilaian Minda"}
              </h1>
            </div>
          </div>
        </div>

        {/* QUIZ RUNNER MODULE */}
        <QuizRunner
          assessment={activeAssessment}
          studentName={studentName}
          onFinish={() => navigate(-1)}
        />

      </div>
    </div>
  );
}
