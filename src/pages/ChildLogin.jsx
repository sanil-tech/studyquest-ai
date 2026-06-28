export default async function childLogin(params, context) {
  try {
    // ✅ SAFE PARAM HANDLING (FIXES YOUR ERROR)
    const input = params || {};

    const studentId = String(input.student_id || "")
      .trim()
      .toUpperCase();

    const password = String(input.password || "").trim();
    const pin = String(input.pin || "").trim();

    if (!studentId) {
      return { success: false, error: "Student ID is required" };
    }

    // Fetch student
    const student = await context.db
      .from("students")
      .select("*")
      .eq("student_id", studentId)
      .maybeSingle();

    if (!student) {
      return { success: false, error: "Student not found" };
    }

    // =========================
    // PIN LOGIN (PRIMARY)
    // =========================
    if (pin) {
      if (!student.pin) {
        return { success: false, error: "PIN not set by parent" };
      }

      if (String(student.pin).trim() !== pin) {
        return { success: false, error: "Incorrect PIN" };
      }
    }

    // =========================
    // PASSWORD LOGIN (OPTIONAL)
    // =========================
    else if (password) {
      if (!student.password) {
        return { success: false, error: "Password not set by parent" };
      }

      if (student.password !== password) {
        return { success: false, error: "Incorrect password" };
      }
    }

    else {
      return { success: false, error: "Enter PIN or password" };
    }

    // SUCCESS
    return {
      success: