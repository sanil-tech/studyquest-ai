import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

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

const hashPassword = (password) => {
  return btoa(unescape(encodeURIComponent(`SQ_PWD_SALT_${password}_2026`)));
};

const hashPin = (pin) => {
  return btoa(unescape(encodeURIComponent(`SQ_PIN_SALT_${pin}_2026`)));
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify parent is authenticated
    const parent = await base44.auth.me();
    if (!parent || parent.app_role !== 'parent') {
      return Response.json({ error: 'Unauthorized - Parent access required' }, { status: 401 });
    }

    const { child_id, action, new_pin } = await req.json();

    if (!child_id) {
      return Response.json({ error: 'Child ID is required' }, { status: 400 });
    }

    // Verify this parent has access to this child
    const relationships = await base44.asServiceRole.entities.ParentChildRelationship.filter({
      parent_id: parent.id,
      child_id: child_id,
      status: 'active',
    });

    if (relationships.length === 0) {
      return Response.json({ error: 'You do not have permission to manage this child' }, { status: 403 });
    }

    const child = (await base44.asServiceRole.entities.User.filter({ id: child_id }))?.[0];
    
    if (!child || !child.is_child_account) {
      return Response.json({ error: 'Invalid child account' }, { status: 400 });
    }

    let result = {};

    if (action === 'reset_password') {
      const newPassword = generatePassword();
      await base44.asServiceRole.entities.User.update(child_id, {
        password_hash: hashPassword(newPassword),
        failed_login_attempts: 0,
        account_locked: false,
      });
      result = { 
        success: true, 
        password: newPassword,
        message: 'Password reset successfully. Please save the new password.' 
      };
    } else if (action === 'reset_pin') {
      if (!new_pin || !/^\d{4,6}$/.test(new_pin)) {
        return Response.json({ error: 'PIN must be 4-6 digits' }, { status: 400 });
      }
      await base44.asServiceRole.entities.User.update(child_id, {
        pin_hash: hashPin(new_pin),
        pin_enabled: true,
        login_method: 'both',
        failed_login_attempts: 0,
        account_locked: false,
      });
      result = { 
        success: true, 
        pin: new_pin,
        message: 'PIN reset successfully.' 
      };
    } else if (action === 'disable_pin') {
      await base44.asServiceRole.entities.User.update(child_id, {
        pin_enabled: false,
        login_method: 'password',
        pin_hash: null,
      });
      result = { success: true, message: 'PIN login disabled.' };
    } else if (action === 'enable_pin') {
      if (!new_pin || !/^\d{4,6}$/.test(new_pin)) {
        return Response.json({ error: 'PIN must be 4-6 digits' }, { status: 400 });
      }
      await base44.asServiceRole.entities.User.update(child_id, {
        pin_hash: hashPin(new_pin),
        pin_enabled: true,
        login_method: 'both',
      });
      result = { success: true, pin: new_pin, message: 'PIN enabled.' };
    } else if (action === 'unlock_account') {
      await base44.asServiceRole.entities.User.update(child_id, {
        failed_login_attempts: 0,
        account_locked: false,
      });
      result = { success: true, message: 'Account unlocked.' };
    } else {
      return Response.json({ error: 'Invalid action' }, { status: 400 });
    }

    return Response.json(result);

  } catch (error) {
    console.error('ResetChildCredentials error:', error);
    return Response.json({ error: error.message || 'Failed to reset credentials' }, { status: 500 });
  }
});