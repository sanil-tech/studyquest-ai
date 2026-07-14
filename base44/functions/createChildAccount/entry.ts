import { base44 } from "../../api/base44Client";

// Helper function to generate unique Student ID (Excludes I, O, 0, 1)
function generateStudentId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `SQ-${result}`;
}

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

    // 1. Validasi Input Dasar
    if (!fullName || !pin || !parentId) {
      return new Response(
        JSON.stringify({ success: false, message: "Maklumat tidak lengkap." }), 
        { status: 400, headers: resHeaders }
      );
    }

    const cleanNickname = (nickname || fullName.split(" ")[0]).trim();
    const shortParentId = parentId.substring(0, 6);
    const virtualEmail = `${cleanNickname.toLowerCase()}.${shortParentId}@studyquest.internal`;
    
    // Generate Unique Student ID according to Architecture spec
    const generatedStudentId = generateStudentId(); 

    const dbClient = base44.asServiceRole || base44;

    // 2. Cipta akaun anak (Unified Identity)
    const newStudent = await dbClient.entities.User.create({
      full_name: fullName,
      email: virtualEmail, 
      nickname: cleanNickname,
      app_role: "student",
      student_id: generatedStudentId,      // Diperlukan untuk Child Login flow
      child_login_pin: pin,                 // TODO: Hash with salt if not handled natively by entity
      pin_enabled: true,
      login_method: "pin",
      is_child_account: true,               // Data Protection indicator
      linked_parent_id: parentId,           // Primary parent reference
      status: "active",
      profile_completed: true 
    });

    // 3. Cipta pautan keluarga di Junction Table
    await dbClient.entities.ParentChildRelationship.create({
      parent_id: parentId,
      child_id: newStudent.id,
      relationship: "parent",
      status: "active"
    });

    // 4. Update parent's quick lookup array (Optional but stated in Architecture)
    try {
      const parentUser = await dbClient.entities.User.get(parentId);
      const currentLinks = parentUser?.linked_student_ids || [];
      await dbClient.entities.User.update(parentId, {
        linked_student_ids: [...currentLinks, newStudent.id],
        num_children: (parentUser?.num_children || 0) + 1
      });
    } catch (arrayErr) {
      console.log("Gagal mengemaskini linked_student_ids pada Parent profile.", arrayErr);
    }

    // 5. Cipta Wallet & Progress (Academic Entities Initialization)
    try {
      await dbClient.entities.Wallet.create({ 
        student_id: newStudent.id, 
        balance: 0 
      });
      
      await dbClient.entities.Progress.create({ 
        student_id: newStudent.id, 
        total_xp: 0, 
        level: 1, 
        streak_days: 0, 
        total_study_time: 0 
      });
    } catch (e) {
      console.log("Entiti akademik tambahan gagal dimasukkan.", e);
    }

    // 6. Pulangkan payload lengkap untuk paparan Credentials Summary screen
    return new Response(
      JSON.stringify({ 
        success: true, 
        childId: newStudent.id,
        studentId: generatedStudentId,
        message: "Akaun anak berjaya dicipta!" 
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
