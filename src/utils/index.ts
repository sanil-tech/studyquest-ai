import { base44 } from "@/api/base44Client";

export function createPageUrl(pageName: string) {
    return '/' + pageName.replace(/ /g, '-');
}

export async function childLogin(data: {
  student_id?: string;
  pin?: string;
  password?: string;
}) {
  try {
    const res = await base44.functions.invoke("childLogin", data);

    if (res.data?.success) {
      localStorage.setItem("student", JSON.stringify(res.data.user));
    }

    return res.data;
  } catch (err) {
    console.error("childLogin error:", err);

    return {
      success: false,
      error: "Network error"
    };
  }
}