import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const hashPassword = (password) => {
  return btoa(unescape(encodeURIComponent(`SQ_PWD_SALT_${password}_2026`)));
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { student_id, password } = await req.json();

    if (!student_id) {
      return Response.json({ error: 'Student ID is required' }, { status: 400 });
    }

    const rawInput = student_id.trim();
    const uppercaseInput = rawInput.toUpperCase();

    // 1. Let's do a direct search for the student ID
    let searchResults = await base44.asServiceRole.entities.User.filter({ student_id: uppercaseInput });

    // X-RAY CHECK 1: If it didn't find the user, tell us EXACTLY what happened!
    if (!searchResults || searchResults.length === 0) {
      // Let's search all users to see if ANY exist to verify database connection
      const allUsers = await base44.asServiceRole.entities.User.filter({});
      const allUserIds = allUsers.map(u => u.student_id).filter(id => id).join(', ');

      return Response.json({ 
        error: `DIAGNOSTIC: Could not find ${uppercaseInput}. Found these IDs in DB: [${allUserIds || "None"}]` 
      }, { status: 401 });
    }

    const user = searchResults[0];

    // X-RAY CHECK 2: Found the user, but maybe the account types are blocking them?
    if (!user.is_child_account) {
      return Response.json({ error: `DIAGNOSTIC: Found user, but is_child_account is ${user.is_child_account}` }, { status: 400 });
    }

    // X-RAY CHECK 3: Test Password Hash Match
    const generatedHash = hashPassword(password);
    if (generatedHash !== user.password_hash) {
      return Response.json({ 
        error: `DIAGNOSTIC: Password mismatch! DB Hash: ${user.password_hash?.substring(0,5)}... Input Hash: ${generatedHash?.substring(0,5)}...` 
      }, { status: 401 });
    }

    // Successful login!
    const sessionData = {
      user_id: user.id,
      student_id: user.student_id,
      timestamp: Date.now(),
    };
    const sessionToken = btoa(JSON.stringify(sessionData));

    return Response.json({
      success: true,
      session_token: sessionToken,
      user: {
        id: user.id,
        nickname: user.nickname || user.full_name,
        student_id: user.student_id,
        profile_completed: user.profile_completed,
      },
    });

  } catch (error) {
    return Response.json({ error: `SERVER ERROR: ${error.message}` }, { status: 500 });
  }
});