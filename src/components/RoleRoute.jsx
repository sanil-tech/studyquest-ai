import React, { useState, useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { base44 } from "@/api/base44Client";

/**
 * Role-based route guard.
 * allowedRoles = array of roles permitted to access the wrapped routes.
 * Allows parents with an active child session to access student dashboard routes.
 */
export default function RoleRoute({ allowedRoles }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // No role set yet — send to RoleSetup
  if (!user?.app_role || !["student", "parent"].includes(user.app_role)) {
    return <Navigate to="/role-setup" replace />;
  }

  // Check if parent has selected an active child profile
  const hasActiveChildSession = Boolean(
    localStorage.getItem("active_child_session") || 
    localStorage.getItem("selected_child_id")
  );

  // Permit access if role matches OR if parent is operating in active child session mode
  const isAllowed = 
    allowedRoles.includes(user.app_role) || 
    (user.app_role === "parent" && allowedRoles.includes("student") && hasActiveChildSession);

  if (!isAllowed) {
    return <Navigate to={user.app_role === "parent" ? "/parent" : "/"} replace />;
  }

  return <Outlet />;
}
