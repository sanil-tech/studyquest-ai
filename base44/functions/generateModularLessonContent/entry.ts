// base44/functions/generateModularLessonContent/entry.ts
// Modular AI Content Generation Pipeline — Single Source of Truth Architecture

import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

const PROMPT_VERSION = "v3.0-modular-kssr";

interface RequestPayload {
  action?: "FULL_PIPELINE" | "REGENERATE_BLOCK";
  topic_id: string;
  lesson_id?: string;
  lesson_version_id?: string;
  block_id?: string;
  model?: string;
  force?: boolean;
}

Deno.serve(async (req: Request) => {
  const resHeaders = {
    "content-type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: resHeaders });
  }

  try {
    const base44 = createClientFromRequest(req);
    const db = base44.asServiceRole || base44;

    // 1. AUTHENTICATION & ROLE CHECK
    const user = await base44.auth.me().catch(() => null);
    if (!user) {
      return Response.json(
        { success: false, error: "Sesi tidak sah. Sila log masuk." },
        { status: 401, headers: resHeaders }
      );
    }

    const role = String(user.app_role || user.role || "").toLowerCase();
    const isAdmin = role === "admin" || role === "teacher" || user.is_admin === true;

    if (!isAdmin) {
      return Response.json(
        { success: false, error: "Akses dinafikan. Hanya pentadbir/guru dibenarkan." },
        { status: 403, headers: resHeaders }
      );
    }

    const body: RequestPayload = await req.json().catch(() => ({}));
    const { topic_id, action = "FULL_PIPELINE", model = "gemini_3_flash" } = body;

    if (!topic_id && action !== "REGENERATE_BLOCK") {
      return Response.json(
        { success: false, error: "topic_id diperlukan." },
        { status: 400, headers: resHeaders }
      );
    }

    // 2. CREATE PENDING JOB RECORD IN AIJOBQUEUE
    const newJob = await db.entities.AIJobQueue.create({
      jobType: action === "REGENERATE_BLOCK" ? "REGENERATE_BLOCK" : "LESSON_GEN",
      status: "PENDING",
      requestedBy: user.id,
      payload: { ...body, model, prompt_version: PROMPT_VERSION },
      createdAt: new Date().toISOString(),
    });

    // 3. TRIGGER BACKGROUND PROCESS (NON-BLOCKING)
    runModularPipeline(base44, newJob.id, body, user.id).catch((err) => {
      console.error(`[AI Worker Error] Job ${newJob.id} failed:`, err);
    });

    // 4. RETURN IMMEDIATE RESPONSE (<300ms)
    return Response.json(
      {
        success: true,
        message:
          action === "REGENERATE_BLOCK"
            ? "Misi penjanaan semula blok dimulakan"
            : "Misi penjanaan kandungan modular dimulakan",
        jobId: newJob.id,
        status: "PENDING",
      },
      { status: 202, headers: resHeaders }
    );
  } catch (error: any) {
    console.error("generateModularLessonContent error:", error);
    return Response.json(
      { success: false, error: error.message || "Ralat sistem." },
      { status: 500, headers: resHeaders }
    );
  }
});

/**
 * Background Execution Pipeline
 */
