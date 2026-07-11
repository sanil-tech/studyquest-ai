import { base44 } from "../../api/base44Client";

interface CreateChildInput {
  fullName: string;
  nickname: string;
  pin: string;
  parentId: string;
}

export async function handler(req: Request) {
  // Sediakan headers CORS untuk mengelakkan sekatan pelayar web
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
    const { fullName, nickname, pin, parentId } = body;

    if (!fullName || !pin || !parentId) {
      return new Response(
        JSON.stringify({ success: false, message: "Nama penuh dan PIN 4-digit wajib diisi." }), 
        { status: 400, headers: resHeaders }
      );
    }

    const cleanNickname = (nickname || fullName.split(" ")[0]).trim();
    const shortParentId = parentId.substring(0, 6);
    const virtualEmail = `${cleanNickname.toLowerCase()}.${shortParentId}@studyquest.internal`;

    // 🛡️ PERLINDUNGAN 1: Sediakan fallback jika asServiceRole tiada dalam SDK anda
    // Ia akan menggunakan fungsi entiti biasa jika peranti pentadbir tidak diaktifkan
    const dbClient = base44.asServiceRole || base44;

    if (!dbClient.entities || !dbClient.entities.User) {
      return new Response(
        JSON.stringify({ success: false, message: "Pangkalan data SDK base44 tidak dapat diakses dari pelayan." }), 
        { status: 500, headers: resHeaders }
      );
    }

    // 2. Cipta rekod pengguna anak
    const newStudent = await dbClient.entities.User.create({
      full_name: fullName,
      email: virtualEmail, 
      nickname: cleanNickname,
      app_role: "student",
      child_login_pin: pin,
      status: "active",
      profile_completed: true 
    });

    if (!newStudent || !newStudent.id) {
      throw new Error("Gagal menjana ID unik untuk akaun murid baharu.");
    }

    // 3. Cipta hubungan pautan keluarga
    await dbClient.entities.ParentChildRelationship.create({
      parent_id: parentId,
      child_id: newStudent.id,
      status: "active"
    });

    // 4. Cipta Wallet & Progress permulaan secara aman
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
      console.log("Amaran: Entiti akademik gagal dicipta, tetapi akaun utama anak berjaya lulus.", e);
    }

    return new Response(
      JSON.stringify({ success: true, childId: newStudent.id, message: "Akaun anak berjaya didaftarkan!" }), 
      { status: 200, headers: resHeaders }
    );

  } catch (err: unknown) {
    const error = err as Error;
    // Memulangkan ralat teks sebenar dari pangkalan data ke skrin frontend
    return new Response(
      JSON.stringify({ success: false, message: `Ralat Pelayan: ${error.message}` }), 
      { status: 500, headers: resHeaders }
    );
  }
}
