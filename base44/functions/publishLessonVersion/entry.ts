// base44/functions/publishLessonVersion/entry.ts
// Validates lesson completeness and publishes a LessonVersion.
// Students can ONLY access published LessonVersions.

import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

// Minimum requirements for a complete lesson package
const MIN_FLASHCARDS = 5;
const MIN_QUESTIONS = 10;
const MIN_ACTIVITIES = 1;

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
    const { lesson_version_id } = body;

    if (!lesson_version_id) {
      return Response.json({ success: false, error: "lesson_version_id diperlukan." }, { status: 400 });
    }

    // 2. Fetch LessonVersion
    const lessonVersion = await base44.asServiceRole.entities.LessonVersion.get(lesson_version_id).catch(() => null);
    if (!lessonVersion) {
      return Response.json({ success: false, error: "LessonVersion tidak dijumpai." }, { status: 404 });
    }

    // 3. Count all content types in parallel
    const [lessonContent, flashcards, questions, activities, teacherGuides] = await Promise.all([
      base44.asServiceRole.entities.LessonContent.filter({ lesson_version_id }),
      base44.asServiceRole.entities.Flashcard.filter({ lesson_version_id }),
      base44.asServiceRole.entities.QuestionBank.filter({ lesson_version_id }),
      base44.asServiceRole.entities.LearningActivity.filter({ lesson_version_id }),
      base44.asServiceRole.entities.TeacherGuide.filter({ lesson_version_id }),
    ]);

    // Check for published notes specifically
    const hasNotes = lessonContent.some((c: any) => c.content_type === "notes");
    const flashcardCount = flashcards.length;
    const questionCount = questions.length;
    const activityCount = activities.length;
    const hasTeacherGuide = teacherGuides.length > 0;

    // 4. Validate completeness
    const missing: string[] = [];
    if (!hasNotes) missing.push("Nota Pelajaran");
    if (flashcardCount < MIN_FLASHCARDS) missing.push(`Flashcards (minimum ${MIN_FLASHCARDS}, kini ${flashcardCount})`);
    if (questionCount < MIN_QUESTIONS) missing.push(`Soalan (minimum ${MIN_QUESTIONS}, kini ${questionCount})`);
    if (activityCount < MIN_ACTIVITIES) missing.push(`Aktiviti (minimum ${MIN_ACTIVITIES}, kini ${activityCount})`);
    if (!hasTeacherGuide) missing.push("Panduan Guru");

    if (missing.length > 0) {
      return Response.json({
        success: false,
        error: "Pakej pelajaran tidak lengkap.",
        missing,
        counts: { notes: hasNotes, flashcards: flashcardCount, questions: questionCount, activities: activityCount, teacher_guide: hasTeacherGuide },
      }, { status: 400 });
    }

    // 5. Calculate completion percentage
    // Notes 20% + Flashcards 20% + Questions 20% + Activity 20% + TeacherGuide 20%
    const checks = {
      notes: hasNotes,
      flashcards: flashcardCount >= MIN_FLASHCARDS,
      questions: questionCount >= MIN_QUESTIONS,
      activities: activityCount >= MIN_ACTIVITIES,
      teacher_guide: hasTeacherGuide,
    };
    const completedCount = Object.values(checks).filter(Boolean).length;
    const completionPercentage = Math.round((completedCount / 5) * 100);

    // 6. Publish LessonVersion
    const publishedAt = new Date().toISOString();
    await base44.asServiceRole.entities.LessonVersion.update(lesson_version_id, {
      status: "published",
      review_status: "published",
      published_at: publishedAt,
      content_completion_percentage: completionPercentage,
      last_reviewed_by: user.id,
      last_reviewed_at: publishedAt,
    });

    // 7. Update parent Lesson
    await base44.asServiceRole.entities.Lesson.update(lessonVersion.lesson_id, {
      content_status: "published",
      published_version_id: lesson_version_id,
      published_version: lessonVersion.version_number,
    });

    return Response.json({
      success: true,
      message: "LessonVersion berjaya diterbitkan!",
      lesson_version_id,
      lesson_id: lessonVersion.lesson_id,
      completion_percentage: completionPercentage,
      published_at: publishedAt,
    });
  } catch (error: any) {
    console.error("publishLessonVersion error:", error);
    return Response.json({ success: false, error: error.message || "Ralat sistem." }, { status: 500 });
  }
}