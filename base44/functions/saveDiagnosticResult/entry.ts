import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const db = base44.asServiceRole || base44;

    const body = await req.json();
    const { student_id, results } = body;

    if (!student_id || !results) {
      return Response.json(
        { success: false, error: 'student_id dan results diperlukan.' },
        { status: 400 }
      );
    }

    // 1. Create diagnostic session
    const session = await db.entities.BasicDiagnosticSession.create({
      student_id,
      date: new Date().toISOString(),
      status: 'completed',
      reading_level: results.membaca?.level || 1,
      writing_level: results.menulis?.level || 1,
      numeracy_level: results.mengira?.level || 1,
      reading_mastery: results.membaca?.mastery || 'developing',
      writing_mastery: results.menulis?.mastery || 'developing',
      numeracy_mastery: results.mengira?.mastery || 'developing',
      total_score: results.totalScore || 0,
    });

    const sessionId = session.id || (Array.isArray(session) ? session[0]?.id : null);

    if (!sessionId) {
      throw new Error('Gagal mencipta sesi diagnostik.');
    }

    // 2. Create skill results in bulk
    const skillDetails = results.skillDetails || [];
    if (skillDetails.length > 0) {
      await db.entities.DiagnosticSkillResult.bulkCreate(
        skillDetails.map((s: any) => ({
          student_id,
          session_id: sessionId,
          skill_category: s.category,
          skill_name: s.skill,
          skill_display_name: s.skillDisplayName || s.skill,
          mastery_level: s.mastery,
          score: s.score,
          level_achieved: s.level,
          recommendation: s.recommendation || '',
        }))
      );
    }

    // 3. Generate AI analysis (one-time call — not per question)
    let aiResult = null;
    try {
      const skillSummary = skillDetails.map((s: any) =>
        `- ${s.category} - ${s.skillDisplayName || s.skill}: Tahap ${s.level}, Skor ${s.score}%, Penguasaan: ${s.mastery}`
      ).join('\n');

      const uploadedImages = results.uploadedImages || [];
      const imageUrls = uploadedImages.map((img: any) => img.imageUrl).filter(Boolean);

      let imageContext = '';
      if (uploadedImages.length > 0) {
        const imgList = uploadedImages.map((img: any) =>
          `- Modul ${img.category} - ${img.skillDisplayName || img.skill}: Diminta tulis "${img.target}"`
        ).join('\n');
        imageContext = `\n\nGAMBAR TULISAN TANGAN PELAJAR (dilampirkan untuk semakan AI):\n${imgList}\n\nSila juga nilai tulisan tangan pelajar dari gambar yang dilampirkan. Berikan komen tentang kemasan, bentuk huruf, ejaan, dan ruang menulis. Masukkan dalam field "handwriting_review".`;
      }

      const prompt = `Anda adalah pakar pendidikan awal kanak-kanak dan kurikulum KSSR Malaysia. Analisis hasil diagnostik pelajar berikut.

PROFIL PELAJAR:
- Membaca: Tahap ${results.membaca?.level || 1}/6, Penguasaan: ${results.membaca?.mastery || 'developing'}
- Menulis: Tahap ${results.menulis?.level || 1}/6, Penguasaan: ${results.menulis?.mastery || 'developing'}
- Mengira: Tahap ${results.mengira?.level || 1}/4, Penguasaan: ${results.mengira?.mastery || 'developing'}
- Skor Keseluruhan: ${results.totalScore || 0}%

KEPUTUSAN KEMAHIRAAN TERPERINCI:
${skillSummary || 'Tiada data terperinci.'}${imageContext}

Jana analisis dalam Bahasa Melayu. Gunakan bahasa yang positif, menyokong, dan menggalakkan.

PENTING:
- Gunakan bahasa yang positif dan menyokong
- JANGAN diagnosis kecacatan pembelajaran
- JANGAN label pelajar secara negatif
- Fokus pada perkara yang pelajar BOLEH buat dan cara untuk berkembang
- Setiap kelemahan harus disertai dengan cadangan aktiviti yang konkrit`;

      aiResult = await base44.integrations.Core.InvokeLLM({
        prompt,
        file_urls: imageUrls.length > 0 ? imageUrls : undefined,
        response_json_schema: {
          type: "object",
          properties: {
            strengths: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  skill: { type: "string" },
                  description: { type: "string" }
                },
                required: ["skill", "description"]
              }
            },
            weaknesses: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  skill: { type: "string" },
                  description: { type: "string" }
                },
                required: ["skill", "description"]
              }
            },
            recommended_starting_point: { type: "string" },
            recommended_activities: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  activity: { type: "string" },
                  purpose: { type: "string" }
                },
                required: ["activity", "purpose"]
              }
            },
            parent_insight: { type: "string" },
            handwriting_review: { type: "string" }
          },
          required: ["strengths", "weaknesses", "recommended_starting_point", "recommended_activities", "parent_insight"]
        },
        model: "gemini_3_flash",
      });

      // Update session with AI analysis
      await db.entities.BasicDiagnosticSession.update(sessionId, {
        ai_analysis: JSON.stringify(aiResult),
        recommended_starting_point: aiResult.recommended_starting_point || '',
        recommended_activities: JSON.stringify(aiResult.recommended_activities || []),
      });
    } catch (aiError) {
      console.error('AI Analysis failed:', aiError);
      // Session is still saved with levels and mastery — just no AI analysis
    }

    return Response.json({
      success: true,
      session_id: sessionId,
      analysis: aiResult,
    });
  } catch (error) {
    console.error('SaveDiagnosticResult Error:', error);
    return Response.json(
      { success: false, error: error.message || 'Ralat pelayan.' },
      { status: 500 }
    );
  }
}