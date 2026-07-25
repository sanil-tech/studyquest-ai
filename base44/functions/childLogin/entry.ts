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
    let matchedUser: any = null;

    // 🔍 STAGE 1: Exact search by username
    if (!matchedUser) {
      const byUsername = await db.entities.User.filter({ username: cleanInput }).catch(() => []);
      if (byUsername && byUsername.length > 0) matchedUser = byUsername[0];
    }

    // 🔍 STAGE 2: Exact search by nickname
    if (!matchedUser) {
      const byNickname = await db.entities.User.filter({ nickname: rawInput }).catch(() => []);
      if (byNickname && byNickname.length > 0) matchedUser = byNickname[0];
    }

    // 🔍 STAGE 3: Filter by role "student" (Valid, non-empty filter)
    if (!matchedUser) {
      const students = await db.entities.User.filter({ app_role: "student" }).catch(() => []);
      const basePrefix = cleanInput.includes("_") ? cleanInput.split("_")[0] : cleanInput;

      matchedUser = students.find((u: any) => {
        const uUsername = (u.username || "").toLowerCase();
        const uNickname = (u.nickname || "").toLowerCase();
        const uFullName = (u.full_name || "").toLowerCase();
        const uStudentId = (u.student_id || "").toLowerCase();

        return (
          uUsername === cleanInput ||
          uNickname === cleanInput ||
          uFullName === cleanInput ||
          uStudentId === cleanInput ||
          (basePrefix && (uNickname === basePrefix || uUsername.startsWith(`${basePrefix}_`)))
        );
      }) || null;
    }

    // 🔍 STAGE 4: Filter by is_child_account
    if (!matchedUser) {
      const childAccounts = await db.entities.User.filter({ is_child_account: true }).catch(() => []);
      matchedUser = childAccounts.find((u: any) => {
        const uUsername = (u.username || "").toLowerCase();
        const uNickname = (u.nickname || "").toLowerCase();
        const uFullName = (u.full_name || "").toLowerCase();
        return uUsername === cleanInput || uNickname === cleanInput || uFullName === cleanInput;
      }) || null;
    }

    if (!matchedUser) {
      return Response.json(
        { success: false, error: `Akaun murid '${rawInput}' tidak ditemui dalam sistem.` },
        { status: 200, headers: resHeaders }
      );
    }

    const user = matchedUser;

    // Check account lockout status
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

    // Reset failed login attempts on successful authentication
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
