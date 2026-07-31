// base44/functions/submitAssessment/entry.ts
// Server-Authoritative Assessment Submission System (Phase 2.5 Hardened)
// Evaluates answers server-side, calculates score, updates QuizAttempt, awards XP/coins idempotently, and logs activity with settlement tracking.

import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

interface AnswerInput {
  question_id: string;
  selected_option_id?: string;
  selected_option?: string;
  text_answer?: string;
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    // 1. Resolve Student Identity
    let studentId = body.student_id;
    let authUser: any = null;

    try {
      authUser = await base44.auth.me();
    } catch {
      /* Session check fallback */
    }

    if (!studentId && authUser) {
      studentId = authUser.id;
    }

    if (!studentId) {
      return Response.json(
        { success: false, error: "Sesi pelajar tidak disahkan." },
        { status: 401 }
      );
    }

    // Security check: If authUser exists, ensure non-admin cannot submit on behalf of another user
    if (authUser && authUser.id !== studentId && authUser.role !== "admin") {
      // Check if studentId is in linked_student_ids (parent session)
      const linked = authUser.linked_student_ids || [];
      if (!Array.isArray(linked) || !linked.includes(studentId)) {
        return Response.json(
          { success: false, error: "Tidak dibenarkan menghantar ujian bagi pihak pelajar ini." },
          { status: 403 }
        );
      }
    }

    const { assessment_id, answers, duration_seconds } = body;

    if (!assessment_id || !Array.isArray(answers)) {
      return Response.json(
        { success: false, error: "assessment_id dan senarai answers[] diperlukan." },
        { status: 400 }
      );
    }

    // 2. Fetch Assessment
    const assessment = await base44.asServiceRole.entities.Assessment.get(
      assessment_id
    ).catch(() => null);

    if (!assessment) {
      return Response.json(
        { success: false, error: "Assessment tidak dijumpai." },
        { status: 404 }
      );
    }

    // 3. Compute Submission Hash for Idempotency Protection
    const sortedAnswers = [...answers]
      .sort((a, b) => String(a.question_id).localeCompare(String(b.question_id)))
      .map((a) => ({
        q: String(a.question_id),
        o: String(a.selected_option_id || a.selected_option || a.text_answer || ""),
      }));

