// base44/functions/updateChildProfile/entry.ts
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

    // 1. Verify user authentication session
    const authUser = await base44.auth.me().catch(() => null);
    if (!authUser || !authUser.id) {
      return Response.json(
        { success: false, error: 'Sesi log masuk tidak ditemui. Sila log masuk semula.' },
        { status: 200, headers: resHeaders }
      );
    }

    const body = await req.json().catch(() => ({}));

    // Extract requested identifier
    const requestedId = body.child_id || body.childId || authUser.id;

    if (!requestedId) {
      return Response.json(
        { success: false, error: 'ID profil anak tidak sah.' },
        { status: 200, headers: resHeaders }
      );
    }

    // 2. Safe User Lookup: Primary Key ID -> student_id code -> username
    let targetUser = await db.entities.User.get(requestedId).catch(() => null);

    if (!targetUser) {
      const matchedByStudentId = await db.entities.User.filter({ student_id: requestedId }).catch(() => []);
      if (matchedByStudentId && matchedByStudentId.length > 0) {
        targetUser = matchedByStudentId[0];
      }
    }

    if (!targetUser) {
      const matchedByUsername = await db.entities.User.filter({ username: requestedId }).catch(() => []);
      if (matchedByUsername && matchedByUsername.length > 0) {
        targetUser = matchedByUsername[0];
      }
    }

    if (!targetUser || !targetUser.id) {
      return Response.json(
        { success: false, error: 'Profil murid tidak ditemui di pangkalan data.' },
        { status: 200, headers: resHeaders }
      );
    }

    const actualChildId = targetUser.id;

    // 3. Authorize: Requesting user must be the child themselves OR a linked parent
    let isAuthorized = authUser.id === actualChildId || authUser.app_role === "parent";

    if (!isAuthorized) {
      const rels = await db.entities.ParentChildRelationship.filter({
        parent_id: authUser.id,
        child_id: actualChildId
      }).catch(() => []);

      if (rels && rels.length > 0) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return Response.json(
        { success: false, error: 'Anda tidak mempunyai kebenaran untuk mengemaskini profil ini.' },
        { status: 200, headers: resHeaders }
      );
    }

    // 4. Build sanitized update payload
    const updateFields: Record<string, any> = {};

    if (body.nickname !== undefined && body.nickname !== null && String(body.nickname).trim() !== "") {
      updateFields.nickname = String(body.nickname).trim();
    }
    if (body.full_name || body.fullName) {
      updateFields.full_name = String(body.full_name || body.fullName).trim();
    }
    if (body.education_level || body.grade || body.school_year) {
      const eduLevel = String(body.education_level || body.grade || body.school_year).trim();
      updateFields.education_level = eduLevel;
      updateFields.school_year = eduLevel;
    }
    if (body.school_name || body.school) {
      updateFields.school_name = String(body.school_name || body.school).trim();
    }
    if (body.selected_avatar || body.selectedAvatar) {
      const avatarVal = body.selected_avatar || body.selectedAvatar;
      updateFields.selected_avatar = avatarVal;
      updateFields.avatar_emoji = avatarVal;
    }
    if (body.profile_picture_url !== undefined) {
      updateFields.profile_picture_url = body.profile_picture_url;
    }
    if (body.gender !== undefined && body.gender !== null) {
      updateFields.gender = String(body.gender);
    }
    if (body.date_of_birth || body.dateOfBirth) {
      updateFields.date_of_birth = String(body.date_of_birth || body.dateOfBirth);
    }

    if (Object.keys(updateFields).length === 0) {
      return Response.json(
        { success: false, error: 'Tiada maklumat baharu dihantar untuk dikemaskini.' },
        { status: 200, headers: resHeaders }
      );
    }

    // 5. Perform database update with verified primary key ID
    const updatedUser = await db.entities.User.update(actualChildId, updateFields);

    // 6. Synchronize LinkRequest table display names
    if (updateFields.nickname || updateFields.full_name) {
      const newName = updateFields.nickname || updateFields.full_name;
      const linkRequests = await db.entities.LinkRequest.filter({ student_id: actualChildId }).catch(() => []);
      for (const lr of linkRequests) {
        await db.entities.LinkRequest.update(lr.id, {
          student_name: newName
        }).catch(() => null);
      }
    }

    return Response.json({
      success: true,
      message: 'Profil anak berjaya dikemaskini!',
      user: updatedUser
    }, { status: 200, headers: resHeaders });

  } catch (error: any) {
    console.error('UpdateChildProfile Error:', error);
    return Response.json(
      { success: false, error: error.message || 'Gagal mengemaskini profil anak di pangkalan data.' },
      { status: 200, headers: resHeaders }
    );
  }
});
