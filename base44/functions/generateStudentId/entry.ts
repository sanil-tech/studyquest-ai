import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.app_role !== 'student') {
      return Response.json({ error: 'Only students can have a Student ID' }, { status: 403 });
    }

    // If user already has a student_id, return it
    if (user.student_id) {
      return Response.json({ student_id: user.student_id });
    }

    // Generate unique Student ID
    const generateId = () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, O, 0, 1 to avoid confusion
      let id = 'SQ-';
      for (let i = 0; i < 6; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return id;
    };

    // Ensure uniqueness
    let studentId = generateId();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await base44.asServiceRole.entities.User.filter({ student_id: studentId });
      if (existing.length === 0) break;
      studentId = generateId();
      attempts++;
    }

    if (attempts >= 10) {
      return Response.json({ error: 'Failed to generate unique ID' }, { status: 500 });
    }

    // Assign to user
    await base44.auth.updateMe({ student_id: studentId });

    return Response.json({ student_id: studentId });
  } catch (error) {
    console.error('Generate Student ID error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});