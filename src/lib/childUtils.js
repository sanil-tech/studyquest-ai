// src/lib/childUtils.js
import { base44 } from "@/api/base44Client";

/**
 * Returns the best display name for a child profile.
 */
export const getChildDisplayName = (child) => {
  if (!child) return "Pelajar";

  const nickname = typeof child.nickname === "string" ? child.nickname.trim() : "";
  const fullName = typeof child.full_name === "string" ? child.full_name.trim() : "";
  const studentName = typeof child.student_name === "string" ? child.student_name.trim() : "";
  const username = typeof child.username === "string" ? child.username.trim() : "";

  if (nickname && nickname !== "Pelajar" && nickname !== "Petualang Cilik") return nickname;
  if (fullName && fullName !== "Pelajar" && fullName !== "Petualang Cilik") return fullName;
  if (studentName && studentName !== "Pelajar" && studentName !== "Petualang Cilik") return studentName;
  if (nickname) return nickname;
  if (fullName) return fullName;
  if (studentName) return studentName;
  if (username) return username;

  return "Pelajar";
};

/**
 * Returns the best greeting name for a child.
 */
export const getChildGreetingName = (child) => {
  return getChildDisplayName(child);
};

/**
 * Returns avatar string: image URL or emoji.
 */
export const getChildAvatar = (child) => {
  if (!child) return "🦧";
  if (child.profile_picture_url) return child.profile_picture_url;
  if (child.selected_avatar) return child.selected_avatar;
  if (child.avatar_emoji) return child.avatar_emoji;
  return "🦧";
};

/**
 * Checks if an avatar value is an image URL versus an emoji string.
 */
export const isAvatarUrl = (avatar) => {
  return avatar && typeof avatar === "string" && avatar.startsWith("http");
};

/**
 * Gets selected child ID from local storage.
 */
export const getSelectedChildId = () => {
  try {
    return localStorage.getItem("selected_child_id") || null;
  } catch {
    return null;
  }
};

/**
 * Saves selected child ID to local storage.
 */
export const setSelectedChildId = (id) => {
  try {
    if (id) localStorage.setItem("selected_child_id", id);
    else localStorage.removeItem("selected_child_id");
  } catch {}
};

/**
 * Safely extracts the education/form level from any user or child object.
 */
export const getStudentEducationLevel = (user) => {
  if (!user) return null;
  return (
    user.education_level ||
    user.school_year ||
    user.grade_year ||
    user.form_level ||
    user.grade ||
    user.year ||
    null
  );
};

/**
 * Checks if a student's education level matches a topic's form/grade level.
 */
export const matchesEducationLevel = (studentLevel, topicLevel) => {
  // If topic has no level specified or is for all levels, allow it
  if (!topicLevel || topicLevel === "All Levels" || topicLevel === "Semua Tahap") {
    return true;
  }

  // If student has no level specified, allow as fallback
  if (!studentLevel) {
    return true;
  }

  const normStudent = String(studentLevel).toLowerCase().trim();
  const normTopic = String(topicLevel).toLowerCase().trim();

  // Direct string match
  if (normStudent === normTopic) {
    return true;
  }

  // Extract digits (e.g., "Form 2" -> "2", "Tingkatan 2" -> "2")
  const studentNum = normStudent.match(/\d+/)?.[0];
  const topicNum = normTopic.match(/\d+/)?.[0];

  if (studentNum && topicNum && studentNum === topicNum) {
    const studentIsSecondary = 
      normStudent.includes("form") || 
      normStudent.includes("tingkatan") || 
      normStudent.includes("f");

    const topicIsSecondary = 
      normTopic.includes("form") || 
      normTopic.includes("tingkatan") || 
      normTopic.includes("f");

    const studentIsPrimary = 
      normStudent.includes("year") || 
      normStudent.includes("tahun") || 
      normStudent.includes("darjah") || 
      normStudent.includes("y");

    const topicIsPrimary = 
      normTopic.includes("year") || 
      normTopic.includes("tahun") || 
      normTopic.includes("darjah") || 
      normTopic.includes("y");

    if ((studentIsSecondary && topicIsSecondary) || (studentIsPrimary && topicIsPrimary)) {
      return true;
    }

    if (!studentIsSecondary && !topicIsSecondary && !studentIsPrimary && !topicIsPrimary) {
      return true;
    }
  }

  return false;
};

