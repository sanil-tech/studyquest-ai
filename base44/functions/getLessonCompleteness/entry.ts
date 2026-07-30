// base44/functions/getLessonCompleteness/entry.ts
// Returns completeness metrics for a LessonVersion — used by Admin Content Studio dashboard.

import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { lesson_version_id } = body;

    if (!lesson_version_id) {
      return Response.json({ error: "lesson_version_id diperlukan." }, { status: 400 });
    }

    const [lessonContent, flashcards, questions, activities, teacherGuides, aiRequests] = await Promise.all([
      base44.asServiceRole.entities.LessonContent.filter({ lesson_version_id }),
      base44.asServiceRole.entities.Flashcard.filter({ lesson_version_id }),
      base44.asServiceRole.entities.QuestionBank.filter({ lesson_version_id }),
      base44.asServiceRole.entities.LearningActivity.filter({ lesson_version_id }),
      base44.asServiceRole.entities.TeacherGuide.filter({ lesson_version_id }),
      base44.asServiceRole.entities.AIContentRequest.filter({ lesson_version_id }),
    ]);

    const hasNotes = lessonContent.some((c: any) => c.content_type === "notes");
    const flashcardCount = flashcards.length;
    const questionCount = questions.length;
    const activityCount = activities.length;
    const hasTeacherGuide = teacherGuides.length > 0;

    const checks = {
      notes: hasNotes,
      flashcards: flashcardCount >= 5,
      questions: questionCount >= 10,
      activities: activityCount >= 1,
      teacher_guide: hasTeacherGuide,
    };

    const completedCount = Object.values(checks).filter(Boolean).length;
    const completionPercentage = Math.round((completedCount / 5) * 100);

    const pendingReview = aiRequests.filter((r: any) => r.status === "completed" || r.status === "generating" || r.status === "requested");
    const approved = aiRequests.filter((r: any) => r.status === "approved");
    const rejected = aiRequests.filter((r: any) => r.status === "rejected");

    return Response.json({
      lesson_version_id,
      completion_percentage: completionPercentage,
      checks,
      counts: {
        notes: hasNotes,
        flashcards: flashcardCount,
        questions: questionCount,
        activities: activityCount,
        teacher_guide: hasTeacherGuide,
        lesson_content_total: lessonContent.length,
      },
      content_breakdown: {
        notes: lessonContent.filter((c: any) => c.content_type === "notes").length,
        video: lessonContent.filter((c: any) => c.content_type === "video").length,
        infographic: lessonContent.filter((c: any) => c.content_type === "infographic").length,
        mindmap: lessonContent.filter((c: any) => c.content_type === "mindmap").length,
        audio: lessonContent.filter((c: any) => c.content_type === "audio").length,
        worksheet: lessonContent.filter((c: any) => c.content_type === "worksheet").length,
      },
      ai_requests: {
        total: aiRequests.length,
        pending_review: pendingReview.length,
        approved: approved.length,
        rejected: rejected.length,
        list: aiRequests.map((r: any) => ({
          id: r.id,
          content_type: r.content_type,
          status: r.status,
          created_date: r.created_date,
        })),
      },
    });
  } catch (error: any) {
    console.error("getLessonCompleteness error:", error);
    return Response.json({ error: error.message || "Ralat sistem." }, { status: 500 });
  }
}