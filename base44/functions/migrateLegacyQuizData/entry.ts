// base44/functions/migrateLegacyQuizData/entry.ts
// Migration engine: copies data from legacy Quiz entity to new modular entities.
// Supports dry_run mode for auditing before actual migration.
// Admin-only. Does NOT delete or modify legacy Quiz records.

import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import {
  safeParseJson,
  parseLegacyNotes,
  mapLegacyQuestion,
  type LegacyQuiz,
} from "../../shared/lessonMapper.ts";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ success: false, error: "Sesi tidak sah." }, { status: 401 });
    }

    const role = user.app_role || user.role;
    if (role !== "admin") {
      return Response.json({ success: false, error: "Hanya pentadbir dibenarkan." }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const dryRun = body.dry_run === true;
    const batchSize = body.batch_size || 10;

    // 1. Fetch all legacy Quiz records
    const allQuizzes: LegacyQuiz[] = await base44.asServiceRole.entities.Quiz.filter({});

    if (!allQuizzes || allQuizzes.length === 0) {
      return Response.json({
        success: true,
        message: "Tiada data lama untuk dimigrasi.",
        dry_run: dryRun,
        summary: { total_quizzes: 0 },
      });
    }

    // 2. Dry run — just report what would be migrated
    if (dryRun) {
      const audit = allQuizzes.map((q) => {
        const notes = parseLegacyNotes(q.notes_content);
        const questions = safeParseJson(q.questions_json, []);
        const feedback = safeParseJson(q.feedback_library_json, []);
        const mistakes = safeParseJson(q.common_mistakes_json, []);
        const explanations = safeParseJson(q.ai_explanations_json, []);
        const subtopics = safeParseJson(q.subtopics_json, []);
        const mindmap = safeParseJson(q.mindmap_json, []);

        return {
          quiz_id: q.id,
          topic_name: q.topic_name,
          has_video: !!(q.video_url),
          has_notes: !!(notes.text),
          has_notes_image: !!(notes.image),
          has_mindmap: mindmap.length > 0,
          has_infographic: !!(q.infographic_url),
          question_count: questions.length,
          feedback_count: feedback.length,
          mistake_count: mistakes.length,
          explanation_count: explanations.length,
          subtopic_count: subtopics.length,
          has_voice_script: !!(q.voice_script),
          has_voice_audio: !!(q.voice_audio_url),
        };
      });

      const totals = audit.reduce(
        (acc, a) => ({
          lessons: acc.lessons + 1,
          notes: acc.notes + (a.has_notes ? 1 : 0),
          mindmaps: acc.mindmaps + (a.has_mindmap ? 1 : 0),
          flashcards: acc.flashcards,
          questions: acc.questions + a.question_count,
          feedback: acc.feedback + a.feedback_count,
          mistakes: acc.mistakes + a.mistake_count,
          explanations: acc.explanations + a.explanation_count,
          subtopics: acc.subtopics + a.subtopic_count,
        }),
        { lessons: 0, notes: 0, mindmaps: 0, flashcards: 0, questions: 0, feedback: 0, mistakes: 0, explanations: 0, subtopics: 0 }
      );

      return Response.json({
        success: true,
        dry_run: true,
        summary: { total_quizzes: allQuizzes.length, estimated_new_records: totals },
        details: audit,
      });
    }

    // 3. Actual migration
    const results = {
      processed: 0,
      lessons_created: 0,
      lesson_notes_created: 0,
      mindmaps_created: 0,
      flashcards_created: 0,
      common_mistakes_created: 0,
      feedback_messages_created: 0,
      ai_explanations_created: 0,
      subtopics_created: 0,
      question_bank_created: 0,
      question_options_created: 0,
      errors: [] as string[],
      skipped: [] as string[],
    };

    // Check for already-migrated lessons (by topic_id) to avoid duplicates
    const existingLessons = await base44.asServiceRole.entities.Lesson.filter({});
    const migratedTopicIds = new Set(existingLessons.map((l: any) => l.topic_id));

    for (const quiz of allQuizzes) {
      try {
        // Skip if already migrated
        if (migratedTopicIds.has(quiz.id)) {
          results.skipped.push(`Already migrated: ${quiz.topic_name} (${quiz.id})`);
          continue;
        }

        results.processed++;

        // Create Lesson record
        const lesson = await base44.asServiceRole.entities.Lesson.create({
          topic_id: quiz.id,
          subject_name: quiz.subject_name || "",
          topic_name: quiz.topic_name || "",
          video_url: quiz.video_url || "",
          version: quiz.content_version || 1,
          content_status: quiz.lesson_content_status || "draft",
          generated_by: quiz.approved_by || "",
          source_textbook_version: "legacy_migration",
        });
        const lessonId = lesson.id;
        results.lessons_created++;

        // Create LessonNotes
        const notes = parseLegacyNotes(quiz.notes_content);
        if (notes.text || notes.image || quiz.voice_script || quiz.voice_audio_url) {
          await base44.asServiceRole.entities.LessonNotes.create({
            lesson_id: lessonId,
            notes_markdown: notes.text || "",
            notes_image_url: notes.image || "",
            voice_script: quiz.voice_script || "",
            voice_audio_url: quiz.voice_audio_url || "",
          });
          results.lesson_notes_created++;
        }

        // Create MindMap
        const mindmapBranches = safeParseJson(quiz.mindmap_json, []);
        if (mindmapBranches.length > 0 || quiz.infographic_url) {
          await base44.asServiceRole.entities.MindMap.create({
            lesson_id: lessonId,
            branches_json: quiz.mindmap_json || "[]",
            infographic_url: quiz.infographic_url || "",
          });
          results.mindmaps_created++;
        }

        // Create Subtopics
        const subtopics = safeParseJson(quiz.subtopics_json, []);
        if (subtopics.length > 0) {
          const subtopicRecords = subtopics.map((title: string, i: number) => ({
            topic_id: quiz.id,
            title: title,
            sort_order: i,
          }));
          await base44.asServiceRole.entities.Subtopic.bulkCreate(subtopicRecords);
          results.subtopics_created += subtopics.length;
        }

        // Create QuestionBank + QuestionOptions
        const questions = safeParseJson(quiz.questions_json, []);
        if (questions.length > 0) {
          const qbRecords = [];
          const optRecords = [];

          for (let i = 0; i < questions.length; i++) {
            const mapped = mapLegacyQuestion(questions[i], lessonId, quiz.id, i);
            qbRecords.push(mapped.questionBank);
            optRecords.push(...mapped.options);
          }

          await base44.asServiceRole.entities.QuestionBank.bulkCreate(qbRecords);
          results.question_bank_created += qbRecords.length;

          if (optRecords.length > 0) {
            await base44.asServiceRole.entities.QuestionOption.bulkCreate(optRecords);
            results.question_options_created += optRecords.length;
          }
        }

        // Create FeedbackMessages
        const feedback = safeParseJson(quiz.feedback_library_json, []);
        if (feedback.length > 0) {
          const fbRecords = feedback.map((f: any) => ({
            lesson_id: lessonId,
            feedback_type: f.type || "correct",
            message: f.message || "",
          }));
          await base44.asServiceRole.entities.FeedbackMessage.bulkCreate(fbRecords);
          results.feedback_messages_created += fbRecords.length;
        }

        // Create CommonMistakes
        const mistakes = safeParseJson(quiz.common_mistakes_json, []);
        if (mistakes.length > 0) {
          const cmRecords = mistakes.map((m: any) => ({
            lesson_id: lessonId,
            mistake: m.mistake || "",
            correction: m.correction || "",
            explanation: m.explanation || "",
          }));
          await base44.asServiceRole.entities.CommonMistake.bulkCreate(cmRecords);
          results.common_mistakes_created += cmRecords.length;
        }

        // Create AIExplanations
        const explanations = safeParseJson(quiz.ai_explanations_json, []);
        if (explanations.length > 0) {
          const expRecords = explanations.map((e: any) => ({
            lesson_id: lessonId,
            concept: e.concept || "",
            explanation: e.explanation || "",
          }));
          await base44.asServiceRole.entities.AIExplanation.bulkCreate(expRecords);
          results.ai_explanations_created += expRecords.length;
        }
      } catch (err: any) {
        results.errors.push(`${quiz.topic_name} (${quiz.id}): ${err.message}`);
      }
    }

    return Response.json({
      success: true,
      dry_run: false,
      message: `Migration selesai. ${results.processed} topik diproses.`,
      summary: results,
    });
  } catch (error: any) {
    console.error("migrateLegacyQuizData error:", error);
    return Response.json(
      { success: false, error: error.message || "Ralat migrasi." },
      { status: 500 }
    );
  }
});