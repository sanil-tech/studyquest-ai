import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Generate secure random Student ID (SQ-XXXXXX format)
const generateStudentId = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = 'SQ-';
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
};

// Generate secure random password
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

const hashPassword = (password: string) => {
  return btoa(unescape(encodeURIComponent(`SQ_PWD_SALT_${password}_2026`)));
};

// Retry wrapper with exponential backoff
const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      if (error?.message?.includes('rate limit') || error?.status === 429) {
        const delay = baseDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
  throw lastError || new Error('Operation failed after retries');
};

// Clean full name (IMPORTANT FIX)
const cleanFullName = (name: string) => {
  return (name || '')
    .replace(/\s+/g, ' ')
    .trim();
};

// Safe display name generator (IMPORTANT FIX)
const generateDisplayName = (fullName: string, nickname?: string) => {
  if (nickname && nickname.trim()) return nickname.trim();
  if (fullName) return fullName.split(' ')[0];
  return 'Student';
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Auth check
    const parent = await base44.auth.me();
    if (!parent || parent.app_role !== 'parent') {
      return Response.json({ error: 'Unauthorized - Parent access required' }, { status: 401 });
    }

    const { childData } = await req.json();

    // REQUIRED VALIDATION (FIXED)
    const fullName = cleanFullName(childData.full_name);

    if (!fullName || !childData.date_of_birth) {
      return Response.json({
        error: 'Full name and date of birth are required'
      }, { status: 400 });
    }

    // Age calculation
    const birth = new Date(childData.date_of_birth);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;

    // Generate credentials
    let studentId = generateStudentId();
    const password = generatePassword();
    const passwordHash = hashPassword(password);

    // SAFE username generation (FIXED)
    let username = null;
    if (fullName) {
      const cleaned = fullName
        .toLowerCase()
        .replace(/[^a-z\s]/g, '')
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .join('.');

      username = cleaned || null;
    }

    // Ensure unique Student ID
    let existingUsers = await base44.asServiceRole.entities.User.filter({
      student_id: studentId
    });

    let attempts = 0;
    while (existingUsers.length > 0 && attempts < 10) {
      studentId = generateStudentId();
      existingUsers = await base44.asServiceRole.entities.User.filter({
        student_id: studentId
      });
      attempts++;
    }

    if (existingUsers.length > 0) {
      return Response.json({ error: 'Failed to generate unique Student ID' }, { status: 500 });
    }

    // DISPLAY NAME (CRITICAL FIX)
    const displayName = generateDisplayName(fullName, childData.nickname);

    // CREATE CHILD USER
    const childUser = await retryWithBackoff(async () => {
      return await base44.asServiceRole.entities.User.create({
        full_name: fullName,
        nickname: childData.nickname?.trim() || null,
        display_name: displayName, // 🔥 FIX THAT SOLVES "Unnamed Student"
        email: `${studentId}@studyquest.local`,
        app_role: 'student',
        student_id: studentId,
        username: username,
        password_hash: passwordHash,
        pin_hash: '',
        pin_enabled: false,
        login_method: 'password',

        date_of_birth: childData.date_of_birth,
        gender: childData.gender || '',

        school_name: childData.school_name || '',
        education_level: childData.education_level || '',
        grade_year: childData.grade_year || '',

        state: childData.state || '',
        country: 'Malaysia',

        profile_picture_url: childData.profile_picture_url || '',
        avatar_photo_url: childData.profile_picture_url || '',

        profile_completed: true,
        is_child_account: true,
        linked_parent_id: parent.id,

        failed_login_attempts: 0,
        account_locked: false,

        linked_student_ids: []
      });
    });

    // RELATIONSHIP
    const relationship = await retryWithBackoff(async () => {
      return await base44.asServiceRole.entities.ParentChildRelationship.create({
        parent_id: parent.id,
        child_id: childUser.id,
        relationship: 'parent',
        status: 'active',
        linked_at: new Date().toISOString()
      });
    });

    // WALLET + PROGRESS
    await retryWithBackoff(async () => {
      await Promise.all([
        base44.asServiceRole.entities.Wallet.create({
          student_id: childUser.id,
          balance: 0
        }),
        base44.asServiceRole.entities.Progress.create({
          student_id: childUser.id,
          total_xp: 0,
          level: 1,
          streak_days: 0,
          total_study_time: 0
        })
      ]);
    });

    // UPDATE PARENT LINKED IDS
    const parentData = await base44.auth.me();
    const currentLinkedIds = parentData.linked_student_ids || [];

    if (!currentLinkedIds.includes(childUser.id)) {
      await retryWithBackoff(async () => {
        return await base44.auth.updateMe({
          linked_student_ids: [...currentLinkedIds, childUser.id]
        });
      });
    }

    return Response.json({
      success: true,
      child: {
        id: childUser.id,
        full_name: childUser.full_name,
        display_name: displayName, // 🔥 IMPORTANT FOR FRONTEND
        student_id: studentId,
        username: username,
        password: password
      },
      message: 'Child account created successfully. Save credentials once.'
    });

  } catch (error: any) {
    console.error('CreateChildAccount error:', error);

    let errorMessage = error?.message || 'Failed to create child account';

    if (errorMessage.includes('rate limit')) {
      errorMessage = 'Service busy. Please try again shortly.';
    }

    return Response.json({ error: errorMessage }, { status: 500 });
  }
});