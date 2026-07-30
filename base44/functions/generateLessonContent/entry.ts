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

1. lesson_notes: Nota pelajaran dalam format Markdown — termasuk penjelasan, contoh, ringkasan, dan kata kunci penting. Ini adalah RUJUKAN UTAMA untuk semua kandungan lain di bawah.

2. mindmap: Array cabang peta minda [{label, children}] untuk visualisasi topik. Berdasarkan konsep dalam lesson_notes.

3. ai_explanations: Array penjelasan konsep [{concept, explanation}] untuk konsep utama dari lesson_notes.

4. common_mistakes: Array kesilapan biasa pelajar [{mistake, correction, explanation}] berdasarkan konsep dalam lesson_notes.

5. feedback_library: Array mesej maklum balas [{type: "correct"|"incorrect"|"hint", message}] — 3 mesej untuk setiap jenis (jumlah 9 mesej). Mesej harus mesra, memotivasi, dan sesuai untuk kanak-kanak sekolah rendah.

6. quiz_questions: Array 10 soalan kuiz [{question, options (4 pilihan), correct_answer, explanation, difficulty}] — 5 soalan mudah, 3 sederhana, 2 susah.
   ⚠️ PENTING: Setiap soalan MESTI berdasarkan kandungan lesson_notes di atas. Soalan harus menguji konsep, fakta, atau contoh yang secara spesifik diajar dalam nota. JANGAN jana soalan generik tentang topik — rujuk nota yang anda tulis. Pilihan jawapan harus termasuk kesilapan biasa dari common_mistakes sebagai pengganggu (distractors).

7. game_content: Kandungan permainan pendidikan berdasarkan lesson_notes. Setiap permainan MESTI menggunakan konsep, contoh, dan kosa kata dari nota.
   - matching_game: { pairs: [{left, right}] } — 5 pasangan padanan berdasarkan konsep dari nota (contoh: istilah ↔ definisi, soalan ↔ jawapan, gambar ↔ perkataan).
   - sorting_game: { categories: [2 string], items: [{value, category}] } — 6 item untuk disusun kepada 2 kategori berdasarkan konsep dari nota.
   - word_builder_game: { words: [{word, syllables: [string]}] } — 4 perkataan kunci dari nota untuk ejaan.
   - flashcards: [{front, back}] — 6 kad kilat berdasarkan fakta penting dari nota.

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
          game_content: {
            type: 'object',
            properties: {
              matching_game: {
                type: 'object',
                properties: {
                  pairs: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        left: { type: 'string' },
                        right: { type: 'string' },
                      },
                      required: ['left', 'right'],
                    },
                  },
                },
                required: ['pairs'],
              },
              sorting_game: {
                type: 'object',
                properties: {
                  categories: { type: 'array', items: { type: 'string' } },
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        value: { type: 'string' },
                        category: { type: 'string' },
                      },
                      required: ['value', 'category'],
                    },
                  },
                },
                required: ['categories', 'items'],
              },
              word_builder_game: {
                type: 'object',
                properties: {
                  words: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        word: { type: 'string' },
                        syllables: { type: 'array', items: { type: 'string' } },
                      },
                      required: ['word', 'syllables'],
                    },
                  },
                },
                required: ['words'],
              },
              flashcards: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    front: { type: 'string' },
                    back: { type: 'string' },
                  },
                  required: ['front', 'back'],
                },
              },
            },
          },
        },
        required: ['lesson_notes', 'mindmap', 'ai_explanations', 'common_mistakes', 'feedback_library', 'quiz_questions', 'game_content'],
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

    // 6b. Create EducationalGame records from generated game content
    let gamesCreated = 0;
    try {
      const gameContent = aiResponse.game_content || {};
      const formLevelForGame = body.form_level || 'All Levels';

      // Delete existing AI-generated games for this topic to avoid duplicates
      await base44.entities.EducationalGame.deleteMany({
        topic_name: topicName,
        subject: subjectName,
      }).catch(() => {});

      const gamesToCreate = [];

      if (gameContent.matching_game?.pairs?.length > 0) {
        gamesToCreate.push({
          game_name: `Padanan: ${topicName}`,
          game_type: 'matching',
          subject: subjectName,
          form_level: formLevelForGame,
          topic_name: topicName,
          skill: 'Konsep padanan',
          difficulty: 'easy',
          instructions: 'Padankan item yang betul berdasarkan apa yang kamu belajar!',
          game_data: JSON.stringify(gameContent.matching_game),
          reward_xp: 20,
          reward_coins: 5,
          is_active: true,
        });
      }

      if (gameContent.sorting_game?.items?.length > 0) {
        gamesToCreate.push({
          game_name: `Susun: ${topicName}`,
          game_type: 'sorting',
          subject: subjectName,
          form_level: formLevelForGame,
          topic_name: topicName,
          skill: 'Pengkelasan konsep',
          difficulty: 'easy',
          instructions: 'Susun item kepada kategori yang betul!',
          game_data: JSON.stringify(gameContent.sorting_game),
          reward_xp: 25,
          reward_coins: 5,
          is_active: true,
        });
      }

      if (gameContent.word_builder_game?.words?.length > 0) {
        gamesToCreate.push({
          game_name: `Eja: ${topicName}`,
          game_type: 'word_builder',
          subject: subjectName,
          form_level: formLevelForGame,
          topic_name: topicName,
          skill: 'Ejaan dan kosa kata',
          difficulty: 'easy',
          instructions: 'Susun huruf untuk membina perkataan!',
          game_data: JSON.stringify(gameContent.word_builder_game),
          reward_xp: 25,
          reward_coins: 5,
          is_active: true,
        });
      }

      if (gameContent.flashcards?.length > 0) {
        gamesToCreate.push({
          game_name: `Kad Kilat: ${topicName}`,
          game_type: 'matching',
          subject: subjectName,
          form_level: formLevelForGame,
          topic_name: topicName,
          skill: 'Ingatan dan fakta',
          difficulty: 'easy',
          instructions: 'Semak kad kilat untuk mengingat fakta penting!',
          game_data: JSON.stringify({ flashcards: gameContent.flashcards }),
          reward_xp: 15,
          reward_coins: 3,
          is_active: true,
        });
      }

      if (gamesToCreate.length > 0) {
        await base44.entities.EducationalGame.bulkCreate(gamesToCreate);
        gamesCreated = gamesToCreate.length;
      }
    } catch (gameErr) {
      console.error('Game creation failed:', gameErr);
    }

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
        games_created: gamesCreated,
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