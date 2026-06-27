import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.app_role !== 'student') {
      return Response.json({ error: 'Only students can generate Parent Link Codes' }, { status: 403 });
    }

    // Invalidate any existing active codes for this student
    const existingCodes = await base44.entities.ParentLinkCode.filter({ 
      child_id: user.id,
      is_active: true
    });

    for (const code of existingCodes) {
      await base44.entities.ParentLinkCode.update(code.id, { is_active: false });
    }

    // Generate new code
    const generateCode = () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let code = '';
      for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };

    const code = generateCode();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours from now

    // Create the link code record
    const linkCode = await base44.entities.ParentLinkCode.create({
      child_id: user.id,
      code: code,
      expires_at: expiresAt.toISOString(),
      is_active: true
    });

    return Response.json({ 
      code: code,
      expires_at: expiresAt.toISOString(),
      student_id: user.student_id
    });
  } catch (error) {
    console.error('Generate Parent Link Code error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});