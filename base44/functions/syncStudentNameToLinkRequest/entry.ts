import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // 1. Pengesahan Akses Automasi (Pastikan ia adalah Admin / Service Role)
    const user = await base44.auth.me();
    if (!user || (user.app_role !== 'admin' && user.app_role !== 'service')) {
      return Response.json({ error: 'Unauthorized - System automation access required' }, { status: 401 });
    }

    const { userId } = await req.json();
    
    if (!userId) {
      return Response.json({ error: 'User ID parameter is required' }, { status: 400 });
    }

    // 2. Pintas RLS menggunakan asServiceRole untuk tugasan automasi
    const updatedUser = await base44.asServiceRole.entities.User.get(userId);
    
    if (!updatedUser || updatedUser.app_role !== 'student') {
      return Response.json({ 
        success: true, 
        message: 'Process skipped: Target is not a student or user not found' 
      });
    }

    // 3. Cari semua rekod LinkRequest yang berkaitan
    const linkRequests = await base44.asServiceRole.entities.LinkRequest.filter({
      student_id: userId,
      status: 'approved' 
    });

    if (linkRequests.length === 0) {
       return Response.json({ 
         success: true, 
         message: 'No active LinkRequests found for synchronization.' 
       });
    }

    // 4. Keseragaman Data (Masukkan 'nickname' sebagai sandaran)
    const newStudentName = updatedUser.full_name || updatedUser.nickname || updatedUser.email || updatedUser.student_id;

    // 5. Pemprosesan Selari (Parallel Processing) untuk kelajuan maksimum
    await Promise.all(
      linkRequests.map((requestRecord: any) => 
        base44.asServiceRole.entities.LinkRequest.update(requestRecord.id, {
          student_name: newStudentName
        })
      )
    );

    return Response.json({ 
      success: true, 
      message: `Successfully synchronized ${linkRequests.length} LinkRequest(s) for ${newStudentName}` 
    });

  } catch (error: any) {
    console.error('Profile Sync Automation Error:', error);
    return Response.json(
      { error: error.message || 'Automation sync failed' }, 
      { status: 500 }
    );
  }
});
