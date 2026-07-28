import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    // Auth optional — child PIN login has no Base44 token
    const authUser = await base44.auth.me().catch(() => null);

    const body = await req.json();
    const { audio_url, target_text, transcript, skill, sub_skill, question_id, student_id } = body;

    if (!target_text || !question_id) {
      return Response.json({ error: 'target_text dan question_id diperlukan' }, { status: 400 });
    }

    // Step 1: If no transcript provided, transcribe the audio
    let transcriptText = transcript || '';
    if (!transcriptText && audio_url) {
      try {
        const transcribeResult = await base44.integrations.Core.TranscribeAudio({ audio_url });
        transcriptText = (transcribeResult || '').trim();
      } catch (e) {
        console.error('Transcription failed:', e.message);
      }
    }

    // Step 2: Calculate basic accuracy from transcript
    const targetWords = target_text.toLowerCase().trim().split(/\s+/).filter((w) => w.length > 0);
    const transcriptWords = transcriptText.toLowerCase().trim().split(/\s+/).filter((w) => w.length > 0);
    let matched = 0;
    for (const tw of targetWords) {
      const found = transcriptWords.some(
        (w) => w === tw || w.includes(tw) || tw.includes(w) ||
          (tw.length > 3 && (w.startsWith(tw.slice(0, 3)) || tw.startsWith(w.slice(0, 3))))
      );
      if (found) matched++;
    }
    const accuracyScore = targetWords.length > 0 ? Math.round((matched / targetWords.length) * 100) : 0;

    // Step 3: AI analysis of pronunciation patterns (token-optimized — text comparison only)
    let aiAnalysis = null;
    try {
      const prompt = `Anda adalah pakar pedagogi bahasa Melayu untuk kanak-kanak berumur 6-7 tahun.
Analisis bacaan suara pelajar berikut.

TEKS SASARAN: "${target_text}"
TRANSCRIPT BACAAN PELAJAR: "${transcriptText}"
SKOR PADANAN: ${accuracyScore}%
KEMAHIRAN: ${skill || 'reading'}
SUB-KEMAHIRAN: ${sub_skill || 'general'}

Analisis dan berikan dalam JSON:
{
  "pronunciation_accuracy": nombor 0-100 (ketepatan sebutan berdasarkan padanan transcript),
  "fluency_score": nombor 0-100 (kefasihan bacaan — berdasarkan bilangan perkataan berjaya vs sasaran),
  "confidence": nombor 0-100 (tahap keyakinan anggaran — lebih banyak perkataan tepat = lebih yakin),
  "is_correct": boolean (true jika accuracy >= 70),
  "strength": "satu ayat tentang kekuatan bacaan pelajar dalam BM (positif, mesra)",
  "needs_practice": "satu ayat tentang apa perlu dilatih dalam BM (mesra, tidak negatif)",
  "educational_feedback": "maklum balas pendidikan 1-2 ayat dalam BM — fokus pada kemahiran, BUKAN gangguan pertuturan"
}

PANDUAN PENTING:
- JANGAN label gangguan pertuturan atau kecacatan pembelajaran
- Berikan maklum balas pendidikan sahaja
- Gunakan bahasa positif dan galakan
- Jika transcript kosong, anggap pelajar mungkin malu/malu-malu — beri galakan`;

      const aiResult = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            pronunciation_accuracy: { type: 'number' },
            fluency_score: { type: 'number' },
            confidence: { type: 'number' },
            is_correct: { type: 'boolean' },
            strength: { type: 'string' },
            needs_practice: { type: 'string' },
            educational_feedback: { type: 'string' },
          },
        },
      });

      aiAnalysis = aiResult;
    } catch (aiErr) {
      console.error('AI voice analysis failed:', aiErr.message);
    }

    // Step 4: Build final result (fallback if AI fails)
    const result = {
      success: true,
      question_id,
      student_id: student_id || (authUser ? authUser.id : null),
      transcript: transcriptText,
      target_text,
      accuracy: accuracyScore,
      pronunciation_accuracy: aiAnalysis?.pronunciation_accuracy ?? accuracyScore,
      fluency_score: aiAnalysis?.fluency_score ?? accuracyScore,
      confidence: aiAnalysis?.confidence ?? (accuracyScore >= 70 ? 80 : 40),
      is_correct: aiAnalysis?.is_correct ?? (accuracyScore >= 70),
      strength: aiAnalysis?.strength || `Pelajar berjaya membaca ${matched} daripada ${targetWords.length} perkataan.`,
      needs_practice: aiAnalysis?.needs_practice || 'Teruskan latihan bacaan untuk meningkatkan kefasihan.',
      educational_feedback: aiAnalysis?.educational_feedback || 'Latihan harian akan membantu pelajar membaca dengan lebih lancer.',
      audio_url: audio_url || null,
    };

    // Step 5: Cache the analysis for the session
    try {
      await base44.asServiceRole.entities.DiagnosticResponse.update(
        await findResponseRecord(base44, student_id || (authUser ? authUser.id : null), question_id),
        {
          answer: transcriptText,
          is_correct: result.is_correct,
          score: result.is_correct ? 1 : 0,
          ai_reviewed: true,
        }
      ).catch(() => {});
    } catch (e) {
      // Non-critical
    }

    return Response.json(result);
  } catch (error) {
    console.error('analyzeReadingVoice error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function findResponseRecord(base44, studentId, questionId) {
  try {
    const records = await base44.asServiceRole.entities.DiagnosticResponse.filter({
      student_id: studentId,
      question_id: questionId,
    });
    return records && records.length > 0 ? records[0].id : null;
  } catch {
    return null;
  }
}