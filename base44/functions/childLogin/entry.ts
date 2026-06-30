import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const hashPassword = (password) => {
  return btoa(unescape(encodeURIComponent(`SQ_PWD_SALT_${password}_2026`)));
};

const hashPin = (pin) => {
  return btoa(unescape(encodeURIComponent(`SQ_PIN_SALT_${pin}_2026`)));
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { student_id, password, pin } = await req.json();

    if (!student_id) {
      return Response.json({ error: 'Student ID is required' }, { status: 400 });
    }

    const rawInput = student_id.trim();
    const uppercaseInput = rawInput.toUpperCase();
    const cleanNoDash = uppercaseInput.replace(/[^A-Z0-9]/g, ''); // e.g., "SQQG2XQA"

    let user = null;
    let searchResults = [];

    // --- DEEP ENTITY FIELD SCANNING MATRIX ---

    // 1. Try scanning the standard student_id field variations
    searchResults = await base44.asServiceRole.entities.User.filter({ student_id: uppercaseInput });
    if (searchResults.length === 0) searchResults = await base44.asServiceRole.entities.User.filter({ student_id: rawInput });
    if (searchResults.length === 0) searchResults = await base44.asServiceRole.entities.User.filter({ student_id: cleanNoDash });

    // 2. Try scanning alternate possible field keys if your modal saved it elsewhere
    if (searchResults.length === 0) searchResults = await base44.asServiceRole.entities.User.filter({ username: rawInput.toLowerCase() });
    if (searchResults.length === 0) searchResults = await base44.asServiceRole.entities.User.filter({ username: uppercaseInput });
    if (searchResults.length === 0) searchResults = await base44.asServiceRole.entities.User.filter({ display_id: uppercaseInput });
    if (searchResults.length === 0) searchResults = await base44.asServiceRole.entities.User.filter({ display_student_id: uppercaseInput });

    // Assign user if any matching filter query returns data
    if (searchResults && searchResults.length > 0) {
      user = searchResults[0];
    }

    // 3. Last resort fallback: Check direct database row primary key matching
    if (!user) {
      try {
        const structuralRecord = await base44.asServiceRole.entities.User.get(rawInput);
        if (structuralRecord) user = structuralRecord;
      } catch (e) {
        // Not a valid primary UUID format string, ignore safely
      }
    }

    // If absolutely no user row matches, stop execution safely
    if (!user) {
      return Response.json({ error: 'Incorrect Student ID' }, { status: 401 });
    }

    // Check if account is locked
    if (user.account_locked) {
      return Response.json({ 
        error: 'Account temporarily locked. Please contact your parent.', 
        locked: true 
      }, { status: 403 });
    }

    // Check if this is a child account
    if (!user.is_child_account) {
      return Response.json({ error: 'This account requires parent login. Please use the main login page.' }, { status: 400 });
    }

    let authenticated = false;
    const loginMethod = user.login_method || 'password';

    // Validate based on login method
    if (loginMethod === 'password' || loginMethod === 'both') {
      if (password) {
        const passwordHash = hashPassword(password);
        if (passwordHash === user.password_hash) {
          authenticated = true;
        }
      }
    }

    if (!authenticated && (loginMethod === 'pin' || loginMethod === 'both')) {
      if (pin && user.pin_hash) {
        const pinHash = hashPin(pin);
        if (pinHash === user.pin_hash) {
          authenticated = true;
        }
      }
    }

    if (!authenticated) {
      // Increment failed attempts
      const newAttempts = (user.failed_login_attempts || 0) + 1;
      const lockThreshold = 5;
      
      await base44.asServiceRole.entities.User.update(user.id, {
        failed_login_attempts: newAttempts,
        account_locked: newAttempts >= lockThreshold,
      });

      return Response.json({ 
        error: 'Incorrect details, please try again',
        attempts_remaining: Math.max(0, lockThreshold - newAttempts),
      }, { status: 401 });
    }

    // Successful login - reset failed attempts and update last login
    await base44.asServiceRole.entities.User.update(user.id, {
      failed_login_attempts: 0,
      account_locked: false,
      last_login_at: new Date().toISOString(),
    });

    // Create a session token by encoding user ID with timestamp
    const sessionData = {
      user_id: user.id,
      student_id: user.student_id || rawInput,
      app_role: user.app_role,
      timestamp: Date.now(),
      expires_at: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
    };
    const sessionToken = btoa(JSON.stringify(sessionData));

    // Return user data and session token
    return Response.json({
      success: true,
      session_token: sessionToken,
      user: {
        id: user.id,
        full_name: user.full_name,
        nickname: user.nickname || user.full_name,
        student_id: user.student_id || rawInput,
        app_role: user.app_role,
        profile_completed: user.profile_completed,
        avatar_photo_url: user.avatar_photo_url,
      },
      message: `Welcome back, ${user.nickname || user.full_name}!`,
    });

  } catch (error) {
    console.error('ChildLogin error:', error);
    return Response.json({ error: error.message || 'Login failed' }, { status: 500 });
  }
});