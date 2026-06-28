import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const body = await req.json();
    const payload = body.childData;

    if (!payload?.full_name || !payload?.parent_id) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 🧠 STEP 1: CREATE CHILD "PROFILE" IN PROGRESS TABLE (SAFE WORKAROUND)
    const childProfile = await base44.entities.Progress.create({
      student_id: crypto.randomUUID(),
      full_name: payload.full_name,
      level: 1,
      total_xp: 0,
      streak_days: 0,
    });

    // 🧠 STEP 2: CREATE RELATIONSHIP (THIS IS YOUR REAL LINK SYSTEM)
    await base44.entities.ParentChildRelationship.create({
      parent_id: payload.parent_id,
      child_id: childProfile.student_id,
      relationship: "parent",
      status: "active",
      linked_at: new Date().toISOString(),
    });

    return Response.json({
      success: true,
      child: childProfile,
      credentials: {
        student_id: childProfile.student_id,
      },
    });

  } catch (err) {
    console.error("CREATE CHILD ERROR:", err);

    return Response.json(
      {
        error: err.message || "Internal Server Error",
      },
      { status: 500 }
    );
  }
});