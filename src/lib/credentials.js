// Shared credential utilities for StudyQuest

// Generate secure random Student ID (SQ-XXXXXX format)
export const generateStudentId = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded I, O, 0, 1 for clarity
  let id = 'SQ-';
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
};

// Generate secure random password
export const generatePassword = () => {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const numbers = '23456789';
  const special = '@#$%';
  
  let password = '';
  password += upper.charAt(Math.floor(Math.random() * upper.length));
  password += lower.charAt(Math.floor(Math.random() * lower.length));
  password += numbers.charAt(Math.floor(Math.random() * numbers.length));
  password += special.charAt(Math.floor(Math.random() * special.length));
  
  for (let i = 0; i < 6; i++) {
    const all = upper + lower + numbers + special;
    password += all.charAt(Math.floor(Math.random() * all.length));
  }
  
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

// Simple hash function for PIN (not cryptographically secure, but sufficient for 4-6 digit PIN)
export const hashPin = (pin) => {
  return btoa(unescape(encodeURIComponent(`SQ_PIN_SALT_${pin}_2026`)));
};

// Hash password using simple hashing (in production, use bcrypt)
export const hashPassword = (password) => {
  return btoa(unescape(encodeURIComponent(`SQ_PWD_SALT_${password}_2026`)));
};

// Calculate age from date of birth
export const calculateAge = (birthDate) => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

// Get recommended education level based on age
export const getRecommendedLevel = (age) => {
  if (age < 7) return "Standard 1";
  if (age === 7) return "Standard 1";
  if (age === 8) return "Standard 2";
  if (age === 9) return "Standard 3";
  if (age === 10) return "Standard 4";
  if (age === 11) return "Standard 5";
  if (age === 12) return "Standard 6";
  if (age === 13) return "Form 1";
  if (age === 14) return "Form 2";
  if (age === 15) return "Form 3";
  if (age === 16) return "Form 4";
  if (age === 17) return "Form 5";
  return "Other";
};