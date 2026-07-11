import { base44 } from "../../api/base44Client";

// Mendefinisikan struktur data input untuk mengelakkan ralat linter
interface CreateChildInput {
  fullName: string;
  nickname: string;
  pin: string;
  parentId: string;
}

export async function handler(req: Request) {
  try {
    const body: CreateChildInput = await req.json();
    const { fullName, nickname, pin, parentId } = body;

    // Pengesahan awal data wajib
    if (!fullName || !pin || !parentId) {
      return new Response(
        JSON.stringify({ success: false, message: "Nama penuh dan PIN wajib diisi." }), 
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    const cleanNickname = (nickname || fullName.split(" ")[0]).trim();
    
    // Membina alamat emel maya dalaman yang unik bagi memintas pengesahan emel standard
    const shortParentId = parentId.substring(0, 6);
    const virtualEmail = `${cleanNickname.toLowerCase()}.${shortParentId}@studyquest.internal`;

    // 🎯 PENYELESAIAN: Kita gunakan .entities.User.create secara terus (Bukan .auth.createUser)
    const newStudent = await base44.asServiceRole.entities.User.create({
      full_name: fullName,
      email: virtualEmail, 
      nickname: cleanNickname,
      app_role: "student",
      child_login_pin: pin,
      status: "active",
      profile_completed: true // Pintas terus skrin persediaan profil bagi memudahkan anak
    });

    // Cipta hubungan pautan rasmi antara anak dengan ibu bapa
    await base44.asServiceRole.entities.ParentChildRelationship.create({
      parent_id: parentId,
      child_id: newStudent.id,
      status: "active"
    });

    // Cipta akaun dompet (Wallet) permulaan murid untuk ganjaran kuiz
    await base44.asServiceRole.entities.Wallet.create({ 
      student_id: newStudent.id, 
      balance: 0 
    });

    // Cipta rekod kemajuan akademik (Progress) permulaan murid
    await base44.asServiceRole.entities.Progress.create({ 
      student_id: newStudent.id, 
      total_xp: 0, 
      level: 1, 
      streak_days: 0, 
      total_study_time: 0 
    });

    return new Response(
      JSON.stringify({ success: true, message: "Akaun ekspres anak berjaya dicipta!" }), 
      { status: 200, headers: { "content-type": "application/json" } }
    );

  } catch (err: unknown) {
    // Menguruskan ralat tegar mengikut standard deno lint terketat (Tiada penggunaan 'any')
    const error = err as Error;
    return new Response(
      JSON.stringify({ success: false, message: error.message || "Ralat pangkalan data berlaku." }), 
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}
