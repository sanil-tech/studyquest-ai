import { base44 } from "../../api/base44Client";

export async function handler(req: Request) {
  const resHeaders = {
    "content-type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };

  // Mengendalikan CORS preflight secara bersih
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: resHeaders });
  }

  try {
    const body = await req.json();
    const fullName = body?.fullName?.trim();
    const nickname = body?.nickname?.trim();
    const pin = body?.pin?.trim();
    const parentId = body?.parentId?.trim();

    // Validasi mandatori input pendaftaran
    if (!fullName || !pin || !parentId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Pendaftaran gagal. Sila pastikan Nama Penuh, PIN Keselamatan, dan ID Ibu Bapa diisi dengan lengkap." 
        }), 
        { status: 400, headers: resHeaders }
      );
    }

    // Memastikan PIN Keselamatan mengandungi 4 hingga 6 digit nombor sahaja
    if (!/^\d{4,6}$/.test(pin)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "PIN Keselamatan mestilah mengandungi 4 hingga 6 digit nombor sahaja." 
        }), 
        { status: 400, headers: resHeaders }
      );
    }

    // Pilih nama panggilan (gunakan perkataan pertama nama jika nama panggilan kosong)
    const cleanNickname = (nickname || fullName.split(" ")[0]).trim();
    
    // PERLINDUNGAN UTAMA: Buang semua simbol dan ruang kosong agar e-mel 100% sah (alphanumeric sahaja)
    let emailSafeNickname = cleanNickname.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    
    // Sandaran kecemasan jika nama panggilan hanya mengandungi simbol sahaja
    if (!emailSafeNickname) {
      emailSafeNickname = "pengembara";
    }

    // Bersihkan ID Ibu bapa daripada simbol berbahaya
    const emailSafeParentId = parentId.replace(/[^a-zA-Z0-9]/g, "").toLowerCase().substring(0, 6);
    
    // JAMINAN UNIK: Tambah suffix rawak 4 aksara untuk menghalang pertembungan e-mel di dalam DB
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    
    // Pembinaan e-mel virtual yang selamat dan mematuhi standard regex RFC 5322
    const virtualEmail = `${emailSafeNickname}.${emailSafeParentId}.${randomSuffix}@studyquest.internal`;

    // Gunakan akses Service Role bagi mengatasi sekatan polisi RLS
    const dbClient = base44.asServiceRole || base44;

    // Cipta profil pelajar baru
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
      throw new Error("Sistem gagal menjana ID profil pelajar baharu di dalam pangkalan data.");
    }

    // Cipta rekod pautan keluarga di antara Ibu Bapa dan Anak
    await dbClient.entities.ParentChildRelationship.create({
      parent_id: parentId,
      child_id: newStudent.id,
      status: "active"
    });

    // Lindungi kegagalan tetapan akademik sekunder agar tidak menghalang pendaftaran utama
    try {
      // Sediakan tabung simpanan anak dengan baki permulaan kosong (RM 0.00)
      await dbClient.entities.Wallet.create({ 
        student_id: newStudent.id, 
        balance: 0 
      });
      
      // Sediakan rekod perkembangan akademik (XP permulaan, Level 1, dan Streak)
      await dbClient.entities.Progress.create({ 
        student_id: newStudent.id, 
        total_xp: 0, 
        level: 1, 
        streak_days: 0, 
        total_study_time: 0 
      });
    } catch (nestedError) {
      console.warn("Makluman: Pendaftaran anak berjaya tetapi entiti akademik tambahan gagal dijana.", nestedError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Pendaftaran berjaya! Akaun pengembaraan anak anda sedia untuk diteroka. 🎉",
        childId: newStudent.id 
      }), 
      { status: 200, headers: resHeaders }
    );

  } catch (err: any) {
    console.error("Ralat kritikal pendaftaran anak:", err);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: "Ralat Pendaftaran: " + (err?.message || "Sila cuba sebentar lagi.") 
      }), 
      { status: 500, headers: resHeaders }
    );
  }
}
