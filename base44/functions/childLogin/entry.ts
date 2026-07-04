import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

// ==========================
// Password Hash Function (MUST MATCH createChildAccount)
// ==========================
const hashPassword = (password) => {
  return btoa(
    unescape(encodeURIComponent(`SQ_PWD_SALT_${password}_2026`))
  );
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const body = await req.json();

    const identifier = body.username || body.student_id;
    const password = body.password;

    // ==========================
    // VALIDATION
    // ==========================
    if (!identifier || !password) {
      return Response.json(
        { error: "Username and password are required." },
        { status: 400 }
      );
    }

    const cleanIdentifier = identifier.trim().toLowerCase();

    // ==========================
    // LOAD ALL USERS (SAFE MATCH)
    // ==========================
    const users = await base44.asServiceRole.entities.User.filter({});

    // ==========================
    // FIND USER (USERNAME OR STUDENT ID)
    // ==========================
    const user = users.find((u) => {
      const usernameMatch =
        (u.username || "").trim().toLowerCase() === cleanIdentifier;

      const studentIdMatch =
        (u.student_id || "").trim().toLowerCase() === cleanIdentifier;

      return usernameMatch || studentIdMatch;
    });

    // ==========================
    // NOT FOUND
    // ==========================
    if (!user) {
      return Response.json(
        { error: "Username not found. Please check again." },
        { status: 404 }
      );
    }

    // ==========================
    // CHECK CHILD ACCOUNT FLAG
    // ==========================
    if (!user.is_child_account) {
      return Response.json(
        { error: "This account is not a student account." },
        { status: 403 }
      );
    }

    // ==========================
    // CHECK ACCOUNT STATUS
    // ==========================
    if (user.status !== "active") {
      return Response.json(
        { error: "Account is inactive. Please contact parent." },
        { status: 403 }
      );
    }

    // ==========================
    // PASSWORD CHECK
    // ==========================
    const inputHash = hashPassword(password);

    if (user.password_hash !== inputHash) {
      return Response.json(
        { error: "Incorrect password." },
        { status: 401 }
      );
    }

    // ==========================
    // SUCCESS LOGIN
    // ==========================
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
    console.error("ChildLogin Error:", error);

    return Response.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
});