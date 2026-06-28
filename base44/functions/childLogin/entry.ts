export default async function childLogin(params, context) {
  try {
    const input = params || {};

    const studentId = String(input.student_id || "")
      .trim()
      .toUpperCase();

    const pin = String(input.pin || "").trim();
    const password = String(input.password || "").trim();

    if (!studentId) {
      return { success: false, error: "Student ID required" };
    }

    const student = await context.db
      .from("students")
      .select("*")
      .eq("student_id", studentId)
      .maybeSingle();

    if (!student) {
      return { success: false, error: "Student not found" };
    }

    // PIN login (PRIMARY)
    if (pin) {
      if (String(student.pin || "").trim() !== pin) {
        return { success: false, error: "Incorrect PIN" };
      }
    }

    // Password login (optional)
    else if (password) {
      if (student.password !== password) {
        return { success: false, error: "Incorrect password" };
      }
    }

    else {
      return { success: false, error: "Enter PIN or password" };
    }

    return {
      success: true,
      user: {
        id: student.id,
        student_id: student.student_id,
        name: student.name,
        parent_id: student.parent_id,
        role: "student"
      }
    };

  } catch (err) {
    console.error(err);
    return { success: false, error: "Server error" };
  }
}