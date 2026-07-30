// base44/shared/lessonMapper.ts
// Shared utilities for mapping between legacy Quiz entity and new modular entities.
// Used by: migrateLegacyQuizData, getLessonContent, getQuizQuestions

export function safeParseJson(str: any, fallback: any = []): any {
  if (!str) return fallback;
  if (typeof str === "object") return str;
  try {
    let clean = String(str).trim();
    if (clean.startsWith("```json")) {
      clean = clean.replace(/^```json/, "").replace(/```$/, "").trim();
    }
    return JSON.parse(clean);
  } catch {
    return fallback;
  }
}

export interface LegacyQuiz {
  id: string;
  topic_name?: string;
  subject_name?: string;
  video_url?: string;
  notes_content?: string;
  infographic_url?: string;
  mindmap_json?: string;
  questions_json?: string;
  feedback_library_json?: string;
  common_mistakes_json?: string;
  ai_explanations_json?: string;
  subtopics_json?: string;
  voice_script?: string;
  voice_audio_url?: string;
  lesson_content_status?: string;
  content_version?: number;
  last_generated_date?: string;
  approved_by?: string;
}

// Parse legacy notes_content into {text, image}
export function parseLegacyNotes(raw: any): { text: string; image: string } {
  if (!raw) return { text: "", image: "" };
  if (typeof raw === "object") {
    return {
      text: (raw as any).text || "",
      image: (raw as any).image || "",
    };
  }
  try {
    let cleanStr = String(raw).replace(/\\"/g, '"').replace(/\\\\/g, "\\");
    if (cleanStr.startsWith('"') && cleanStr.endsWith('"')) {
      cleanStr = cleanStr.substring(1, cleanStr.length - 1);
    }
    const parsed = JSON.parse(cleanStr);
    if (parsed && (parsed.text !== undefined || parsed.image !== undefined)) {
      return { text: parsed.text || "", image: parsed.image || "" };
    }
    return { text: String(raw), image: "" };
  } catch {
    return { text: String(raw), image: "" };
  }
}

// Map a legacy question object to QuestionBank format
export function mapLegacyQuestion(
  q: any,
  lessonId: string,
  topicId: string,
  index: number
): {
  questionBank: any;
  options: any[];
} {
  const questionId = `qb_${lessonId}_${index + 1}`;
  const correctAnswer = q.correct_answer || q.correctAnswer || "A";

  // Build options array
  let options: any[] = [];
  if (Array.isArray(q.options)) {
    const labels = ["A", "B", "C", "D", "E", "F"];
    options = q.options.map((opt: string, i: number) => ({
      question_id: questionId,
      label: labels[i] || String(i),
      text: opt || "",
      sort_order: i,
    }));
  }

  return {
    questionBank: {
      lesson_id: lessonId,
      topic_id: topicId,
      question_id: questionId,
      question: q.question || "",
      question_image_url: q.questionImageUrl || q.question_image_url || null,
      correct_answer: correctAnswer,
      explanation: q.explanation || "",
      difficulty: q.difficulty || "medium",
      quiz_type: "practice",
    },
    options,
  };
}

// Format a Lesson object from legacy Quiz data (for compatibility layer)
export function formatLegacyQuizAsLesson(quiz: LegacyQuiz, lessonId: string) {
  const notes = parseLegacyNotes(quiz.notes_content);
  return {
    lesson: {
      id: lessonId,
      topic_id: quiz.id, // Use quiz ID as topic_id reference
      topic_name: quiz.topic_name || "",
      subject_name: quiz.subject_name || "",
      video_url: quiz.video_url || "",
      version: quiz.content_version || 1,
      content_status: quiz.lesson_content_status || "draft",
      generated_by: quiz.approved_by || "",
      _isLegacy: true,
      _legacyQuizId: quiz.id,
    },
    notes: {
      lesson_id: lessonId,
      notes_markdown: notes.text,
      notes_image_url: notes.image,
      voice_script: quiz.voice_script || "",
      voice_audio_url: quiz.voice_audio_url || "",
    },
    mindmap: {
      lesson_id: lessonId,
      branches_json: quiz.mindmap_json || "[]",
      infographic_url: quiz.infographic_url || "",
    },
    questions: safeParseJson(quiz.questions_json, []).map((q: any, i: number) =>
      mapLegacyQuestion(q, lessonId, quiz.id, i).questionBank
    ),
    feedback: safeParseJson(quiz.feedback_library_json, []),
    commonMistakes: safeParseJson(quiz.common_mistakes_json, []),
    aiExplanations: safeParseJson(quiz.ai_explanations_json, []),
    subtopics: safeParseJson(quiz.subtopics_json, []),
  };
}