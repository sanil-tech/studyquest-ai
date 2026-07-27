import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

function sanitizeTextForTTS(text: string): string {
  if (!text) return '';
  return text
    .replace(/[^\p{L}\p{N}\s.,?!'()-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Formats text for child-friendly speech:
 * - Short segments with periods create natural pauses, slowing delivery
 * - Adds gentle filler words ("Mari kita tengok.") at the start for warmth
 * - Splits long sentences into bite-sized chunks
 */
function formatForChildSpeech(text: string): string {
  if (!text) return '';
  let t = text.trim();

  // Add a gentle intro pause if the text is short (single word/number)
  if (t.length <= 12 && !t.includes('.')) {
    return `Mari kita tengok. ${t}.`;
  }

  // Insert pauses after question words/phrases to slow delivery
  t = t.replace(/,/g, '.');
  // Ensure ends with a period for a calm finish
  if (!t.endsWith('.') && !t.endsWith('?') && !t.endsWith('!')) {
    t += '.';
  }
  return t;
}

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

    // Sanitize text — remove emojis and irrelevant symbols before TTS
    const cleanText = sanitizeTextForTTS(target_text);

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
    //    Voice 'honey' = warm, soft — ideal for young children (6-7 years)
    //    Text is broken into short segments with periods to slow down delivery
    const childFriendlyText = formatForChildSpeech(cleanText);
    const ttsResult = await base44.integrations.Core.GenerateSpeech({
      text: childFriendlyText,
      voice: 'honey',
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
      target_text: cleanText,
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