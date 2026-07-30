// base44/functions/approveAIContent/entry.ts
// Admin approves AI-generated content — saves into the correct entity with created_source: ai_generated, status: draft.
// AI content NEVER auto-publishes. Admin must separately publish the LessonVersion.

import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);

    // 1. Authenticate — admin only
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ success: false, error: "Sesi tidak sah." }, { status: 401 });
    }

    const role = String(user.app_role || user.role || "").toLowerCase();
    if (role !== "admin" && role !== "teacher" && user.is_admin !== true) {
      return Response.json({ success: false, error: "Hanya pentadbir/guru dibenarkan." }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { request_id, edited_content } = body;

    if (!request_id) {
      return Response.json({ success: false, error: "request_id diperlukan." }, { status: 400 });
    }

    // 2. Fetch AIContentRequest
    const aiRequest = await base44.asServiceRole.entities.AIContentRequest.get(request_id).catch(() => null);
    if (!aiRequest) {
      return Response.json({ success: false, error: "Permintaan AI tidak dijumpai." }, { status: 404 });
    }

    if (aiRequest.status !== "completed") {
      return Response.json({ success: false, error: "Hanya permintaan berstatus 'completed' boleh diluluskan." }, { status: 400 });
    }

    // Use edited content if provided, otherwise use generated content
    const content = edited_content
      ? (typeof edited_content === "string" ? JSON.parse(edited_content) : edited_content)
      : JSON.parse(aiRequest.generated_content || "{}");

    const { lesson_version_id, lesson_id, content_type } = aiRequest;

    // 3. Save into correct entity based on content_type
    let createdRecords: any = null;

    const commonFields = {
      created_source: "ai_generated" as const,
      approved_by: user.id,
      approved_at: new Date().toISOString(),
    };

    if (content_type === "lesson_notes") {
      createdRecords = await base44.asServiceRole.entities.LessonContent.create({
        lesson_version_id,
        content_type: "notes",
        title: "Nota Pelajaran (AI)",
        content_markdown: content.notes_markdown || "",
        voice_script: content.voice_script || "",
        sort_order: 0,
        created_by: user.id,
        status: "draft",
        ...commonFields,
      });
    } else if (content_type === "video_script") {
      createdRecords = await base44.asServiceRole.entities.LessonContent.create({
        lesson_version_id,
        content_type: "video",
        title: "Skrip Video (AI)",
        content_markdown: content.video_script || "",
        media_url: content.video_url || "",
        sort_order: 1,
        created_by: user.id,
        status: "draft",
        ...commonFields,
      });
    } else if (content_type === "worksheet") {
      createdRecords = await base44.asServiceRole.entities.LessonContent.create({
        lesson_version_id,
        content_type: "worksheet",
        title: "Lembaran Kerja (AI)",
        content_markdown: content.content_markdown || "",
        sort_order: 2,
        created_by: user.id,
        status: "draft",
        ...commonFields,
      });
    } else if (content_type === "mindmap") {
      createdRecords = await base44.asServiceRole.entities.LessonContent.create({
        lesson_version_id,
        content_type: "mindmap",
        title: "Peta Minda (AI)",
        content_markdown: JSON.stringify(content.branches || []),
        sort_order: 3,
        created_by: user.id,
        status: "draft",
        ...commonFields,
      });
    } else if (content_type === "flashcards") {
      const cards = content.flashcards || [];
      if (cards.length === 0) {
        return Response.json({ success: false, error: "Tiada flashcard dijana." }, { status: 400 });
      }
      createdRecords = await base44.asServiceRole.entities.Flashcard.bulkCreate(
        cards.map((fc: any, i: number) => ({
          lesson_id,
          lesson_version_id,
          front: fc.front || "",
          back: fc.back || "",
          front_text: fc.front || "",
          back_text: fc.back || "",
          explanation: fc.explanation || "",
          sort_order: i,
          ...commonFields,
        }))
      );
    } else if (content_type === "questions") {
      const questions = content.questions || [];
      if (questions.length === 0) {
        return Response.json({ success: false, error: "Tiada soalan dijana." }, { status: 400 });
      }
      createdRecords = await base44.asServiceRole.entities.QuestionBank.bulkCreate(
        questions.map((q: any, i: number) => ({
          lesson_id,
          lesson_version_id,
          topic_id: null,
          question_id: `ai_${request_id}_${i + 1}`,
          question: q.question || "",
          correct_answer: q.correct_answer || "",
          explanation: q.explanation || "",
          difficulty: q.difficulty || "medium",
          quiz_type: "practice",
          question_type: "mcq",
          options_json: JSON.stringify(q.options || []),
          hint: q.hint || "",
          cognitive_level: q.cognitive_level || "understand",
          created_by: user.id,
          status: "draft",
          ...commonFields,
        }))
      );
    } else if (content_type === "activity") {
      createdRecords = await base44.asServiceRole.entities.LearningActivity.create({
        lesson_id,
        lesson_version_id,
        activity_type: content.activity_type || "matching",
        title: content.title || "Aktiviti (AI)",
        instructions: content.instructions || "",
        activity_data_json: content.activity_data || "{}",
        created_by: user.id,
        status: "draft",
        ...commonFields,
      });
    } else if (content_type === "teacher_guide") {
      createdRecords = await base44.asServiceRole.entities.TeacherGuide.create({
        lesson_id,
        lesson_version_id,
        learning_objective: content.learning_objective || "",
        teaching_strategy: content.teaching_strategy || "",
        success_criteria: content.success_criteria || "",
        suggested_activity: content.suggested_activity || "",
        assessment_notes: content.assessment_notes || "",
        ...commonFields,
      });
    } else if (content_type === "explanation") {
      const explanations = content.explanations || [];
      if (explanations.length === 0) {
        return Response.json({ success: false, error: "Tiada penjelasan dijana." }, { status: 400 });
      }
      createdRecords = await base44.asServiceRole.entities.AIExplanation.bulkCreate(
        explanations.map((e: any) => ({
          lesson_id,
          lesson_version_id,
          concept: e.concept || "",
          explanation: e.explanation || "",
          example: e.example || "",
          analogy: e.analogy || "",
          language: "ms",
          ...commonFields,
        }))
      );
    } else if (content_type === "common_mistakes") {
      const mistakes = content.mistakes || [];
      if (mistakes.length === 0) {
        return Response.json({ success: false, error: "Tiada kesilapan dijana." }, { status: 400 });
      }
      createdRecords = await base44.asServiceRole.entities.CommonMistake.bulkCreate(
        mistakes.map((m: any) => ({
          lesson_id,
          lesson_version_id,
          mistake: m.mistake || "",
          correction: m.correction || "",
          explanation: m.explanation || "",
          recommended_activity: m.recommended_activity || "",
          ...commonFields,
        }))
      );
    } else {
      return Response.json({ success: false, error: `Jenis kandungan tidak disokong: ${content_type}` }, { status: 400 });
    }

    // 4. Update AIContentRequest status to approved
    await base44.asServiceRole.entities.AIContentRequest.update(request_id, {
      status: "approved",
      reviewed_by: user.id,
      approved_at: new Date().toISOString(),
    });

    return Response.json({
      success: true,
      message: "Kandungan AI diluluskan dan disimpan sebagai draft.",
      content_type,
      created_records: createdRecords,
    });
  } catch (error: any) {
    console.error("approveAIContent error:", error);
    return Response.json({ success: false, error: error.message || "Ralat sistem." }, { status: 500 });
  }
}