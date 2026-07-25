import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const hashPassword = (password: string) => {
  return btoa(unescape(encodeURIComponent(`SQ_PWD_SALT_${password}_2026`)));
};

const hashPin = (pin: string) => {
  return btoa(unescape(encodeURIComponent(`SQ_PIN_SALT_${pin}_2026`)));
};

const generatePassword = () => {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const numbers = '23456789';
  const special = '@#$%';
  
  let password = '';
  password += upper.charAt(Math.floor(Math.random() * upper.length));
  password += lower.charAt(Math.floor(Math.random() * lower.length));
  password += numbers.charAt(Math.floor(Math.random() * numbers.length));
  password += special.charAt(Math.floor(Math.random() * special.length));
  
  for (let i = 0; i < 6; i++) {
    const all = upper + lower + numbers + special;
    password += all.charAt(Math.floor(Math.random() * all.length));
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

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: resHeaders });
  }

  try {
    const base44 = createClientFromRequest(req);
    const db = base44.asServiceRole || base44;
    
    // Verify parent is authenticated
    const authUser = await base44.auth.me();
    if (!authUser) {
      return Response.json(
        { success: false, error: 'Unauthorized - Sesi tidak ditemui' }, 
        { status: 401, headers: resHeaders }
      );
    }

    const parent = await db.entities.User.get(authUser.id).catch(() => authUser);

    if (parent.app_role !== 'parent' && authUser.app_role !== 'parent') {
      return Response.json(
        { success: false, error: 'Unauthorized - Hanya ibu bapa dibenarkan' }, 
        { status: 403, headers: resHeaders }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { child_id, action, new_pin } = body;

    if (!child_id) {
      return Response.json(
        { success: false, error: 'ID anak diperlukan' }, 
        { status: 400, headers: resHeaders }
      );
    }

    // Flexible permission checks across all relationship structures
    const currentLinked = parent.linked_student_ids || authUser.linked_student_ids || [];
    const isLinkedInArray = currentLinked.includes(child_id);

    const relationships = await db.entities.ParentChildRelationship.filter({
      parent_id: parent.id,
      child_id: child_id,
    }).catch(() => []);

    const targetChild = await db.entities.User.get(child_id).catch(() => null);
    const isChildLinked = targetChild?.linked_parent_id === parent.id;

    const isAuthorized = isLinkedInArray || relationships.length > 0 || isChildLinked || targetChild?.is_child_account;

    if (!isAuthorized || !targetChild) {
      return Response.json(
        { success: false, error: 'Anda tidak mempunyai kebenaran untuk menguruskan anak ini.' }, 
        { status: 403, headers: resHeaders }
      );
    }

    let result: any = {};

    if (action === 'reset_pin' || action === 'enable_pin') {
      if (!new_pin || !/^\d{4,6}$/.test(new_pin)) {
        return Response.json(
          { success: false, error: 'PIN mestilah 4 hingga 6 digit nombor' }, 
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

      result = { 
        success: true, 
        pin: new_pin,
        message: 'PIN berjaya dikemaskini.' 
      };
    } else if (action === 'reset_password') {
      const newPassword = generatePassword();
      await db.entities.User.update(child_id, {
        password_hash: hashPassword(newPassword),
        failed_login_attempts: 0,
        account_locked: false,
      });
      result = { 
        success: true, 
        password: newPassword,
        message: 'Kata laluan baharu berjaya dijana.' 
      };
    } else if (action === 'disable_pin') {
      await db.entities.User.update(child_id, {
        pin_enabled: false,
        login_method: 'password',
        pin_hash: null,
        child_login_pin: null,
      });
      result = { success: true, message: 'Log masuk PIN dinyahdayakan.' };
    } else if (action === 'unlock_account') {
      await db.entities.User.update(child_id, {
        failed_login_attempts: 0,
        account_locked: false,
      });
      result = { success: true, message: 'Akaun berjaya dibuka kunci.' };
    } else {
      return Response.json(
        { success: false, error: 'Tindakan tidak sah.' }, 
        { status: 400, headers: resHeaders }
      );
    }

    return Response.json(result, { status: 200, headers: resHeaders });

  } catch (error: any) {
    console.error('ResetChildCredentials error:', error);
    return Response.json(
      { success: false, error: error.message || 'Gagal mengemaskini maklumat' }, 
      { status: 500, headers: resHeaders }
    );
  }
});
