import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import StudentDashboard from "./StudentDashboard";
import RoleSetup from "./RoleSetup";

export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // No role set yet or default platform roles — show setup
  if (!user?.role || !["student", "parent"].includes(user.role)) {
    return <RoleSetup />;
  }

  // Parent — redirect once
  if (user.role === "parent") {
    window.location.href = "/parent";
    return null;
  }

  return <StudentDashboard />;
}