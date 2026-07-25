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
    const parent = await base44.auth.me();
    if (!parent || parent.app_role !== 'parent') {
      return Response.json(
        { error: 'Akses dinafikan - Hanya akaun ibu bapa dibenarkan.' }, 
        { status: 401, headers: resHeaders }
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

    // 2. Flexible Permission Check across all 3 linking methods
    const currentLinked = parent.linked_student_ids || [];
    const isLinkedInParentArray = currentLinked.includes(child_id);

    const relationships = await db.entities.ParentChildRelationship.filter({
      parent_id: parent.id,
      child_id: child_id,
    }).catch(() => []);

    const targetChild = await db.entities.User.get(child_id).catch(() => null);
    const isChildLinkedToParent = targetChild?.linked_parent_id === parent.id;

    // Deny if child is not linked via ANY method
    if (!isLinkedInParentArray && relationships.length === 0 && !isChildLinkedToParent) {
      return Response.json(
        { error: 'Anda tidak mempunyai kebenaran untuk menguruskan profil anak ini.' }, 
        { status: 403, headers: resHeaders }
      );
    }

    // 3. Delete ParentChildRelationship rows if any exist
    if (relationships.length > 0) {
      for (const rel of relationships) {
        await db.entities.ParentChildRelationship.delete(rel.id).catch(() => null);
      }
    }

    // 4. Update Parent's linked_student_ids array
    const updatedLinked = currentLinked.filter((id: string) => id !== child_id);
    await db.entities.User.update(parent.id, {
      linked_student_ids: updatedLinked
    }).catch(() => null);

    // 5. Clean up Child user profile & gamification records if created as a child account
    if (targetChild && targetChild.is_child_account) {
      const [wallets, progressList, sessions] = await Promise.all([
        db.entities.Wallet.filter({ student_id: child_id }).catch(() => []),
        db.entities.Progress.filter({ student_id: child_id }).catch(() => []),
        db.entities.StudySession.filter({ student_id: child_id }).catch(() => []),
      ]);

      for (const w of wallets) await db.entities.Wallet.delete(w.id).catch(() => null);
      for (const p of progressList) await db.entities.Progress.delete(p.id).catch(() => null);
      for (const s of sessions) await db.entities.StudySession.delete(s.id).catch(() => null);

      // Delete the student User record
      await db.entities.User.delete(child_id).catch(() => null);
    } else if (targetChild) {
      // Unlink parent from independent student account
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
