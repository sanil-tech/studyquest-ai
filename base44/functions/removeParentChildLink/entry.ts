import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // 1. Verify parent is authenticated
    const parent = await base44.auth.me();
    if (!parent || parent.app_role !== 'parent') {
      return Response.json({ error: 'Unauthorized - Parent access required' }, { status: 401 });
    }

    const { child_id } = await req.json();

    if (!child_id) {
      return Response.json({ error: 'Child ID is required' }, { status: 400 });
    }

    // 2. Verify this parent has access to this child
    const relationships = await base44.asServiceRole.entities.ParentChildRelationship.filter({
      parent_id: parent.id,
      child_id: child_id,
      status: 'active',
    });

    if (relationships.length === 0) {
      return Response.json({ error: 'No active relationship found' }, { status: 404 });
    }

    const relationship = relationships[0];

    // 3. Remove the relationship (does NOT delete child account or progress)
    await base44.asServiceRole.entities.ParentChildRelationship.delete(relationship.id);

    // 4. Update parent's linked_student_ids AND num_children count
    const currentLinked = parent.linked_student_ids || [];
    const updatedLinked = currentLinked.filter((id: string) => id !== child_id);
    const currentNumChildren = parent.num_children || currentLinked.length;

    await base44.auth.updateMe({ 
      linked_student_ids: updatedLinked,
      num_children: Math.max(0, currentNumChildren - 1)
    });

    // 5. Create notification for child (Must use Service Role to bypass RLS)
    try {
      await base44.asServiceRole.entities.Notification.create({
        user_id: child_id,
        title: 'Parent Link Removed',
        message: `${parent.full_name || parent.email} is no longer linked to your account.`,
        type: 'parent_unlinked', // DIBETULKAN: Bukan lagi 'quiz_complete'
        reference_id: parent.id
      });
    } catch (notifErr) {
      console.warn("Failed to dispatch unlinked notification to child:", notifErr);
    }

    return Response.json({ 
      success: true, 
      message: 'Parent-child link removed successfully. Child account and progress are preserved.'
    });

  } catch (error: any) {
    console.error('RemoveParentChildLink error:', error);
    return Response.json(
      { error: error.message || 'Failed to remove link' }, 
      { status: 500 }
    );
  }
});