    const rawHashString = `${studentId}:${assessment_id}:${JSON.stringify(sortedAnswers)}`;
    const hashBuffer = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(rawHashString)
    );
    const submission_hash = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Check for existing duplicate submission hash
    const existingDuplicates = await base44.asServiceRole.entities.QuizAttempt.filter({
      submission_hash,
    }).catch(() => []);

    if (existingDuplicates.length > 0) {
      const prev = existingDuplicates[0];

      // If previous attempt exists but reward settlement failed, trigger re-settlement attempt
      let reSettled = false;
      if (prev.reward_settled === false && (prev.coins_earned > 0 || prev.xp_earned > 0)) {
        reSettled = await reconcileAttemptRewards(base44, prev, studentId, assessment);
      }

      return Response.json({
        success: true,
        is_duplicate: true,
        message: "Penyerahan jawapan ini telah diproses sebelum ini.",
        attempt_id: prev.id,
        score: prev.score ?? prev.score_percentage ?? 0,
        score_percentage: prev.score_percentage ?? prev.score ?? 0,
        passed: Boolean(prev.passed ?? prev.passed_status),
        correct_count: prev.correct_count ?? 0,
        total_questions: prev.total_questions ?? 0,
        xp_earned: prev.xp_earned ?? 0,
        coins_earned: prev.coins_earned ?? 0,
        attempt_number: prev.attempt_number ?? 1,
        reward_settled: reSettled || prev.reward_settled ?? true,
      });
    }

    // 4. Fetch Questions for this Assessment
    const questions = await base44.asServiceRole.entities.QuestionBank.filter({
      assessment_id,
    }).catch(() => []);

    // 5. Evaluate Answers Server-Side
    let correctCount = 0;
    const totalQuestions = questions.length > 0 ? questions.length : answers.length;
    const questionResults: any[] = [];

    for (const q of questions) {
      const submitted = answers.find(
        (a: AnswerInput) => String(a.question_id) === String(q.id)
      );
      const selectedOptionId =
        submitted?.selected_option_id || submitted?.selected_option || "";

      // Fetch options for this question if present in QuestionOption entity
      const options = await base44.asServiceRole.entities.QuestionOption.filter({
        question_id: q.id,
      }).catch(() => []);

      let isCorrect = false;
      let correctOptionId = q.correct_option_id || "";
      let explanation = q.explanation || "";

      if (options.length > 0) {
        const correctOpt = options.find((o: any) => o.is_correct);
        if (correctOpt) {
          correctOptionId = correctOpt.id;
        }

        const selectedOpt = options.find((o: any) => o.id === selectedOptionId);
        if (selectedOpt && selectedOpt.is_correct) {
          isCorrect = true;
        } else if (selectedOptionId && correctOptionId && selectedOptionId === correctOptionId) {
          isCorrect = true;
        }
        if (selectedOpt?.explanation) {
          explanation = selectedOpt.explanation;
        }
      } else {
        // Fallbacks for QuestionBank embedded fields
        if (q.correct_option_id && selectedOptionId === q.correct_option_id) {
          isCorrect = true;
        } else if (q.correct_answer && selectedOptionId === q.correct_answer) {
          isCorrect = true;
        } else if (submitted?.text_answer && q.correct_answer && submitted.text_answer.trim().toLowerCase() === String(q.correct_answer).trim().toLowerCase()) {
          isCorrect = true;
        }
      }

      if (isCorrect) {
        correctCount += 1;
      }

      questionResults.push({
        question_id: q.id,
        is_correct: isCorrect,
        selected_option_id: selectedOptionId,
        correct_option_id: correctOptionId,
        explanation: explanation,
      });
    }

    const scorePercentage =
      totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const passingScore = assessment.passing_score ?? 70;
    const passed = scorePercentage >= passingScore;

    // 6. Check Previous Attempts for Repeat Pass Protection
    const previousAttempts = await base44.asServiceRole.entities.QuizAttempt.filter({
      student_id: studentId,
      assessment_id: assessment_id,
    }).catch(() => []);

    const attemptNumber = previousAttempts.length + 1;
    const alreadyPassed = previousAttempts.some(
      (att: any) => att.passed === true || att.passed_status === true || (att.score && att.score >= passingScore)
    );

    // 7. Calculate Rewards Server-Side
    const baseXp = assessment.reward_xp ?? 50;
    const baseCoins = assessment.reward_coins ?? 10;
    let xpEarned = 0;
    let coinsEarned = 0;
    let rewardStatus = "failed";

    if (passed) {
      if (alreadyPassed) {
        // Repeat pass: 0 coins to prevent coin farming, retention XP (5 XP)
        xpEarned = 5;
        coinsEarned = 0;
        rewardStatus = "already_claimed";
      } else {
        // First pass: scaled reward
        const multiplier = scorePercentage / 100;
        xpEarned = Math.max(10, Math.round(baseXp * multiplier));
        coinsEarned = Math.max(1, Math.round(baseCoins * multiplier));
        rewardStatus = "awarded";
      }
    } else {
      // Participation reward
      xpEarned = 5;
      coinsEarned = 0;
      rewardStatus = "failed";
    }

    const now = new Date().toISOString();

    // 8. Record Initial QuizAttempt (Schema-compliant)
    const attemptPayload: any = {
      student_id: studentId,
      quiz_id: assessment_id, // Required by QuizAttempt.jsonc schema
      assessment_id: assessment_id,
      score: scorePercentage,
      score_percentage: scorePercentage,
      passed: passed,
      passed_status: passed,
      correct_count: correctCount,
      total_questions: totalQuestions,
      duration_seconds: duration_seconds || 0,
      attempt_number: attemptNumber,
      answers_json: JSON.stringify(answers),
      submission_hash: submission_hash,
      xp_earned: xpEarned,
      coins_earned: coinsEarned,
      reward_status: rewardStatus,
      reward_settled: false, // Default to false until wallet/progress updates complete
      completed_at: now,
      created_at: now,
    };

    const newAttempt = await base44.asServiceRole.entities.QuizAttempt.create(attemptPayload);

    // 9. Execute Reward Settlement (Wallet, Progress, ActivityLog)
    let settlementError: string | null = null;

    try {
      // Wallet update (Coins)
      if (coinsEarned > 0) {
        const wallets = await base44.asServiceRole.entities.Wallet.filter({
          student_id: studentId,
        }).catch(() => []);

        if (wallets && wallets.length > 0) {
          const currentWallet = wallets[0];
          await base44.asServiceRole.entities.Wallet.update(currentWallet.id, {
            balance: (currentWallet.balance || 0) + coinsEarned,
            coins: (currentWallet.coins || 0) + coinsEarned,
            total_earned: (currentWallet.total_earned || 0) + coinsEarned,
            updated_at: now,
          });
        } else {
          await base44.asServiceRole.entities.Wallet.create({
            student_id: studentId,
            balance: coinsEarned,
            coins: coinsEarned,
            total_earned: coinsEarned,
            updated_at: now,
          });
        }
      }

      // Progress update (XP & Level)
      if (xpEarned > 0) {
        const progressList = await base44.asServiceRole.entities.Progress.filter({
          student_id: studentId,
        }).catch(() => []);

        if (progressList && progressList.length > 0) {
          const prog = progressList[0];
          const newTotalXp = (prog.total_xp || prog.xp || 0) + xpEarned;
          const newLevel = Math.floor(newTotalXp / 100) + 1;
          await base44.asServiceRole.entities.Progress.update(prog.id, {
            total_xp: newTotalXp,
            xp: newTotalXp,
            level: newLevel,
            updated_at: now,
          });
        } else {
          await base44.asServiceRole.entities.Progress.create({
            student_id: studentId,
            total_xp: xpEarned,
            xp: xpEarned,
            level: Math.floor(xpEarned / 100) + 1,
            updated_at: now,
          });
        }
      }

      // ActivityLog creation (Uses ActivityLog schema enum: quiz_mastery or quiz_practice)
      await base44.asServiceRole.entities.ActivityLog.create({
        student_id: studentId,
        activity_type: passed ? "quiz_mastery" : "quiz_practice",
        reference_id: assessment_id,
        reference_name: assessment.title || "Penilaian",
        score: scorePercentage,
        xp_earned: xpEarned,
        coins_earned: coinsEarned,
        is_first_completion: !alreadyPassed && passed,
        completion_number: attemptNumber,
        metadata_json: JSON.stringify({
          assessment_id,
          attempt_id: newAttempt.id,
          score: scorePercentage,
          passed,
          reward_status: rewardStatus,
        }),
        created_at: now,
      }).catch((logErr: any) => console.warn("ActivityLog non-fatal warning:", logErr));

    } catch (settleErr: any) {
      console.error("Reward settlement error:", settleErr);
      settlementError = settleErr?.message || "Ralat semasa mengemas kini ganjaran.";
    }

    // 10. Mark Attempt Settlement Status
    const isSettled = !settlementError;
    const settledAt = isSettled ? new Date().toISOString() : null;

    await base44.asServiceRole.entities.QuizAttempt.update(newAttempt.id, {
      reward_settled: isSettled,
      reward_settled_at: settledAt,
      settlement_error: settlementError,
    }).catch((err: any) => console.error("Failed to update QuizAttempt settlement status:", err));

    // 11. Return Server-Authoritative Result
    return Response.json({
      success: true,
      attempt_id: newAttempt.id,
      score: scorePercentage,
      score_percentage: scorePercentage,
      passed: passed,
      correct_count: correctCount,
      total_questions: totalQuestions,
      xp_earned: xpEarned,
      coins_earned: coinsEarned,
      already_passed: alreadyPassed,
      reward_status: rewardStatus,
      reward_settled: isSettled,
      attempt_number: attemptNumber,
      question_results: questionResults,
    });
  } catch (error: any) {
    console.error("Fatal error in submitAssessment:", error);
    return Response.json(
      {
        success: false,
        error: error?.message || "Ralat pelayan semasa menghantar ujian.",
      },
      { status: 500 }
    );
  }
}

