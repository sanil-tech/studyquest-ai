import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // 1. Pengesahan Akses Ibu Bapa
    const parent = await base44.auth.me();
    if (!parent || parent.app_role !== 'parent') {
      return Response.json({ error: 'Unauthorized - Parent access required' }, { status: 401 });
    }

    const body = await req.json();
    const { child_id } = body;

    if (!child_id) {
      return Response.json({ error: 'Child ID is required' }, { status: 400 });
    }

    // 2. Pengesahan Pautan Semasa (Security Check)
    const relationships = await base44.asServiceRole.entities.ParentChildRelationship.filter({
      parent_id: parent.id,
      child_id: child_id,
      status: 'active',
    });

    if (relationships.length === 0) {
      return Response.json({ error: 'You do not have permission to manage this child' }, { status: 403 });
    }

    // 3. OPTIMISASI: Pemadaman tepat menggunakan UUID perhubungan secara langsung
    const targetRelationship = relationships[0];
    await base44.asServiceRole.entities.ParentChildRelationship.delete(targetRelationship.id);

    // 4. KESEGERAKAN CACHE IBU BAPA: Kemas kini array DAN jumlah anak
    const currentLinked = parent.linked_student_ids || [];
    const updatedLinked = currentLinked.filter((id: string) => id !== child_id);
    const currentNumChildren = parent.num_children || currentLinked.length;

    await base44.auth.updateMe({ 
      linked_student_ids: updatedLinked,
      num_children: Math.max(0, currentNumChildren - 1) // Elak nilai negatif
    });

    // 5. PENAMBAHBAIKAN ARKITEKTUR: Notifikasi kepada pelajar
    try {
      await base44.asServiceRole.entities.Notification.create({
        user_id: child_id,
        title: 'Pemantauan Ibu Bapa Ditamatkan 🔗',
        message: `${parent.full_name || parent.email} tidak lagi memantau profil ini. Data pembelajaran dan syiling anda kekal selamat.`,
        type: 'parent_unlinked',
        reference_id: parent.id
      });
    } catch (notifErr) {
      console.warn("Notifikasi nyahpaut gagal dihantar kepada pelajar:", notifErr);
    }

    return Response.json({ 
      success: true, 
      message: 'Child removed from your account. The student account and progress data remain intact.' 
    });

  } catch (error: any) {
    console.error('RemoveChildLink Error:', error);
    return Response.json(
      { error: error.message || 'Failed to remove link' }, 
      { status: 500 }
    );
  }
});
