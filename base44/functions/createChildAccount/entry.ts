import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

// PBKDF2 password hashing (non-reversible)
// Store format: pbkdf2$<iterations>$<salt>$<hash_hex>
const PBKDF2_ITERATIONS = 100000;

const toHex = (buf: ArrayBuffer) =>
  Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

const hashPassword = async (password: string) => {
  const salt = crypto.randomUUID();
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: encoder.encode(salt),
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );
  return `pbkdf2$${PBKDF2_ITERATIONS}$${salt}$${toHex(bits)}`;
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const parent = await base44.auth.me();

    if (!parent) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (parent.app_role !== "parent") {
      return Response.json(
        { success: false, error: "Only parents can create child accounts." },
        { status: 403 }
      );
    }

    const { childData } = await req.json();

    const username = childData.username
      ?.trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "");

    if (!username) {
      return Response.json({
        success: false,
        error: "Username is required",
      });
    }

    if (!childData.password) {
      return Response.json({
        success: false,
        error: "Password is required",
      });
    }

    // Check username
    const existing = await base44.asServiceRole.entities.User.filter({
      username,
    });

    if (existing.length > 0) {
      return Response.json({
        success: false,
        error: "Username already exists.",
      });
    }

    const passwordHash = await hashPassword(childData.password);

    const studentId =
      "SQ" + Math.floor(100000 + Math.random() * 900000);

    // CREATE CHILD USER
    const child = await base44.asServiceRole.entities.User.create({
      role: "user",

      email: `child-${crypto.randomUUID()}@studyquest.local`,

      full_name: childData.full_name,

      app_role: "student",

      username,

      password_hash: passwordHash,

      student_id: studentId,

      linked_parent_id: parent.id,

      nickname: childData.nickname || "",

      gender: childData.gender || "",

      date_of_birth: childData.date_of_birth,

      school_name: childData.school_name || "",

      education_level: childData.education_level || "",

      grade_year: childData.grade_year || "",

      school_year: childData.education_level || "",

      state: childData.state || "",

      country: "Malaysia",

      profile_picture_url:
        childData.profile_picture_url || "",

      avatar_photo_url:
        childData.profile_picture_url || "",

      profile_completed: true,

      is_child_account: true,

      login_method: "password",

      pin_enabled: false,

      failed_login_attempts: 0,

      account_locked: false,

      linked_student_ids: [],
    });

    // Parent-child relationship
    await base44.asServiceRole.entities.ParentChildRelationship.create({
      parent_id: parent.id,
      child_id: child.id,
      relationship: "parent",
      status: "active",
      linked_at: new Date().toISOString(),
    });

    // Wallet
    await base44.asServiceRole.entities.Wallet.create({
      student_id: child.id,
      balance: 0,
    });

    // Progress
    await base44.asServiceRole.entities.Progress.create({
      student_id: child.id,
      total_xp: 0,
      level: 1,
      streak_days: 0,
      total_study_time: 0,
    });

    // Update parent
    const linked = parent.linked_student_ids || [];

    if (!linked.includes(child.id)) {
      await base44.auth.updateMe({
        linked_student_ids: [...linked, child.id],
      });
    }

    return Response.json({
      success: true,
      child: {
        id: child.id,
        username: child.username,
        student_id: child.student_id,
      },
    });
  } catch (err) {
    console.error(err);

    return Response.json({
      success: false,
      error: err.message,
    });
  }
});