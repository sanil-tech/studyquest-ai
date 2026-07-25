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

    // Verify parent authentication
    const authUser = await base44.auth.me().catch(() => null);
    if (!authUser || !authUser.id) {
      return Response.json(
        { success: false, error: 'Unauthorized - Sesi log masuk tidak ditemui.' },
        { status: 401, headers: resHeaders }
      );
    }

    const body = await req.json().catch(() => ({}));
    const childId = body.child_id || body.childId;
    const nickname = body.nickname;
    const fullName = body.full_name || body.fullName;

    if (!childId) {
      return Response.json(
        { success: false, error: 'child_id diperlukan.' },
        { status: 400, headers: resHeaders }
      );
    }

    const updateFields: Record<string, any> = {};
    if (nickname) updateFields.nickname = nickname.trim();
    if (fullName) updateFields.full_name = fullName.trim();

    // Perform database update with Service Role
    const updatedUser = await db.entities.User.update(childId, updateFields);

    // Synchronize LinkRequest table
    if (nickname || fullName) {
      const linkRequests = await db.entities.LinkRequest.filter({ student_id: childId }).catch(() => []);
      for (const lr of linkRequests) {
        await db.entities.LinkRequest.update(lr.id, {
          student_name: nickname || fullName
        }).catch(() => null);
      }
    }

    return Response.json({
      success: true,
      message: 'Profil anak berjaya dikemaskini di pangkalan data.',
      user: updatedUser
    }, { status: 200, headers: resHeaders });

  } catch (error: any) {
    console.error('UpdateChildProfile Error:', error);
    return Response.json(
      { success: false, error: error.message || 'Gagal mengemaskini profil anak.' },
      { status: 500, headers: resHeaders }
    );
  }
});
