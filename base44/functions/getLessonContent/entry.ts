// base44/functions/getLessonContent/entry.ts
// Compatibility layer: fetches lesson content from new modular entities,
// falls back to legacy Quiz entity if no modular content exists.
// Returns a unified response shape compatible with LessonPage.jsx and QuizPage.jsx.

import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import {
  safeParseJson,
  parseLegacyNotes,
} from "../../shared/lessonMapper.ts";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: "Sesi tidak sah." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const topicId = body.topic_id;
    const quizId = body.quiz_id;

    if (!topicId && !quizId) {
      return Response.json({ error: "topic_id atau quiz_id diperlukan." }, { status: 400 });
    }

    // ================================================================
    // STRATEGY 1: Try new modular entities first (if topic_id provided)
    // ================================================================
    if (topicId) {
      const lessons = await base44.asServiceRole.entities.Lesson.filter({ topic_id: topicId });

      if (lessons && lessons.length > 0) {
        const lesson = lessons[0];
        const lessonId = lesson.id;

        // Fetch all modular content in parallel
        const [notesArr, mindmapArr, questions, feedback, mistakes, explanations, subtopics] = await Promise.all([
          base44.asServiceRole.entities.LessonNotes.filter({ lesson_id: lessonId }),
          base44.asServiceRole.entities.MindMap.filter({ lesson_id: lessonId }),
          base44.asServiceRole.entities.QuestionBank.filter({ lesson_id: lessonId }),
          base44.asServiceRole.entities.FeedbackMessage.filter({ lesson_id: lessonId }),
          base44.asServiceRole.entities.CommonMistake.filter({ lesson_id: lessonId }),
          base44.asServiceRole.entities.AIExplanation.filter({ lesson_id: lessonId }),
          base44.asServiceRole.entities.Subtopic.filter({ topic_id: topicId }),
        ]);

        // Fetch options for all questions
        const questionIds = questions.map((q: any) => q.question_id);
        let allOptions: any[] = [];
        if (questionIds.length > 0) {
          // Fetch options in batches to avoid query limits
          const optionBatches = [];
          for (let i = 0; i < questionIds.length; i += 50) {
            const batch = questionIds.slice(i, i + 50);
            for (const qid of batch) {
              optionBatches.push(base44.asServiceRole.entities.QuestionOption.filter({ question_id: qid }));
            }
          }
          const optionResults = await Promise.all(optionBatches);
          allOptions = optionResults.flat();
        }

        // Group options by question_id
        const optionsByQid: Record<string, any[]> = {};
        for (const opt of allOptions) {
          if (!optionsByQid[opt.question_id]) optionsByQid[opt.question_id] = [];
          optionsByQid[opt.question_id].push(opt);
        }

        // Build questions_json (backward-compatible format)
        const questionsJson = questions.map((q: any) => {
          const opts = (optionsByQid[q.question_id] || []).sort((a: any, b: any) => a.sort_order - b.sort_order);
          return {
            question: q.question,
            question_image_url: q.question_image_url || null,
            questionImageUrl: q.question_image_url || null,
            options: opts.map((o: any) => o.text),
            correct_answer: q.correct_answer,
            correctAnswer: q.correct_answer,
            explanation: q.explanation || "",
            difficulty: q.difficulty || "medium",
          };
        });

        const notes = notesArr[0] || null;
        const mindmap = mindmapArr[0] || null;

        // Sort subtopics by sort_order
        const sortedSubtopics = subtopics.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));

        return Response.json({
          source: "modular",
          lesson_id: lessonId,
          quiz_id: lessonId, // Use lesson ID as quiz_id for navigation compat
          topic_id: topicId,
          topic_name: lesson.topic_name || "",
          subject_name: lesson.subject_name || "",
          video_url: lesson.video_url || "",
          notes_content: notes ? {
            text: notes.notes_markdown || "",
            image: notes.notes_image_url || "",
          } : null,
          infographic_url: mindmap?.infographic_url || "",
          mindmap_json: mindmap?.branches_json || "[]",
          questions_json: JSON.stringify(questionsJson),
          feedback_library_json: JSON.stringify(feedback.map((f: any) => ({
            type: f.feedback_type,
            message: f.message,
          }))),
          common_mistakes_json: JSON.stringify(mistakes.map((m: any) => ({
            mistake: m.mistake,
            correction: m.correction,
            explanation: m.explanation,
          }))),
          ai_explanations_json: JSON.stringify(explanations.map((e: any) => ({
            concept: e.concept,
            explanation: e.explanation,
          }))),
          subtopics_json: JSON.stringify(sortedSubtopics.map((s: any) => s.title)),
          voice_script: notes?.voice_script || "",
          voice_audio_url: notes?.voice_audio_url || "",
          quiz_type: "practice",
          difficulty: "medium",
          lesson_content_status: lesson.content_status || "draft",
          content_version: lesson.version || 1,
        });
      }
    }

    // ================================================================
    // STRATEGY 2: Fall back to legacy Quiz entity
    // ================================================================
    let legacyQuiz = null;

    if (quizId) {
      // Direct lookup by quiz ID
      try {
        legacyQuiz = await base44.asServiceRole.entities.Quiz.get(quizId);
      } catch {
        legacyQuiz = null;
      }
    }

    if (!legacyQuiz && topicId) {
      // Find by topic_id matching quiz ID, or by topic name
      const allQuizzes = await base44.asServiceRole.entities.Quiz.filter({});
      legacyQuiz = allQuizzes.find((q: any) => q.id === topicId);

      if (!legacyQuiz) {
        // Try topic name match
        const topic = await base44.asServiceRole.entities.Topic.get(topicId).catch(() => null);
        if (topic) {
          const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
          const targetClean = normalize(topic.name || "");
          legacyQuiz = allQuizzes.find((q: any) => normalize(q.topic_name || "") === targetClean);
        }
      }
    }

    if (!legacyQuiz) {
      return Response.json({
        source: "none",
        lesson_id: null,
        quiz_id: quizId || topicId,
        topic_id: topicId,
        topic_name: "",
        subject_name: "",
        video_url: "",
        notes_content: null,
        infographic_url: "",
        mindmap_json: "[]",
        questions_json: "[]",
        feedback_library_json: "[]",
        common_mistakes_json: "[]",
        ai_explanations_json: "[]",
        subtopics_json: "[]",
        voice_script: "",
        voice_audio_url: "",
        quiz_type: "practice",
        difficulty: "medium",
        lesson_content_status: "draft",
        content_version: 1,
      });
    }

    // Return legacy quiz in unified format
    const notes = parseLegacyNotes(legacyQuiz.notes_content);

    return Response.json({
      source: "legacy",
      lesson_id: legacyQuiz.id,
      quiz_id: legacyQuiz.id,
      topic_id: topicId || legacyQuiz.id,
      topic_name: legacyQuiz.topic_name || "",
      subject_name: legacyQuiz.subject_name || "",
      video_url: legacyQuiz.video_url || "",
      notes_content: notes.text ? { text: notes.text, image: notes.image } : null,
      infographic_url: legacyQuiz.infographic_url || "",
      mindmap_json: legacyQuiz.mindmap_json || "[]",
      questions_json: legacyQuiz.questions_json || "[]",
      feedback_library_json: legacyQuiz.feedback_library_json || "[]",
      common_mistakes_json: legacyQuiz.common_mistakes_json || "[]",
      ai_explanations_json: legacyQuiz.ai_explanations_json || "[]",
      subtopics_json: legacyQuiz.subtopics_json || "[]",
      voice_script: legacyQuiz.voice_script || "",
      voice_audio_url: legacyQuiz.voice_audio_url || "",
      quiz_type: legacyQuiz.quiz_type || "practice",
      difficulty: legacyQuiz.difficulty || "medium",
      lesson_content_status: legacyQuiz.lesson_content_status || "draft",
      content_version: legacyQuiz.content_version || 1,
    });
  } catch (error: any) {
    console.error("getLessonContent error:", error);
    return Response.json(
      { error: error.message || "Ralat mendapatkan kandungan pelajaran." },
      { status: 500 }
    );
  }
});