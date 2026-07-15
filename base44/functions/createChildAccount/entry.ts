import { base44 } from "../../api/base44Client";

export async function handler(req: Request) {
  const resHeaders = {
    "content-type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: resHeaders });
  }

  try {
    const body = await req.json();
    const fullName = body?.fullName;
    const nickname = body?.nickname;
    const pin = body?.pin;
    const parentId = body?.parentId;

    if (!fullName || !pin || !parentId) {
      return new Response(
        JSON.stringify({ success: false, message: "Maklumat tidak lengkap." }), 
        { status: 400, headers: resHeaders }
      );
    }

    const cleanNickname = (nickname || fullName.split(" ")[0]).trim();
    const shortParentId = parentId.substring(0, 6);
    
    // Jana username unik & emel maya
    const usernameMaya = `${cleanNickname.toLowerCase()}.${shortParentId}`;
    const virtualEmail = `${usernameMaya}@studyquest.internal`;

    const dbClient = base44.asServiceRole;

    // =================================================================
    // 🌟 LANGKAH 1: CIPTA AKAUN DI SISTEM AUTH UTAMA (KREDENSIAL SAH)
    // =================================================================
    let authUser;
    try {
      const authResponse = await dbClient.auth.admin.createUser({
        email: virtualEmail,
        password: pin, // PIN 4-digit bertindak sebagai password sistem
        email_confirm: true, // Sahkan emel secara automatik (pintas pengesahan emel)
        user_metadata: {
          app_role: "student",
          is_child_account: true
        }
      });

      if (authResponse.error) throw new Error(authResponse.error.message);
      authUser = authResponse.data?.user || authResponse.user;
    } catch (authErr: any) {
      return new Response(
        JSON.stringify({ success: false, message: "Gagal menyediakan kredensial Auth: " + authErr.message }), 
        { status: 400, headers: resHeaders }
      );
    }

    if (!authUser?.id) {
      throw new Error("Sistem gagal menjana ID Autentikasi Murid.");
    }

    // =================================================================
    // 🌟 LANGKAH 2: CIPTA DATA PROFIL (GUNA ID YANG SAMA DARI AUTH)
    // =================================================================
    const newStudent = await dbClient.entities.User.create({
      id: authUser.id, // 💥 KUNCI UTAMA: Wajib sama dengan ID dari Sistem Auth untuk RLS
      full_name: fullName,
      email: virtualEmail, 
      username: usernameMaya,
      nickname: cleanNickname,
      app_role: "student",
      child_login_pin: pin,
      status: "active",
      profile_completed: true,
      parent_id: parentId, // Untuk kebenaran RLS pembacaan ibu bapa
      linked_parent_id: parentId
    });

    // =================================================================
    // LANGKAH 3: CIPTA HUBUNGAN KELUARGA & ENTITI AKADEMIK
    // =================================================================
    // A. Cipta hubungan dalam ParentChildRelationship
    await dbClient.entities.ParentChildRelationship.create({
      parent_id: parentId,
      child_id: authUser.id,
      status: "active"
    });

    // B. Kemaskini juga array linked_student_ids pada akaun Ibu Bapa (Backup RLS)
    try {
      const freshParent = await dbClient.entities.User.get(parentId);
      let currentLinked = freshParent?.linked_student_ids || [];
      if (typeof currentLinked === "string") {
        try { currentLinked = JSON.parse(currentLinked); } catch { currentLinked = []; }
      }
      if (!currentLinked.includes(authUser.id)) {
        currentLinked.push(authUser.id);
      }
      await dbClient.entities.User.update(parentId, { linked_student_ids: currentLinked });
    } catch (e) {
      console.log("Gagal mengemas kini pautan array ibu bapa:", e);
    }

    // C. Cipta Dompet (Wallet) & Progres (Progress) Murid
    try {
      await dbClient.entities.Wallet.create({ student_id: authUser.id, balance: 0 });
      await dbClient.entities.Progress.create({ 
        student_id: authUser.id, 
        total_xp: 0, 
        level: 1, 
        streak_days: 0, 
        total_study_time: 0 
      });
    } catch (e) {
      console.log("Entiti akademik tambahan gagal dicipta:", e);
    }

    // Pulangkan status berjaya bersama username bersih untuk dipaparkan di modal frontend
    return new Response(
      JSON.stringify({ 
        success: true, 
        childId: authUser.id,
        username: usernameMaya 
      }), 
      { status: 200, headers: resHeaders }
    );

  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, message: "Ralat Runtime Backend: " + (err?.message || "Unknown error") }), 
      { status: 500, headers: resHeaders }
    );
  }
}
