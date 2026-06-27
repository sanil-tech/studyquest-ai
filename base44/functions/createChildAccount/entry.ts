import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ===============================
// UTILITIES
// ===============================

const generateStudentId = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = 'SQ-';

  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return id;
};

const generatePassword = () => {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const numbers = '23456789';
  const special = '@#$%';

  let password = '';

  password += upper[Math.floor(Math.random() * upper.length)];
  password += lower[Math.floor(Math.random() * lower.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  const all = upper + lower + numbers + special;

  for (let i = 0; i < 6; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }

  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
};

const hashPassword = (password: string) => {
  return btoa(
    unescape(
      encodeURIComponent(`SQ_PWD_SALT_${password}_2026`)
    )
  );
};

const cleanName = (name: string) => {
  return (name || '').replace(/\s+/g, ' ').trim();
};

const generateDisplayName = (fullName: string, nickname?: string) => {
  if (nickname?.trim()) return nickname.trim();
  if (fullName?.trim()) return fullName.trim().split(' ')[0];
  return 'Student';
};

// ===============================
// MAIN FUNCTION
// ===============================

Deno.serve(async (req) => {
  let childUser = null;
  let relationship = null;

  try {
    const base44 = createClientFromRequest(req);

    // ===============================
    // AUTH CHECK
    // ===============================
    const parent = await base44.auth.me();

    if (!parent || parent.app_role !== 'parent') {
      return Response.json(
        { error: 'Unauthorized - Parent access required' },
        { status: 401 }
      );
    }

    let body;

try {
  body = await req.json();
} catch (e) {
  return Response.json(
    { error: "Invalid JSON body" },
    { status: 400 }
  );
}

const childData = body?.childData;

    // ===============================
    // VALIDATION
    // ===============================
    const fullName = cleanName(childData.full_name);

    if (!fullName || !childData.date_of_birth) {
      return Response.json(
        { error: 'Full name and date of birth are required' },
        { status: 400 }
      );
    }

    // ===============================
    // GENERATE IDS & CREDENTIALS
    // ===============================
    let studentId = generateStudentId();

    const password = generatePassword();
    const passwordHash = hashPassword(password);

    // Ensure unique student ID
    let exists = await base44.asServiceRole.entities.User.filter({
      student_id: studentId,
    });

    let attempts = 0;
    while (exists.length > 0 && attempts < 10) {
      studentId = generateStudentId();
      exists = await base44.asServiceRole.entities.User.filter({
        student_id: studentId,
      });
      attempts++;
    }

    if (exists.length > 0) {
      return Response.json(
        { error: 'Failed to generate unique Student ID' },
        { status: 500 }
      );
    }

    // ===============================
    // DISPLAY NAME (FIXED RULE)
    // ===============================
    const displayName = generateDisplayName(
      fullName,
      childData.nickname
    );

    // ===============================
    // CREATE CHILD USER
    // ===============================
    childUser = await base44.asServiceRole.entities.User.create({
      full_name: fullName,
      nickname: childData.nickname?.trim() || null,
      display_name: displayName,

      email: `${studentId}@studyquest.local`,
      app_role: 'student',
      student_id: studentId,

      username: fullName.toLowerCase().split(' ')[0],

      password_hash: passwordHash,
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

      linked_student_ids: [],
    });

    // ===============================
    // CREATE RELATIONSHIP
    // ===============================
    relationship = await base44.asServiceRole.entities.ParentChildRelationship.create({
      parent_id: parent.id,
      child_id: childUser.id,
      relationship: 'parent',
      status: 'active',
      linked_at: new Date().toISOString(),
    });

    // ===============================
    // CREATE WALLET + PROGRESS
    // ===============================
    await Promise.all([
      base44.asServiceRole.entities.Wallet.create({
        student_id: childUser.id,
        balance: 0,
      }),

      base44.asServiceRole.entities.Progress.create({
        student_id: childUser.id,
        total_xp: 0,
        level: 1,
        streak_days: 0,
        total_study_time: 0,
      }),
    ]);

    // ===============================
    // UPDATE PARENT LINK (SAFE)
    // ===============================
    const currentParent = await base44.auth.me();
    const currentLinked = currentParent.linked_student_ids || [];

    if (!currentLinked.includes(childUser.id)) {
      await base44.auth.updateMe({
        linked_student_ids: [...currentLinked, childUser.id],
      });
    }

    // ===============================
    // RESPONSE
    // ===============================
    return Response.json({
      success: true,
      child: {
        id: childUser.id,
        full_name: childUser.full_name,
        display_name: childUser.display_name,
        student_id: studentId,
        username: childUser.username,
        password: password,
      },
      message:
        'Child account created successfully. Save credentials once.',
    });
  } catch (error: any) {
    console.error('CreateChildAccount error:', error);

    // ===============================
    // ROLLBACK SAFETY (IMPORTANT)
    // ===============================
    try {
      if (relationship) {
        await base44.asServiceRole.entities.ParentChildRelationship.delete(
          relationship.id
        );
      }

      if (childUser) {
        await base44.asServiceRole.entities.User.delete(childUser.id);
      }
    } catch (rollbackError) {
      console.error('Rollback failed:', rollbackError);
    }

    return Response.json(
      {
        error:
          error?.message || 'Failed to create child account',
      },
      { status: 500 }
    );
  }
});