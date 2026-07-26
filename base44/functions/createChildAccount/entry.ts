// base44/functions/createChildAccount/entry.ts
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Helper function to hash child 4-digit PIN
const hashPin = (pin: string) => {
  return btoa(unescape(encodeURIComponent(`SQ_PIN_SALT_${pin}_2026`)));
};

// Helper function to generate unique student code (e.g. SQ-A1B2C3)
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

    // 1. Verify parent authentication
    const authUser = await base44.auth.me().catch(() => null);
    if (!authUser || !authUser.id) {
      return Response.json(
        { success: false, error: 'Sesi log masuk ibu bapa tidak ditemui. Sila log masuk semula.' },
        { status: 200, headers: resHeaders }
      );
    }

    const parent = await db.entities.User.get(authUser.id).catch(() => authUser);

    // 2. Parse request body
    const body = await req.json().catch(() => ({}));
    const nickname = (body.nickname || body.fullName || "Anak").trim();
    const fullName = (body.fullName || nickname).trim();
    const pin = (body.pin || "").trim();
    const educationLevel = (body.grade || body.education_level || "Standard 1").trim();
    const selectedAvatar = body.selectedAvatar || body.selected_avatar || "🦖";

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

    // Generate virtual account credentials
    const cleanNick = nickname.toLowerCase().replace(/[^a-z0-9]/g, "") || "student";
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const generatedUsername = `${cleanNick}_${randomDigits}`;
    const studentId = generateStudentId();
    const virtualEmail = `${cleanNick}.${parent.id.substring(0, 6)}.${randomDigits}@studyquest.com`;

    // 3. Create Student User entity record
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
      selected_avatar: selectedAvatar,
      avatar_emoji: selectedAvatar,
      date_of_birth: body.dateOfBirth || undefined,
      gender: body.gender || undefined,
      school_name: body.school || undefined,
      education_level: educationLevel,
      school_year: educationLevel,
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

    // 4. Create ParentChildRelationship with embedded profile field
    await db.entities.ParentChildRelationship.create({
      parent_id: parent.id,
      child_id: newStudent.id,
      relationship: "parent",
      status: "active",
      linked_at: new Date().toISOString(),
      profile: {
        full_name: fullName,
        nickname: nickname,
        education_level: educationLevel,
        selected_avatar: selectedAvatar,
        username: generatedUsername,
        student_id: studentId
      }
    }).catch((err) => {
      console.warn("ParentChildRelationship creation note:", err);
    });

    // 5. Create approved LinkRequest record
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

    // 6. Link child ID to parent user array
    const currentLinked = parent.linked_student_ids || [];
    if (!currentLinked.includes(newStudent.id)) {
      await db.entities.User.update(parent.id, {
        linked_student_ids: [...currentLinked, newStudent.id]
      }).catch(() => null);
    }

    // 7. Initialize Wallet and Progress
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
      message: "Profil anak berjaya dicipta dan disimpan!",
      student: {
        id: newStudent.id,
        nickname: newStudent.nickname || nickname,
        full_name: newStudent.full_name || fullName,
        username: generatedUsername,
        student_id: studentId,
        child_login_pin: pin,
        education_level: educationLevel,
        selected_avatar: selectedAvatar
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
