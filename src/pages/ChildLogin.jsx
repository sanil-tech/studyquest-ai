import { base44 } from "@/api/base44";

export async function childLogin({ student_id, password, pin }) {
  try {
    const result = await base44.functions.invoke("childLogin", {
      student_id,
      password,
      pin,
    });

    return result;
  } catch (error) {
    console.error("Login error:", error);

    return {
      success: false,
      error: "Network or server error",
    };
  }
}