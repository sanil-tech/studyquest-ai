import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Salted PIN hash helper
const hashPin = (pin: string) => {
  return btoa(unescape(encodeURIComponent(`SQ_PIN_SALT_${pin}_2026`)));
};

// Generate unique Student ID (SQ-XXXXXX)
const generateStudentId = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = 'SQ-';
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
};

Deno.serve(async (req) => {
  const resHeaders = {
    "content-type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: resHeaders });
  }

  try {
    const base44 = createClientFromRequest(req);
    const db = base44.asServiceRole || base44;

    // 1. Verify parent session
    const authUser = await base44.auth.me().catch(() => null);
    if (!authUser || !authUser.id) {
      return Response.json(
        { success: false, error: 'Sesi log masuk ibu bapa tidak ditemui. Sila log masuk semula.' },
        { status: 200, headers: resHeaders }
      );
    }

    const parent = await db.entities.User.get(authUser.id).catch(() => authUser);

    const body = await req.json().catch(() => ({}));
    const nickname = (body.nickname || body.fullName || "Anak").trim();
    const fullName = (body.fullName || nickname).trim();
    const pin = (body.pin || "").trim();

    if (!nickname || !pin) {
      return Response.json(
        { success: false, error: 'Nama panggilan dan PIN 4-digit adalah wajib.' },
        { status: 200, headers: resHeaders }
      );
    }

    if (!/^\d{4,6}$/.test(pin)) {
      return Response.json(
        { success: false, error: 'PIN mestilah 4 hingga 6 digit nombor.' },
        { status: 200, headers: resHeaders }
      );
    }

    // 2. Generate unique student credentials
    const cleanNick = nickname.toLowerCase().replace(/[^a-z0-9]/g, "") || "student";
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const generatedUsername = `${cleanNick}_${randomDigits}`;
    const studentId = generateStudentId();
    const virtualEmail = `${cleanNick}.${parent.id.substring(0, 6)}.${randomDigits}@studyquest.com`;

    // 3. Create student User entity via Service Role
    const newStudent = await db.entities.User.create({
      app_role: "student",
      email: virtualEmail,
      nickname: nickname,
      full_name: fullName,
      username: generatedUsername,
      student_id: studentId,
      pin_hash: hashPin(pin),
      child_login_pin: pin,
      pin_enabled: true,
      login_method: "both",
      is_child_account: true,
      profile_completed: true,
      linked_parent_id: parent.id,
      selected_avatar: body.selectedAvatar || "🦖",
      avatar_emoji: body.selectedAvatar || "🦖",
      date_of_birth: body.dateOfBirth || undefined,
      gender: body.gender || undefined,
      school_name: body.school || undefined,
      education_level: body.grade || undefined,
      preferred_language: body.language || "ms",
      interests: body.interests || [],
      status: "active"
    });

    if (!newStudent || !newStudent.id) {
      return Response.json(
        { success: false, error: "Pelayan gagal menjana rekod murid baharu di pangkalan data." },
        { status: 200, headers: resHeaders }
      );
    }

    // 4. Create active ParentChildRelationship
    await db.entities.ParentChildRelationship.create({
      parent_id: parent.id,
      child_id: newStudent.id,
      relationship: "parent",
      status: "active",
      linked_at: new Date().toISOString()
    }).catch(() => null);

    // 5. Create approved LinkRequest
    await db.entities.LinkRequest.create({
      student_id: newStudent.id,
      student_name: nickname,
      student_username: generatedUsername,
      student_email: virtualEmail,
      parent_id: parent.id,
      parent_email: parent.email || "parent@studyquest.com",
      parent_name: parent.full_name || parent.nickname || "Ibu Bapa",
      initiated_by: "parent",
      status: "approved"
    }).catch(() => null);

    // 6. Update parent's linked_student_ids array
    const currentLinked = parent.linked_student_ids || [];
    if (!currentLinked.includes(newStudent.id)) {
      await db.entities.User.update(parent.id, {
        linked_student_ids: [...currentLinked, newStudent.id]
      }).catch(() => null);
    }

    // 7. Initialize Wallet & Progress entities
    await db.entities.Wallet.create({ student_id: newStudent.id, balance: 0 }).catch(() => null);
    await db.entities.Progress.create({
      student_id: newStudent.id,
      total_xp: 0,
      level: 1,
      streak_days: 0,
      total_study_time: 0
    }).catch(() => null);

    return Response.json({
      success: true,
      message: "Profil anak berjaya dicipta!",
      student: {
        id: newStudent.id,
        nickname: newStudent.nickname || nickname,
        full_name: newStudent.full_name || fullName,
        username: generatedUsername,
        student_id: studentId,
        child_login_pin: pin,
      }
    }, { status: 200, headers: resHeaders });

  } catch (error: any) {
    console.error("CreateChildAccount Error:", error);
    return Response.json(
      { success: false, error: error.message || "Gagal mendaftarkan profil anak." },
      { status: 200, headers: resHeaders }
    );
  }
});
