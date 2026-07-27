// src/components/student/RecommendationCard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { getStudentEducationLevel, matchesEducationLevel } from "@/lib/childUtils";
import { Sparkles, ArrowRight, Loader2, Lightbulb, GraduationCap } from "lucide-react";
import { motion } from "framer-motion";

const DIFFICULTY_STYLES = {
  easy: "bg-emerald-100 text-emerald-700 border-emerald-300",
  medium: "bg-amber-100 text-amber-700 border-amber-300",
  hard: "bg-rose-100 text-rose-700 border-rose-300",
};

export default function RecommendationCard({ user, sessions, quizzes }) {
  const navigate = useNavigate();
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const generateRecommendation = async () => {
      try {
        setLoading(true);
        setError(false);

        const studentLevel = getStudentEducationLevel(user);
        if (!studentLevel) {
          setLoading(false);
          return;
        }

        // Load subjects and topics
        const [subjectsResult, topicsResult] = await Promise.allSettled([
          base44.entities.Subject.list(),
          base44.entities.Topic.list(),
        ]);

        const subjects = subjectsResult.status === "fulfilled" ? subjectsResult.value : [];
        const allTopics = topicsResult.status === "fulfilled" ? topicsResult.value : [];

        // Filter topics by student's KSSR/KSSM level
        const levelTopics = allTopics.filter(t => matchesEducationLevel(studentLevel, t.form_level));

        if (subjects.length === 0 || levelTopics.length === 0) {
          setLoading(false);
          return;
        }

        // Build structured curriculum context for AI
        const curriculumContext = subjects.map(s => {
          const subTopics = levelTopics.filter(t => t.subject_id === s.id);
          if (subTopics.length === 0) return null;
          return {
            subject_id: s.id,
            subject_name: s.name,
            topics: subTopics.map(t => ({ topic_id: t.id, topic_name: t.name, form_level: t.form_level })),
          };
        }).filter(Boolean);

        // Build recent activity summary
        const recentSessions = (sessions || []).slice(0, 5).map(s => ({
          topic: s.topic_name,
          subject: s.subject_name,
        }));

        const recentQuizzes = (quizzes || []).slice(0, 5).map(q => ({
          topic: q.topic_name,
          subject: q.subject_name,
          score: q.score,
        }));

        const prompt = `You are an AI learning advisor for StudyQuest, a Malaysian KSSR/KSSM gamified learning platform for primary (Standard 1-6) and secondary (Form 1-5) students.

STUDENT PROFILE:
- Name: ${user?.nickname || user?.full_name || "Student"}
- Education Level: ${studentLevel} (Malaysian curriculum)

AVAILABLE SUBJECTS AND MISSIONS (topics) for ${studentLevel}:
${JSON.stringify(curriculumContext, null, 2)}

RECENT STUDY SESSIONS (most recent first):
${recentSessions.length > 0 ? JSON.stringify(recentSessions, null, 2) : "None yet"}

RECENT QUIZ ATTEMPTS (most recent first):
${recentQuizzes.length > 0 ? JSON.stringify(recentQuizzes, null, 2) : "None yet"}

Based on the Malaysian ${studentLevel} curriculum sequence, the student's recent activity, and quiz performance, recommend the SINGLE BEST next mission (topic) for them to study.

RECOMMENDATION RULES:
1. If the student scored below 70% on a recent quiz, recommend reviewing that topic or a prerequisite topic in the same subject.
2. If the student hasn't studied a particular subject recently, recommend exploring a new subject to keep learning balanced.
3. Prefer topics that logically follow recently studied content (curriculum sequence).
4. If no recent activity, recommend a foundational topic for their level.
5. Only recommend from the AVAILABLE subjects and missions listed above — do not invent topics.

Respond in this exact JSON format:
{
  "subject_id": "the subject_id from the list above",
  "subject_name": "the subject_name from the list above",
  "topic_id": "the topic_id from the list above",
  "topic_name": "the topic_name from the list above",
  "reason": "Alasan dalam Bahasa Melayu (1-2 ayat) mengapa misi ini dicadangkan, mesra dan menggalakkan",
  "difficulty": "easy or medium or hard"
}`;

        const result = await base44.integrations.Core.InvokeLLM({
          prompt,
          response_json_schema: {
            type: "object",
            properties: {
              subject_id: { type: "string" },
              subject_name: { type: "string" },
              topic_id: { type: "string" },
              topic_name: { type: "string" },
              reason: { type: "string" },
              difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
            },
          },
        });

        // Validate: ensure recommended IDs exist in our data
        const validSubject = subjects.find(s => s.id === result.subject_id || s.name === result.subject_name);
        const validTopic = levelTopics.find(t => t.id === result.topic_id || t.name === result.topic_name);

        if (!validSubject || !validTopic) {
          // Fallback: pick the first available topic
          const fallbackTopic = levelTopics[0];
          const fallbackSubject = subjects.find(s => s.id === fallbackTopic.subject_id);
          if (fallbackSubject && fallbackTopic) {
            setRecommendation({
              subject_id: fallbackSubject.id,
              subject_name: fallbackSubject.name,
              topic_id: fallbackTopic.id,
              topic_name: fallbackTopic.name,
              reason: "Mari mulakan pengembaraan pembelajaran anda dengan misi pertama!",
              difficulty: "easy",
            });
          }
        } else {
          setRecommendation({
            ...result,
            subject_id: validSubject.id,
            subject_name: validSubject.name,
            topic_id: validTopic.id,
            topic_name: validTopic.name,
          });
        }
      } catch (err) {
        console.error("AI Recommendation error:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    generateRecommendation();
  }, [user, sessions, quizzes]);

  // Loading state
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 rounded-[2rem] p-6 text-white shadow-xl border-b-8 border-purple-900 overflow-hidden"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
            <Loader2 className="w-7 h-7 animate-spin text-purple-100" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Lightbulb className="w-4 h-4 text-amber-300" />
              <span className="text-xs font-black uppercase tracking-wider text-purple-200">Cadangan AI Otan</span>
            </div>
            <p className="text-sm font-bold text-purple-100">Otan sedang memikir misi terbaik untuk anda...</p>
          </div>
        </div>
      </motion.div>
    );
  }

  // No level set or no topics available — don't render
  if (!recommendation) return null;

  const difficultyStyle = DIFFICULTY_STYLES[recommendation.difficulty] || DIFFICULTY_STYLES.medium;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 rounded-[2rem] p-6 text-white shadow-xl border-b-8 border-purple-900 overflow-hidden"
    >
      {/* Decorative glow */}
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
      <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-amber-400/20 rounded-full blur-2xl" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-400 flex items-center justify-center shadow-md shrink-0">
            <Lightbulb className="w-5 h-5 text-stone-900" />
          </div>
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-purple-200 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-300" /> Cadangan Misi AI
            </span>
            <p className="text-[11px] text-purple-300 font-bold">Dipilih khas untuk anda oleh Otan</p>
          </div>
        </div>

        {/* Recommendation content */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 mb-4">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-purple-200 uppercase tracking-wide">{recommendation.subject_name}</p>
              <h3 className="text-xl font-black text-white mt-0.5 leading-tight">{recommendation.topic_name}</h3>
            </div>
            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${difficultyStyle} shrink-0`}>
              {recommendation.difficulty === "easy" ? "Mudah" : recommendation.difficulty === "medium" ? "Sederhana" : "Mencabar"}
            </span>
          </div>
          <p className="text-sm text-purple-100 font-medium leading-relaxed">{recommendation.reason}</p>
        </div>

        {/* Action button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate(`/study/${recommendation.subject_id}/${recommendation.topic_id}`)}
          className="w-full bg-amber-400 hover:bg-amber-300 text-stone-900 font-black text-sm px-6 py-3.5 rounded-2xl shadow-lg border-b-4 border-amber-600 flex items-center justify-center gap-2 transition-colors"
        >
          <GraduationCap className="w-5 h-5" />
          Mula Misi Dicadang
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  );
}