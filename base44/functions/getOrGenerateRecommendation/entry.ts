// base44/functions/getOrGenerateRecommendation/entry.ts
// Phase 3C AI Intelligence Layer with Strict Token Optimization
// Recommendation Gatekeeper: Cache check -> Entitlement & Quota check -> Rule Engine Fallback -> Token-Optimized Base44 InvokeLLM

import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

const FREE_TIER_MONTHLY_LLM_QUOTA = 5; // Free tier max 5 LLM-generated recommendations per 30 days
const CACHE_TTL_DAYS = 7; // Cache validity period in days

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    // 1. Authenticate / Resolve Student Identity
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
    const forceRefresh = Boolean(body.force_refresh);

    // 2. Fetch Latest Student Skill Profile
    const skillProfiles = await base44.asServiceRole.entities.StudentSkillProfile.filter(
      { student_id: studentId },
      "-last_evaluated_at",
      20
    ).catch(() => []);

    let targetProfile = skillProfiles.find((p: any) => {
      if (targetStandard) {
        return p.skill === targetStandard || p.standard_pembelajaran === targetStandard;
      }
      if (targetSubject && targetSubject !== "Umum") {
        return p.subject === targetSubject;
      }
      return true;
    });

    if (!targetProfile && skillProfiles.length > 0) {
      const sorted = [...skillProfiles].sort(
        (a: any, b: any) => (a.ewma_score ?? 100) - (b.ewma_score ?? 100)
      );
      targetProfile = sorted[0];
    }

    const currentEwma = targetProfile?.ewma_score ?? targetProfile?.score ?? 60;
    const currentTp = targetProfile?.tp_level ?? 3;
    const skillStandard = targetProfile?.standard_pembelajaran || targetProfile?.skill || targetStandard || "SK_UMUM";
    const subjectName = targetProfile?.subject || targetSubject;

    // Determine adaptive tier
    let recommendationType: "remediation" | "reinforcement" | "challenge" = "reinforcement";
    if (currentEwma < 70) {
      recommendationType = "remediation";
    } else if (currentEwma >= 85) {
      recommendationType = "challenge";
    }

    // 3. STEP 1: CACHE CHECK (LearningRecommendation reuse)
    if (!forceRefresh) {
      const cachedRecs = await base44.asServiceRole.entities.LearningRecommendation.filter(
        {
          student_id: studentId,
          learning_standard_id: skillStandard,
          status: "active",
        },
        "-created_at",
        1
      ).catch(() => []);

      if (cachedRecs && cachedRecs.length > 0) {
        const cached = cachedRecs[0];
        const createdAt = new Date(cached.created_at || Date.now()).getTime();
        const now = Date.now();
        const ageInDays = (now - createdAt) / (1000 * 60 * 60 * 24);

        if (ageInDays <= CACHE_TTL_DAYS) {
          let parsedBlocks = [];
          try {
            parsedBlocks = cached.suggested_blocks_json
              ? JSON.parse(cached.suggested_blocks_json)
              : [];
          } catch {
            parsedBlocks = [];
          }

          return Response.json({
            success: true,
            source: "cache",
            tokens_consumed: 0,
            recommendation: {
              id: cached.id,
              student_id: studentId,
              subject: cached.subject || subjectName,
              learning_standard_id: cached.learning_standard_id || skillStandard,
              recommendation_type: cached.recommendation_type || recommendationType,
              mastery_score: cached.mastery_before ?? currentEwma,
              tp_level: cached.tp_before ?? currentTp,
              diagnosis: cached.diagnosis,
              recommended_action: cached.recommended_action,
              suggested_blocks: parsedBlocks,
              practice_plan: cached.practice_plan,
              motivation_message: cached.motivation_message,
              expires_at: cached.expires_at,
            },
          });
        }
      }
    }

    // 4. STEP 2: ENTITLEMENT & QUOTA CHECK
    const studentUser = await base44.asServiceRole.entities.User.get(studentId).catch(() => null);
    const subscriptionTier = studentUser?.subscription_tier || "free";
    const isPremium = subscriptionTier === "premium";

    let allowLlmCall = isPremium;

    if (!isPremium) {
      // Calculate LLM usage in last 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const usageLogs = await base44.asServiceRole.entities.AIUsageLog.filter({
        user_id: studentId,
        purpose: "recommendation",
      }).catch(() => []);

      const recentLlmCalls = usageLogs.filter((log: any) => log.created_at >= thirtyDaysAgo);
      allowLlmCall = recentLlmCalls.length < FREE_TIER_MONTHLY_LLM_QUOTA;
    }

    // 5. STEP 3: RULE ENGINE FALLBACK (If not allowed LLM call)
    if (!allowLlmCall) {
      const fallbackPayload = generateDeterministicRecommendation(
        subjectName,
        skillStandard,
        currentEwma,
        currentTp,
        recommendationType
      );

      const savedFallback = await saveRecommendationRecord(
        base44,
        studentId,
        subjectName,
        skillStandard,
        recommendationType,
        currentEwma,
        currentTp,
        fallbackPayload,
        "rule_engine"
      );

      return Response.json({
        success: true,
        source: "rule_engine",
        tokens_consumed: 0,
        quota_exceeded: !isPremium,
        recommendation: {
          id: savedFallback.id,
          student_id: studentId,
          subject: subjectName,
          learning_standard_id: skillStandard,
          recommendation_type: recommendationType,
          mastery_score: currentEwma,
          tp_level: currentTp,
          ...fallbackPayload,
        },
      });
    }

    // 6. STEP 4: TOKEN-OPTIMIZED BASE44 LLM INVOCATION
    const studentName = studentUser?.nickname || studentUser?.full_name || "Pelajar";
    const educationLevel = studentUser?.education_level || "Tahun 4";

    // Compact prompt designed to stay under 200 input tokens
    const promptText = `Tutor StudyQuest. Pelajar: ${studentName} (${educationLevel}). Subjek: ${subjectName}. Kemahiran: ${skillStandard}. Skor EWMA: ${currentEwma}%, TP: TP ${currentTp}. Kategori: ${recommendationType.toUpperCase()}.
Jana panduan ringkas KSSR/KSSM (<100 perkataan):
- diagnosis (max 20 perkataan)
- mastery_gap (max 15 perkataan)
- recommended_action (max 10 perkataan)
- recommended_lesson_blocks: [{type: "TEXT_MARKDOWN"|"INTERACTIVE_GAME"|"FLASHCARD_DECK"|"MIND_MAP", reason: "max 10 perkataan"}]
- practice_plan (max 25 perkataan)
- motivation_message (max 15 perkataan)`;

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

    // Estimate token consumption (chars / 4)
    const promptLength = promptText.length;
    const responseLength = JSON.stringify(llmResult).length;
    const estimatedTokens = Math.round((promptLength + responseLength) / 4);

    // Log AI Usage
    await base44.asServiceRole.entities.AIUsageLog.create({
      user_id: studentId,
      purpose: "recommendation",
      model: "base44_core_llm",
      tokens_used: estimatedTokens,
      topic_name: subjectName,
      metadata: JSON.stringify({
        learning_standard_id: skillStandard,
        recommendation_type: recommendationType,
        source: "llm",
      }),
      created_at: new Date().toISOString(),
    }).catch((err: any) => console.warn("Failed to log AI usage:", err));

    const llmPayload = {
      diagnosis: llmResult.diagnosis || `Diagnosis kemahiran ${skillStandard}`,
      mastery_gap: llmResult.mastery_gap || "Perlu latihan berterusan.",
      recommended_action: llmResult.recommended_action || "Jawab latihan modul.",
      suggested_blocks: llmResult.recommended_lesson_blocks || [],
      practice_plan: llmResult.practice_plan || "1. Semak nota. 2. Buat kuiz.",
      motivation_message: llmResult.motivation_message || "Teruskan usaha gigih anda!",
    };

    const savedLlmRec = await saveRecommendationRecord(
      base44,
      studentId,
      subjectName,
      skillStandard,
      recommendationType,
      currentEwma,
      currentTp,
      llmPayload,
      "llm"
    );

    return Response.json({
      success: true,
      source: "llm",
      tokens_consumed: estimatedTokens,
      recommendation: {
        id: savedLlmRec.id,
        student_id: studentId,
        subject: subjectName,
        learning_standard_id: skillStandard,
        recommendation_type: recommendationType,
        mastery_score: currentEwma,
        tp_level: currentTp,
        ...llmPayload,
      },
    });
  } catch (error: any) {
    console.error("Fatal error in getOrGenerateRecommendation:", error);
    return Response.json(
      {
        success: false,
        error: error?.message || "Ralat pelayan semasa mendapatkan cadangan pembelajaran.",
      },
      { status: 500 }
    );
  }
}

