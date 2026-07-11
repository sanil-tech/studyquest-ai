import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

const hashPassword = (password: string) =>
  btoa(unescape(encodeURIComponent(`SQ_PWD_SALT_${password}_2026`)));

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
      return Response.json({ success: false, error: "Username is required" });
    }

    if (!childData.password) {
      return Response.json({ success: false, error: "Password is required" });
    }

    // 🔍 1. Semak jika username entiti sudah wujud
    const existing = await base44.asServiceRole.entities.User.filter({ username });
    if (existing.length > 0) {
      return Response.json({ success: false, error: "Username already exists." });
    }

    // Bina format e-mel maya yang unik dan konsisten untuk Native Provider
    const childEmail = `${username}@studyquest.local`;
    const passwordHash = hashPassword(childData.password);
    const studentId = "SQ" + Math.floor(100000 + Math.random() * 900000);

    // 🔐 2. DAFTARKAN USER SECARA NATIVE MENGGUNAKAN ADMIN SERVICE ROLE (Bypass OTP)
    const authUser = await base44.asServiceRole.auth.createUser({
      email: childEmail,
      password: childData.password,
      email_confirmed: true // Memintas langkah pengesahan e-mel/OTP
    });

    if (!authUser || !authUser.id) {
      throw new Error("Gagal mencipta akaun kredensial utama dalam Native Auth.");
    }

    // 📝 3. CIPTA PROFIL ENTITI USER (Dipetakan terus ke Native ID akaun)
    const child = await base44.asServiceRole.entities.User.create({
      id: authUser.id, // Padankan ID profil entiti dengan ID Auth utama
      role: "user",
      email: childEmail,
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
      profile_picture_url: childData.profile_picture_url || "",
      avatar_photo_url: childData.profile_picture_url || "",
      profile_completed: true,
      is_child_account: true,
      login_method: "password",
      pin_enabled: false,
      failed_login_attempts: 0,
      account_locked: false,
      linked_student_ids: [],
    });

    // Cipta perkaitan hubungan keluarga (Parent-Child)
    await base44.asServiceRole.entities.ParentChildRelationship.create({
      parent_id: parent.id,
      child_id: child.id,
      relationship: "parent",
      status: "active",
      linked_at: new Date().toISOString(),
    });

    // Sediakan Wallet murid
    await base44.asServiceRole.entities.Wallet.create({
      student_id: child.id,
      balance: 0,
    });

    // Sediakan lembaran Progress murid
    await base44.asServiceRole.entities.Progress.create({
      student_id: child.id,
      total_xp: 0,
      level: 1,
      streak_days: 0,
      total_study_time: 0,
    });

    // Pautkan ID murid baharu ke dalam array akaun Ibu Bapa
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
    return Response.json({ success: false, error: err.message });
  }
});
