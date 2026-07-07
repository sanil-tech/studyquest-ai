import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ============================================================================
// CRYPTO UTILITIES — PBKDF2 (non-reversible) + HMAC session tokens
// ============================================================================

const PBKDF2_ITERATIONS = 100000;

const toHex = (buf) =>
  Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

const deriveBits = async (password, salt, iterations) => {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: encoder.encode(salt), iterations, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  return toHex(bits);
};

// Store format: pbkdf2$<iterations>$<salt>$<hash_hex>
const hashSecret = async (secret) => {
  const salt = crypto.randomUUID();
  const hash = await deriveBits(secret, salt, PBKDF2_ITERATIONS);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${salt}$${hash}`;
};

const verifySecret = async (secret, stored) => {
  if (typeof stored !== 'string') return false;
  const parts = stored.split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;
  const iterations = parseInt(parts[1], 10);
  const salt = parts[2];
  const expected = parts[3];
  const computed = await deriveBits(secret, salt, iterations);
  return computed === expected;
};

// Legacy btoa "hash" — ONLY for one-time backward-compat upgrade, never for new storage
const legacyHash = (password) =>
  btoa(unescape(encodeURIComponent(`SQ_PWD_SALT_${password}_2026`)));

// ---- HMAC session token signing ----
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const getSessionKey = async () => {
  const appId = Deno.env.get('BASE44_APP_ID') || 'studyquest';
  const pepper = 'SQ_SESSION_SIGN_PEPPER_2026';
  const encoder = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(appId + pepper),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
};

const createSessionToken = async (userId) => {
  const exp = Date.now() + SESSION_TTL_MS;
  const payload = `${userId}.${exp}`;
  const key = await getSessionKey();
  const encoder = new TextEncoder();
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return `${btoa(payload)}.${toHex(sig)}`;
};

// ============================================================================
// HANDLER
// ============================================================================

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const username = body.username;
    const password = body.password;

    if (!username) {
      return Response.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    const cleanUsername = username
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '');

    // 1. LOOKUP USER (asServiceRole — server-side only, never exposed to client)
    const users = await base44.asServiceRole.entities.User.filter({
      username: cleanUsername,
    });

    console.log('LOGIN DEBUG username:', cleanUsername);
    console.log('FOUND USERS:', users?.length);

    if (!users || users.length === 0) {
      return Response.json(
        { error: `Username '${cleanUsername}' not found in system` },
        { status: 400 }
      );
    }

    const user = users[0];

    // 2. CHECK ROLE
    if (user.app_role !== 'student') {
      return Response.json(
        { error: 'This account is not a student account' },
        { status: 403 }
      );
    }

    // 3. CHECK CHILD FLAG
    if (!user.is_child_account) {
      return Response.json(
        { error: 'Invalid student account configuration' },
        { status: 403 }
      );
    }

    // 4. CHECK ACCOUNT LOCK
    if (user.account_locked) {
      return Response.json(
        { error: 'Account is locked. Please ask your parent to unlock it.' },
        { status: 403 }
      );
    }

    // 5. PASSWORD VERIFICATION (PBKDF2, with one-time legacy upgrade)
    if (!password) {
      return Response.json(
        { error: 'Password required' },
        { status: 400 }
      );
    }

    let passwordValid = await verifySecret(password, user.password_hash);

    // Backward compat: if stored hash is legacy btoa, verify + upgrade to PBKDF2
    if (
      !passwordValid &&
      user.password_hash &&
      !user.password_hash.startsWith('pbkdf2$')
    ) {
      if (legacyHash(password) === user.password_hash) {
        passwordValid = true;
        const upgradedHash = await hashSecret(password);
        await base44.asServiceRole.entities.User.update(user.id, {
          password_hash: upgradedHash,
        });
      }
    }

    if (!passwordValid) {
      return Response.json(
        { error: 'Incorrect password' },
        { status: 401 }
      );
    }

    // 6. ISSUE SIGNED SESSION TOKEN (HMAC, server-side key)
    const sessionToken = await createSessionToken(user.id);

    // 7. SUCCESS
    return Response.json({
      success: true,
      session_token: sessionToken,
      user: {
        id: user.id,
        username: user.username,
        student_id: user.student_id,
        nickname: user.nickname,
        profile_completed: user.profile_completed,
        app_role: user.app_role,
        account_locked: user.account_locked,
      },
    });
  } catch (error) {
    console.error('ChildLogin Error:', error);
    return Response.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    );
  }
});