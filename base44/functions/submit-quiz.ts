import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  // 1. Kendali permintaan CORS dari pelayar
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } });
  }

  try {
    const base44 = createClientFromRequest(req);
    
    // 2. Dapatkan identiti pengguna yang sedang log masuk
    const user = await base44.auth.me();
    if (!user) throw new Error("Akses ditolak. Sila log masuk semula.");

    // Baca data yang dihantar dari frontend
    const body = await req.json();
    const { quizId, topicName, subjectName, studentAnswers } = body;

    if (!quizId || !studentAnswers) {
      throw new Error("Data kuiz tidak lengkap.");
    }

    // 3. Ambil soalan sebenar dari pangkalan data menggunakan Service Role
    // (Ini mengelakkan pelajar menipu markah jika mereka cuba mengubah JSON)
    const quiz = await base44.asServiceRole.entities.Quiz.get(quizId);
    if (!quiz) throw new Error("Kuiz tidak dijumpai di pangkalan data.");
    
    let questions = [];
    try {
      questions = typeof quiz.questions_json === "string" 
        ? JSON.parse(quiz.questions_json) 
        : quiz.questions_json;
    } catch (e) {
      throw new Error("Ralat format soalan kuiz.");
    }

    // 4. Pengiraan Markah (Secure Grading)
    let correctCount = 0;
    questions.forEach((q: any, index: number) => {
      const targetAns = String(q.correct_answer || q.correctAnswer || "").trim().toLowerCase();
      const studentAns = String(studentAnswers[index] || "").trim().toLowerCase();
      
      if (targetAns === studentAns && targetAns !== "") {
        correctCount++;
      }
    });

    // Formula Markah dan Ganjaran
    const score = Math.round((correctCount / questions.length) * 100) || 0;
    let coinsEarned = correctCount * 10; // 10 Syiling setiap soalan betul
    if (score === 100) coinsEarned += 50; // Bonus 50 syiling jika markah penuh
    const xpEarned = correctCount * 5;    // 5 XP setiap soalan betul

    // 5. Jana AI Feedback secara tertutup
    let feedbackText = "Tahniah kerana telah mencuba!";
    try {
      if (score > 0) {
        const aiRes = await base44.asServiceRole.integrations.Core.InvokeLLM({
          model: "gemini_1_5_flash",
          prompt: `Pelajar mendapat markah ${score}% untuk kuiz "${topicName}". Berikan maklum balas ringkas, mesra dan ceria (maksimum 2 ayat) dalam Bahasa Melayu.`
        });
        if (aiRes) {
          feedbackText = typeof aiRes === 'string' ? aiRes : (aiRes.text || JSON.stringify(aiRes));
        }
      }
    } catch (e) {
      console.error("Ralat menjana AI Feedback:", e);
    }

    // 6. Jalankan Transaksi Pangkalan Data (Bypass RLS dengan asServiceRole)
    const result = await base44.asServiceRole.transaction(async (tx: any) => {
      
      // A. Simpan rekod QuizAttempt
      const attempt = await tx.entities.QuizAttempt.create({
        student_id: user.id,
        quiz_id: quizId,
        topic_name: topicName,
        subject_name: subjectName,
        answers_json: JSON.stringify(studentAnswers),
        score: score,
        coins_earned: coinsEarned,
        xp_earned: xpEarned,
        feedback_text: feedbackText
      });
      const attemptId = Array.isArray(attempt) ? attempt[0].id : attempt.id;

      // B. Kemas Kini Dompet & Cipta Resit Transaksi
      if (coinsEarned > 0) {
        let wallets = await tx.entities.Wallet.filter({ student_id: user.id });
        let wallet = Array.isArray(wallets) ? wallets[0] : wallets;
        
        if (!wallet) {
          wallet = await tx.entities.Wallet.create({ student_id: user.id, balance: 0 });
        }
        
        await tx.entities.Wallet.update(wallet.id, { 
          balance: (wallet.balance || 0) + coinsEarned 
        });

        await tx.entities.Transaction.create({
          student_id: user.id,
          type: "earn",
          amount: coinsEarned,
          reason: `Ganjaran Kuiz: ${topicName}`,
          reference_id: attemptId
        });
      }

      // C. Kemas Kini Progres & Tahap (Level)
      if (xpEarned > 0) {
        let progresses = await tx.entities.Progress.filter({ student_id: user.id });
        let progress = Array.isArray(progresses) ? progresses[0] : progresses;
        
        if (!progress) {
          progress = await tx.entities.Progress.create({ 
            student_id: user.id, 
            total_xp: 0, 
            level: 1,
            streak_days: 0 
          });
        }
        
        const newXp = (progress.total_xp || 0) + xpEarned;
        const newLevel = Math.floor(newXp / 200) + 1; // Formula level: Naik 1 level setiap 200 XP
        
        await tx.entities.Progress.update(progress.id, { 
          total_xp: newXp, 
          level: newLevel,
          last_study_date: new Date().toISOString()
        });
      }

      return attemptId;
    });

    // 7. Pulangkan response berjaya ke frontend
    return new Response(JSON.stringify({ success: true, data: { attemptId: result } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });

  } catch (error: any) {
    console.error("Gagal submit-quiz:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
});
