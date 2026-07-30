// base44/functions/generateAIInsightReport/entry.ts
// Suku AI Learning Insights — Generate Once, Store, Reuse.
// Gathers student data, calls InvokeLLM, stores report in AIInsightReport + LearningAnalytics.
// Regenerates only when: force=true, report older than cache window, or no report exists.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);

    // 1. Authenticate parent
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ success: false, error: 'Sesi tidak sah.' }, { status: 401 });
    }

    const role = user.app_role || user.role;
    if (role !== 'parent' && role !== 'admin') {
      return Response.json({ success: false, error: 'Hanya ibu bapa dibenarkan.' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const studentId = body.student_id;
    const reportType = body.report_type || 'weekly';
    const forceRegenerate = body.force === true;

    if (!studentId) {
      return Response.json({ success: false, error: 'ID pelajar diperlukan.' }, { status: 400 });
    }

    // 2. Verify parent is linked to this student
    const linkedIds = user.linked_student_ids || [];
    if (role !== 'admin' && !linkedIds.includes(studentId)) {
      return Response.json({ success: false, error: 'Akses dinafikan.' }, { status: 403 });
    }

    // 3. Check for cached report (Generate Once, Store, Reuse)
    if (!forceRegenerate) {
      const existing = await base44.asServiceRole.entities.AIInsightReport.filter(
        { student_id: studentId, report_type: reportType },
        '-generated_date',
        1
      );
      if (existing.length > 0) {
        const report = existing[0];
        const reportAgeDays = (Date.now() - new Date(report.generated_date).getTime()) / (1000 * 60 * 60 * 24);
        const maxAge = reportType === 'monthly' ? 30 : 7;
        if (reportAgeDays < maxAge) {
          return Response.json({ success: true, report, cached: true });
        }
      }
    }

    // 4. Gather student data
    const [studentProfile, progress, quizAttempts, gameProgress, activityLogs, studySessions] = await Promise.all([
      base44.asServiceRole.entities.User.get(studentId).catch(() => null),
      base44.asServiceRole.entities.Progress.filter({ student_id: studentId }, '-created_date', 1).catch(() => []),
      base44.asServiceRole.entities.QuizAttempt.filter({ student_id: studentId }, '-created_date', 20).catch(() => []),
      base44.asServiceRole.entities.GameProgress.filter({ student_id: studentId }, '-created_date', 20).catch(() => []),
      base44.asServiceRole.entities.ActivityLog.filter({ student_id: studentId }, '-created_date', 30).catch(() => []),
      base44.asServiceRole.entities.StudySession.filter({ student_id: studentId }, '-created_date', 14).catch(() => []),
    ]);

    const progressData = Array.isArray(progress) ? progress[0] : null;

    // 5. Build analytics summary
    const subjectScores = {};
    quizAttempts.forEach(qa => {
      if (!subjectScores[qa.subject_name]) subjectScores[qa.subject_name] = [];
      subjectScores[qa.subject_name].push(qa.score || 0);
    });

    const subjectSummary = Object.entries(subjectScores).map(([subject, scores]) => ({
      subject,
      avg_score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      attempts: scores.length,
    }));

    const gameTypePrefs = {};
    gameProgress.forEach(gp => {
      gameTypePrefs[gp.game_type] = (gameTypePrefs[gp.game_type] || 0) + (gp.attempts || 0);
    });

    const totalStudyTime = studySessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
    const totalLessons = activityLogs.filter(a => a.activity_type === 'lesson_complete').length;
    const studentName = studentProfile?.nickname || studentProfile?.full_name || 'Pelajar';
    const educationLevel = studentProfile?.education_level || 'Standard 1';

    // 6. Build AI prompt
    const analysisPrompt = `Anda adalah Suku AI, pakar analitik pembelajaran untuk pendidikan KSSR Malaysia. Analisis data pelajar berikut dan jana laporan JSON yang komprehensif untuk ibu bapa.

PROFIL PELAJAR:
- Nama: ${studentName}
- Tahap: ${educationLevel}

RINGKASAN KEMAJUAN:
- Total XP: ${progressData?.total_xp || 0}
- Tahap: ${progressData?.level || 1}
- Streak: ${progressData?.streak_days || 0} hari
- Total masa belajar: ${totalStudyTime} minit
- Pelajaran selesai: ${totalLessons}

SKOR MENGIKUT SUBJEK:
${subjectSummary.map(s => `- ${s.subject}: ${s.avg_score}% (${s.attempts} percubaan)`).join('\n') || 'Tiada data kuiz'}

PERMAINAN:
${Object.entries(gameTypePrefs).map(([type, count]) => `- ${type}: ${count} kali`).join('\n') || 'Tiada data permainan'}

AKTIVITI TERKINI:
${activityLogs.slice(0, 10).map(a => `- ${a.reference_name || a.activity_type}: ${a.xp_earned} XP, ${a.coins_earned} koin`).join('\n') || 'Tiada aktiviti'}

Jana laporan dalam format JSON (SEMUA teks dalam Bahasa Melayu):
- learning_summary: Ringkasan perkembangan pelajar (2-3 ayat, positif dan mesra)
- strengths: Array objek {skill, explanation} — kemahiran yang dikuasai
- weaknesses: Array objek {skill, explanation} — kemahiran yang perlu pengukuhan
- recommendations: Array objek {action, mission} — cadangan tindakan dan misi yang disyorkan
- learning_pattern: {pattern_type (Visual/Auditori/Kinestetik/Campuran), evidence, preferred_activities[]}
- early_warnings: Array {type, message} — pemerhatian pendidikan sahaja, BUKAN diagnosis perubatan
- home_activities: Array {name, duration, purpose} — aktiviti ringkas ibu bapa boleh buat di rumah
- growth_data: Array {month, subjects: [{subject, score}]} — data pertumbuhan mengikut bulan`;

    // 7. Call InvokeLLM
    const aiResult = await base44.integrations.Core.InvokeLLM({
      prompt: analysisPrompt,
      response_json_schema: {
        type: "object",
        properties: {
          learning_summary: { type: "string" },
          strengths: { type: "array", items: { type: "object", properties: { skill: { type: "string" }, explanation: { type: "string" } } } },
          weaknesses: { type: "array", items: { type: "object", properties: { skill: { type: "string" }, explanation: { type: "string" } } } },
          recommendations: { type: "array", items: { type: "object", properties: { action: { type: "string" }, mission: { type: "string" } } } },
          learning_pattern: { type: "object", properties: { pattern_type: { type: "string" }, evidence: { type: "string" }, preferred_activities: { type: "array", items: { type: "string" } } } },
          early_warnings: { type: "array", items: { type: "object", properties: { type: { type: "string" }, message: { type: "string" } } } },
          home_activities: { type: "array", items: { type: "object", properties: { name: { type: "string" }, duration: { type: "string" }, purpose: { type: "string" } } } },
          growth_data: { type: "array", items: { type: "object", properties: { month: { type: "string" }, subjects: { type: "array", items: { type: "object", properties: { subject: { type: "string" }, score: { type: "number" } } } } } } }
        }
      }
    });

    // 8. Store report (upsert)
    const reportData = {
      student_id: studentId,
      report_type: reportType,
      generated_date: new Date().toISOString(),
      learning_summary: aiResult.learning_summary || '',
      strengths: JSON.stringify(aiResult.strengths || []),
      weaknesses: JSON.stringify(aiResult.weaknesses || []),
      recommendations: JSON.stringify(aiResult.recommendations || []),
      learning_pattern: JSON.stringify(aiResult.learning_pattern || {}),
      early_warnings: JSON.stringify(aiResult.early_warnings || []),
      home_activities: JSON.stringify(aiResult.home_activities || []),
      growth_data: JSON.stringify(aiResult.growth_data || []),
      ai_version: 'suku-v1',
    };

    const existingReports = await base44.asServiceRole.entities.AIInsightReport.filter(
      { student_id: studentId, report_type: reportType },
      '-generated_date',
      1
    );

    let report;
    if (existingReports.length > 0) {
      report = await base44.asServiceRole.entities.AIInsightReport.update(existingReports[0].id, reportData);
    } else {
      report = await base44.asServiceRole.entities.AIInsightReport.create(reportData);
    }

    // 9. Update LearningAnalytics (upsert per subject)
    for (const s of subjectSummary) {
      const existing = await base44.asServiceRole.entities.LearningAnalytics.filter(
        { student_id: studentId, subject: s.subject, skill: 'overall' },
        '-created_date',
        1
      );
      const analyticsData = {
        student_id: studentId,
        subject: s.subject,
        skill: 'overall',
        score: s.avg_score,
        trend: s.avg_score >= 70 ? 'improving' : s.avg_score >= 50 ? 'stable' : 'declining',
        confidence_level: s.avg_score,
        last_assessed: new Date().toISOString(),
      };
      if (existing.length > 0) {
        await base44.asServiceRole.entities.LearningAnalytics.update(existing[0].id, analyticsData);
      } else {
        await base44.asServiceRole.entities.LearningAnalytics.create(analyticsData);
      }
    }

    return Response.json({ success: true, report, cached: false });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}