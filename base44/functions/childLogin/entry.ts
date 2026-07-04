import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

const hashPassword = (password) => {
  return btoa(unescape(encodeURIComponent(`SQ_PWD_SALT_${password}_2026`)));
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const identifier = body.username || body.student_id;
    const password = body.password;

    if (!identifier || !password) {
      return Response.json(
        { error: "Username and password are required." },
        { status: 400 }
      );
    }

    const cleanUsername = identifier.trim().toLowerCase();

    let user = null;

    // =========================
    // 1. SEARCH BY USERNAME
    // =========================
    const byUsername = await base44.asServiceRole.entities.User.filter({
      username: cleanUsername,
    });

    if (byUsername?.length > 0) {
      user = byUsername[0];
    }

    // =========================
    // 2. FALLBACK: SEARCH BY STUDENT ID
    // =========================
    if (!user) {
      const byStudentId = await base44.asServiceRole.entities.User.filter({
        student_id: identifier.trim().toUpperCase(),
      });

      if (byStudentId?.length > 0) {
        user = byStudentId[0];
      }
    }

    // =========================
    // 3. USER NOT FOUND
    // =========================
    if (!user) {
      return Response.json(
        { error: "Account not found. Please check username." },
        { status: 404 }
      );
    }

    // =========================
    // 4. CHILD ACCOUNT CHECK
    // =========================
    if (!user.is_child_account) {
      return Response.json(
        { error: "This account is not a student account." },
        { status: 403 }
      );
    }

    if (user.status !== "active") {
      return Response.json(
        { error: "Account is not active. Please contact parent." },
        { status: 403 }
      );
    }

    // =========================
    // 5. PASSWORD CHECK
    // =========================
    const inputHash = hashPassword(password);

    if (user.password_hash !== inputHash) {
      return Response.json(
        { error: "Incorrect password." },
        { status: 401 }
      );
    }

    // =========================
    // 6. SUCCESS LOGIN
    // =========================
    const sessionData = {
      user_id: user.id,
      username: user.username,
      student_id: user.student_id,
      role: "child",
      timestamp: Date.now(),
    };

    return Response.json({
      success: true,
      session_token: btoa(JSON.stringify(sessionData)),
      user: {
        id: user.id,
        full_name: user.full_name,
        nickname: user.nickname,
        username: user.username,
        student_id: user.student_id,
        profile_completed: user.profile_completed,
      },
    });

  } catch (error) {
    return Response.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
});