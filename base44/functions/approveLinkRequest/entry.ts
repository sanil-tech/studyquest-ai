import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const parent = await base44.auth.me();

    if (!parent) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (parent.app_role !== 'parent') {
      return Response.json({ error: 'Only parents can link to children' }, { status: 403 });
    }

    const body = await req.json();
    const { method, student_id, link_code, childId, requestedChanges } = body;

    let child;

    // ===================================
    // METHOD 1: STUDENT ID (Creates Pending Relationship)
    // ===================================
    if (method === 'student_id') {
      const users = await base44.entities.User.filter({
        student_code: student_id
      });

      if (!users.length) {
        return Response.json({ error: "Student not found" }, { status: 404 });
      }

      child = users[0];

      if (child.app_role !== 'student') {
        return Response.json({ error: 'Not a student account' }, { status: 400 });
      }

      // Check for any existing relationship entry
      const existing = await base44.entities.ParentChildRelationship.filter({
        student_id: child.id,
        parent_id: parent.id
      });

      if (existing.length > 0) {
        return Response.json({ error: 'A relationship entry or request already exists' }, { status: 400 });
      }

      // Create relationship with status: 'pending' directly in the table
      await base44.entities.ParentChildRelationship.create({
        parent_id: parent.id,
        child_id: child.id,
        relationship: 'parent',
        status: 'pending',
        linked_at: new Date().toISOString()
      });

      await base44.entities.Notification.create({
        user_id: child.id,
        title: 'Parent Link Request',
        message: `${parent.full_name || parent.email} wants to link to your account.`,
        type: 'quiz_complete',
        reference_id: parent.id
      });

      return Response.json({
        success: true,
        message: 'Link request sent to child for approval',
        child: { id: child.id, name: child.full_name || child.email }
      });
    }

    // ===================================
    // METHOD 2: LINK CODE (Creates Active Relationship Immediately)
    // ===================================
    else if (method === 'link_code') {
      const codes = await base44.entities.ParentLinkCode.filter({
        code: link_code,
        is_active: true
      });

      if (!codes.length) {
        return Response.json({ error: 'Invalid or expired Link Code' }, { status: 404 });
      }

      const linkCode = codes[0];
      const now = new Date();
      const expiresAt = new Date(linkCode.expires_at);

      if (now > expiresAt) {
        await base44.entities.ParentLinkCode.update(linkCode.id, { is_active: false });
        return Response.json({ error: 'Link Code has expired' }, { status: 400 });
      }

      const users = await base44.entities.User.filter({ id: linkCode.child_id });
      if (!users.length) {
        return Response.json({ error: 'Child not found' }, { status: 404 });
      }

      child = users[0];

      const existing = await base44.entities.ParentChildRelationship.filter({
        parent_id: parent.id,
        child_id: child.id,
        status: 'active'
      });

      if (existing.length > 0) {
        return Response.json({ error: 'Already linked to this child' }, { status: 400 });
      }

      await base44.entities.ParentChildRelationship.create({
        parent_id: parent.id,
        child_id: child.id,
        relationship: 'parent',
        status: 'active',
        linked_at: new Date().toISOString()
      });

      await base44.entities.ParentLinkCode.update(linkCode.id, {
        used_at: new Date().toISOString(),
        used_by_parent_id: parent.id,
        is_active: false
      });

      return Response.json({ success: true, message: 'Successfully linked' });
    }

    // ===================================
    // METHOD 3: CRITICAL PROFILE CHANGE APPROVAL
    // ===================================
    else if (method === 'request_approval') {
      if (!childId) {
        return Response.json({ error: 'Missing childId' }, { status: 400 });
      }

      // Check if they are already active before allowing change processing
      const relations = await base44.entities.ParentChildRelationship.filter({
        parent_id: parent.id,
        child_id: childId,
        status: 'active'
      });

      if (!relations.length) {
        return Response.json({ error: 'No active parental relationship found' }, { status: 403 });
      }

      // Notify child about update state log
      await base44.entities.Notification.create({
        user_id: childId,
        title: 'Critical Change Requested',
        message: 'Your parent requested a profile change configuration modification.',
        type: 'quiz_complete',
        reference_id: parent.id
      });

      return Response.json({ success: true, message: 'Approval verification created.' });
    }

    else {
      return Response.json({ error: 'Invalid method' }, { status: 400 });
    }

  } catch (error) {
    console.error('Link Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});