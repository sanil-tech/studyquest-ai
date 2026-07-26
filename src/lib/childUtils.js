// src/lib/childUtils.js

/**
 * Safely extracts the education/form level from any user or child object.
 * Checks all possible field variations used across the database.
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
 * Examples handled:
 * - Student: "Form 2", Topic: "Form 2" -> Match
 * - Student: "Form 2", Topic: "Tingkatan 2" -> Match
 * - Student: "Tingkatan 2", Topic: "Form 2" -> Match
 * - Topic: "All Levels" or "Semua Tahap" -> Match for everyone
 */
export const matchesEducationLevel = (studentLevel, topicLevel) => {
  // If topic has no specific level or is marked for all levels, allow it
  if (!topicLevel || topicLevel === "All Levels" || topicLevel === "Semua Tahap") {
    return true;
  }

  // If student level is not set, allow as fallback
  if (!studentLevel) {
    return true;
  }

  const normStudent = String(studentLevel).toLowerCase().trim();
  const normTopic = String(topicLevel).toLowerCase().trim();

  // Direct exact match
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

    // Both are Secondary (Form 2 == Tingkatan 2) or both are Primary (Year 2 == Tahun 2)
    if ((studentIsSecondary && topicIsSecondary) || (studentIsPrimary && topicIsPrimary)) {
      return true;
    }

    // If neither explicitly specifies primary vs secondary, match by number
    if (!studentIsSecondary && !topicIsSecondary && !studentIsPrimary && !topicIsPrimary) {
      return true;
    }
  }

  return false;
};
