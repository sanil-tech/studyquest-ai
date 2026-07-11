import { base44 } from "../../api/base44Client";

interface CreateChildInput {
  fullName: string;
  nickname: string;
  pin: string;
  parentId: string;
}

export async function handler(req: Request) {
  // Set headers CORS untuk membenarkan komunikasi frontend-backend yang lancar
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
    const body: CreateChildInput = await req.json();
    
    // 🎯 DIBAIKI: Ekstrak pembolehubah secara direct tanpa merujuk objek bersarang (nested object)
    const { fullName, nickname, pin, parentId } = body;

    if (!fullName || !pin || !parentId) {
      return new Response(
        JSON.stringify({ success: false, message: "Nama Penuh, PIN, dan Parent ID wajib diisi." }), 
        { status: 400, headers: resHeaders }
      );
    }

    const cleanNickname = (nickname || fullName.split(" ")[0]).trim();
    const shortParentId = parentId.substring(0, 6);
    const virtualEmail = `${cleanNickname.toLowerCase()}.${shortParentId}@studyquest.internal`;

    // Pilih client database yang tersedia
    const dbClient = base44.asServiceRole || base44;

    // 🚀 PROSES 1: Cipta data anak ke jadual User utama
    const newStudent = await dbClient.entities.User.create({
      full_name: fullName,
      email: virtualEmail, 
      nickname: cleanNickname,
      app_role: "student",
      child_login_pin: pin,
      status: "active",
      profile_completed: true // Pintas terus skrin complete profil untuk anak
    });

    if (!newStudent || !newStudent.id) {
      throw new Error("Gagal mendaftarkan entiti pengguna baharu di pangkalan data.");
    }

    // 🚀 PROSES 2: Cipta hubungan pautan keluarga
    await dbClient.entities.ParentChildRelationship.create({
      parent_id: parentId,
      child_id: newStudent.id,
      status: "active"
    });

    // 🚀 PROSES 3: Cipta Wallet & Progress permulaan secara aman
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
      console.log("Info: Entiti akademik tambahan gagal dijana, pendaftaran akaun utama tetap sah.", e);
    }

    return new Response(
      JSON.stringify({ success: true, childId: newStudent.id, message: "Akaun anak berjaya dicipta secara ekspres!" }), 
      { status: 200, headers: resHeaders }
    );

  } catch (err: unknown) {
    const error = err as Error;
    console.error("🚨 Ralat kritikal di pelayan backend:", error.message);
    return new Response(
      JSON.stringify({ success: false, message: `Ralat Runtime Backend: ${error.message}` }), 
      { status: 500, headers: resHeaders }
    );
  }
}
