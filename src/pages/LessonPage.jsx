import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles, Play, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";

export default function LessonPage() {
  const { subjectId, topicId } = useParams();
  const navigate = useNavigate();
  const [subject, setSubject] = useState(null);
  const [topic, setTopic] = useState(null);
  const [explanation, setExplanation] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [sub, top, user] = await Promise.all([
        base44.entities.Subject.get(subjectId),
        base44.entities.Topic.get(topicId),
        base44.auth.me(),
      ]);
      setSubject(sub);
      setTopic(top);

      // Check for existing session
      const sessions = await base44.entities.StudySession.filter(
        { student_id: user.id, topic_id: topicId },
        "-created_date",
        1
      );
      if (sessions.length > 0 && sessions[0].ai_explanation) {
        setExplanation(sessions[0].ai_explanation);
        setSessionId(sessions[0].id);
      }
      setLoading(false);
    };
    load();
  }, [subjectId, topicId]);

  const generateLesson = async () => {
    setGenerating(true);
    const user = await base44.auth.me();
    const textbooks = await base44.entities.Textbook.filter({ subject_id: subjectId });
    const matchingBooks = textbooks.filter(t => t.form_level === "All Levels" || t.form_level === topic.form_level);
    const fileUrls = matchingBooks.filter(t => !t.file_size || t.file_size <= 10 * 1024 * 1024).map(t => t.file_url).filter(Boolean);
    const result = await base44.integrations.Core.InvokeLLM({
      model: "gemini_3_flash",
      add_context_from_internet: true,
      file_urls: fileUrls.length > 0 ? fileUrls : undefined,
      prompt: (() => {
        const isYoungLearner = ["Standard 1", "Standard 2", "Standard 3"].includes(topic.form_level);
        const textbookNote = fileUrls.length > 0
          ? `Use the provided Malaysian curriculum textbook as the PRIMARY source. Find the chapter covering "${topic.name}" and base your lesson on its actual content. `
          : "";
        const levelNote = topic.form_level?.startsWith("Standard")
          ? `This is a primary school level (Standard 1-6) using Kurikulum Standard Sekolah Rendah (KSSR).`
          : topic.form_level?.startsWith("Form")
            ? `This is a secondary school level (Form 1-5) using Kurikulum Standard Sekolah Menengah (KSSM).`
            : `Follow either KSSR (primary) or KSSM (secondary) depending on the topic level.`;

        if (isYoungLearner) {
          return `You are a super fun and friendly AI tutor for young Malaysian primary school children (Tahun 1-3, ages 7-9). ${textbookNote}Search the web for the official KSSR curriculum content for this topic, then explain it.

TOPIC: "${topic.name}" | SUBJECT: "${subject.name}" | LEVEL: ${topic.form_level}
${levelNote} Base your lesson on the official KPM KSSR syllabus and learning standards. Use Malaysian context (RM, local foods, animals, places, festivals).

🧒 TEACHING STYLE — FUN & INTERACTIVE FOR YOUNG LEARNERS:
- Use VERY simple words a 7-9 year old can understand. Short sentences.
- Start with a FUN STORY or SCENARIO starring a friendly character (e.g. "Adik Ali pergi ke kedai..."). Use the same character throughout.
- Use LOTS of emojis 🎉🧮🍎🐱 to make it visually fun (but not overwhelming).
- Use **bold** for key words so they stand out.
- Ask 1-2 simple QUESTIONS in the middle of the lesson and write "(Cuba jawab! 🤔)" to encourage the child to think.
- Use a "Game Time! 🎮" mini-challenge — one tiny activity they can do in their head (e.g. "Can you count 5 objects around you?").
- Include a simple SONG or RHYME if it helps them remember (Malay or English).
- Be warm, encouraging, and celebrate them: "Hebat! ⭐" "Tabik spring! 👏".

📋 LESSON STRUCTURE (use Markdown headings):
1. **📖 Cerita Kita (Our Story)** — A short fun story introducing the topic
2. **🔍 Apa Ini? (What is it?)** — Simple definition with emojis
3. **💡 Jom Belajar! (Let's Learn!)** — Main concepts explained simply, with 1 interactive question
4. **🍎 Contoh Seronok (Fun Example)** — A worked example using Malaysian daily life
5. **🎮 Game Time! (Mini Challenge)** — A tiny activity or game
6. **🎵 Tip Hebat (Pro Tip)** — A memory trick or mini song/rhyme
7. **⭐ Gambarajah Minda (Mind Map)** — A simple text-based summary with arrows (→) or bullet emojis

Keep it playful, colorful, and short enough for a young child's attention span. Use both Malay and simple English words when helpful.`;
        }

        return `You are an expert tutor for Malaysian school students. ${textbookNote}Search the web for the official Malaysian curriculum (KSSR/KSSM) content for this topic, then explain it. Explain the topic "${topic.name}" from the subject "${subject.name}" strictly following the Malaysian National Curriculum. ${levelNote}${topic.form_level ? ` Target level: ${topic.form_level}.` : ""}

Base your lesson content on the official Malaysian Ministry of Education (KPM) syllabus and learning standards for this subject and topic. Use Malaysian context, examples, and terminology where appropriate (e.g. RM for currency, local examples).

Structure your explanation:
1. **What is it?** - Simple definition
2. **Key Concepts** - Main points to understand (aligned to the curriculum learning standards)
3. **How it works** - Explanation with simple language
4. **Example** - One clear, worked example (use Malaysian context where relevant)
5. **Quick Tip** - A memory trick or study tip

Keep it engaging and encouraging. Use emojis sparingly to make it fun.`;
      })(),
    });

    const session = await base44.entities.StudySession.create({
      student_id: user.id,
      subject_id: subjectId,
      topic_id: topicId,
      topic_name: topic.name,
      subject_name: subject.name,
      ai_explanation: result,
      duration_minutes: 0,
    });
    setExplanation(result);
    setSessionId(session.id);
    setGenerating(false);
  };

  const generateQuiz = async () => {
    setGeneratingQuiz(true);
    const textbooks = await base44.entities.Textbook.filter({ subject_id: subjectId });
    const matchingBooks = textbooks.filter(t => t.form_level === "All Levels" || t.form_level === topic.form_level);
    const fileUrls = matchingBooks.filter(t => !t.file_size || t.file_size <= 10 * 1024 * 1024).map(t => t.file_url).filter(Boolean);
    const result = await base44.integrations.Core.InvokeLLM({
      model: "gemini_3_flash",
      add_context_from_internet: true,
      file_urls: fileUrls.length > 0 ? fileUrls : undefined,
      prompt: (() => {
        const isYoungLearner = ["Standard 1", "Standard 2", "Standard 3"].includes(topic.form_level);
        const levelNote = topic.form_level?.startsWith("Standard")
          ? `This is a primary school level (Standard 1-6) using Kurikulum Standard Sekolah Rendah (KSSR).`
          : topic.form_level?.startsWith("Form")
            ? `This is a secondary school level (Form 1-5) using Kurikulum Standard Sekolah Menengah (KSSM).`
            : "";

        if (isYoungLearner) {
          return `Search the web for the official KSSR curriculum content for this topic, then generate exactly 5 multiple choice questions about "${topic.name}" for young Malaysian primary school children (Tahun 1-3, ages 7-9), strictly following KSSR. ${levelNote} Target level: ${topic.form_level}. Base questions on the official KPM syllabus for "${subject?.name || ""}".

🧒 QUIZ STYLE — FUN & AGE-APPROPRIATE:
- Use VERY simple words and short sentences.
- Make questions feel like a game or story (e.g. "Adik Ali ada 3 epal... 🍎🍎🍎").
- Use emojis in questions and explanations to make it fun.
- Use Malaysian context (RM, local foods, animals, toys, school).
- Only 4 simple answer options per question.
- Explanations should be encouraging and use simple words (e.g. "Betul! Hebat! ⭐").

Return ONLY valid JSON, no extra text.`;
        }

        return `Search the web for the official Malaysian curriculum (KSSR/KSSM) content for this topic, then generate exactly 5 multiple choice questions about "${topic.name}" for Malaysian school students, strictly following the Malaysian National Curriculum. ${levelNote}${topic.form_level ? ` Target level: ${topic.form_level}.` : ""} Base questions on the official KPM syllabus learning standards for the subject "${subject?.name || ""}". Use Malaysian context where appropriate.

Return ONLY valid JSON, no extra text.`;
      })(),
      response_json_schema: {
        type: "object",
        properties: {
          questions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                question: { type: "string" },
                options: { type: "array", items: { type: "string" } },
                correct_answer: { type: "string" },
                explanation: { type: "string" },
              },
              required: ["question", "options", "correct_answer"],
            },
          },
        },
      },
    });

    const quiz = await base44.entities.Quiz.create({
      session_id: sessionId,
      topic_name: topic.name,
      subject_name: subject?.name || "",
      questions_json: JSON.stringify(result.questions),
      difficulty: "medium",
      num_questions: result.questions.length,
    });

    navigate(`/quiz/${quiz.id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to={`/study/${subjectId}`} className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-heading font-bold">{topic?.name}</h1>
          <p className="text-muted-foreground text-sm">{subject?.icon} {subject?.name}</p>
        </div>
      </div>

      {/* Lesson content */}
      {!explanation ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-xl font-heading font-bold mb-2">Ready to Learn?</h2>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            Our AI tutor will explain {topic?.name} in a way that's easy to understand.
          </p>
          <Button
            onClick={generateLesson}
            disabled={generating}
            className="h-12 px-8 rounded-xl text-base font-semibold"
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                AI is thinking...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Generate Lesson
              </>
            )}
          </Button>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-border/50 prose prose-sm max-w-none">
            <ReactMarkdown>{explanation}</ReactMarkdown>
          </div>

          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-5 border border-emerald-100">
            <h3 className="font-heading font-bold text-emerald-800 mb-2">Ready to test yourself? 🎯</h3>
            <p className="text-sm text-emerald-600 mb-4">
              Take a quiz to earn coins and XP!
            </p>
            <Button
              onClick={generateQuiz}
              disabled={generatingQuiz}
              className="bg-emerald-600 hover:bg-emerald-700 rounded-xl"
            >
              {generatingQuiz ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Creating Quiz...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Generate Quiz
                </>
              )}
            </Button>
          </div>

          <Button
            variant="outline"
            onClick={generateLesson}
            disabled={generating}
            className="w-full rounded-xl"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Regenerate Lesson
          </Button>
        </motion.div>
      )}
    </div>
  );
}