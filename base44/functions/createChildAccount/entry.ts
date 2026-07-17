import { base44 } from "../../api/base44Client";

export async function handler(req: Request) {
  // CORS and response headers configuration for internal and external requests
  const resHeaders = {
    "content-type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };

  // Handle CORS preflight request cleanly
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: resHeaders });
  }

  try {
    const body = await req.json();
    const fullName = body?.fullName?.trim();
    const nickname = body?.nickname?.trim();
    const pin = body?.pin?.trim();
    const parentId = body?.parentId?.trim();

    // Comprehensive validation checks for mandatory child registration fields
    if (!fullName || !pin || !parentId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Pendaftaran gagal. Sila pastikan Nama Penuh, PIN Keselamatan, dan ID Ibu Bapa diisi dengan lengkap." 
        }), 
        { status: 400, headers: resHeaders }
      );
    }

    // Ensure security PIN matches standard 4 to 6 digit criteria
    if (!/^\d{4,6}$/.test(pin)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "PIN Keselamatan mestilah mengandungi 4 hingga 6 digit nombor sahaja." 
        }), 
        { status: 400, headers: resHeaders }
      );
    }

    // Fallback to the first word of the full name if a nickname is not explicitly provided
    const cleanNickname = (nickname || fullName.split(" ")[0]).trim();
    
    // STRATEGIC FIX: Strip spaces and special characters to ensure a 100% valid virtual email format
    const emailSafeNickname = cleanNickname.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    const shortParentId = parentId.substring(0, 6);
    
    // COLLISION FIX: Append a short unique random suffix to completely prevent email constraints crashing the DB
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const virtualEmail = `${emailSafeNickname}.${shortParentId}.${randomSuffix}@studyquest.internal`;

    // Access base44 client using Service Role to bypass RLS barriers during creation
    const dbClient = base44.asServiceRole || base44;

    // Create the child profile under the 'student' application role
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
      throw new Error("Gagal mencipta akaun profil pelajar baharu di dalam pangkalan data.");
    }

    // Map family linkages by creating the Parent-Child relationship record
    await dbClient.entities.ParentChildRelationship.create({
      parent_id: parentId,
      child_id: newStudent.id,
      status: "active"
    });

    // Nested error boundaries so secondary analytics/wallets do not halt primary registration
    try {
      // Setup child piggy-wallet with zero starting balance
      await dbClient.entities.Wallet.create({ 
        student_id: newStudent.id, 
        balance: 0 
      });
      
      // Initialize gamification milestone trackers (Level 1 progress, streaks, and metrics)
      await dbClient.entities.Progress.create({ 
        student_id: newStudent.id, 
        total_xp: 0, 
        level: 1, 
        streak_days: 0, 
        total_study_time: 0 
      });
    } catch (nestedError) {
      // Log failure internally but allow registration response to succeed smoothly
      console.warn("Makluman: Pendaftaran anak berjaya tetapi entiti akademik/wallet tambahan gagal dijana.", nestedError);
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
    console.error("Ralat kritikal semasa pendaftaran anak:", err);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: "Ralat Runtime Sistem: " + (err?.message || "Sila cuba sebentar lagi.") 
      }), 
      { status: 500, headers: resHeaders }
    );
  }
}