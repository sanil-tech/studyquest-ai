import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const hashPin = (pin: string) => {
  return btoa(unescape(encodeURIComponent(`SQ_PIN_SALT_${pin}_2026`)));
};

const hashPassword = (password: string) => {
  return btoa(unescape(encodeURIComponent(`SQ_PWD_SALT_${password}_2026`)));
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
    const body = await req.json().catch(() => ({}));

    const rawInput = (body.username || body.student_id || "").trim();
    const cleanInput = rawInput.toLowerCase();
    const pinInput = (body.pin || body.password || "").trim();

    if (!cleanInput) {
      return Response.json(
        { success: false, error: "Sila masukkan Username, Nama, atau ID Murid." }, 
        { status: 200, headers: resHeaders }
      );
    }

    if (!pinInput) {
      return Response.json(
        { success: false, error: "Sila masukkan PIN 4-digit." }, 
        { status: 200, headers: resHeaders }
      );
    }

    const db = base44.asServiceRole || base44;
    let matchedUser = null;

    // 🔍 SEARCH STAGE 1: Direct exact query by username
    const byUsername = await db.entities.User.filter({ username: cleanInput }).catch(() => []);
    if (byUsername.length > 0) matchedUser = byUsername[0];

    // 🔍 SEARCH STAGE 2: Direct exact query by nickname
    if (!matchedUser) {
      const byNickname = await db.entities.User.filter({ nickname: rawInput }).catch(() => []);
      if (byNickname.length > 0) matchedUser = byNickname[0];
    }

    // 🔍 SEARCH STAGE 3: Direct exact query by student_id (e.g. SQ-XXXXXX)
    if (!matchedUser) {
      const byStudentId = await db.entities.User.filter({ student_id: rawInput.toUpperCase() }).catch(() => []);
      if (byStudentId.length > 0) matchedUser = byStudentId[0];
    }

    // 🔍 SEARCH STAGE 4: Case-insensitive fallback scan across student role records (expanded limit)
    if (!matchedUser) {
      const allStudents = await db.entities.User.filter({ app_role: "student" }, "-created_at", 1000).catch(() => []);
      matchedUser = allStudents.find((u: any) =>
        (u.username && u.username.toLowerCase() === cleanInput) ||
        (u.nickname && u.nickname.toLowerCase() === cleanInput) ||
        (u.full_name && u.full_name.toLowerCase() === cleanInput) ||
        (u.student_id && u.student_id.toLowerCase() === cleanInput)
      ) || null;
    }

    if (!matchedUser) {
      return Response.json(
        { success: false, error: `Akaun murid '${rawInput}' tidak ditemui.` },
        { status: 200, headers: resHeaders }
      );
    }

    const user = matchedUser;

    // Check account lockout
    if (user.account_locked) {
      return Response.json(
        { success: false, error: "Akaun ini telah dikunci sementara. Sila minta ibu bapa anda untuk membuka semula kunci." },
        { status: 200, headers: resHeaders }
      );
    }

    // Verify PIN or Password
    const hashedPin = hashPin(pinInput);
    const hashedPassword = hashPassword(pinInput);

    const isPinMatch = 
      (user.pin_hash && user.pin_hash === hashedPin) ||
      (user.pin_hash && user.pin_hash === pinInput) ||
      (user.child_login_pin && user.child_login_pin === pinInput);

    const isPasswordMatch = user.password_hash && user.password_hash === hashedPassword;

    if (!isPinMatch && !isPasswordMatch) {
      const newFailedAttempts = (user.failed_login_attempts || 0) + 1;
      const shouldLock = newFailedAttempts >= 5;

      await db.entities.User.update(user.id, {
        failed_login_attempts: newFailedAttempts,
        account_locked: shouldLock,
      });

      return Response.json(
        { 
          success: false,
          error: shouldLock 
            ? "PIN/Kata laluan salah. Akaun dikunci kerana terlalu banyak percubaan." 
            : "PIN atau Kata Laluan tidak sah. Sila cuba lagi." 
        },
        { status: 200, headers: resHeaders }
      );
    }

    // Reset failed attempts on successful login
    await db.entities.User.update(user.id, {
      failed_login_attempts: 0,
      account_locked: false,
      last_login_at: new Date().toISOString(),
    });

    return Response.json(
      {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          student_id: user.student_id,
          nickname: user.nickname,
          full_name: user.full_name,
          profile_completed: user.profile_completed,
          app_role: user.app_role,
          selected_avatar: user.selected_avatar,
          avatar_emoji: user.avatar_emoji,
        }
      },
      { status: 200, headers: resHeaders }
    );

  } catch (error: any) {
    console.error("ChildLogin Error:", error);
    return Response.json(
      { success: false, error: error.message || "Ralat pelayan semasa log masuk." },
      { status: 200, headers: resHeaders }
    );
  }
});
