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
    const db = base44.asServiceRole || base44;
    const body = await req.json().catch(() => ({}));

    const query = (body.query || "").trim();
    const testPin = (body.test_pin || "").trim();

    const logs: string[] = [];
    logs.push(`🔍 Mula ujian diagnostik untuk: '${query}'`);

    if (!query) {
      return Response.json({ success: false, error: "Input carian (query) diperlukan." }, { status: 200, headers: resHeaders });
    }

    const cleanQuery = query.toLowerCase();

    // 1. Fetch records
    const [students, childAccounts] = await Promise.all([
      db.entities.User.filter({ app_role: "student" }).catch(() => []),
      db.entities.User.filter({ is_child_account: true }).catch(() => [])
    ]);

    const userMap = new Map();
    [...students, ...childAccounts].forEach((u: any) => { if (u?.id) userMap.set(u.id, u); });
    const allCandidates = Array.from(userMap.values());

    logs.push(`📊 Jumlah rekod murid dijumpai dalam pangkalan data: ${allCandidates.length}`);

    const basePrefix = cleanQuery.includes("_") ? cleanQuery.split("_")[0] : cleanQuery;

    const matched = allCandidates.find((u: any) => {
      const uUsername = (u.username || "").toLowerCase();
      const uNickname = (u.nickname || "").toLowerCase();
      const uFullName = (u.full_name || "").toLowerCase();
      const uStudentId = (u.student_id || "").toLowerCase();

      return (
        uUsername === cleanQuery ||
        uNickname === cleanQuery ||
        uFullName === cleanQuery ||
        uStudentId === cleanQuery ||
        (basePrefix && (uNickname === basePrefix || uUsername.startsWith(`${basePrefix}_`)))
      );
    });

    if (!matched) {
      logs.push(`❌ AKAUN TIDAK DITEMUI di dalam pangkalan data.`);
      return Response.json({ success: false, found: false, logs, error: `Akaun '${query}' tidak wujud dalam DB.` }, { status: 200, headers: resHeaders });
    }

    logs.push(`✅ Rekod Ditemui: ${matched.nickname} (Username: ${matched.username}, Student ID: ${matched.student_id})`);

    // 2. Test PIN Verification
    let pinTestResult = null;
    if (testPin) {
      const hashedPin = hashPin(testPin);
      const hashedPassword = hashPassword(testPin);

      const isMatch = 
        (matched.child_login_pin && String(matched.child_login_pin).trim() === testPin) ||
        (matched.pin_hash === hashedPin) ||
        (matched.pin_hash === testPin) ||
        (matched.password_hash === hashedPassword);

      pinTestResult = {
        test_pin: testPin,
        is_valid: isMatch,
        has_child_login_pin: !!matched.child_login_pin,
        has_pin_hash: !!matched.pin_hash,
      };

      logs.push(`🔑 Keputusan Ujian PIN '${testPin}': ${isMatch ? "SAH (VALID)" : "SALAH (INVALID)"}`);
    }

    return Response.json({
      success: true,
      found: true,
      user: {
        id: matched.id,
        username: matched.username,
        nickname: matched.nickname,
        full_name: matched.full_name,
        student_id: matched.student_id,
        child_login_pin: matched.child_login_pin,
        account_locked: !!matched.account_locked
      },
      pin_test: pinTestResult,
      logs
    }, { status: 200, headers: resHeaders });

  } catch (error: any) {
    return Response.json({ success: false, error: error.message }, { status: 200, headers: resHeaders });
  }
});
