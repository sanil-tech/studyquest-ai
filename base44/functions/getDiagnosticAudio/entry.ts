import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const db = base44.asServiceRole || base44;

    const body = await req.json();
    const { question_id, target_text, module_id } = body;

    if (!question_id || !target_text) {
      return Response.json(
        { success: false, error: 'question_id dan target_text diperlukan.' },
        { status: 400 }
      );
    }

    // 1. Check if audio already exists in cache
    const existing = await db.entities.DiagnosticAudioCache.filter({ question_id });
    if (existing && existing.length > 0 && existing[0].audio_url) {
      return Response.json({
        success: true,
        audio_url: existing[0].audio_url,
        cached: true,
      });
    }

    // 2. Generate TTS audio (only once per question — cached for all students)
    const ttsResult = await base44.integrations.Core.GenerateSpeech({
      text: target_text,
      voice: 'sunny',
      language_code: 'ms',
    });

    const audio_url = ttsResult.url;

    if (!audio_url) {
      throw new Error('Gagal menjana audio TTS.');
    }

    // 3. Store in cache so all students reuse the same audio
    await db.entities.DiagnosticAudioCache.create({
      question_id,
      audio_url,
      target_text,
      module_id: module_id || '',
    });

    return Response.json({
      success: true,
      audio_url,
      cached: false,
    });
  } catch (error) {
    console.error('GetDiagnosticAudio Error:', error);
    return Response.json(
      { success: false, error: error.message || 'Ralat pelayan.' },
      { status: 500 }
    );
  }
}