/**
 * Reconciliation Helper: Re-attempts reward settlement for unsettled previous attempts
 */
async function reconcileAttemptRewards(
  base44: any,
  attempt: any,
  studentId: string,
  assessment: any
): Promise<boolean> {
  try {
    const coinsEarned = attempt.coins_earned || 0;
    const xpEarned = attempt.xp_earned || 0;
    const now = new Date().toISOString();

    if (coinsEarned > 0) {
      const wallets = await base44.asServiceRole.entities.Wallet.filter({
        student_id: studentId,
      }).catch(() => []);

      if (wallets && wallets.length > 0) {
        await base44.asServiceRole.entities.Wallet.update(wallets[0].id, {
          balance: (wallets[0].balance || 0) + coinsEarned,
          coins: (wallets[0].coins || 0) + coinsEarned,
          total_earned: (wallets[0].total_earned || 0) + coinsEarned,
          updated_at: now,
        });
      }
    }

    if (xpEarned > 0) {
      const progressList = await base44.asServiceRole.entities.Progress.filter({
        student_id: studentId,
      }).catch(() => []);

      if (progressList && progressList.length > 0) {
        const prog = progressList[0];
        const newTotalXp = (prog.total_xp || prog.xp || 0) + xpEarned;
        await base44.asServiceRole.entities.Progress.update(prog.id, {
          total_xp: newTotalXp,
          xp: newTotalXp,
          level: Math.floor(newTotalXp / 100) + 1,
          updated_at: now,
        });
      }
    }

    await base44.asServiceRole.entities.QuizAttempt.update(attempt.id, {
      reward_settled: true,
      reward_settled_at: now,
      settlement_error: null,
    });

    return true;
  } catch (err) {
    console.error("Reconciliation failed for attempt:", attempt.id, err);
    return false;
  }
}
