import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
} 


export const isIframe = window.self !== window.top;

/**
 * Display Name Fallback System
 * Priority: nickname > full_name > username > student_id > "Student"
 * Ensures a valid display name is ALWAYS returned for students/children
 */
export function getDisplayName(user) {
  if (!user) return "Student";
  
  // Priority 1: Nickname (preferred for children)
  if (user.nickname && user.nickname.trim()) {
    return user.nickname.trim();
  }
  
  // Priority 2: Full name
  if (user.full_name && user.full_name.trim()) {
    return user.full_name.trim();
  }
  
  // Priority 3: Username
  if (user.username && user.username.trim()) {
    return user.username.trim();
  }
  
  // Priority 4: Student ID
  if (user.student_id) {
    return user.student_id;
  }
  
  // Last resort (should never happen in production)
  return "Student";
}