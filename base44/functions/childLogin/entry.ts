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

    const usernameInput = (body.username || body.student_id || "").trim().toLowerCase();
    const pinInput = (body.pin || body.password || "").trim();

    if (!usernameInput) {
      return Response.json({ success: false, error: "Sila masukkan Username atau ID Murid." }, { status: 200, headers: resHeaders });
    }

    if (!pinInput) {
      return Response.json({ success: false, error: "Sila masukkan PIN atau Kata Laluan." }, { status: 200, headers: resHeaders });
    }

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
        { success: false, error: `Akaun murid '${usernameInput}' tidak ditemui.` },
        { status: 200, headers: resHeaders }
      );
    }

    if (user.account_locked) {
      return Response.json(
        { success: false, error: "Akaun ini telah dikunci sementara. Sila minta ibu bapa anda untuk membuka semula kunci." },
        { status: 200, headers: resHeaders }
      );
    }

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
