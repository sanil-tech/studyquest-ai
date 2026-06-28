import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const parent = await base44.auth.me();
    
    if (!parent) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { method, student_id, link_code } = body;

    let child;

    // ==========================================
    // BULLETPROOF FIX: Fetch everything server-side
    // ==========================================
    if (method === 'get_children') {
      // 1. Find the relationships securely
      const relationships = await base44.asServiceRole.entities.ParentChildRelationship.filter({
        parent_id: parent.id,
        status: 'active'
      });

      if (relationships.length === 0) {
        return Response.json({ success: true, children: [] });
      }

      // 2. Extract child IDs
      const childIds = relationships.map(rel => rel.child_id);

      // 3. Fetch the profiles securely
      const children = await base44.asServiceRole.entities.User.filter({
        id: { $in: childIds }
      });
      
      return Response.json({ success: true, children });
    }

    // ==========================================
    // Existing Student ID logic
    // ==========================================
    if (method === 'student_id') {
      const users = await base44.entities.User.filter({ student_id: student_id });
      if (users.length === 0) {
        return Response.json({ error: 'Student ID not found' }, { status: 404 });
      }
      child = users[0];

      const existing = await base44.entities.LinkRequest.filter({
        student_id: child.id,
        parent_id: parent.id,
        status: 'pending'
      });

      if (existing.length > 0) {
        return Response.json({ error: 'Request already sent' }, { status: 400 });
      }

      const safeChildEmail = child.email || `${child.student_id}@student.studyquest.local`;
      const safeParentEmail = parent.email || `${parent.id}@parent.studyquest.local`;

      await base44.entities.LinkRequest.create({
        student_id: child.id,
        student_email: safeChildEmail,
        student_name: child.full_name || child.nickname || child.student_id,
        parent_id: parent.id,
        parent_email: safeParentEmail,
        parent_name: parent.full_name || parent.nickname || 'Parent',
        initiated_by: 'parent',
        status: 'pending'
      });

      return Response.json({ 
        success: true, 
        message: 'Request sent for approval',
        child: { id: child.id, name: child.full_name || child.student_id }
      });

    // ==========================================
    // Existing Link Code logic
    // ==========================================
    } else if (method === 'link_code') {
      const codes = await base44.entities.ParentLinkCode.filter({
        code: link_code,
        is_active: true
      });

      if (codes.length === 0) {
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
      if (users.length === 0) {
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

      return Response.json({ 
        success: true, 
        message: 'Successfully linked',
        child: { id: child.id, name: child.full_name || child.student_id }
      });

    } else {
      return Response.json({ error: 'Invalid method' }, { status: 400 });
    }
  } catch (error) {
    console.error('Link Parent to Child error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});