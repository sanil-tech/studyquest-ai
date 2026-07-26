// src/lib/parentChildAuth.js

/**
 * Sets the active child mode for a parent session.
 * 
 * @param {Object} child - The child profile object selected by the parent
 */
export function switchToChildMode(child) {
  if (!child || !child.id) return;

  // Store active child credentials in local storage session
  localStorage.setItem("active_child_session", child.id);
  localStorage.setItem("selected_child_id", child.id);
  localStorage.setItem("active_student_id", child.id);
  localStorage.setItem("active_student_name", child.nickname || child.full_name);
  localStorage.setItem("active_child", JSON.stringify(child));
}

/**
 * Exits child mode and returns control to the parent dashboard.
 */
export function exitChildMode() {
  localStorage.removeItem("active_child_session");
  localStorage.removeItem("selected_child_id");
  localStorage.removeItem("active_student_id");
  localStorage.removeItem("active_student_name");
  localStorage.removeItem("active_child");
}
