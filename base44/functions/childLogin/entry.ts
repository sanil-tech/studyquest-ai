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

    // 1. Fetch all user entities via Service Role without restricted sort fields
    const allUsers = await db.entities.User.filter({}).catch(() => []);

    // Extract prefix if user typed format like "corry_1204" -> "corry"
    const basePrefix = cleanInput.includes("_") ? cleanInput.split("_")[0] : cleanInput;

    // 2. Multi-field search across username, nickname, full_name, student_id, email, and ID
    const matchedUser = allUsers.find((u: any) => {
      const uUsername = (u.username || "").toLowerCase();
      const uNickname = (u.nickname || "").toLowerCase();
      const uFullName = (u.full_name || "").toLowerCase();
      const uStudentId = (u.student_id || "").toLowerCase();
      const uEmail = (u.email || "").toLowerCase();
      const uId = (u.id || "").toLowerCase();

      // Direct exact matches
      if (uUsername === cleanInput) return true;
      if (uNickname === cleanInput) return true;
      if (uStudentId === cleanInput) return true;
      if (uFullName === cleanInput) return true;
      if (uEmail === cleanInput || uEmail.startsWith(`${cleanInput}@`)) return true;
      if (uId === cleanInput || uId.startsWith(cleanInput)) return true;

      // Prefix matches (e.g. "corry_1204" matching nickname "corry" or full name "Corry Aileene Saniyil")
      if (basePrefix && basePrefix.length >= 2) {
        if (uNickname === basePrefix) return true;
        if (uUsername.startsWith(`${basePrefix}_`)) return true;
        if (uFullName.toLowerCase().startsWith(basePrefix)) return true;
      }

      return false;
    });

    if (!matchedUser) {
      return Response.json(
        { success: false, error: `Akaun murid '${rawInput}' tidak ditemui dalam sistem.` },
        { status: 200, headers: resHeaders }
      );
    }

    const user = matchedUser;

    // 3. Check account lockout status
    if (user.account_locked) {
      return Response.json(
        { success: false, error: "Akaun ini telah dikunci sementara. Sila minta ibu bapa anda untuk membuka semula kunci." },
        { status: 200, headers: resHeaders }
      );
    }

    // 4. Verify PIN or Password against multiple stored formats
    const hashedPin = hashPin(pinInput);
    const hashedPassword = hashPassword(pinInput);

    const isPinMatch = 
      (user.pin_hash && user.pin_hash === hashedPin) ||
      (user.pin_hash && user.pin_hash === pinInput) ||
      (user.child_login_pin && user.child_login_pin === pinInput) ||
      (user.password_hash && user.password_hash === hashedPassword);

    if (!isPinMatch) {
      const newFailedAttempts = (user.failed_login_attempts || 0) + 1;
      const shouldLock = newFailedAttempts >= 5;

      await db.entities.User.update(user.id, {
        failed_login_attempts: newFailedAttempts,
        account_locked: shouldLock,
      }).catch(() => null);

      return Response.json(
        { 
          success: false,
          error: shouldLock 
            ? "PIN salah. Akaun dikunci kerana terlalu banyak percubaan." 
            : "PIN 4-digit tidak sah. Sila cuba lagi." 
        },
        { status: 200, headers: resHeaders }
      );
    }

    // 5. Reset failed login attempts on successful login
    await db.entities.User.update(user.id, {
      failed_login_attempts: 0,
      account_locked: false,
      last_login_at: new Date().toISOString(),
    }).catch(() => null);

    return Response.json(
      {
        success: true,
        user: {
          id: user.id,
          username: user.username || user.nickname || "student",
          student_id: user.student_id,
          nickname: user.nickname || user.full_name || "Pelajar",
          full_name: user.full_name,
          profile_completed: user.profile_completed !== false,
          app_role: user.app_role || "student",
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
