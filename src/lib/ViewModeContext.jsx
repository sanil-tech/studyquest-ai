// src/lib/ViewModeContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";

const ViewModeContext = createContext();

const PARENT_ROUTE_PREFIX = "/parent";
const VIEW_MODE_KEY = "studyquest_view_mode";
const SELECTED_CHILD_KEY = "studyquest_selected_child";

// Legacy localStorage keys used by rewardSystem.js, StudentDashboard, etc.
// These must stay in sync when entering/leaving child mode.
const LEGACY_CHILD_KEYS = [
  "active_child_session",
  "selected_child_id",
  "active_student_id",
  "active_student_name",
  "active_child",
];

export const ViewModeProvider = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // current_user_role: derived from the authenticated user's app_role
  const currentUserRole = user?.app_role || null;

  // active_view_mode: 'parent_mode' | 'child_mode' — persisted for refresh resilience
  const [activeViewMode, setActiveViewMode] = useState(() => {
    return localStorage.getItem(VIEW_MODE_KEY) || "parent_mode";
  });

  // selected_child_profile: { id, name, avatar, ... } or null
  const [selectedChildProfile, setSelectedChildProfile] = useState(() => {
    const stored = localStorage.getItem(SELECTED_CHILD_KEY);
    if (stored) {
      try { return JSON.parse(stored); } catch { return null; }
    }
    return null;
  });

  // Auto-switch to parent_mode when the user navigates to any /parent route
  // Also clears legacy child session keys so student-specific hooks (useStudentData)
  // don't accidentally load the child's data while in parent mode.
  useEffect(() => {
    if (location.pathname.startsWith(PARENT_ROUTE_PREFIX)) {
      setActiveViewMode((prev) => {
        if (prev !== "parent_mode") {
          setSelectedChildProfile(null);
          localStorage.removeItem(SELECTED_CHILD_KEY);
          LEGACY_CHILD_KEYS.forEach((k) => localStorage.removeItem(k));
          return "parent_mode";
        }
        return prev;
      });
    }
  }, [location.pathname]);

  // Persist view mode so refresh keeps the correct mode
  useEffect(() => {
    localStorage.setItem(VIEW_MODE_KEY, activeViewMode);
  }, [activeViewMode]);

  // Safety net: if somehow in child_mode with no child profile, fall back
  useEffect(() => {
    if (activeViewMode === "child_mode" && !selectedChildProfile) {
      setActiveViewMode("parent_mode");
    }
  }, [activeViewMode, selectedChildProfile]);

  // Reset everything when the user logs out (user transitions from truthy to null)
  const prevUserRef = useRef(user);
  useEffect(() => {
    if (prevUserRef.current && !user) {
      setActiveViewMode("parent_mode");
      setSelectedChildProfile(null);
      localStorage.removeItem(VIEW_MODE_KEY);
      localStorage.removeItem(SELECTED_CHILD_KEY);
      LEGACY_CHILD_KEYS.forEach((k) => localStorage.removeItem(k));
    }
    prevUserRef.current = user;
  }, [user]);

  // Parent selects a child to view as — switches to child_mode
  const enterChildMode = useCallback((child) => {
    const profile = {
      id: child.id,
      name: child.nickname || child.full_name || "Pelajar",
      avatar: child.selected_avatar || child.avatar_emoji || "🦧",
      profile_picture_url: child.profile_picture_url || null,
      education_level: child.education_level || null,
    };

    setSelectedChildProfile(profile);
    localStorage.setItem(SELECTED_CHILD_KEY, JSON.stringify(profile));

    // Keep legacy keys in sync for rewardSystem.js, StudentDashboard, etc.
    localStorage.setItem("active_child_session", child.id);
    localStorage.setItem("selected_child_id", child.id);
    localStorage.setItem("active_student_id", child.id);
    localStorage.setItem("active_student_name", profile.name);
    localStorage.setItem("active_child", JSON.stringify(child));

    setActiveViewMode("child_mode");
    navigate("/dashboard");
  }, [navigate]);

  // Parent exits child view — returns to parent_mode
  const returnToParentMode = useCallback(() => {
    setActiveViewMode("parent_mode");
    setSelectedChildProfile(null);

    localStorage.removeItem(SELECTED_CHILD_KEY);
    LEGACY_CHILD_KEYS.forEach((k) => localStorage.removeItem(k));

    navigate("/parent");
  }, [navigate]);

  // Update the selected child profile in-place (e.g. avatar change on ProfilePage)
  const updateSelectedChildProfile = useCallback((updates) => {
    setSelectedChildProfile((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...updates };
      localStorage.setItem(SELECTED_CHILD_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const value = {
    currentUserRole,
    activeViewMode,
    selectedChildProfile,
    enterChildMode,
    returnToParentMode,
    updateSelectedChildProfile,
  };

  return (
    <ViewModeContext.Provider value={value}>
      {children}
    </ViewModeContext.Provider>
  );
};

export const useViewMode = () => {
  const ctx = useContext(ViewModeContext);
  if (!ctx) throw new Error("useViewMode must be used within ViewModeProvider");
  return ctx;
};