import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const db = base44.asServiceRole || base44;

    // 1. Authenticate user session
    const authUser = await base44.auth.me().catch(() => null);
    if (!authUser || !authUser.id) {
      return Response.json(
        { success: false, error: 'Sesi log masuk tidak ditemui. Sila log masuk semula.' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));

    // Normalize child ID input
    let rawId = body.child_id || body.childId;
    if (typeof rawId === 'object' && rawId !== null) {
      rawId = rawId.id || rawId.student_id || rawId.username;
    }

    let requestedId = rawId ? String(rawId).trim() : "";

    if (!requestedId && authUser.app_role === "student") {
      requestedId = authUser.id;
    }

    let targetUser: any = null;

    // LOOKUP TIER 1: Primary Key ID
    if (requestedId) {
      targetUser = await db.entities.User.get(requestedId).catch(() => null);
    }

    // LOOKUP TIER 2: student_id Code (e.g., SQ-123456)
    if (!targetUser && requestedId) {
      const matchByCode = await db.entities.User.filter({ student_id: requestedId }).catch(() => []);
      if (matchByCode && matchByCode.length > 0) targetUser = matchByCode[0];
    }

    // LOOKUP TIER 3: Username
    if (!targetUser && requestedId) {
      const matchByUsername = await db.entities.User.filter({ username: requestedId }).catch(() => []);
      if (matchByUsername && matchByUsername.length > 0) targetUser = matchByUsername[0];
    }

    // LOOKUP TIER 4: Fallback for Parent Account Links
    if (!targetUser && authUser.app_role === "parent") {
      const rels = await db.entities.ParentChildRelationship.filter({
        parent_id: authUser.id,
        status: "active"
      }).catch(() => []);

      if (rels && rels.length > 0) {
        const childPk = rels[0].child_id || rels[0].student_id;
        if (childPk) targetUser = await db.entities.User.get(childPk).catch(() => null);
      }
    }

    if (!targetUser || !targetUser.id) {
      return Response.json(
        { success: false, error: 'Profil murid tidak ditemui di pangkalan data.' },
        { status: 404 }
      );
    }

    const actualChildId = targetUser.id;

    // 2. Authorize
    let isAuthorized = authUser.id === actualChildId || authUser.app_role === "parent";

    if (!isAuthorized) {
      const rels = await db.entities.ParentChildRelationship.filter({
        parent_id: authUser.id,
        child_id: actualChildId
      }).catch(() => []);

      if (rels && rels.length > 0) isAuthorized = true;
    }

    if (!isAuthorized) {
      return Response.json(
        { success: false, error: 'Anda tidak mempunyai kebenaran untuk mengemaskini profil ini.' },
        { status: 403 }
      );
    }

    // 3. Build sanitized update payload
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
    if (body.profile_picture_url !== undefined && body.profile_picture_url !== null) {
      updateFields.profile_picture_url = String(body.profile_picture_url);
    }
    if (body.selected_creature !== undefined && body.selected_creature !== null) {
      updateFields.selected_creature = String(body.selected_creature);
    }
    if (body.owned_avatar_items !== undefined && body.owned_avatar_items !== null) {
      updateFields.owned_avatar_items = String(body.owned_avatar_items);
    }
    if (body.equipped_avatar_items !== undefined && body.equipped_avatar_items !== null) {
      updateFields.equipped_avatar_items = String(body.equipped_avatar_items);
    }
    if (body.gender !== undefined && body.gender !== null) {
      updateFields.gender = String(body.gender);
    }
    if (body.date_of_birth || body.dateOfBirth) {
      updateFields.date_of_birth = String(body.date_of_birth || body.dateOfBirth);
    }
    if (body.state !== undefined && body.state !== null) {
      updateFields.state = String(body.state).trim();
    }
    if (body.district !== undefined && body.district !== null) {
      updateFields.district = String(body.district).trim();
    }
    if (body.class_name !== undefined && body.class_name !== null) {
      updateFields.class_name = String(body.class_name).trim();
    }
    if (body.country !== undefined && body.country !== null) {
      updateFields.country = String(body.country).trim();
    }

    if (Object.keys(updateFields).length === 0) {
      return Response.json(
        { success: false, error: 'Tiada maklumat baharu dihantar untuk dikemaskini.' },
        { status: 400 }
      );
    }

    // 4. Update User record
    const updatedUser = await db.entities.User.update(actualChildId, updateFields);

    // 5. Isolated Sync: ParentChildRelationship
    try {
      const matchingRels = await db.entities.ParentChildRelationship.filter({ child_id: actualChildId }).catch(() => []);
      for (const rel of matchingRels) {
        const existingProfile = rel.profile || {};
        const newProfile = {
          full_name: updateFields.full_name || existingProfile.full_name || updatedUser.full_name || updatedUser.nickname || "",
          nickname: updateFields.nickname || existingProfile.nickname || updatedUser.nickname || "",
          education_level: updateFields.education_level || existingProfile.education_level || updatedUser.education_level || updatedUser.school_year || "",
          selected_avatar: updateFields.selected_avatar || existingProfile.selected_avatar || updatedUser.selected_avatar || updatedUser.avatar_emoji || "",
          username: updatedUser.username || existingProfile.username || ""
        };

        await db.entities.ParentChildRelationship.update(rel.id, {
          profile: newProfile
        }).catch(() => null);
      }
    } catch (relErr) {
      console.warn('ParentChildRelationship profile sync skipped:', relErr);
    }

    // 6. Isolated Sync: LinkRequest
    try {
      const linkRequests = await db.entities.LinkRequest.filter({ student_id: actualChildId }).catch(() => []);
      for (const lr of linkRequests) {
        const existingProfile = lr.student_profile || {};
        const updatedProfile = {
          full_name: updateFields.full_name || existingProfile.full_name || updatedUser.full_name || updatedUser.nickname || "",
          nickname: updateFields.nickname || existingProfile.nickname || updatedUser.nickname || "",
          education_level: updateFields.education_level || existingProfile.education_level || updatedUser.education_level || updatedUser.school_year || "",
          selected_avatar: updateFields.selected_avatar || existingProfile.selected_avatar || updatedUser.selected_avatar || updatedUser.avatar_emoji || "",
          username: updatedUser.username || existingProfile.username || "",
          student_id: updatedUser.student_id || existingProfile.student_id || ""
        };

        await db.entities.LinkRequest.update(lr.id, {
          student_name: updateFields.nickname || updateFields.full_name || lr.student_name,
          student_profile: updatedProfile
        }).catch(() => null);
      }
    } catch (lrErr) {
      console.warn('LinkRequest profile sync skipped:', lrErr);
    }

    return Response.json({
      success: true,
      message: 'Profil anak berjaya dikemaskini!',
      user: updatedUser
    });

  } catch (error: any) {
    console.error('UpdateChildProfile Exception:', error);
    return Response.json(
      { success: false, error: error.message || 'Gagal mengemaskini profil anak di pangkalan data.' },
      { status: 500 }
    );
  }
});