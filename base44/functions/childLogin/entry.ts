import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const hashPassword = (password) => {
  return btoa(unescape(encodeURIComponent(`SQ_PWD_SALT_${password}_2026`)));
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // Look for either username OR student_id from the frontend
    const identifier = body.username || body.student_id;
    const password = body.password;

    if (!identifier) {
      return Response.json({ error: 'Username is required to login.' }, { status: 400 });
    }

    const cleanIdentifier = identifier.trim().toLowerCase();

    // 1. Try searching by username first
    let searchResults = await base44.asServiceRole.entities.User.filter({ username: cleanIdentifier });

    // 2. If it fails, fallback to searching by student_id just in case
    if (!searchResults || searchResults.length === 0) {
      searchResults = await base44.asServiceRole.entities.User.filter({ 
        student_id: identifier.trim().toUpperCase() 
      });
    }

    if (!searchResults || searchResults.length === 0) {
       return Response.json({ error: `Account '${cleanIdentifier}' not found. Please check spelling.` }, { status: 401 });
    }

    const user = searchResults[0];

    if (!user.is_child_account) {
      return Response.json({ error: `This is a parent account. Please use the main login page.` }, { status: 400 });
    }

    const generatedHash = hashPassword(password);
    if (generatedHash !== user.password_hash) {
      return Response.json({ error: `Incorrect password.` }, { status: 401 });
    }

    const sessionData = {
      user_id: user.id,
      username: user.username,
      student_id: user.student_id,
      timestamp: Date.now(),
    };
    
    return Response.json({
      success: true,
      session_token: btoa(JSON.stringify(sessionData)),
      user: {
        id: user.id,
        nickname: user.nickname || "Student",
        username: user.username,
        profile_completed: user.profile_completed,
      },
    });

  } catch (error) {
    return Response.json({ error: `SERVER ERROR: ${error.message}` }, { status: 500 });
  }
});