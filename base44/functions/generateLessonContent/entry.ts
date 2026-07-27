// base44/functions/generateLessonContent/entry.ts
// "Generate Once, Store, Reuse" — Admin-triggered bulk AI content generation.
// Generates ALL lesson content in a SINGLE AI call and stores it permanently.
// Students then load stored content with ZERO AI token usage.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);

    // 1. Authenticate — admin or teacher only
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ success: false, error: 'Sesi tidak sah. Sila log masuk.' }, { status: 401 });
    }

    const role = user.app_role || user.role;
    if (role !== 'admin' && role !== 'teacher') {
      return Response.json({ success: false, error: 'Hanya pentadbir/guru dibenarkan.' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const quizId = body.quiz_id || body.quizId;

    if (!quizId) {
      return Response.json({ success: false, error: 'ID kuiz/topik diperlukan.' }, { status: 400 });
    }

    // 2. Fetch the quiz/lesson entity
    const quiz = await base44.entities.Quiz.get(quizId);
    if (!quiz || !quiz.id) {
      return Response.json({ success: false, error: 'Topik tidak dijumpai.' }, { status: 404 });
    }

    // 3. Check if content already generated (prevent unnecessary regeneration)
    const forceRegenerate = body.force === true;
    const hasExistingContent = quiz.lesson_content_status === 'ai_generated' ||
                               quiz.lesson_content_status === 'reviewed' ||
                               quiz.lesson_content_status === 'published';

    if (hasExistingContent && !forceRegenerate) {
      return Response.json({
        success: true,
        message: 'Kandungan AI telah dijana sebelumnya. Gunakan parameter force=true untuk menjana semula.',
        already_exists: true,
        quiz_id: quizId,
      });
    }

    // 4. Generate ALL content in a SINGLE AI call (maximizes token efficiency)
    const topicName = quiz.topic_name || body.topic_name || 'Topik Tidak Diketahui';
    const subjectName = quiz.subject_name || body.subject_name || 'Subjek';
    const formLevel = body.form_level || 'Standard 1';

    const generationPrompt = `Anda adalah pakar pendidikan KSSR Malaysia. Jana kandungan pembelajaran lengkap untuk topik berikut dalam SATU respons JSON.

Topik: ${topicName}
Subjek: ${subjectName}
Tahap: ${formLevel}

Jana SEMUA kandungan berikut dalam Bahasa Melayu:

1. lesson_notes: Nota pelajaran dalam format Markdown — termasuk penjelasan, contoh, ringkasan, dan kata kunci penting.
2. mindmap: Array cabang peta minda [{label, children}] untuk visualisasi topik.
3. ai_explanations: Array penjelasan konsep [{concept, explanation}] untuk konsep utama.
4. common_mistakes: Array kesilapan biasa pelajar [{mistake, correction, explanation}].
5. feedback_library: Array mesej maklum balas [{type: "correct"|"incorrect"|"hint", message}] — 3 mesej untuk setiap jenis (jumlah 9 mesej). Mesej harus mesra, memotivasi, dan sesuai untuk kanak-kanak sekolah rendah.
6. quiz_questions: Array 10 soalan kuiz [{question, options (4 pilihan), correct_answer, explanation, difficulty}] — 5 soalan mudah, 3 sederhana, 2 susah.

Respons mestilah dalam format JSON yang sah.`;

    const aiResponse = await base44.integrations.Core.InvokeLLM({
      prompt: generationPrompt,
      model: body.model || 'gemini_3_flash',
      response_json_schema: {
        type: 'object',
        properties: {
          lesson_notes: { type: 'string', description: 'Nota pelajaran dalam Markdown' },
          mindmap: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                label: { type: 'string' },
                children: { type: 'array', items: { type: 'string' } },
              },
              required: ['label', 'children'],
            },
          },
          ai_explanations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                concept: { type: 'string' },
                explanation: { type: 'string' },
              },
              required: ['concept', 'explanation'],
            },
          },
          common_mistakes: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                mistake: { type: 'string' },
                correction: { type: 'string' },
                explanation: { type: 'string' },
              },
              required: ['mistake', 'correction', 'explanation'],
            },
          },
          feedback_library: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string', enum: ['correct', 'incorrect', 'hint'] },
                message: { type: 'string' },
              },
              required: ['type', 'message'],
            },
          },
          quiz_questions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                question: { type: 'string' },
                options: { type: 'array', items: { type: 'string' } },
                correct_answer: { type: 'string' },
                explanation: { type: 'string' },
                difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
              },
              required: ['question', 'options', 'correct_answer', 'explanation', 'difficulty'],
            },
          },
        },
        required: ['lesson_notes', 'mindmap', 'ai_explanations', 'common_mistakes', 'feedback_library', 'quiz_questions'],
      },
    });

    // 5. Build update payload — store ALL generated content permanently
    const updatePayload: Record<string, any> = {
      lesson_content_status: 'ai_generated',
      content_version: (quiz.content_version || 0) + 1,
      last_generated_date: new Date().toISOString(),
      mindmap_json: JSON.stringify(aiResponse.mindmap || []),
      ai_explanations_json: JSON.stringify(aiResponse.ai_explanations || []),
      common_mistakes_json: JSON.stringify(aiResponse.common_mistakes || []),
      feedback_library_json: JSON.stringify(aiResponse.feedback_library || []),
      voice_script: aiResponse.lesson_notes || '',
    };

    // Only overwrite notes/questions if they don't exist or force=true
    if (!quiz.notes_content || forceRegenerate) {
      updatePayload.notes_content = aiResponse.lesson_notes || '';
    }
    if ((!quiz.questions_json || quiz.questions_json === '[]') || forceRegenerate) {
      updatePayload.questions_json = JSON.stringify(aiResponse.quiz_questions || []);
      updatePayload.num_questions = (aiResponse.quiz_questions || []).length;
    }

    // 6. Save to database
    await base44.entities.Quiz.update(quizId, updatePayload);

    // 7. Log AI usage (non-blocking)
    try {
      const tokenEstimate = Math.ceil(generationPrompt.length / 4) + Math.ceil(JSON.stringify(aiResponse).length / 4);
      await base44.entities.AIUsageLog.create({
        purpose: 'content_generation',
        model: body.model || 'gemini_3_flash',
        tokens_used: tokenEstimate,
        user_id: user.id,
        topic_name: topicName,
        metadata: JSON.stringify({ quiz_id: quizId, content_version: updatePayload.content_version }),
      });
    } catch (logErr) {
      // Logging failure is non-critical
    }

    return Response.json({
      success: true,
      message: 'Kandungan AI berjaya dijana dan disimpan!',
      quiz_id: quizId,
      content_version: updatePayload.content_version,
      generated: {
        mindmap_branches: (aiResponse.mindmap || []).length,
        ai_explanations: (aiResponse.ai_explanations || []).length,
        common_mistakes: (aiResponse.common_mistakes || []).length,
        feedback_messages: (aiResponse.feedback_library || []).length,
        quiz_questions: (aiResponse.quiz_questions || []).length,
      },
    });

  } catch (error: any) {
    console.error('generateLessonContent error:', error);
    return Response.json(
      { success: false, error: error.message || 'Gagal menjana kandungan AI.' },
      { status: 500 }
    );
  }
}