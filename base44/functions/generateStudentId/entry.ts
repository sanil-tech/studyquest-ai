import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    // 1. Pengesahan Akses
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.app_role !== 'student') {
      return Response.json({ error: 'Only students can have a Student ID' }, { status: 403 });
    }

    // 2. Semakan Sedia Ada (Idempotency)
    // Jika pelajar sudah mempunyai ID, pulangkan ID tersebut terus
    if (user.student_id) {
      return Response.json({ 
        success: true, 
        student_id: user.student_id,
        is_new: false
      });
    }

    // 3. Fungsi Penjanaan ID Unik
    const generateId = (): string => {
      // Mengecualikan I, O, 0, 1 untuk mengelakkan kekeliruan visual
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; 
      let id = 'SQ-';
      for (let i = 0; i < 6; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return id;
    };

    // 4. Proses Semakan Pertindihan (Collision Detection)
    let studentId = generateId();
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const existing = await base44.asServiceRole.entities.User.filter({ 
        student_id: studentId 
      });
      
      if (existing.length === 0) break; // ID adalah unik, keluar dari loop
      
      studentId = generateId();
      attempts++;
    }

    if (attempts >= maxAttempts) {
      return Response.json(
        { error: 'System busy. Failed to generate a unique ID after 10 attempts.' }, 
        { status: 500 }
      );
    }

    // 5. Kemas Kini Pangkalan Data (Menggunakan Service Role untuk Override RLS)
    await base44.asServiceRole.entities.User.update(user.id, { 
      student_id: studentId 
    });

    // 6. Pulangkan Respon
    return Response.json({ 
      success: true, 
      student_id: studentId,
      is_new: true
    });

  } catch (error: any) {
    console.error('Generate Student ID Runtime Error:', error);
    return Response.json(
      { error: error.message || 'Internal server transaction error' }, 
      { status: 500 }
    );
  }
});
