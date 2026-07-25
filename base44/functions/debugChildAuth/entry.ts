
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

    const diagnosticLogs: string[] = [];
    diagnosticLogs.push(`🔍 Mula ujian diagnostik untuk input: '${query}'`);

    if (!query) {
      return Response.json(
        { success: false, error: "Input carian (query) diperlukan." },
        { status: 200, headers: resHeaders }
      );
    }

    const cleanQuery = query.toLowerCase();

    // 1. Fetch potential user candidates
    const candidates: any[] = [];

    // Search by student role
    const studentUsers = await db.entities.User.filter({ app_role: "student" }).catch(() => []);
    diagnosticLogs.push(`📊 Rekod murid ditemui dalam DB: ${studentUsers.length}`);

    for (const u of studentUsers) {
      const uUsername = (u.username || "").toLowerCase();
      const uNickname = (u.nickname || "").toLowerCase();
      const uFullName = (u.full_name || "").toLowerCase();
      const uStudentId = (u.student_id || "").toLowerCase();

      const basePrefix = cleanQuery.includes("_") ? cleanQuery.split("_")[0] : cleanQuery;

      if (
        uUsername === cleanQuery ||
        uNickname === cleanQuery ||
        uFullName === cleanQuery ||
        uStudentId === cleanQuery ||
        (basePrefix && (uNickname === basePrefix || uUsername.startsWith(`${basePrefix}_`)))
      ) {
        candidates.push(u);
      }
    }

    if (candidates.length === 0) {
      diagnosticLogs.push(`❌ TIADA AKAUN DITEMUI untuk '${query}'`);
      return Response.json({
        success: false,
        found: false,
        logs: diagnosticLogs,
        error: `Akaun '${query}' tidak ditemui di dalam pangkalan data.`
      }, { status: 200, headers: resHeaders });
    }

    diagnosticLogs.push(`✅ Akaun padanan ditemui: ${candidates.length} rekod.`);

    // 2. Inspect candidate account status
    const target = candidates[0];
    const userAnalysis = {
      id: target.id,
      username: target.username || "TIADA USERNAME",
      nickname: target.nickname || "TIADA NICKNAME",
      full_name: target.full_name || "TIADA NAMA PENUH",
      student_id: target.student_id || "TIADA ID",
      app_role: target.app_role,
      is_child_account: target.is_child_account,
      pin_enabled: target.pin_enabled,
      account_locked: !!target.account_locked,
      failed_attempts: target.failed_login_attempts || 0,
      has_pin_hash: !!target.pin_hash,
      has_password_hash: !!target.password_hash,
    };

    diagnosticLogs.push(`👤 Profil: ${userAnalysis.nickname} (Username: ${userAnalysis.username})`);
    diagnosticLogs.push(`🔒 Status Kunci: ${userAnalysis.account_locked ? "DIKUNCI" : "AKTIF"}`);

    // 3. Test PIN verification if PIN was provided
    let pinVerificationResult = null;
    if (testPin) {
      const hashedInputPin = hashPin(testPin);
      const hashedPasswordInput = hashPassword(testPin);

      const matchSaltedHash = target.pin_hash === hashedInputPin;
      const matchRawHash = target.pin_hash === testPin;
      const matchPasswordHash = target.password_hash === hashedPasswordInput;

      const isPinValid = matchSaltedHash || matchRawHash || matchPasswordHash;

      pinVerificationResult = {
        test_pin: testPin,
        is_valid: isPinValid,
        match_type: matchSaltedHash ? "SALTED_PIN_HASH" : matchRawHash ? "RAW_PIN" : matchPasswordHash ? "PASSWORD_HASH" : "NONE"
      };

      diagnosticLogs.push(`🔑 Ujian PIN '${testPin}': ${isPinValid ? "BERJAYA (VALID)" : "GAGAL (INVALID)"}`);
    }

    return Response.json({
      success: true,
      found: true,
      user: userAnalysis,
      pin_verification: pinVerificationResult,
      logs: diagnosticLogs
    }, { status: 200, headers: resHeaders });

  } catch (error: any) {
    return Response.json({
      success: false,
      error: error.message || "Ralat diagnostik pelayan."
    }, { status: 200, headers: resHeaders });
  }
});
