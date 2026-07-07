import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ============================================================================
// SESSION TOKEN VERIFICATION — server-side only, never use asServiceRole on client
// ============================================================================

const toHex = (buf) =>
  Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

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

const verifySessionToken = async (token) => {
  try {
    if (!token || typeof token !== 'string') return null;

    const [payloadB64, sigHex] = token.split('.');
    if (!payloadB64 || !sigHex) return null;

    const payload = atob(payloadB64);
    const [userId, expStr] = payload.split('.');
    if (!userId || !expStr) return null;

    const exp = parseInt(expStr, 10);
    if (isNaN(exp) || Date.now() > exp) return null;

    // Verify HMAC signature
    const key = await getSessionKey();
    const encoder = new TextEncoder();
    const expectedSig = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(payload)
    );
    const expectedHex = toHex(expectedSig);

    if (sigHex !== expectedHex) return null;

    return userId;
  } catch (e) {
    return null;
  }
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const token = body.token;

    if (!token) {
      return Response.json({ error: 'Token required' }, { status: 400 });
    }

    const userId = await verifySessionToken(token);
    if (!userId) {
      return Response.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      );
    }

    // Fetch user server-side — asServiceRole is safe here (backend function, not client)
    const user = await base44.asServiceRole.entities.User.get(userId);

    if (!user || user.account_locked) {
      return Response.json(
        { error: 'Invalid or locked account' },
        { status: 403 }
      );
    }

    // Strip sensitive fields before returning
    const { password_hash, pin_hash, ...safeUser } = user;

    return Response.json({
      success: true,
      user: safeUser,
    });
  } catch (error) {
    console.error('VerifyChildSession error:', error);
    return Response.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    );
  }
});