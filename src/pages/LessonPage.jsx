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
import LessonProgress from "@/components/lesson/LessonProgress";
import InfoCard from "@/components/lesson/InfoCard";
import LessonContent from "@/components/lesson/LessonContent";
import LessonImage from "@/components/lesson/LessonImage";
import VoicePlayer from "@/components/lesson/VoicePlayer";

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
  const [lessonSteps, setLessonSteps] = useState({ lesson: false, flashcards: false, mindmap: false, activity: false });
  const studyStartRef = useRef(null);
  const sectionRefs = useRef({});

  // Mark a step as completed
  const markStep = (key) => setLessonSteps(prev => prev[key] ? prev : { ...prev, [key]: true });

  // Scroll to a section when clicking a progress step
  const handleStepClick = (key) => {
    const ref = sectionRefs.current[key];
    if (ref) ref.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  // Track when sections enter the viewport
  useEffect(() => {
    if (!explanation) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) markStep(entry.target.dataset.step);
        });
      },
      { threshold: 0.3 }
    );
    Object.values(sectionRefs.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [explanation]);

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
              image_prompts: (parsed.image_prompts || []).map(img => ({
                prompt: (img.prompt || "").replace(/\\n/g, " "),
                alt: (img.alt || "").replace(/\\n/g, " "),
                caption: (img.caption || "").replace(/\\n/g, " "),
              })),
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

    const isEnglishSubject = subject.name.toLowerCase().includes("english");
    const lessonLanguage = isEnglishSubject ? "English" : "Bahasa Melayu";

    // Provide Malay translations for section headings
    const sectionHeadings = isEnglishSubject ? {
      lessonTitle: "📚 Lesson Title",
      learningObjective: "🎯 Learning Objective",
      introduction: "🌟 Introduction",
      mainExplanation: "📖 Main Explanation",
      realLifeStory: "🎬 Real-Life Story or Situation",
      keyPointsSummary: "💡 Key Points Summary",
      funFact: "🧠 Fun Fact",
      quickRecap: "📝 Quick Recap",
      readyForQuiz: "🎓 Ready for Quiz?",
    } : {
      lessonTitle: "📚 Tajuk Pelajaran",
      learningObjective: "🎯 Objektif Pembelajaran",
      introduction: "🌟 Pengenalan",
      mainExplanation: "📖 Penjelasan Utama",
      realLifeStory: "🎬 Cerita atau Situasi Sebenar",
      keyPointsSummary: "💡 Ringkasan Perkara Utama",
      funFact: "🧠 Fakta Menarik",
      quickRecap: "📝 Ringkasan Pantas",
      readyForQuiz: "🎓 Sedia untuk Kuiz?",
    };

    const result = await base44.integrations.Core.InvokeLLM({
      model: "gemini_3_flash",
      add_context_from_internet: true,
      file_urls: fileUrls.length > 0 ? fileUrls : undefined,
      prompt: `You are an expert, friendly AI tutor for Malaysian school students. ${textbookNote}Search the web for the official Malaysian curriculum (KSSR/KSSM) content for this topic.

TOPIC: "${topic.name}" | SUBJECT: "${subject.name}" | LEVEL: ${topic.form_level}
LANGUAGE: Write the ENTIRE lesson in ${lessonLanguage} ${isEnglishSubject ? "(English subject - use English only)" : "(use Bahasa Melayu for ALL content including headings, titles, and section names - NO English mixed in)"}.
${levelNote} ${isYoungLearner ? "Use VERY simple words for ages 7-9. Short sentences. Lots of emojis." : "Use clear, age-appropriate language."}

CRITICAL: If the lesson is in Bahasa Melayu, ALL headings, titles, section names, and content MUST be in Bahasa Melayu. Do NOT use any English words or headings.

Create an ENGAGING, VISUALLY-APPEALING lesson that feels like a teacher telling an interesting story, NOT a dry textbook.

STRUCTURE (use Markdown headings ## with these EXACT headings):

## ${sectionHeadings.lessonTitle}
Clear, engaging title for this topic.

## ${sectionHeadings.learningObjective}
1-2 sentences: "By the end of this lesson, you will be able to..." (translate to ${lessonLanguage})

## ${sectionHeadings.introduction}
Hook the student with an interesting question, fact, or scenario.

## ${sectionHeadings.mainExplanation}
Break into short sections with subheadings (###). Each section:
- 2-4 sentences MAX per paragraph
- Use bullet points where suitable
- **Bold** important keywords
- Include Malaysian context (school, family, shopping, football, food like nasi lemak, animals, places, festivals, RM currency)

## ${sectionHeadings.realLifeStory}
A relatable Malaysian story that illustrates the concept (e.g., "Ali went to the kedai...", "Siti's family visited...", "During a football match at school...").

## ${sectionHeadings.keyPointsSummary}
3-5 bullet points summarizing the most important takeaways.

## ${sectionHeadings.funFact}
An interesting, surprising fact related to the topic.

## ${sectionHeadings.quickRecap}
Brief summary in 2-3 sentences.

## ${sectionHeadings.readyForQuiz}
Motivational message encouraging the student to test their knowledge.

INFO CARDS - Insert these throughout using EXACT markers (keep markers in English but content in ${lessonLanguage}):
- [REMEMBER] important fact or warning [/REMEMBER]
- [EXAMPLE] worked example with Malaysian context [/EXAMPLE]
- [MISTAKE] common mistake students make [/MISTAKE]
- [TIP] study tip or memory trick [/TIP]
- [FACT] interesting did-you-know fact [/FACT]
- [STORY] real-life Malaysian story or situation [/STORY]

IMAGE PROMPTS - Add 2-3 image descriptions using: [IMAGE: describe a colourful, child-friendly educational illustration]
Example: [IMAGE: A cheerful Malaysian classroom with students learning at desks, teacher at whiteboard, bright colours]

WRITING STYLE:
- Simple, age-appropriate language
- Short paragraphs (2-4 sentences)
- NO large blocks of text
- Bullet points where suitable
- **Bold** for keywords
- Emojis sparingly but effectively (📚✨🎯💡🌟)
- Warm, encouraging tone: "Great job!", "You've got this!", "Hebat!"

FLASHCARDS (flashcards): 5-6 cards with "front" (question/term + emoji) and "back" (answer) - ALL in ${lessonLanguage}.

MIND MAP (mind_map): "central_topic" + 3-4 "branches", each with "label" and "children" (2-3 sub-points) - ALL in ${lessonLanguage}.

ACTIVITY (activity): Choose ONE type, fill ALL fields:
- "matching": items with "left" AND "right"
- "fill_blank": items with "sentence" (with ___) AND "answer"
- "true_false": items with "statement" AND "is_true" (boolean)
4-5 items, fun content with emojis - ALL in ${lessonLanguage}.

Return JSON with: lesson_markdown, flashcards, mind_map, activity, image_prompts (array of {prompt, alt, caption}).`,
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
          image_prompts: {
            type: "array",
            items: {
              type: "object",
              properties: {
                prompt: { type: "string" },
                alt: { type: "string" },
                caption: { type: "string" },
              },
              required: ["prompt", "alt"],
            },
          },
        },
        required: ["lesson_markdown", "flashcards", "mind_map", "activity"],
      },
    });

    const session = await base44.entities.StudySession.create({
      student_id: user.id,
      subject_id: subjectId,
      topic_id: topicId,
      topic_name: topic.name,
      subject_name: subject.name,
      ai_explanation: JSON.stringify(result),
      duration_minutes: 0,
    });

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
      image_prompts: (result.image_prompts || []).map(img => ({
        prompt: (img.prompt || "").replace(/\\n/g, " "),
        alt: (img.alt || "").replace(/\\n/g, " "),
        caption: (img.caption || "").replace(/\\n/g, " "),
      })),
    };
    setLessonData(cleaned);
    setExplanation(cleaned.lesson_markdown);
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
    const isEnglishSubject = subject.name.toLowerCase().includes("english");
    const quizLanguage = isEnglishSubject ? "English" : "Bahasa Melayu";
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

