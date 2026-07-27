// base44/functions/generateModularLessonContent/entry.ts
// "Generate Once, Store, Reuse" — Admin-triggered AI content generation for MODULAR entities.
// Generates ALL lesson content in a SINGLE AI call and stores it across modular entities.
// Students then load stored content via getLessonContent with ZERO AI token usage.

import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // 1. Authenticate — admin or teacher only
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ success: false, error: "Sesi tidak sah. Sila log masuk." }, { status: 401 });
    }

    const role = user.app_role || user.role;
    const isAdmin = role === "admin" || role === "teacher" || user.is_admin === true;
    if (!isAdmin) {
      return Response.json({ success: false, error: "Hanya pentadbir/guru dibenarkan." }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const topicId = body.topic_id;
    const lessonIdParam = body.lesson_id;
    const forceRegenerate = body.force === true;

    if (!topicId) {
      return Response.json({ success: false, error: "topic_id diperlukan." }, { status: 400 });
    }

    // 2. Fetch topic metadata
    const topic = await base44.asServiceRole.entities.Topic.get(topicId).catch(() => null);
    const subject = topic?.subject_id
      ? await base44.asServiceRole.entities.Subject.get(topic.subject_id).catch(() => null)
      : null;

    const topicName = body.topic_name || topic?.name || "Topik Tidak Diketahui";
    const subjectName = body.subject_name || subject?.name || "Subjek";
    const formLevel = body.form_level || topic?.form_level || "Tahun 1";

    // 3. Find or create Lesson record
    let lesson: any = null;

    if (lessonIdParam) {
      lesson = await base44.asServiceRole.entities.Lesson.get(lessonIdParam).catch(() => null);
    }

    if (!lesson) {
      const existing = await base44.asServiceRole.entities.Lesson.filter({ topic_id: topicId });
      lesson = existing && existing.length > 0 ? existing[0] : null;
    }

    // Check if content already generated
    if (lesson && !forceRegenerate) {
      const hasContent = lesson.content_status === "ai_generated" ||
                         lesson.content_status === "reviewed" ||
                         lesson.content_status === "published";
      if (hasContent) {
        return Response.json({
          success: true,
          message: "Kandungan AI telah dijana sebelumnya. Gunakan parameter force=true untuk menjana semula.",
          already_exists: true,
          lesson_id: lesson.id,
        });
      }
    }

    // Create new Lesson record if none exists
    if (!lesson) {
      lesson = await base44.asServiceRole.entities.Lesson.create({
        topic_id: topicId,
        subject_name: subjectName,
        topic_name: topicName,
        video_url: body.video_url || "",
        version: 1,
        content_status: "draft",
        generated_by: user.id,
      });
    }

    const lessonId = lesson.id;

    // 4. If force regeneration, delete old modular content
    if (forceRegenerate) {
      await Promise.all([
        base44.asServiceRole.entities.LessonNotes.deleteMany({ lesson_id: lessonId }).catch(() => {}),
        base44.asServiceRole.entities.MindMap.deleteMany({ lesson_id: lessonId }).catch(() => {}),
        base44.asServiceRole.entities.FeedbackMessage.deleteMany({ lesson_id: lessonId }).catch(() => {}),
        base44.asServiceRole.entities.CommonMistake.deleteMany({ lesson_id: lessonId }).catch(() => {}),
        base44.asServiceRole.entities.AIExplanation.deleteMany({ lesson_id: lessonId }).catch(() => {}),
        base44.asServiceRole.entities.Flashcard.deleteMany({ lesson_id: lessonId }).catch(() => {}),
        base44.asServiceRole.entities.LearningActivity.deleteMany({ lesson_id: lessonId }).catch(() => {}),
      ]);

      // Delete QuestionOptions first, then QuestionBank (options reference question_id)
      const oldQuestions = await base44.asServiceRole.entities.QuestionBank.filter({ lesson_id: lessonId });
      if (oldQuestions.length > 0) {
        for (const q of oldQuestions) {
          await base44.asServiceRole.entities.QuestionOption.deleteMany({ question_id: q.question_id }).catch(() => {});
        }
        await base44.asServiceRole.entities.QuestionBank.deleteMany({ lesson_id: lessonId }).catch(() => {});
      }
    }

    // 5. Generate ALL content in a SINGLE AI call
    const generationPrompt = `Anda adalah pakar pendidikan KSSR/KSSM Malaysia. Jana kandungan pembelajaran lengkap untuk topik berikut dalam SATU respons JSON.

Topik: ${topicName}
Subjek: ${subjectName}
Tahap: ${formLevel}

Jana SEMUA kandungan berikut dalam Bahasa Melayu:

1. lesson_notes: Nota pelajaran dalam format Markdown — termasuk penjelasan, contoh, ringkasan, dan kata kunci penting. Ini adalah RUJUKAN UTAMA untuk semua kandungan lain di bawah.

2. revision_summary: Ringkasan ringkas (1-2 perenggan) untuk ulang kaji cepat.

3. teacher_notes: Nota tambahan untuk guru — strategi pengajaran dan cadangan aktiviti.

4. learning_objective: Objektif pembelajaran utama untuk pelajaran ini (1 ayat).

5. teaching_strategy: Strategi pengajaran yang dicadangkan untuk topik ini.

6. mindmap: Array cabang peta minda [{label, children}] untuk visualisasi topik. Berdasarkan konsep dalam lesson_notes.

7. ai_explanations: Array penjelasan konsep [{concept, explanation}] untuk konsep utama dari lesson_notes.

8. common_mistakes: Array kesilapan biasa pelajar [{mistake, correction, explanation}] berdasarkan konsep dalam lesson_notes.

9. feedback_library: Array mesej maklum balas [{type: "correct"|"incorrect"|"hint"|"encouragement", message}] — 3 mesej untuk setiap jenis (jumlah 12 mesej). Mesej harus mesra, memotivasi, dan sesuai untuk kanak-kanak sekolah rendah.

10. quiz_questions: Array 10 soalan kuiz [{question, options (4 pilihan), correct_answer, explanation, difficulty}] — 5 soalan mudah, 3 sederhana, 2 susah.
   ⚠️ PENTING: Setiap soalan MESTI berdasarkan kandungan lesson_notes di atas. Soalan harus menguji konsep, fakta, atau contoh yang secara spesifik diajar dalam nota. JANGAN jana soalan generik tentang topik — rujuk nota yang anda tulis. Pilihan jawapan harus termasuk kesilapan biasa dari common_mistakes sebagai pengganggu (distractors).

11. flashcards: Array 6 kad kilat [{front, back}] berdasarkan fakta penting dari nota.

12. game_content: Kandungan permainan pendidikan berdasarkan lesson_notes. Setiap permainan MESTI menggunakan konsep, contoh, dan kosa kata dari nota.
    - matching_game: { pairs: [{left, right}] } — 5 pasangan padanan.
    - sorting_game: { categories: [2 string], items: [{value, category}] } — 6 item untuk 2 kategori.
    - word_builder_game: { words: [{word, syllables: [string]}] } — 4 perkataan kunci untuk ejaan.

Respons mestilah dalam format JSON yang sah.`;

    const aiResponse = await base44.integrations.Core.InvokeLLM({
      prompt: generationPrompt,
      model: body.model || "gemini_3_flash",
      response_json_schema: {
        type: "object",
        properties: {
          lesson_notes: { type: "string", description: "Nota pelajaran dalam Markdown" },
          revision_summary: { type: "string", description: "Ringkasan ulang kaji" },
          teacher_notes: { type: "string", description: "Nota untuk guru" },
          learning_objective: { type: "string", description: "Objektif pembelajaran" },
          teaching_strategy: { type: "string", description: "Strategi pengajaran" },
          mindmap: {
            type: "array",
            items: {
              type: "object",
              properties: {
                label: { type: "string" },
                children: { type: "array", items: { type: "string" } },
              },
              required: ["label", "children"],
            },
          },
          ai_explanations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                concept: { type: "string" },
                explanation: { type: "string" },
              },
              required: ["concept", "explanation"],
            },
          },
          common_mistakes: {
            type: "array",
            items: {
              type: "object",
              properties: {
                mistake: { type: "string" },
                correction: { type: "string" },
                explanation: { type: "string" },
              },
              required: ["mistake", "correction", "explanation"],
            },
          },
          feedback_library: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: { type: "string", enum: ["correct", "incorrect", "hint", "encouragement"] },
                message: { type: "string" },
              },
              required: ["type", "message"],
            },
          },
          quiz_questions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                question: { type: "string" },
                options: { type: "array", items: { type: "string" } },
                correct_answer: { type: "string" },
                explanation: { type: "string" },
                difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
              },
              required: ["question", "options", "correct_answer", "explanation", "difficulty"],
            },
          },
          flashcards: {
            type: "array",
            items: {
              type: "object",
              properties: {
                front: { type: "string" },
                back: { type: "string" },
              },
              required: ["front", "back"],
            },
          },
          game_content: {
            type: "object",
            properties: {
              matching_game: {
                type: "object",
                properties: {
                  pairs: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: { left: { type: "string" }, right: { type: "string" } },
                      required: ["left", "right"],
                    },
                  },
                },
                required: ["pairs"],
              },
              sorting_game: {
                type: "object",
                properties: {
                  categories: { type: "array", items: { type: "string" } },
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: { value: { type: "string" }, category: { type: "string" } },
                      required: ["value", "category"],
                    },
                  },
                },
                required: ["categories", "items"],
              },
              word_builder_game: {
                type: "object",
                properties: {
                  words: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: { word: { type: "string" }, syllables: { type: "array", items: { type: "string" } } },
                      required: ["word", "syllables"],
                    },
                  },
                },
                required: ["words"],
              },
            },
          },
        },
        required: ["lesson_notes", "revision_summary", "teacher_notes", "learning_objective", "teaching_strategy", "mindmap", "ai_explanations", "common_mistakes", "feedback_library", "quiz_questions", "flashcards", "game_content"],
      },
    });

    // 6. Store content in modular entities using bulkCreate

    // 6a. LessonNotes
    await base44.asServiceRole.entities.LessonNotes.create({
      lesson_id: lessonId,
      notes_markdown: aiResponse.lesson_notes || "",
      teacher_notes: aiResponse.teacher_notes || "",
      revision_summary: aiResponse.revision_summary || "",
      voice_script: aiResponse.lesson_notes || "",
    });

    // 6b. MindMap
    const mindmapBranches = aiResponse.mindmap || [];
    if (mindmapBranches.length > 0) {
      await base44.asServiceRole.entities.MindMap.create({
        lesson_id: lessonId,
        branches_json: JSON.stringify(mindmapBranches),
      });
    }

    // 6c. TeacherGuide
    await base44.asServiceRole.entities.TeacherGuide.create({
      lesson_id: lessonId,
      learning_objective: aiResponse.learning_objective || "",
      teaching_strategy: aiResponse.teaching_strategy || "",
    });

    // 6d. AIExplanations
    const explanations = aiResponse.ai_explanations || [];
    if (explanations.length > 0) {
      await base44.asServiceRole.entities.AIExplanation.bulkCreate(
        explanations.map((e: any) => ({
          lesson_id: lessonId,
          concept: e.concept || "",
          explanation: e.explanation || "",
        }))
      );
    }

    // 6e. CommonMistakes
    const mistakes = aiResponse.common_mistakes || [];
    if (mistakes.length > 0) {
      await base44.asServiceRole.entities.CommonMistake.bulkCreate(
        mistakes.map((m: any) => ({
          lesson_id: lessonId,
          mistake: m.mistake || "",
          correction: m.correction || "",
          explanation: m.explanation || "",
        }))
      );
    }

    // 6f. FeedbackMessages
    const feedback = aiResponse.feedback_library || [];
    if (feedback.length > 0) {
      await base44.asServiceRole.entities.FeedbackMessage.bulkCreate(
        feedback.map((f: any) => ({
          lesson_id: lessonId,
          feedback_type: f.type || "correct",
          message: f.message || "",
        }))
      );
    }

    // 6g. Flashcards
    const flashcards = aiResponse.flashcards || [];
    if (flashcards.length > 0) {
      await base44.asServiceRole.entities.Flashcard.bulkCreate(
        flashcards.map((fc: any, i: number) => ({
          lesson_id: lessonId,
          topic_id: topicId,
          front: fc.front || "",
          back: fc.back || "",
          sort_order: i,
        }))
      );
    }

    // 6h. QuestionBank + QuestionOptions
    const quizQuestions = aiResponse.quiz_questions || [];
    if (quizQuestions.length > 0) {
      const qbRecords = [];
      const optRecords = [];

      for (let i = 0; i < quizQuestions.length; i++) {
        const q = quizQuestions[i];
        const questionId = `qb_${lessonId}_${i + 1}`;
        const labels = ["A", "B", "C", "D", "E", "F"];

        qbRecords.push({
          lesson_id: lessonId,
          topic_id: topicId,
          question_id: questionId,
          question: q.question || "",
          correct_answer: q.correct_answer || "A",
          explanation: q.explanation || "",
          difficulty: q.difficulty || "medium",
          quiz_type: "practice",
        });

        if (Array.isArray(q.options)) {
          for (let j = 0; j < q.options.length; j++) {
            optRecords.push({
              question_id: questionId,
              label: labels[j] || String(j),
              text: q.options[j] || "",
              sort_order: j,
            });
          }
        }
      }

      await base44.asServiceRole.entities.QuestionBank.bulkCreate(qbRecords);
      if (optRecords.length > 0) {
        await base44.asServiceRole.entities.QuestionOption.bulkCreate(optRecords);
      }
    }

    // 6i. LearningActivities (from game content)
    const gameContent = aiResponse.game_content || {};
    const activitiesToCreate = [];

    if (gameContent.matching_game?.pairs?.length > 0) {
      activitiesToCreate.push({
        lesson_id: lessonId,
        activity_type: "matching",
        activity_data_json: JSON.stringify(gameContent.matching_game),
        instructions: "Padankan item yang betul berdasarkan apa yang kamu belajar!",
      });
    }
    if (gameContent.sorting_game?.items?.length > 0) {
      activitiesToCreate.push({
        lesson_id: lessonId,
        activity_type: "sorting",
        activity_data_json: JSON.stringify(gameContent.sorting_game),
        instructions: "Susun item kepada kategori yang betul!",
      });
    }
    if (gameContent.word_builder_game?.words?.length > 0) {
      activitiesToCreate.push({
        lesson_id: lessonId,
        activity_type: "word_builder",
        activity_data_json: JSON.stringify(gameContent.word_builder_game),
        instructions: "Susun huruf untuk membina perkataan!",
      });
    }
    if (activitiesToCreate.length > 0) {
      await base44.asServiceRole.entities.LearningActivity.bulkCreate(activitiesToCreate);
    }

    // 6j. Also create EducationalGame records (for backward compat with GameHub)
    let gamesCreated = 0;
    try {
      await base44.asServiceRole.entities.EducationalGame.deleteMany({
        topic_name: topicName,
        subject: subjectName,
      }).catch(() => {});

      const gamesToCreate = [];
      if (gameContent.matching_game?.pairs?.length > 0) {
        gamesToCreate.push({
          game_name: `Padanan: ${topicName}`,
          game_type: "matching",
          subject: subjectName,
          form_level: formLevel,
          topic_name: topicName,
          skill: "Konsep padanan",
          difficulty: "easy",
          instructions: "Padankan item yang betul berdasarkan apa yang kamu belajar!",
          game_data: JSON.stringify(gameContent.matching_game),
          reward_xp: 20,
          reward_coins: 5,
          is_active: true,
        });
      }
      if (gameContent.sorting_game?.items?.length > 0) {
        gamesToCreate.push({
          game_name: `Susun: ${topicName}`,
          game_type: "sorting",
          subject: subjectName,
          form_level: formLevel,
          topic_name: topicName,
          skill: "Pengkelasan konsep",
          difficulty: "easy",
          instructions: "Susun item kepada kategori yang betul!",
          game_data: JSON.stringify(gameContent.sorting_game),
          reward_xp: 25,
          reward_coins: 5,
          is_active: true,
        });
      }
      if (gameContent.word_builder_game?.words?.length > 0) {
        gamesToCreate.push({
          game_name: `Eja: ${topicName}`,
          game_type: "word_builder",
          subject: subjectName,
          form_level: formLevel,
          topic_name: topicName,
          skill: "Ejaan dan kosa kata",
          difficulty: "easy",
          instructions: "Susun huruf untuk membina perkataan!",
          game_data: JSON.stringify(gameContent.word_builder_game),
          reward_xp: 25,
          reward_coins: 5,
          is_active: true,
        });
      }
      if (flashcards.length > 0) {
        gamesToCreate.push({
          game_name: `Kad Kilat: ${topicName}`,
          game_type: "matching",
          subject: subjectName,
          form_level: formLevel,
          topic_name: topicName,
          skill: "Ingatan dan fakta",
          difficulty: "easy",
          instructions: "Semak kad kilat untuk mengingat fakta penting!",
          game_data: JSON.stringify({ flashcards }),
          reward_xp: 15,
          reward_coins: 3,
          is_active: true,
        });
      }
      if (gamesToCreate.length > 0) {
        await base44.asServiceRole.entities.EducationalGame.bulkCreate(gamesToCreate);
        gamesCreated = gamesToCreate.length;
      }
    } catch (gameErr) {
      console.error("Game creation failed:", gameErr);
    }

    // 7. Update Lesson status
    const newVersion = (lesson.version || 0) + 1;
    await base44.asServiceRole.entities.Lesson.update(lessonId, {
      content_status: "ai_generated",
      version: newVersion,
      generated_by: user.id,
    });

    // 8. Log AI usage (non-blocking)
    try {
      const tokenEstimate = Math.ceil(generationPrompt.length / 4) + Math.ceil(JSON.stringify(aiResponse).length / 4);
      await base44.asServiceRole.entities.AIUsageLog.create({
        purpose: "content_generation",
        model: body.model || "gemini_3_flash",
        tokens_used: tokenEstimate,
        user_id: user.id,
        topic_name: topicName,
        metadata: JSON.stringify({ lesson_id: lessonId, content_version: newVersion, source: "modular" }),
      });
    } catch (logErr) {
      // Logging failure is non-critical
    }

    return Response.json({
      success: true,
      message: "Kandungan AI berjaya dijana dan disimpan ke entiti modular!",
      lesson_id: lessonId,
      content_version: newVersion,
      generated: {
        lesson_notes: true,
        mindmap_branches: (aiResponse.mindmap || []).length,
        teacher_guide: true,
        ai_explanations: (aiResponse.ai_explanations || []).length,
        common_mistakes: (aiResponse.common_mistakes || []).length,
        feedback_messages: (aiResponse.feedback_library || []).length,
        flashcards: (aiResponse.flashcards || []).length,
        quiz_questions: (aiResponse.quiz_questions || []).length,
        learning_activities: activitiesToCreate.length,
        games_created: gamesCreated,
      },
    });
  } catch (error: any) {
    console.error("generateModularLessonContent error:", error);
    return Response.json(
      { success: false, error: error.message || "Gagal menjana kandungan AI." },
      { status: 500 }
    );
  }
});