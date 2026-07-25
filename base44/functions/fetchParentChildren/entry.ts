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

    // 1. Verify Parent Authentication
    const authUser = await base44.auth.me().catch(() => null);
    if (!authUser || !authUser.id) {
      return Response.json(
        { success: false, error: 'Akses dinafikan - Sesi log masuk ibu bapa tidak ditemui.' },
        { status: 401, headers: resHeaders }
      );
    }

    const parent = await db.entities.User.get(authUser.id).catch(() => authUser);

    // 2. Aggregate all linked child IDs for this parent
    let childIds: string[] = [];

    if (parent.linked_student_ids && Array.isArray(parent.linked_student_ids)) {
      childIds = [...parent.linked_student_ids];
    }

    const relationships = await db.entities.ParentChildRelationship.filter({
      parent_id: parent.id,
      status: 'active'
    }).catch(() => []);

    relationships.forEach((r: any) => {
      if (r.child_id && !childIds.includes(r.child_id)) {
        childIds.push(r.child_id);
      }
    });

    const linkRequests = await db.entities.LinkRequest.filter({
      parent_id: parent.id,
      status: 'approved'
    }).catch(() => []);

    linkRequests.forEach((lr: any) => {
      if (lr.student_id && !childIds.includes(lr.student_id)) {
        childIds.push(lr.student_id);
      }
    });

    if (childIds.length === 0) {
      return Response.json({ success: true, children: [] }, { status: 200, headers: resHeaders });
    }

    // 3. Fetch real database records for each child using Service Role
    const childrenData = await Promise.all(
      childIds.map(async (childId) => {
        try {
          const [childUser, studySessions, progress, wallet, quizAttempts, matchedLinks] = await Promise.all([
            db.entities.User.get(childId).catch(() => null),
            db.entities.StudySession.filter({ student_id: childId }).catch(() => []),
            db.entities.Progress.filter({ student_id: childId }).catch(() => []),
            db.entities.Wallet.filter({ student_id: childId }).catch(() => []),
            db.entities.QuizAttempt.filter({ student_id: childId }).catch(() => []),
            db.entities.LinkRequest.filter({ student_id: childId }).catch(() => [])
          ]);

          const matchedLinkReq = matchedLinks.find((lr: any) => lr.parent_id === parent.id);

          const nicknameReal = 
            childUser?.nickname || 
            matchedLinkReq?.student_name || 
            childUser?.full_name || 
            "Pelajar";

          const usernameReal = 
            childUser?.username || 
            matchedLinkReq?.student_username || 
            (nicknameReal ? nicknameReal.toLowerCase() : "student");

          const pinReal = childUser?.child_login_pin || "----";

          let sortedSessions = [...studySessions].sort((a: any, b: any) => 
            new Date(b.updated_at || b.created_at || 0).getTime() - new Date(a.updated_at || a.created_at || 0).getTime()
          );

          let realProgress = progress.length > 0 ? progress[0] : { total_xp: 0, streak_days: 0, level: 1 };
          let activeWallet = wallet.length > 0 ? wallet[0] : { balance: 0 };

          let sortedAttempts = [...quizAttempts].sort((a: any, b: any) => 
            new Date(b.created_at || b.updated_at || 0).getTime() - new Date(a.created_at || a.updated_at || 0).getTime()
          );

          return {
            id: childId,
            nickname: nicknameReal,
            full_name: childUser?.full_name || matchedLinkReq?.student_name || "",
            username: usernameReal,
            student_id: childUser?.student_id || "",
            child_login_pin: pinReal,
            selected_avatar: childUser?.selected_avatar || "🦖",
            avatar_emoji: childUser?.avatar_emoji || "🦖",
            wallet: activeWallet,
            realProgress,
            latestSession: sortedSessions[0] || {},
            allSessions: sortedSessions,
            allAttempts: sortedAttempts,
            quiz: {
              quiz_score: sortedAttempts.length > 0 ? sortedAttempts[0].score : null
            }
          };
        } catch (e) {
          console.error(`Gagal memuatkan data anak ID ${childId}:`, e);
          return null;
        }
      })
    );

    return Response.json(
      { success: true, children: childrenData.filter(Boolean) },
      { status: 200, headers: resHeaders }
    );

  } catch (error: any) {
    console.error("FetchParentChildren Error:", error);
    return Response.json(
      { success: false, error: error.message || "Ralat pelayan semasa memuatkan profil anak." },
      { status: 500, headers: resHeaders }
    );
  }
});
