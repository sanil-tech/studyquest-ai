import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  const resHeaders = {
    "content-type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: resHeaders });
  }

  try {
    const base44 = createClientFromRequest(req);
    const db = base44.asServiceRole || base44;

    // Verify parent is authenticated
    const authUser = await base44.auth.me();
    if (!authUser) {
      return Response.json({ error: 'Unauthorized - No session found' }, { status: 401, headers: resHeaders });
    }

    const parent = await db.entities.User.get(authUser.id).catch(() => authUser);

    if (parent.app_role !== 'parent' && authUser.app_role !== 'parent') {
      return Response.json({ error: 'Unauthorized - Parent access required' }, { status: 403, headers: resHeaders });
    }

    const { child_id } = await req.json();

    if (!child_id) {
      return Response.json({ error: 'Child ID is required' }, { status: 400, headers: resHeaders });
    }

    // Flexible: check all relationship structures
    const currentLinked = parent.linked_student_ids || authUser.linked_student_ids || [];
    const isLinkedInParentArray = currentLinked.includes(child_id);

    const relationships = await db.entities.ParentChildRelationship.filter({
      parent_id: parent.id,
      child_id: child_id,
    }).catch(() => []);

    const linkRequests = await db.entities.LinkRequest.filter({
      parent_id: parent.id,
      student_id: child_id,
    }).catch(() => []);

    const targetChild = await db.entities.User.get(child_id).catch(() => null);
    const isChildLinkedToParent = targetChild?.linked_parent_id === parent.id;

    const isAuthorized =
      isLinkedInParentArray ||
      relationships.length > 0 ||
      linkRequests.length > 0 ||
      isChildLinkedToParent;

    if (!isAuthorized) {
      return Response.json({ error: 'No active relationship found for this child.' }, { status: 403, headers: resHeaders });
    }

    // Remove all relationship records
    for (const rel of relationships) {
      await db.entities.ParentChildRelationship.delete(rel.id).catch(() => null);
    }

    // Remove all link request records
    for (const lr of linkRequests) {
      await db.entities.LinkRequest.delete(lr.id).catch(() => null);
    }

    // Update parent's linked_student_ids
    const updatedLinked = currentLinked.filter(id => id !== child_id);
    await db.entities.User.update(parent.id, {
      linked_student_ids: updatedLinked
    }).catch(() => null);

    // Clear child's linked_parent_id
    if (targetChild) {
      await db.entities.User.update(child_id, {
        linked_parent_id: null
      }).catch(() => null);
    }

    return Response.json({
      success: true,
      message: 'Parent-child link removed successfully. Child account and progress are preserved.'
    }, { status: 200, headers: resHeaders });

  } catch (error) {
    console.error('RemoveParentChildLink error:', error);
    return Response.json({ error: error.message || 'Failed to remove link' }, { status: 500, headers: resHeaders });
  }
});