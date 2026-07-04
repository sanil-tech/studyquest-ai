import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

const hashPassword = (password) => {
  return btoa(unescape(encodeURIComponent(`SQ_PWD_SALT_${password}_2026`)));
};

const hashPin = (pin) => {
  return btoa(unescape(encodeURIComponent(`SQ_PIN_SALT_${pin}_2026`)));
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const { username, password, pin } = await req.json();

    if (!username) {
      return Response.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim().toLowerCase();

    // 1. FIND USER
    const users = await base44.asServiceRole.entities.User.filter({
      username: cleanUsername,
    });

    if (!users.length) {
      return Response.json(
        { error: "Username not found" },
        { status: 400 }
      );
    }

    const user = users[0];

    // 2. CHECK ACCOUNT STATUS
    if (user.account_locked) {
      return Response.json(
        { error: "Account locked. Please contact parent." },
        { status: 403 }
      );
    }

    // 3. PASSWORD LOGIN
    if (password) {
      const hashed = hashPassword(password);

      if (user.password_hash !== hashed) {
        // optional: increment failed attempts
        const attempts = (user.failed_login_attempts || 0) + 1;

        const updateData = {
          failed_login_attempts: attempts,
        };

        if (attempts >= 5) {
          updateData.account_locked = true;
        }

        await base44.asServiceRole.entities.User.update(user.id, updateData);

        return Response.json(
          { error: "Wrong password" },
          { status: 400 }
        );
      }
    }

    // 4. PIN LOGIN (optional)
    if (pin) {
      if (!user.pin_hash) {
        return Response.json(
          { error: "PIN not enabled for this account" },
          { status: 400 }
        );
      }

      const hashedPin = hashPin(pin);

      if (user.pin_hash !== hashedPin) {
        return Response.json(
          { error: "Wrong PIN" },
          { status: 400 }
        );
      }
    }

    // 5. RESET FAILED ATTEMPTS ON SUCCESS
    await base44.asServiceRole.entities.User.update(user.id, {
      failed_login_attempts: 0,
    });

    // 6. SUCCESS RESPONSE (SAFE)
    return Response.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        nickname: user.nickname,
        student_id: user.student_id,
        app_role: user.app_role,
        profile_completed: user.profile_completed,
        is_child_account: user.is_child_account,
        linked_parent_id: user.linked_parent_id,
      },
    });

  } catch (error) {
    console.error("Child login error:", error);

    return Response.json(
      {
        error: error.message || "Login failed",
      },
      { status: 500 }
    );
  }
});