import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

/**
 * Resolves the active student ID from AuthContext (not base44.auth.me()).
 * Works for both direct child login (fake token) and parent-in-child-mode (real token).
 */
function resolveStudentId(authUser) {
  if (!authUser) return null;

  if (authUser.app_role === "parent") {
    return (
      localStorage.getItem("active_child_session") ||
      localStorage.getItem("selected_child_id") ||
      localStorage.getItem("active_student_id") ||
      null
    );
  }

  return authUser.id;
}

/**
 * Hook that fetches all student page data via the fetchStudentData backend function.
 * Uses service role (bypasses RLS) so it works for child login with fake tokens.
 */
export function useStudentData() {
  const { user: authUser } = useAuth();
  const studentId = resolveStudentId(authUser);

  const [data, setData] = useState(null);
  const [studentUser, setStudentUser] = useState(authUser);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!studentId) {
      setLoading(false);
      setData(null);
      return;
    }

    try {
      setLoading(true);
      const res = await base44.functions.invoke("fetchStudentData", {
        student_id: studentId,
      });

      if (res.data?.success) {
        setData(res.data);
        setStudentUser(res.data.user || authUser);
      } else {
        setData(null);
        setStudentUser(authUser);
      }
    } catch (err) {
      console.error("useStudentData error:", err);
      setData(null);
      setStudentUser(authUser);
    } finally {
      setLoading(false);
    }
  }, [studentId, authUser]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    studentId,
    studentUser,
    data,
    loading,
    refetch: fetchData,
  };
}