import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify parent is authenticated
    const parent = await base44.auth.me();
    if (!parent || parent.app_role !== 'parent') {
      return Response.json({ error: 'Unauthorized - Parent access required' }, { status: 401 });
    }

    const { child_id } = await req.json();

    if (!child_id) {
      return Response.json({ error: 'Child ID is required' }, { status: 400 });
    }

    // Verify this parent has access to this child
    const relationships = await base44.asServiceRole.entities.ParentChildRelationship.filter({
      parent_id: parent.id,
      child_id: child_id,
      status: 'active',
    });

    if (relationships.length === 0) {
      return Response.json({ error: 'You do not have permission to manage this child' }, { status: 403 });
    }

    // Remove the relationship (does NOT delete the child account)
    await base44.asServiceRole.entities.ParentChildRelationship.deleteMany({
      parent_id: parent.id,
      child_id: child_id,
    });

    // Update parent's linked_student_ids
    const currentLinked = parent.linked_student_ids || [];
    const updatedLinked = currentLinked.filter(id => id !== child_id);
    await base44.auth.updateMe({ 
      linked_student_ids: updatedLinked 
    });

    return Response.json({ 
      success: true, 
      message: 'Child removed from your account. The student account and progress data remain intact.' 
    });

  } catch (error) {
    console.error('RemoveChildLink error:', error);
    return Response.json({ error: error.message || 'Failed to remove link' }, { status: 500 });
  }
});