LANGUAGE: Write ALL questions, options, and explanations in ${quizLanguage} ${isEnglishSubject ? "(English subject)" : "(use Bahasa Melayu - NO English mixed in)"}.

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

LANGUAGE: Write ALL questions, options, and explanations in ${quizLanguage} ${isEnglishSubject ? "(English subject)" : "(use Bahasa Melayu - NO English mixed in)"}.

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
          <LessonProgress steps={lessonSteps} onStepClick={handleStepClick} />

          <div ref={(el) => (sectionRefs.current.lesson = el)} data-step="lesson">
            <div className="bg-white rounded-2xl p-6 border border-border/50">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading font-bold text-lg">📖 Lesson</h2>
                <VoicePlayer text={explanation} language={subject?.name?.toLowerCase().includes("english") ? "en" : "ms"} />
              </div>
              <LessonContent content={explanation} />
            </div>
          </div>

          {/* Lesson images */}
          {lessonData?.image_prompts?.map((img, idx) => (
            <div key={idx} ref={(el) => (sectionRefs.current[`image-${idx}`] = el)} data-step={`image-${idx}`}>
              <LessonImage
                prompt={img.prompt}
                alt={img.alt}
                caption={img.caption}
              />
            </div>
          ))}

          {lessonData?.flashcards?.length > 0 && (
            <div ref={(el) => (sectionRefs.current.flashcards = el)} data-step="flashcards">
              <Flashcards flashcards={lessonData.flashcards} />
            </div>
          )}
          {lessonData?.mind_map && (
            <div ref={(el) => (sectionRefs.current.mindmap = el)} data-step="mindmap">
              <MindMap mindMap={lessonData.mind_map} />
            </div>
          )}
          {lessonData?.activity && (
            <div ref={(el) => (sectionRefs.current.activity = el)} data-step="activity">
              <InteractiveActivity activity={lessonData.activity} />
            </div>
          )}

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