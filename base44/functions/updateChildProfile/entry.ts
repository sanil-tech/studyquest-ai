import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Fields parents are allowed to edit
const ALLOWED_EDITABLE_FIELDS = [
  'full_name',
  'nickname',
  'date_of_birth',
  'school_name',
  'education_level',
  'grade_year',
  'class_name',
  'state',
  'country',
  'profile_picture_url'
];

// Fields that trigger learning level recalculation
const RECALCULATION_TRIGGER_FIELDS = ['date_of_birth', 'education_level', 'grade_year'];

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

    const { childId, updates } = await req.json();
    
    if (!childId || !updates) {
      return Response.json({ error: 'childId and updates are required' }, { status: 400 });
    }

    // Verify parent-child relationship
    const relationship = await base44.entities.ParentChildRelationship.filter({
      parent_id: parent.id,
      child_id: childId,
      status: 'active'
    });

    if (!relationship || relationship.length === 0) {
      return Response.json({ error: 'Unauthorized - You are not linked to this child' }, { status: 403 });
    }

    // Get current child data
    const child = await base44.entities.User.get(childId);
    if (!child) {
      return Response.json({ error: 'Child not found' }, { status: 404 });
    }

    // Filter updates to only allowed fields
    const filteredUpdates = {};
    let needsRecalculation = false;

    for (const field of ALLOWED_EDITABLE_FIELDS) {
      if (updates[field] !== undefined) {
        // Check if this field triggers recalculation
        if (RECALCULATION_TRIGGER_FIELDS.includes(field) && updates[field] !== child[field]) {
          needsRecalculation = true;
        }
        filteredUpdates[field] = updates[field];
      }
    }

    // Block any attempt to update learning-related fields
    const BLOCKED_FIELDS = [
      'balance', 'coins', 'wallet', 'progress', 'streak', 'xp',
      'quiz_attempts', 'lesson_completions', 'achievements',
      'app_role', 'student_id', 'email', 'password_hash', 'pin_hash',
      'linked_parent_id', 'is_child_account'
    ];

    for (const field of BLOCKED_FIELDS) {
      if (updates[field] !== undefined) {
        console.warn(`Parent ${parent.id} attempted to update blocked field '${field}' for child ${childId}`);
      }
    }

    // Apply updates
    const updatedChild = await base44.entities.User.update(childId, filteredUpdates);

    console.log(`Profile updated for child ${childId} by parent ${parent.id}:`, {
      fields: Object.keys(filteredUpdates),
      needsRecalculation
    });

    return Response.json({
      success: true,
      child: {
        id: updatedChild.id,
        full_name: updatedChild.full_name,
        nickname: updatedChild.nickname,
        education_level: updatedChild.education_level,
      },
      needsRecalculation,
      message: needsRecalculation 
        ? 'Profile updated. Learning recommendations will be recalculated based on new information.'
        : 'Profile updated successfully'
    });

  } catch (error) {
    console.error('UpdateChildProfile error:', error.message, error.stack);
    return Response.json({ error: error.message || 'Failed to update profile' }, { status: 500 });
  }
});