import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Hash PIN helper matching standard StudyQuest salt
const hashPin = (pin: string) => {
  return btoa(unescape(encodeURIComponent(`SQ_PIN_SALT_${pin}_2026`)));
};

// Hash password helper
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
    const body = await req.json();

    const usernameInput = (body.username || body.student_id || "").trim().toLowerCase();
    const pinInput = (body.pin || body.password || "").trim();

    if (!usernameInput) {
      return Response.json({ error: "Sila masukkan Username atau ID Murid." }, { status: 400, headers: resHeaders });
    }

    if (!pinInput) {
      return Response.json({ error: "Sila masukkan PIN atau Kata Laluan." }, { status: 400, headers: resHeaders });
    }

    // 1. Fetch user by username, student_id, or nickname using Service Role
    const db = base44.asServiceRole || base44;
    const allUsers = await db.entities.User.filter({});
    
    const user = allUsers.find((u: any) => {
      const matchUsername = u.username && u.username.toLowerCase() === usernameInput;
      const matchStudentId = u.student_id && u.student_id.toLowerCase() === usernameInput;
      const matchNickname = u.nickname && u.nickname.toLowerCase() === usernameInput;
      return (matchUsername || matchStudentId || matchNickname) && u.app_role === "student";
    });

    if (!user) {
      return Response.json(
        { error: `Akaun murid '${usernameInput}' tidak ditemui.` },
        { status: 404, headers: resHeaders }
      );
    }

    // 2. Lockout check
    if (user.account_locked) {
      return Response.json(
        { error: "Akaun ini telah dikunci sementara. Sila minta ibu bapa anda untuk membuka semula kunci." },
        { status: 403, headers: resHeaders }
      );
    }

    // 3. Verify PIN or Password
    const hashedPin = hashPin(pinInput);
    const hashedPassword = hashPassword(pinInput);

    const isPinMatch = 
      (user.pin_hash && user.pin_hash === hashedPin) ||
      (user.pin_hash && user.pin_hash === pinInput) ||
      (user.child_login_pin && user.child_login_pin === pinInput);

    const isPasswordMatch = user.password_hash && user.password_hash === hashedPassword;

    if (!isPinMatch && !isPasswordMatch) {
      // Track failed attempt
      const newFailedAttempts = (user.failed_login_attempts || 0) + 1;
      const shouldLock = newFailedAttempts >= 5;

      await db.entities.User.update(user.id, {
        failed_login_attempts: newFailedAttempts,
        account_locked: shouldLock,
      });

      return Response.json(
        { 
          error: shouldLock 
            ? "PIN/Kata laluan salah. Akaun dikunci kerana terlalu banyak percubaan." 
            : "PIN atau Kata Laluan tidak sah. Sila cuba lagi." 
        },
        { status: 401, headers: resHeaders }
      );
    }

    // 4. Successful login: reset failed attempts
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
      { error: error.message || "Ralat pelayan semasa log masuk." },
      { status: 500, headers: resHeaders }
    );
  }
});
