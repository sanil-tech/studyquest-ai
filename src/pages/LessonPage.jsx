// src/pages/LessonPage.jsx (Original Structure)
import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Sparkles, Play, Loader2, Trophy, BookOpen, Layers, GitFork, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";

import LessonContent from "@/components/lesson/LessonContent";
import VoicePlayer from "@/components/lesson/VoicePlayer";
import Flashcards from "@/components/lesson/Flashcards";
import MindMap from "@/components/lesson/MindMap";

export default function LessonPage() {
  const { subjectId, topicId } = useParams();
  const navigate = useNavigate();
  
  const [subject, setSubject] = useState(null);
  const [topic, setTopic] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [studentNickname, setStudentNickname] = useState(""); 
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  const [explanation, setExplanation] = useState("");
  const [metaData, setMetaData] = useState({ summary: "", keywords: [] });
  const [flashcards, setFlashcards] = useState(null);
  const [mindMap, setMindMap] = useState(null);
  const [rawBankQuestions, setRawBankQuestions] = useState([]);

  const [activeTab, setActiveTab] = useState("lesson"); 
  const [status, setStatus] = useState({ lesson: false, flashcards: false, mindmap: false, quiz: false });

  const studyStartRef = useRef(null);
  const sessionRef = useRef(null);

  useEffect(() => {
    const initializeLesson = async () => {
      try {
        const [sub, top, user] = await Promise.all([
          base44.entities.Subject.get(subjectId),
          base44.entities.Topic.get(topicId),
          base44.auth.me(),
        ]);
        setSubject(sub);
        setTopic(top);
        setStudentNickname(user?.nickname || "Pelajar");
        setIsPremium(user?.is_premium || false);

        // Ambil semua kuiz untuk penapisan bank soalan
        const allQuizBanks = await base44.entities.Quiz.filter({});
        if (allQuizBanks && allQuizBanks.length > 0) {
          const namaTopikSemasa = top.name.toLowerCase().trim();
          const foundBank = allQuizBanks.find(bank => {
            const namaBankCsv = (bank.topic_name || "").toLowerCase().trim();
            return !bank.session_id && (namaBankCsv.includes(namaTopikSemasa) || namaTopikSemasa.includes(namaBankCsv));
          });

          if (foundBank) {
            const parsedQs = typeof foundBank.questions_json === "string" 
              ? JSON.parse(foundBank.questions_json || "[]") 
              : foundBank.questions_json;
            setRawBankQuestions(parsedQs);
          }
        }

        // Semak sesi sedia ada
        const cachedSessions = await base44.entities.StudySession.filter(
          { student_id: user.id, topic_id: topicId },
          "-created_date",
          1
        );

        if (cachedSessions.length > 0) {
          const session = cachedSessions[0];
          setSessionId(session.id);
          if (session.ai_explanation) {
            const parsed = JSON.parse(session.ai_explanation);
            setExplanation(parsed.lesson_markdown);
            setMetaData({ summary: parsed.summary || "", keywords: parsed.keywords || [] });
            if (session.mindmap_json) setMindMap(JSON.parse(session.mindmap_json));
            if (session.flashcards_json) setFlashcards(JSON.parse(session.flashcards_json));
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        studyStartRef.current = Date.now();
        setLoading(false);
      }
    };
    initializeLesson();
  }, [subjectId, topicId]);

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-6">
      {/* Kod UI Asal Paparan Nota, Flashcard & Butang Kuiz */}
      <h1 className="text-2xl font-bold">{topic?.name}</h1>
      <p>{subject?.name}</p>
    </div>
  );
}