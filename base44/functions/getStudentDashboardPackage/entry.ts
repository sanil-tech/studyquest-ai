// base44/functions/getStudentDashboardPackage/entry.ts
// Phase 4A Student Dashboard Aggregator
// Single secure function that aggregates student profile, progress, wallet, KSSR skill profiles, and active recommendation.

import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const db = base44.asServiceRole || base44;

    const body = await req.json().catch(() => ({}));
    let studentId = body?.student_id;

    if (!studentId) {
      try {
        const me = await base44.auth.me();
        studentId = me?.id;
      } catch {
        /* session check */
      }
    }

    if (!studentId) {
      return Response.json(
        { success: false, error: "ID Pelajar diperlukan." },
        { status: 401 }
      );
    }

    // 1. Fetch Student Entities Parallelly
    const [
      studentUserRes,
      progressRes,
      walletRes,
      skillProfilesRes,
      recommendationsRes,
      quizAttemptsRes,
      studySessionsRes,
    ] = await Promise.all([
      db.entities.User.get(studentId).catch(() => null),
      db.entities.Progress.filter({ student_id: studentId }).catch(() => []),
      db.entities.Wallet.filter({ student_id: studentId }).catch(() => []),
      db.entities.StudentSkillProfile.filter(
        { student_id: studentId },
        "-last_evaluated_at",
        50
      ).catch(() => []),
      db.entities.LearningRecommendation.filter(
        { student_id: studentId, status: "active" },
        "-created_at",
        5
      ).catch(() => []),
      db.entities.QuizAttempt.filter(
        { student_id: studentId },
        "-completed_at",
        10
      ).catch(() => []),
      db.entities.StudySession.filter(
        { student_id: studentId },
        "-created_date",
        10
      ).catch(() => []),
    ]);

    // 2. Resolve or Initialize Progress & Wallet
    const progress = (progressRes && progressRes[0]) || {
      student_id: studentId,
      total_xp: 0,
      xp: 0,
      level: 1,
      streak_days: 0,
    };

    let wallet = (walletRes && walletRes[0]) || null;
    if (!wallet) {
      try {
        wallet = await db.entities.Wallet.create({
          student_id: studentId,
          balance: 0,
          coins: 0,
          total_earned: 0,
        });
      } catch {
        wallet = { balance: 0, coins: 0 };
      }
    }

    // 3. Resolve Active Recommendation or Fetch/Generate Fallback
    let activeRecommendation =
      recommendationsRes && recommendationsRes.length > 0
        ? recommendationsRes[0]
        : null;

    // Parse blocks JSON if exists
    if (activeRecommendation) {
      try {
        if (typeof activeRecommendation.suggested_blocks_json === "string") {
          activeRecommendation.suggested_blocks = JSON.parse(
            activeRecommendation.suggested_blocks_json
          );
        }
      } catch {
        activeRecommendation.suggested_blocks = [];
      }
    }

    // 4. Construct Clean Student User Object
    const userProfile = {
      id: studentId,
      nickname:
        studentUserRes?.nickname ||
        studentUserRes?.full_name ||
        "Penjelajah",
      full_name:
        studentUserRes?.full_name || studentUserRes?.nickname || "Penjelajah",
      username: studentUserRes?.username || "",
      selected_avatar: studentUserRes?.selected_avatar || "🦧",
      selected_creature: studentUserRes?.selected_creature || "otan",
      owned_avatar_items: studentUserRes?.owned_avatar_items || "[]",
      equipped_avatar_items: studentUserRes?.equipped_avatar_items || "{}",
      education_level:
        studentUserRes?.education_level ||
        studentUserRes?.school_year ||
        "Tahun 4",
      school_name: studentUserRes?.school_name || "",
      app_role: "student",
      subscription_tier: studentUserRes?.subscription_tier || "free",
    };

    // 5. Calculate KSSR / KSSM Summary Metrics
    const skillProfiles = skillProfilesRes || [];
    const totalSkills = skillProfiles.length;
    const masteredCount = skillProfiles.filter(
      (s: any) => s.mastery_level === "mastered" || (s.ewma_score || 0) >= 85
    ).length;
    const developingCount = skillProfiles.filter(
      (s: any) =>
        s.mastery_level === "developing" ||
        ((s.ewma_score || 0) >= 60 && (s.ewma_score || 0) < 85)
    ).length;
    const needsFoundationCount = skillProfiles.filter(
      (s: any) =>
        s.mastery_level === "needs_foundation" || (s.ewma_score || 0) < 60
    ).length;

    const averageEwma =
      totalSkills > 0
        ? Math.round(
            skillProfiles.reduce(
              (acc: number, s: any) => acc + (s.ewma_score || s.score || 0),
              0
            ) / totalSkills
          )
        : 0;

    return Response.json({
      success: true,
      user: userProfile,
      progress,
      wallet,
      skillProfiles,
      activeRecommendation,
      quizAttempts: quizAttemptsRes || [],
      studySessions: studySessionsRes || [],
      kssrSummary: {
        total_skills: totalSkills,
        mastered_count: masteredCount,
        developing_count: developingCount,
        needs_foundation_count: needsFoundationCount,
        average_ewma: averageEwma,
      },
    });
  } catch (error: any) {
    console.error("Error in getStudentDashboardPackage:", error);
    return Response.json(
      {
        success: false,
        error: error?.message || "Gagal memuat pakej dashboard pelajar.",
      },
      { status: 500 }
    );
  }
}
