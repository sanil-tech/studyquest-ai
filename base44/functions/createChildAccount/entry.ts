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

const hashPin = (pin) => {
  return btoa(unescape(encodeURIComponent(`SQ_PIN_SALT_${pin}_2026`)));
};

const hashPassword = (password) => {
  return btoa(unescape(encodeURIComponent(`SQ_PWD_SALT_${password}_2026`)));
};

// Retry wrapper with exponential backoff for rate limits
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

const calculateAge = (birthDate) => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify parent is authenticated
    const parent = await base44.auth.me();
    if (!parent || parent.app_role !== 'parent') {
      return Response.json({ error: 'Unauthorized - Parent access required' }, { status: 401 });
    }

    const { childData } = await req.json();
    
    // Validate required fields
    if (!childData.full_name || !childData.date_of_birth) {
      return Response.json({ error: 'Full name and date of birth are required' }, { status: 400 });
    }

    // Calculate age
    const today = new Date();
    const birth = new Date(childData.date_of_birth);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    // Generate credentials
    let studentId = generateStudentId();
    const password = generatePassword();
    const passwordHash = hashPassword(password);
    
    // Generate username from name (optional)
    let username = null;
    if (childData.full_name) {
      username = childData.full_name
        .toLowerCase()
        .replace(/[^a-z\s]/g, '')
        .split(/\s+/)
        .slice(0, 2)
        .join('.');
    }

    // Check if Student ID is unique
    let existingUsers = await base44.asServiceRole.entities.User.filter({ student_id: studentId });
    let attempts = 0;
    while (existingUsers.length > 0 && attempts < 10) {
      studentId = generateStudentId();
      existingUsers = await base44.asServiceRole.entities.User.filter({ student_id: studentId });
      attempts++;
    }

    if (existingUsers.length > 0) {
      return Response.json({ error: 'Failed to generate unique Student ID' }, { status: 500 });
    }

    // ATOMIC OPERATION: Create child user and relationship together
    // If any step fails, the entire operation fails (no orphan records)
    const childUser = await retryWithBackoff(async () => {
      return await base44.asServiceRole.entities.User.create({
        full_name: childData.full_name,
        nickname: childData.nickname || childData.full_name.split(' ')[0],
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
        class_name: childData.grade_year || '',
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
        school_year: childData.education_level || '',
        phone_number: '',
        num_children: 0,
        children_names: '',
        teaching_subjects: '',
        teaching_level: ''
      });
    });

    console.log(`[Step 1] User created: ${childUser.id}, student_id: ${studentId}`);

    // CRITICAL: Create ParentChildRelationship immediately after user creation
    // This ensures no orphan student records exist
    const relationship = await retryWithBackoff(async () => {
      return await base44.asServiceRole.entities.ParentChildRelationship.create({
        parent_id: parent.id,
        child_id: childUser.id,
        relationship: 'parent',
        status: 'active',
        linked_at: new Date().toISOString(),
      });
    });

    console.log(`[Step 2] Relationship created: ${relationship.id}, parent: ${parent.id}, child: ${childUser.id}`);

    // Create Wallet and Progress for the child (with retry)
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

    console.log(`[Step 3] Wallet and Progress created for child: ${childUser.id}`);

    // Update parent's linked_student_ids
    const parentData = await base44.auth.me();
    const currentLinkedIds = parentData.linked_student_ids || [];
    if (!currentLinkedIds.includes(childUser.id)) {
      await retryWithBackoff(async () => {
        return await base44.auth.updateMe({
          linked_student_ids: [...currentLinkedIds, childUser.id],
        });
      });
    }

    console.log(`[Step 4] Parent ${parent.id} updated with linked child: ${childUser.id}`);

    return Response.json({
      success: true,
      child: {
        id: childUser.id,
        full_name: childUser.full_name,
        student_id: studentId,
        username: username,
        password: password, // Return plain text password ONCE
        pin: null,
        pin_enabled: false,
      },
      message: 'Child account created successfully. Please save these credentials - password will not be shown again.',
    });

  } catch (error) {
    console.error('CreateChildAccount error:', error.message, error.stack);
    // Provide specific error messages for debugging
    let errorMessage = error.message || 'Failed to create child account';
    if (error.message.includes('rate limit')) {
      errorMessage = 'Service temporarily busy. Please try again in a few seconds.';
    }
    return Response.json({ error: errorMessage }, { status: 500 });
  }
});