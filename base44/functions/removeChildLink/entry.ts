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

    // 1. Verify parent authentication
    const authUser = await base44.auth.me();
    if (!authUser) {
      return Response.json(
        { error: 'Akses dinafikan - Sesi tidak ditemui.' }, 
        { status: 401, headers: resHeaders }
      );
    }

    // Fetch full parent User profile via Service Role to ensure all fields are loaded
    const parent = await db.entities.User.get(authUser.id).catch(() => authUser);

    if (parent.app_role !== 'parent' && authUser.app_role !== 'parent') {
      return Response.json(
        { error: 'Akses dinafikan - Hanya akaun ibu bapa dibenarkan.' }, 
        { status: 403, headers: resHeaders }
      );
    }

    const body = await req.json();
    const { child_id } = body;

    if (!child_id) {
      return Response.json(
        { error: 'ID Anak diperlukan.' }, 
        { status: 400, headers: resHeaders }
      );
    }

    // 2. Flexible Permission Checks across all 4 relationship structures
    const currentLinked = parent.linked_student_ids || authUser.linked_student_ids || [];
    const isLinkedInParentArray = currentLinked.includes(child_id);

    const relationships = await db.entities.ParentChildRelationship.filter({
      parent_id: parent.id,
      child_id: child_id,
    }).catch(() => []);

    const linkRequests = await db.entities.LinkRequest.filter({
      parent_id: parent.id,
      student_id: child_id,
    }).catch(() => []);

    const targetChild = await db.entities.User.get(child_id).catch(() => null);
    const isChildLinkedToParent = targetChild?.linked_parent_id === parent.id;

    const isAuthorized = 
      isLinkedInParentArray || 
      relationships.length > 0 || 
      linkRequests.length > 0 || 
      isChildLinkedToParent || 
      targetChild?.is_child_account;

    if (!isAuthorized) {
      return Response.json(
        { error: 'Anda tidak mempunyai kebenaran untuk menguruskan profil anak ini.' }, 
        { status: 403, headers: resHeaders }
      );
    }

    // 3. Clean up ParentChildRelationship & LinkRequest records
    if (relationships.length > 0) {
      for (const rel of relationships) {
        await db.entities.ParentChildRelationship.delete(rel.id).catch(() => null);
      }
    }

    if (linkRequests.length > 0) {
      for (const lr of linkRequests) {
        await db.entities.LinkRequest.delete(lr.id).catch(() => null);
      }
    }

    // 4. Update Parent's linked_student_ids array
    const updatedLinked = currentLinked.filter((id: string) => id !== child_id);
    await db.entities.User.update(parent.id, {
      linked_student_ids: updatedLinked
    }).catch(() => null);

    // 5. Clean up Child's associated gamification records & deactivate account
    //    (User entity itself cannot be deleted on the platform, so we deactivate it)
    if (targetChild && targetChild.is_child_account) {
      const [wallets, progressList, sessions, rewards, rewardRequests, gameProgress, activityLogs, quizAttempts] = await Promise.all([
        db.entities.Wallet.filter({ student_id: child_id }).catch(() => []),
        db.entities.Progress.filter({ student_id: child_id }).catch(() => []),
        db.entities.StudySession.filter({ student_id: child_id }).catch(() => []),
        db.entities.Reward.filter({ student_id: child_id }).catch(() => []),
        db.entities.RewardRequest.filter({ student_id: child_id }).catch(() => []),
        db.entities.GameProgress.filter({ student_id: child_id }).catch(() => []),
        db.entities.ActivityLog.filter({ student_id: child_id }).catch(() => []),
        db.entities.QuizAttempt.filter({ student_id: child_id }).catch(() => []),
      ]);

      for (const w of wallets) await db.entities.Wallet.delete(w.id).catch(() => null);
      for (const p of progressList) await db.entities.Progress.delete(p.id).catch(() => null);
      for (const s of sessions) await db.entities.StudySession.delete(s.id).catch(() => null);
      for (const r of rewards) await db.entities.Reward.delete(r.id).catch(() => null);
      for (const rr of rewardRequests) await db.entities.RewardRequest.delete(rr.id).catch(() => null);
      for (const gp of gameProgress) await db.entities.GameProgress.delete(gp.id).catch(() => null);
      for (const al of activityLogs) await db.entities.ActivityLog.delete(al.id).catch(() => null);
      for (const qa of quizAttempts) await db.entities.QuizAttempt.delete(qa.id).catch(() => null);

      // Deactivate the child account (cannot delete User entity on platform)
      await db.entities.User.update(child_id, {
        linked_parent_id: null,
        is_child_account: false,
        is_active: false,
        child_login_pin: null,
        education_level: null,
        school_year: null,
        selected_avatar: null,
        avatar_emoji: null,
        nickname: null,
      }).catch(() => null);
    } else if (targetChild) {
      await db.entities.User.update(child_id, {
        linked_parent_id: null
      }).catch(() => null);
    }

    return Response.json({ 
      success: true, 
      message: 'Profil anak berjaya dipadamkan sepenuhnya.' 
    }, { status: 200, headers: resHeaders });

  } catch (error: any) {
    console.error('RemoveChildLink error:', error);
    return Response.json(
      { error: error.message || 'Gagal memadam profil anak.' }, 
      { status: 500, headers: resHeaders }
    );
  }
});