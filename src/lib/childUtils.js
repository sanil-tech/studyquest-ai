// src/lib/childUtils.js

/**
 * Checks if a student's education level matches a topic's form/grade level.
 * Handles formats: "Form 2", "Tingkatan 2", "Year 2", "Tahun 2", "2", etc.
 */
export const matchesEducationLevel = (studentLevel, topicLevel) => {
  // If topic has no specific level or is marked for all levels, allow it
  if (!topicLevel || topicLevel === "All Levels" || topicLevel === "Semua Tahap") {
    return true;
  }
  // If student level is not set yet, show all topics as fallback
  if (!studentLevel) {
    return true;
  }

  const normStudent = String(studentLevel).toLowerCase().trim();
  const normTopic = String(topicLevel).toLowerCase().trim();

  // Direct string match (e.g., "form 2" === "form 2")
  if (normStudent === normTopic) {
    return true;
  }

  // Extract digits (e.g. "Form 2" -> "2", "Tingkatan 2" -> "2")
  const studentNum = normStudent.match(/\d+/)?.[0];
  const topicNum = normTopic.match(/\d+/)?.[0];

  if (studentNum && topicNum && studentNum === topicNum) {
    const studentIsSecondary = normStudent.includes("form") || normStudent.includes("tingkatan") || normStudent.includes("f");
    const topicIsSecondary = normTopic.includes("form") || normTopic.includes("tingkatan") || normTopic.includes("f");

    const studentIsPrimary = normStudent.includes("year") || normStudent.includes("tahun") || normStudent.includes("y") || normStudent.includes("darjah");
    const topicIsPrimary = normTopic.includes("year") || normTopic.includes("tahun") || normTopic.includes("y") || normTopic.includes("darjah");

    // Match if both are secondary (Form 2 == Tingkatan 2) or both primary (Year 2 == Tahun 2)
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
