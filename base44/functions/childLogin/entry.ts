import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Salted PIN Hash Helper
const hashPin = (pin: string) => {
  return btoa(unescape(encodeURIComponent(`SQ_PIN_SALT_${pin}_2026`)));
};

// Salted Password Hash Helper
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

    // 🔍 STAGE 1: Direct exact query on User entity (username, nickname, student_id, id)
    if (!matchedUser) {
      const byUsername = await db.entities.User.filter({ username: cleanInput }).catch(() => []);
      if (byUsername && byUsername.length > 0) matchedUser = byUsername[0];
    }

    if (!matchedUser) {
      const byNickname = await db.entities.User.filter({ nickname: rawInput }).catch(() => []);
      if (byNickname && byNickname.length > 0) matchedUser = byNickname[0];
    }

    if (!matchedUser) {
      const byStudentId = await db.entities.User.filter({ student_id: rawInput.toUpperCase() }).catch(() => []);
      if (byStudentId && byStudentId.length > 0) matchedUser = byStudentId[0];
    }

    // 🔍 STAGE 2: Cross-reference LinkRequest table (Where student_username is stored)
    if (!matchedUser) {
      const linkRequests = await db.entities.LinkRequest.filter({}).catch(() => []);
      const matchedLink = linkRequests.find((lr: any) => {
        const sUsername = (lr.student_username || "").toLowerCase();
        const sName = (lr.student_name || "").toLowerCase();
        return sUsername === cleanInput || sName === cleanInput || sName === cleanInput.split("_")[0];
      });

      if (matchedLink && matchedLink.student_id) {
        const childFromLink = await db.entities.User.get(matchedLink.student_id).catch(() => null);
        if (childFromLink) matchedUser = childFromLink;
      }
    }

    // 🔍 STAGE 3: Broad candidate scan across student role records
    if (!matchedUser) {
      const [students, childAccounts] = await Promise.all([
        db.entities.User.filter({ app_role: "student" }).catch(() => []),
        db.entities.User.filter({ is_child_account: true }).catch(() => [])
      ]);

      const candidateMap = new Map();
      [...students, ...childAccounts].forEach((u: any) => {
        if (u && u.id) candidateMap.set(u.id, u);
      });
      const candidates = Array.from(candidateMap.values());

      const basePrefix = cleanInput.includes("_") ? cleanInput.split("_")[0] : cleanInput;

      matchedUser = candidates.find((u: any) => {
        const uUsername = (u.username || "").toLowerCase();
        const uNickname = (u.nickname || "").toLowerCase();
        const uFullName = (u.full_name || "").toLowerCase();
        const uStudentId = (u.student_id || "").toLowerCase();

        return (
          uUsername === cleanInput ||
          uNickname === cleanInput ||
          uFullName === cleanInput ||
          uStudentId === cleanInput ||
          (basePrefix && basePrefix.length >= 2 && (uNickname === basePrefix || uUsername.startsWith(`${basePrefix}_`)))
        );
      }) || null;
    }

    if (!matchedUser) {
      return Response.json(
        { success: false, error: `Akaun murid '${rawInput}' tidak ditemui dalam sistem.` },
        { status: 200, headers: resHeaders }
      );
    }

    const user = matchedUser;

    // 🔄 STAGE 4: Self-Healing DB Sync (Update missing username in User table for fast future lookups)
    if (!user.username || user.username.toLowerCase() !== cleanInput) {
      await db.entities.User.update(user.id, { username: cleanInput }).catch(() => null);
    }

    // Check account lockout status
    if (user.account_locked) {
      return Response.json(
        { success: false, error: "Akaun ini telah dikunci sementara. Sila minta ibu bapa anda untuk membuka semula kunci." },
        { status: 200, headers: resHeaders }
      );
    }

    // 🔑 STAGE 5: Multi-Format PIN Verification
    const hashedPin = hashPin(pinInput);
    const hashedPassword = hashPassword(pinInput);

    const isPinMatch = 
      (user.child_login_pin && String(user.child_login_pin).trim() === pinInput) ||
      (user.pin_hash && user.pin_hash === hashedPin) ||
      (user.pin_hash && user.pin_hash === pinInput) ||
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

    // Reset failed attempts counter on successful authentication
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
          username: user.username || cleanInput,
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
