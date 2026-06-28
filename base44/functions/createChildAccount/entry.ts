import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ==========================
// SECURITY HELPERS
// ==========================
const hashPassword = (password) =>
  btoa(unescape(encodeURIComponent(`SQ_PWD_SALT_${password}_2026`)));

const hashPin = (pin) =>
  btoa(unescape(encodeURIComponent(`SQ_PIN_SALT_${pin}_2026`)));

const cleanName = (name) => (name ? name.trim() : '');

const generateId = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = 'SQ-';
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
};

const generatePassword = () => {
  const chars =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ23456789!@#$';
  let pwd = '';
  for (let i = 0; i < 6; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pwd;
};

// ==========================
// MAIN FUNCTION
// ==========================
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const body = await req.json().catch(() => null);
    if (!body) {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const payload = body?.childData || body;

    if (!payload.full_name || !payload.date_of_birth) {
      return Response.json(
        { error: 'Full name and date of birth are required' },
        { status: 400 }
      );
    }

    const fullName = cleanName(payload.full_name);
    const nickname = payload.nickname
      ? cleanName(payload.nickname)
      : fullName.split(' ')[0];

    // ==========================
    // GET CURRENT USER (PARENT)
    // ==========================
    const currentUser = await base44.auth.getUser();

    if (!currentUser) {
      return Response.json(
        { error: 'Unauthorized - no parent session' },
        { status: 401 }
      );
    }

    if (currentUser.app_role !== 'parent') {
      return Response.json(
        { error: 'Only parents can create child accounts' },
        { status: 403 }
      );
    }

    // ==========================
    // GENERATE UNIQUE STUDENT ID
    // ==========================
    let studentId = generateId();
    let attempts = 0;

    while (attempts < 10) {
      const existing = await base44.asServiceRole.entities.User.filter({
        student_id: studentId,
      });

      if (existing.length === 0) break;

      studentId = generateId();
      attempts++;
    }

    if (attempts >= 10) {
      return Response.json(
        { error: 'Failed to generate unique Student ID' },
        { status: 500 }
      );
    }

    // ==========================
    // CREDENTIALS
    // ==========================
    const dummyEmail = `${studentId}@student.studyquest.local`;
    const password = generatePassword();
    const passwordHash = hashPassword(password);

    let pinHash = null;
    let loginMethod = 'password';

    if (payload.pin) {
      pinHash = hashPin(payload.pin);
      loginMethod = 'both';
    }

    // ==========================
    // CREATE CHILD USER
    // ==========================
    const newUser = await base44.asServiceRole.entities.User.create({
      full_name: fullName,
      nickname,
      email: dummyEmail,
      app_role: 'student',
      date_of_birth: payload.date_of_birth,
      gender: payload.gender || null,

      student_id: studentId,
      password_hash: passwordHash,
      pin_hash: pinHash,
      login_method: loginMethod,

      is_child_account: true,

      // 🔥 CRITICAL RELATIONSHIP FIELD
      parent_id: currentUser.id,

      account_locked: false,
      failed_login_attempts: 0,
      profile_completed: false,
    });

    // ==========================
    // RESPONSE
    // ==========================
    return Response.json({
      success: true,
      user: newUser,
      credentials: {
        student_id: studentId,
        password,
        pin: payload.pin || null,
      },
    });
  } catch (error) {
    console.error('CreateChildAccount error:', error);

    return Response.json(
      { error: error.message || 'Creation failed' },
      { status: 500 }
    );
  }
});