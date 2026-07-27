import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch all Progress records sorted by total_xp descending (service role for cross-user reads)
    const allProgress = await base44.asServiceRole.entities.Progress.list('-total_xp', 100);

    // Fetch all Users to get names and avatars (service role bypasses RLS)
    const allUsers = await base44.asServiceRole.entities.User.list(undefined, 200);
    const userMap = {};
    for (const u of allUsers) {
      userMap[u.id] = u;
    }

    // Build leaderboard entries — only include students with user records
    const leaderboard = allProgress
      .filter(p => userMap[p.student_id])
      .map(p => {
        const u = userMap[p.student_id];
        return {
          student_id: p.student_id,
          name: u.nickname || u.full_name || 'Pelajar',
          avatar_emoji: u.avatar_emoji || u.selected_avatar || '🧑',
          profile_picture_url: u.profile_picture_url || null,
          total_xp: p.total_xp || 0,
          level: p.level || 1,
          streak_days: p.streak_days || 0,
          total_study_time: p.total_study_time || 0,
        };
      })
      .sort((a, b) => b.total_xp - a.total_xp);

    // Assign ranks
    leaderboard.forEach((entry, idx) => { entry.rank = idx + 1; });

    // Build streak-sorted copy
    const streakboard = [...leaderboard].sort((a, b) => b.streak_days - a.streak_days);

    // Find current user's entry
    const myEntry = leaderboard.find(e => e.student_id === user.id) || null;

    return Response.json({
      leaderboard,
      streakboard,
      my_entry: myEntry,
      total_students: leaderboard.length,
    });
  } catch (error) {
    console.error('fetchLeaderboard error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});