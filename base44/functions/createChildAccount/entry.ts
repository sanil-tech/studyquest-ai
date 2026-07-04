import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

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
    
    // 1. Sahkan ibu bapa telah log masuk
    const parent = await base44.auth.me();
    if (!parent || parent.app_role !== 'parent') {
      return Response.json({ error: 'Unauthorized - Parent access required' }, { status: 401 });
    }

    const { childData } = await req.json();
    
    // 2. Validasi Kritikal: Nama penuh & tarikh lahir wajib ada
    if (!childData.full_name || !childData.full_name.trim() || !childData.date_of_birth) {
      return Response.json({ 
        error: 'Nama penuh dan tarikh lahir diperlukan. Nama tidak boleh dibiarkan kosong.' 
      }, { status: 400 });
    }

    // 3. CIPTA PENGGUNA (Status: inactive, Tiada password/student_id dijana lagi)
    const childUser = await retryWithBackoff(async () => {
      return await base44.asServiceRole.entities.User.create({
        full_name: childData.full_name.trim(),
        nickname: childData.nickname || childData.full_name.trim().split(' ')[0],
        email: `profile.${crypto.randomUUID().split('-')[0]}@studyquest.local`, // Email placeholder sementara
        app_role: 'student',
        student_id: '', // Kosong kerana belum diaktifkan log masuk
        username: null,
        password_hash: '', // Tiada kata laluan buat masa ini
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
        status: 'inactive', // Penanda aras profil belum diaktifkan kredensialnya
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

    console.log(`[Langkah 1] Profil anak berjaya dicipta: ${childUser.id} (Status: Inactive)`);

    // 4. CIPTA HUBUNGAN (ParentChildRelationship terus 'active' kerana dicipta oleh ibu bapa sendiri)
    const relationship = await retryWithBackoff(async () => {
      return await base44.asServiceRole.entities.ParentChildRelationship.create({
        parent_id: parent.id,
        child_id: childUser.id,
        relationship: 'parent',
        status: 'active', // Terus aktif bagi profil ciptaan baru
        linked_at: new Date().toISOString(),
      });
    });

    console.log(`[Langkah 2] Hubungan berjaya dicipta: ${relationship.id}`);

    // 5. CIPTA WALLET & PROGRESS (Asas untuk kegunaan sistem gamifikasi kelak)
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

    console.log(`[Langkah 3] Wallet dan Progress sedia untuk anak: ${childUser.id}`);

    // 6. KEMAS KINI REKOD PADA AKAUN IBU BAPA
    const parentData = await base44.auth.me();
    const currentLinkedIds = parentData.linked_student_ids || [];
    if (!currentLinkedIds.includes(childUser.id)) {
      await retryWithBackoff(async () => {
        return await base44.auth.updateMe({
          linked_student_ids: [...currentLinkedIds, childUser.id],
        });
      });
    }

    console.log(`[Langkah 4] Senarai linked_student_ids untuk Parent ${parent.id} dikemas kini.`);

    return Response.json({
      success: true,
      child: {
        id: childUser.id,
        full_name: childUser.full_name,
        status: 'inactive'
      },
      message: 'Profil anak berjaya didaftarkan. Anda boleh mengaktifkan akaun log masuk mereka pada bila-bila masa melalui dashboard.',
    });

  } catch (error) {
    console.error('Ralat createChildProfile:', error.message, error.stack);
    let errorMessage = error.message || 'Gagal mendaftarkan profil anak';
    if (error.message.includes('rate limit')) {
      errorMessage = 'Sistem sedang sibuk. Sila cuba semula dalam beberapa saat.';
    }
    return Response.json({ error: errorMessage }, { status: 500 });
  }
});