import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const {
      student_id,
      responses = [],
      skill_profiles = [],
      learning_path = null,
      uploaded_images = [],
      module_results = {},
    } = body;

    if (!student_id) {
      return Response.json({ error: 'student_id is required' }, { status: 400 });
    }

    const now = new Date().toISOString();

    // 1. Create or update BasicDiagnosticSession
    const moduleScores = {};
    let totalScore = 0;
    let moduleCount = 0;
    for (const [key, val] of Object.entries(module_results)) {
      moduleScores[`${key}_level`] = val.level || 1;
      moduleScores[`${key}_mastery`] = val.mastery || 'needs_foundation';
      totalScore += val.score || 0;
      moduleCount++;
    }
    const overallScore = moduleCount > 0 ? Math.round(totalScore / moduleCount) : 0;

    const investigationSkills = skill_profiles
      .filter((p) => p.mastery_level !== 'mastered')
      .map((p) => ({ subject: p.subject, skill: p.skill, sub_skill: p.sub_skill }));

    const sessionData = await base44.asServiceRole.entities.BasicDiagnosticSession.create({
      student_id,
      date: now,
      completion_date: now,
      status: 'completed',
      current_layer: 'completed',
      reading_level: moduleScores.membaca_level || 1,
      writing_level: moduleScores.menulis_level || 1,
      numeracy_level: moduleScores.mengira_level || 1,
      reading_mastery: moduleScores.membaca_mastery || 'needs_foundation',
      writing_mastery: moduleScores.menulis_mastery || 'needs_foundation',
      numeracy_mastery: moduleScores.mengira_mastery || 'needs_foundation',
      total_score: overallScore,
      investigation_skills_json: JSON.stringify(investigationSkills),
    });

    const sessionId = sessionData.id;

    // 2. Bulk create DiagnosticResponse records
    if (responses.length > 0) {
      const responseRecords = responses.map((r) => ({
        student_id,
        session_id: sessionId,
        question_id: r.question_id,
        subject: r.subject,
        skill: r.skill,
        sub_skill: r.sub_skill || '',
        answer: r.answer || '',
        is_correct: r.is_correct || false,
        score: r.is_correct ? 1 : 0,
        layer: r.layer || 'screening',
        image_url: r.image_url || null,
        ai_reviewed: false,
      }));
      await base44.asServiceRole.entities.DiagnosticResponse.bulkCreate(responseRecords);
    }

    // 3. Bulk create StudentSkillProfile records
    if (skill_profiles.length > 0) {
      const profileRecords = skill_profiles.map((p) => ({
        student_id,
        session_id: sessionId,
        subject: p.subject,
        skill: p.skill,
        sub_skill: p.sub_skill || 'general',
        mastery_level: p.mastery_level,
        score: p.score || 0,
        questions_attempted: p.questions_attempted || 0,
        questions_correct: p.questions_correct || 0,
        recommendation: p.recommendation || '',
      }));
      await base44.asServiceRole.entities.StudentSkillProfile.bulkCreate(profileRecords);
    }

    // 4. Create LearningPath record
    let learningPathId = null;
    if (learning_path) {
      const lp = await base44.asServiceRole.entities.LearningPath.create({
        student_id,
        session_id: sessionId,
        reading_level: learning_path.reading_level || 'developing',
        writing_level: learning_path.writing_level || 'developing',
        numeracy_level: learning_path.numeracy_level || 'developing',
        reading_starting_point: learning_path.reading_starting_point || '',
        writing_starting_point: learning_path.writing_starting_point || '',
        numeracy_starting_point: learning_path.numeracy_starting_point || '',
        recommended_topics: JSON.stringify(learning_path.recommended_topics || []),
        recommended_games: JSON.stringify(learning_path.recommended_games || []),
        overall_recommendation: learning_path.overall_recommendation || '',
      });
      learningPathId = lp.id;
    }

    // 5. Run AI Analysis (ONE call only — token optimization)
    const skillSummary = skill_profiles.map((p) => ({
      subject: p.subject,
      skill: p.skill,
      sub_skill: p.sub_skill,
      mastery: p.mastery_level,
      score: p.score,
      recommendation: p.recommendation,
    }));

    const aiPrompt = `Anda adalah pakar pendidikan awal kanak-kanak dan kurikulum KSSR Malaysia.
Analisis keputusan diagnostik 3M (Membaca, Menulis, Mengira) untuk pelajar berikut.

KEPUTUSAN KEMAHIRAN:
${JSON.stringify(skillSummary, null, 2)}

LALUAN PEMBELAJARAN:
${JSON.stringify(learning_path, null, 2)}

TUGASAN:
Berdasarkan keputusan di atas, hasilkan analisis dalam format JSON berikut:
{
  "strengths": [{"skill": "nama kemahiran", "description": "penjelasan kekuatan dalam Bahasa Melayu"}],
  "weaknesses": [{"skill": "nama kemahiran", "description": "penjelasan kelemahan dan apa perlu dilatih"}],
  "recommended_starting_point": "Titik permulaan pembelajaran yang disyorkan (1-2 ayat dalam Bahasa Melayu)",
  "recommended_activities": [{"activity": "nama aktiviti", "purpose": "tujuan aktiviti"}],
  "parent_insight": "Mesej positif dan galakan untuk ibu bapa (2-3 ayat dalam Bahasa Melayu)"
}

Panduan:
- Gunakan Bahasa Melayu yang mesra dan positif
- Kekuatan: kemahiran yang dikuasai (mastered) atau skor tinggi
- Kelemahan: kemahiran yang needs_foundation atau developing
- Aktiviti: 3-5 aktiviti praktikal yang ibu bapa/ guru boleh lakukan
- Mesej ibu bapa: positif, tidak menakutkan, beri harapan`;

    let analysis = null;
    try {
      const aiResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: aiPrompt,
        response_json_schema: {
          type: 'object',
          properties: {
            strengths: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  skill: { type: 'string' },
                  description: { type: 'string' },
                },
              },
            },
            weaknesses: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  skill: { type: 'string' },
                  description: { type: 'string' },
                },
              },
            },
            recommended_starting_point: { type: 'string' },
            recommended_activities: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  activity: { type: 'string' },
                  purpose: { type: 'string' },
                },
              },
            },
            parent_insight: { type: 'string' },
          },
        },
      });

      analysis = aiResult;
    } catch (aiErr) {
      console.error('AI analysis failed:', aiErr.message);
      // Fallback analysis from skill profiles
      analysis = generateFallbackAnalysis(skill_profiles, learning_path);
    }

    // 6. Update session with AI analysis and learning path
    await base44.asServiceRole.entities.BasicDiagnosticSession.update(sessionId, {
      ai_analysis: JSON.stringify(analysis),
      recommended_starting_point: analysis?.recommended_starting_point || learning_path?.overall_recommendation || '',
      recommended_activities: JSON.stringify(analysis?.recommended_activities || []),
      learning_path_id: learningPathId,
      overall_level: getOverallLevel(learning_path),
    });

    // 7. Log AI usage
    try {
      await base44.asServiceRole.entities.AIUsageLog.create({
        purpose: 'quiz_analysis',
        model: 'automatic',
        tokens_used: Math.round(aiPrompt.length / 4),
        user_id: student_id,
        metadata: JSON.stringify({ session_id: sessionId, profiles_count: skill_profiles.length }),
      });
    } catch (e) {
      // Non-critical
    }

    return Response.json({
      success: true,
      session_id: sessionId,
      learning_path_id: learningPathId,
      analysis,
      learning_path,
      skill_profiles: skill_profiles,
      module_results,
      overall_score: overallScore,
    });
  } catch (error) {
    console.error('runDiagnosticAnalysis error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

function getOverallLevel(learningPath) {
  if (!learningPath) return 'developing';
  const levels = [learningPath.reading_level, learningPath.writing_level, learningPath.numeracy_level];
  if (levels.every((l) => l === 'advanced')) return 'advanced';
  if (levels.every((l) => l === 'foundation')) return 'foundation';
  if (levels.filter((l) => l === 'foundation').length >= 2) return 'foundation';
  if (levels.filter((l) => l === 'proficient' || l === 'advanced').length >= 2) return 'proficient';
  return 'developing';
}

function generateFallbackAnalysis(skillProfiles, learningPath) {
  const strengths = skillProfiles
    .filter((p) => p.mastery_level === 'mastered')
    .map((p) => ({
      skill: `${p.subject} - ${p.skill}`,
      description: p.recommendation,
    }));

  const weaknesses = skillProfiles
    .filter((p) => p.mastery_level !== 'mastered')
    .map((p) => ({
      skill: `${p.subject} - ${p.skill}`,
      description: p.recommendation,
    }));

  return {
    strengths,
    weaknesses,
    recommended_starting_point: learningPath?.overall_recommendation || 'Mulakan dari kemahiran asas yang belum dikuasai.',
    recommended_activities: [
      { activity: 'Latihan harian 15 minit', purpose: 'Mengukuhkan kemahiran asas yang masih lemah.' },
      { activity: 'Permainan interaktif StudyQuest', purpose: 'Pembelajaran menyeronokkan untuk kemahiran yang dikenal pasti.' },
    ],
    parent_insight: 'Setiap anak belajar pada rentak sendiri. Dengan latihan yang konsisten, anak anda akan terus berkembang!',
  };
}