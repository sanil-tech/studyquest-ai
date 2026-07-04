import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const hashPassword = (password) => {
  return btoa(unescape(encodeURIComponent(`SQ_PWD_SALT_${password}_2026`)));
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const identifier = body.username || body.student_id;
    const password = body.password;

    if (!identifier) {
      return Response.json({ error: 'Username is required to login.' }, { status: 400 });
    }

    const cleanIdentifier = identifier.trim().toLowerCase();
    
    // === 🔍 [DEBUG LOG 1] LIHAT APA YANG FRONTEND HANTAR ===
    console.log(`[LOGIN TRY] Mencari akaun dengan identifier bersih: "${cleanIdentifier}"`);

    // 1. Cuba cari menggunakan username
    let searchResults = await base44.asServiceRole.entities.User.filter({ username: cleanIdentifier });

    // === 🔍 [DEBUG LOG 2] JIKA GAGAL, KITA LIHAT SEMUA USER DALAM DB ===
    if (!searchResults || searchResults.length === 0) {
      console.log(`[DEBUG] Username "${cleanIdentifier}" tidak jumpa. Membaca 5 user terakhir untuk semakan...`);
      try {
        const allUsers = await base44.asServiceRole.entities.User.list({ limit: 5 });
        allUsers.forEach(u => {
          console.log(`-> DB User ID: ${u.id} | Username: "${u.username}" | Role: ${u.app_role} | IsChild: ${u.is_child_account} | Status: ${u.status}`);
        });
      } catch (dbErr) {
        console.log(`[DEBUG] Gagal membaca senarai user:`, dbErr.message);
      }

      // Fallback ke student_id
      searchResults = await base44.asServiceRole.entities.User.filter({ 
        student_id: identifier.trim().toUpperCase() 
      });
    }

    if (!searchResults || searchResults.length === 0) {
       return Response.json({ error: `Account '${cleanIdentifier}' not found. Please check spelling.` }, { status: 401 });
    }

    const user = searchResults[0];
    
    // === 🔍 [DEBUG LOG 3] JIKA JUMPA USER TAPI KENA REJECT ===
    console.log(`[DEBUG] User dijumpai! ID: ${user.id}, Username: ${user.username}, IsChild: ${user.is_child_account}, Status: ${user.status}`);

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