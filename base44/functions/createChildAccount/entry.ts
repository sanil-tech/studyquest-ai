import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Fungsi hashing wajib SAMA persis seperti di childLogin
const hashPassword = (password) => {
  return btoa(unescape(encodeURIComponent(`SQ_PWD_SALT_${password}_2026`)));
};

// Retry wrapper dengan exponential backoff untuk mengelakkan rate limits
const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (error.message.includes('rate limit') || error.status === 429) {
        const delay = baseDelay * Math.pow(2, i);
        console.log(`Rate limited, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
  throw lastError || new Error('Operation failed after retries');
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Parent mesti login
    const parent = await base44.auth.me();

    if (!parent || parent.app_role !== 'parent') {
      return Response.json(
        { error: 'Unauthorized - Parent access required' },
        { status: 401 }
      );
    }

    const { childData } = await req.json();

    if (
      !childData.full_name ||
      !childData.full_name.trim() ||
      !childData.date_of_birth
    ) {
      return Response.json(
        { error: 'Nama penuh dan tarikh lahir diperlukan.' },
        { status: 400 }
      );
    }

    if (!childData.username || !childData.password) {
      return Response.json(
        { error: 'Username dan Password diperlukan.' },
        { status: 400 }
      );
    }

    const cleanUsername = childData.username
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '');

    const generatedHash = hashPassword(childData.password);

    const existingUser =
      await base44.asServiceRole.entities.User.filter({
        username: cleanUsername,
      });

    if (existingUser.length > 0) {
      return Response.json(
        {
          error: `Username '${cleanUsername}' sudah diambil.`,
        },
        { status: 400 }
      );
    }

    // Create child user
    const childUser = await retryWithBackoff(async () => {
      return await base44.asServiceRole.entities.User.create({
        full_name: childData.full_name.trim(),
        nickname:
          childData.nickname ||
          childData.full_name.trim().split(' ')[0],

        email: `profile.${crypto
          .randomUUID()
          .split('-')[0]}@studyquest.local`,

        app_role: 'student',

        student_id: `SQ${Math.floor(
          10000 + Math.random() * 90000
        )}`,

        username: cleanUsername,
        password_hash: generatedHash,

        pin_hash: '',
        pin_enabled: false,
        login_method: 'password',

        date_of_birth: childData.date_of_birth,
        gender: childData.gender || '',

        school_name: childData.school_name || '',
        education_level: childData.education_level || '',
        grade_year: childData.grade_year || '',
        class_name: childData.grade_year || '',

        state: childData.state || '',
        country: 'Malaysia',

        profile_picture_url:
          childData.profile_picture_url || '',

        avatar_photo_url:
          childData.profile_picture_url || '',

        profile_completed: true,

        is_child_account: true,

        status: 'active',

        linked_parent_id: parent.id,

        failed_login_attempts: 0,
        account_locked: false,

        linked_student_ids: [],

        school_year:
          childData.education_level || '',

        phone_number: '',
        num_children: 0,
        children_names: '',
        teaching_subjects: '',
        teaching_level: '',
      });
    });

    // Create relationship
    await retryWithBackoff(async () => {
      return await base44.asServiceRole.entities.ParentChildRelationship.create(
        {
          parent_id: parent.id,
          child_id: childUser.id,
          relationship: 'parent',
          status: 'active',
          linked_at: new Date().toISOString(),
        }
      );
    });

    // Create wallet & progress
    await retryWithBackoff(async () => {
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
    });

    // Update parent
    const parentData = await base44.auth.me();

    const linkedIds =
      parentData.linked_student_ids || [];

    if (!linkedIds.includes(childUser.id)) {
      await retryWithBackoff(async () => {
        return await base44.auth.updateMe({
          linked_student_ids: [
            ...linkedIds,
            childUser.id,
          ],
        });
      });
    }

    return Response.json({
      success: true,
      child: {
        id: childUser.id,
        full_name: childUser.full_name,
        username: childUser.username,
        status: 'active',
      },
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        error:
          error.message ||
          'Failed to create child account',
      },
      { status: 500 }
    );
  }
});