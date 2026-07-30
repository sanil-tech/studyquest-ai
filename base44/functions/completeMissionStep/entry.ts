// base44/functions/completeMissionStep/entry.ts
// Marks a single mission step as complete for a student.
// Updates MissionProgress (creates if first step) and awards XP.
// Auth-optional: supports child PIN login via student_id in request body.

import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    let studentId = body.student_id;
    if (!studentId) {
      try {
        const me = await base44.auth.me();
        if (me) studentId = me.id;
      } catch { /* auth optional */ }
    }

    const { mission_id, step_order, xp_override } = body;

    if (!studentId || !mission_id || step_order === undefined) {
      return Response.json({ success: false, error: "student_id, mission_id, dan step_order diperlukan." }, { status: 400 });
    }

    // 1. Verify the mission is published (Student Access Rule)
    const mission = await base44.asServiceRole.entities.Mission.get(mission_id).catch(() => null);
    if (!mission || mission.status !== "published" || !mission.is_active) {
      return Response.json({ success: false, error: "Misi tidak dijumpai atau tidak diterbitkan." }, { status: 404 });
    }

    // 2. Verify the step exists
    const steps = await base44.asServiceRole.entities.MissionStep.filter({
      mission_id,
      order: step_order,
    });
    const step = steps[0];
    if (!step) {
      return Response.json({ success: false, error: "Langkah misi tidak dijumpai." }, { status: 404 });
    }

    // 3. Fetch or create MissionProgress
    const existing = await base44.asServiceRole.entities.MissionProgress.filter({
      student_id: studentId,
      mission_id,
    }).catch(() => []);

    let progress = existing[0];
    const now = new Date().toISOString();

    if (!progress) {
      progress = await base44.asServiceRole.entities.MissionProgress.create({
        student_id: studentId,
        mission_id,
        status: "in_progress",
        current_step_order: step_order,
        steps_completed_json: JSON.stringify([step_order]),
        xp_earned: xp_override ?? step.xp_reward ?? 10,
        started_at: now,
      });
    } else {
      const completedArr = (() => {
        try { return typeof progress.steps_completed_json === "string" ? JSON.parse(progress.steps_completed_json) : (progress.steps_completed_json || []); }
        catch { return []; }
      })();

      if (!completedArr.includes(step_order)) {
        completedArr.push(step_order);
      }

      const addedXp = completedArr.includes(step_order) && progress.steps_completed_json
        ? (xp_override ?? step.xp_reward ?? 10)
        : 0;

      // Determine next step order
      const allSteps = await base44.asServiceRole.entities.MissionStep.filter({ mission_id });
      const sortedSteps = allSteps.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
      const currentIdx = sortedSteps.findIndex((s: any) => s.order === step_order);
      const nextStepOrder = currentIdx >= 0 && currentIdx < sortedSteps.length - 1
        ? sortedSteps[currentIdx + 1].order
        : step_order;

      // Check if all required steps are complete
      const requiredSteps = sortedSteps.filter((s: any) => s.is_required);
      const allRequiredComplete = requiredSteps.every((s: any) => completedArr.includes(s.order));

      const newStatus = allRequiredComplete ? "completed" : "in_progress";
      const missionXpBonus = allRequiredComplete && newStatus !== progress.status
        ? (mission.reward_xp || 0)
        : 0;

      await base44.asServiceRole.entities.MissionProgress.update(progress.id, {
        status: newStatus,
        current_step_order: nextStepOrder,
        steps_completed_json: JSON.stringify(completedArr),
        xp_earned: (progress.xp_earned || 0) + addedXp + missionXpBonus,
        completed_at: allRequiredComplete ? now : progress.completed_at,
      });

      progress.status = newStatus;
      progress.xp_earned = (progress.xp_earned || 0) + addedXp + missionXpBonus;
    }

    return Response.json({
      success: true,
      mission_id,
      step_order,
      step_xp: step.xp_reward ?? 10,
      progress_status: progress.status,
      xp_earned: progress.xp_earned || 0,
      mission_completed: progress.status === "completed",
    });
  } catch (error: any) {
    console.error("completeMissionStep error:", error);
    return Response.json({ success: false, error: error.message || "Ralat sistem." }, { status: 500 });
  }
}