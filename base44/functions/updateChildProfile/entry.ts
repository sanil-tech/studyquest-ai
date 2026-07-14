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

const calculateAge = (birthDate: string): number => {
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
    
    // 1. Pengesahan Ibu Bapa
    const parent = await base44.auth.me();
    if (!parent || parent.app_role !== 'parent') {
      return Response.json({ error: 'Unauthorized - Parent access required' }, { status: 401 });
    }

    const { childId, updates } = await req.json();
    
    if (!childId || !updates || Object.keys(updates).length === 0) {
      return Response.json({ error: 'childId and updates payload are required' }, { status: 400 });
    }

    // 2. Pengesahan Perhubungan (Guna Service Role)
    const relationships = await base44.asServiceRole.entities.ParentChildRelationship.filter({
      parent_id: parent.id,
      child_id: childId,
      status: 'active'
    });

    if (!relationships || relationships.length === 0) {
      return Response.json({ error: 'Unauthorized - You are not linked to this child' }, { status: 403 });
    }

    // 3. Dapatkan Data Pelajar Semasa
    const child = await base44.asServiceRole.entities.User.get(childId);
    if (!child) {
      return Response.json({ error: 'Child not found' }, { status: 404 });
    }

    // 4. Penapisan Keselamatan & Semakan Keperluan Pengiraan Semula
    const filteredUpdates: Record<string, any> = {};
    let needsRecalculation = false;

    for (const field of ALLOWED_EDITABLE_FIELDS) {
      if (updates[field] !== undefined) {
        if (RECALCULATION_TRIGGER_FIELDS.includes(field) && updates[field] !== child[field]) {
          needsRecalculation = true;
        }
        filteredUpdates[field] = updates[field];
      }
    }

    // ✅ PEMBETULAN LOGIK: Kira Umur Baharu Secara Automatik jika DOB bertukar
    if (filteredUpdates.date_of_birth && filteredUpdates.date_of_birth !== child.date_of_birth) {
      filteredUpdates.age = calculateAge(filteredUpdates.date_of_birth);
    }

    // [Pilihan] Amaran Log Keselamatan
    const BLOCKED_FIELDS = [
      'balance', 'coins', 'wallet', 'progress', 'streak', 'xp',
      'quiz_attempts', 'lesson_completions', 'achievements',
      'app_role', 'student_id', 'email', 'password_hash', 'pin_hash',
      'linked_parent_id', 'is_child_account'
    ];

    for (const field of BLOCKED_FIELDS) {
      if (updates[field] !== undefined) {
        console.warn(`[SECURITY WARN] Parent ${parent.id} attempted to update blocked field '${field}' for child ${childId}`);
      }
    }

    // 5. Kemas Kini Pangkalan Data (Guna Service Role untuk pintas RLS)
    const updatedChild = await base44.asServiceRole.entities.User.update(childId, filteredUpdates);

    // 6. Hantar Notifikasi Kepada Pelajar
    try {
      await base44.asServiceRole.entities.Notification.create({
        user_id: childId,
        title: 'Profil Dikemas Kini 📝',
        message: `Maklumat profil anda telah dikemas kini oleh ${parent.full_name || 'ibu bapa anda'}.`,
        type: 'profile_updated',
        reference_id: parent.id
      });
    } catch (notifErr) {
      console.warn("Gagal menghantar notifikasi kemas kini profil:", notifErr);
    }

    return Response.json({
      success: true,
      child: {
        id: updatedChild.id,
        full_name: updatedChild.full_name,
        nickname: updatedChild.nickname,
        education_level: updatedChild.education_level,
        age: updatedChild.age // Pulangkan umur baharu ke UI
      },
      needsRecalculation,
      message: needsRecalculation 
        ? 'Profile updated. Learning recommendations will be recalculated based on new information.'
        : 'Profile updated successfully'
    });

  } catch (error: any) {
    console.error('UpdateChildProfile error:', error.message);
    return Response.json({ error: error.message || 'Failed to update profile' }, { status: 500 });
  }
});