/**
 * Loads all children for the current parent user, enriched with Progress, Wallet, and StudySession data.
 */
export const loadChildrenWithStats = async () => {
  const u = await base44.auth.me().catch(() => null);
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

  try {
    const linkReqs = await base44.entities.LinkRequest.filter({ parent_id: u.id, status: "approved" });
    if (linkReqs && linkReqs.length > 0) {
      childIds = [...new Set([...childIds, ...linkReqs.map((lr) => lr.student_id)])];
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
        const [studySessionRes, progressRes, walletRes, attemptsRes, childUser, linkReqRes] = await Promise.all([
          base44.entities.StudySession.filter({ student_id: id }).catch(() => []),
          base44.entities.Progress.filter({ student_id: id }).catch(() => []),
          base44.entities.Wallet.filter({ student_id: id }).catch(() => []),
          base44.entities.QuizAttempt.filter({ student_id: id }).catch(() => []),
          base44.entities.User.get(id).catch(() => null),
          base44.entities.LinkRequest.filter({ student_id: id }).catch(() => []),
        ]);

        const localCache = cachedChildren[id] || {};
        const matchedLinkReq = linkReqRes?.find((lr) => lr.student_name && lr.student_name !== "Pelajar");

        const nickname =
          childUser?.nickname ||
          localCache.nickname ||
          matchedLinkReq?.student_name ||
          childUser?.full_name ||
          localCache.full_name ||
          childUser?.username ||
          "Pelajar";

        const fullName =
          childUser?.full_name ||
          localCache.full_name ||
          matchedLinkReq?.student_name ||
          nickname;

        cachedChildren[id] = {
          ...localCache,
          id,
          nickname,
          full_name: fullName,
          selected_avatar: childUser?.selected_avatar || localCache.selected_avatar || null,
          username: childUser?.username || localCache.username || "student",
          email: childUser?.email || localCache.email || matchedLinkReq?.student_email || "",
          child_login_pin: childUser?.child_login_pin || localCache.child_login_pin || "",
        };

        let allSessions = [];
        let latestSession = {};
        if (studySessionRes && studySessionRes.length > 0) {
          allSessions = [...studySessionRes].sort(
            (a, b) => new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0)
          );
          latestSession = allSessions[0];
        }

        let realProgress = { total_xp: 0, streak_days: 0, level: 1 };
        if (progressRes && progressRes.length > 0) {
          realProgress = [...progressRes].sort((a, b) => new Date(b.updated_at || b.last_study_date || 0) - new Date(a.updated_at || a.last_study_date || 0))[0];
        }

        const wallet = walletRes && walletRes.length > 0 ? walletRes[0] : { balance: 0 };

        let latestQuizScore = null;
        let allAttempts = [];
        if (attemptsRes && attemptsRes.length > 0) {
          allAttempts = [...attemptsRes].sort(
            (a, b) => new Date(b.created_at || b.updated_at || 0) - new Date(a.created_at || a.updated_at || 0)
          );
          latestQuizScore = allAttempts[0]?.score ?? null;
        }

        return {
          id,
          email: childUser?.email || localCache.email || matchedLinkReq?.student_email || "",
          nickname,
          full_name: fullName,
          username: childUser?.username || localCache.username || "student",
          selected_avatar: childUser?.selected_avatar || localCache.selected_avatar || null,
          profile_picture_url: childUser?.profile_picture_url || null,
          avatar_emoji: childUser?.avatar_emoji || localCache.avatar_emoji || "🦧",
          pin_hash: childUser?.pin_hash || childUser?.child_login_pin || localCache.child_login_pin || null,
          child_login_pin: childUser?.child_login_pin || localCache.child_login_pin || null,
          login_enabled: childUser?.login_enabled !== false,
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

  localStorage.setItem("cached_children", JSON.stringify(cachedChildren));

  return kids.filter(Boolean);
};
