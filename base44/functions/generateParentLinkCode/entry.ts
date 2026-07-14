import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    // 1. Pengesahan Akses Pengguna
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.app_role !== 'student') {
      return Response.json({ error: 'Only students can generate Parent Link Codes' }, { status: 403 });
    }

    // 2. OPTIMASI: Nyahaktifkan kod lama secara serentak (Parallel Processing)
    const existingCodes = await base44.asServiceRole.entities.ParentLinkCode.filter({ 
      child_id: user.id,
      is_active: true
    });

    if (existingCodes.length > 0) {
      await Promise.all(
        existingCodes.map((code: any) => 
          base44.asServiceRole.entities.ParentLinkCode.update(code.id, { is_active: false })
        )
      );
    }

    // 3. Penjanaan Kod Rawak Berentropi Tinggi (Mudah dibaca manusia)
    const generateCode = (): string => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let code = '';
      for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };

    const newCode = generateCode();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Sah untuk tempoh 24 jam tepat

    // 4. Cipta Rekod Kod Pautan Baru ke Pangkalan Data
    await base44.asServiceRole.entities.ParentLinkCode.create({
      child_id: user.id,
      code: newCode,
      expires_at: expiresAt.toISOString(),
      is_active: true
    });

    // 5. Pulangkan Payload Lengkap ke Frontend UI
    return Response.json({ 
      success: true,
      code: newCode,
      expires_at: expiresAt.toISOString(),
      student_id: user.student_id
    });

  } catch (error: any) {
    console.error('Generate Parent Link Code Runtime Error:', error);
    return Response.json(
      { error: error.message || 'Internal server transaction error' }, 
      { status: 500 }
    );
  }
});
