import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const parent = await base44.auth.me();

    if (!parent) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (parent.app_role !== 'parent') {
      return Response.json({ error: 'Only parents can link or handle child profiles' }, { status: 403 });
    }

    const body = await req.json();
    const { method, student_id, link_code, childId, requestedChanges } = body;

    let child;

    // ===================================
    // METHOD 1: STUDENT ID
    // ===================================
    if (method === 'student_id') {
      // Lookup by student_code
      const users = await base44.entities.User.filter({
        student_code: student_id
      });

      if (!users.length) {
        return Response.json(
          { error: "Student not found" },
          { status: 404 }
        );
      }

      child = users[0];

      if (child.app_role !== 'student') {
        return Response.json(
          { error: 'Not a student account' },
          { status: 400 }
        );
      }

      // Check existing request
      const existing = await base44.entities.LinkRequest.filter({
        student_id: child.id,
        parent_id: parent.id,
        status: 'pending'
      });

      if (existing.length > 0) {
        return Response.json(
          { error: 'Request already sent' },
          { status: 400 }
        );
      }

      await base44.entities.LinkRequest.create({
        student_id: child.id,
        student_email: child.email,
        student_name: child.full_name || child.nickname || child.email,
        parent_id: parent.id,
        parent_email: parent.email,
        parent_name: parent.full_name || parent.nickname || parent.email,
        initiated_by: 'parent',
        status: 'pending'
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
        message: 'Request sent for approval',
        child: { id: child.id, name: child.full_name || child.email }
      });
    }

    // ===================================
    // METHOD 2: LINK CODE
    // ===================================
    else if (method === 'link_code') {
      const codes = await base44.entities.ParentLinkCode.filter({
        code: link_code,
        is_active: true
      });

      if (!codes.length) {
        return Response.json(
          { error: 'Invalid or expired Link Code' },
          { status: 404 }
        );
      }

      const linkCode = codes[0];
      const now = new Date();
      const expiresAt = new Date(linkCode.expires_at);

      if (now > expiresAt) {
        await base44.entities.ParentLinkCode.update(linkCode.id, {
          is_active: false
        });

        return Response.json(
          { error: 'Link Code has expired' },
          { status: 400 }
        );
      }

      const users = await base44.entities.User.filter({
        id: linkCode.child_id
      });

      if (!users.length) {
        return Response.json(
          { error: 'Child not found' },
          { status: 404 }
        );
      }

      child = users[0];

      const existing = await base44.entities.ParentChildRelationship.filter({
        parent_id: parent.id,
        child_id: child.id,
        status: 'active'
      });

      if (existing.length > 0) {
        return Response.json(
          { error: 'Already linked to this child' },
          { status: 400 }
        );
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

      await base44.entities.Notification.create({
        user_id: child.id,
        title: 'Parent Linked',
        message: `${parent.full_name || parent.email} is now linked to your account.`,
        type: 'quiz_complete',
        reference_id: parent.id
      });

      return Response.json({
        success: true,
        message: 'Successfully linked',
        child: { id: child.id, name: child.full_name || child.email }
      });
    }

    // ===================================
    // METHOD 3: REQUEST APPROVAL (NEW)
    // ===================================
    else if (method === 'request_approval') {
      if (!childId) {
        return Response.json({ error: 'Missing childId parameter' }, { status: 400 });
      }

      // Verify profile ownership/link exists before letting parent handle request workflow
      const checkRelationship = await base44.entities.ParentChildRelationship.filter({
        parent_id: parent.id,
        child_id: childId,
        status: 'active'
      });

      if (!checkRelationship.length) {
        return Response.json({ error: 'Unauthorized profile operation for this child' }, { status: 403 });
      }

      // Create internal request item or trigger dynamic profile updates
      await base44.entities.LinkRequest.create({
        student_id: childId,
        parent_id: parent.id,
        initiated_by: 'parent',
        status: 'pending',
        metadata: JSON.stringify({ ...requestedChanges, critical_update: true })
      });

      // Notify child about verified changes state context shift
      await base44.entities.Notification.create({
        user_id: childId,
        title: 'Critical Change Handled',
        message: 'Your profile changes have been registered and checked under parent approval logic.',
        type: 'quiz_complete',
        reference_id: parent.id
      });

      return Response.json({
        success: true,
        message: 'Parent approval request processed successfully.'
      });
    }

    else {
      return Response.json({ error: 'Invalid method' }, { status: 400 });
    }

  } catch (error) {
    console.error('Link/Approval error:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});