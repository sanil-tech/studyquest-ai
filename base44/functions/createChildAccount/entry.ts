import { base44 } from "../../api/base44Client";

const hashPin = (pin: string) => {
  return btoa(unescape(encodeURIComponent(`SQ_PIN_SALT_${pin}_2026`)));
};

const generateStudentId = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = 'SQ-';
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
};

// ... inside handler function:
const dbClient = base44.asServiceRole || base44;

const newStudent = await dbClient.entities.User.create({
  full_name: fullName,
  email: finalEmail, 
  nickname: (nickname || fullName.split(" ")[0]).trim(),
  app_role: "student",
  student_id: generateStudentId(),
  child_login_pin: pin,
  pin_hash: hashPin(pin),
  pin_enabled: true,
  login_method: "both",
  is_child_account: true,
  status: "active",
  profile_completed: true 
});
