export default async function childLogin(params, context) {
  try {
    const input = params || {}; // 🔥 FIXES YOUR CRASH

    const studentId = String(input.student_id || "")
      .trim()
      .toUpperCase();

    const pin = String(input.pin || "").trim();

    if (!studentId) {
      return { success: false, error: "Student ID required" };
    }

    const records = await context.entities.ParentChildRelationship.list({
      student_id: studentId
    });

    const student = records?.[0];

    if (!student) {
      return { success: false, error: "Student not found" };
    }

    if (String(student.pin || "").trim() !== pin) {
      return { success: false, error: "Incorrect PIN" };
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
    console.error("childLogin error:", err);

    return {
      success: false,
      error: "Server error"
    };
  }
}