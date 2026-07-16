import { base44 } from "@/api/base44Client";

// Returns the best display name for a child: nickname → full_name → username → email → fallback
export const getChildDisplayName = (child) => {
  if (!child) return "Pelajar";
  return child.nickname || child.full_name || child.username || child.email || "Pelajar";
};

// Returns the best greeting name (same as display name, trimmed)
export const getChildGreetingName = (child) => {
  const name = getChildDisplayName(child);
  return name;
};

// Returns avatar: URL string for image avatars, emoji string for emoji avatars
export const getChildAvatar = (child) => {
  if (!child) return "🦧";
  if (child.profile_picture_url) return child.profile_picture_url;
  if (child.selected_avatar) return child.selected_avatar;
  if (child.avatar_emoji) return child.avatar_emoji;
  return "🦧";
};

// Checks if an avatar value is a URL (image) vs an emoji
export const isAvatarUrl = (avatar) => avatar && typeof avatar === "string" && avatar.startsWith("http");

// Selected child ID persistence (localStorage-based, per device)
export const getSelectedChildId = () => {
  try {
    return localStorage.getItem("selected_child_id") || null;
  } catch {
    return null;
  }
};

export const setSelectedChildId = (id) => {
  try {
    if (id) localStorage.setItem("selected_child_id", id);
    else localStorage.removeItem("selected_child_id");
  } catch {}
};

// Loads all children for the current parent user, enriched with Progress, Wallet, and StudySession data
export const loadChildrenWithStats = async () => {
  const u = await base44.auth.me();
  if (!u?.id) return [];

  let childIds = [];
  if (u.linked_student_ids && Array.isArray(u.linked_student_ids)) {
    childIds = [...u.linked_student_ids];
  }

  try {
    const rel = await base44.entities.ParentChildRelationship.filter({ parent_id: u.id, status: "active" });
    if (rel && rel.length > 0) {
      childIds = [...new Set([...childIds, ...rel.map((r) => r.child_id)])];
    }
  } catch {}

  const cachedChildren = JSON.parse(localStorage.getItem("cached_children") || "{}");
  if (childIds.length === 0 && Object.keys(cachedChildren).length > 0) {
    childIds = Object.keys(cachedChildren);
  }

  if (childIds.length === 0) return [];

  const kids = await Promise.all(
    childIds.map(async (id) => {
      try {
        const [studySessionRes, progressRes, walletRes, attemptsRes, childUser] = await Promise.all([
          base44.entities.StudySession.filter({ student_id: id }).catch(() => []),
          base44.entities.Progress.filter({ student_id: id }).catch(() => []),
          base44.entities.Wallet.filter({ student_id: id }).catch(() => []),
          base44.entities.QuizAttempt.filter({ student_id: id }).catch(() => []),
          base44.entities.User.get(id).catch(() => null),
        ]);

        const localCache = cachedChildren[id] || {};

        const nickname = childUser?.nickname || childUser?.full_name || localCache.nickname || localCache.full_name || "Pelajar";
        const fullName = childUser?.full_name || localCache.full_name || "";

        let allSessions = [];
        let latestSession = {};
        if (studySessionRes && studySessionRes.length > 0) {
          allSessions = [...studySessionRes].sort(
            (a, b) => new Date(b.updated_date || b.created_date || 0) - new Date(a.updated_date || a.created_date || 0)
          );
          latestSession = allSessions[0];
        }

        let realProgress = { total_xp: 0, streak_days: 0, level: 1 };
        if (progressRes && progressRes.length > 0) {
          realProgress = [...progressRes].sort((a, b) => new Date(b.updated_date || 0) - new Date(a.updated_date || 0))[0];
        }

        const wallet = walletRes && walletRes.length > 0 ? walletRes[0] : { balance: 0 };

        let latestQuizScore = null;
        let allAttempts = [];
        if (attemptsRes && attemptsRes.length > 0) {
          allAttempts = [...attemptsRes].sort(
            (a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0)
          );
          latestQuizScore = allAttempts[0]?.score ?? null;
        }

        return {
          id,
          email: childUser?.email || localCache.email || "",
          nickname,
          full_name: fullName,
          username: childUser?.username || localCache.username || "student",
          selected_avatar: childUser?.selected_avatar || localCache.selected_avatar || null,
          profile_picture_url: childUser?.profile_picture_url || null,
          avatar_emoji: childUser?.avatar_emoji || localCache.avatar_emoji || "🦧",
          gender: childUser?.gender || localCache.gender || "",
          date_of_birth: childUser?.date_of_birth || localCache.date_of_birth || "",
          school_name: childUser?.school_name || localCache.school_name || "",
          education_level: childUser?.education_level || localCache.education_level || "",
          preferred_language: childUser?.preferred_language || localCache.preferred_language || "ms",
          interests: childUser?.interests || localCache.interests || [],
          wallet,
          allSessions,
          latestSession,
          realProgress,
          quiz: { quiz_score: latestQuizScore },
          allAttempts,
        };
      } catch {
        return null;
      }
    })
  );

  return kids.filter(Boolean);
};