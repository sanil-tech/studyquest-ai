import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  const resHeaders = {
    "content-type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: resHeaders });
  }

  try {
    const base44 = createClientFromRequest(req);
    const db = base44.asServiceRole || base44;

    // ------------------------------------------------------------------
    // 1. INPUT PARSING & AUTHENTICATION RESOLUTION
    // ------------------------------------------------------------------
    const body = await req.json().catch(() => ({}));
    const lessonIdParam = body.lesson_id || body.lessonId;
    const topicIdParam = body.topic_id || body.topicId;
    const assessmentIdParam = body.assessment_id || body.assessmentId;
    const studentIdParam = body.student_id || body.studentId;

    if (!lessonIdParam && !topicIdParam && !assessmentIdParam) {
      return Response.json(
        { success: false, error: "lesson_id, topic_id, atau assessment_id diperlukan." },
        { status: 400, headers: resHeaders }
      );
    }

    // Authenticate optional user token
    const authUser = await base44.auth.me().catch(() => null);
    const activeStudentId = studentIdParam || authUser?.id || null;

    // ------------------------------------------------------------------
    // 2. FETCH ROOT LESSON ANCHOR (SUPPORT ASSESSMENT_ID LOOKUP)
    // ------------------------------------------------------------------
    let lessonIdToFetch = lessonIdParam;
    let targetAssessmentObj: any = null;

    if (assessmentIdParam) {
      targetAssessmentObj = await db.entities.Assessment.get(assessmentIdParam).catch(() => null);
      if (targetAssessmentObj && targetAssessmentObj.lesson_id) {
        lessonIdToFetch = targetAssessmentObj.lesson_id;
      }
    }

    let lesson: any = null;
    if (lessonIdToFetch) {
      lesson = await db.entities.Lesson.get(lessonIdToFetch).catch(() => null);
    } else if (topicIdParam) {
      const lessons = await db.entities.Lesson.filter({ topic_id: topicIdParam }).catch(() => []);
      lesson = lessons && lessons.length > 0 ? lessons[0] : null;
    }

    if (!lesson) {
      return Response.json(
        { success: false, error: "Pelajaran atau penilaian tidak dijumpai." },
        { status: 404, headers: resHeaders }
      );
    }

    const lessonId = lesson.id;
    const topicId = lesson.topic_id;

    // ------------------------------------------------------------------
    // 3. TIER 1 BATCH FETCH: Topic, Versions, Student Profile, Progress
    // ------------------------------------------------------------------
    const [topic, versions, studentUser, progressList, walletList, rewardRules] = await Promise.all([
      topicId ? db.entities.Topic.get(topicId).catch(() => null) : null,
      db.entities.LessonVersion.filter({ lesson_id: lessonId }).catch(() => []),
      activeStudentId ? db.entities.User.get(activeStudentId).catch(() => null) : null,
      activeStudentId ? db.entities.Progress.filter({ student_id: activeStudentId }).catch(() => []) : [],
      activeStudentId ? db.entities.Wallet.filter({ student_id: activeStudentId }).catch(() => []) : [],
      db.entities.RewardRule.filter({ is_active: true }).catch(() => []),
    ]);

    // Resolve published LessonVersion
    let publishedVersion: any = null;
    if (lesson.published_version_id) {
      publishedVersion = await db.entities.LessonVersion.get(lesson.published_version_id).catch(() => null);
    }
    if (!publishedVersion && versions.length > 0) {
      publishedVersion = versions.find((v: any) => v.status === "published" || v.workflow_status === "PUBLISHED") ||
                         versions.sort((a: any, b: any) => (b.version_number || 0) - (a.version_number || 0))[0];
    }

    const versionId = publishedVersion?.id || null;

    // ------------------------------------------------------------------
    // 4. TIER 2 BATCH FETCH: Subject, SP Code, Blocks, Assessments, AIExplanations
    // ------------------------------------------------------------------
    const subjectId = topic?.subject_id;
    const [subject, learningStandard, blocks, assessments, explanations] = await Promise.all([
      subjectId ? db.entities.Subject.get(subjectId).catch(() => null) : null,
      topic?.learning_standard_id ? db.entities.LearningStandard.get(topic.learning_standard_id).catch(() => null) : null,
      versionId ? db.entities.LessonBlock.filter({ lesson_version_id: versionId, status: "published" }).catch(() => []) : [],
      db.entities.Assessment.filter({ lesson_id: lessonId, workflow_status: "PUBLISHED" }).catch(() => []),
      versionId ? db.entities.AIExplanation.filter({ lesson_version_id: versionId }).catch(() => []) : [],
    ]);

    // Ensure target assessment is present if requested directly
    let finalAssessments = assessments || [];
    if (targetAssessmentObj && !finalAssessments.some((a: any) => a.id === targetAssessmentObj.id)) {
      finalAssessments.push(targetAssessmentObj);
    }

    // ------------------------------------------------------------------
    // 5. TIER 3 BATCH FETCH: Questions & MCQ Options (Zero N+1 Query)
    // ------------------------------------------------------------------
    const assessmentIds = finalAssessments.map((a: any) => a.id);
    let questions: any[] = [];
    if (assessmentIds.length > 0) {
      questions = await db.entities.QuestionBank.filter({ assessment_id: { $in: assessmentIds } }).catch(() => []);
    }

    const questionIds = questions.map((q: any) => q.question_id || q.id);
    let options: any[] = [];
    if (questionIds.length > 0) {
      options = await db.entities.QuestionOption.filter({ question_id: { $in: questionIds } }).catch(() => []);
    }

    // ------------------------------------------------------------------
    // 6. IN-MEMORY ASSEMBLY & SHIELDING
    // ------------------------------------------------------------------

    // Group Options by question_id
    const optionsMap: Record<string, any[]> = {};
    for (const opt of options) {
      const qKey = opt.question_id;
      if (!optionsMap[qKey]) optionsMap[qKey] = [];
      optionsMap[qKey].push({
        label: opt.label,
        text: opt.text,
        sort_order: opt.sort_order ?? 0
      });
    }
    // Sort options sequentially (A, B, C, D)
    Object.keys(optionsMap).forEach(k => {
      optionsMap[k].sort((a, b) => a.sort_order - b.sort_order);
    });

    // Group Explanations by Question ID or Concept
    const explanationsMap: Record<string, any[]> = {};
    for (const exp of explanations) {
      const key = exp.question_id || exp.concept;
      if (!explanationsMap[key]) explanationsMap[key] = [];
      explanationsMap[key].push({
        concept: exp.concept,
        explanation_markdown: exp.explanation_markdown || exp.explanation || '',
        analogy: exp.analogy || '',
        example: exp.example || ''
      });
    }

    // Assemble Questions
    const assembledQuestionsMap: Record<string, any[]> = {};
    for (const q of questions) {
      const qKey = q.question_id || q.id;
      const asmId = q.assessment_id;
      if (!assembledQuestionsMap[asmId]) assembledQuestionsMap[asmId] = [];

      // Fallback: parse options_json string if options table is empty
      let qOpts = optionsMap[qKey] || [];
      if (qOpts.length === 0 && q.options_json) {
        try {
          const parsedOpts = typeof q.options_json === 'string' ? JSON.parse(q.options_json) : q.options_json;
          if (Array.isArray(parsedOpts)) {
            qOpts = parsedOpts.map((optText: string, idx: number) => ({
              label: String.fromCharCode(65 + idx),
              text: optText,
              sort_order: idx
            }));
          }
        } catch { /* ignore parse error */ }
      }

      const rawAiExps = explanationsMap[qKey] || explanationsMap[q.question_text] || [];
      const firstExp = rawAiExps[0] || null;

      // Normalized explanation details object
      const explanationDetails = {
        concept: firstExp?.concept || topic?.name || 'Konsep Utama',
        explanation_markdown: firstExp?.explanation_markdown || q.explanation || '',
        analogy: firstExp?.analogy || '',
        example: firstExp?.example || ''
      };

      assembledQuestionsMap[asmId].push({
        id: qKey,
        learning_standard_id: q.learning_standard_id || topic?.learning_standard_id || null,
        question_text: q.question_text || q.question || '',
        question_type: q.question_type || 'MCQ',
        question_image_url: q.question_image_url || null,
        options: qOpts,
        correct_answer: q.correct_answer || 'A',
        explanation: q.explanation || '',
        explanation_details: explanationDetails,
        difficulty: q.difficulty || 'medium',
        cognitive_level: q.cognitive_level || 'understand',
        ai_explanations: rawAiExps
      });
    }

    // Assemble Assessments
    const assembledAssessments = finalAssessments.map((a: any) => ({
      id: a.id,
      title: a.title,
      assessment_type: a.assessment_type || 'PRACTICE',
      time_limit_minutes: a.time_limit_minutes || 0,
      passing_score: a.passing_score || 80,
      reward_xp: a.reward_xp || 50,
      reward_coins: a.reward_coins || 10,
      questions: assembledQuestionsMap[a.id] || []
    }));

    // Format & Parse LessonBlocks
    const formattedBlocks = (blocks || [])
      .sort((a: any, b: any) => (a.order_number || 0) - (b.order_number || 0))
      .map((b: any) => {
        let parsedPayload = b.payload;
        if (typeof parsedPayload === 'string') {
          try { parsedPayload = JSON.parse(parsedPayload); } catch { /* keep raw string */ }
        }
        return {
          id: b.id,
          block_type: b.block_type,
          title: b.title || '',
          order_number: b.order_number,
          payload: parsedPayload || {}
        };
      });

    // Assemble Optional Student Context
    const activeProgress = progressList?.[0] || {};
    const activeWallet = walletList?.[0] || {};
    const studentContext = activeStudentId ? {
      student_id: activeStudentId,
      display_name: studentUser?.nickname || studentUser?.full_name || 'Pelajar',
      level: activeProgress.level || 1,
      total_xp: activeProgress.total_xp || 0,
      streak_days: activeProgress.streak_days || 0,
      wallet_balance: activeWallet.balance || 0,
      education_level: studentUser?.education_level || studentUser?.school_year || ''
    } : null;

    // Resolve Primary Assessment Context
    const primaryAssessment = (assessmentIdParam
      ? assembledAssessments.find((a: any) => a.id === assessmentIdParam)
      : null) || assembledAssessments[0] || null;

    const assessmentContext = {
      challenge_type: primaryAssessment?.assessment_type || 'PRACTICE',
      reward: {
        xp: primaryAssessment?.reward_xp ?? 50,
        coins: primaryAssessment?.reward_coins ?? 10
      },
      completion_message: primaryAssessment
        ? `Tahniah! Anda telah menyempurnakan ${primaryAssessment.title || 'penilaian ini'}.`
        : "Tahniah! Anda telah menyempurnakan penilaian ini."
    };

    // ------------------------------------------------------------------
    // 7. FINAL LEARNING PACKAGE PAYLOAD CONTRACT
    // ------------------------------------------------------------------
    return Response.json({
      success: true,
      package_type: 'COMPLETE_LEARNING_PACKAGE',
      curriculum_context: {
        curriculum_name: 'KSSR / KSSM',
        subject_id: subject?.id || '',
        subject_name: subject?.name || lesson.subject_name || '',
        topic_id: topic?.id || lesson.topic_id || '',
        topic_name: topic?.name || lesson.topic_name || '',
        form_level: topic?.form_level || studentUser?.education_level || 'Tahun 1',
        learning_standard_code: learningStandard?.code || '',
        learning_standard_description: learningStandard?.description || ''
      },
      lesson: {
        id: lessonId,
        title: lesson.title || topic?.name || 'Pelajaran',
        status: lesson.content_status || 'published'
      },
      version: {
        id: versionId,
        version_number: publishedVersion?.version_number || 1,
        published_at: publishedVersion?.published_at || publishedVersion?.updated_at || new Date().toISOString()
      },
      content_blocks: formattedBlocks,
      assessments: assembledAssessments,
      assessment_context: assessmentContext,
      student_context: studentContext,
      rewards: {
        lesson_completion_xp: 20,
        lesson_completion_coins: 5,
        rules: (rewardRules || []).map((r: any) => ({
          activity_type: r.activity_type,
          base_xp: r.base_xp,
          base_coins: r.base_coins
        }))
      },
      learning_path: {
        prerequisite_met: true,
        recommended_next_action: assembledAssessments.length > 0 ? 'TAKE_ASSESSMENT' : 'NEXT_LESSON'
      }
    }, { status: 200, headers: resHeaders });

  } catch (error: any) {
    console.error('getLearningPackage Error:', error);
    return Response.json(
      { success: false, error: error.message || 'Gagal memuatkan Pakej Pembelajaran.' },
      { status: 500, headers: resHeaders }
    );
  }
});
