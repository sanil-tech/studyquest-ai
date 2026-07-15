import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// 🔐 WAJIB MESTI SAMA: Fungsi Hashing tersuai bagi memintas sistem Auth Teras
const hashPassword = (password: string) => {
  return btoa(unescape(encodeURIComponent(`SQ_PWD_SALT_${password}_2026`)));
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } });
  }

  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const username = body.username;
    const password = body.password;
    const fullName = body.fullName;
    const ageGroup = body.ageGroup || "kid";

    if (!username || !password || !fullName) {
      return Response.json({ error: "Maklumat pendaftaran tidak lengkap." }, { status: 400 });
    }

    const cleanUsername = username
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "");

    const adminClient = base44.asServiceRole;

    // 🕵️ LANGKAH 1: SEMAK JIKA USERNAME SUDAH DIWUJUDKAN DALAM DATABASE
    const existingUsers = await adminClient.entities.User.filter({
      username: cleanUsername
    });

    if (existingUsers && existingUsers.length > 0) {
      return Response.json(
        { error: `Alamak! Username '${cleanUsername}' sudah diambil. Cuba nama lain bossku! 🦧` },
        { status: 400 }
      );
    }

    // 🌟 LANGKAH 2: JANA ID UNIK BARU (Bypass Auth Service Row Count)
    const newStudentId = crypto.randomUUID();
    const securePasswordHash = hashPassword(password);

    // 🌟 LANGKAH 3: CIPTA PROFIL USER DALAM ENTITI JADUAL DATA
    const newStudent = await adminClient.entities.User.create({
      id: newStudentId,
      student_id: newStudentId, // Sebagai sandaran mapping field
      full_name: fullName.trim(),
      username: cleanUsername,
      nickname: fullName.trim().split(" ")[0],
      app_role: "student",
      age_group: ageGroup,
      password_hash: securePasswordHash, // Disimpan dalam format salt murni
      is_child_account: true,
      profile_completed: true,
      status: "active"
    });

    // 🪙 LANGKAH 4: CIPTA WALLET PERMULAAN SECARA AUTOMATIK (Baki: 0)
    await adminClient.entities.Wallet.create({
      student_id: newStudentId,
      balance: 0
    });

    // 📊 LANGKAH 5: CIPTA REKOD KEMAJUAN AKADEMIK PERMULAAN
    await adminClient.entities.Progress.create({
      student_id: newStudentId,
      total_xp: 0,
      level: 1,
      streak_days: 0,
      total_study_time: 0
    });

    return Response.json({
      success: true,
      message: "Watak pengembara dan dompet berjaya dikunci!",
      userId: newStudentId
    });

  } catch (error: any) {
    console.error("Ralat Pendaftaran Tersuai:", error);
    return Response.json(
      { error: error.message || "Ralat kritikal pelayan pangkalan data" },
      { status: 500 }
    );
  }
});
