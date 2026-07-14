import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Algoritma Fisher-Yates untuk kocakan rawak yang lebih selamat berbanding sort()
const shuffleString = (str: string) => {
  const arr = str.split('');
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join('');
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
  
  const all = upper + lower + numbers + special;
  for (let i = 0; i < 6; i++) {
    password += all.charAt(Math.floor(Math.random() * all.length));
  }
  
  return shuffleString(password);
};

const hashPassword = (password: string) => btoa(unescape(encodeURIComponent(`SQ_PWD_SALT_${password}_2026`)));
const hashPin = (pin: string) => btoa(unescape(encodeURIComponent(`SQ_PIN_SALT_${pin}_2026`)));

Deno.serve(async (req: Request) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // 1. Pengesahan Ibu Bapa
    const parent = await base44.auth.me();
    if (!parent || parent.app_role !== 'parent') {
      return Response.json({ error: 'Unauthorized - Parent access required' }, { status: 401 });
    }

    const { child_id, action, new_pin } = await req.json();

    if (!child_id) {
      return Response.json({ error: 'Child ID is required' }, { status: 400 });
    }

    // 2. Semakan Keselamatan Hubungan
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
    let notificationMsg = '';

    // 3. Penghalaan Tindakan (Action Routing)
    switch (action) {
      case 'reset_password': {
        const newPassword = generatePassword();
        await base44.asServiceRole.entities.User.update(child_id, {
          password_hash: hashPassword(newPassword),
          failed_login_attempts: 0,
          account_locked: false,
        });
        result = { success: true, password: newPassword, message: 'Password reset successfully. Please save the new password.' };
        notificationMsg = 'Kata laluan anda telah ditetapkan semula.';
        break;
      }

      case 'reset_pin': {
        if (!new_pin || !/^\d{4,6}$/.test(new_pin)) {
          return Response.json({ error: 'PIN must be 4-6 digits' }, { status: 400 });
        }
        await base44.asServiceRole.entities.User.update(child_id, {
          pin_hash: hashPin(new_pin),
          child_login_pin: null, // SECURITY PATCH: Padam fallback legasi teks biasa
          pin_enabled: true,
          login_method: 'both',
          failed_login_attempts: 0,
          account_locked: false,
        });
        result = { success: true, pin: new_pin, message: 'PIN reset successfully.' };
        notificationMsg = 'PIN log masuk anda telah ditetapkan semula.';
        break;
      }

      case 'disable_pin': {
        await base44.asServiceRole.entities.User.update(child_id, {
          pin_enabled: false,
          login_method: 'password',
          pin_hash: null,
          child_login_pin: null, // SECURITY PATCH
        });
        result = { success: true, message: 'PIN login disabled.' };
        notificationMsg = 'Log masuk menggunakan PIN telah dimatikan.';
        break;
      }

      case 'enable_pin': {
        if (!new_pin || !/^\d{4,6}$/.test(new_pin)) {
          return Response.json({ error: 'PIN must be 4-6 digits' }, { status: 400 });
        }
        await base44.asServiceRole.entities.User.update(child_id, {
          pin_hash: hashPin(new_pin),
          child_login_pin: null, // SECURITY PATCH
          pin_enabled: true,
          login_method: 'both',
        });
        result = { success: true, pin: new_pin, message: 'PIN enabled.' };
        notificationMsg = 'Log masuk menggunakan PIN telah diaktifkan.';
        break;
      }

      case 'unlock_account': {
        await base44.asServiceRole.entities.User.update(child_id, {
          failed_login_attempts: 0,
          account_locked: false,
        });
        result = { success: true, message: 'Account unlocked.' };
        notificationMsg = 'Akaun anda telah dinyahkunci (unlocked). Anda boleh log masuk sekarang.';
        break;
      }

      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 });
    }

    // 4. Hantar Notifikasi kepada Pelajar
    if (notificationMsg) {
      try {
        await base44.asServiceRole.entities.Notification.create({
          user_id: child_id,
          title: 'Kemas Kini Keselamatan 🔐',
          message: `${notificationMsg} (Oleh: ${parent.full_name || 'Ibu Bapa'})`,
          type: 'security_update',
          reference_id: parent.id
        });
      } catch (notifErr) {
        console.warn('Gagal menghantar notifikasi keselamatan kepada pelajar:', notifErr);
      }
    }

    return Response.json(result);

  } catch (error: any) {
    console.error('ResetChildCredentials error:', error);
    return Response.json({ error: error.message || 'Failed to reset credentials' }, { status: 500 });
  }
});
