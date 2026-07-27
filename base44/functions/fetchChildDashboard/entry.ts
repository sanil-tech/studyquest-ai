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

    const body = await req.json();
    const studentId = body?.student_id;

    if (!studentId) {
      return Response.json(
        { success: false, error: 'ID Pelajar diperlukan.' },
        { status: 400, headers: resHeaders }
      );
    }

    // Fetch all dashboard data in parallel using Service Role (bypasses RLS)
    const [childUser, progressRes, walletRes, sessionsRes, quizRes, pendingRelsRes] = await Promise.all([
      db.entities.User.get(studentId).catch(() => null),
      db.entities.Progress.filter({ student_id: studentId }).catch(() => []),
      db.entities.Wallet.filter({ student_id: studentId }).catch(() => []),
      db.entities.StudySession.filter({ student_id: studentId }, "-created_date", 10).catch(() => []),
      db.entities.QuizAttempt.filter({ student_id: studentId }, "-created_date", 10).catch(() => []),
      db.entities.ParentChildRelationship.filter({ child_id: studentId, status: "pending" }).catch(() => []),
    ]);

    const progress = (progressRes && progressRes[0]) || { total_xp: 0, streak_days: 0, level: 1 };
    const wallet = (walletRes && walletRes[0]) || { balance: 0 };
    const sessions = sessionsRes || [];
    const quizzes = quizRes || [];

    // Enrich pending relationship requests with parent info
    let pendingRequests: any[] = [];
    const pendingRels = pendingRelsRes || [];
    if (pendingRels.length > 0) {
      pendingRequests = await Promise.all(
        pendingRels.map(async (rel: any) => {
          try {
            const parentUser = await db.entities.User.get(rel.parent_id).catch(() => null);
            return {
              id: rel.id,
              parent_name: parentUser?.full_name || parentUser?.nickname || parentUser?.username || "Penjaga",
              parent_email: parentUser?.email || "Pengesahan diperlukan",
            };
          } catch {
            return { id: rel.id, parent_name: "Penjaga", parent_email: "Pengesahan diperlukan" };
          }
        })
      );
    }

    const studentUser = {
      id: studentId,
      nickname: childUser?.nickname || childUser?.full_name || "Penjelajah",
      full_name: childUser?.full_name || childUser?.nickname || "",
      username: childUser?.username || "",
      selected_avatar: childUser?.selected_avatar || "🦧",
      avatar_emoji: childUser?.avatar_emoji || "🦧",
      app_role: "student",
      education_level: childUser?.education_level || "",
    };

    return Response.json(
      {
        success: true,
        user: studentUser,
        progress,
        wallet,
        sessions,
        quizzes,
        pendingRequests,
      },
      { status: 200, headers: resHeaders }
    );

  } catch (error: any) {
    console.error("FetchChildDashboard Error:", error);
    return Response.json(
      { success: false, error: error.message || "Ralat pelayan." },
      { status: 500, headers: resHeaders }
    );
  }
});