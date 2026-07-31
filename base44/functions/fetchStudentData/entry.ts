import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const db = base44.asServiceRole || base44;

    const body = await req.json().catch(() => ({}));
    const studentId = body?.student_id;

    if (!studentId) {
      return Response.json(
        { success: false, error: 'ID Pelajar diperlukan.' },
        { status: 400 }
      );
    }

    // Fetch all student data in parallel using Service Role (bypasses RLS)
    const [childUser, progressRes, walletRes, transactionsRes, quizRes, rewardRequestsRes, parentRelsRes] = await Promise.all([
      db.entities.User.get(studentId).catch(() => null),
      db.entities.Progress.filter({ student_id: studentId }).catch(() => []),
      db.entities.Wallet.filter({ student_id: studentId }).catch(() => []),
      db.entities.CoinTransaction.filter({ student_id: studentId }, "-created_date", 50).catch(() => []),
      db.entities.QuizAttempt.filter({ student_id: studentId }, "-created_date", 50).catch(() => []),
      db.entities.RewardRequest.filter({ student_id: studentId }, "-created_date", 20).catch(() => []),
      db.entities.ParentChildRelationship.filter({ child_id: studentId, status: "active" }).catch(() => []),
    ]);

    const progress = (progressRes && progressRes[0]) || { total_xp: 0, streak_days: 0, level: 1 };
    const transactions = transactionsRes || [];
    const quizAttempts = quizRes || [];
    const rewardRequests = rewardRequestsRes || [];

    // Resolve wallet — create if missing
    let wallet = (walletRes && walletRes[0]) || null;
    if (!wallet) {
      try {
        wallet = await db.entities.Wallet.create({ student_id: studentId, balance: 0 });
      } catch {
        wallet = { balance: 0 };
      }
    }

    // Find parent_id for reward lookup
    const parentId = parentRelsRes?.[0]?.parent_id || null;

    let rewards: any[] = [];
    if (parentId) {
      rewards = await db.entities.Reward.filter({ parent_id: parentId, student_id: studentId }).catch(() => []);
    }

    const studentUser = {
      id: studentId,
      nickname: childUser?.nickname || childUser?.full_name || "Penjelajah",
      full_name: childUser?.full_name || childUser?.nickname || "",
      username: childUser?.username || "",
      email: childUser?.email || "",
      selected_avatar: childUser?.selected_avatar || "🦧",
      avatar_emoji: childUser?.avatar_emoji || "🦧",
      profile_picture_url: childUser?.profile_picture_url || null,
      app_role: "student",
      education_level: childUser?.education_level || childUser?.school_year || "",
      school_name: childUser?.school_name || "",
      class_name: childUser?.class_name || "",
      gender: childUser?.gender || "",
      date_of_birth: childUser?.date_of_birth || "",
      country: childUser?.country || "Malaysia",
      state: childUser?.state || "",
      district: childUser?.district || "",
      student_id: childUser?.student_id || "",
    };

    return Response.json({
      success: true,
      user: studentUser,
      progress,
      wallet,
      transactions,
      quizAttempts,
      rewardRequests,
      rewards,
      parentId,
    });

  } catch (error: any) {
    console.error("FetchStudentData Error:", error);
    return Response.json(
      { success: false, error: error.message || "Ralat pelayan." },
      { status: 500 }
    );
  }
}