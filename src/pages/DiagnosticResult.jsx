import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { getActiveStudentId } from "@/lib/rewardSystem";
import { getMasteryEmoji } from "@/lib/diagnosticQuestions";
import FoundationProfile from "@/components/diagnostic/FoundationProfile";
import { Loader2, Sparkles, Target, Lightbulb, Heart, Rocket, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DiagnosticResult() {
  const { sessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [skillResults, setSkillResults] = useState([]);
  const [analysis, setAnalysis] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      // Try router state first (from assessment page)
      const stateData = location.state;

      if (stateData?.results && stateData?.totalScore != null) {
        const r = stateData.results;
        const sessionData = {
          reading_level: r.membaca?.level || 1,
          writing_level: r.menulis?.level || 1,
          numeracy_level: r.mengira?.level || 1,
          reading_mastery: r.membaca?.mastery || "developing",
          writing_mastery: r.menulis?.mastery || "developing",
          numeracy_mastery: r.mengira?.mastery || "developing",
          total_score: stateData.totalScore,
        };

        const skills = [];
        for (const moduleId of ["membaca", "menulis", "mengira"]) {
          const mod = r[moduleId];
          if (mod?.levelScores) {
            mod.levelScores.forEach((ls) => {
              skills.push({
                skill_category: moduleId,
                skill_display_name: ls.skillDisplayName,
                score: ls.score,
              });
            });
          }
        }

        setSession(sessionData);
        setSkillResults(skills);
        setAnalysis(stateData.analysis);
        setLoading(false);
        return;
      }

      // Fallback: load from fetchChildDashboard
      try {
        const studentId = await getActiveStudentId();
        const res = await base44.functions.invoke("fetchChildDashboard", {
          student_id: studentId,
        });

        if (res.data?.success && res.data.diagnosticSession) {
          const ds = res.data.diagnosticSession;
          setSession({
            reading_level: ds.reading_level,
            writing_level: ds.writing_level,
            numeracy_level: ds.numeracy_level,
            reading_mastery: ds.reading_mastery,
            writing_mastery: ds.writing_mastery,
            numeracy_mastery: ds.numeracy_mastery,
            total_score: ds.total_score,
          });
          setSkillResults(res.data.diagnosticSkills || []);

          if (ds.ai_analysis) {
            try {
              setAnalysis(JSON.parse(ds.ai_analysis));
            } catch (e) {
              setAnalysis(null);
            }
          }
        } else {
          navigate("/diagnostic");
        }
      } catch (err) {
        console.error("Failed to load diagnostic result:", err);
        navigate("/dashboard");
      }
      setLoading(false);
    };

    loadData();
  }, [sessionId, location.state, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-900 via-green-900 to-stone-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 text-amber-400 animate-spin mx-auto" />
          <p className="text-sm font-bold text-emerald-200">Memuatkan keputusan...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-900 via-green-900 to-stone-950 flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-amber-400 mx-auto" />
          <p className="text-sm font-bold text-stone-300">Keputusan diagnostik tidak dijumpai.</p>
          <Button onClick={() => navigate("/diagnostic")} className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-black rounded-xl">
            Ambil Diagnostik
          </Button>
        </div>
      </div>
    );
  }

  const safeParse = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    try { return JSON.parse(val); } catch { return []; }
  };

  const strengths = safeParse(analysis?.strengths);
  const weaknesses = safeParse(analysis?.weaknesses);
  const activities = safeParse(analysis?.recommended_activities);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-900 via-green-900 to-stone-950 font-body text-stone-100 pb-20">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2 pt-2"
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="text-5xl"
          >
            🎉
          </motion.div>
          <h1 className="text-2xl font-black text-white">Misi Penemuan Selesai!</h1>
          <p className="text-sm text-stone-400">Suku dah kenal siapa kamu. Inilah profil asas kamu!</p>
        </motion.div>

        {/* Foundation Profile */}
        <FoundationProfile session={session} skillResults={skillResults} />

        {/* AI Analysis */}
        {analysis ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            {/* Strengths */}
            {strengths.length > 0 && (
              <div className="bg-emerald-950/60 border-2 border-emerald-500/30 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-sm font-black text-emerald-300">Kekuatan Kamu</h3>
                </div>
                <div className="space-y-2">
                  {strengths.map((s, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-stone-200">{s.skill}</p>
                        <p className="text-[11px] text-stone-400">{s.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Areas to Develop */}
            {weaknesses.length > 0 && (
              <div className="bg-amber-950/60 border-2 border-amber-500/30 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-black text-amber-300">Fokus Latihan</h3>
                </div>
                <div className="space-y-2">
                  {weaknesses.map((w, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Lightbulb className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-stone-200">{w.skill}</p>
                        <p className="text-[11px] text-stone-400">{w.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended Starting Point */}
            {analysis.recommended_starting_point && (
              <div className="bg-stone-900/80 border-2 border-stone-700 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Rocket className="w-5 h-5 text-blue-400" />
                  <h3 className="text-sm font-black text-blue-300">Titik Permulaan Cadangan</h3>
                </div>
                <p className="text-xs text-stone-300 leading-relaxed">{analysis.recommended_starting_point}</p>
              </div>
            )}

            {/* Recommended Activities */}
            {activities.length > 0 && (
              <div className="bg-stone-900/80 border-2 border-stone-700 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-sm font-black text-emerald-300">Aktiviti Cadangan</h3>
                </div>
                {activities.map((a, i) => (
                  <div key={i} className="flex items-start gap-2 bg-stone-800/40 rounded-xl p-2.5">
                    <span className="text-xs font-black text-stone-500 shrink-0">{i + 1}.</span>
                    <div>
                      <p className="text-xs font-bold text-stone-200">{a.activity}</p>
                      <p className="text-[11px] text-stone-400">{a.purpose}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Parent Insight */}
            {analysis.parent_insight && (
              <div className="bg-gradient-to-br from-purple-950/60 to-indigo-950/60 border-2 border-purple-500/30 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="w-5 h-5 text-purple-400" />
                  <h3 className="text-sm font-black text-purple-300">Mesej untuk Ibu Bapa</h3>
                </div>
                <p className="text-xs text-stone-300 leading-relaxed">{analysis.parent_insight}</p>
              </div>
            )}
          </motion.div>
        ) : (
          <div className="bg-stone-900/80 border-2 border-stone-700 rounded-2xl p-4 text-center">
            <p className="text-xs text-stone-400">Analisis AI sedang diproses. Sila semak semula nanti.</p>
          </div>
        )}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-3 pt-2"
        >
          <button
            onClick={() => navigate("/dashboard")}
            className="w-full h-14 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-base rounded-2xl border-b-4 border-amber-700 active:translate-y-1 transition-all flex items-center justify-center gap-2"
          >
            <Rocket className="w-5 h-5" />
            Teroka Sekarang!
          </button>
          <p className="text-center text-xs text-stone-500">
            Suku akan bantu kamu memulakan perjalanan belajar yang sesuai! 🐢
          </p>
        </motion.div>
      </div>
    </div>
  );
}