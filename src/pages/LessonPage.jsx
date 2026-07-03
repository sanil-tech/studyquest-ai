// src/pages/LessonPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  ArrowLeft,
  Sparkles,
  Lock,
  Play,
  BookOpen,
  Layers,
  GitFork,
  Trophy,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

import LessonContent from "@/components/lesson/LessonContent";
import Flashcards from "@/components/lesson/Flashcards";
import MindMap from "@/components/lesson/MindMap";

export default function LessonPage() {
  const { subjectId, topicId } = useParams();
  const navigate = useNavigate();

  const [subject, setSubject] = useState(null);
  const [topic, setTopic] = useState(null);

  const [explanation, setExplanation] = useState("");
  const [metaData, setMetaData] = useState({ summary: "", keywords: [] });

  const [flashcards, setFlashcards] = useState([]);
  const [mindMap, setMindMap] = useState(null);

  // 🧠 DUOLINGO PROGRESS SYSTEM
  const [step, setStep] = useState(1); 
  // 1 = lesson, 2 = flashcards, 3 = mindmap, 4 = quiz

  const [completed, setCompleted] = useState({
    lesson: false,
    flashcards: false,
    mindmap: false,
  });

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({
    lesson: false,
    flashcards: false,
    mindmap: false,
  });

  useEffect(() => {
    const init = async () => {
      const [sub, top] = await Promise.all([
        base44.entities.Subject.get(subjectId),
        base44.entities.Topic.get(topicId),
      ]);

      setSubject(sub);
      setTopic(top);
      setLoading(false);
    };

    init();
  }, [subjectId, topicId]);

  // =========================
  // AI LESSON GENERATION
  // =========================
  const generateLesson = async () => {
    setStatus(p => ({ ...p, lesson: true }));

    const res = await base44.integrations.Core.InvokeLLM({
      model: "gemini_3_flash",
      prompt: `
Generate lesson for ${topic?.name} in Malaysian curriculum.
Return JSON:
{
  "lesson_markdown": "",
  "summary": "",
  "keywords": []
}
      `,
    });

    setExplanation(res.lesson_markdown);
    setMetaData({
      summary: res.summary,
      keywords: res.keywords,
    });

    setCompleted(p => ({ ...p, lesson: true }));
    setStep(2);

    setStatus(p => ({ ...p, lesson: false }));
  };

  // =========================
  // FLASHCARDS (STEP 2)
  // =========================
  const generateFlashcards = async () => {
    setStatus(p => ({ ...p, flashcards: true }));

    const res = await base44.integrations.Core.InvokeLLM({
      model: "gemini_3_flash",
      prompt: `
Based on: ${metaData.summary}
Create 5 flashcards.
Return:
[{ "front": "", "back": "" }]
      `,
      response_json_schema: {
        type: "object",
        properties: {
          flashcards: {
            type: "array",
            items: {
              type: "object",
              properties: {
                front: { type: "string" },
                back: { type: "string" },
              },
              required: ["front", "back"],
            },
          },
        },
        required: ["flashcards"],
      },
    });

    const cards = Array.isArray(res?.flashcards) ? res.flashcards : [];
    setFlashcards(cards);
    setCompleted(p => ({ ...p, flashcards: true }));
    setStep(3);

    setStatus(p => ({ ...p, flashcards: false }));
  };

  // =========================
  // MINDMAP (STEP 3)
  // =========================
  const generateMindMap = async () => {
    setStatus(p => ({ ...p, mindmap: true }));

    const res = await base44.integrations.Core.InvokeLLM({
      model: "gemini_3_flash",
      prompt: `
Summary: ${metaData.summary}
Keywords: ${JSON.stringify(metaData.keywords)}

Return:
[{ "label": "", "children": [] }]
      `,
    });

    setMindMap(res);
    setCompleted(p => ({ ...p, mindmap: true }));
    setStep(4);

    setStatus(p => ({ ...p, mindmap: false }));
  };

  // =========================
  // QUIZ NAVIGATION
  // =========================
  const goQuiz = () => {
    navigate(`/quiz/${topicId}`);
  };

  if (loading) {
    return <div className="p-10 text-center">Loading...</div>;
  }

  return (
    <div className="max-w-md mx-auto p-4 space-y-6 pb-20">

      {/* HEADER */}
      <div className="flex items-center gap-3">
        <Link to={`/study/${subjectId}`}>
          <ArrowLeft />
        </Link>

        <div>
          <h1 className="font-bold">{topic?.name}</h1>
          <p className="text-xs text-gray-500">{subject?.name}</p>
        </div>
      </div>

      {/* PROGRESS BAR */}
      <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
        <div
          className="bg-green-500 h-2 transition-all"
          style={{ width: `${(step / 4) * 100}%` }}
        />
      </div>

      {/* =========================
          STEP 1: LESSON
      ========================= */}
      <StepCard
        title="Learn Lesson"
        icon={<BookOpen />}
        unlocked={step >= 1}
        completed={completed.lesson}
        loading={status.lesson}
        onClick={generateLesson}
        buttonText="Start Lesson"
      />

      {step >= 1 && explanation && (
        <motion.div className="bg-white p-4 rounded-xl border">
          <LessonContent content={explanation} />
        </motion.div>
      )}

      {/* =========================
          STEP 2: FLASHCARDS
      ========================= */}
      <StepCard
        title="Flashcards Game"
        icon={<Layers />}
        unlocked={step >= 2}
        completed={completed.flashcards}
        loading={status.flashcards}
        onClick={generateFlashcards}
        buttonText="Play Flashcards"
      />

      {step >= 2 && flashcards.length > 0 && (
        <Flashcards flashcards={flashcards} />
      )}

      {/* =========================
          STEP 3: MINDMAP
      ========================= */}
      <StepCard
        title="Mind Map"
        icon={<GitFork />}
        unlocked={step >= 3}
        completed={completed.mindmap}
        loading={status.mindmap}
        onClick={generateMindMap}
        buttonText="Generate Mindmap"
      />

      {step >= 3 && mindMap && (
        <MindMap mindMap={{ central_topic: topic.name, branches: mindMap }} />
      )}

      {/* =========================
          STEP 4: QUIZ BOSS
      ========================= */}
      <div className="border rounded-xl p-4 bg-gradient-to-r from-emerald-50 to-teal-50">
        <h3 className="font-bold">Final Challenge 🎯</h3>

        {step < 4 ? (
          <div className="flex items-center gap-2 text-gray-400">
            <Lock size={16} />
            Locked until all steps completed
          </div>
        ) : (
          <Button onClick={goQuiz} className="w-full mt-3">
            <Trophy className="w-4 h-4 mr-2" />
            Start Quiz Battle
          </Button>
        )}
      </div>
    </div>
  );
}

// =========================
// STEP COMPONENT (DUOLINGO STYLE CARD)
// =========================
function StepCard({
  title,
  icon,
  unlocked,
  completed,
  loading,
  onClick,
  buttonText,
}) {
  return (
    <div
      className={`border rounded-xl p-4 transition ${
        unlocked ? "bg-white" : "bg-gray-100 opacity-60"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold">
          {icon}
          {title}
        </div>

        {completed && <CheckCircle2 className="text-green-500" />}
      </div>

      {!unlocked ? (
        <div className="text-xs text-gray-500 flex items-center gap-2 mt-2">
          <Lock size={14} /> Locked
        </div>
      ) : (
        <Button
          onClick={onClick}
          disabled={loading || completed}
          className="mt-3 w-full"
        >
          {loading ? "Loading..." : buttonText}
        </Button>
      )}
    </div>
  );
}