import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Helper function to hash 4-digit PINs
const hashPin = (pin: string) => {
  return btoa(unescape(encodeURIComponent(`SQ_PIN_SALT_${pin}_2026`)));
};

// Helper function to generate student codes (e.g. SQ-A1B2C3)
const generateStudentId = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = 'SQ-';
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
};

export default async function(req: Request): Promise<Response> {
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

    // 1. Verify parent authentication session
    const authUser = await base44.auth.me().catch(() => null);
    if (!authUser || !authUser.id) {
      return Response.json(
        { success: false, error: 'Sesi log masuk ibu bapa tidak ditemui. Sila log masuk semula.' },
        { status: 200, headers: resHeaders }
      );
    }

    const db = base44.asServiceRole;

    // Safely retrieve parent record from User entity
    const parentDbRecord = await db.entities.User.get(authUser.id).catch(() => null);
    const parent = parentDbRecord || authUser || {};

    const parentId = parent.id || authUser.id;
    const parentEmail = parent.email || authUser.email || "parent@studyquest.com";
    const parentName = parent.full_name || parent.nickname || authUser.full_name || "Ibu Bapa";

    // 2. Parse request payload
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

    // 3. Generate child account credentials safely
    const cleanNick = nickname.toLowerCase().replace(/[^a-z0-9]/g, "") || "student";
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const generatedUsername = `${cleanNick}_${randomDigits}`;
    const studentId = generateStudentId();
    const virtualEmail = `${cleanNick}.${parentId.substring(0, 6)}.${randomDigits}@studyquest.com`;

    // 4. Create User record via auth.register (creates an unverified User record immediately).
    //    entities.User.create() silently fails to persist for the built-in User entity.
    //    inviteUser only sends an email — the User record is not created until the invitee accepts.
    //    auth.register creates the User record now; the childLogin function bypasses standard auth
    //    (looks up by username + PIN), so email verification is not needed for PIN-based login.
    const registerPassword = `SQchild_${pin}_${randomDigits}!2026`;
    try {
      await base44.auth.register({ email: virtualEmail, password: registerPassword, full_name: fullName });
    } catch (regErr: any) {
      console.error("auth.register error:", regErr);
      return Response.json(
        { success: false, error: "Gagal menjana akaun murid. Sila cuba lagi." },
        { status: 200, headers: resHeaders }
      );
    }

    // 5. Look up the newly created User record by email using service role
    let newStudent: any = null;
    try {
      const matchingUsers = await db.entities.User.filter({ email: virtualEmail });
      if (matchingUsers && matchingUsers.length > 0) {
        newStudent = matchingUsers[0];
      }
    } catch (lookupErr: any) {
      console.error("User lookup error:", lookupErr);
    }

    if (!newStudent || !newStudent.id) {
      return Response.json(
        { success: false, error: "Pelayan gagal menjana rekod murid baharu di pangkalan data." },
        { status: 200, headers: resHeaders }
      );
    }

    const newStudentId = newStudent.id;

    // 6. Update the User record with all student-specific fields
    await db.entities.User.update(newStudentId, {
      app_role: "student",
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
      linked_parent_id: parentId,
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
    }).catch((err: any) => {
      console.error("User.update error:", err);
    });

    // 7. Create ParentChildRelationship with embedded profile
    await db.entities.ParentChildRelationship.create({
      parent_id: parentId,
      child_id: newStudentId,
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
    }).catch((err: any) => {
      console.warn("ParentChildRelationship create note:", err);
    });

    // 8. Create approved LinkRequest record with embedded student_profile
    await db.entities.LinkRequest.create({
      student_id: newStudentId,
      student_name: nickname,
      student_username: generatedUsername,
      student_email: virtualEmail,
      parent_id: parentId,
      parent_email: parentEmail,
      parent_name: parentName,
      initiated_by: "parent",
      status: "approved",
      student_profile: {
        full_name: fullName,
        nickname: nickname,
        education_level: educationLevel,
        selected_avatar: selectedAvatar,
        username: generatedUsername,
        student_id: studentId
      }
    }).catch((err: any) => {
      console.warn("LinkRequest creation note:", err);
    });

    // 9. Link child ID to parent user record
    const currentLinked = Array.isArray(parent.linked_student_ids) ? parent.linked_student_ids : [];
    if (!currentLinked.includes(newStudentId)) {
      await db.entities.User.update(parentId, {
        linked_student_ids: [...currentLinked, newStudentId]
      }).catch(() => null);
    }

    // 10. Initialize Wallet and Progress
    await db.entities.Wallet.create({ student_id: newStudentId, balance: 0 }).catch(() => null);
    await db.entities.Progress.create({
      student_id: newStudentId,
      total_xp: 0,
      level: 1,
      streak_days: 0,
      total_study_time: 0
    }).catch(() => null);

    return Response.json({
      success: true,
      message: "Profil anak berjaya dicipta!",
      student: {
        id: newStudentId,
        nickname: nickname,
        full_name: fullName,
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
}