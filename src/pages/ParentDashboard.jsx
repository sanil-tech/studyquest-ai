const childrenData = await Promise.all(
  childIds.map(async (childId) => {
    const [progress, wallet, sessions, attempts] = await Promise.all([
      base44.entities.Progress.filter({ student_id: childId }),
      base44.entities.Wallet.filter({ student_id: childId }),
      base44.entities.StudySession.filter({ student_id: childId }),
      base44.entities.QuizAttempt.filter({ student_id: childId }),
    ]);

    const profile = progress?.[0];

    return {
      id: childId,

      // ✅ REAL NAME FROM DATABASE
      name: profile?.full_name || "Unknown Student",

      progress: profile || {
        full_name: "Unknown Student",
        level: 1,
        total_xp: 0,
        streak_days: 0,
      },

      wallet: wallet?.[0] || {
        balance: 0,
      },

      sessions: sessions.slice(0, 5),
      attempts: attempts.slice(0, 5),
    };
  })
);