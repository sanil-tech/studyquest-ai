import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Helper function to hash PINs matching StudyQuest salt specification
const hashPin = (pin: string): string => {
  return btoa(unescape(encodeURIComponent(`SQ_PIN_SALT_${pin}_2026`)));
};

// Helper function to hash passwords matching StudyQuest salt specification
const hashPassword = (password: string): string => {
  return btoa(unescape(encodeURIComponent(`SQ_PWD_SALT_${password}_2026`)));
};

// Helper function to generate a secure random password for password reset requests
const generatePassword = (): string => {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const numbers = '23456789';
  const special = '@#$%';
  
  let password = '';
  password += upper.charAt(Math.floor(Math.random() * upper.length));
  password += lower.charAt(Math.floor(Math.random() * lower.length));
  password += numbers.charAt(Math.floor(Math.random() * numbers.length));
  password += special.charAt(Math.floor(Math.random() * special.length));
  
  const allChars = upper + lower + numbers + special;
  for (let i = 0; i < 6; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }
  
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

Deno.serve(async (req) => {
  const resHeaders = {
    "content-type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: resHeaders });
  }

  try {
    const base44 = createClientFromRequest(req);
    const db = base44.asServiceRole || base44;
    
    // 1. Verify Parent Authentication
    const authUser = await base44.auth.me();
    if (!authUser) {
      return Response.json(
        { success: false, error: 'Akses dinafikan - Sesi log masuk tidak ditemui.' }, 
        { status: 401, headers: resHeaders }
      );
    }

    // Fetch complete parent record from DB using Service Role
    const parent = await db.entities.User.get(authUser.id).catch(() => authUser);

    if (parent.app_role !== 'parent' && authUser.app_role !== 'parent') {
      return Response.json(
        { success: false, error: 'Akses dinafikan - Hanya akaun ibu bapa dibenarkan.' }, 
        { status: 403, headers: resHeaders }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { child_id, action, new_pin } = body;

    if (!child_id) {
      return Response.json(
        { success: false, error: 'ID Anak (child_id) diperlukan.' }, 
        { status: 400, headers: resHeaders }
      );
    }

    // 2. Multi-Strategy Relationship Check (Flexible Authorization)
    const currentLinkedArray = parent.linked_student_ids || authUser.linked_student_ids || [];
    const isLinkedInArray = currentLinkedArray.includes(child_id);

    const activeRelationships = await db.entities.ParentChildRelationship.filter({
      parent_id: parent.id,
      child_id: child_id,
    }).catch(() => []);

    const targetChild = await db.entities.User.get(child_id).catch(() => null);
    const isChildLinkedProperty = targetChild?.linked_parent_id === parent.id;

    const isAuthorized = 
      isLinkedInArray || 
      activeRelationships.length > 0 || 
      isChildLinkedProperty || 
      targetChild?.is_child_account;

    if (!isAuthorized || !targetChild) {
      return Response.json(
        { success: false, error: 'Anda tidak mempunyai kebenaran untuk menguruskan akaun anak ini.' }, 
        { status: 403, headers: resHeaders }
      );
    }

    let resultPayload: Record<string, any> = {};

    // 3. Process Requested Credential Management Action
    if (action === 'reset_pin' || action === 'enable_pin') {
      if (!new_pin || !/^\d{4,6}$/.test(new_pin)) {
        return Response.json(
          { success: false, error: 'PIN mestilah mengandungi 4 hingga 6 digit nombor sahaja.' }, 
          { status: 400, headers: resHeaders }
        );
      }

      await db.entities.User.update(child_id, {
        pin_hash: hashPin(new_pin),
        child_login_pin: new_pin,
        pin_enabled: true,
        login_method: 'both',
        failed_login_attempts: 0,
        account_locked: false,
      });

      resultPayload = { 
        success: true, 
        pin: new_pin,
        message: 'PIN murid berjaya dikemaskini dan akaun dibuka kunci.' 
      };

    } else if (action === 'reset_password') {
      const generatedPwd = generatePassword();

      await db.entities.User.update(child_id, {
        password_hash: hashPassword(generatedPwd),
        failed_login_attempts: 0,
        account_locked: false,
      });

      resultPayload = { 
        success: true, 
        password: generatedPwd,
        message: 'Kata laluan baharu berjaya dijana.' 
      };

    } else if (action === 'disable_pin') {
      await db.entities.User.update(child_id, {
        pin_enabled: false,
        login_method: 'password',
        pin_hash: null,
        child_login_pin: null,
      });

      resultPayload = { 
        success: true, 
        message: 'Log masuk PIN telah dinyahdayakan.' 
      };

    } else if (action === 'unlock_account') {
      await db.entities.User.update(child_id, {
        failed_login_attempts: 0,
        account_locked: false,
      });

      resultPayload = { 
        success: true, 
        message: 'Akaun anak berjaya dibuka kunci.' 
      };

    } else {
      return Response.json(
        { success: false, error: 'Tindakan (action) tidak sah.' }, 
        { status: 400, headers: resHeaders }
      );
    }

    return Response.json(resultPayload, { status: 200, headers: resHeaders });

  } catch (error: any) {
    console.error('ResetChildCredentials Edge Function Error:', error);
    return Response.json(
      { success: false, error: error.message || 'Ralat pelayan semasa mengemas kini kredential.' }, 
      { status: 500, headers: resHeaders }
    );
  }
});
