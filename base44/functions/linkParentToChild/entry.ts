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

    const { method, student_id, link_code } = await req.json();

    let child;

    // =========================
    // METHOD 1: STUDENT ID
    // =========================
    if (method === 'student_id') {

      // FIX: use GET properly (no filter)
      try {
        child = await base44.entities.User.get(student_id);
      } catch (err) {
        return Response.json(
          { error: 'Student ID not found' },
          { status: 404 }
        );
      }

      if (!child) {
        return Response.json(
          { error: 'Student ID not found' },
          { status: 404 }
        );
      }

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
        type: 'parent_link',
        reference_id: parent.id
      });

      return Response.json({
        success: true,
        message: 'Request sent for approval',
        child: { id: child.id, name: child.full_name || child.email }
      });
    }

    // =========================
    // METHOD 2: LINK CODE
    // =========================
    else if (method === 'link_code') {

      const codes = await base44.entities.ParentLinkCode.filter({
        code: link_code,
        is_active: true
      });

      if (codes.length === 0) {
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

      // FIX: use GET correctly
      try {
        child = await base44.entities.User.get(linkCode.child_id);
      } catch (err) {
        return Response.json(
          { error: 'Child not found' },
          { status: 404 }
        );
      }

      if (!child) {
        return Response.json(
          { error: 'Child not found' },
          { status: 404 }
        );
      }

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
        type: 'parent_link',
        reference_id: parent.id
      });

      return Response.json({
        success: true,
        message: 'Successfully linked',
        child: { id: child.id, name: child.full_name || child.email }
      });
    }

    else {
      return Response.json({ error: 'Invalid method' }, { status: 400 });
    }

  } catch (error) {
    console.error('Link Parent to Child error:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});