import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // 1. Pengesahan Akses Pelajar
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { request_id, action } = await req.json();

    if (!request_id || !action) {
      return Response.json({ error: 'Request ID and action are required' }, { status: 400 });
    }

    if (!['approve', 'reject'].includes(action)) {
      return Response.json({ error: 'Action must be "approve" or "reject"' }, { status: 400 });
    }

    // 2. Cari Permintaan Pautan
    const requests = await base44.entities.LinkRequest.filter({ id: request_id });
    
    if (requests.length === 0) {
      return Response.json({ error: 'Link request not found' }, { status: 404 });
    }

    const linkRequest = requests[0];

    // 3. Semakan Keselamatan (Hanya pelajar yang disasarkan boleh meluluskan)
    if (linkRequest.student_id !== user.id) {
      return Response.json({ error: 'Unauthorized - Only the targeted student can approve/reject this request' }, { status: 403 });
    }

    if (linkRequest.status !== 'pending') {
      return Response.json({ error: 'This request has already been processed' }, { status: 400 });
    }

    // =========================================================================
    // TINDAKAN: LULUS (APPROVE)
    // =========================================================================
    if (action === 'approve') {
      // A. Cipta Perhubungan Aktif (Guna Service Role untuk kebenaran admin)
      await base44.asServiceRole.entities.ParentChildRelationship.create({
        parent_id: linkRequest.parent_id,
        child_id: linkRequest.student_id,
        relationship: 'parent',
        status: 'active',
        linked_at: new Date().toISOString(),
      });

      // B. Kemas kini cache Ibu Bapa (Array DAN jumlah anak)
      const parent = await base44.asServiceRole.entities.User.get(linkRequest.parent_id);
      const currentLinked = parent?.linked_student_ids || [];
      const currentNumChildren = parent?.num_children || currentLinked.length;

      if (!currentLinked.includes(linkRequest.student_id)) {
        await base44.asServiceRole.entities.User.update(linkRequest.parent_id, {
          linked_student_ids: [...currentLinked, linkRequest.student_id],
          num_children: currentNumChildren + 1
        });
      }

      // C. Kemas kini status permintaan
      await base44.asServiceRole.entities.LinkRequest.update(request_id, {
        status: 'approved',
        responded_at: new Date().toISOString(),
      });

      // D. Notifikasi kepada Ibu Bapa (PATCH: Guna Service Role & Tukar Type)
      await base44.asServiceRole.entities.Notification.create({
        user_id: linkRequest.parent_id,
        title: 'Permintaan Pautan Diluluskan! 🎉',
        message: `${user.full_name || user.nickname} telah meluluskan permintaan pautan anda.`,
        type: 'link_approved',
        reference_id: linkRequest.student_id,
      });

      return Response.json({ 
        success: true, 
        message: 'Parent link approved successfully',
        parent_id: linkRequest.parent_id,
      });

    } 
    // =========================================================================
    // TINDAKAN: TOLAK (REJECT)
    // =========================================================================
    else { 
      // A. Kemas kini status permintaan
      await base44.asServiceRole.entities.LinkRequest.update(request_id, {
        status: 'rejected',
        responded_at: new Date().toISOString(),
      });

      // B. Notifikasi kepada Ibu Bapa (PATCH: Guna Service Role & Tukar Type)
      await base44.asServiceRole.entities.Notification.create({
        user_id: linkRequest.parent_id,
        title: 'Permintaan Pautan Ditolak',
        message: `${user.full_name || user.nickname} telah menolak permintaan pautan anda.`,
        type: 'link_rejected',
        reference_id: linkRequest.student_id,
      });

      return Response.json({ 
        success: true, 
        message: 'Parent link request rejected',
      });
    }

  } catch (error: any) {
    console.error('RespondToLinkRequest error:', error);
    return Response.json(
      { error: error.message || 'Failed to process request' }, 
      { status: 500 }
    );
  }
});
