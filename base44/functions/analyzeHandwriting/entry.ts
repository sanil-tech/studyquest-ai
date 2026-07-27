import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { image_url, target_text, skill, sub_skill, question_id, student_id } = body;

    if (!image_url || !question_id) {
      return Response.json({ error: 'image_url dan question_id diperlukan' }, { status: 400 });
    }

    // AI handwriting analysis — uses vision to analyze the uploaded handwriting image
    const prompt = `Anda adalah pakar pendidikan awal kanak-kanak dan penilaian tulisan tangan untuk kurikulum KSSR Malaysia.
Analisis gambar tulisan tangan kanak-kanak berumur 6-7 tahun ini.

TEKS SASARAN (apa yang pelajar perlu tulis): "${target_text}"
KEMAHIRAN: ${skill || 'writing'}
SUB-KEMAHIRAN: ${sub_skill || 'general'}

Tugas: Lihat gambar tulisan tangan dan analisis aspek berikut. Berikan dalam JSON:

{
  "letter_recognition": nombor 0-100 (sejauh mana huruf/tulisan boleh dikenal pasti),
  "writing_accuracy": nombor 0-100 (ketepatan pembentukan huruf berbanding sasaran),
  "spacing": nombor 0-100 (kualiti ruang antara huruf/perkataan),
  "alignment": nombor 0-100 (penjajaran tulisan pada garisan),
  "completeness": nombor 0-100 (adakah semua teks sasaran ditulis),
  "overall_score": nombor 0-100 (purata semua aspek di atas),
  "is_correct": boolean (true jika overall_score >= 60),
  "strength": "satu ayat tentang kekuatan tulisan dalam BM (positif, mesra)",
  "needs_practice": "satu ayat tentang apa perlu dilatih dalam BM (mesra, tidak negatif)",
  "educational_feedback": "maklum balas pendidikan 1-2 ayat dalam BM — fokus pada kemahiran menulis, BUKAN keindahan tulisan"
}

PANDUAN PENTING:
- JANGAN nilai keindahan tulisan (handwriting beauty)
- Fokus pada kemahiran menulis: pembentukan huruf, arah, ruang, penjajaran
- Gunakan bahasa positif dan galakan
- Jika gambar tidak jelas atau kosong, beri skor rendah tetapi beri galakan`;

    let aiAnalysis = null;
    try {
      const aiResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt,
        file_urls: [image_url],
        response_json_schema: {
          type: 'object',
          properties: {
            letter_recognition: { type: 'number' },
            writing_accuracy: { type: 'number' },
            spacing: { type: 'number' },
            alignment: { type: 'number' },
            completeness: { type: 'number' },
            overall_score: { type: 'number' },
            is_correct: { type: 'boolean' },
            strength: { type: 'string' },
            needs_practice: { type: 'string' },
            educational_feedback: { type: 'string' },
          },
        },
      });
      aiAnalysis = aiResult;
    } catch (aiErr) {
      console.error('AI handwriting analysis failed:', aiErr.message);
    }

    // Fallback if AI fails
    const result = {
      success: true,
      question_id,
      student_id: student_id || user.id,
      image_url,
      target_text,
      letter_recognition: aiAnalysis?.letter_recognition ?? 0,
      writing_accuracy: aiAnalysis?.writing_accuracy ?? 0,
      spacing: aiAnalysis?.spacing ?? 0,
      alignment: aiAnalysis?.alignment ?? 0,
      completeness: aiAnalysis?.completeness ?? 0,
      overall_score: aiAnalysis?.overall_score ?? 0,
      is_correct: aiAnalysis?.is_correct ?? false,
      strength: aiAnalysis?.strength || 'Pelajar berusaha menulis dengan baik.',
      needs_practice: aiAnalysis?.needs_practice || 'Teruskan latihan menulis untuk meningkatkan kemahiran.',
      educational_feedback: aiAnalysis?.educational_feedback || 'Latihan harian akan membantu pelajar menulis dengan lebih baik.',
    };

    return Response.json(result);
  } catch (error) {
    console.error('analyzeHandwriting error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});