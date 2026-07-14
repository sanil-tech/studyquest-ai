import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Custom hashing keys synchronized with your creation policies
const hashPassword = (password: string) => {
  return btoa(unescape(encodeURIComponent(`SQ_PWD_SALT_${password}_2026`)));
};

const hashPin = (pin: string) => {
  return btoa(unescape(encodeURIComponent(`SQ_PIN_SALT_${pin}_2026`)));
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // FIX: Using student_id as primary credential tracker per Spec rules
    const studentId = body.student_id;
    const password = body.password;
    const pin = body.pin;

    if (!studentId) {
      return Response.json({ error: "Student ID is required" }, { status: 400 });
    }

    // Clean and normalize identification token
    const cleanStudentId = studentId.trim().toUpperCase();

    // 1. LOOKUP ACCOUNT VIA SERVICE ROLE
    const users = await base44.asServiceRole.entities.User.filter({
      student_id: cleanStudentId
    });

    // FIX: Mitigation against User Enumeration Attacks
    if (!users || users.length === 0) {
      return Response.json({ error: "Invalid Student ID or credentials" }, { status: 400 });
    }

    const user = users[0];

    // 2. ENFORCE STRUCTURAL GUARDRAILS
    if (user.app_role !== "student" || !user.is_child_account) {
      return Response.json({ error: "Access denied. Invalid account type." }, { status: 403 });
    }

    // 3. BRUTE-FORCE PROTECTION CHECK
    if (user.account_locked) {
      return Response.json({ 
        error: "Account is temporarily locked due to multiple failed entry attempts. Please contact your parent." 
      }, { status: 423 });
    }

    let isValid = false;

    // 4. DUAL-MODE RESOLUTION PATHWAY (PASSWORD OR PIN)
    if (password) {
      const hashedInputPassword = hashPassword(password);
      isValid = (hashedInputPassword === user.password_hash);
    } else if (pin) {
      const hashedInputPin = hashPin(pin);
      // Fallback evaluation accommodating potential differences in early migrations
      isValid = (hashedInputPin === user.pin_hash || pin === user.child_login_pin);
    } else {
      return Response.json({ error: "Please provide either your password or login PIN" }, { status: 400 });
    }

    // 5. UPDATE ACCOUNT STATE (SUCCESS VS RUNTIME FAILURE CALCULATION)
    if (!isValid) {
      const currentAttempts = (user.failed_login_attempts || 0) + 1;
      const shouldLock = currentAttempts >= 5;

      await base44.asServiceRole.entities.User.update(user.id, {
        failed_login_attempts: currentAttempts,
        account_locked: shouldLock
      });

      return Response.json({ 
        error: shouldLock 
          ? "Account has been locked after 5 failed attempts." 
          : "Invalid Student ID or credentials" 
      }, { status: 401 });
    }

    // 6. CLEAR LOCK AND RESET LEDGER METRICS ON SUCCESS
    await base44.asServiceRole.entities.User.update(user.id, {
      failed_login_attempts: 0,
      account_locked: false,
      last_login_at: new Date().toISOString()
    });

    return Response.json({
      success: true,
      user: {
        id: user.id,
        student_id: user.student_id,
        nickname: user.nickname,
        profile_completed: user.profile_completed,
        app_role: user.app_role
      }
    });

  } catch (error: any) {
    console.error("ChildLogin Runtime Error:", error);
    return Response.json(
      { error: error.message || "Internal server verification error" },
      { status: 500 }
    );
  }
});
