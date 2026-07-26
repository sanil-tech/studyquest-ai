// src/lib/createChildAccount.js
import { base44 } from "@/api/base44Client";

/**
 * Creates a new child account registered under a parent account.
 * 
 * @param {Object} childData
 * @param {string} childData.fullName - Full name of the child (e.g. "Ivan Tan")
 * @param {string} childData.nickname - Short nickname (e.g. "Ivan")
 * @param {string} childData.username - Unique login username (e.g. "ivan2026")
 * @param {string} childData.pin - 4-digit security PIN (e.g. "1234")
 * @param {string} childData.educationLevel - Grade/Form level (e.g. "Form 2")
 * 
 * @returns {Promise<{ success: boolean, child?: Object, error?: string }>}
 */
export async function registerChildUnderParent({
  fullName,
  nickname,
  username,
  pin,
  educationLevel = "Form 2"
}) {
  try {
    // 1. Verify Parent Authentication
    const parentUser = await base44.auth.me();
    if (!parentUser || parentUser.app_role !== "parent") {
      throw new Error("Sistem memerlukan akaun ibu bapa yang sah.");
    }

    // 2. Format and sanitize child credentials
    const cleanUsername = username.trim().toLowerCase();
    const cleanPin = String(pin).trim();

    if (cleanPin.length < 4) {
      throw new Error("PIN mestilah sekurang-kurangnya 4 digit.");
    }

    // 3. Create the Student User Record
    const newStudentData = {
      full_name: fullName.trim(),
      nickname: nickname.trim() || fullName.split(" ")[0],
      username: cleanUsername,
      child_login_pin: cleanPin,
      app_role: "student",
      education_level: educationLevel,
      login_enabled: true,
      email: `${cleanUsername}@student.studyquest.internal` // Internal email fallback
    };

    const newStudent = await base44.entities.User.create(newStudentData);
    const studentId = Array.isArray(newStudent) ? newStudent[0]?.id : newStudent?.id;

    if (!studentId) {
      throw new Error("Gagal mendaftarkan akaun pelajar baharu.");
    }

    // 4. Link Parent to Child in ParentChildRelationship table
    await base44.entities.ParentChildRelationship.create({
      parent_id: parentUser.id,
      child_id: studentId,
      status: "active"
    });

    // 5. Initialize Child Wallet (Daun Emas / Coins)
    await base44.entities.Wallet.create({
      student_id: studentId,
      balance: 0
    });

    // 6. Initialize Child Progress (XP and Level)
    await base44.entities.Progress.create({
      student_id: studentId,
      total_xp: 0,
      level: 1,
      streak_days: 1,
      last_study_date: new Date().toISOString().split("T")[0]
    });

    return {
      success: true,
      child: {
        id: studentId,
        full_name: fullName,
        username: cleanUsername,
        education_level: educationLevel
      }
    };

  } catch (err) {
    console.error("Ralat pendaftaran anak:", err);
    return {
      success: false,
      error: err.message || "Gagal mendaftarkan akaun anak."
    };
  }
}
