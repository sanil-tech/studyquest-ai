// base44/functions/getStudentMissions/entry.ts
// Returns published missions + the student's progress for each.
// Students can ONLY access published missions. Draft/archived missions are hidden.
// Auth-optional: supports child PIN login via student_id in request body.

import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    // Resolve student_id: prefer body (child PIN), fall back to auth
    let studentId = body.student_id;
    if (!studentId) {
      try {
        const me = await base44.auth.me();
        if (me) studentId = me.id;
      } catch { /* auth optional */ }
    }

    if (!studentId) {
      return Response.json({ success: false, error: "student_id diperlukan." }, { status: 400 });
    }

    // 1. Fetch only PUBLISHED missions (Student Access Rule)
    const missions = await base44.asServiceRole.entities.Mission.filter({
      status: "published",
      is_active: true,
    });

    if (!missions || missions.length === 0) {
      return Response.json({ success: true, missions: [], total: 0 });
    }

    // 2. Fetch all mission steps for these missions
    const missionIds = missions.map((m: any) => m.id);
    const allSteps = await base44.asServiceRole.entities.MissionStep.filter({
      mission_id: { $in: missionIds },
    });

    // 3. Fetch student's progress for these missions
    const progressRecords = await base44.asServiceRole.entities.MissionProgress.filter({
      student_id: studentId,
      mission_id: { $in: missionIds },
    }).catch(() => []);

    // 4. Build a progress lookup map
    const progressByMission: Record<string, any> = {};
    for (const p of progressRecords) {
      progressByMission[p.mission_id] = p;
    }

    // 5. Group steps by mission_id and assemble the response
    const stepsByMission: Record<string, any[]> = {};
    for (const step of allSteps) {
      if (!stepsByMission[step.mission_id]) stepsByMission[step.mission_id] = [];
      stepsByMission[step.mission_id].push(step);
    }

    const resultMissions = missions.map((mission: any) => {
      const steps = (stepsByMission[mission.id] || []).sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
      const progress = progressByMission[mission.id];

      // Determine resolved status (factoring prerequisites)
      let resolvedStatus = "available";
      let prerequisiteMet = true;

      if (mission.prerequisite_mission_id) {
        const prereqProgress = progressByMission[mission.prerequisite_mission_id];
        if (!prereqProgress || (prereqProgress.status !== "completed" && prereqProgress.status !== "mastered")) {
          prerequisiteMet = false;
          resolvedStatus = "locked";
        }
      }

      if (prerequisiteMet && progress) {
        resolvedStatus = progress.status;
      } else if (prerequisiteMet && !progress) {
        resolvedStatus = "available";
      }

      const stepsCompleted = progress?.steps_completed_json
        ? (typeof progress.steps_completed_json === "string"
          ? JSON.parse(progress.steps_completed_json)
          : progress.steps_completed_json)
        : [];

      const requiredSteps = steps.filter((s: any) => s.is_required);
      const completedCount = stepsCompleted.filter((order: number) =>
        requiredSteps.some((s: any) => s.order === order)
      ).length;
      const totalRequired = requiredSteps.length;
      const completionPercentage = totalRequired > 0
        ? Math.round((completedCount / totalRequired) * 100)
        : 0;

      return {
        id: mission.id,
        name: mission.name,
        description: mission.description,
        subject_id: mission.subject_id,
        level_id: mission.level_id,
        mission_type: mission.mission_type,
        sort_order: mission.sort_order,
        icon: mission.icon || "⭐",
        color: mission.color || "#6366f1",
        reward_xp: mission.reward_xp,
        reward_coin: mission.reward_coin,
        prerequisite_mission_id: mission.prerequisite_mission_id,
        steps,
        progress: progress ? {
          status: resolvedStatus,
          current_step_order: progress.current_step_order || 0,
          steps_completed: stepsCompleted,
          xp_earned: progress.xp_earned || 0,
          started_at: progress.started_at,
          completed_at: progress.completed_at,
        } : {
          status: resolvedStatus,
          current_step_order: 0,
          steps_completed: [],
          xp_earned: 0,
        },
        completion_percentage: completionPercentage,
        is_locked: resolvedStatus === "locked",
      };
    });

    // Sort by sort_order
    resultMissions.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));

    return Response.json({
      success: true,
      student_id: studentId,
      missions: resultMissions,
      total: resultMissions.length,
    });
  } catch (error: any) {
    console.error("getStudentMissions error:", error);
    return Response.json({ success: false, error: error.message || "Ralat sistem." }, { status: 500 });
  }
}