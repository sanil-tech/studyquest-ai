import { base44 } from "@/api";

export async function childLogin(data: {
  student_id?: string;
  pin?: string;
  password?: string;
}) {
  try {
    const res = await base44.functions.invoke("childLogin", data);

    if (res.success) {
      // 🔥 MUST match AuthContext
      localStorage.setItem("student", JSON.stringify(res.user));
    }

    return res;
  } catch (err) {
    console.error("childLogin error:", err);

    return {
      success: false,
      error: "Network error"
    };
  }
}