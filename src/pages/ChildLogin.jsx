import { base44 } from "@/api/base44";

export async function childLogin(data) {
  const res = await base44.functions.invoke("childLogin", data);

  if (res.success) {
    // 🔥 IMPORTANT: store student session manually
    localStorage.setItem("student_user", JSON.stringify(res.user));
  }

  return res;
}