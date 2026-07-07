import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// MUST match createChildAccount hashing
const hashPassword = (password) => {
  return btoa(unescape(encodeURIComponent(`SQ_PWD_SALT_${password}_2026`)));
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const username = body.username;
    const password = body.password;
    const pin = body.pin;

    if (!username) {
      return Response.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    const cleanUsername = username
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "");

    // 🔥 1. SEARCH USER (STRICT MATCH)
    const users = await base44.asServiceRole.entities.User.filter({
      username: cleanUsername
    });

    console.log("LOGIN DEBUG username:", cleanUsername);
    console.log("FOUND USERS:", users?.length);

    if (!users || users.length === 0) {
      return Response.json(
        { error: `Username '${cleanUsername}' not found in system` },
        { status: 400 }
      );
    }

    const user = users[0];

    // 🔥 2. CHECK ROLE
    if (user.app_role !== "student") {
      return Response.json(
        { error: "This account is not a student account" },
        { status: 403 }
      );
    }

    // 🔥 3. CHECK CHILD FLAG
    if (!user.is_child_account) {
      return Response.json(
        { error: "Invalid student account configuration" },
        { status: 403 }
      );
    }

    // 🔥 4. PASSWORD CHECK
    if (!password) {
      return Response.json(
        { error: "Password required" },
        { status: 400 }
      );
    }

    const hashedInput = hashPassword(password);

    if (hashedInput !== user.password_hash) {
      return Response.json(
        { error: "Incorrect password" },
        { status: 401 }
      );
    }

    // 🔥 5. SUCCESS RESPONSE
    return Response.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        student_id: user.student_id,
        nickname: user.nickname,
        profile_completed: user.profile_completed,
        app_role: user.app_role
      }
    });

  } catch (error) {
    console.error("ChildLogin Error:", error);

    return Response.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
});