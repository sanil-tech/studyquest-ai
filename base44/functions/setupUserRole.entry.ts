import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // 🔍 1. Sahkan pengguna yang sedang mendaftar masuk (Token terhasil selepas verifyOtp)
    const currentUser = await base44.auth.me();

    if (!currentUser) {
      return Response.json(
        { success: false, error: "Unauthorized - Sila log masuk terlebih dahulu" },
        { status: 401 }
      );
    }

    const { role } = await req.json();

    // Pastikan pilihan role adalah sah
    if (!role || !["parent", "student", "teacher"].includes(role)) {
      return Response.json(
        { success: false, error: "Pilihan peranan tidak sah" },
        { status: 400 }
      );
    }

    // 🔐 2. KEMASKINI MENGGUNAKAN SERVICE ROLE (Bypass client-side blocking)
    const updatePayload: any = { app_role: role };

    // Jika pengguna memilih peranan murid, jana maklumat profil mandatori murid
    if (role === "student") {
      const emailPrefix = currentUser.email ? currentUser.email.split('@')[0] : `user_${Math.floor(1000 + Math.random() * 9000)}`;
      const cleanUsername = emailPrefix.toLowerCase().replace(/[^a-z0-9_]/g, "");
      
      updatePayload.username = currentUser.username || cleanUsername;
      updatePayload.student_id = currentUser.student_id || "SQ" + Math.floor(100000 + Math.random() * 900000);
      updatePayload.login_method = "email_password";
      updatePayload.is_child_account = false; // Mendaftar sendiri menggunakan e-mel rasmi
    }

    // Kemaskini maklumat peranan entiti User di pangkalan data secara mutlak
    await base44.asServiceRole.entities.User.update(currentUser.id, updatePayload);

    // 📝 3. Sediakan storan data Wallet & Progress secara automatik khusus untuk Murid
    if (role === "student") {
      const wallets = await base44.asServiceRole.entities.Wallet.filter({ student_id: currentUser.id });
      if (wallets.length === 0) {
        await base44.asServiceRole.entities.Wallet.create({ student_id: currentUser.id, balance: 0 });
      }
      
      const progress = await base44.asServiceRole.entities.Progress.filter({ student_id: currentUser.id });
      if (progress.length === 0) {
        await base44.asServiceRole.entities.Progress.create({ 
          student_id: currentUser.id, 
          total_xp: 0, 
          level: 1, 
          streak_days: 0, 
          total_study_time: 0 
        });
      }
    }

    return Response.json({ success: true, message: `Peranan ${role} berjaya ditetapkan.` });
  } catch (err) {
    console.error("Ralat setupUserRole:", err);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
});
