// base44/functions/analyzeAssessmentResult/entry.ts
// Phase 3A AI Adaptive Engine: Skill & Mastery Profiler
// Connects QuizAttempt -> QuestionBank -> KSSR/KSSM Learning Standards -> StudentSkillProfile using EWMA & Bloom Cognitive Weighting.

import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

// Bloom Taxonomy Cognitive Level Multipliers
const BLOOM_WEIGHTS: Record<string, number> = {
  remember: 1.0,
  understand: 1.1,
  apply: 1.25,
  analyze: 1.4,
  evaluate: 1.5,
  create: 1.6,
};

// EWMA Smoothing Factor (alpha = 0.35 gives 35% weight to newest assessment, 65% to historical profile)
const EWMA_ALPHA = 0.35;

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    const { attempt_id } = body;

    if (!attempt_id) {
      return Response.json(
        { success: false, error: "attempt_id diperlukan untuk analisis kemahiran." },
        { status: 400 }
      );
    }

    // 1. Fetch QuizAttempt
    const attempt = await base44.asServiceRole.entities.QuizAttempt.get(
      attempt_id
    ).catch(() => null);

    if (!attempt) {
      return Response.json(
        { success: false, error: "QuizAttempt tidak dijumpai." },
        { status: 404 }
      );
    }

    const studentId = attempt.student_id;
    const assessmentId = attempt.assessment_id || attempt.quiz_id;

    if (!studentId || !assessmentId) {
      return Response.json(
        { success: false, error: "Data attempt tidak lengkap (student_id / assessment_id)." },
        { status: 400 }
      );
    }

    // 2. Fetch Assessment for Subject details
    const assessment = await base44.asServiceRole.entities.Assessment.get(
      assessmentId
    ).catch(() => null);

    const subjectName = assessment?.subject_name || assessment?.title || "Umum";

    // 3. Fetch Questions from QuestionBank for this assessment
    const questions = await base44.asServiceRole.entities.QuestionBank.filter({
      assessment_id: assessmentId,
    }).catch(() => []);

    // Parse student's submitted answers
    let submittedAnswers: any[] = [];
    try {
      if (typeof attempt.answers_json === "string") {
        submittedAnswers = JSON.parse(attempt.answers_json);
      } else if (Array.isArray(attempt.answers_json)) {
        submittedAnswers = attempt.answers_json;
      }
    } catch {
      submittedAnswers = [];
    }

    // 4. Group questions and evaluate answers per KSSR/KSSM Learning Standard
    const standardGroups: Record<
      string,
      {
        standard_code: string;
        tp_code: string;
        sub_skill: string;
        questions: Array<{
          question_id: string;
          is_correct: boolean;
          cognitive_level: string;
          bloom_weight: number;
        }>;
      }
    > = {};

    for (const q of questions) {
      const qId = q.id || q.question_id;
      const standardCode =
        q.standard_pembelajaran ||
        q.curriculum_standard ||
        q.tp_code ||
        q.skill_tag ||
        "SK_UMUM";
      const tpCode = q.tp_code || standardCode;
      const subSkill = q.skill_tag || q.topic_id || "Umum";
      const cogLevel = (q.cognitive_level || "understand").toLowerCase();
      const bloomWeight = BLOOM_WEIGHTS[cogLevel] || 1.0;

      // Determine correctness
      const userAns = submittedAnswers.find(
        (a: any) => String(a.question_id) === String(qId)
      );
      const selectedOptionId =
        userAns?.selected_option_id || userAns?.selected_option || "";

      let isCorrect = false;
      if (q.correct_option_id && selectedOptionId === q.correct_option_id) {
        isCorrect = true;
      } else if (q.correct_answer && selectedOptionId === q.correct_answer) {
        isCorrect = true;
      }

      if (!standardGroups[standardCode]) {
        standardGroups[standardCode] = {
          standard_code: standardCode,
          tp_code: tpCode,
          sub_skill: subSkill,
          questions: [],
        };
      }

      standardGroups[standardCode].questions.push({
        question_id: qId,
        is_correct: isCorrect,
        cognitive_level: cogLevel,
        bloom_weight: bloomWeight,
      });
    }

    // If no specific question bank mapping exists (e.g. dynamic assessment), create default skill group
    if (Object.keys(standardGroups).length === 0) {
      const defaultCode = assessment?.title || "Penilaian_Asas";
      standardGroups[defaultCode] = {
        standard_code: defaultCode,
        tp_code: "TP_1",
        sub_skill: "Penilaian_Awal",
        questions: [
          {
            question_id: "all",
            is_correct: Boolean(attempt.passed),
            cognitive_level: "understand",
            bloom_weight: 1.0,
          },
        ],
      };
    }

    // 5. Calculate EWMA Mastery per Skill & Upsert StudentSkillProfile
    const updatedProfiles: any[] = [];
    const now = new Date().toISOString();

    for (const [standardCode, group] of Object.entries(standardGroups)) {
      const attemptedCount = group.questions.length;
      const correctCount = group.questions.filter((q) => q.is_correct).length;
      const rawScorePercentage =
        attemptedCount > 0 ? (correctCount / attemptedCount) * 100 : 0;

      // Compute Bloom weighted score
      let totalWeightedObtained = 0;
      let totalMaxWeight = 0;

      for (const q of group.questions) {
        totalMaxWeight += q.bloom_weight;
        if (q.is_correct) {
          totalWeightedObtained += q.bloom_weight;
        }
      }

      const bloomWeightedScore =
        totalMaxWeight > 0
          ? Math.round((totalWeightedObtained / totalMaxWeight) * 100)
          : rawScorePercentage;

      // Fetch existing skill profile for student
      const existingProfiles = await base44.asServiceRole.entities.StudentSkillProfile.filter({
        student_id: studentId,
        skill: standardCode,
      }).catch(() => []);

      let ewmaScore = bloomWeightedScore;
      let cumAttempted = attemptedCount;
      let cumCorrect = correctCount;
      let existingId: string | null = null;

      if (existingProfiles && existingProfiles.length > 0) {
        const prevProf = existingProfiles[0];
        existingId = prevProf.id;
        const prevEwma =
          prevProf.ewma_score ?? prevProf.score ?? bloomWeightedScore;

        // EWMA calculation: EWMA_t = alpha * Y_t + (1 - alpha) * EWMA_{t-1}
        ewmaScore = Math.round(
          EWMA_ALPHA * bloomWeightedScore + (1 - EWMA_ALPHA) * prevEwma
        );
        cumAttempted = (prevProf.questions_attempted || 0) + attemptedCount;
        cumCorrect = (prevProf.questions_correct || 0) + correctCount;
      }

      // Compute Mastery Level & TP Level
      let masteryLevel: "mastered" | "developing" | "needs_foundation" =
        "developing";
      let tpLevel = 3;

      if (ewmaScore >= 85) {
        masteryLevel = "mastered";
      } else if (ewmaScore < 60) {
        masteryLevel = "needs_foundation";
      }

      if (ewmaScore >= 90) tpLevel = 6;
      else if (ewmaScore >= 80) tpLevel = 5;
      else if (ewmaScore >= 70) tpLevel = 4;
      else if (ewmaScore >= 60) tpLevel = 3;
      else if (ewmaScore >= 40) tpLevel = 2;
      else tpLevel = 1;

      // Deterministic Pedagogical Recommendation
      let recommendation = "";
      if (masteryLevel === "mastered") {
        recommendation = `Penguasaan cemerlang (${ewmaScore}%) dalam ${standardCode}. Sedia untuk soalan aras tinggi (KBAT).`;
      } else if (masteryLevel === "developing") {
        recommendation = `Penguasaan baik (${ewmaScore}%). Disyorkan membuat latihan pengukuhan bagi meningkatkan kepantasan dan ketepatan.`;
      } else {
        recommendation = `Memerlukan bimbingan asas (${ewmaScore}%). Sila semak semula nota modul dan contoh penyelesaian.`;
      }

      const profilePayload = {
        student_id: studentId,
        subject: subjectName,
        skill: standardCode,
        sub_skill: group.sub_skill,
        standard_pembelajaran: group.standard_code,
        tp_code: group.tp_code,
        tp_level: tpLevel,
        ewma_score: ewmaScore,
        bloom_weighted_score: bloomWeightedScore,
        mastery_level: masteryLevel,
        score: Math.round(rawScorePercentage),
        questions_attempted: cumAttempted,
        questions_correct: cumCorrect,
        last_attempt_id: attempt_id,
        last_evaluated_at: now,
        recommendation: recommendation,
      };

      if (existingId) {
        await base44.asServiceRole.entities.StudentSkillProfile.update(
          existingId,
          profilePayload
        );
        updatedProfiles.push({ id: existingId, ...profilePayload });
      } else {
        const created = await base44.asServiceRole.entities.StudentSkillProfile.create(
          profilePayload
        );
        updatedProfiles.push(created);
      }
    }

    // 6. Summary Metrics
    const masteredCount = updatedProfiles.filter(
      (p) => p.mastery_level === "mastered"
    ).length;
    const developingCount = updatedProfiles.filter(
      (p) => p.mastery_level === "developing"
    ).length;
    const needsFoundationCount = updatedProfiles.filter(
      (p) => p.mastery_level === "needs_foundation"
    ).length;

    const avgEwma =
      updatedProfiles.length > 0
        ? Math.round(
            updatedProfiles.reduce((acc, p) => acc + (p.ewma_score || 0), 0) /
              updatedProfiles.length
          )
        : 0;

    return Response.json({
      success: true,
      attempt_id: attempt_id,
      student_id: studentId,
      skills_analyzed: updatedProfiles.length,
      overall_mastery_summary: {
        mastered_count: masteredCount,
        developing_count: developingCount,
        needs_foundation_count: needsFoundationCount,
        average_ewma: avgEwma,
      },
      updated_profiles: updatedProfiles,
    });
  } catch (error: any) {
    console.error("Fatal error in analyzeAssessmentResult:", error);
    return Response.json(
      {
        success: false,
        error: error?.message || "Ralat pelayan semasa menganalisis keputusan ujian.",
      },
      { status: 500 }
    );
  }
}
