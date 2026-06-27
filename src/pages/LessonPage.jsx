import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles, Play, Loader2, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import Flashcards from "@/components/lesson/Flashcards";
import MindMap from "@/components/lesson/MindMap";
import InteractiveActivity from "@/components/lesson/InteractiveActivity";

export default function LessonPage() {
  const { subjectId, topicId } = useParams();
  const navigate = useNavigate();
  const [subject, setSubject] = useState(null);
  const [topic, setTopic] = useState(null);
  const [explanation, setExplanation] = useState("");
  const [lessonData, setLessonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const studyStartRef = useRef(null);

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
        const raw = sessions[0].ai_explanation;
        try {
          const parsed = JSON.parse(raw);
          if (parsed.lesson_markdown) {
            const cleaned = {
              ...parsed,
              lesson_markdown: parsed.lesson_markdown.replace(/\\n/g, "\n"),
              flashcards: (parsed.flashcards || []).map(c => ({
                front: (c.front || "").replace(/\\n/g, " "),
                back: (c.back || "").replace(/\\n/g, " "),
              })),
              mind_map: parsed.mind_map ? {
                ...parsed.mind_map,
                central_topic: (parsed.mind_map.central_topic || "").replace(/\\n/g, " "),
                branches: (parsed.mind_map.branches || []).map(b => ({
                  ...b,
                  label: (b.label || "").replace(/\\n/g, " "),
                  children: (b.children || []).map(c => (c || "").replace(/\\n/g, " ")),
                })),
              } : null,
              activity: parsed.activity ? {
                ...parsed.activity,
                title: (parsed.activity.title || "").replace(/\\n/g, " "),
                items: (parsed.activity.items || []).map(it => {
                  const cleaned = {};
                  Object.keys(it || {}).forEach(k => {
                    cleaned[k] = typeof it[k] === "string" ? it[k].replace(/\\n/g, " ") : it[k];
                  });
                  return cleaned;
                }),
              } : null,
            };
            setLessonData(cleaned);
            setExplanation(cleaned.lesson_markdown);
          } else {
            setExplanation(raw.replace(/\\n/g, "\n"));
          }
        } catch {
          setExplanation(raw.replace(/\\n/g, "\n"));
        }
        setSessionId(sessions[0].id);
      }
      studyStartRef.current = Date.now();
      setLoading(false);
    };
    load();
  }, [subjectId, topicId]);

  // Record study time when leaving the lesson page
  const recordStudyTime = async () => {
    if (!sessionId || !studyStartRef.current) return;
    const minutes = Math.max(1, Math.round((Date.now() - studyStartRef.current) / 60000));
    try {
      await base44.entities.StudySession.update(sessionId, { duration_minutes: minutes });
    } catch {}
  };

  useEffect(() => {
    return () => { recordStudyTime(); };
  }, [sessionId]);

  const generateLesson = async () => {
    setGenerating(true);
    setLessonData(null);
    const user = await base44.auth.me();
    const textbooks = await base44.entities.Textbook.filter({ subject_id: subjectId });
    const matchingBooks = textbooks.filter(t => t.form_level === "All Levels" || t.form_level === topic.form_level);
    const fileUrls = matchingBooks.filter(t => !t.file_size || t.file_size <= 10 * 1024 * 1024).map(t => t.file_url).filter(Boolean);
    const isYoungLearner = ["Standard 1", "Standard 2", "Standard 3"].includes(topic.form_level);
    const textbookNote = fileUrls.length > 0
      ? `Use the provided Malaysian curriculum textbook as the PRIMARY source. Find the chapter covering "${topic.name}" and base your lesson on its actual content. `
      : "";
    const levelNote = topic.form_level?.startsWith("Standard")
      ? `This is a primary school level (Standard 1-6) using Kurikulum Standard Sekolah Rendah (KSSR).`
      : topic.form_level?.startsWith("Form")
        ? `This is a secondary school level (Form 1-5) using Kurikulum Standard Sekolah Menengah (KSSM).`
        : `Follow either KSSR (primary) or KSSM (secondary) depending on the topic level.`;

    const result = isYoungLearner
      ? await base44.integrations.Core.InvokeLLM({
          model: "gemini_3_flash",
          add_context_from_internet: true,
          file_urls: fileUrls.length > 0 ? fileUrls : undefined,
          prompt: `You are a super fun and friendly AI tutor for young Malaysian primary school children (Tahun 1-3, ages 7-9). ${textbookNote}Search the web for the official KSSR curriculum content for this topic, then create a fun interactive lesson.

TOPIC: "${topic.name}" | SUBJECT: "${subject.name}" | LEVEL: ${topic.form_level}
${levelNote} Base your lesson on the official KPM KSSR syllabus and learning standards. Use Malaysian context (RM, local foods, animals, places, festivals).

Create a fun, story-based lesson with ALL these parts in the JSON response:

LESSON MARKDOWN (lesson_markdown):
🧒 Use VERY simple words a 7-9 year old can understand. Short sentences.
- Start with a FUN STORY starring a friendly character (e.g. "Adik Ali pergi ke kedai...").
- Use LOTS of emojis to make it visually fun.
- Use **bold** for key words.
- Ask 1-2 simple QUESTIONS with "(Cuba jawab! 🤔)".
- Include a "Game Time! 🎮" mini-challenge.
- Include a simple SONG or RHYME if helpful.
- Be warm and encouraging: "Hebat! ⭐" "Tabik spring! 👏".
Lesson structure (Markdown headings):
1. **📖 Cerita Kita (Our Story)** — A short fun story
2. **🔍 Apa Ini? (What is it?)** — Simple definition with emojis
3. **💡 Jom Belajar! (Let's Learn!)** — Main concepts, with 1 interactive question
4. **🍎 Contoh Seronok (Fun Example)** — A worked example using Malaysian daily life
5. **🎮 Game Time! (Mini Challenge)** — A tiny activity or game
6. **🎵 Tip Hebat (Pro Tip)** — A memory trick or mini song/rhyme

FLASHCARDS (flashcards): 5-6 cards. Each has "front" (simple question/term with emoji) and "back" (simple answer). Child-friendly language.

MIND MAP (mind_map): A visual mind map with "central_topic" (main topic) and 3-4 "branches". Each branch has "label" and "children" (2-3 sub-points as simple strings).

ACTIVITY (activity): An interactive activity. Choose ONE type and fill ALL item fields for that type:
- "matching": each item MUST have "left" (the term/question) AND "right" (the matching answer)
- "fill_blank": each item MUST have "sentence" (with ___ for the blank) AND "answer" (the correct word)
- "true_false": each item MUST have "statement" (a fun fact sentence) AND "is_true" (boolean true or false)
ALWAYS fill every field for every item. Never return empty objects. Use simple, fun content with emojis. 4-5 items.`,
          response_json_schema: {
            type: "object",
            properties: {
              lesson_markdown: { type: "string" },
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
              mind_map: {
                type: "object",
                properties: {
                  central_topic: { type: "string" },
                  branches: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        label: { type: "string" },
                        children: { type: "array", items: { type: "string" } },
                      },
                      required: ["label"],
                    },
                  },
                },
                required: ["central_topic", "branches"],
              },
              activity: {
                type: "object",
                properties: {
                  type: { type: "string", enum: ["matching", "fill_blank", "true_false"] },
                  title: { type: "string" },
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        left: { type: "string" },
                        right: { type: "string" },
                        sentence: { type: "string" },
                        answer: { type: "string" },
                        statement: { type: "string" },
                        is_true: { type: "boolean" },
                      },
                    },
                  },
                },
                required: ["type", "title", "items"],
              },
            },
            required: ["lesson_markdown", "flashcards", "mind_map", "activity"],
          },
        })
      : await base44.integrations.Core.InvokeLLM({
          model: "gemini_3_flash",
          add_context_from_internet: true,
          file_urls: fileUrls.length > 0 ? fileUrls : undefined,
          prompt: `You are an expert tutor for Malaysian school students. ${textbookNote}Search the web for the official Malaysian curriculum (KSSR/KSSM) content for this topic, then explain it. Explain the topic "${topic.name}" from the subject "${subject.name}" strictly following the Malaysian National Curriculum. ${levelNote}${topic.form_level ? ` Target level: ${topic.form_level}.` : ""}

Base your lesson content on the official Malaysian Ministry of Education (KPM) syllabus and learning standards for this subject and topic. Use Malaysian context, examples, and terminology where appropriate (e.g. RM for currency, local examples).

Structure your explanation:
1. **What is it?** - Simple definition
2. **Key Concepts** - Main points to understand (aligned to the curriculum learning standards)
3. **How it works** - Explanation with simple language
4. **Example** - One clear, worked example (use Malaysian context where relevant)
5. **Quick Tip** - A memory trick or study tip

Keep it engaging and encouraging. Use emojis sparingly to make it fun.`,
        });

    const session = await base44.entities.StudySession.create({
      student_id: user.id,
      subject_id: subjectId,
      topic_id: topicId,
      topic_name: topic.name,
      subject_name: subject.name,
      ai_explanation: isYoungLearner ? JSON.stringify(result) : result,
      duration_minutes: 0,
    });
    if (isYoungLearner) {
      const cleaned = {
        ...result,
        lesson_markdown: (result.lesson_markdown || "").replace(/\\n/g, "\n"),
        flashcards: (result.flashcards || []).map(c => ({
          front: (c.front || "").replace(/\\n/g, " "),
          back: (c.back || "").replace(/\\n/g, " "),
        })),
        mind_map: result.mind_map ? {
          ...result.mind_map,
          central_topic: (result.mind_map.central_topic || "").replace(/\\n/g, " "),
          branches: (result.mind_map.branches || []).map(b => ({
            ...b,
            label: (b.label || "").replace(/\\n/g, " "),
            children: (b.children || []).map(c => (c || "").replace(/\\n/g, " ")),
          })),
        } : null,
        activity: result.activity ? {
          ...result.activity,
          title: (result.activity.title || "").replace(/\\n/g, " "),
          items: (result.activity.items || []).map(it => {
            const cleaned = {};
            Object.keys(it || {}).forEach(k => {
              cleaned[k] = typeof it[k] === "string" ? it[k].replace(/\\n/g, " ") : it[k];
            });
            return cleaned;
          }),
        } : null,
      };
      setLessonData(cleaned);
      setExplanation(cleaned.lesson_markdown);
    } else {
      setExplanation(typeof result === "string" ? result.replace(/\\n/g, "\n") : result);
    }
    studyStartRef.current = Date.now();
    setSessionId(session.id);
    setGenerating(false);
  };

  const generateQuiz = async (numQuestions = 10) => {
    setGeneratingQuiz(true);
    await recordStudyTime();
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
          return `Search the web for the official KSSR curriculum content for this topic, then generate exactly ${numQuestions} multiple choice questions about "${topic.name}" for young Malaysian primary school children (Tahun 1-3, ages 7-9), strictly following KSSR. ${levelNote} Target level: ${topic.form_level}. Base questions on the official KPM syllabus for "${subject?.name || ""}".

🧒 QUIZ STYLE — FUN & AGE-APPROPRIATE:
- Use VERY simple words and short sentences.
- Make questions feel like a game or story (e.g. "Adik Ali ada 3 epal... 🍎🍎🍎").
- Use emojis in questions and explanations to make it fun.
- Use Malaysian context (RM, local foods, animals, toys, school).
- Only 4 simple answer options per question.
- Explanations should be encouraging and use simple words (e.g. "Betul! Hebat! ⭐").

Return ONLY valid JSON, no extra text.`;
        }

        return `Search the web for the official Malaysian curriculum (KSSR/KSSM) content for this topic, then generate exactly ${numQuestions} multiple choice questions about "${topic.name}" for Malaysian school students, strictly following the Malaysian National Curriculum. ${levelNote}${topic.form_level ? ` Target level: ${topic.form_level}.` : ""} Base questions on the official KPM syllabus learning standards for the subject "${subject?.name || ""}". Use Malaysian context where appropriate.

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
      difficulty: numQuestions >= 20 ? "hard" : "medium",
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

          {lessonData?.flashcards?.length > 0 && <Flashcards flashcards={lessonData.flashcards} />}
          {lessonData?.mind_map && <MindMap mindMap={lessonData.mind_map} />}
          {lessonData?.activity && <InteractiveActivity activity={lessonData.activity} />}

          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-5 border border-emerald-100">
            <h3 className="font-heading font-bold text-emerald-800 mb-2">Ready to test yourself? 🎯</h3>
            <p className="text-sm text-emerald-600 mb-4">
              Take a quiz to earn coins and XP! 10 coins per correct answer + 50 bonus for perfect score.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Button
                  onClick={() => generateQuiz(10)}
                  disabled={generatingQuiz}
                  className="bg-emerald-600 hover:bg-emerald-700 rounded-xl w-full"
                >
                  {generatingQuiz ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Quiz (10 Q)
                    </>
                  )}
                </Button>
                <p className="text-xs text-center text-emerald-700 font-medium mt-1.5">
                  🪙 Up to 150 coins · ⭐ 50 XP
                </p>
              </div>
              <div className="flex-1">
                <Button
                  onClick={() => generateQuiz(20)}
                  disabled={generatingQuiz}
                  className="bg-amber-600 hover:bg-amber-700 rounded-xl w-full"
                >
                  {generatingQuiz ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Trophy className="w-4 h-4 mr-2" />
                      Exam Mode (20 Q)
                    </>
                  )}
                </Button>
                <p className="text-xs text-center text-amber-700 font-medium mt-1.5">
                  🪙 Up to 250 coins · ⭐ 100 XP
                </p>
              </div>
            </div>
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