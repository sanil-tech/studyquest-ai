// src/lib/personalize.js
import { base44 } from "@/api/base44Client";
import { getActiveStudentId } from "@/lib/rewardSystem";

/**
 * Replace {{nama}} placeholder with the student's display name.
 * Safe no-op when text has no placeholder or name is empty.
 */
export const personalize = (text, name) => {
  if (!text || !name) return text;
  return String(text).replace(/\{\{\s*nama\s*\}\}/gi, name);
};

/**
 * Resolve the active student's display name: nickname > first name from full_name > "".
 * Works for both child logins and parent view mode.
 */
export const getStudentDisplayName = async () => {
  try {
    const studentId = await getActiveStudentId();
    if (!studentId) return "";
    const user = await base44.entities.User.get(studentId);
    if (!user) return "";
    if (user.nickname && user.nickname.trim()) return user.nickname.trim();
    if (user.full_name && user.full_name.trim()) {
      return user.full_name.trim().split(/\s+/)[0];
    }
    return "";
  } catch {
    return "";
  }
};