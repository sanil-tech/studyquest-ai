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
    const virtualEmail = `${cleanNickname.toLowerCase()}.${shortParentId}@studyquest.internal`;

    const dbClient = base44.asServiceRole || base44;

    // Cipta akaun anak
    const newStudent = await dbClient.entities.User.create({
      full_name: fullName,
      email: virtualEmail, 
      nickname: cleanNickname,
      app_role: "student",
      child_login_pin: pin,
      status: "active",
      profile_completed: true 
    });

    // Cipta pautan keluarga
    await dbClient.entities.ParentChildRelationship.create({
      parent_id: parentId,
      child_id: newStudent.id,
      status: "active"
    });

    // Cipta Wallet & Progress
    try {
      await dbClient.entities.Wallet.create({ student_id: newStudent.id, balance: 0 });
      await dbClient.entities.Progress.create({ 
        student_id: newStudent.id, 
        total_xp: 0, 
        level: 1, 
        streak_days: 0, 
        total_study_time: 0 
      });
    } catch (e) {
      console.log("Entiti akademik tambahan gagal.", e);
    }

    return new Response(
      JSON.stringify({ success: true, childId: newStudent.id }), 
      { status: 200, headers: resHeaders }
    );

  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, message: "Ralat Runtime Backend: " + (err?.message || "Unknown error") }), 
      { status: 500, headers: resHeaders }
    );
  }
}
