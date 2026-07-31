// base44/functions/generateLearningRecommendation/entry.ts
// Phase 3B AI Adaptive Recommendation Engine
// Converts StudentSkillProfile and QuizAttempt data into personalized learning recommendations using Base44 LLM.

import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    // 1. Resolve Student Identity
    let studentId = body.student_id;
    let authUser: any = null;

    try {
      authUser = await base44.auth.me();
    } catch {
      /* Session fallback */
    }

    if (!studentId && authUser) {
      studentId = authUser.id;
    }

    if (!studentId) {
      return Response.json(
        { success: false, error: "ID pelajar tidak disahkan." },
        { status: 401 }
      );
    }

    const targetSubject = body.subject || body.subject_id || "Umum";
    const targetStandard = body.learning_standard_id || body.skill || null;

    // 2. Fetch Student Profile and Mastery Data
    const [studentProfile, skillProfiles, recentAttempts] = await Promise.all([
      base44.asServiceRole.entities.User.get(studentId).catch(() => null),
      base44.asServiceRole.entities.StudentSkillProfile.filter(
        { student_id: studentId },
        "-last_evaluated_at",
        20
      ).catch(() => []),
      base44.asServiceRole.entities.QuizAttempt.filter(
        { student_id: studentId },
        "-completed_at",
        10
      ).catch(() => []),
    ]);

    const studentName = studentProfile?.nickname || studentProfile?.full_name || "Pelajar";
    const educationLevel = studentProfile?.education_level || "Tahun 4";

    // 3. Filter / Select Primary Skill for Recommendation
    let targetProfile = skillProfiles.find((p: any) => {
      if (targetStandard) {
        return p.skill === targetStandard || p.standard_pembelajaran === targetStandard;
      }
      if (targetSubject && targetSubject !== "Umum") {
        return p.subject === targetSubject;
      }
      return true;
    });

    // If no target profile matches, pick the one with lowest ewma_score (highest priority gap)
    if (!targetProfile && skillProfiles.length > 0) {
      const sorted = [...skillProfiles].sort(
        (a: any, b: any) => (a.ewma_score ?? 100) - (b.ewma_score ?? 100)
      );
      targetProfile = sorted[0];
    }

    const currentEwma = targetProfile?.ewma_score ?? targetProfile?.score ?? 60;
    const currentTp = targetProfile?.tp_level ?? 3;
    const skillStandard = targetProfile?.standard_pembelajaran || targetProfile?.skill || targetStandard || "SK_1.1";
    const subjectName = targetProfile?.subject || targetSubject;

    // 4. Determine Recommendation Type Tier
    let recommendationType: "remediation" | "reinforcement" | "challenge" = "reinforcement";
    if (currentEwma < 70) {
      recommendationType = "remediation";
    } else if (currentEwma >= 85) {
      recommendationType = "challenge";
    }

    // 5. Gather Attempt Weakness Signals (without leaking answer keys)
    const weaknessSummary: string[] = [];
    if (recentAttempts.length > 0) {
      recentAttempts.slice(0, 3).forEach((att: any, idx: number) => {
        if (att.score_percentage < 70) {
          weaknessSummary.push(
            `Percubaan ${idx + 1}: Skor ${att.score_percentage}%, ${att.correct_count}/${att.total_questions} betul.`
          );
        }
      });
    }

    // 6. Build Structured AI Prompt for Base44 LLM
    const promptText = `Anda adalah Tutor Maya StudyQuest AI, rakan pembelajaran mesra bagi pelajar sekolah di Malaysia mengikut kurikulum KSSR/KSSM.
Tugas anda adalah menganalisis profil penguasaan kemahiran pelajar dan menjana panduan pembelajaran terperinci, positif dan bersesuaian dengan tahap mereka.

PROFIL PELAJAR:
- Nama: ${studentName}
- Tahap Persekolahan: ${educationLevel}
- Subjek: ${subjectName}
- Standard Pembelajaran / Kemahiran: ${skillStandard}
- Skor EWMA Kemahiran: ${currentEwma}%
- Tahap Penguasaan (TP): TP ${currentTp}
- Kategori Cadangan: ${recommendationType.toUpperCase()} (remediation = asas/pemulihan, reinforcement = pengukuhan, challenge = cabaran KBAT)

ISYARAT PRESTASI TERKINI:
${weaknessSummary.length > 0 ? weaknessSummary.join("\n") : "Tiada ralat khusus dikesan. Pelajar bersedia untuk langkah seterusnya."}

PANDUAN PENJANAN (PENTING):
1. Bahasa Melayu Malaysia yang mesra, menyokong, dan mudah difahami oleh pelajar primary/secondary.
2. JANGAN sebut perkataan "AI", "sistem", "model", atau "data". Bertindak sebagai Tutor Maya StudyQuest.
3. Pastikan tindakan bersesuaian dengan kurikulum KSSR/KSSM DSKP.

Jana jawapan dalam format JSON rasmi mengikut skema ini:
- diagnosis: Ringkasan jurang pemahaman atau kekuatan pelajar (2-3 ayat)
- mastery_gap: Penjelasan khusus aspek kemahiran yang perlu diperbaiki atau ditingkatkan
- recommended_action: Cadangan langkah seterusnya (cth: "Ulang kaji Modul Tambahan", "Cabar Diri Soalan KBAT")
- recommended_lesson_blocks: Senarai objek [{ type: "TEXT_MARKDOWN" | "INTERACTIVE_GAME" | "FLASHCARD_DECK" | "MIND_MAP", reason: "Sebab cadangan" }]
- practice_plan: Pelan latihan langkah demi langkah (3 langkah ringkas)
- motivation_message: Mesej dorongan dan semangat yang ceria untuk pelajar`;

    // 7. Invoke Base44 Core LLM
    const llmResult = await base44.integrations.Core.InvokeLLM({
      prompt: promptText,
      response_json_schema: {
        type: "object",
        properties: {
          diagnosis: { type: "string" },
          mastery_gap: { type: "string" },
          recommended_action: { type: "string" },
          recommended_lesson_blocks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: { type: "string" },
                reason: { type: "string" },
              },
            },
          },
          practice_plan: { type: "string" },
          motivation_message: { type: "string" },
        },
      },
    });

    // 8. Create or Update LearningRecommendation Record
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days expiration

    const recPayload = {
      student_id: studentId,
      subject: subjectName,
      learning_standard_id: skillStandard,
      recommendation_type: recommendationType,
      mastery_before: currentEwma,
      tp_before: currentTp,
      diagnosis: llmResult.diagnosis || `Diagnosis kemahiran ${skillStandard}`,
      recommended_action: llmResult.recommended_action || "Lakukan latihan pengukuhan",
      suggested_blocks_json: JSON.stringify(llmResult.recommended_lesson_blocks || []),
      practice_plan: llmResult.practice_plan || "Langkah 1: Semak nota\nLangkah 2: Buat kuiz",
      motivation_message: llmResult.motivation_message || "Syabas! Teruskan usaha anda!",
      status: "active",
      created_at: now.toISOString(),
      expires_at: expiresAt,
    };

    // Check existing active recommendation for same student & standard
    const existingRecs = await base44.asServiceRole.entities.LearningRecommendation.filter({
      student_id: studentId,
      learning_standard_id: skillStandard,
      status: "active",
    }).catch(() => []);

    let savedRecommendation;
    if (existingRecs && existingRecs.length > 0) {
      savedRecommendation = await base44.asServiceRole.entities.LearningRecommendation.update(
        existingRecs[0].id,
        recPayload
      );
    } else {
      savedRecommendation = await base44.asServiceRole.entities.LearningRecommendation.create(
        recPayload
      );
    }

    // 9. Return Sanitized Recommendation Payload
    return Response.json({
      success: true,
      recommendation: {
        id: savedRecommendation.id,
        student_id: studentId,
        subject: subjectName,
        learning_standard_id: skillStandard,
        recommendation_type: recommendationType,
        mastery_score: currentEwma,
        tp_level: currentTp,
        diagnosis: llmResult.diagnosis,
        mastery_gap: llmResult.mastery_gap,
        recommended_action: llmResult.recommended_action,
        suggested_blocks: llmResult.recommended_lesson_blocks,
        practice_plan: llmResult.practice_plan,
        motivation_message: llmResult.motivation_message,
        expires_at: expiresAt,
      },
    });
  } catch (error: any) {
    console.error("Fatal error in generateLearningRecommendation:", error);
    return Response.json(
      {
        success: false,
        error: error?.message || "Ralat pelayan semasa menjana cadangan pembelajaran.",
      },
      { status: 500 }
    );
  }
}