/**
 * Deterministic Rule Engine Fallback Generator
 */
function generateDeterministicRecommendation(
  subject: string,
  standard: string,
  ewmaScore: number,
  tpLevel: number,
  type: "remediation" | "reinforcement" | "challenge"
) {
  if (type === "remediation") {
    return {
      diagnosis: `Pelajar memerlukan bimbingan asas dalam ${standard} (${subject}). Skor penguasaan semasa: ${ewmaScore}% (TP ${tpLevel}).`,
      mastery_gap: "Perlu mengukuhkan kefahaman simbol, nota visual, dan langkah asas penyelesaian.",
      recommended_action: "Semak nota ringkas visual dan selesaikan latihan bimbingan asas.",
      suggested_blocks: [
        { type: "TEXT_MARKDOWN", reason: "Ulang kaji nota ringkas asas" },
        { type: "FLASHCARD_DECK", reason: "Latihan pemahaman konsep pantas" },
      ],
      practice_plan: "1. Baca nota visual. 2. Jawab 5 soalan mudah. 3. Semak jawapan.",
      motivation_message: "Jangan berputus asa! Setiap langkah kecil membawa anda lebih dekat kepada kejayaan!",
    };
  }

  if (type === "challenge") {
    return {
      diagnosis: `Penguasaan cemerlang (${ewmaScore}%, TP ${tpLevel}) dalam ${standard}. Pelajar sedia untuk cabaran KBAT.`,
      mastery_gap: "Mengaplikasi konsep dalam situasi baharu dan soalan kemahiran berfikir aras tinggi.",
      recommended_action: "Cabar diri dengan misi KBAT dan modul keahlian utama.",
      suggested_blocks: [
        { type: "MIND_MAP", reason: "Pemetaan konsep lanjutan" },
        { type: "INTERACTIVE_GAME", reason: "Misi cabaran masteri" },
      ],
      practice_plan: "1. Analisis peta minda lanjutan. 2. Jawab 3 soalan KBAT. 3. Kongsi strategi.",
      motivation_message: "Luar biasa! Anda kini seorang pakar dalam kemahiran ini!",
    };
  }

  return {
    diagnosis: `Pelajar menguasai asas ${standard} dengan baik (${ewmaScore}%, TP ${tpLevel}). Fokus pada ketepatan.`,
    mastery_gap: "Mengurangkan ralat kecuaian dan meningkatkan kepantasan menjawab.",
    recommended_action: "Selesaikan soalan latihan pengukuhan dan cabaran kuiz bertimbal.",
    suggested_blocks: [
      { type: "INTERACTIVE_GAME", reason: "Pengukuhan melalui permainan interaktif" },
      { type: "TEXT_MARKDOWN", reason: "Petua elak kecuaian" },
    ],
    practice_plan: "1. Selesaikan latihan bertema. 2. Buat latihan masa. 3. Nilai perkembangan.",
    motivation_message: "Syabas! Usaha konsisten anda menunjukkan kemajuan yang hebat!",
  };
}

/**
 * Helper to save recommendation record into LearningRecommendation cache
 */
async function saveRecommendationRecord(
  base44: any,
  studentId: string,
  subject: string,
  standard: string,
  type: string,
  ewmaScore: number,
  tpLevel: number,
  payload: any,
  source: string
) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + CACHE_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const recData = {
    student_id: studentId,
    subject: subject,
    learning_standard_id: standard,
    recommendation_type: type,
    mastery_before: ewmaScore,
    tp_before: tpLevel,
    diagnosis: payload.diagnosis,
    recommended_action: payload.recommended_action,
    suggested_blocks_json: JSON.stringify(payload.suggested_blocks || []),
    practice_plan: payload.practice_plan,
    motivation_message: payload.motivation_message,
    status: "active",
    created_at: now.toISOString(),
    expires_at: expiresAt,
  };

  const existing = await base44.asServiceRole.entities.LearningRecommendation.filter({
    student_id: studentId,
    learning_standard_id: standard,
    status: "active",
  }).catch(() => []);

  if (existing && existing.length > 0) {
    return await base44.asServiceRole.entities.LearningRecommendation.update(existing[0].id, recData);
  }

  return await base44.asServiceRole.entities.LearningRecommendation.create(recData);
}
