import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

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

    // Try auth token (parents/regular users); fall back to student_id for child PIN login
    const authUser = await base44.auth.me().catch(() => null);

    const body = await req.json().catch(() => ({}));
    const action = body.action;
    const activeStudentId = body.student_id || (authUser ? authUser.id : null);

    if (!activeStudentId) {
      return Response.json({ success: false, error: 'Sesi log masuk tidak ditemui. Sila log masuk semula.' }, { status: 200, headers: resHeaders });
    }

    // ACTION: Search for students
    if (action === 'search') {
      const query = String(body.query || '').trim();
      if (!query || query.length < 2) {
        return Response.json({ success: true, results: [] }, { status: 200, headers: resHeaders });
      }

      const allUsers = await db.entities.User.list(undefined, 500);
      const lowerQuery = query.toLowerCase();
      const results = allUsers
        .filter(u =>
          u.id !== activeStudentId &&
          u.app_role === 'student' &&
          (
            (u.username && u.username.toLowerCase().includes(lowerQuery)) ||
            (u.student_id && u.student_id.toLowerCase().includes(lowerQuery)) ||
            (u.nickname && u.nickname.toLowerCase().includes(lowerQuery))
          )
        )
        .slice(0, 20)
        .map(u => ({
          id: u.id,
          nickname: u.nickname || u.full_name || 'Pelajar',
          username: u.username || null,
          student_id_code: u.student_id || null,
          avatar_emoji: u.avatar_emoji || u.selected_avatar || '🧑',
          profile_picture_url: u.profile_picture_url || null,
          school_name: u.school_name || null,
          school_year: u.school_year || null,
        }));

      return Response.json({ success: true, results }, { status: 200, headers: resHeaders });
    }

    // ACTION: Send friend request
    if (action === 'send_request') {
      const addresseeId = body.addressee_id;
      if (!addresseeId) {
        return Response.json({ success: false, error: 'Sila pilih rakan untuk ditambah.' }, { status: 200, headers: resHeaders });
      }
      if (addresseeId === activeStudentId) {
        return Response.json({ success: false, error: 'Anda tidak boleh menambah diri sendiri.' }, { status: 200, headers: resHeaders });
      }

      // Check existing friendships in both directions
      const asRequester = await db.entities.Friendship.filter({ requester_id: activeStudentId, addressee_id: addresseeId }).catch(() => []);
      const asAddressee = await db.entities.Friendship.filter({ requester_id: addresseeId, addressee_id: activeStudentId }).catch(() => []);
      const existing = [...(asRequester || []), ...(asAddressee || [])];

      if (existing.length > 0) {
        const f = existing[0];
        if (f.status === 'accepted') {
          return Response.json({ success: false, error: 'Kamu sudah menjadi rakan!' }, { status: 200, headers: resHeaders });
        }
        if (f.status === 'pending') {
          return Response.json({ success: false, error: 'Permintaan rakan telah dihantar sebelum ini.' }, { status: 200, headers: resHeaders });
        }
        // If declined, re-activate as pending
        await db.entities.Friendship.update(f.id, { status: 'pending', requester_id: activeStudentId, addressee_id: addresseeId });
        return Response.json({ success: true, message: 'Permintaan rakan dihantar!' }, { status: 200, headers: resHeaders });
      }

      const requesterUser = await db.entities.User.get(activeStudentId).catch(() => null);
      const addresseeUser = await db.entities.User.get(addresseeId).catch(() => null);

      const buildProfile = (u) => ({
        nickname: u?.nickname || u?.full_name || 'Pelajar',
        avatar_emoji: u?.avatar_emoji || u?.selected_avatar || '🧑',
        profile_picture_url: u?.profile_picture_url || null,
      });

      await db.entities.Friendship.create({
        requester_id: activeStudentId,
        addressee_id: addresseeId,
        status: 'pending',
        requester_profile: buildProfile(requesterUser),
        addressee_profile: buildProfile(addresseeUser),
      });

      return Response.json({ success: true, message: 'Permintaan rakan dihantar!' }, { status: 200, headers: resHeaders });
    }

    // ACTION: Accept friend request
    if (action === 'accept') {
      const friendshipId = body.friendship_id;
      if (!friendshipId) {
        return Response.json({ success: false, error: 'ID rakan tidak ditemui.' }, { status: 200, headers: resHeaders });
      }

      const friendship = await db.entities.Friendship.get(friendshipId).catch(() => null);
      if (!friendship) {
        return Response.json({ success: false, error: 'Permintaan rakan tidak ditemui.' }, { status: 200, headers: resHeaders });
      }
      if (friendship.addressee_id !== activeStudentId) {
        return Response.json({ success: false, error: 'Anda tidak mempunyai kebenaran untuk tindakan ini.' }, { status: 200, headers: resHeaders });
      }

      await db.entities.Friendship.update(friendshipId, { status: 'accepted' });
      return Response.json({ success: true, message: 'Permintaan rakan diterima!' }, { status: 200, headers: resHeaders });
    }

    // ACTION: Decline friend request
    if (action === 'decline') {
      const friendshipId = body.friendship_id;
      if (!friendshipId) {
        return Response.json({ success: false, error: 'ID rakan tidak ditemui.' }, { status: 200, headers: resHeaders });
      }

      const friendship = await db.entities.Friendship.get(friendshipId).catch(() => null);
      if (!friendship) {
        return Response.json({ success: false, error: 'Permintaan rakan tidak ditemui.' }, { status: 200, headers: resHeaders });
      }
      if (friendship.addressee_id !== activeStudentId) {
        return Response.json({ success: false, error: 'Anda tidak mempunyai kebenaran untuk tindakan ini.' }, { status: 200, headers: resHeaders });
      }

      await db.entities.Friendship.update(friendshipId, { status: 'declined' });
      return Response.json({ success: true, message: 'Permintaan rakan ditolak.' }, { status: 200, headers: resHeaders });
    }

    // ACTION: Remove friend / cancel request
    if (action === 'remove') {
      const friendshipId = body.friendship_id;
      if (!friendshipId) {
        return Response.json({ success: false, error: 'ID rakan tidak ditemui.' }, { status: 200, headers: resHeaders });
      }

      const friendship = await db.entities.Friendship.get(friendshipId).catch(() => null);
      if (!friendship) {
        return Response.json({ success: false, error: 'Rakan tidak ditemui.' }, { status: 200, headers: resHeaders });
      }
      if (friendship.requester_id !== activeStudentId && friendship.addressee_id !== activeStudentId) {
        return Response.json({ success: false, error: 'Anda tidak mempunyai kebenaran untuk tindakan ini.' }, { status: 200, headers: resHeaders });
      }

      await db.entities.Friendship.delete(friendshipId);
      return Response.json({ success: true, message: 'Rakan dibuang.' }, { status: 200, headers: resHeaders });
    }

    // ACTION: List friends and pending requests
    if (action === 'list') {
      const asRequester = await db.entities.Friendship.filter({ requester_id: activeStudentId }).catch(() => []);
      const asAddressee = await db.entities.Friendship.filter({ addressee_id: activeStudentId }).catch(() => []);
      const allFriendships = [...(asRequester || []), ...(asAddressee || [])];

      const friends = [];
      const pendingIncoming = [];
      const pendingOutgoing = [];

      for (const f of allFriendships) {
        const isRequester = f.requester_id === activeStudentId;
        const profile = isRequester ? f.addressee_profile : f.requester_profile;
        const otherId = isRequester ? f.addressee_id : f.requester_id;

        const entry = {
          friendship_id: f.id,
          student_id: otherId,
          nickname: profile?.nickname || 'Pelajar',
          avatar_emoji: profile?.avatar_emoji || '🧑',
          profile_picture_url: profile?.profile_picture_url || null,
          status: f.status,
          direction: isRequester ? 'outgoing' : 'incoming',
        };

        if (f.status === 'accepted') {
          friends.push(entry);
        } else if (f.status === 'pending') {
          if (isRequester) pendingOutgoing.push(entry);
          else pendingIncoming.push(entry);
        }
      }

      return Response.json({
        success: true,
        friends,
        pendingIncoming,
        pendingOutgoing,
        counts: {
          friends: friends.length,
          pendingIncoming: pendingIncoming.length,
          pendingOutgoing: pendingOutgoing.length,
        }
      }, { status: 200, headers: resHeaders });
    }

    // ACTION: View friend's profile (achievements, avatar, badges)
    if (action === 'view_profile') {
      const friendStudentId = body.friend_id || body.student_id_to_view;
      if (!friendStudentId) {
        return Response.json({ success: false, error: 'ID rakan tidak ditemui.' }, { status: 200, headers: resHeaders });
      }

      // Verify friendship exists and is accepted
      const asRequester = await db.entities.Friendship.filter({ requester_id: activeStudentId, addressee_id: friendStudentId }).catch(() => []);
      const asAddressee = await db.entities.Friendship.filter({ requester_id: friendStudentId, addressee_id: activeStudentId }).catch(() => []);
      const allLinks = [...(asRequester || []), ...(asAddressee || [])];
      const isFriend = allLinks.some(f => f.status === 'accepted');

      if (!isFriend) {
        return Response.json({ success: false, error: 'Anda hanya boleh melihat profil rakan yang sah.' }, { status: 200, headers: resHeaders });
      }

      // Fetch friend's data in parallel
      const [friendUser, progressList, walletList, quizAttempts, sessions, gameProgress] = await Promise.all([
        db.entities.User.get(friendStudentId).catch(() => null),
        db.entities.Progress.filter({ student_id: friendStudentId }).catch(() => []),
        db.entities.Wallet.filter({ student_id: friendStudentId }).catch(() => []),
        db.entities.QuizAttempt.filter({ student_id: friendStudentId }).catch(() => []),
        db.entities.StudySession.filter({ student_id: friendStudentId }).catch(() => []),
        db.entities.GameProgress.filter({ student_id: friendStudentId }).catch(() => []),
      ]);

      const progress = progressList?.[0] || {};
      const wallet = walletList?.[0] || {};

      // Count this friend's friends for the social achievement
      const friendAsRequester = await db.entities.Friendship.filter({ requester_id: friendStudentId, status: 'accepted' }).catch(() => []);
      const friendAsAddressee = await db.entities.Friendship.filter({ addressee_id: friendStudentId, status: 'accepted' }).catch(() => []);
      const friendsCount = (friendAsRequester?.length || 0) + (friendAsAddressee?.length || 0);

      return Response.json({
        success: true,
        user: {
          id: friendUser?.id,
          nickname: friendUser?.nickname || friendUser?.full_name || 'Pelajar',
          username: friendUser?.username || null,
          avatar_emoji: friendUser?.avatar_emoji || friendUser?.selected_avatar || '🧑',
          profile_picture_url: friendUser?.profile_picture_url || null,
          school_name: friendUser?.school_name || null,
          school_year: friendUser?.school_year || null,
          state: friendUser?.state || null,
          district: friendUser?.district || null,
          selected_creature: friendUser?.selected_creature || null,
        },
        progress: {
          level: progress.level || 1,
          total_xp: progress.total_xp || 0,
          streak_days: progress.streak_days || 0,
          total_study_time: progress.total_study_time || 0,
        },
        wallet: { balance: wallet.balance || 0 },
        quizAttempts: quizAttempts || [],
        sessions: sessions || [],
        games: gameProgress || [],
        friends: new Array(friendsCount),
      }, { status: 200, headers: resHeaders });
    }

    return Response.json({ success: false, error: 'Tindakan tidak dikenali.' }, { status: 200, headers: resHeaders });

  } catch (error) {
    console.error('manageFriends error:', error);
    return Response.json({ success: false, error: error.message || 'Ralat pelayan.' }, { status: 500, headers: resHeaders });
  }
});