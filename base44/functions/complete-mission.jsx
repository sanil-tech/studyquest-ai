import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  // Kendali CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } });
  }

  try {
    const base44 = createClientFromRequest(req);
    
    // 1. Dapatkan pengguna yang sedang log masuk
    const user = await base44.auth.me();
    if (!user || (user.app_role !== 'student' && user.app_role !== 'super_admin')) {
      throw new Error("Hanya akaun pelajar yang boleh menerima ganjaran misi.");
    }

    // 2. Ambil data misi dari frontend
    const { missionTitle, xpReward, coinReward, studyMinutes } = await req.json();

    // 3. Jalankan Transaksi menggunakan kuasa asServiceRole (Bypass RLS)
    const result = await base44.asServiceRole.transaction(async (tx) => {
      
      // --- A. URUSAN PROGRESS (XP & LEVEL) ---
      let progress = await tx.entities.Progress.get(user.id);
      
      // Jika rekod progress belum wujud, cipta baru
      if (!progress) {
        progress = await tx.entities.Progress.create({
          student_id: user.id,
          total_xp: 0,
          level: 1,
          streak_days: 0,
          total_study_time: 0
        });
      }

      const newXp = progress.total_xp + (xpReward || 0);
      const newStudyTime = progress.total_study_time + (studyMinutes || 0);
      
      // Logik Naik Level Automatik (Contoh: Setiap 1000 XP = Naik 1 Level)
      const newLevel = Math.floor(newXp / 1000) + 1;

      await tx.entities.Progress.update(progress.id, {
        total_xp: newXp,
        level: newLevel,
        total_study_time: newStudyTime,
        last_study_date: new Date().toISOString()
      });

      // --- B. URUSAN DOMPET & SYILING (COINS) ---
      if (coinReward > 0) {
        let wallet = await tx.entities.Wallet.get(user.id);
        
        if (!wallet) {
          wallet = await tx.entities.Wallet.create({ student_id: user.id, balance: 0 });
        }

        // Tambah baki syiling
        await tx.entities.Wallet.update(wallet.id, {
          balance: wallet.balance + coinReward
        });

        // Cipta resit transaksi
        await tx.entities.Transaction.create({
          student_id: user.id,
          type: "earn",
          amount: coinReward,
          reason: `Ganjaran Misi: ${missionTitle}`,
          reference_id: `mission_${Date.now()}`
        });
      }

      return { newXp, newLevel, coinsAdded: coinReward };
    });

    return new Response(JSON.stringify({ success: true, data: result }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });

  } catch (error: any) {
    console.error("Gagal memproses ganjaran misi:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
});
