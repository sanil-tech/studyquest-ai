import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const db = base44.asServiceRole || base44;

    // Try auth token (parents/regular users); fall back to student_id for child PIN login
    const authUser = await base44.auth.me().catch(() => null);

    // Parse request body
    let body = {};
    try { body = await req.json(); } catch {}
    const scope = body.scope || 'global';

    // Determine the "current student" — passed student_id (child PIN login / parent mode) or logged-in user
    const currentStudentId = body.student_id || (authUser ? authUser.id : null);
    if (!currentStudentId) {
      return Response.json({ error: 'ID pelajar diperlukan.' }, { status: 400 });
    }

    // Fetch all Progress records sorted by total_xp descending (service role for cross-user reads)
    const allProgress = await db.entities.Progress.list('-total_xp', 200);

    // Fetch all Users to get names, avatars, and location data (service role bypasses RLS)
    const allUsers = await db.entities.User.list(undefined, 300);
    const userMap = {};
    for (const u of allUsers) {
      userMap[u.id] = u;
    }

    // Get the current student's profile for scope filtering
    const myProfile = userMap[currentStudentId] || authUser;
    const mySchool = myProfile?.school_name;
    const myYear = myProfile?.school_year;
    const myState = myProfile?.state;
    const myDistrict = myProfile?.district;

    // Build leaderboard entries — only include students with user records
    let leaderboard = allProgress
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
          school_name: u.school_name || null,
          school_year: u.school_year || null,
          state: u.state || null,
          district: u.district || null,
        };
      })
      .sort((a, b) => b.total_xp - a.total_xp);

    // Apply scope filter
    if (scope === 'school' && mySchool) {
      leaderboard = leaderboard.filter(e => e.school_name === mySchool);
    } else if (scope === 'state' && myState) {
      leaderboard = leaderboard.filter(e => e.state === myState);
    } else if (scope === 'district' && myDistrict) {
      leaderboard = leaderboard.filter(e => e.district === myDistrict);
    } else if (scope === 'friends') {
      // Actual friends from Friendship entity
      const asRequester = await db.entities.Friendship.filter({ requester_id: currentStudentId, status: 'accepted' }).catch(() => []);
      const asAddressee = await db.entities.Friendship.filter({ addressee_id: currentStudentId, status: 'accepted' }).catch(() => []);
      const friendIds = [
        ...(asRequester || []).map(f => f.addressee_id),
        ...(asAddressee || []).map(f => f.requester_id),
        currentStudentId,
      ];
      leaderboard = leaderboard.filter(e => friendIds.includes(e.student_id));
    }

    // Assign ranks
    leaderboard.forEach((entry, idx) => { entry.rank = idx + 1; });

    // Build streak-sorted copy
    const streakboard = [...leaderboard].sort((a, b) => b.streak_days - a.streak_days);

    // Find current student's entry
    const myEntry = leaderboard.find(e => e.student_id === currentStudentId) || null;

    return Response.json({
      leaderboard,
      streakboard,
      my_entry: myEntry,
      total_students: leaderboard.length,
      scope,
      filter_info: {
        school: mySchool || null,
        school_year: myYear || null,
        state: myState || null,
        district: myDistrict || null,
      },
    });
  } catch (error) {
    console.error('fetchLeaderboard error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});