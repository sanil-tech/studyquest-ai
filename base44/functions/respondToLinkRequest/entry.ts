import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify user is authenticated
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

    // Find the link request
    const requests = await base44.entities.LinkRequest.filter({ id: request_id });
    
    if (requests.length === 0) {
      return Response.json({ error: 'Link request not found' }, { status: 404 });
    }

    const linkRequest = requests[0];

    // Verify the user is the student in this request
    if (linkRequest.student_id !== user.id) {
      return Response.json({ error: 'Unauthorized - Only the student can approve/reject this request' }, { status: 403 });
    }

    if (linkRequest.status !== 'pending') {
      return Response.json({ error: 'This request has already been processed' }, { status: 400 });
    }

    if (action === 'approve') {
      // Create ParentChildRelationship
      await base44.asServiceRole.entities.ParentChildRelationship.create({
        parent_id: linkRequest.parent_id,
        child_id: linkRequest.student_id,
        relationship: 'parent',
        status: 'active',
        linked_at: new Date().toISOString(),
      });

      // Update parent's linked_student_ids
      const parent = await base44.asServiceRole.entities.User.get(linkRequest.parent_id);
      const currentLinked = parent.linked_student_ids || [];
      if (!currentLinked.includes(linkRequest.student_id)) {
        await base44.asServiceRole.entities.User.update(linkRequest.parent_id, {
          linked_student_ids: [...currentLinked, linkRequest.student_id],
        });
      }

      // Update link request status
      await base44.entities.LinkRequest.update(request_id, {
        status: 'approved',
        responded_at: new Date().toISOString(),
      });

      // Create notification for parent
      await base44.entities.Notification.create({
        user_id: linkRequest.parent_id,
        title: 'Link Request Approved',
        message: `${user.full_name || user.nickname} has approved your parent link request.`,
        type: 'quiz_complete',
        reference_id: linkRequest.student_id,
      });

      return Response.json({ 
        success: true, 
        message: 'Parent link approved successfully',
        parent_id: linkRequest.parent_id,
      });

    } else { // reject
      // Update link request status
      await base44.entities.LinkRequest.update(request_id, {
        status: 'rejected',
        responded_at: new Date().toISOString(),
      });

      // Create notification for parent
      await base44.entities.Notification.create({
        user_id: linkRequest.parent_id,
        title: 'Link Request Rejected',
        message: `${user.full_name || user.nickname} has rejected your parent link request.`,
        type: 'quiz_complete',
        reference_id: linkRequest.student_id,
      });

      return Response.json({ 
        success: true, 
        message: 'Parent link request rejected',
      });
    }

  } catch (error) {
    console.error('RespondToLinkRequest error:', error);
    return Response.json({ error: error.message || 'Failed to process request' }, { status: 500 });
  }
});