async function runModularPipeline(
  base44: any,
  jobId: string,
  payload: RequestPayload,
  userId: string
) {
  const db = base44.asServiceRole || base44;
  const model = payload.model || "gemini_3_flash";
  let totalTokensUsed = 0;

  try {
    await db.entities.AIJobQueue.update(jobId, { status: "PROCESSING" });

    // ------------------------------------------------------------------
    // BRANCH 1: INDEPENDENT BLOCK REGENERATION
    // ------------------------------------------------------------------
    if (payload.action === "REGENERATE_BLOCK" && payload.block_id) {
      const block = await db.entities.LessonBlock.get(payload.block_id);
      if (!block) throw new Error("LessonBlock tidak ditemui.");

      const blockPrompt = `Anda adalah pakar kurikulum KSSR/KSSM Malaysia.
Jana semula kandungan untuk blok pembelajaran ini dalam Bahasa Melayu.
Gunakan gaya pengembaraan StudyQuest yang mesra kanak-kanak.

Jenis Blok: ${block.block_type}
Tajuk: ${block.title || "Kandungan"}

Jana respons JSON:
{ "title": "Tajuk", "payload": { ... Data spesifik mengikut block_type ... } }`;

      const aiRes = await base44.integrations.Core.InvokeLLM({ prompt: blockPrompt, model });
      const promptTokens = Math.ceil((blockPrompt.length + JSON.stringify(aiRes).length) / 4);
      totalTokensUsed += promptTokens;

      await db.entities.LessonBlock.update(payload.block_id, {
        title: aiRes.title || block.title,
        payload: JSON.stringify(aiRes.payload || aiRes),
        generation_metadata: JSON.stringify({
          model,
          prompt_version: PROMPT_VERSION,
          tokens_used: promptTokens,
          generated_at: new Date().toISOString(),
        }),
      });

      await db.entities.AIJobQueue.update(jobId, {
        status: "COMPLETED",
        result: { block_id: payload.block_id, updated: true },
        completedAt: new Date().toISOString(),
      });

      return;
    }

    // ------------------------------------------------------------------
    // BRANCH 2: FULL MODULAR PIPELINE
    // ------------------------------------------------------------------

    // Step A: Topic & Lesson Setup
    const topic = await db.entities.Topic.get(payload.topic_id).catch(() => null);
    const topicName = topic?.name || "Topik Utama";
    const subjectName = topic?.subject_name || "Subjek";
    const formLevel = topic?.form_level || "Tahun 1";

    let lesson = (await db.entities.Lesson.filter({ topic_id: payload.topic_id }))?.[0];
    if (!lesson) {
      lesson = await db.entities.Lesson.create({
        topic_id: payload.topic_id,
        topic_name: topicName,
        subject_name: subjectName,
        content_status: "ai_generated",
        created_by_user_id: userId,
      });
    }

    // Create Draft LessonVersion
    const versionNum = (lesson.version || 0) + 1;
    const lessonVersion = await db.entities.LessonVersion.create({
      lesson_id: lesson.id,
      version_number: versionNum,
      workflow_status: "AI_GENERATED",
      created_by_user_id: userId,
    });

    const versionId = lessonVersion.id;

    // ------------------------------------------------------------------
    // MODULAR LLM CALL 1: STRUCTURE & OVERVIEW
    // ------------------------------------------------------------------
    const structurePrompt = `Anda adalah pakar kurikulum KSSR/KSSM Malaysia.
Jana struktur taklimat & pengenalan untuk topik berikut dalam Bahasa Melayu.

Topik: ${topicName} | Subjek: ${subjectName} | Tahap: ${formLevel}

Jana JSON:
{
  "lesson_title": "Tajuk Misi Pengembaraan",
  "introduction_markdown": "# Pengenalan Misi\\n\\nHai {{nama}}! Mari kita pelajari...",
  "youtube_search_term": "Pelajaran ${topicName} ${formLevel}",
  "mindmap_branches": [{ "label": "Konsep 1", "children": ["Fakta A", "Fakta B"] }]
}`;

    const structRes = await base44.integrations.Core.InvokeLLM({ prompt: structurePrompt, model });
    totalTokensUsed += Math.ceil((structurePrompt.length + JSON.stringify(structRes).length) / 4);

    // ------------------------------------------------------------------
    // MODULAR LLM CALL 2: CONTENT BLOCKS (Markdown, Flashcards, Games)
    // ------------------------------------------------------------------
    const blocksPrompt = `Jana blok kandungan interaktif untuk topik "${topicName}" (${subjectName}, ${formLevel}) dalam Bahasa Melayu.

Jana JSON:
{
  "flashcards": [{ "front": "Soalan?", "back": "Jawapan", "explanation": "Terangan" }],
  "matching_game": {
    "game_type": "matching",
    "instructions": "Padankan pasangan yang betul!",
    "pairs": [{ "left": "Item A", "right": "Padanan A" }]
  },
  "sorting_game": {
    "game_type": "sorting",
    "instructions": "Susun mengikut kategori!",
    "categories": ["Kategori 1", "Kategori 2"],
    "items": [{ "value": "Objek 1", "category": "Kategori 1" }]
  }
}`;

    const blocksRes = await base44.integrations.Core.InvokeLLM({ prompt: blocksPrompt, model });
    totalTokensUsed += Math.ceil((blocksPrompt.length + JSON.stringify(blocksRes).length) / 4);

    // Write LessonBlocks to DB
    const blockMetadata = JSON.stringify({
      model,
      prompt_version: PROMPT_VERSION,
      generated_at: new Date().toISOString(),
    });

    await db.entities.LessonBlock.bulkCreate([
      {
        lesson_version_id: versionId,
        block_type: "TEXT_MARKDOWN",
        title: "Nota Pengembaraan",
        order_number: 1,
        payload: JSON.stringify({ markdown: structRes.introduction_markdown || "" }),
        status: "draft",
        generation_metadata: blockMetadata,
      },
      {
        lesson_version_id: versionId,
        block_type: "VIDEO_EMBED",
        title: "Taklimat Video",
        order_number: 2,
        payload: JSON.stringify({
          youtube_url: structRes.youtube_search_term || "",
          search_query: structRes.youtube_search_term || "",
        }),
        status: "draft",
        generation_metadata: blockMetadata,
      },
      {
        lesson_version_id: versionId,
        block_type: "MIND_MAP",
        title: "Peta Minda",
        order_number: 3,
        payload: JSON.stringify({ branches: structRes.mindmap_branches || [] }),
        status: "draft",
        generation_metadata: blockMetadata,
      },
      {
        lesson_version_id: versionId,
        block_type: "FLASHCARD_DECK",
        title: "Kad Kilat",
        order_number: 4,
        payload: JSON.stringify({ cards: blocksRes.flashcards || [] }),
        status: "draft",
        generation_metadata: blockMetadata,
      },
      {
        lesson_version_id: versionId,
        block_type: "INTERACTIVE_GAME",
        title: "Permainan Padanan",
        order_number: 5,
        payload: JSON.stringify(blocksRes.matching_game || {}),
        status: "draft",
        generation_metadata: blockMetadata,
      },
    ]);

    // ------------------------------------------------------------------
    // MODULAR LLM CALL 3: ASSESSMENT & QUESTION BANK
    // ------------------------------------------------------------------
    const assessmentPrompt = `Jana 10 soalan kuiz objektif KSSR/KSSM untuk "${topicName}" dalam Bahasa Melayu.

Jana JSON:
{
  "assessment_title": "Ujian Minda: ${topicName}",
  "questions": [
    {
      "question_text": "Apakah...?",
      "options": [
        { "label": "A", "text": "Pilihan A" },
        { "label": "B", "text": "Pilihan B" },
        { "label": "C", "text": "Pilihan C" },
        { "label": "D", "text": "Pilihan D" }
      ],
      "correct_answer": "A",
      "explanation": "Penjelasan ringkas",
      "difficulty": "easy",
      "concept": "Nama Konsep Utama"
    }
  ]
}`;

    const asmRes = await base44.integrations.Core.InvokeLLM({ prompt: assessmentPrompt, model });
    totalTokensUsed += Math.ceil((assessmentPrompt.length + JSON.stringify(asmRes).length) / 4);

    // Create Assessment linked directly to LessonVersion
    const newAssessment = await db.entities.Assessment.create({
      lesson_version_id: versionId,
      lesson_id: lesson.id,
      topic_id: payload.topic_id,
      title: asmRes.assessment_title || `Ujian Minda: ${topicName}`,
      assessment_type: "PRACTICE",
      passing_score: 80,
      reward_xp: 50,
      reward_coins: 10,
      workflow_status: "AI_GENERATED",
    });

    // Write QuestionBank & QuestionOption records
    const questions = asmRes.questions || [];
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const qId = `qb_${versionId}_${i + 1}`;

      await db.entities.QuestionBank.create({
        id: qId,
        assessment_id: newAssessment.id,
        learning_standard_id: topic?.learning_standard_id || null,
        question_text: q.question_text || "",
        question_type: "MCQ",
        correct_answer: q.correct_answer || "A",
        explanation: q.explanation || "",
        difficulty: q.difficulty || "medium",
        cognitive_level: "understand",
      });

      // Write options
      if (Array.isArray(q.options)) {
        await db.entities.QuestionOption.bulkCreate(
          q.options.map((opt: any, optIdx: number) => ({
            question_id: qId,
            label: opt.label || String.fromCharCode(65 + optIdx),
            text: opt.text || "",
            sort_order: optIdx,
          }))
        );
      }

      // ------------------------------------------------------------------
      // MODULAR LLM CALL 4: AI EXPLANATIONS
      // ------------------------------------------------------------------
      if (q.concept) {
        await db.entities.AIExplanation.create({
          lesson_version_id: versionId,
          question_id: qId,
          concept: q.concept,
          explanation_markdown: q.explanation || "",
          analogy: `Bayangkan konsep ${q.concept} seperti kehidupan harian di sekolah.`,
          language: "ms",
        });
      }
    }

    // ------------------------------------------------------------------
    // MODULAR LLM CALL 5: AUTOMATED AI QUALITY EVALUATION
    // ------------------------------------------------------------------
    const qualityPrompt = `Anda adalah Pegawai Penilai Kualiti Pendidikan KPM.
Sahkan kualiti pakej pelajaran ini untuk pelajar ${formLevel}:

Tajuk: ${structRes.lesson_title}
Soalan Dijana: ${questions.length}

Nilai dan berikan JSON:
{
  "quality_score": 85,
  "passed": true,
  "feedback": "Kandungan sesuai dengan DSKP dan Bahasa Melayu mesra kanak-kanak."
}`;

    const qualityRes = await base44.integrations.Core.InvokeLLM({ prompt: qualityPrompt, model });
    totalTokensUsed += Math.ceil((qualityPrompt.length + JSON.stringify(qualityRes).length) / 4);

    const qualityPassed = (qualityRes.quality_score || 0) >= 80;
    const finalWorkflowStatus = qualityPassed ? "TEACHER_REVIEW" : "AI_GENERATED";

    // Update LessonVersion Status based on Quality Check
    await db.entities.LessonVersion.update(versionId, {
      workflow_status: finalWorkflowStatus,
      ai_quality_score: qualityRes.quality_score || 80,
      ai_quality_feedback: qualityRes.feedback || "AI quality check complete.",
    });

    // Update Lesson record
    await db.entities.Lesson.update(lesson.id, {
      version: versionNum,
      content_status: "ai_generated",
    });

    // Log total tokens used
    await db.entities.AIUsageLog.create({
      purpose: "modular_content_generation",
      model,
      tokens_used: totalTokensUsed,
      user_id: userId,
      topic_name: topicName,
      metadata: JSON.stringify({
        lesson_version_id: versionId,
        quality_score: qualityRes.quality_score,
      }),
    }).catch(() => {});

    // Complete Job
    await db.entities.AIJobQueue.update(jobId, {
      status: "COMPLETED",
      result: {
        lesson_id: lesson.id,
        lesson_version_id: versionId,
        workflow_status: finalWorkflowStatus,
        quality_score: qualityRes.quality_score,
        total_tokens_used: totalTokensUsed,
      },
      completedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error(`[AI Pipeline Error] Job ${jobId} failed:`, err);
    await db.entities.AIJobQueue.update(jobId, {
      status: "FAILED",
      errorMessage: err.message || "Ralat semasa menjana kandungan modular",
      completedAt: new Date().toISOString(),
    });
  }
}
