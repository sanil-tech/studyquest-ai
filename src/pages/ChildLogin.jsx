export default async function childLogin({ input, context }) {
  try {
    const { student_id, password, pin } = input;

    const studentId = String(student_id || "").trim().toUpperCase();
    const cleanPassword = String(password || "").trim();
    const cleanPin = String(pin || "").trim();

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
    // LOGIN VIA PIN (RECOMMENDED)
    // =========================
    if (cleanPin) {
      if (!student.pin) {
        return {
          success: false,
          error: "PIN not set. Please ask parent to create PIN."
        };
      }

      if (String(student.pin).trim() !== cleanPin) {
        return { success: false, error: "Incorrect PIN" };
      }
    }

    // =========================
    // LOGIN VIA PASSWORD (OPTIONAL)
    // =========================
    else if (cleanPassword) {
      if (!student.password) {
        return {
          success: false,
          error: "Password not set. Please ask parent to set password."
        };
      }

      if (student.password !== cleanPassword) {
        return { success: false, error: "Incorrect password" };
      }
    }

    // =========================
    // NO INPUT
    // =========================
    else {
      return {
        success: false,
        error: "Enter PIN or password"
      };
    }

    // SUCCESS
    return {
      success: true,
      user: {
        id: student.id,
        student_id: student.student_id,
        name: student.name,
        nickname: student.nickname || student.name,
        parent_id: student.parent_id || null
      }
    };

  } catch (err) {
    console.error("childLogin error:", err);

    return {
      success: false,
      error: "Server error"
    };
  }
}