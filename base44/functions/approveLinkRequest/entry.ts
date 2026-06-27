import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify student is authenticated
    const student = await base44.auth.me();
    if (!student || student.app_role !== 'student') {
      return Response.json({ error: 'Unauthorized - Student access required' }, { status: 401 });
    }

    const { link_request_id, action } = await req.json();

    if (!link_request_id || !action) {
      return Response.json({ error: 'Link request ID and action are required' }, { status: 400 });
    }

    if (!['approve', 'reject'].includes(action)) {
      return Response.json({ error: 'Action must be "approve" or "reject"' }, { status: 400 });
    }

    // Find the link request
    const requests = await base44.entities.LinkRequest.filter({
      id: link_request_id,
      student_id: student.id,
      status: 'pending'
    });

    if (requests.length === 0) {
      return Response.json({ error: 'Link request not found or already processed' }, { status: 404 });
    }

    const linkRequest = requests[0];

    if (action === 'approve') {
      // Create parent-child relationship
      await base44.asServiceRole.entities.ParentChildRelationship.create({
        parent_id: linkRequest.parent_id,
        child_id: student.id,
        relationship: 'parent',
        status: 'active',
        linked_at: new Date().toISOString()
      });

      // Update parent's linked_student_ids
      const parent = await base44.asServiceRole.entities.User.filter({ id: linkRequest.parent_id });
      if (parent.length > 0) {
        const currentLinked = parent[0].linked_student_ids || [];
        if (!currentLinked.includes(student.id)) {
          // Note: Can't update other users directly, parent needs to refresh
        }
      }

      // Update link request status
      await base44.entities.LinkRequest.update(linkRequest.id, {
        status: 'approved',
        responded_at: new Date().toISOString()
      });

      // Create notification for parent
      await base44.entities.Notification.create({
        user_id: linkRequest.parent_id,
        title: 'Link Request Approved',
        message: `${student.full_name || student.nickname} has approved your parent link request.`,
        type: 'quiz_complete',
        reference_id: student.id
      });

      return Response.json({ 
        success: true, 
        message: 'Parent link approved successfully',
        parent_id: linkRequest.parent_id
      });

    } else { // reject
      // Update link request status
      await base44.entities.LinkRequest.update(linkRequest.id, {
        status: 'rejected',
        responded_at: new Date().toISOString()
      });

      // Create notification for parent
      await base44.entities.Notification.create({
        user_id: linkRequest.parent_id,
        title: 'Link Request Rejected',
        message: `${student.full_name || student.nickname} has rejected your parent link request.`,
        type: 'quiz_complete',
        reference_id: student.id
      });

      return Response.json({ 
        success: true, 
        message: 'Parent link rejected'
      });
    }

  } catch (error) {
    console.error('ApproveLinkRequest error:', error);
    return Response.json({ error: error.message || 'Failed to process link request' }, { status: 500 });
  }
});